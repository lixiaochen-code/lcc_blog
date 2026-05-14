import { Injectable } from '@nestjs/common'
import { JsonStoreService } from '../store/json-store.service'
import type { Permission } from './permissions'
import type { AuthContext } from './auth-context'

@Injectable()
export class AuthContextService {
  constructor(private readonly store: JsonStoreService) {}

  /** Build an AuthContext from a verified JWT `sub` (user id). */
  build(userId: string | undefined): AuthContext | null {
    if (!userId) return null
    const data = this.store.read()
    const user = data.users.find(item => item.id === userId)
    if (!user || user.disabled) return null
    const roles = data.roles.filter(role => user.roleIds.includes(role.id))
    const permissionSet = new Set<Permission>(roles.flatMap(role => role.permissions))
    return {
      user: {
        id: user.id,
        username: user.username,
        disabled: user.disabled,
        roleIds: user.roleIds,
      },
      roles: roles.map(role => ({ id: role.id, name: role.name })),
      permissions: [...permissionSet],
    }
  }
}
