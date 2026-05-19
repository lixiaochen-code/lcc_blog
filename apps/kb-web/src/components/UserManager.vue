<script setup lang="ts">
  import { reactive } from 'vue'
  import { api, type Role, type User } from '../api'

  const props = defineProps<{
    users: User[]
    roles: Role[]
    currentUserId: string
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
    form: {
      username: string
      roleIds: string[]
      disabled: boolean
      resetPassword: boolean
    }
    busy: boolean
    error: string
    issuedPassword: string
  }

  const modal = reactive<ModalState>({
    open: false,
    mode: 'create',
    targetId: '',
    form: { username: '', roleIds: [], disabled: false, resetPassword: false },
    busy: false,
    error: '',
    issuedPassword: '',
  })

  function defaultRoleIds(): string[] {
    const reader = props.roles.find(role => role.permissions.includes('kb:view') && !role.system)
    if (reader) return [reader.id]
    const fallback = props.roles.find(role => !role.system) || props.roles[0]
    return fallback ? [fallback.id] : []
  }

  function openCreate(): void {
    modal.mode = 'create'
    modal.targetId = ''
    modal.form = {
      username: '',
      roleIds: defaultRoleIds(),
      disabled: false,
      resetPassword: false,
    }
    modal.error = ''
    modal.issuedPassword = ''
    modal.open = true
  }

  function openEdit(user: User): void {
    modal.mode = 'edit'
    modal.targetId = user.id
    modal.form = {
      username: user.username,
      roleIds: [...user.roleIds],
      disabled: user.disabled,
      resetPassword: false,
    }
    modal.error = ''
    modal.issuedPassword = ''
    modal.open = true
  }

  function close(): void {
    modal.open = false
  }

  function toggleRole(roleId: string, checked: boolean): void {
    const set = new Set(modal.form.roleIds)
    if (checked) set.add(roleId)
    else set.delete(roleId)
    modal.form.roleIds = [...set]
  }

  async function submit(): Promise<void> {
    if (!modal.form.username.trim()) {
      modal.error = '请输入用户名'
      return
    }
    if (!modal.form.roleIds.length) {
      modal.error = '至少选择一个角色'
      return
    }
    modal.busy = true
    modal.error = ''
    try {
      if (modal.mode === 'create') {
        const result = await api.createUser({
          username: modal.form.username.trim(),
          roleIds: modal.form.roleIds,
        })
        modal.issuedPassword = result.password
      } else {
        const result = await api.updateUser(modal.targetId, {
          roleIds: modal.form.roleIds,
          disabled: modal.form.disabled,
          resetPassword: modal.form.resetPassword,
        })
        if (result.password) modal.issuedPassword = result.password
        else modal.open = false
      }
      emit('refresh')
    } catch (err) {
      modal.error = err instanceof Error ? err.message : '保存失败'
    } finally {
      modal.busy = false
    }
  }

  async function remove(user: User): Promise<void> {
    if (user.id === props.currentUserId) return
    const ok = window.confirm(`确认删除账号 ${user.username}？此操作不可恢复。`)
    if (!ok) return
    try {
      await api.deleteUser(user.id)
      emit('refresh')
    } catch (err) {
      emit('error', err instanceof Error ? err.message : '删除失败')
    }
  }

  function roleNameOf(roleId: string): string {
    return props.roles.find(role => role.id === roleId)?.name || roleId
  }

  defineExpose({ openCreate })
</script>

<template>
  <section class="admin-block">
    <div class="block-toolbar">
      <div>
        <h2>账号</h2>
        <p class="block-hint">管理可登录的账号、为其分配角色，或重置密码。</p>
      </div>
      <button v-if="canCreate" class="primary" @click="openCreate">新增账号</button>
    </div>

    <div class="data-card">
      <div class="data-row data-head">
        <span>账号</span>
        <span>角色</span>
        <span>状态</span>
        <span>操作</span>
      </div>
      <div v-if="!users.length" class="data-empty">暂无账号</div>
      <div v-for="user in users" :key="user.id" class="data-row">
        <div class="cell-user">
          <span class="avatar">{{ user.username.slice(0, 2).toUpperCase() }}</span>
          <div>
            <strong>{{ user.username }}</strong>
            <small v-if="user.id === currentUserId">当前登录</small>
          </div>
        </div>
        <div class="cell-roles">
          <span v-for="roleId in user.roleIds" :key="roleId" class="role-chip">
            {{ roleNameOf(roleId) }}
          </span>
          <span v-if="!user.roleIds.length" class="muted">未分配</span>
        </div>
        <div class="cell-status">
          <span class="status-dot" :class="user.disabled ? 'off' : 'on'" />
          {{ user.disabled ? '已停用' : '启用中' }}
        </div>
        <div class="cell-actions">
          <button v-if="canUpdate" @click="openEdit(user)">编辑</button>
          <button
            v-if="canDelete && user.id !== currentUserId"
            class="danger"
            @click="remove(user)"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <div v-if="modal.open" class="modal-backdrop" @click.self="close">
      <form class="admin-modal" @submit.prevent="submit">
        <header>
          <h2>{{ modal.mode === 'create' ? '新增账号' : '编辑账号' }}</h2>
          <button type="button" class="plain icon" aria-label="关闭" @click="close">×</button>
        </header>

        <div class="modal-body">
          <label class="field">
            <span>用户名</span>
            <input
              v-model="modal.form.username"
              :disabled="modal.mode === 'edit'"
              autocomplete="off"
              placeholder="例如 alice"
              required
            />
          </label>

          <fieldset class="field">
            <legend>角色</legend>
            <p v-if="!roles.length" class="muted">暂无可选角色</p>
            <div v-else class="check-grid">
              <label v-for="role in roles" :key="role.id" class="check-row">
                <input
                  type="checkbox"
                  :value="role.id"
                  :checked="modal.form.roleIds.includes(role.id)"
                  @change="toggleRole(role.id, ($event.target as HTMLInputElement).checked)"
                />
                <div>
                  <strong>{{ role.name }}</strong>
                  <small>{{ role.description || '—' }}</small>
                </div>
              </label>
            </div>
          </fieldset>

          <label v-if="modal.mode === 'edit'" class="check-row standalone">
            <input v-model="modal.form.disabled" type="checkbox" />
            <div>
              <strong>停用账号</strong>
              <small>停用后该账号无法登录</small>
            </div>
          </label>

          <label v-if="modal.mode === 'edit'" class="check-row standalone">
            <input v-model="modal.form.resetPassword" type="checkbox" />
            <div>
              <strong>重置密码</strong>
              <small>勾选后保存时生成新密码</small>
            </div>
          </label>

          <div v-if="modal.issuedPassword" class="issued-password">
            <strong>初始密码</strong>
            <code>{{ modal.issuedPassword }}</code>
            <p>密码仅显示一次，请立即妥善保管。</p>
          </div>

          <p v-if="modal.error" class="error">{{ modal.error }}</p>
        </div>

        <footer>
          <button type="button" class="ghost" @click="close">
            {{ modal.issuedPassword ? '关闭' : '取消' }}
          </button>
          <button v-if="!modal.issuedPassword" class="primary" :disabled="modal.busy">
            {{ modal.busy ? '保存中…' : '保存' }}
          </button>
        </footer>
      </form>
    </div>
  </section>
</template>
