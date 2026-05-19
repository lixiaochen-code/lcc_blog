import { request, clearToken } from './http'
import type { SessionUser } from './types'

export const auth = {
  login: (username: string, password: string) =>
    request<{ token: string; user: SessionUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<SessionUser | null>('/api/auth/me'),
  logout: () => clearToken(),
}
