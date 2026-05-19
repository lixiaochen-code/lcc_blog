<script setup lang="ts">
  import { ref } from 'vue'

  const props = defineProps<{
    open: boolean
    error?: string
  }>()

  const emit = defineEmits<{
    (e: 'submit', payload: { username: string; password: string }): void
    (e: 'close'): void
  }>()

  const form = ref({ username: 'superadmin', password: 'Admin@123456' })

  function onSubmit(): void {
    emit('submit', { username: form.value.username, password: form.value.password })
  }

  // suppress unused-prop lint
  void props
</script>

<template>
  <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
    <form class="login-modal" @submit.prevent="onSubmit">
      <h2>登录知识库</h2>
      <label>
        账号
        <input v-model="form.username" autocomplete="username" />
      </label>
      <label>
        密码
        <input v-model="form.password" type="password" autocomplete="current-password" />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="primary large">登录</button>
      <small>默认超管：superadmin / Admin@123456</small>
    </form>
  </div>
</template>
