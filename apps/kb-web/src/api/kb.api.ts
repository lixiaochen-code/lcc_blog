import { request } from './http'
import type { Article, TreeItem } from './types'

export const kb = {
  tree: () => request<{ items: TreeItem[] }>('/api/kb/tree'),
  article: (path: string) => request<Article>(`/api/kb/article?path=${encodeURIComponent(path)}`),
  createArticle: (path: string, content: string) =>
    request<Article>('/api/kb/article', {
      method: 'POST',
      body: JSON.stringify({ path, content }),
    }),
  updateArticle: (path: string, content: string) =>
    request<Article>('/api/kb/article', {
      method: 'PUT',
      body: JSON.stringify({ path, content }),
    }),
  deleteArticle: (path: string) =>
    request<{ path: string }>(`/api/kb/article?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    }),
  moveArticle: (from: string, to: string, title?: string) =>
    request<Article>('/api/kb/move', {
      method: 'POST',
      body: JSON.stringify({ from, to, title }),
    }),
  searchKb: (q: string, limit?: number) => {
    const params = new URLSearchParams({ q })
    if (limit) params.set('limit', String(limit))
    return request<{ items: Article[] }>(`/api/kb/search?${params.toString()}`)
  },
}
