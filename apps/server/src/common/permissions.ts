export const PERMISSIONS = [
  // Knowledge base
  'kb:view',
  'kb:create',
  'kb:update',
  'kb:delete',
  'kb:move',
  // AI
  'ai:use',
  'ai:web',
  'ai:write_kb',
  'ai:auto_apply',
  // Admin
  'user:create',
  'user:update',
  'user:disable',
  'user:delete',
  'role:create',
  'role:update',
  'role:delete',
  'role:assign',
  'mcp:configure',
  'audit:view',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const PERMISSION_GROUPS: { name: string; permissions: Permission[] }[] = [
  { name: '知识库', permissions: ['kb:view', 'kb:create', 'kb:update', 'kb:delete', 'kb:move'] },
  { name: 'AI', permissions: ['ai:use', 'ai:web', 'ai:write_kb', 'ai:auto_apply'] },
  {
    name: '账号',
    permissions: ['user:create', 'user:update', 'user:disable', 'user:delete'],
  },
  {
    name: '角色',
    permissions: ['role:create', 'role:update', 'role:delete', 'role:assign'],
  },
  { name: '系统', permissions: ['mcp:configure', 'audit:view'] },
]
