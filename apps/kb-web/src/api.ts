export type Role = {
  id: string
  name: string
  description: string
  permissions: string[]
  system?: boolean
}

export type User = {
  id: string
  username: string
  roleIds: string[]
  disabled: boolean
}

export type SessionUser = {
  user: User
  roles: Role[]
  permissions: string[]
}

export type TreeItem = {
  type: 'directory' | 'article'
  name: string
  title?: string
  path: string
  children?: TreeItem[]
}

export type Article = {
  path: string
  title: string
  content: string
  updatedAt: string
}

export type Draft = {
  operation: 'create' | 'update' | 'delete' | 'organize'
  path: string
  content: string
  actions?: {
    type: 'move'
    from: string
    to: string
    title?: string
  }[]
}

export type SearchSource = {
  title: string
  url: string
  snippet: string
}

const tokenKey = 'kb_token'

export const getToken = () => localStorage.getItem(tokenKey) || ''
export const setToken = (token: string) => localStorage.setItem(tokenKey, token)
export const clearToken = () => localStorage.removeItem(tokenKey)

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: getToken() ? `Bearer ${getToken()}` : '',
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || '请求失败')
  return data
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: SessionUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<SessionUser | null>('/api/auth/me'),
  tree: () => request<{ items: TreeItem[] }>('/api/kb/tree'),
  article: (path: string) => request<Article>(`/api/kb/article?path=${encodeURIComponent(path)}`),
  createArticle: (path: string, content: string) =>
    request<Article>('/api/kb/article', {
      method: 'POST',
      body: JSON.stringify({ path, content }),
    }),
  updateArticle: (path: string, content: string) =>
    request<Article>('/api/kb/article', { method: 'PUT', body: JSON.stringify({ path, content }) }),
  deleteArticle: (path: string) =>
    request<{ path: string }>(`/api/kb/article?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    }),
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
  roles: () => request<{ items: Role[] }>('/api/admin/roles'),
  users: () => request<{ items: User[] }>('/api/admin/users'),
  createUser: (payload: { username: string; roleIds: string[] }) =>
    request<{ user: User; password: string }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
