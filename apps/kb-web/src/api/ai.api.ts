import { request } from './http'
import type { Article, Draft, SearchSource } from './types'

export const ai = {
  /** @deprecated Frontend uses `/api/ai/chat/stream` directly via fetch. */
  chat: (payload: {
    message: string
    history: { role: string; content: string }[]
    currentPath?: string
    conversationId?: string
    useWebSearch?: boolean
  }) =>
    request<{
      conversationId: string
      content: string
      reasoning?: string[]
      draft?: Draft
      sources?: SearchSource[]
    }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  applyDraft: (draft: Draft) =>
    request<Article | { path: string; items?: Article[] }>('/api/ai/apply', {
      method: 'POST',
      body: JSON.stringify({ draft }),
    }),
  conversations: () =>
    request<{ items: { id: string; title: string; updatedAt: string }[] }>('/api/ai/conversations'),
}
