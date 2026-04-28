import { flattenTree, readArticle } from './markdown.js'
import { config } from './config.js'
import { webSearch } from './mcp.js'

const systemPrompt = `你是一个知识库编辑助手。你只能生成草稿，不能绕过用户确认直接写入文件。
当用户要求新增、修改、删除或整理目录时，返回清晰的建议和 Markdown 草稿。`

const inferDraft = (message, currentArticle) => {
  const wantsDelete = /删除|移除|delete/i.test(message)
  const wantsCreate = /新增|创建|新建|create/i.test(message)
  const wantsUpdate = /修改|更新|改写|补充|优化|update/i.test(message)
  if (!wantsDelete && !wantsCreate && !wantsUpdate) return null

  const pathMatch = message.match(/([A-Za-z0-9_\-/\u4e00-\u9fa5]+\.md)/)
  const path = pathMatch?.[1] || currentArticle?.path || '未命名文章.md'
  if (wantsDelete) return { operation: 'delete', path, content: '' }

  const title = path.split('/').pop().replace(/\.md$/, '')
  return {
    operation: wantsCreate ? 'create' : 'update',
    path,
    content:
      currentArticle?.content ||
      `# ${title}\n\n> 这是 AI 生成的知识库草稿，请在确认后写入。\n\n## 背景\n\n${message}\n\n## 内容\n\n请继续在对话中补充细节，确认后再写入 Markdown。\n`,
  }
}

const buildReasoningSummary = ({ currentArticle, articleList, search, draft }) => {
  const steps = []
  steps.push(
    currentArticle ? `已读取当前文章：${currentArticle.path}` : '未绑定当前文章，仅根据用户输入处理'
  )
  steps.push(`已加载知识库目录上下文：${articleList.length} 篇文章`)
  if (search) {
    steps.push(
      search.error
        ? `网络检索未成功：${search.error}`
        : `已执行网络检索，获得 ${search.results?.length || 0} 条参考`
    )
  }
  if (draft) {
    steps.push(`识别为 ${draft.operation} 操作，目标路径：${draft.path}`)
    steps.push('仅生成草稿，等待用户确认后再写入 Markdown')
  } else {
    steps.push('本轮未识别到需要写入知识库的草稿操作')
  }
  return steps
}

const buildMessages = ({ message, history, currentArticle, articleList, search }) =>
  [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: `知识库文章列表：${articleList.map(item => item.path).join(', ')}` },
    search
      ? {
          role: 'system',
          content: `网络检索参考：\n${JSON.stringify(search.results || [], null, 2)}`,
        }
      : null,
    currentArticle
      ? { role: 'system', content: `当前文章：\n${currentArticle.content.slice(0, 12000)}` }
      : null,
    ...history.slice(-12),
    { role: 'user', content: message },
  ].filter(Boolean)

export async function createAiContext({
  message,
  history = [],
  currentPath,
  useWebSearch = false,
  onTool,
}) {
  onTool?.({ name: '读取知识库上下文', status: 'running', detail: currentPath || '未选择文章' })
  const articleList = flattenTree().slice(0, 30)
  const currentArticle = currentPath ? readArticle(currentPath) : null
  onTool?.({ name: '读取知识库上下文', status: 'done', detail: `${articleList.length} 篇文章` })

  onTool?.({ name: '识别知识库操作', status: 'running', detail: '判断是否需要生成草稿' })
  const draft = inferDraft(message, currentArticle)
  onTool?.({
    name: '识别知识库操作',
    status: 'done',
    detail: draft ? `${draft.operation}: ${draft.path}` : '普通问答',
  })

  let search = null
  if (useWebSearch) {
    onTool?.({ name: '网络检索', status: 'running', detail: message })
    search = await webSearch(message).catch(error => ({
      query: message,
      source: 'search-error',
      results: [],
      error: error.message,
    }))
    onTool?.({
      name: '网络检索',
      status: search.error ? 'error' : 'done',
      detail: search.error || `${search.results?.length || 0} 条参考`,
    })
  }

  const reasoning = buildReasoningSummary({ currentArticle, articleList, search, draft })
  const messages = buildMessages({ message, history, currentArticle, articleList, search })
  return { articleList, currentArticle, draft, search, reasoning, messages }
}

export async function createAiReply(payload) {
  const { articleList, draft, search, reasoning, messages } = await createAiContext(payload)

  if (!config.openai.apiKey) {
    return {
      content: `已收到。我会先以草稿方式处理，不会直接写入文件。\n\n当前知识库共有 ${articleList.length} 篇文章。${search ? `\n\n网络检索已启用，找到 ${search.results?.length || 0} 条参考。${search.error ? `检索失败原因：${search.error}` : ''}` : ''}${draft ? `\n\n已生成 ${draft.operation} 草稿：${draft.path}` : ''}`,
      reasoning,
      draft,
      sources: search?.results || [],
    }
  }

  const response = await fetch(`${config.openai.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: config.openai.model,
      temperature: 0.2,
      messages,
    }),
  })

  if (!response.ok) throw new Error(`AI 服务请求失败：${response.status}`)
  const data = await response.json()
  return {
    content: data.choices?.[0]?.message?.content || 'AI 没有返回内容。',
    reasoning,
    draft,
    sources: search?.results || [],
  }
}

export async function streamAiReply(payload, handlers) {
  const context = await createAiContext({ ...payload, onTool: handlers.onTool })
  handlers.onReasoning?.(context.reasoning)

  if (!config.openai.apiKey) {
    const content = `已收到。我会先以草稿方式处理，不会直接写入文件。\n\n当前知识库共有 ${context.articleList.length} 篇文章。`
    handlers.onDelta?.(content)
    handlers.onDone?.({
      content,
      reasoning: context.reasoning,
      draft: context.draft,
      sources: context.search?.results || [],
    })
    return
  }

  handlers.onTool?.({ name: '调用模型', status: 'running', detail: config.openai.model })
  const response = await fetch(`${config.openai.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: config.openai.model,
      temperature: 0.2,
      stream: true,
      messages: context.messages,
    }),
  })

  if (!response.ok || !response.body) throw new Error(`AI 流式服务请求失败：${response.status}`)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let content = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const packets = buffer.split('\n\n')
    buffer = packets.pop() || ''

    for (const packet of packets) {
      const lines = packet
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trim())
      for (const line of lines) {
        if (!line || line === '[DONE]') continue
        const chunk = JSON.parse(line)
        const delta = chunk.choices?.[0]?.delta?.content || ''
        if (!delta) continue
        content += delta
        handlers.onDelta?.(delta)
      }
    }
  }

  handlers.onTool?.({ name: '调用模型', status: 'done', detail: '流式响应完成' })
  handlers.onDone?.({
    content,
    reasoning: context.reasoning,
    draft: context.draft,
    sources: context.search?.results || [],
  })
}
