import type { Permission } from './permissions'

/**
 * The authenticated principal, attached to `request.user` by AuthGuard
 * and read by PermissionGuard. Anything else that needs identity in a
 * request must read from here — never from raw headers.
 */
export interface AuthContext {
  user: {
    id: string
    username: string
    disabled: boolean
    roleIds: string[]
  }
  roles: { id: string; name: string }[]
  permissions: Permission[]
}

export type RequestWithUser = Express.Request & { user?: AuthContext }
