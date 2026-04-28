import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const envFile = join(process.cwd(), '.env.kb')

if (existsSync(envFile)) {
  const lines = readFileSync(envFile, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const index = trimmed.indexOf('=')
    const key = trimmed.slice(0, index).trim()
    const value = trimmed
      .slice(index + 1)
      .trim()
      .replace(/^"|"$/g, '')
    process.env[key] ||= value
  }
}

export const config = {
  port: Number(process.env.KB_SERVER_PORT || 4010),
  jwtSecret: process.env.KB_JWT_SECRET || 'kb-dev-secret-change-me',
  knowledgeRoot: process.env.KB_MARKDOWN_ROOT || join(process.cwd(), 'docs', 'knowledge'),
  dataFile:
    process.env.KB_DATA_FILE || join(process.cwd(), 'apps', 'kb-server', 'data', 'dev-store.json'),
  openai: {
    baseUrl: process.env.OPENAI_BASE_URL || '',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || '',
  },
}
