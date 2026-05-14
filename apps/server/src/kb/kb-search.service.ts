import { Injectable } from '@nestjs/common'
import { KbService } from './kb.service'
import type { SearchHit } from './kb.types'

/**
 * Keyword recall over the KB. Intentionally simple — title and path get
 * heavier weight than body. We can swap this implementation for embeddings
 * later without changing the API.
 */
@Injectable()
export class KbSearchService {
  constructor(private readonly kb: KbService) {}

  searchByQuery(query: string, limit = 10): SearchHit[] {
    const term = query.trim().toLowerCase()
    if (!term) return []

    const hits: SearchHit[] = []
    for (const article of this.kb.flattenTree()) {
      const path = article.path.toLowerCase()
      const title = article.title.toLowerCase()
      const body = article.content.toLowerCase()

      let score = 0
      if (title.includes(term)) score += 6
      if (path.includes(term)) score += 4
      if (body.includes(term)) score += 1
      if (score === 0) continue

      hits.push({
        path: article.path,
        title: article.title,
        snippet: this.snippet(article.content, term),
        score,
      })
    }

    return hits.sort((a, b) => b.score - a.score).slice(0, Math.max(1, limit))
  }

  private snippet(content: string, term: string, span = 80): string {
    const idx = content.toLowerCase().indexOf(term)
    if (idx < 0) return content.slice(0, span * 2).trim()
    const start = Math.max(0, idx - span)
    const end = Math.min(content.length, idx + term.length + span)
    return (
      (start > 0 ? '… ' : '') +
      content.slice(start, end).trim() +
      (end < content.length ? ' …' : '')
    )
  }
}
