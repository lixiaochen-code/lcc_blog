import { Injectable } from '@nestjs/common'
import { KbSearchService } from '../../kb/kb-search.service'
import type { Permission } from '../../common/permissions'
import type { ProviderToolSchema } from '../providers/provider.interface'
import type { AiTool } from './tool.interface'

interface Args {
  query: string
  limit?: number
}

@Injectable()
export class KbSearchTool implements AiTool<Args, unknown> {
  readonly name = 'search_kb'
  readonly description = '在本地知识库中按关键词搜索文章（匹配路径与标题）。'
  readonly requiredPermissions: Permission[] = ['ai:use']
  readonly schema: ProviderToolSchema = {
    type: 'function',
    function: {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '查询词' },
          limit: { type: 'integer', minimum: 1, maximum: 20, default: 8 },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
  }

  constructor(private readonly kbSearch: KbSearchService) {}

  async execute(args: Args): Promise<unknown> {
    return { items: this.kbSearch.searchByQuery(String(args.query || ''), args.limit ?? 8) }
  }
}
