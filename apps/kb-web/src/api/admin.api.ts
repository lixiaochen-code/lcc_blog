import { request } from './http'
import type { McpServer, PermissionGroup, Role, User } from './types'

export const admin = {
  // ----- Roles & permissions -----
  permissionGroups: () => request<{ groups: PermissionGroup[] }>('/api/admin/permissions'),
  roles: () => request<{ items: Role[] }>('/api/admin/roles'),
  createRole: (payload: { name: string; description?: string; permissions: string[] }) =>
    request<Role>('/api/admin/roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateRole: (id: string, payload: Partial<Pick<Role, 'name' | 'description' | 'permissions'>>) =>
    request<Role>(`/api/admin/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteRole: (id: string) =>
    request<{ id: string }>(`/api/admin/roles/${id}`, { method: 'DELETE' }),

  // ----- Users -----
  users: () => request<{ items: User[] }>('/api/admin/users'),
  createUser: (payload: { username: string; password?: string; roleIds: string[] }) =>
    request<{ user: User; password: string }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateUser: (
    id: string,
    payload: { roleIds?: string[]; disabled?: boolean; resetPassword?: boolean }
  ) =>
    request<{ user: User; password?: string }>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteUser: (id: string) =>
    request<{ id: string }>(`/api/admin/users/${id}`, { method: 'DELETE' }),

  // ----- MCP servers -----
  mcpServers: () => request<{ items: McpServer[] }>('/api/admin/mcp'),
  createMcpServer: (payload: { name: string; type: 'http'; endpoint: string; enabled?: boolean }) =>
    request<McpServer>('/api/admin/mcp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateMcpServer: (
    id: string,
    payload: Partial<Pick<McpServer, 'name' | 'type' | 'endpoint' | 'enabled'>>
  ) =>
    request<McpServer>(`/api/admin/mcp/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteMcpServer: (id: string) =>
    request<{ id: string }>(`/api/admin/mcp/${id}`, { method: 'DELETE' }),
}
