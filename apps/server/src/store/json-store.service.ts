import { Inject, Injectable } from '@nestjs/common'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { APP_CONFIG } from '../config/config.module'
import type { AppConfig } from '../config/app.config'
import { PERMISSIONS, type Permission } from '../common/permissions'
import { hashPassword } from '../common/utils/password'
import type { StoreData } from './store.types'

const now = () => new Date().toISOString()

const buildInitialStore = (): StoreData => ({
  users: [
    {
      id: 'u_super',
      username: 'superadmin',
      passwordHash: hashPassword('Admin@123456'),
      roleIds: ['r_super'],
      disabled: false,
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  roles: [
    {
      id: 'r_super',
      name: '超管',
      description: '拥有全部权限',
      permissions: [...PERMISSIONS] as Permission[],
      system: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'r_editor',
      name: '编辑',
      description: '维护知识库 + 使用 AI（草稿确认模式）',
      permissions: [
        'kb:view',
        'kb:create',
        'kb:update',
        'kb:delete',
        'kb:move',
        'ai:use',
        'ai:web',
        'ai:write_kb',
      ],
      system: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'r_reader',
      name: '只读',
      description: '查看知识库 + 使用 AI 问答',
      permissions: ['kb:view', 'ai:use'],
      system: false,
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  conversations: [],
  mcpServers: [
    {
      id: 'mcp_web_search',
      name: '基础网络检索',
      type: 'http',
      enabled: true,
      endpoint: '',
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  auditLogs: [],
})

/**
 * JSON-backed store. The interface is small (read / mutate) on purpose —
 * swapping to a real DB later means replacing this one class without
 * touching consumers. Migrations live in `migrate()`: every read passes
 * through it so adding new fields to existing dev stores is safe.
 */
@Injectable()
export class JsonStoreService {
  private readonly file: string

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.file = config.dataFile
    mkdirSync(dirname(this.file), { recursive: true })
    if (!existsSync(this.file)) this.writeRaw(buildInitialStore())
  }

  read(): StoreData {
    const raw = JSON.parse(readFileSync(this.file, 'utf8')) as Partial<StoreData>
    return this.migrate(raw)
  }

  mutate<T>(fn: (data: StoreData) => T): T {
    const data = this.read()
    const result = fn(data)
    this.writeRaw(data)
    return result
  }

  private writeRaw(data: StoreData): void {
    writeFileSync(this.file, JSON.stringify(data, null, 2))
  }

  // Forward-compatible: add new fields without rewriting existing stores.
  private migrate(raw: Partial<StoreData>): StoreData {
    const initial = buildInitialStore()
    return {
      users: raw.users ?? initial.users,
      roles: raw.roles ?? initial.roles,
      conversations: raw.conversations ?? [],
      mcpServers: raw.mcpServers ?? initial.mcpServers,
      auditLogs: raw.auditLogs ?? [],
    }
  }
}
