import { computed, ref } from 'vue'
import { api, clearToken, setToken, type SessionUser } from '../api'

/**
 * Authentication + permission helper. Singleton via module-level state so
 * every component that calls `useSession()` sees the same session.
 */
const session = ref<SessionUser | null>(null)
const error = ref('')

const permissions = computed(() => session.value?.permissions || [])
const can = (permission: string): boolean => permissions.value.includes(permission)

async function login(username: string, password: string): Promise<void> {
  error.value = ''
  try {
    const result = await api.login(username, password)
    setToken(result.token)
    session.value = result.user
  } catch (err) {
    error.value = err instanceof Error ? err.message : '登录失败'
    throw err
  }
}

function logout(): void {
  clearToken()
  session.value = null
}

/** Try to recover a session from the cached JWT — runs once on app mount. */
async function bootstrap(): Promise<void> {
  try {
    session.value = await api.me()
  } catch {
    clearToken()
    session.value = null
  }
}

export function useSession() {
  return {
    session,
    error,
    permissions,
    can,
    login,
    logout,
    bootstrap,
  }
}
