import { Injectable } from '@nestjs/common'

export interface FetchResult {
  url: string
  title: string
  content: string
  fetchedAt: string
}

const MAX_BYTES = 2 * 1024 * 1024

@Injectable()
export class WebFetchService {
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    try {
      return await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 KBFetch/1.0' },
      })
    } finally {
      clearTimeout(timer)
    }
  }

  private extractText(html: string): { title: string; content: string } {
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? ''

    // strip noisy blocks
    let body = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')

    // prefer semantic containers
    const main =
      body.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? body.match(/<article[\s\S]*?<\/article>/i)?.[0]

    if (main) {
      body = main
    } else {
      // pick the longest <div> block
      const divs = [...body.matchAll(/<div[\s\S]*?<\/div>/gi)]
      if (divs.length) {
        body = divs.reduce((a, b) => (a[0].length >= b[0].length ? a : b))[0]
      }
    }

    const text = body
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)

    return { title: title.replace(/<[^>]+>/g, '').trim(), content: text }
  }

  async fetch(url: string): Promise<FetchResult> {
    const res = await this.fetchWithTimeout(url)
    if (!res.ok) throw new Error(`抓取失败：${res.status} ${url}`)

    // enforce 2MB limit
    const reader = res.body?.getReader()
    const chunks: Uint8Array[] = []
    let total = 0
    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done || !value) break
        total += value.byteLength
        chunks.push(value)
        if (total >= MAX_BYTES) break
      }
    }
    const html = Buffer.concat(chunks).toString('utf8')
    const { title, content } = this.extractText(html)
    return { url, title, content, fetchedAt: new Date().toISOString() }
  }
}
