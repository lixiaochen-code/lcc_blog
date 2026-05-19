import { BadRequestException, Injectable } from '@nestjs/common'
import type { Permission } from '../../common/permissions'
import type { ProviderToolSchema } from '../providers/provider.interface'
import type { AiTool, ToolContext } from './tool.interface'
import type { Draft } from '../ai.types'

interface Args {
  operation: Draft['operation']
  path?: string
  content?: string
  actions?: Draft['actions']
}

/**
 * Draft-only mutator. Exposed when the user lacks `ai:auto_apply` — the
 * model proposes a write, the orchestrator stashes it in `ctx.draftSink`,
 * and the UI confirms before `POST /api/ai/apply` actually runs it.
 *
 * Mutually exclusive with `kb_write` / `web_ingest` (see `tool-registry.ts`).
 */
@Injectable()
export class ProposeDraftTool implements AiTool<Args, unknown> {
  readonly name = 'propose_draft'
  readonly description = '生成一份待用户确认的草稿（不直接写入）。无 ai:auto_apply 权限时使用。'
  readonly requiredPermissions: Permission[] = ['ai:write_kb']
  readonly schema: ProviderToolSchema = {
    type: 'function',
    function: {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          operation: { type: 'string', enum: ['create', 'update', 'delete', 'organize'] },
          path: { type: 'string', description: 'create/update/delete 的目标路径' },
          content: { type: 'string', description: 'create/update 的完整 Markdown 正文' },
          actions: {
            type: 'array',
            description: 'organize 操作的移动计划',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['move'] },
                from: { type: 'string' },
                to: { type: 'string' },
                title: { type: 'string' },
              },
              required: ['type', 'from', 'to'],
              additionalProperties: false,
            },
          },
        },
        required: ['operation'],
        additionalProperties: false,
      },
    },
  }

  async execute(args: Args, ctx: ToolContext): Promise<unknown> {
    const op = args?.operation
    if (!op) throw new BadRequestException('propose_draft 缺少 operation')

    let draft: Draft
    if (op === 'organize') {
      const actions = (Array.isArray(args.actions) ? args.actions : [])
        .filter(a => a?.type === 'move' && a.from && a.to)
        .map(a => ({
          type: 'move' as const,
          from: String(a.from),
          to: String(a.to),
          title: a.title ? String(a.title) : undefined,
        }))
      draft = { operation: 'organize', path: '知识库目录', content: '', actions }
    } else if (op === 'delete') {
      if (!args.path) throw new BadRequestException('propose_draft delete 缺少 path')
      draft = { operation: 'delete', path: String(args.path), content: '' }
    } else {
      if (!args.path || typeof args.content !== 'string') {
        throw new BadRequestException('propose_draft create/update 需要 path 与 content')
      }
      draft = { operation: op, path: String(args.path), content: args.content }
    }

    ctx.draftSink.value = draft
    return { ok: true, draft: { operation: draft.operation, path: draft.path } }
  }
}
