import crypto from 'node:crypto'
import { config } from './config.js'

const base64url = input => Buffer.from(input).toString('base64url')

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':')
  if (!salt || !hash) return false
  const next = hashPassword(password, salt).split(':')[1]
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(next))
}

export function createToken(payload) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64url(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }))
  const sig = crypto.createHmac('sha256', config.jwtSecret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

export function verifyToken(token) {
  const [header, body, sig] = String(token || '').split('.')
  if (!header || !body || !sig) return null
  const expected = crypto.createHmac('sha256', config.jwtSecret).update(`${header}.${body}`).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  if (payload.exp && payload.exp < Date.now()) return null
  return payload
}

export function randomPassword() {
  return `Kb@${crypto.randomBytes(4).toString('hex')}${Math.floor(100 + Math.random() * 900)}`
}
