<script setup lang="ts">
  import type { Article } from '../api'
  import { renderMarkdown } from '../markdown'

  const props = defineProps<{
    hasSession: boolean
    activeArticle: Article | null
    editorContent: string
    editing: boolean
    canUpdate: boolean
    canDelete: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:editorContent', value: string): void
    (e: 'update:editing', value: boolean): void
    (e: 'save'): void
    (e: 'remove'): void
    (e: 'clear'): void
    (e: 'open-login'): void
  }>()

  function toggleEdit(): void {
    emit('update:editing', !props.editing)
  }

  function onEditorInput(event: Event): void {
    emit('update:editorContent', (event.target as HTMLTextAreaElement).value)
  }
</script>

<template>
  <section v-if="!hasSession" class="welcome">
    <p>Private Knowledge Base</p>
    <h1>登录后进入可迭代知识库</h1>
    <button class="primary large" @click="emit('open-login')">登录知识库</button>
  </section>

  <section v-else class="doc-view">
    <div class="doc-toolbar">
      <div>
        <p>{{ activeArticle?.path || '请选择文章' }}</p>
        <h1>{{ activeArticle?.title || '知识库' }}</h1>
      </div>
      <div v-if="activeArticle" class="toolbar-actions">
        <button v-if="canUpdate" @click="toggleEdit">{{ editing ? '预览' : '编辑' }}</button>
        <button v-if="canUpdate" class="primary" @click="emit('save')">保存</button>
        <button @click="emit('clear')">取消选择</button>
        <button v-if="canDelete" class="danger" @click="emit('remove')">删除</button>
      </div>
    </div>

    <textarea
      v-if="editing && activeArticle"
      :value="editorContent"
      class="editor"
      spellcheck="false"
      @input="onEditorInput"
    />
    <article
      v-else-if="activeArticle"
      class="markdown-body"
      v-html="renderMarkdown(activeArticle.content)"
    />
    <div v-else class="empty-doc">从左侧选择一篇文章，或者新增一篇 Markdown。</div>
  </section>
</template>
