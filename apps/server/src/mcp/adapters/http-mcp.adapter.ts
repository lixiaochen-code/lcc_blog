import { ServiceUnavailableException } from '@nestjs/common'
import { fetchWithTimeout } from '../../web/web-http.util'
import type { McpAdapter, McpToolDescriptor } from './mcp-adapter.interface'
import type { McpServerRecord } from '../../store/store.types'

/**
 * HTTP-backed MCP adapter. The current `WebSearchService` MCP branch hits
 * the configured endpoint with `?q=` and parses the response — this adapter
 * encapsulates that same shape so future tools (read, write) can ride on
 * the same transport.
 *
 * Not a NestJS `@Injectable()` because every instance is bound to a
 * specific `McpServerRecord`. Callers build one with `HttpMcpAdapter.fromRecord`
 * (or `new HttpMcpAdapter(record)`) at the point of use.
 *
 * `WebSearchService` will be refactored to use this in a follow-up — see
 * HANDOVER §4 Step 5.7 / 5.5 TODO.
 */
export class HttpMcpAdapter implements McpAdapter {
  readonly name: string
  readonly type = 'http' as const
  private readonly endpoint: string

  constructor(record: McpServerRecord) {
    this.name = record.name
    this.endpoint = record.endpoint
  }

  /** Factory for callers holding a McpServerRecord at runtime. */
  static fromRecord(record: McpServerRecord): HttpMcpAdapter {
    return new HttpMcpAdapter(record)
  }

  async connect(): Promise<void> {
    /* no-op — HTTP is stateless */
  }

  async listTools(): Promise<McpToolDescriptor[]> {
    // Until we adopt the full MCP protocol, advertise the one tool we
    // know every HTTP endpoint we ship supports.
    return [
      {
        name: 'web_search',
        description: 'Search the web via the configured HTTP MCP endpoint.',
        schema: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
        },
      },
    ]
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.endpoint) throw new ServiceUnavailableException('MCP endpoint 未配置')
    if (name !== 'web_search') {
      throw new ServiceUnavailableException(`HTTP MCP 暂未支持工具：${name}`)
    }
    const url = new URL(this.endpoint)
    url.searchParams.set('q', String(args.query ?? ''))
    const res = await fetchWithTimeout(url)
    if (!res.ok) throw new ServiceUnavailableException(`MCP 调用失败：${res.status}`)
    return res.json()
  }
}
