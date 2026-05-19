import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import type { Response } from 'express'
import { APP_CONFIG } from '../config/config.module'
import type { AppConfig } from '../config/app.config'
import { JsonStoreService } from '../store/json-store.service'
import { KbService } from '../kb/kb.service'
import { KbSearchService } from '../kb/kb-search.service'
import { AuditService } from '../audit/audit.service'
import { SYSTEM_PROMPT } from './prompts'
import type { AuthContext } from '../common/auth-context'
import type { ChatRequest, ChatResponse, Draft, ToolTraceEntry } from './ai.types'
import type { ConversationMessage } from '../store/store.types'
import {
  AI_PROVIDER,
  type AiProvider,
  type ProviderChatMessage,
} from './providers/provider.interface'
import { ToolRegistry } from './tools/tool-registry'
import type { ToolContext } from './tools/tool.interface'

const MAX_TOOL_ROUNDS = 6
const KEEP_RECENT_TURNS = 8
const MAX_CONTENT_CHARS = 4000

const truncate = (text: string, limit = MAX_CONTENT_CHARS): string => {
  if (text.length <= limit) return text
  return `${text.slice(0, limit)}…（已截断 ${text.length - limit} 字）`
}

const DRAFT_RE =
  /\[DRAFT\s+op="(create|update|delete|organize)"(?:\s+path="([^"]+)")?\]\s*(?:```(?:markdown|md|json)?\n([\s\S]*?)```)?/i

interface InitialMessageInput {
  message: string
  history: ConversationMessage[]
  currentArticle: { path: string; title: string; content: string } | null
  articleList: { path: string; title: string }[]
  useWebSearch: boolean
}

/**
 * Thin orchestrator. Delegates LLM I/O to `AI_PROVIDER` and tool dispatch
 * to `ToolRegistry`. Owns: conversation persistence, history compaction,
 * draft extraction, audit logging, SSE event emission.
 */
@Injectable()
export class AiService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
    private readonly store: JsonStoreService,
    private readonly kb: KbService,
    private readonly kbSearch: KbSearchService,
    private readonly audit: AuditService,
    private readonly registry: ToolRegistry
  ) {}

  // --- public: non-stream (kept for back-compat; UI uses chatStream) ---

  /** @deprecated Frontend uses `chatStream`. Keep until external scripts migrate. */
  async chat(req: ChatRequest, ctx: AuthContext): Promise<ChatResponse> {
    const { message, currentPath, useWebSearch = false } = req
    if (!message?.trim()) throw new BadRequestException('message 不能为空')

    const conversationId = req.conversationId || this.newId()
    const toolCtx = this.buildToolContext(ctx, useWebSearch, req.autoApply)
    const baseMessages = this.prepareBaseMessages({
      message,
      history: this.loadHistory(conversationId, ctx.user.id),
      currentArticle: currentPath ? this.safeRead(currentPath) : null,
      articleList: this.kb.flattenTree().map(a => ({ path: a.path, title: a.title })),
      useWebSearch: toolCtx.canWeb,
    })

    if (!this.config.openai.apiKey) {
      const content = this.localFallback(
        message,
        baseMessages.articleList,
        baseMessages.currentArticle
      )
      this.persistTurn(conversationId, ctx.user.id, message, content)
      return {
        conversationId,
        content,
        reasoning: ['未配置 OPENAI_API_KEY'],
        draft: null,
        sources: [],
      }
    }

    const { messages, finalDirect, trace } = await this.researchLoop(baseMessages.messages, toolCtx)

    let content = finalDirect
    if (!content) {
      content = await this.collectStream(messages)
    }

    const draft = toolCtx.draftSink.value ?? this.extractDraft(content)
    const reasoning = this.buildReasoning(
      baseMessages.articleList,
      baseMessages.currentArticle,
      trace,
      draft,
      toolCtx.canWeb,
      toolCtx.canAutoApply
    )
    const sources = this.collectSources(trace)

    this.persistTurn(conversationId, ctx.user.id, message, content)
    this.audit.log(ctx.user.id, 'ai.chat', { conversationId })

    return { conversationId, content, reasoning, draft, sources }
  }

  // --- public: SSE streaming ---

  async chatStream(req: ChatRequest, ctx: AuthContext, res: Response): Promise<void> {
    const message = req.message?.trim()
    if (!message) {
      res.status(400).json({ statusCode: 400, message: 'message 不能为空' })
      return
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders?.()

    const send = (event: string, data: unknown): void => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    const conversationId = req.conversationId || this.newId()
    send('meta', { conversationId })

    try {
      const useWebSearch = Boolean(req.useWebSearch)
      const toolCtx = this.buildToolContext(ctx, useWebSearch, req.autoApply)
      const prep = this.prepareBaseMessages({
        message,
        history: this.loadHistory(conversationId, ctx.user.id),
        currentArticle: req.currentPath ? this.safeRead(req.currentPath) : null,
        articleList: this.kb.flattenTree().map(a => ({ path: a.path, title: a.title })),
        useWebSearch: toolCtx.canWeb,
      })

      if (!this.config.openai.apiKey) {
        const content = this.localFallback(message, prep.articleList, prep.currentArticle)
        send('delta', { delta: content })
        const reasoning = ['未配置 OPENAI_API_KEY']
        send('reasoning', { reasoning })
        this.persistTurn(conversationId, ctx.user.id, message, content)
        send('done', {
          conversationId,
          content,
          reasoning,
          draft: null,
          sources: [],
        })
        res.end()
        return
      }

      const { messages, finalDirect, trace } = await this.researchLoop(
        prep.messages,
        toolCtx,
        (name, status, detail) => send('tool', { name, status, detail })
      )

      const reasoning = this.buildReasoning(
        prep.articleList,
        prep.currentArticle,
        trace,
        toolCtx.draftSink.value,
        toolCtx.canWeb,
        toolCtx.canAutoApply
      )
      send('reasoning', { reasoning })

      let content = finalDirect
      if (!content) {
        content = ''
        for await (const event of this.provider.streamChat({
          model: this.config.openai.model,
          temperature: 0.3,
          messages,
        })) {
          if (event.type === 'delta' && event.delta) {
            content += event.delta
            send('delta', { delta: event.delta })
          } else if (event.type === 'error') {
            throw new Error(event.error || 'AI 流式响应失败')
          }
        }
      } else {
        send('delta', { delta: finalDirect })
      }

      const draft = toolCtx.draftSink.value ?? this.extractDraft(content)
      const sources = this.collectSources(trace)
      this.persistTurn(conversationId, ctx.user.id, message, content)
      this.audit.log(ctx.user.id, 'ai.chat', { conversationId })

      send('done', { conversationId, content, reasoning, draft, sources })
    } catch (err) {
      send('error', { message: err instanceof Error ? err.message : String(err) })
    } finally {
      res.end()
    }
  }

  // --- public: draft confirmation + history ---

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

  // --- private: orchestration ---

  private buildToolContext(
    ctx: AuthContext,
    useWebSearch: boolean,
    autoApply: boolean | undefined
  ): ToolContext {
    // canAutoApply is `permission AND ui-toggle`. The toggle defaults to ON
    // (Khoj-style "decide and act"); users without the permission can't
    // enable it. This puts the user in control without weakening the perm.
    const hasPerm = ctx.permissions.includes('ai:auto_apply')
    const toggleOn = autoApply !== false // undefined treated as ON
    return {
      user: ctx,
      canWeb: Boolean(useWebSearch) && ctx.permissions.includes('ai:web'),
      canAutoApply: hasPerm && toggleOn,
      draftSink: { value: null },
    }
  }

  private prepareBaseMessages(opts: InitialMessageInput): {
    messages: ProviderChatMessage[]
    articleList: { path: string; title: string }[]
    currentArticle: { path: string; title: string; content: string } | null
  } {
    const messages = this.buildInitialMessages(opts)
    return {
      messages,
      articleList: opts.articleList,
      currentArticle: opts.currentArticle,
    }
  }

  private async researchLoop(
    baseMessages: ProviderChatMessage[],
    ctx: ToolContext,
    onTool?: (name: string, status: 'running' | 'done' | 'error', detail: string) => void
  ): Promise<{
    messages: ProviderChatMessage[]
    finalDirect: string
    trace: ToolTraceEntry[]
  }> {
    const messages: ProviderChatMessage[] = [...baseMessages]
    const trace: ToolTraceEntry[] = []
    const schemas = this.registry.schemasFor(ctx)

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await this.provider.chat({
        model: this.config.openai.model,
        temperature: 0.2,
        messages,
        tools: schemas.length ? schemas : undefined,
        tool_choice: schemas.length ? 'auto' : undefined,
      })

      if (!response.toolCalls.length) {
        return { messages, finalDirect: response.content || '', trace }
      }

      messages.push({
        role: 'assistant',
        content: response.content || '',
        tool_calls: response.toolCalls,
      })

      for (const call of response.toolCalls) {
        const name = call.function.name
        const args = this.parseArgs(call.function.arguments)
        onTool?.(name, 'running', this.argsSummary(args))
        const result = await this.registry.dispatch(name, args, ctx)
        trace.push({ name, args, result })
        const status = this.isError(result) ? 'error' : 'done'
        onTool?.(name, status, this.summarizeTool(name, result))
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(this.truncateResult(result)),
        })
      }
    }

    return { messages, finalDirect: '', trace }
  }

  private async collectStream(messages: ProviderChatMessage[]): Promise<string> {
    let content = ''
    for await (const event of this.provider.streamChat({
      model: this.config.openai.model,
      temperature: 0.3,
      messages,
    })) {
      if (event.type === 'delta' && event.delta) content += event.delta
      if (event.type === 'error') throw new Error(event.error || 'AI 流式响应失败')
    }
    return content
  }

  // --- private: prompt assembly ---

  private buildInitialMessages(opts: InitialMessageInput): ProviderChatMessage[] {
    const { older, recent } = this.compactHistory(opts.history)
    const directory = opts.articleList
      .slice(0, 80)
      .map(a => `- ${a.path}${a.title ? ` — ${a.title}` : ''}`)
      .join('\n')

    const messages: (ProviderChatMessage | null)[] = [
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
          : '用户未开启网络检索：不要调用 web_search / web_fetch / web_ingest 工具。',
      },
      older ? { role: 'system', content: older } : null,
      ...recent.map(m => ({
        role: m.role as ProviderChatMessage['role'],
        content: m.content,
      })),
      { role: 'user', content: opts.message },
    ]
    return messages.filter((m): m is ProviderChatMessage => m !== null)
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

  // --- private: result shaping ---

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
          .filter(
            (a: { type?: string; from?: string; to?: string }) =>
              a?.type === 'move' && !!a.from && !!a.to
          )
          .map((a: { from: string; to: string; title?: string }) => ({
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
    trace: ToolTraceEntry[],
    draft: Draft | null,
    canWeb: boolean,
    canAutoApply: boolean
  ): string[] {
    const steps: string[] = []
    steps.push(`加载知识库目录：${articleList.length} 篇文章`)
    steps.push(currentArticle ? `已读取当前文章：${currentArticle.path}` : '未绑定当前文章')
    steps.push(canWeb ? '允许调用网络工具' : '未授权网络工具')
    steps.push(canAutoApply ? '自动落盘授权:写工具直接生效' : '草稿模式:模型仅提案,需用户确认')
    for (const t of trace) {
      steps.push(`${t.name} → ${this.summarizeTool(t.name, t.result)}`)
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

  private summarizeTool(name: string, result: unknown): string {
    if (!result || typeof result !== 'object') return '完成'
    const obj = result as Record<string, unknown>
    if (typeof obj.error === 'string' && obj.error) return obj.error
    if (name === 'search_kb') return `${Array.isArray(obj.items) ? obj.items.length : 0} 条候选`
    if (name === 'read_article') return obj.path ? `已读取 ${obj.path}` : '未找到'
    if (name === 'web_search')
      return `${Array.isArray(obj.results) ? obj.results.length : 0} 条外部参考`
    if (name === 'web_fetch') return obj.title ? `已抓取：${obj.title}` : '已抓取'
    if (name === 'web_ingest') return obj.path ? `已落盘：${obj.path}` : '完成'
    if (name === 'create_article') return obj.path ? `已新建 ${obj.path}` : '完成'
    if (name === 'replace_article') return obj.path ? `已覆盖 ${obj.path}` : '完成'
    if (name === 'rename_article') return obj.path ? `已重命名为 ${obj.path}` : '完成'
    if (name === 'delete_article') return obj.path ? `已删除 ${obj.path}` : '完成'
    if (name === 'propose_draft') return '已提案草稿,等待用户确认'
    return '完成'
  }

  private collectSources(
    trace: ToolTraceEntry[]
  ): { title: string; url: string; snippet: string }[] {
    const sources: { title: string; url: string; snippet: string }[] = []
    for (const t of trace) {
      if (t.name === 'web_search' && t.result && typeof t.result === 'object') {
        const results = (t.result as { results?: unknown }).results
        if (Array.isArray(results)) {
          for (const r of results.slice(0, 3)) {
            sources.push({
              title: String((r as Record<string, unknown>).title || ''),
              url: String((r as Record<string, unknown>).url || ''),
              snippet: String((r as Record<string, unknown>).snippet || ''),
            })
          }
        }
      }
    }
    return sources
  }

  private truncateResult(result: unknown): unknown {
    if (!result || typeof result !== 'object') return result
    const obj = result as Record<string, unknown>
    if (typeof obj.content === 'string') {
      return { ...obj, content: truncate(obj.content, 4000) }
    }
    return result
  }

  private argsSummary(args: unknown): string {
    if (!args || typeof args !== 'object') return ''
    const obj = args as Record<string, unknown>
    if (typeof obj.query === 'string') return obj.query.slice(0, 60)
    if (typeof obj.url === 'string') return obj.url.slice(0, 80)
    if (typeof obj.path === 'string') return obj.path
    return ''
  }

  private isError(result: unknown): boolean {
    return Boolean(result && typeof result === 'object' && (result as { error?: unknown }).error)
  }

  private parseArgs(raw: string | undefined): Record<string, unknown> {
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
