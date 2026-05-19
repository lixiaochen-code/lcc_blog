<template>
  <div class="kb-shell" :class="{ 'ai-open': aiOpen, 'admin-mode': isAdminRoute }">
    <header class="kb-header">
      <div class="brand">
        <span class="brand-mark">L</span>
        <div>
          <strong>LCC Knowledge</strong>
          <small>personal · markdown</small>
        </div>
      </div>

      <nav class="top-nav">
        <RouterLink to="/" :class="{ active: !isAdminRoute }">文档</RouterLink>
        <RouterLink v-if="hasAnyAdminPerm" to="/admin" :class="{ active: isAdminRoute }">
          管理
        </RouterLink>
      </nav>

      <div class="header-actions">
        <button
          v-if="session && can('ai:use') && !isAdminRoute"
          class="ai-toggle"
          :class="{ active: aiOpen }"
          @click="aiOpen = !aiOpen"
        >
          AI 面板
        </button>
        <button
          v-else-if="!session && !isAdminRoute"
          class="ai-toggle ghost"
          @click="loginOpen = true"
        >
          登录使用 AI
        </button>
        <span v-if="session" class="user-chip">{{ session.user.username }}</span>
        <button v-if="session" class="plain" @click="onLogout">退出</button>
        <button v-else class="primary" @click="loginOpen = true">登录</button>
      </div>
    </header>

    <RouterView @open-login="loginOpen = true" />

    <LoginModal :open="loginOpen" :error="error" @close="loginOpen = false" @submit="onLogin" />
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
  import { useSession } from './composables/useSession'
  import { useKb } from './composables/useKb'
  import { useAi } from './composables/useAi'
  import LoginModal from './components/LoginModal.vue'

  const route = useRoute()
  const router = useRouter()
  const { session, error, can, login, logout, bootstrap } = useSession()
  const { tree, refreshTree, clearActiveArticle } = useKb()
  const { aiOpen, resetAi } = useAi()

  const loginOpen = ref(false)

  const isAdminRoute = computed(() => route.path.startsWith('/admin'))

  /** Whether to render the top-level "管理" nav link. */
  const hasAnyAdminPerm = computed(
    () => can('user:update') || can('role:assign') || can('mcp:configure') || can('audit:view')
  )

  async function onLogin(payload: { username: string; password: string }): Promise<void> {
    try {
      await login(payload.username, payload.password)
      loginOpen.value = false
      await refreshTree()
    } catch {
      /* error is already in `error` ref */
    }
  }

  async function onLogout(): Promise<void> {
    logout()
    tree.value = []
    clearActiveArticle()
    resetAi()
    // Drop the user back to the workspace shell so they don't sit on a
    // permission-gated admin page after losing their session.
    if (isAdminRoute.value) await router.replace('/')
  }

  onMounted(async () => {
    await bootstrap()
    if (session.value) {
      await refreshTree()
    }
  })
</script>
