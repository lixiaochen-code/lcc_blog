<script setup lang="ts">
  import { reactive } from 'vue'
  import { api, type McpServer } from '../api'

  const props = defineProps<{
    servers: McpServer[]
    canCreate: boolean
    canUpdate: boolean
    canDelete: boolean
  }>()

  const emit = defineEmits<{
    (e: 'refresh'): void
    (e: 'error', message: string): void
  }>()

  type ModalState = {
    open: boolean
    mode: 'create' | 'edit'
    targetId: string
    form: { name: string; endpoint: string; enabled: boolean }
    busy: boolean
    error: string
  }

  const modal = reactive<ModalState>({
    open: false,
    mode: 'create',
    targetId: '',
    form: { name: '', endpoint: '', enabled: true },
    busy: false,
    error: '',
  })

  const SYSTEM_MCP_ID = 'mcp_web_search'

  function openCreate(): void {
    modal.mode = 'create'
    modal.targetId = ''
    modal.form = { name: '', endpoint: '', enabled: true }
    modal.error = ''
    modal.open = true
  }

  function openEdit(server: McpServer): void {
    modal.mode = 'edit'
    modal.targetId = server.id
    modal.form = {
      name: server.name,
      endpoint: server.endpoint,
      enabled: server.enabled,
    }
    modal.error = ''
    modal.open = true
  }

  function close(): void {
    modal.open = false
  }

  async function submit(): Promise<void> {
    if (!modal.form.name.trim()) {
      modal.error = '请输入名称'
      return
    }
    modal.busy = true
    modal.error = ''
    try {
      if (modal.mode === 'create') {
        await api.createMcpServer({
          name: modal.form.name.trim(),
          type: 'http',
          endpoint: modal.form.endpoint.trim(),
          enabled: modal.form.enabled,
        })
      } else {
        await api.updateMcpServer(modal.targetId, {
          name: modal.form.name.trim(),
          endpoint: modal.form.endpoint.trim(),
          enabled: modal.form.enabled,
        })
      }
      modal.open = false
      emit('refresh')
    } catch (err) {
      modal.error = err instanceof Error ? err.message : '保存失败'
    } finally {
      modal.busy = false
    }
  }

  async function remove(server: McpServer): Promise<void> {
    if (server.id === SYSTEM_MCP_ID) return
    const ok = window.confirm(`确认删除 MCP「${server.name}」?`)
    if (!ok) return
    try {
      await api.deleteMcpServer(server.id)
      emit('refresh')
    } catch (err) {
      emit('error', err instanceof Error ? err.message : '删除失败')
    }
  }

  async function toggleEnabled(server: McpServer): Promise<void> {
    try {
      await api.updateMcpServer(server.id, { enabled: !server.enabled })
      emit('refresh')
    } catch (err) {
      emit('error', err instanceof Error ? err.message : '切换失败')
    }
  }

  // suppress unused-prop lint
  void props
</script>

<template>
  <section class="admin-block">
    <div class="block-toolbar">
      <div>
        <h2>MCP Server</h2>
        <p class="block-hint">配置外部 MCP HTTP 端点。`mcp_web_search` 是系统记录,可改不可删。</p>
      </div>
      <button v-if="canCreate" class="primary" @click="openCreate">新增 MCP</button>
    </div>

    <div class="data-card">
      <div class="data-row data-head">
        <span>名称</span>
        <span>Endpoint</span>
        <span>状态</span>
        <span>操作</span>
      </div>
      <div v-if="!servers.length" class="data-empty">暂无 MCP 配置</div>
      <div v-for="server in servers" :key="server.id" class="data-row">
        <div>
          <strong>{{ server.name }}</strong>
          <small v-if="server.id === SYSTEM_MCP_ID" class="badge">系统</small>
        </div>
        <code class="endpoint">{{ server.endpoint || '(未配置)' }}</code>
        <div class="cell-status">
          <span class="status-dot" :class="server.enabled ? 'on' : 'off'" />
          {{ server.enabled ? '启用中' : '已禁用' }}
        </div>
        <div class="cell-actions">
          <button v-if="canUpdate" @click="toggleEnabled(server)">
            {{ server.enabled ? '禁用' : '启用' }}
          </button>
          <button v-if="canUpdate" @click="openEdit(server)">编辑</button>
          <button
            v-if="canDelete && server.id !== SYSTEM_MCP_ID"
            class="danger"
            @click="remove(server)"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <div v-if="modal.open" class="modal-backdrop" @click.self="close">
      <form class="admin-modal" @submit.prevent="submit">
        <header>
          <h2>{{ modal.mode === 'create' ? '新增 MCP' : '编辑 MCP' }}</h2>
          <button type="button" class="plain icon" aria-label="关闭" @click="close">×</button>
        </header>

        <div class="modal-body">
          <label class="field">
            <span>名称</span>
            <input v-model="modal.form.name" placeholder="例如 Bing MCP" required />
          </label>

          <label class="field">
            <span>Endpoint URL</span>
            <input v-model="modal.form.endpoint" placeholder="https://example.com/mcp" type="url" />
            <small>留空表示暂未配置;有 enabled MCP 时 AI 检索会优先使用。</small>
          </label>

          <label class="check-row standalone">
            <input v-model="modal.form.enabled" type="checkbox" />
            <div>
              <strong>启用</strong>
              <small>禁用后此 MCP 在 AI 检索时被跳过</small>
            </div>
          </label>

          <p v-if="modal.error" class="error">{{ modal.error }}</p>
        </div>

        <footer>
          <button type="button" class="ghost" @click="close">取消</button>
          <button class="primary" :disabled="modal.busy">
            {{ modal.busy ? '保存中…' : '保存' }}
          </button>
        </footer>
      </form>
    </div>
  </section>
</template>

<style scoped>
  .endpoint {
    font-size: 12px;
    color: var(--color-text-muted, #888);
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .badge {
    margin-left: 6px;
  }
</style>
