<script setup lang="ts">
  import { useSession } from '../composables/useSession'
  import { useKb } from '../composables/useKb'
  import { useAi } from '../composables/useAi'
  import TreeList from '../components/TreeList.vue'
  import Workspace from '../components/Workspace.vue'
  import AiPanel from '../components/AiPanel.vue'

  const { session, can } = useSession()
  const {
    tree,
    activePath,
    activeArticle,
    editorContent,
    editing,
    refreshTree,
    loadArticle,
    selectArticle,
    clearActiveArticle,
    startCreate,
    saveArticle,
    removeArticle,
  } = useKb()
  const {
    messages,
    prompt,
    sending,
    applyingDraft,
    useWebSearch,
    autoApply,
    aiOpen,
    sendMessage,
    stopGenerating,
    applyDraft,
  } = useAi()

  async function onSelect(path: string): Promise<void> {
    await selectArticle(path)
  }

  async function onSend(): Promise<void> {
    await sendMessage(activePath.value)
  }

  async function onApplyDraft(draft: Parameters<typeof applyDraft>[0]): Promise<void> {
    await applyDraft(draft, {
      refreshTree,
      loadArticle,
      clearActiveArticle,
      activePath,
    })
  }

  defineEmits<{
    (e: 'open-login'): void
  }>()
</script>

<template>
  <div class="kb-body">
    <aside class="sidebar">
      <div class="sidebar-head">
        <span>目录</span>
        <button v-if="can('kb:create')" title="新增文章" @click="startCreate">+</button>
      </div>
      <div v-if="!session" class="empty-state">登录后查看知识库目录。</div>
      <TreeList v-else :items="tree" :active-path="activePath" @select="onSelect" />
    </aside>

    <main class="workspace">
      <Workspace
        :has-session="Boolean(session)"
        :active-article="activeArticle"
        :editor-content="editorContent"
        :editing="editing"
        :can-update="can('kb:update')"
        :can-delete="can('kb:delete')"
        @update:editor-content="editorContent = $event"
        @update:editing="editing = $event"
        @save="saveArticle"
        @remove="removeArticle"
        @clear="clearActiveArticle"
        @open-login="$emit('open-login')"
      />
    </main>

    <AiPanel
      v-if="aiOpen && session && can('ai:use')"
      :active-path="activePath"
      :messages="messages"
      :sending="sending"
      :applying-draft="applyingDraft"
      :prompt="prompt"
      :use-web-search="useWebSearch"
      :auto-apply="autoApply"
      :can-write-kb="can('ai:write_kb')"
      :can-auto-apply="can('ai:auto_apply')"
      @update:prompt="prompt = $event"
      @update:use-web-search="useWebSearch = $event"
      @update:auto-apply="autoApply = $event"
      @close="aiOpen = false"
      @clear-active="clearActiveArticle"
      @send="onSend"
      @stop="stopGenerating"
      @apply-draft="onApplyDraft"
    />
  </div>
</template>
