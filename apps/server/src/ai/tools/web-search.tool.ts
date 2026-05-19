import { Injectable } from '@nestjs/common'
import { WebSearchService } from '../../web/web-search.service'
import type { Permission } from '../../common/permissions'
import type { ProviderToolSchema } from '../providers/provider.interface'
import type { AiTool } from './tool.interface'

interface Args {
  query: string
}

@Injectable()
export class WebSearchTool implements AiTool<Args, unknown> {
  readonly name = 'web_search'
  readonly description = '本地知识库不足以回答时，搜索互联网。'
  readonly requiredPermissions: Permission[] = ['ai:use', 'ai:web']
  readonly schema: ProviderToolSchema = {
    type: 'function',
    function: {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '提炼后的搜索词' },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
  }

  constructor(private readonly webSearch: WebSearchService) {}

  async execute(args: Args): Promise<unknown> {
    return this.webSearch.search(String(args.query || ''))
  }
}
