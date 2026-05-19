<script setup lang="ts">
  import { reactive } from 'vue'
  import { api, type PermissionGroup, type Role } from '../api'

  const props = defineProps<{
    roles: Role[]
    permissionGroups: PermissionGroup[]
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
      name: string
      description: string
      permissions: string[]
      system: boolean
    }
    busy: boolean
    error: string
  }

  const modal = reactive<ModalState>({
    open: false,
    mode: 'create',
    targetId: '',
    form: { name: '', description: '', permissions: [], system: false },
    busy: false,
    error: '',
  })

  function openCreate(): void {
    modal.mode = 'create'
    modal.targetId = ''
    modal.form = { name: '', description: '', permissions: [], system: false }
    modal.error = ''
    modal.open = true
  }

  function openEdit(role: Role): void {
    modal.mode = 'edit'
    modal.targetId = role.id
    modal.form = {
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
      system: Boolean(role.system),
    }
    modal.error = ''
    modal.open = true
  }

  function close(): void {
    modal.open = false
  }

  function togglePermission(permission: string, checked: boolean): void {
    const set = new Set(modal.form.permissions)
    if (checked) set.add(permission)
    else set.delete(permission)
    modal.form.permissions = [...set]
  }

  function allSelected(group: string[]): boolean {
    return group.every(item => modal.form.permissions.includes(item))
  }

  function toggleGroupPermissions(group: string[]): void {
    const everyOn = allSelected(group)
    const set = new Set(modal.form.permissions)
    for (const item of group) {
      if (everyOn) set.delete(item)
      else set.add(item)
    }
    modal.form.permissions = [...set]
  }

  async function submit(): Promise<void> {
    if (!modal.form.name.trim()) {
      modal.error = '请输入角色名称'
      return
    }
    modal.busy = true
    modal.error = ''
    try {
      if (modal.mode === 'create') {
        await api.createRole({
          name: modal.form.name.trim(),
          description: modal.form.description.trim(),
          permissions: modal.form.permissions,
        })
      } else if (modal.form.system) {
        // System role: only permissions are mutable.
        await api.updateRole(modal.targetId, {
          permissions: modal.form.permissions,
        })
      } else {
        await api.updateRole(modal.targetId, {
          name: modal.form.name.trim(),
          description: modal.form.description.trim(),
          permissions: modal.form.permissions,
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

  async function remove(role: Role): Promise<void> {
    if (role.system) return
    const ok = window.confirm(`确认删除角色「${role.name}」？`)
    if (!ok) return
    try {
      await api.deleteRole(role.id)
      emit('refresh')
    } catch (err) {
      emit('error', err instanceof Error ? err.message : '删除失败')
    }
  }

  // suppress unused-prop lint
  void props
</script>

<template>
  <section class="admin-block">
    <div class="block-toolbar">
      <div>
        <h2>角色</h2>
        <p class="block-hint">每个角色对应一组权限。系统角色（超管/编辑/只读）不可删除。</p>
      </div>
      <button v-if="canCreate" class="primary" @click="openCreate">新增角色</button>
    </div>

    <div v-if="!permissionGroups.length" class="data-empty">权限元数据加载中…</div>
    <div v-else class="role-grid">
      <article
        v-for="role in roles"
        :key="role.id"
        class="role-card"
        :class="{ 'is-system': role.system }"
      >
        <header>
          <div>
            <strong>{{ role.name }}</strong>
            <span v-if="role.system" class="badge">系统</span>
          </div>
          <div class="role-card-actions">
            <button v-if="canUpdate" @click="openEdit(role)">编辑</button>
            <button v-if="canDelete && !role.system" class="danger" @click="remove(role)">
              删除
            </button>
          </div>
        </header>
        <p>{{ role.description || '—' }}</p>
        <div class="permission-summary">
          <span class="muted">{{ role.permissions.length }} 项权限</span>
          <div class="permission-chips">
            <span v-for="p in role.permissions.slice(0, 6)" :key="p">{{ p }}</span>
            <span v-if="role.permissions.length > 6" class="more">
              +{{ role.permissions.length - 6 }}
            </span>
          </div>
        </div>
      </article>
    </div>

    <div v-if="modal.open" class="modal-backdrop" @click.self="close">
      <form class="admin-modal wide" @submit.prevent="submit">
        <header>
          <h2>
            {{ modal.mode === 'create' ? '新增角色' : '编辑角色' }}
            <span v-if="modal.form.system" class="badge">系统</span>
          </h2>
          <button type="button" class="plain icon" aria-label="关闭" @click="close">×</button>
        </header>

        <div class="modal-body">
          <label class="field">
            <span>名称</span>
            <input
              v-model="modal.form.name"
              :disabled="modal.form.system"
              placeholder="例如 编辑"
              required
            />
            <small v-if="modal.form.system">系统角色不可改名</small>
          </label>

          <label class="field">
            <span>描述</span>
            <input
              v-model="modal.form.description"
              :disabled="modal.form.system"
              placeholder="一句话说明这个角色的职责"
            />
            <small v-if="modal.form.system">系统角色不可改描述</small>
          </label>

          <fieldset class="field">
            <legend>
              权限
              <span class="muted">{{ modal.form.permissions.length }} 项已选</span>
            </legend>
            <div v-if="!permissionGroups.length" class="muted">权限元数据加载中…</div>
            <div v-else class="permission-matrix">
              <section v-for="group in permissionGroups" :key="group.name">
                <header>
                  <strong>{{ group.name }}</strong>
                  <button
                    type="button"
                    class="plain"
                    @click="toggleGroupPermissions(group.permissions)"
                  >
                    {{ allSelected(group.permissions) ? '全部取消' : '全部勾选' }}
                  </button>
                </header>
                <div class="check-grid">
                  <label v-for="p in group.permissions" :key="p" class="check-row compact">
                    <input
                      type="checkbox"
                      :value="p"
                      :checked="modal.form.permissions.includes(p)"
                      @change="togglePermission(p, ($event.target as HTMLInputElement).checked)"
                    />
                    <code>{{ p }}</code>
                  </label>
                </div>
              </section>
            </div>
          </fieldset>

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
