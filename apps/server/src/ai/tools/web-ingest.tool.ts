import { Injectable } from '@nestjs/common'
import { WebIngestService } from '../../web/web-ingest.service'
import { AuditService } from '../../audit/audit.service'
import type { Permission } from '../../common/permissions'
import type { ProviderToolSchema } from '../providers/provider.interface'
import type { AiTool, ToolContext } from './tool.interface'

interface Args {
  url: string
}

/**
 * Fetch → AI-summarise → write to KB. Only exposed when both `ai:auto_apply`
 * and `ai:web`/`ai:write_kb` are present (see `tool-registry.ts`).
 */
@Injectable()
export class WebIngestTool implements AiTool<Args, unknown> {
  readonly name = 'web_ingest'
  readonly description = '抓取 URL，AI 生成摘要，并直接写入知识库。仅在自动落盘授权下可用。'
  readonly requiredPermissions: Permission[] = ['ai:auto_apply', 'ai:web', 'ai:write_kb']
  readonly schema: ProviderToolSchema = {
    type: 'function',
    function: {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '要抓取并入库的网页 URL' },
        },
        required: ['url'],
        additionalProperties: false,
      },
    },
  }

  constructor(
    private readonly webIngest: WebIngestService,
    private readonly audit: AuditService
  ) {}

  async execute(args: Args, ctx: ToolContext): Promise<unknown> {
    const result = await this.webIngest.ingest(String(args.url || ''))
    this.audit.log(ctx.user.user.id, 'ai.tool.web_ingest', { url: args.url, path: result.path })
    return result
  }
}
