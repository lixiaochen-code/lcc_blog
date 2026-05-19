export type Role = {
  id: string
  name: string
  description: string
  permissions: string[]
  system?: boolean
  createdAt?: string
  updatedAt?: string
}

export type User = {
  id: string
  username: string
  roleIds: string[]
  disabled: boolean
  createdAt?: string
  updatedAt?: string
}

export type PermissionGroup = {
  name: string
  permissions: string[]
}

export type SessionUser = {
  user: User
  roles: Role[]
  permissions: string[]
}

export type TreeItem = {
  type: 'directory' | 'article'
  name: string
  title?: string
  path: string
  children?: TreeItem[]
}

export type Article = {
  path: string
  title: string
  content: string
  updatedAt: string
}

export type Draft = {
  operation: 'create' | 'update' | 'delete' | 'organize'
  path: string
  content: string
  actions?: {
    type: 'move'
    from: string
    to: string
    title?: string
  }[]
}

export type SearchSource = {
  title: string
  url: string
  snippet: string
}

export type McpServer = {
  id: string
  name: string
  type: 'http'
  enabled: boolean
  endpoint: string
  createdAt?: string
  updatedAt?: string
}

export type ToolStep = {
  name: string
  status: 'running' | 'done' | 'error'
  detail: string
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  toolCalls?: ToolStep[]
  reasoning?: string[]
  draft?: Draft
  sources?: SearchSource[]
}
