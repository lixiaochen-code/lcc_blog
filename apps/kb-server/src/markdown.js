import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, normalize, relative, sep } from 'node:path'
import { config } from './config.js'

mkdirSync(config.knowledgeRoot, { recursive: true })

const assertSafePath = rawPath => {
  const clean = normalize(String(rawPath || '').replace(/^\/+/, ''))
  if (!clean || clean.startsWith('..') || clean.includes(`..${sep}`)) {
    const err = new Error('非法知识库路径')
    err.status = 400
    throw err
  }
  if (!clean.endsWith('.md')) {
    const err = new Error('知识库文章必须是 .md 文件')
    err.status = 400
    throw err
  }
  return clean
}

export function resolveDocPath(rawPath) {
  const clean = assertSafePath(rawPath)
  return { clean, fullPath: join(config.knowledgeRoot, clean) }
}

export function listTree(dir = config.knowledgeRoot, base = '') {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter(name => !name.startsWith('.'))
    .map(name => {
      const fullPath = join(dir, name)
      const stats = statSync(fullPath)
      const itemPath = base ? `${base}/${name}` : name
      if (stats.isDirectory()) {
        return { type: 'directory', name, path: itemPath, children: listTree(fullPath, itemPath) }
      }
      if (!name.endsWith('.md')) return null
      const content = readFileSync(fullPath, 'utf8')
      const title = content.match(/^#\s+(.+)$/m)?.[1] || name.replace(/\.md$/, '')
      return {
        type: 'article',
        name,
        title,
        path: itemPath,
        updatedAt: stats.mtime.toISOString(),
      }
    })
    .filter(Boolean)
    .sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'directory' ? -1 : 1
    )
}

export function readArticle(path) {
  const { clean, fullPath } = resolveDocPath(path)
  if (!existsSync(fullPath)) {
    const err = new Error('文章不存在')
    err.status = 404
    throw err
  }
  const stats = statSync(fullPath)
  return {
    path: clean,
    title:
      readFileSync(fullPath, 'utf8').match(/^#\s+(.+)$/m)?.[1] ||
      clean.split('/').pop().replace(/\.md$/, ''),
    content: readFileSync(fullPath, 'utf8'),
    updatedAt: stats.mtime.toISOString(),
  }
}

export function writeArticle(path, content) {
  const { clean, fullPath } = resolveDocPath(path)
  mkdirSync(dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, String(content || ''), 'utf8')
  return readArticle(clean)
}

export function moveArticle(fromPath, toPath, title) {
  const from = resolveDocPath(fromPath)
  const to = resolveDocPath(toPath)
  if (from.clean === to.clean) return readArticle(from.clean)
  if (!existsSync(from.fullPath)) {
    const err = new Error(`源文章不存在：${from.clean}`)
    err.status = 404
    throw err
  }
  if (existsSync(to.fullPath)) {
    const err = new Error(`目标文章已存在：${to.clean}`)
    err.status = 409
    throw err
  }

  mkdirSync(dirname(to.fullPath), { recursive: true })
  renameSync(from.fullPath, to.fullPath)

  if (title) {
    const article = readArticle(to.clean)
    const content = article.content.match(/^#\s+.+$/m)
      ? article.content.replace(/^#\s+.+$/m, `# ${title}`)
      : `# ${title}\n\n${article.content}`
    writeArticle(to.clean, content)
  }

  return readArticle(to.clean)
}

export function deleteArticle(path) {
  const { clean, fullPath } = resolveDocPath(path)
  if (!existsSync(fullPath)) {
    const err = new Error('文章不存在')
    err.status = 404
    throw err
  }
  rmSync(fullPath)
  return { path: clean }
}

export function flattenTree(items = listTree()) {
  const result = []
  for (const item of items) {
    if (item.type === 'article') result.push(item)
    if (item.children) result.push(...flattenTree(item.children))
  }
  return result
}

export function relativeKnowledgeRoot() {
  return relative(process.cwd(), config.knowledgeRoot)
}
