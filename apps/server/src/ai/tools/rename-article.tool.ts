import { BadRequestException, Injectable } from '@nestjs/common'
import { KbService } from '../../kb/kb.service'
import { AuditService } from '../../audit/audit.service'
import type { Permission } from '../../common/permissions'
import type { ProviderToolSchema } from '../providers/provider.interface'
import type { AiTool, ToolContext } from './tool.interface'

interface Args {
  from: string
  to: string
  title?: string
}

/**
 * Move / rename, optionally rewriting the `# H1`. Equivalent to Unix `mv`
 * with a side-effect on the in-file title.
 */
@Injectable()
export class RenameArticleTool implements AiTool<Args, unknown> {
  readonly name = 'rename_article'
  readonly description = '移动或重命名文章,可选同步修改 # H1 标题。等价于 Unix `mv`。'
  readonly requiredPermissions: Permission[] = ['ai:auto_apply', 'ai:write_kb']
  readonly schema: ProviderToolSchema = {
    type: 'function',
    function: {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: '当前 .md 路径' },
          to: { type: 'string', description: '目标 .md 路径' },
          title: { type: 'string', description: '可选:同时把 # H1 改成这个标题' },
        },
        required: ['from', 'to'],
        additionalProperties: false,
      },
    },
  }

  constructor(
    private readonly kb: KbService,
    private readonly audit: AuditService
  ) {}

  async execute(args: Args, ctx: ToolContext): Promise<unknown> {
    if (!args?.from || !args?.to) {
      throw new BadRequestException('rename_article 缺少 from 或 to')
    }
    const article = this.kb.moveArticle(args.from, args.to, args.title)
    this.audit.log(ctx.user.user.id, 'ai.tool.rename_article', {
      from: args.from,
      to: article.path,
    })
    return article
  }
}
