import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'

/**
 * Walk up from cwd looking for `.env.kb`. Whichever directory holds it
 * IS the repo root — every relative path in the env file resolves
 * against that root, not the current process cwd. Without this, running
 * the server from a workspace subdir (`pnpm --filter @lcc/server dev`,
 * cwd = `apps/server`) would silently spawn empty `docs/knowledge` and
 * `apps/kb-server/data/` siblings inside the workspace package.
 */
const findRepoRoot = (): string => {
  let dir = process.cwd()
  while (true) {
    if (existsSync(join(dir, '.env.kb')) || existsSync(join(dir, '.env.kb.example'))) return dir
    const parent = dirname(dir)
    if (parent === dir) return process.cwd()
    dir = parent
  }
}

const REPO_ROOT = findRepoRoot()

const loadEnvFile = () => {
  const envFile = join(REPO_ROOT, '.env.kb')
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

/** Resolve a path against the repo root unless it's already absolute. */
const resolveFromRoot = (value: string | undefined, fallback: string): string => {
  const candidate = value ?? fallback
  return isAbsolute(candidate) ? candidate : resolve(REPO_ROOT, candidate)
}

export const appConfig = {
  repoRoot: REPO_ROOT,
  port: Number(process.env.KB_SERVER_PORT || 4010),
  jwtSecret: process.env.KB_JWT_SECRET || 'kb-dev-secret-change-me',
  knowledgeRoot: resolveFromRoot(process.env.KB_MARKDOWN_ROOT, 'docs/knowledge'),
  dataFile: resolveFromRoot(process.env.KB_DATA_FILE, 'apps/kb-server/data/dev-store.json'),
  openai: {
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
} as const

export type AppConfig = typeof appConfig
