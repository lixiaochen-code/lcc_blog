<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute, RouterLink, RouterView } from 'vue-router'
  import { useSession } from '../composables/useSession'

  const route = useRoute()
  const { can } = useSession()

  /** Sidebar items, filtered by permission. Keep label/perm/path in sync with `router/index.ts`. */
  const tabs = computed(() =>
    [
      { path: '/admin/users', label: '账号', perm: 'user:update' },
      { path: '/admin/roles', label: '角色', perm: 'role:assign' },
      { path: '/admin/mcp', label: 'MCP', perm: 'mcp:configure' },
      { path: '/admin/audit', label: '审计', perm: 'audit:view' },
    ].filter(item => can(item.perm))
  )

  // Suppress unused warning while keeping the import readable.
  void route
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-sidebar-head">
        <p>Admin</p>
        <strong>系统配置</strong>
      </div>
      <nav>
        <RouterLink
          v-for="tab in tabs"
          :key="tab.path"
          :to="tab.path"
          class="admin-nav-item"
          active-class="active"
        >
          {{ tab.label }}
        </RouterLink>
      </nav>
      <div v-if="!tabs.length" class="empty-state">当前账号没有任何管理权限。</div>
    </aside>

    <main class="admin-main">
      <RouterView />
    </main>
  </div>
</template>
