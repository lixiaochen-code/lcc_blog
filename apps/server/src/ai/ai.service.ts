import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { APP_CONFIG } from '../config/config.module'
import type { AppConfig } from '../config/app.config'
import { JsonStoreService } from '../store/json-store.service'
import { KbService } from '../kb/kb.service'
import { KbSearchService } from '../kb/kb-search.service'
import { WebSearchService } from '../web/web-search.service'
import { WebFetchService } from '../web/web-fetch.service'
import { WebIngestService } from '../web/web-ingest.service'
import { AuditService } from '../audit/audit.service'
import { SYSTEM_PROMPT } from './prompts'
import type { AuthContext } from '../common/auth-context'
import type { ChatRequest, ChatResponse, Draft } from './ai.types'
import type { ConversationMessage } from '../store/store.types'

const MAX_TOOL_ROUNDS = 4
const KEEP_RECENT_TURNS = 8
const MAX_CONTENT_CHARS = 4000

const truncate = (text: string, limit = MAX_CONTENT_CHARS): string => {
  if (text.length <= limit) return text
  return `${text.slice(0, limit)}…（已截断 ${text.length - limit} 字）`
}

const DRAFT_RE =
  /\[DRAFT\s+op="(create|update|delete|organize)"(?:\s+path="([^"]+)")?\]\s*(?:```(?:markdown|md|json)?\n([\s\S]*?)```)?/i

@Injectable()
export class AiService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly store: JsonStoreService,
    private readonly kb: KbService,
    private readonly kbSearch: KbSearchService,
    private readonly webSearch: WebSearchService,
    private readonly webFetch: WebFetchService,
    private readonly webIngest: WebIngestService,
    private readonly audit: AuditService
  ) {}

  // --- public ---

  async chat(req: ChatRequest, ctx: AuthContext): Promise<ChatResponse> {
    const { message, currentPath, useWebSearch = false } = req
    if (!message?.trim()) throw new BadRequestException('message 不能为空')

    const conversationId = req.conversationId || this.newId()
    const history = this.loadHistory(conversationId, ctx.user.id)

    const articleList = this.kb.flattenTree().map(a => ({ path: a.path, title: a.title }))
    const currentArticle = currentPath ? this.safeRead(currentPath) : null
    const canWeb = useWebSearch && ctx.permissions.includes('ai:web')
    const tools = this.buildTools(canWeb)
    const baseMessages = this.buildInitialMessages({
      message,
      history,
      currentArticle,
      articleList,
      useWebSearch: canWeb,
    })

    if (!this.config.openai.apiKey) {
      const content = this.localFallback(message, articleList, currentArticle)
      this.persistTurn(conversationId, ctx.user.id, message, content)
      return {
        conversationId,
        content,
        reasoning: ['未配置 OPENAI_API_KEY'],
        draft: null,
        sources: [],
      }
    }

    const { messages, finalDirect, trace } = await this.researchLoop(baseMessages, tools, canWeb)
    let content = finalDirect
    if (!content) {
      content = await this.streamFinalAnswer(messages)
    }

    const draft = this.extractDraft(content)
    const reasoning = this.buildReasoning(articleList, currentArticle, trace, draft, canWeb)
    const sources = this.collectSources(trace)

    this.persistTurn(conversationId, ctx.user.id, message, content)
    this.audit.log(ctx.user.id, 'ai.chat', { conversationId })

    return { conversationId, content, reasoning, draft, sources }
  }

  async applyDraft(draft: Draft, ctx: AuthContext) {
    if (draft.operation === 'create' || draft.operation === 'update') {
      const article = this.kb.writeArticle(draft.path, draft.content)
      this.audit.log(ctx.user.id, 'ai.apply', { op: draft.operation, path: draft.path })
      return article
    }
    if (draft.operation === 'delete') {
      const result = this.kb.deleteArticle(draft.path)
      this.audit.log(ctx.user.id, 'ai.apply', { op: 'delete', path: draft.path })
      return result
    }
    if (draft.operation === 'organize' && draft.actions?.length) {
      const results = draft.actions.map(a => this.kb.moveArticle(a.from, a.to, a.title))
      this.audit.log(ctx.user.id, 'ai.apply', { op: 'organize', count: draft.actions.length })
      return { items: results }
    }
    throw new BadRequestException('无效的草稿操作')
  }

  listConversations(ctx: AuthContext) {
    const data = this.store.read()
    return data.conversations
      .filter(c => c.userId === ctx.user.id)
      .map(c => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  // --- private: tool dispatch ---

  private async dispatchTool(
    name: string,
    args: Record<string, any>,
    canWeb: boolean
  ): Promise<unknown> {
    if (name === 'search_kb') {
      return { items: this.kbSearch.searchByQuery(String(args.query || ''), args.limit ?? 8) }
    }
    if (name === 'read_article') {
      try {
        const a = this.kb.readArticle(String(args.path || ''))
        return {
          path: a.path,
          title: a.title,
          content: truncate(a.content, 8000),
          updatedAt: a.updatedAt,
        }
      } catch (e: any) {
        return { path: args.path, error: e.message || '读取失败' }
      }
    }
    if (name === 'web_search') {
      if (!canWeb) return { error: '用户未开启网络检索' }
      return this.webSearch.search(String(args.query || ''))
    }
    if (name === 'web_fetch') {
      if (!canWeb) return { error: '用户未开启网络检索' }
      return this.webFetch.fetch(String(args.url || ''))
    }
    if (name === 'web_ingest') {
      if (!canWeb) return { error: '用户未开启网络检索' }
      return this.webIngest.ingest(String(args.url || ''))
    }
    return { error: `未知工具：${name}` }
  }

  // --- private: research loop ---

  private async researchLoop(
    baseMessages: any[],
    tools: any[],
    canWeb: boolean
  ): Promise<{ messages: any[]; finalDirect: string; trace: any[] }> {
    const messages = [...baseMessages]
    const trace: any[] = []

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await this.fetchCompletion({
        model: this.config.openai.model,
        temperature: 0.2,
        messages,
        tools: tools.length ? tools : undefined,
        tool_choice: tools.length ? 'auto' : undefined,
      })
      const data = (await response.json()) as Record<string, any>
      const choice = data.choices?.[0]?.message
      if (!choice) throw new Error('AI 服务返回为空')

      const toolCalls: any[] = choice.tool_calls || []
      if (!toolCalls.length) {
        return { messages, finalDirect: choice.content || '', trace }
      }

      messages.push({ role: 'assistant', content: choice.content || '', tool_calls: toolCalls })

      for (const call of toolCalls) {
        const args = this.parseArgs(call.function?.arguments)
        const result = await this.dispatchTool(call.function?.name, args, canWeb).catch(
          (e: any) => ({
            error: e.message || '工具调用失败',
          })
        )
        trace.push({ name: call.function?.name, args: call.function?.arguments, result })
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(this.truncateResult(result)),
        })
      }
    }

    return { messages, finalDirect: '', trace }
  }

  // --- private: streaming final answer ---

  private async streamFinalAnswer(messages: any[]): Promise<string> {
    const response = await this.fetchCompletion({
      model: this.config.openai.model,
      temperature: 0.3,
      stream: true,
      messages,
    })
    if (!response.body) throw new Error('AI 流式服务没有返回内容')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let content = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const packets = buffer.split('\n\n')
        buffer = packets.pop() || ''
        for (const packet of packets) {
          for (const line of packet.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const payload = trimmed.slice(5).trim()
            if (!payload || payload === '[DONE]') continue
            try {
              const chunk = JSON.parse(payload)
              const delta = chunk.choices?.[0]?.delta?.content || ''
              if (delta) content += delta
            } catch {
              /* skip malformed */
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
    return content
  }

  // --- private: helpers ---

  private buildTools(canWeb: boolean): any[] {
    const tools: any[] = [
      {
        type: 'function',
        function: {
          name: 'search_kb',
          description: '在本地知识库中按关键词搜索文章（匹配路径与标题）。',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: '查询词' },
              limit: { type: 'integer', minimum: 1, maximum: 20, default: 8 },
            },
            required: ['query'],
            additionalProperties: false,
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'read_article',
          description: '按相对路径读取知识库内某篇文章的全文。',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '相对 docs/knowledge 的 .md 路径' },
            },
            required: ['path'],
            additionalProperties: false,
          },
        },
      },
    ]
    if (canWeb) {
      tools.push(
        {
          type: 'function',
          function: {
            name: 'web_search',
            description: '本地知识库不足以回答时，搜索互联网。',
            parameters: {
              type: 'object',
              properties: { query: { type: 'string', description: '提炼后的搜索词' } },
              required: ['query'],
              additionalProperties: false,
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'web_fetch',
            description: '抓取指定 URL 的网页正文。',
            parameters: {
              type: 'object',
              properties: { url: { type: 'string', description: '要抓取的网页 URL' } },
              required: ['url'],
              additionalProperties: false,
            },
          },
        }
      )
    }
    return tools
  }

  private buildInitialMessages(opts: {
    message: string
    history: ConversationMessage[]
    currentArticle: { path: string; title: string; content: string } | null
    articleList: { path: string; title: string }[]
    useWebSearch: boolean
  }): any[] {
    const { older, recent } = this.compactHistory(opts.history)
    const directory = opts.articleList
      .slice(0, 80)
      .map(a => `- ${a.path}${a.title ? ` — ${a.title}` : ''}`)
      .join('\n')

    return [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'system',
        content: `知识库共有 ${opts.articleList.length} 篇文章。目录（截断 80 条）：\n${directory}`,
      },
      opts.currentArticle
        ? {
            role: 'system',
            content: `当前用户在阅读：${opts.currentArticle.path}\n标题：${opts.currentArticle.title}\n正文：\n${truncate(opts.currentArticle.content, 6000)}`,
          }
        : null,
      {
        role: 'system',
        content: opts.useWebSearch
          ? '用户开启了网络检索权限。'
          : '用户未开启网络检索：不要调用 web_search / web_fetch 工具。',
      },
      older ? { role: 'system', content: older } : null,
      ...recent.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: opts.message },
    ].filter(Boolean)
  }

  private compactHistory(history: ConversationMessage[]): {
    older: string | null
    recent: ConversationMessage[]
  } {
    if (!history.length || history.length <= KEEP_RECENT_TURNS) {
      return { older: null, recent: history }
    }
    const older = history.slice(0, -KEEP_RECENT_TURNS)
    const recent = history.slice(-KEEP_RECENT_TURNS)
    const summary = older
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(
        m =>
          `- ${m.role === 'assistant' ? '助手' : '用户'}：${truncate(m.content, 280).replace(/\s+/g, ' ')}`
      )
      .join('\n')
    return { older: `早期对话摘要：\n${summary}`, recent }
  }

  private async fetchCompletion(body: Record<string, any>): Promise<Response> {
    const url = `${this.config.openai.baseUrl.replace(/\/$/, '')}/chat/completions`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.openai.apiKey}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`AI 服务请求失败：${res.status}${detail ? ` ${detail.slice(0, 200)}` : ''}`)
    }
    return res
  }

  private extractDraft(content: string): Draft | null {
    const match = content.match(DRAFT_RE)
    if (!match) return null
    const operation = match[1] as Draft['operation']
    const path = match[2] || ''
    const body = (match[3] || '').trim()

    if (operation === 'delete') return path ? { operation, path, content: '' } : null
    if (operation === 'organize') {
      let actions: Draft['actions'] = []
      try {
        const parsed = JSON.parse(body || '{}')
        actions = (Array.isArray(parsed.actions) ? parsed.actions : [])
          .filter((a: any) => a?.type === 'move' && a.from && a.to)
          .map((a: any) => ({
            type: 'move' as const,
            from: String(a.from),
            to: String(a.to),
            title: a.title ? String(a.title) : undefined,
          }))
      } catch {
        /* ignore */
      }
      return { operation: 'organize', path: '知识库目录', content: body, actions }
    }
    if (!path || !body) return null
    return { operation, path, content: body }
  }

  private buildReasoning(
    articleList: { path: string }[],
    currentArticle: { path: string } | null,
    trace: any[],
    draft: Draft | null,
    canWeb: boolean
  ): string[] {
    const steps: string[] = []
    steps.push(`加载知识库目录：${articleList.length} 篇文章`)
    steps.push(currentArticle ? `已读取当前文章：${currentArticle.path}` : '未绑定当前文章')
    steps.push(canWeb ? '允许调用网络工具' : '未授权网络工具')
    for (const t of trace) {
      const summary = this.summarizeTool(t.name, t.result)
      steps.push(`${t.name} → ${summary}`)
    }
    if (draft) {
      steps.push(
        draft.operation === 'organize'
          ? `生成目录整理计划：${draft.actions?.length || 0} 项`
          : `生成 ${draft.operation} 草稿：${draft.path}`
      )
    }
    return steps
  }

  private summarizeTool(name: string, result: any): string {
    if (!result) return '空结果'
    if (result.error) return result.error
    if (name === 'search_kb') return `${result.items?.length || 0} 条候选`
    if (name === 'read_article') return result.path ? `已读取 ${result.path}` : '未找到'
    if (name === 'web_search') return `${result.results?.length || 0} 条外部参考`
    if (name === 'web_fetch') return result.title ? `已抓取：${result.title}` : '已抓取'
    if (name === 'web_ingest') return result.path ? `已落盘：${result.path}` : '完成'
    return '完成'
  }

  private collectSources(trace: any[]): { title: string; url: string; snippet: string }[] {
    const sources: { title: string; url: string; snippet: string }[] = []
    for (const t of trace) {
      if (t.name === 'web_search' && t.result?.results) {
        for (const r of t.result.results.slice(0, 3)) {
          sources.push({ title: r.title, url: r.url, snippet: r.snippet || '' })
        }
      }
    }
    return sources
  }

  private truncateResult(result: unknown): unknown {
    if (!result || typeof result !== 'object') return result
    const obj = result as Record<string, any>
    if (obj.content && typeof obj.content === 'string') {
      return { ...obj, content: truncate(obj.content, 4000) }
    }
    return result
  }

  private parseArgs(raw: string | undefined): Record<string, any> {
    try {
      return JSON.parse(raw || '{}')
    } catch {
      return {}
    }
  }

  private safeRead(path: string): { path: string; title: string; content: string } | null {
    try {
      return this.kb.readArticle(path)
    } catch {
      return null
    }
  }

  private localFallback(
    message: string,
    articleList: { path: string; title: string }[],
    currentArticle: { path: string } | null
  ): string {
    const hits = this.kbSearch.searchByQuery(message, 5)
    const lines = [
      '当前没有配置 OPENAI_API_KEY，AI 走本地兜底回答。',
      '',
      `知识库共 ${articleList.length} 篇文章；当前${currentArticle ? `阅读：${currentArticle.path}` : '未选择文章'}。`,
    ]
    if (hits.length) {
      lines.push('', '可能相关的文章：', ...hits.map(h => `- ${h.path} — ${h.title}`))
    }
    lines.push('', '配置 .env.kb 中的 OPENAI_API_KEY 后，AI 会执行工具调用、检索与起草。')
    return lines.join('\n')
  }

  // --- private: persistence ---

  private loadHistory(conversationId: string, userId: string): ConversationMessage[] {
    const data = this.store.read()
    const conv = data.conversations.find(c => c.id === conversationId && c.userId === userId)
    return conv?.messages || []
  }

  private persistTurn(
    conversationId: string,
    userId: string,
    userMsg: string,
    assistantMsg: string
  ): void {
    const now = new Date().toISOString()
    this.store.mutate(data => {
      let conv = data.conversations.find(c => c.id === conversationId)
      if (!conv) {
        conv = {
          id: conversationId,
          userId,
          title: userMsg.slice(0, 50),
          messages: [],
          createdAt: now,
          updatedAt: now,
        }
        data.conversations.push(conv)
      }
      conv.messages.push({ role: 'user', content: userMsg, createdAt: now })
      conv.messages.push({ role: 'assistant', content: assistantMsg, createdAt: now })
      conv.updatedAt = now
      if (data.conversations.length > 50) {
        data.conversations = data.conversations.slice(-50)
      }
    })
  }

  private newId(): string {
    return `conv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  }
}
