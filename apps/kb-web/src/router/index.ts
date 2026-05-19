import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import WorkspaceShell from '../layouts/WorkspaceShell.vue'
import AdminShell from '../layouts/AdminShell.vue'

const UsersView = () => import('../views/admin/UsersView.vue')
const RolesView = () => import('../views/admin/RolesView.vue')
const McpView = () => import('../views/admin/McpView.vue')
const AuditView = () => import('../views/admin/AuditView.vue')

/**
 * Two top-level shells (mirrors Open WebUI's `/workspace` vs `/admin` split):
 *   - `/`         → creation surface (KB browser + AI panel)
 *   - `/admin/*`  → configuration surface (users / roles / mcp / audit)
 *
 * Page-level permission checks live in the views themselves; the AdminShell
 * filters its sidebar to hide tabs the user can't open. We deliberately do
 * NOT install a `beforeEach` guard — a user lacking permission lands on the
 * page and sees an empty-state message, which is friendlier than a redirect.
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: WorkspaceShell,
    meta: { title: 'LCC Knowledge' },
  },
  {
    path: '/admin',
    component: AdminShell,
    redirect: '/admin/users',
    children: [
      { path: 'users', component: UsersView, meta: { perm: 'user:update', title: '账号' } },
      { path: 'roles', component: RolesView, meta: { perm: 'role:assign', title: '角色' } },
      { path: 'mcp', component: McpView, meta: { perm: 'mcp:configure', title: 'MCP' } },
      { path: 'audit', component: AuditView, meta: { perm: 'audit:view', title: '审计' } },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
