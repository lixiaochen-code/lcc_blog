import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const loadEnvFile = () => {
  const envFile = join(process.cwd(), '.env.kb')
  if (!existsSync(envFile)) return
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const i = trimmed.indexOf('=')
    const key = trimmed.slice(0, i).trim()
    const value = trimmed
      .slice(i + 1)
      .trim()
      .replace(/^"|"$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile()

export const appConfig = {
  port: Number(process.env.KB_SERVER_PORT || 4010),
  jwtSecret: process.env.KB_JWT_SECRET || 'kb-dev-secret-change-me',
  knowledgeRoot: process.env.KB_MARKDOWN_ROOT || join(process.cwd(), 'docs', 'knowledge'),
  dataFile:
    process.env.KB_DATA_FILE || join(process.cwd(), 'apps', 'kb-server', 'data', 'dev-store.json'),
  openai: {
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
} as const

export type AppConfig = typeof appConfig
