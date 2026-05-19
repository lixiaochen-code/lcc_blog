import { Injectable } from '@nestjs/common'
import { KbService } from '../../kb/kb.service'
import type { Permission } from '../../common/permissions'
import type { ProviderToolSchema } from '../providers/provider.interface'
import type { AiTool } from './tool.interface'

interface Args {
  path: string
}

const READ_LIMIT = 8000

@Injectable()
export class KbReadTool implements AiTool<Args, unknown> {
  readonly name = 'read_article'
  readonly description = '按相对路径读取知识库内某篇文章的全文。'
  readonly requiredPermissions: Permission[] = ['ai:use']
  readonly schema: ProviderToolSchema = {
    type: 'function',
    function: {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '相对 docs/knowledge 的 .md 路径' },
        },
        required: ['path'],
        additionalProperties: false,
      },
    },
  }

  constructor(private readonly kb: KbService) {}

  async execute(args: Args): Promise<unknown> {
    try {
      const article = this.kb.readArticle(String(args.path || ''))
      const content =
        article.content.length > READ_LIMIT
          ? `${article.content.slice(0, READ_LIMIT)}…（已截断 ${article.content.length - READ_LIMIT} 字）`
          : article.content
      return {
        path: article.path,
        title: article.title,
        content,
        updatedAt: article.updatedAt,
      }
    } catch (err) {
      return { path: args?.path, error: err instanceof Error ? err.message : '读取失败' }
    }
  }
}
