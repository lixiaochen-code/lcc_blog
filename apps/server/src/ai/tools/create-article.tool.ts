import { BadRequestException, Injectable } from '@nestjs/common'
import { KbService } from '../../kb/kb.service'
import { AuditService } from '../../audit/audit.service'
import type { Permission } from '../../common/permissions'
import type { ProviderToolSchema } from '../providers/provider.interface'
import type { AiTool, ToolContext } from './tool.interface'

interface Args {
  path: string
  content: string
}

/**
 * Create-only write: equivalent of `touch` + initial body. Only exposed
 * when the user has `ai:auto_apply` (see `tool-registry.ts`). Path safety
 * + .md enforcement live inside `KbService`.
 */
@Injectable()
export class CreateArticleTool implements AiTool<Args, unknown> {
  readonly name = 'create_article'
  readonly description = '新建一篇文章并写入完整 Markdown 正文。等价于 Unix `touch` + 首次写入。'
  readonly requiredPermissions: Permission[] = ['ai:auto_apply', 'ai:write_kb']
  readonly schema: ProviderToolSchema = {
    type: 'function',
    function: {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '相对 docs/knowledge 的 .md 路径,如 ai/agents.md' },
          content: { type: 'string', description: '完整 Markdown 正文(含 # H1 标题)' },
        },
        required: ['path', 'content'],
        additionalProperties: false,
      },
    },
  }

  constructor(
    private readonly kb: KbService,
    private readonly audit: AuditService
  ) {}

  async execute(args: Args, ctx: ToolContext): Promise<unknown> {
    if (!args?.path || typeof args.content !== 'string') {
      throw new BadRequestException('create_article 缺少 path 或 content')
    }
    const article = this.kb.writeArticle(args.path, args.content)
    this.audit.log(ctx.user.user.id, 'ai.tool.create_article', { path: article.path })
    return article
  }
}
