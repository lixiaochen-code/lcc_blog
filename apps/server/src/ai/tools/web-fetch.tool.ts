import { Injectable } from '@nestjs/common'
import { WebFetchService } from '../../web/web-fetch.service'
import type { Permission } from '../../common/permissions'
import type { ProviderToolSchema } from '../providers/provider.interface'
import type { AiTool } from './tool.interface'

interface Args {
  url: string
}

@Injectable()
export class WebFetchTool implements AiTool<Args, unknown> {
  readonly name = 'web_fetch'
  readonly description = '抓取指定 URL 的网页正文（最长 8000 字）。'
  readonly requiredPermissions: Permission[] = ['ai:use', 'ai:web']
  readonly schema: ProviderToolSchema = {
    type: 'function',
    function: {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '要抓取的网页 URL（http/https）' },
        },
        required: ['url'],
        additionalProperties: false,
      },
    },
  }

  constructor(private readonly webFetch: WebFetchService) {}

  async execute(args: Args): Promise<unknown> {
    return this.webFetch.fetch(String(args.url || ''))
  }
}
