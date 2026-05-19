import { BadRequestException, Injectable } from '@nestjs/common'
import { KbService } from '../../kb/kb.service'
import { AuditService } from '../../audit/audit.service'
import type { Permission } from '../../common/permissions'
import type { ProviderToolSchema } from '../providers/provider.interface'
import type { AiTool, ToolContext } from './tool.interface'

interface Args {
  path: string
}

@Injectable()
export class DeleteArticleTool implements AiTool<Args, unknown> {
  readonly name = 'delete_article'
  readonly description = '删除一篇文章。等价于 Unix `rm`。'
  readonly requiredPermissions: Permission[] = ['ai:auto_apply', 'ai:write_kb']
  readonly schema: ProviderToolSchema = {
    type: 'function',
    function: {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '要删除的 .md 路径' },
        },
        required: ['path'],
        additionalProperties: false,
      },
    },
  }

  constructor(
    private readonly kb: KbService,
    private readonly audit: AuditService
  ) {}

  async execute(args: Args, ctx: ToolContext): Promise<unknown> {
    if (!args?.path) throw new BadRequestException('delete_article 缺少 path')
    const result = this.kb.deleteArticle(args.path)
    this.audit.log(ctx.user.user.id, 'ai.tool.delete_article', { path: result.path })
    return result
  }
}
