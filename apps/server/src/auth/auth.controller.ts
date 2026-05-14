import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { Public } from '../common/decorators/public.decorator'
import { JwtService } from './jwt.service'
import { AuthContextService } from '../common/auth-context.service'

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
    private readonly authContext: AuthContextService
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto) {
    return this.auth.login(body.username, body.password)
  }

  /**
   * Returns the current AuthContext or null. Intentionally public so the
   * frontend can probe session state on first paint without a 401.
   * Sends explicit JSON `null` (not an empty body) so the typed client can
   * distinguish "no session" from a parse error.
   */
  @Public()
  @Get('me')
  me(@Req() req: Request, @Res() res: Response): void {
    const header = (req.headers['authorization'] as string | undefined) || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    const payload = this.jwt.verify(token)
    const ctx = payload ? this.authContext.build(payload.sub) : null
    res.status(200).json(ctx)
  }
}
