<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { api, type Role, type User } from '../../api'
  import { useSession } from '../../composables/useSession'
  import UserManager from '../../components/UserManager.vue'

  const { session, can } = useSession()
  const users = ref<User[]>([])
  const roles = ref<Role[]>([])
  const error = ref('')

  async function refresh(): Promise<void> {
    error.value = ''
    try {
      if (can('user:update')) users.value = (await api.users()).items
      if (can('role:assign')) roles.value = (await api.roles()).items
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
      <h1>账号</h1>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <UserManager
      :users="users"
      :roles="roles"
      :current-user-id="session?.user.id || ''"
      :can-create="can('user:create')"
      :can-update="can('user:update')"
      :can-delete="can('user:delete')"
      @refresh="refresh"
      @error="onError"
    />
  </section>
</template>
