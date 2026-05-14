import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
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
import { APP_CONFIG } from '../config/config.module'
import type { AppConfig } from '../config/app.config'
import type { Article, TreeItem } from './kb.types'

const TITLE_RE = /^#\s+(.+)$/m

/**
 * Filesystem-backed KB. Every path crossing the API boundary must be
 * laundered through `assertSafePath` first — path traversal is the only
 * bug class we treat as P0 (see AGENTS.md §4 "Path safety").
 */
@Injectable()
export class KbService {
  private readonly root: string

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.root = config.knowledgeRoot
    mkdirSync(this.root, { recursive: true })
  }

  // ---- safety ----

  /** Reject `..`, absolute paths, and non-`.md` files. */
  private assertSafePath(rawPath: string): string {
    const clean = normalize(String(rawPath || '').replace(/^\/+/, ''))
    if (!clean || clean === '.' || clean.startsWith('..') || clean.includes(`..${sep}`)) {
      throw new BadRequestException('非法知识库路径')
    }
    if (!clean.endsWith('.md')) {
      throw new BadRequestException('知识库文章必须是 .md 文件')
    }
    return clean
  }

  resolveDocPath(rawPath: string): { clean: string; fullPath: string } {
    const clean = this.assertSafePath(rawPath)
    return { clean, fullPath: join(this.root, clean) }
  }

  relativeKnowledgeRoot(): string {
    return relative(process.cwd(), this.root)
  }

  // ---- queries ----

  listTree(dir: string = this.root, base: string = ''): TreeItem[] {
    if (!existsSync(dir)) return []
    return readdirSync(dir)
      .filter(name => !name.startsWith('.'))
      .map((name): TreeItem | null => {
        const fullPath = join(dir, name)
        const stats = statSync(fullPath)
        const itemPath = base ? `${base}/${name}` : name

        if (stats.isDirectory()) {
          return {
            type: 'directory',
            name,
            path: itemPath,
            children: this.listTree(fullPath, itemPath),
          }
        }
        if (!name.endsWith('.md')) return null

        const content = readFileSync(fullPath, 'utf8')
        const title = content.match(TITLE_RE)?.[1] || name.replace(/\.md$/, '')
        return {
          type: 'article',
          name,
          title,
          path: itemPath,
          updatedAt: stats.mtime.toISOString(),
        }
      })
      .filter((item): item is TreeItem => item !== null)
      .sort((a, b) =>
        a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'directory' ? -1 : 1
      )
  }

  flattenTree(items: TreeItem[] = this.listTree()): Article[] {
    const result: Article[] = []
    for (const item of items) {
      if (item.type === 'article') {
        // hydrate full body for downstream consumers (search, AI)
        try {
          result.push(this.readArticle(item.path))
        } catch {
          // skip articles that vanished mid-walk
        }
      } else {
        result.push(...this.flattenTree(item.children))
      }
    }
    return result
  }

  readArticle(rawPath: string): Article {
    const { clean, fullPath } = this.resolveDocPath(rawPath)
    if (!existsSync(fullPath)) throw new NotFoundException('文章不存在')
    const stats = statSync(fullPath)
    const content = readFileSync(fullPath, 'utf8')
    const fallback = clean.split('/').pop()?.replace(/\.md$/, '') ?? clean
    return {
      path: clean,
      title: content.match(TITLE_RE)?.[1] || fallback,
      content,
      updatedAt: stats.mtime.toISOString(),
    }
  }

  // ---- mutations ----

  writeArticle(rawPath: string, content: string): Article {
    const { clean, fullPath } = this.resolveDocPath(rawPath)
    mkdirSync(dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, String(content ?? ''), 'utf8')
    return this.readArticle(clean)
  }

  moveArticle(fromPath: string, toPath: string, title?: string): Article {
    const from = this.resolveDocPath(fromPath)
    const to = this.resolveDocPath(toPath)
    if (from.clean === to.clean) return this.readArticle(from.clean)
    if (!existsSync(from.fullPath)) {
      throw new NotFoundException(`源文章不存在：${from.clean}`)
    }
    if (existsSync(to.fullPath)) {
      throw new ConflictException(`目标文章已存在：${to.clean}`)
    }

    mkdirSync(dirname(to.fullPath), { recursive: true })
    renameSync(from.fullPath, to.fullPath)

    if (title) {
      const article = this.readArticle(to.clean)
      const next = TITLE_RE.test(article.content)
        ? article.content.replace(TITLE_RE, `# ${title}`)
        : `# ${title}\n\n${article.content}`
      this.writeArticle(to.clean, next)
    }

    return this.readArticle(to.clean)
  }

  deleteArticle(rawPath: string): { path: string } {
    const { clean, fullPath } = this.resolveDocPath(rawPath)
    if (!existsSync(fullPath)) throw new NotFoundException('文章不存在')
    rmSync(fullPath)
    return { path: clean }
  }
}
