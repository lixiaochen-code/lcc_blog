import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JsonStoreService } from '../store/json-store.service'
import { AuthContextService } from '../common/auth-context.service'
import { verifyPassword } from '../common/utils/password'
import { JwtService } from './jwt.service'
import type { AuthContext } from '../common/auth-context'

export interface LoginResult {
  token: string
  user: AuthContext
}

@Injectable()
export class AuthService {
  constructor(
    private readonly store: JsonStoreService,
    private readonly authContext: AuthContextService,
    private readonly jwt: JwtService
  ) {}

  login(username: string, password: string): LoginResult {
    const data = this.store.read()
    const user = data.users.find(item => item.username === username)
    if (!user || user.disabled || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('账号或密码错误')
    }
    const token = this.jwt.sign({ sub: user.id, username: user.username })
    const ctx = this.authContext.build(user.id)
    if (!ctx) throw new UnauthorizedException('账号不可用')
    return { token, user: ctx }
  }
}
