export type Role = {
  id: string
  name: string
  description: string
  permissions: string[]
  system?: boolean
  createdAt?: string
  updatedAt?: string
}

export type User = {
  id: string
  username: string
  roleIds: string[]
  disabled: boolean
  createdAt?: string
  updatedAt?: string
}

export type PermissionGroup = {
  name: string
  permissions: string[]
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
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) {
    const message = (data && (data.message || data.error)) || `请求失败 (${response.status})`
    throw new Error(Array.isArray(message) ? message.join('；') : message)
  }
  return data as T
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

  // ----- Admin: roles & permissions -----
  permissionGroups: () => request<{ groups: PermissionGroup[] }>('/api/admin/permissions'),
  roles: () => request<{ items: Role[] }>('/api/admin/roles'),
  createRole: (payload: { name: string; description?: string; permissions: string[] }) =>
    request<Role>('/api/admin/roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateRole: (id: string, payload: Partial<Pick<Role, 'name' | 'description' | 'permissions'>>) =>
    request<Role>(`/api/admin/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteRole: (id: string) =>
    request<{ id: string }>(`/api/admin/roles/${id}`, { method: 'DELETE' }),

  // ----- Admin: users -----
  users: () => request<{ items: User[] }>('/api/admin/users'),
  createUser: (payload: { username: string; password?: string; roleIds: string[] }) =>
    request<{ user: User; password: string }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateUser: (
    id: string,
    payload: { roleIds?: string[]; disabled?: boolean; resetPassword?: boolean }
  ) =>
    request<{ user: User; password?: string }>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteUser: (id: string) =>
    request<{ id: string }>(`/api/admin/users/${id}`, { method: 'DELETE' }),
}
