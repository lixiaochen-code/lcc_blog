import { request } from './http'

export interface WebSearchResult {
  query: string
  source: string
  results: { title: string; url: string; snippet: string }[]
  error?: string
}

export interface WebFetchResult {
  url: string
  title: string
  content: string
  fetchedAt: string
}

export const web = {
  webSearch: (query: string) =>
    request<WebSearchResult>('/api/web/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  webFetch: (url: string) =>
    request<WebFetchResult>('/api/web/fetch', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
  webIngest: (url: string) =>
    request<{ path: string; title: string }>('/api/web/ingest', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
}
