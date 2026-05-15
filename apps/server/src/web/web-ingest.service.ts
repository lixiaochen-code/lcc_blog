import { Inject, Injectable } from '@nestjs/common'
import { APP_CONFIG } from '../config/config.module'
import type { AppConfig } from '../config/app.config'
import { KbService } from '../kb/kb.service'
import { WebFetchService } from './web-fetch.service'

@Injectable()
export class WebIngestService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly webFetch: WebFetchService,
    private readonly kb: KbService
  ) {}

  async ingest(url: string): Promise<{ path: string; title: string }> {
    const { title: pageTitle, content } = await this.webFetch.fetch(url)

    const prompt = `你是一个知识库整理助手。根据以下网页正文，生成一篇结构化的 Markdown 笔记。
只输出 JSON，格式：{"title":"...","slug":"...","category":"...","markdown":"..."}
- title: 文章标题（中文）
- slug: 英文小写连字符，用于文件名
- category: 一级目录名（英文小写，如 tech / tools / reading）
- markdown: 完整 Markdown 正文（含 # 标题）

网页标题：${pageTitle}
网页正文：
${content}`

    const res = await fetch(`${this.config.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.openai.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    })
    if (!res.ok) throw new Error(`AI 摘要失败：${res.status}`)
    const data = (await res.json()) as Record<string, any>
    const raw = data.choices?.[0]?.message?.content ?? '{}'
    const { title, slug, category, markdown } = JSON.parse(raw)

    const safeCat = String(category || 'inbox').replace(/[^a-z0-9-]/g, '-')
    const safeSlug = String(slug || 'untitled').replace(/[^a-z0-9-]/g, '-')
    const path = `${safeCat}/${safeSlug}.md`

    this.kb.writeArticle(path, String(markdown || ''))
    return { path, title: String(title || pageTitle) }
  }
}
