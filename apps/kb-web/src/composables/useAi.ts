import { ref } from 'vue'
import { api, getToken, type ChatMessage, type Draft, type ToolStep } from '../api'
import { renderMarkdown } from '../markdown'

const messages = ref<ChatMessage[]>([])
const prompt = ref('')
const sending = ref(false)
const applyingDraft = ref(false)
const conversationId = ref('')
const useWebSearch = ref(false)
/**
 * Per-message "decide-and-write" toggle. Defaults to ON (Khoj-style:
 * the model just decides and acts). Backend caps this with the user's
 * `ai:auto_apply` permission — users without the perm can't actually
 * enable it even if the UI says so.
 */
const autoApply = ref(true)
const aiOpen = ref(false)

let activeController: AbortController | null = null

const DRAFT_MARKER_RE =
  /\[DRAFT\s+op="(?:create|update|delete|organize)"(?:\s+path="[^"]+")?\]\s*(?:```(?:markdown|md|json)?\n[\s\S]*?```)?/i

export function displayContent(message: ChatMessage): string {
  return renderMarkdown((message.content || '').replace(DRAFT_MARKER_RE, '').trim())
}

const draftOperationLabels: Record<Draft['operation'], string> = {
  create: '新增文章',
  update: '更新文章',
  delete: '删除文章',
  organize: '整理目录',
}

export function draftOperationLabel(operation: Draft['operation']): string {
  return draftOperationLabels[operation]
}

export function draftTargetLabel(draft: Draft): string {
  if (draft.operation === 'organize') {
    const count = draft.actions?.length || 0
    return count ? `知识库目录 · ${count} 项调整` : '知识库目录'
  }
  return draft.path
}

export function draftActionLabel(draft: Draft): string {
  if (draft.operation === 'organize') return '确认整理'
  if (draft.operation === 'create') return '确认新增'
  if (draft.operation === 'delete') return '确认删除'
  return '确认更新'
}

export function canApplyDraft(draft: Draft): boolean {
  return draft.operation !== 'organize' || Boolean(draft.actions?.length)
}

function draftConfirmMessage(draft: Draft): string {
  if (draft.operation === 'organize') {
    const count = draft.actions?.length || 0
    return `确认整理知识库目录？\n将按草稿移动 ${count} 篇文章，并刷新左侧目录。`
  }
  if (draft.operation === 'delete') return `确认删除文章：${draft.path}？`
  if (draft.operation === 'create') return `确认新增文章：${draft.path}？`
  return `确认把这份草稿更新到文章：${draft.path}？`
}

function upsertToolStep(message: ChatMessage, step: ToolStep): void {
  const steps = message.toolCalls || []
  const index = steps.findIndex(item => item.name === step.name)
  if (index >= 0) steps[index] = step
  else steps.push(step)
  message.toolCalls = [...steps]
}

async function readAiStream(response: Response, assistantMessage: ChatMessage): Promise<void> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const packets = buffer.split('\n\n')
    buffer = packets.pop() || ''

    for (const packet of packets) {
      const event = packet.match(/^event:\s*(.+)$/m)?.[1]?.trim()
      const dataLine = packet.match(/^data:\s*(.+)$/m)?.[1]
      if (!event || !dataLine) continue
      const data = JSON.parse(dataLine)

      if (event === 'meta') {
        conversationId.value = data.conversationId
      } else if (event === 'tool') {
        upsertToolStep(assistantMessage, data)
      } else if (event === 'reasoning') {
        assistantMessage.reasoning = data.reasoning
      } else if (event === 'delta') {
        assistantMessage.content += data.delta
      } else if (event === 'done') {
        conversationId.value = data.conversationId
        assistantMessage.content = data.content || assistantMessage.content
        assistantMessage.reasoning = data.reasoning
        assistantMessage.draft = data.draft
        assistantMessage.sources = data.sources
        assistantMessage.streaming = false
      } else if (event === 'error') {
        upsertToolStep(assistantMessage, {
          name: '流式响应',
          status: 'error',
          detail: data.message,
        })
        assistantMessage.content ||= `请求失败：${data.message}`
      }
    }
  }
}

async function sendMessage(currentPath: string): Promise<void> {
  if (!prompt.value.trim() || sending.value) return
  const content = prompt.value.trim()
  prompt.value = ''
  const history = messages.value
    .filter(message => message.content)
    .map(message => ({ role: message.role, content: message.content }))

  messages.value.push({ role: 'user', content })
  const assistantMessage: ChatMessage = {
    role: 'assistant',
    content: '',
    streaming: true,
    toolCalls: [{ name: '准备请求', status: 'running', detail: '建立流式连接' }],
  }
  messages.value.push(assistantMessage)
  sending.value = true
  activeController = new AbortController()

  try {
    const response = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getToken() ? `Bearer ${getToken()}` : '',
      },
      body: JSON.stringify({
        message: content,
        currentPath,
        conversationId: conversationId.value,
        useWebSearch: useWebSearch.value,
        autoApply: autoApply.value,
        history,
      }),
      signal: activeController.signal,
    })
    if (!response.ok || !response.body) throw new Error('AI 流式请求失败')
    await readAiStream(response, assistantMessage)
  } catch (err) {
    if ((err as Error)?.name !== 'AbortError') {
      assistantMessage.content ||= `请求失败：${(err as Error).message}`
    }
  } finally {
    assistantMessage.streaming = false
    sending.value = false
    activeController = null
  }
}

function stopGenerating(): void {
  activeController?.abort()
}

async function applyDraft(
  draft: Draft,
  hooks: {
    refreshTree: () => Promise<void>
    loadArticle: (path: string) => Promise<void>
    clearActiveArticle: () => void
    activePath: { value: string }
  }
): Promise<void> {
  const ok = window.confirm(draftConfirmMessage(draft))
  if (!ok) return
  applyingDraft.value = true
  try {
    const result = await api.applyDraft(draft)
    await hooks.refreshTree()

    if (draft.operation === 'organize') {
      const movedActive = draft.actions?.find(action => action.from === hooks.activePath.value)
      if (movedActive) await hooks.loadArticle(movedActive.to)
      return
    }

    if (draft.operation === 'delete') {
      if (hooks.activePath.value === draft.path) hooks.clearActiveArticle()
      return
    }

    if ('content' in result) await hooks.loadArticle(result.path)
  } finally {
    applyingDraft.value = false
  }
}

function resetAi(): void {
  messages.value = []
  prompt.value = ''
  aiOpen.value = false
  conversationId.value = ''
  activeController?.abort()
  activeController = null
}

export function useAi() {
  return {
    messages,
    prompt,
    sending,
    applyingDraft,
    conversationId,
    useWebSearch,
    autoApply,
    aiOpen,
    sendMessage,
    stopGenerating,
    applyDraft,
    resetAi,
  }
}
