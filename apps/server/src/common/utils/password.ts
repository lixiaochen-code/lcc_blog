import crypto from 'node:crypto'

const ITERATIONS = 120000
const KEY_LENGTH = 32

export const hashPassword = (
  password: string,
  salt: string = crypto.randomBytes(16).toString('hex')
): string => {
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256').toString('hex')
  return `${salt}:${hash}`
}

export const verifyPassword = (password: string, stored: string): boolean => {
  const [salt, hash] = String(stored || '').split(':')
  if (!salt || !hash) return false
  const next = hashPassword(password, salt).split(':')[1]
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(next, 'hex'))
  } catch {
    return false
  }
}

export const randomPassword = (): string =>
  `Kb@${crypto.randomBytes(4).toString('hex')}${Math.floor(100 + Math.random() * 900)}`
