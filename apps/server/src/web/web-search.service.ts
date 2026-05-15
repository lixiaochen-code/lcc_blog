import { Inject, Injectable } from '@nestjs/common'
import { APP_CONFIG } from '../config/config.module'
import type { AppConfig } from '../config/app.config'
import { JsonStoreService } from '../store/json-store.service'

export interface SearchResult {
  query: string
  source: string
  results: { title: string; url: string; snippet: string }[]
  error?: string
}

@Injectable()
export class WebSearchService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly store: JsonStoreService
  ) {}

  private async fetchWithTimeout(
    url: URL | string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<Response> {
    const { timeout = 8000, ...rest } = options
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    try {
      return await fetch(url, { ...rest, signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

  private cleanText(value: unknown): string {
    return String(value || '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }

  private normalizeQuery(query: string): string {
    const ascii = String(query || '').match(/[A-Za-z][A-Za-z0-9_-]*/g) || []
    return ascii.length ? [...new Set(ascii)].join(' ') : query
  }

  private async searchDDG(query: string): Promise<SearchResult> {
    const url = new URL('https://api.duckduckgo.com/')
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'json')
    url.searchParams.set('no_redirect', '1')
    url.searchParams.set('no_html', '1')
    const res = await this.fetchWithTimeout(url)
    if (!res.ok) throw new Error(`DuckDuckGo 检索失败：${res.status}`)
    const data = (await res.json()) as Record<string, any>
    const topics: any[] = Array.isArray(data.RelatedTopics) ? data.RelatedTopics : []
    return {
      query,
      source: 'duckduckgo',
      results: [
        data.AbstractText
          ? {
              title: data.Heading || query,
              url: data.AbstractURL || '',
              snippet: data.AbstractText,
            }
          : null,
        ...topics
          .flatMap((t: any) => (t.Topics ? t.Topics : [t]))
          .filter((t: any) => t.Text)
          .slice(0, 5)
          .map((t: any) => ({
            title: t.Text.split(' - ')[0],
            url: t.FirstURL || '',
            snippet: t.Text,
          })),
      ].filter(Boolean) as SearchResult['results'],
    }
  }

  private async searchBing(query: string): Promise<SearchResult> {
    const url = new URL('https://www.bing.com/search')
    url.searchParams.set('q', query)
    const res = await this.fetchWithTimeout(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 KBSearch/1.0', Accept: 'text/html' },
    })
    if (!res.ok) throw new Error(`Bing 检索失败：${res.status}`)
    const html = await res.text()
    const blocks = html.match(/<li class="b_algo"[\s\S]*?<\/li>/gi) || []
    const results = blocks
      .map(block => {
        const link = block.match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
        const snippet = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
        return link
          ? {
              title: this.cleanText(link[2]),
              url: link[1],
              snippet: this.cleanText(snippet?.[1] || ''),
            }
          : null
      })
      .filter((r): r is NonNullable<typeof r> => r !== null && !!r.title)
      .slice(0, 5)
    return { query, source: 'bing', results }
  }

  async search(query: string): Promise<SearchResult> {
    const normalized = this.normalizeQuery(query)
    const data = this.store.read()
    const mcp = data.mcpServers.find(s => s.enabled && s.type === 'http' && s.endpoint)
    if (mcp) {
      const url = new URL(mcp.endpoint)
      url.searchParams.set('q', normalized)
      const res = await this.fetchWithTimeout(url)
      if (!res.ok) throw new Error(`MCP 检索失败：${res.status}`)
      return res.json() as Promise<SearchResult>
    }

    const errors: string[] = []
    for (const searcher of [this.searchDDG.bind(this), this.searchBing.bind(this)]) {
      try {
        const result = await searcher(normalized)
        if (result.results.length) return result
        errors.push(`${result.source} 未返回有效结果`)
      } catch (e: any) {
        errors.push(e?.message || '网络检索不可用')
      }
    }
    return {
      query,
      source: 'search-unavailable',
      results: [],
      error: [...new Set(errors)].join('；'),
    }
  }
}
