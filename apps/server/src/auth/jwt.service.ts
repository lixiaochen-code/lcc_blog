import { Inject, Injectable } from '@nestjs/common'
import crypto from 'node:crypto'
import { APP_CONFIG } from '../config/config.module'
import type { AppConfig } from '../config/app.config'

export interface JwtPayload {
  sub: string
  username: string
  exp?: number
}

const base64url = (input: string | Buffer) => Buffer.from(input as never).toString('base64url')

@Injectable()
export class JwtService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  sign(payload: Omit<JwtPayload, 'exp'>, ttlMs = 1000 * 60 * 60 * 24 * 7): string {
    const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const body = base64url(
      JSON.stringify({ ...payload, exp: Date.now() + ttlMs } satisfies JwtPayload)
    )
    const sig = this.signature(`${header}.${body}`)
    return `${header}.${body}.${sig}`
  }

  verify(token: string): JwtPayload | null {
    const [header, body, sig] = String(token || '').split('.')
    if (!header || !body || !sig) return null
    const expected = this.signature(`${header}.${body}`)
    try {
      if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    } catch {
      return null
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as JwtPayload
    if (payload.exp && payload.exp < Date.now()) return null
    return payload
  }

  private signature(value: string): string {
    return crypto.createHmac('sha256', this.config.jwtSecret).update(value).digest('base64url')
  }
}
