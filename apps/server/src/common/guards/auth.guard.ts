import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '../../auth/jwt.service'
import { AuthContextService } from '../auth-context.service'
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator'
import { PUBLIC_KEY } from '../decorators/public.decorator'
import type { Permission } from '../permissions'
import type { Request } from 'express'

/**
 * Single guard that handles BOTH authentication and authorization.
 * Splitting them into two guards made route metadata fiddly — Nest fires
 * guards in declaration order but only the topmost decorator's metadata is
 * easy to read.
 *
 *   1. If route is @Public(), allow.
 *   2. Otherwise require a valid Bearer token; populate request.user.
 *   3. If @RequirePermissions(...) is set, verify the AuthContext has all
 *      listed permissions.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly authContext: AuthContextService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>()
    const header = (request.headers['authorization'] as string | undefined) || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    const payload = this.jwt.verify(token)
    if (!payload) throw new UnauthorizedException('请先登录')

    const ctx = this.authContext.build(payload.sub)
    if (!ctx) throw new UnauthorizedException('账号不可用')
    request.user = ctx

    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (required?.length) {
      const missing = required.filter(p => !ctx.permissions.includes(p))
      if (missing.length) {
        throw new ForbiddenException(`缺少权限：${missing.join(', ')}`)
      }
    }
    return true
  }
}
