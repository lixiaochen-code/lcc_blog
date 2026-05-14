import type { Permission } from '../common/permissions'

export interface UserRecord {
  id: string
  username: string
  passwordHash: string
  roleIds: string[]
  disabled: boolean
  createdAt: string
  updatedAt: string
}

export interface RoleRecord {
  id: string
  name: string
  description: string
  permissions: Permission[]
  system: boolean
  createdAt: string
  updatedAt: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  createdAt: string
  toolName?: string
  toolCallId?: string
}

export interface ConversationRecord {
  id: string
  userId: string
  title: string
  messages: ConversationMessage[]
  createdAt: string
  updatedAt: string
}

export interface McpServerRecord {
  id: string
  name: string
  type: 'http'
  enabled: boolean
  endpoint: string
  createdAt: string
  updatedAt: string
}

export interface AuditLogRecord {
  id: string
  actorId: string
  action: string
  detail: unknown
  createdAt: string
}

export interface StoreData {
  users: UserRecord[]
  roles: RoleRecord[]
  conversations: ConversationRecord[]
  mcpServers: McpServerRecord[]
  auditLogs: AuditLogRecord[]
}
