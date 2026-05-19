import { Injectable } from '@nestjs/common'
import type { AiTool, ToolContext } from './tool.interface'
import type { ProviderToolSchema } from '../providers/provider.interface'
import { KbSearchTool } from './kb-search.tool'
import { KbReadTool } from './kb-read.tool'
import { CreateArticleTool } from './create-article.tool'
import { ReplaceArticleTool } from './replace-article.tool'
import { RenameArticleTool } from './rename-article.tool'
import { DeleteArticleTool } from './delete-article.tool'
import { WebSearchTool } from './web-search.tool'
import { WebFetchTool } from './web-fetch.tool'
import { WebIngestTool } from './web-ingest.tool'
import { ProposeDraftTool } from './propose-draft.tool'

/** Tools that write to the KB directly (require ai:auto_apply at runtime). */
const AUTO_APPLY_TOOL_NAMES = new Set([
  'create_article',
  'replace_article',
  'rename_article',
  'delete_article',
  'web_ingest',
])

/**
 * Holds every registered tool, decides which ones a given request can see,
 * and dispatches calls. AiService never touches a tool class directly — it
 * goes through `listFor` + `dispatch` so adding a new tool is a one-line
 * change to the constructor.
 *
 * Visibility rules (`listFor`):
 *   1. Tool's `requiredPermissions` must all be in `ctx.user.permissions`.
 *   2. `web_*` tools require `ctx.canWeb` (the per-request useWebSearch flag).
 *   3. Auto-apply tools (create/replace/rename/delete_article + web_ingest)
 *      require `ctx.canAutoApply` (a runtime AND of permission + UI toggle).
 *   4. `propose_draft` is the mutual exclusion: only visible when
 *      `ctx.canAutoApply` is FALSE — users either get direct writes or the
 *      preview flow, never both.
 */
@Injectable()
export class ToolRegistry {
  private readonly tools: AiTool[]

  constructor(
    kbSearch: KbSearchTool,
    kbRead: KbReadTool,
    createArticle: CreateArticleTool,
    replaceArticle: ReplaceArticleTool,
    renameArticle: RenameArticleTool,
    deleteArticle: DeleteArticleTool,
    webSearch: WebSearchTool,
    webFetch: WebFetchTool,
    webIngest: WebIngestTool,
    proposeDraft: ProposeDraftTool
  ) {
    this.tools = [
      kbSearch,
      kbRead,
      createArticle,
      replaceArticle,
      renameArticle,
      deleteArticle,
      webSearch,
      webFetch,
      webIngest,
      proposeDraft,
    ]
  }

  listFor(ctx: ToolContext): AiTool[] {
    return this.tools.filter(tool => {
      const hasPerms = tool.requiredPermissions.every(p => ctx.user.permissions.includes(p))
      if (!hasPerms) return false
      if (tool.name.startsWith('web_') && tool.name !== 'web_ingest' && !ctx.canWeb) return false
      if (tool.name === 'web_ingest' && (!ctx.canWeb || !ctx.canAutoApply)) return false
      if (AUTO_APPLY_TOOL_NAMES.has(tool.name) && !ctx.canAutoApply) return false
      if (tool.name === 'propose_draft' && ctx.canAutoApply) return false
      return true
    })
  }

  schemasFor(ctx: ToolContext): ProviderToolSchema[] {
    return this.listFor(ctx).map(tool => tool.schema)
  }

  /**
   * Execute a tool by name. Returns `{error}` instead of throwing so the
   * orchestrator loop stays alive (model can recover by trying another tool).
   * Re-checks visibility defensively — a buggy provider could try to call
   * a tool the model wasn't shown.
   */
  async dispatch(name: string, args: unknown, ctx: ToolContext): Promise<unknown> {
    const visible = this.listFor(ctx)
    const tool = visible.find(t => t.name === name)
    if (!tool) return { error: `工具不可用：${name}` }
    try {
      return await tool.execute(args as never, ctx)
    } catch (err) {
      return { error: err instanceof Error ? err.message : '工具调用失败' }
    }
  }
}
