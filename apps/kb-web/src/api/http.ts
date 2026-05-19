const TOKEN_KEY = 'kb_token'

export const getToken = (): string => localStorage.getItem(TOKEN_KEY) || ''
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY)

/**
 * Shared fetch wrapper. Adds Bearer token + JSON content-type, parses the
 * response body, and turns non-2xx into a thrown `Error` with the message
 * the backend exception filter sends back (`{statusCode, message}`).
 *
 * Kept in its own module so that `api/*.api.ts` can import it without
 * cycling through `api/index.ts` (which aggregates them all).
 */
export async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(url, { ...options, headers })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) {
    const message = (data && (data.message || data.error)) || `请求失败 (${response.status})`
    throw new Error(Array.isArray(message) ? message.join('；') : message)
  }
  return data as T
}
