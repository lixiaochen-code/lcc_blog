<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useSession } from '../../composables/useSession'

  const { can } = useSession()
  const items = ref<
    { id: string; actorId: string; action: string; detail: unknown; createdAt: string }[]
  >([])
  const error = ref('')
  const loading = ref(false)

  async function refresh(): Promise<void> {
    if (!can('audit:view')) return
    loading.value = true
    error.value = ''
    try {
      // No api wrapper yet — admin audit lives under /api/admin/audit which we
      // haven't surfaced in api/admin.api.ts. Inline fetch is fine for now;
      // promote to api method when we want filtering/pagination.
      const token = localStorage.getItem('kb_token') || ''
      const res = await fetch('/api/admin/audit?limit=100', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : { items: [] }
      if (!res.ok) throw new Error(data.message || '加载失败')
      items.value = data.items || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  onMounted(refresh)
</script>

<template>
  <section class="admin-view">
    <div class="page-title">
      <p>Admin</p>
      <h1>审计日志</h1>
    </div>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="data-card">
      <div class="data-row data-head">
        <span>时间</span>
        <span>操作</span>
        <span>操作人</span>
        <span>详情</span>
      </div>
      <div v-if="loading" class="data-empty">加载中…</div>
      <div v-else-if="!items.length" class="data-empty">暂无审计日志</div>
      <div v-for="item in items" :key="item.id" class="data-row">
        <span class="muted">{{ new Date(item.createdAt).toLocaleString('zh-CN') }}</span>
        <code>{{ item.action }}</code>
        <span class="muted">{{ item.actorId }}</span>
        <code class="audit-detail">{{ JSON.stringify(item.detail) }}</code>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .audit-detail {
    max-width: 480px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
