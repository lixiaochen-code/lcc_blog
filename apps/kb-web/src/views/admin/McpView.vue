<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { api, type McpServer } from '../../api'
  import { useSession } from '../../composables/useSession'
  import McpManager from '../../components/McpManager.vue'

  const { can } = useSession()
  const servers = ref<McpServer[]>([])
  const error = ref('')

  async function refresh(): Promise<void> {
    error.value = ''
    try {
      servers.value = (await api.mcpServers()).items
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载失败'
    }
  }

  function onError(message: string): void {
    error.value = message
  }

  onMounted(refresh)
</script>

<template>
  <section class="admin-view">
    <div class="page-title">
      <p>Admin</p>
      <h1>MCP Server</h1>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <McpManager
      :servers="servers"
      :can-create="can('mcp:configure')"
      :can-update="can('mcp:configure')"
      :can-delete="can('mcp:configure')"
      @refresh="refresh"
      @error="onError"
    />
  </section>
</template>
