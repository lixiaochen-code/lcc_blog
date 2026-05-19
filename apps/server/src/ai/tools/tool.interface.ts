import type { AuthContext } from '../../common/auth-context'
import type { Permission } from '../../common/permissions'
import type { Draft } from '../ai.types'
import type { ProviderToolSchema } from '../providers/provider.interface'

/**
 * Per-request context handed to every tool's `execute`. Built once by
 * `AiService` and threaded through `ToolRegistry.dispatch`.
 *
 * `draftSink` is the channel `propose_draft` uses to hand a candidate Draft
 * back to the orchestrator — see `propose-draft.tool.ts` for why it can't
 * just be a return value (the chat loop continues, but the draft is what
 * the UI confirms after the loop ends).
 */
export interface ToolContext {
  user: AuthContext
  canWeb: boolean
  canAutoApply: boolean
  draftSink: { value: Draft | null }
}

export interface AiTool<TArgs = unknown, TResult = unknown> {
  readonly name: string
  readonly description: string
  readonly requiredPermissions: Permission[]
  readonly schema: ProviderToolSchema
  execute(args: TArgs, ctx: ToolContext): Promise<TResult>
}
