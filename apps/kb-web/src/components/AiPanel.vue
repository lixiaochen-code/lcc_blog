<script setup lang="ts">
  import type { ChatMessage, Draft } from '../api'
  import {
    canApplyDraft,
    displayContent,
    draftActionLabel,
    draftOperationLabel,
    draftTargetLabel,
  } from '../composables/useAi'

  const props = defineProps<{
    activePath: string
    messages: ChatMessage[]
    sending: boolean
    applyingDraft: boolean
    prompt: string
    useWebSearch: boolean
    autoApply: boolean
    canWriteKb: boolean
    canAutoApply: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:prompt', value: string): void
    (e: 'update:useWebSearch', value: boolean): void
    (e: 'update:autoApply', value: boolean): void
    (e: 'close'): void
    (e: 'clear-active'): void
    (e: 'send'): void
    (e: 'stop'): void
    (e: 'apply-draft', draft: Draft): void
  }>()

  function onPromptInput(event: Event): void {
    emit('update:prompt', (event.target as HTMLTextAreaElement).value)
  }

  function onWebSearchToggle(event: Event): void {
    emit('update:useWebSearch', (event.target as HTMLInputElement).checked)
  }

  function onAutoApplyToggle(event: Event): void {
    emit('update:autoApply', (event.target as HTMLInputElement).checked)
  }

  // suppress unused-prop lint
  void props
</script>

<template>
  <aside class="ai-panel">
    <div class="ai-head">
      <div>
        <strong>AI 草稿助手</strong>
        <div class="ai-context">
          <span>{{ activePath || '未选择文章' }}</span>
          <button
            v-if="activePath"
            class="plain context-clear"
            type="button"
            title="取消绑定当前文章"
            @click="emit('clear-active')"
          >
            取消绑定
          </button>
        </div>
      </div>
      <button title="收起" @click="emit('close')">×</button>
    </div>

    <div class="messages">
      <div v-for="(message, index) in messages" :key="index" class="message" :class="message.role">
        <div v-if="message.streaming && !message.content" class="typing-row">
          <span></span>
          <span></span>
          <span></span>
          正在组织回答
        </div>
        <div class="message-content markdown-body compact" v-html="displayContent(message)" />
        <details v-if="message.toolCalls?.length" class="tool-chain" open>
          <summary>工具调用链</summary>
          <ol>
            <li
              v-for="tool in message.toolCalls"
              :key="`${tool.name}-${tool.detail}`"
              :class="tool.status"
            >
              <strong>{{ tool.name }}</strong>
              <span>{{ tool.detail }}</span>
            </li>
          </ol>
        </details>
        <details v-if="message.reasoning?.length" class="reasoning-box">
          <summary>思考摘要</summary>
          <ol>
            <li v-for="item in message.reasoning" :key="item">{{ item }}</li>
          </ol>
        </details>
        <div v-if="message.draft" class="draft-box">
          <div class="draft-meta">
            <span>{{ draftOperationLabel(message.draft.operation) }}</span>
            <strong>{{ draftTargetLabel(message.draft) }}</strong>
          </div>
          <pre v-if="message.draft.content">{{ message.draft.content }}</pre>
          <button
            v-if="canWriteKb && canApplyDraft(message.draft)"
            :class="message.draft.operation === 'delete' ? 'danger' : 'primary'"
            :disabled="applyingDraft"
            @click="emit('apply-draft', message.draft)"
          >
            {{ draftActionLabel(message.draft) }}
          </button>
        </div>
        <div v-if="message.sources?.length" class="source-list">
          <a
            v-for="source in message.sources"
            :key="source.url || source.title"
            :href="source.url"
            target="_blank"
            rel="noreferrer"
          >
            <strong>{{ source.title }}</strong>
            <span>{{ source.snippet }}</span>
          </a>
        </div>
      </div>
    </div>

    <form class="composer" @submit.prevent="emit('send')">
      <div class="composer-toggles">
        <label class="search-toggle">
          <input type="checkbox" :checked="useWebSearch" @change="onWebSearchToggle" />
          允许网络检索
        </label>
        <label class="search-toggle" :class="{ disabled: !canAutoApply }">
          <input
            type="checkbox"
            :checked="autoApply"
            :disabled="!canAutoApply"
            @change="onAutoApplyToggle"
          />
          <span :title="canAutoApply ? '关掉则改成草稿模式,需点确认' : '当前账号没有自动写入权限'">
            一键完成（自动写入）
          </span>
        </label>
      </div>
      <textarea
        :value="prompt"
        placeholder="让 AI 阅读、撰写或整理知识库……"
        @input="onPromptInput"
        @keydown.enter.meta.prevent="emit('send')"
        @keydown.enter.ctrl.prevent="emit('send')"
      />
      <div class="composer-actions">
        <span class="hint">⌘/Ctrl + Enter 发送 · Shift + Enter 换行</span>
        <button v-if="sending" type="button" class="ghost" @click="emit('stop')">停止</button>
        <button class="primary" :disabled="sending || !prompt.trim()">发送</button>
      </div>
    </form>
  </aside>
</template>
