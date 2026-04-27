import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { config } from './config.js'
import { hashPassword } from './auth.js'

export const permissions = [
  'kb:view',
  'kb:create',
  'kb:update',
  'kb:delete',
  'ai:use',
  'ai:write_kb',
  'mcp:configure',
  'user:create',
  'user:update',
  'user:disable',
  'user:delete',
  'role:assign',
]

const now = () => new Date().toISOString()

const initialStore = () => ({
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
      description: '拥有知识库、AI、MCP、账号与角色管理全部权限',
      permissions,
      system: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'r_editor',
      name: '编辑',
      description: '可查看、维护知识库并使用 AI 草稿',
      permissions: ['kb:view', 'kb:create', 'kb:update', 'kb:delete', 'ai:use', 'ai:write_kb'],
      system: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'r_reader',
      name: '只读',
      description: '只允许查看知识库',
      permissions: ['kb:view'],
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

export class JsonStore {
  constructor(file = config.dataFile) {
    this.file = file
    mkdirSync(dirname(file), { recursive: true })
    if (!existsSync(file)) this.write(initialStore())
  }

  read() {
    return JSON.parse(readFileSync(this.file, 'utf8'))
  }

  write(data) {
    writeFileSync(this.file, JSON.stringify(data, null, 2))
  }

  mutate(fn) {
    const data = this.read()
    const result = fn(data)
    this.write(data)
    return result
  }
}
