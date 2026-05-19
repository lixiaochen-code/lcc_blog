<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { api, type PermissionGroup, type Role } from '../../api'
  import { useSession } from '../../composables/useSession'
  import RoleManager from '../../components/RoleManager.vue'

  const { can } = useSession()
  const roles = ref<Role[]>([])
  const permissionGroups = ref<PermissionGroup[]>([])
  const error = ref('')

  async function refresh(): Promise<void> {
    error.value = ''
    try {
      const [rolesResp, permResp] = await Promise.all([api.roles(), api.permissionGroups()])
      roles.value = rolesResp.items
      permissionGroups.value = permResp.groups
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
      <h1>角色</h1>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <RoleManager
      :roles="roles"
      :permission-groups="permissionGroups"
      :can-create="can('role:create')"
      :can-update="can('role:update')"
      :can-delete="can('role:delete')"
      @refresh="refresh"
      @error="onError"
    />
  </section>
</template>
