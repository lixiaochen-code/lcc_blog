import { SetMetadata } from '@nestjs/common'
import type { Permission } from '../permissions'

export const PERMISSIONS_KEY = 'permissions'

/**
 * Declare which permissions are required to invoke a route. Multiple
 * permissions are AND-combined (need all of them).
 *
 *   @RequirePermissions('kb:update', 'kb:create')
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions)
