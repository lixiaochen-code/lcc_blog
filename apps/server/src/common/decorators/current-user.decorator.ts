import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { AuthContext } from '../auth-context'

/**
 * Inject the authenticated principal into a route handler argument:
 *
 *   create(@CurrentUser() ctx: AuthContext, @Body() body: CreateUserDto) {}
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext | undefined => {
    const request = context.switchToHttp().getRequest()
    return request.user as AuthContext | undefined
  }
)
