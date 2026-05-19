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
 * Full-document overwrite (`>` redirect). Reserved for "rewrite most or all
 * of the article" — for small edits the model should `read_article` first
 * and pass the merged result back. We don't have a section-level patch
 * tool yet (HANDOVER §7.4 borrow list item).
 */
@Injectable()
export class ReplaceArticleTool implements AiTool<Args, unknown> {
  readonly name = 'replace_article'
  readonly description = '覆盖一篇已存在文章的全部正文。等价于 Shell `> file.md`。'
  readonly requiredPermissions: Permission[] = ['ai:auto_apply', 'ai:write_kb']
  readonly schema: ProviderToolSchema = {
    type: 'function',
    function: {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '要覆盖的 .md 路径(必须已存在)' },
          content: { type: 'string', description: '新的完整 Markdown 正文' },
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
      throw new BadRequestException('replace_article 缺少 path 或 content')
    }
    const article = this.kb.writeArticle(args.path, args.content)
    this.audit.log(ctx.user.user.id, 'ai.tool.replace_article', { path: article.path })
    return article
  }
}
