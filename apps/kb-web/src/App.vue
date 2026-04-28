<template>
  <div class="kb-shell" :class="{ 'ai-open': aiOpen }">
    <header class="kb-header">
      <div class="brand">
        <span class="brand-mark">K</span>
        <div>
          <strong>AI 知识库</strong>
          <small>Markdown workspace</small>
        </div>
      </div>

      <nav class="top-nav">
        <Button :variant="viewMode === 'read' ? 'default' : 'outline'" @click="viewMode = 'read'">
          文档
        </Button>
        <Button
          v-if="can('user:update') || can('role:assign')"
          :variant="viewMode === 'admin' ? 'default' : 'outline'"
          @click="viewMode = 'admin'"
        >
          管理
        </Button>
      </nav>

      <div class="header-actions">
        <Button
          v-if="session && can('ai:use')"
          :variant="aiOpen ? 'default' : 'outline'"
          @click="aiOpen = !aiOpen"
        >
          <PanelRightOpen data-icon="inline-start" />
          AI 面板
        </Button>
        <Button v-else variant="ghost" @click="loginOpen = true">登录使用 AI</Button>
        <span v-if="session" class="user-chip">{{ session.user.username }}</span>
        <Button v-if="session" variant="ghost" @click="logout">
          <LogOut data-icon="inline-start" />
          退出
        </Button>
        <Button v-else @click="loginOpen = true">登录</Button>
      </div>
    </header>

    <div class="kb-body">
      <aside class="sidebar">
        <div class="sidebar-head">
          <span>目录</span>
          <Button
            v-if="can('kb:create')"
            size="icon"
            variant="outline"
            title="新增文章"
            @click="startCreate"
          >
            <Plus />
          </Button>
        </div>
        <div v-if="!session" class="empty-state">登录后查看知识库目录。</div>
        <TreeList v-else :items="tree" :active-path="activePath" @select="loadArticle" />
      </aside>

      <main class="workspace">
        <section v-if="viewMode === 'admin'" class="admin-view">
          <div class="page-title">
            <p>Admin</p>
            <h1>账号与权限</h1>
          </div>

          <div class="admin-grid">
            <section class="admin-section">
              <div class="section-title">
                <h2>账号</h2>
                <Button v-if="can('user:create')" variant="outline" @click="createUser">
                  新增账号
                </Button>
              </div>
              <div class="data-table">
                <div class="table-row table-head">
                  <span>账号</span>
                  <span>角色</span>
                  <span>状态</span>
                </div>
                <div v-for="user in users" :key="user.id" class="table-row">
                  <span>{{ user.username }}</span>
                  <span>{{ roleNames(user.roleIds) }}</span>
                  <span>{{ user.disabled ? '禁用' : '启用' }}</span>
                </div>
              </div>
            </section>

            <section class="admin-section">
              <div class="section-title">
                <h2>角色权限</h2>
              </div>
              <div v-for="role in roles" :key="role.id" class="role-block">
                <strong>{{ role.name }}</strong>
                <p>{{ role.description }}</p>
                <div class="permission-list">
                  <Badge
                    v-for="permission in role.permissions"
                    :key="permission"
                    variant="secondary"
                  >
                    {{ permission }}
                  </Badge>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section v-else-if="!session" class="welcome">
          <p>Private Knowledge Base</p>
          <h1>登录后进入可迭代知识库</h1>
          <Button size="lg" @click="loginOpen = true">登录知识库</Button>
        </section>

        <section v-else class="doc-view">
          <div class="doc-toolbar">
            <div>
              <p>{{ activeArticle?.path || '请选择文章' }}</p>
              <h1>{{ activeArticle?.title || '知识库' }}</h1>
            </div>
            <div v-if="activeArticle" class="toolbar-actions">
              <Button v-if="can('kb:update')" variant="outline" @click="editing = !editing">
                {{ editing ? '预览' : '编辑' }}
              </Button>
              <Button v-if="can('kb:update')" @click="saveArticle">保存</Button>
              <Button v-if="can('kb:delete')" variant="destructive" @click="removeArticle"
                >删除</Button
              >
            </div>
          </div>

          <Textarea
            v-if="editing && activeArticle"
            v-model="editorContent"
            class="editor"
            spellcheck="false"
          />
          <article
            v-else-if="activeArticle"
            class="markdown-body"
            v-html="renderMarkdown(activeArticle.content)"
          />
          <div v-else class="empty-doc">从左侧选择一篇文章，或者新增一篇 Markdown。</div>
        </section>
      </main>

      <aside v-if="aiOpen && session && can('ai:use')" class="ai-panel">
        <div class="ai-head">
          <div>
            <strong>AI 草稿助手</strong>
            <span>{{ activePath || '未选择文章' }}</span>
          </div>
          <Button size="icon" variant="outline" title="收起" @click="aiOpen = false">
            <X />
          </Button>
        </div>

        <div class="messages">
          <div
            v-for="(message, index) in messages"
            :key="index"
            class="message"
            :class="message.role"
          >
            <div v-if="message.streaming && !message.content" class="typing-row">
              <span></span>
              <span></span>
              <span></span>
              正在组织回答
            </div>
            <div
              class="message-content markdown-body compact"
              v-html="renderMarkdown(message.content)"
            />
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
                <Badge variant="secondary">{{ message.draft.operation }}</Badge>
                <strong>{{ message.draft.path }}</strong>
              </div>
              <pre v-if="message.draft.content">{{ message.draft.content }}</pre>
              <Button v-if="can('ai:write_kb')" @click="applyDraft(message.draft)">
                确认写入
              </Button>
            </div>
            <div v-if="message.sources?.length" class="source-list">
              <a
                v-for="source in message.sources"
                :key="source.url || source.title"
                class="source-link"
                :href="source.url"
                target="_blank"
                rel="noreferrer"
                :title="source.url || source.title"
              >
                <strong>{{ source.title }}</strong>
                <span>{{ source.snippet }}</span>
              </a>
            </div>
          </div>
        </div>

        <form class="composer" @submit.prevent="sendMessage">
          <label class="search-toggle">
            <Checkbox v-model="useWebSearch" />
            网络检索
          </label>
          <Textarea v-model="prompt" placeholder="让 AI 新增、修改、整理当前知识库..." />
          <Button :disabled="sending || !prompt.trim()">发送</Button>
        </form>
      </aside>
    </div>

    <div v-if="loginOpen" class="modal-backdrop" @click.self="loginOpen = false">
      <form class="login-modal" @submit.prevent="login">
        <h2>登录知识库</h2>
        <label>
          账号
          <Input v-model="loginForm.username" autocomplete="username" />
        </label>
        <label>
          密码
          <Input v-model="loginForm.password" type="password" autocomplete="current-password" />
        </label>
        <p v-if="error" class="error">{{ error }}</p>
        <Button size="lg" class="w-full">登录</Button>
        <small>默认超管：superadmin / Admin@123456</small>
      </form>
    </div>

    <div v-if="articleDialogOpen" class="modal-backdrop" @click.self="articleDialogOpen = false">
      <form class="login-modal" @submit.prevent="submitCreateArticle">
        <h2>新增文章</h2>
        <label>
          所属目录
          <select v-model="articleDirectoryInput" class="form-select">
            <option value="">根目录</option>
            <option
              v-for="directory in directoryOptions"
              :key="directory.path"
              :value="directory.path"
            >
              {{ directory.label }}
            </option>
          </select>
        </label>
        <label>
          文件名称
          <Input
            v-model="articleFileNameInput"
            autocomplete="off"
            placeholder="intro.md"
            autofocus
          />
        </label>
        <p v-if="articleDialogError" class="error">{{ articleDialogError }}</p>
        <div class="modal-actions">
          <Button type="button" variant="outline" @click="articleDialogOpen = false">取消</Button>
          <Button type="submit">创建</Button>
        </div>
      </form>
    </div>

    <div v-if="userDialogOpen" class="modal-backdrop" @click.self="userDialogOpen = false">
      <form class="login-modal" @submit.prevent="submitCreateUser">
        <h2>新增账号</h2>
        <label>
          账号名
          <Input v-model="usernameInput" autocomplete="off" placeholder="new-user" autofocus />
        </label>
        <p v-if="userDialogError" class="error">{{ userDialogError }}</p>
        <div class="modal-actions">
          <Button type="button" variant="outline" @click="userDialogOpen = false">取消</Button>
          <Button type="submit">创建</Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, defineComponent, h, onMounted, ref, type VNode } from 'vue'
  import { LogOut, PanelRightOpen, Plus, X } from 'lucide-vue-next'
  import { api, clearToken, getToken, setToken } from './api'
  import { Badge } from './components/ui/badge'
  import { Button } from './components/ui/button'
  import { Checkbox } from './components/ui/checkbox'
  import { Input } from './components/ui/input'
  import { Textarea } from './components/ui/textarea'
  import type { Article, Draft, Role, SearchSource, SessionUser, TreeItem, User } from './api'
  import { renderMarkdown } from './markdown'

  const TreeList = defineComponent({
    props: {
      items: { type: Array as () => TreeItem[], required: true },
      activePath: { type: String, default: '' },
    },
    emits: ['select'],
    setup(props, { emit }) {
      const renderItems = (items: TreeItem[]): VNode =>
        h(
          'ul',
          { class: 'tree-list' },
          items.map(item =>
            h('li', { class: ['tree-item', item.type] }, [
              h(
                'button',
                {
                  class: { active: props.activePath === item.path },
                  onClick: () => item.type === 'article' && emit('select', item.path),
                },
                item.type === 'directory' ? item.name : item.title || item.name
              ),
              item.children?.length ? renderItems(item.children) : null,
            ])
          )
        )
      return () => renderItems(props.items)
    },
  })

  type ChatMessage = {
    role: 'user' | 'assistant'
    content: string
    streaming?: boolean
    toolCalls?: ToolStep[]
    reasoning?: string[]
    draft?: Draft
    sources?: SearchSource[]
  }

  type ToolStep = {
    name: string
    status: 'running' | 'done' | 'error'
    detail: string
  }

  const session = ref<SessionUser | null>(null)
  const tree = ref<TreeItem[]>([])
  const activePath = ref('')
  const activeArticle = ref<Article | null>(null)
  const editorContent = ref('')
  const editing = ref(false)
  const aiOpen = ref(false)
  const loginOpen = ref(false)
  const error = ref('')
  const viewMode = ref<'read' | 'admin'>('read')
  const roles = ref<Role[]>([])
  const users = ref<User[]>([])
  const messages = ref<ChatMessage[]>([])
  const prompt = ref('')
  const sending = ref(false)
  const conversationId = ref('')
  const useWebSearch = ref(false)
  const loginForm = ref({ username: 'superadmin', password: 'Admin@123456' })
  const articleDialogOpen = ref(false)
  const articleDirectoryInput = ref('')
  const articleFileNameInput = ref('')
  const articleDialogError = ref('')
  const userDialogOpen = ref(false)
  const usernameInput = ref('')
  const userDialogError = ref('')

  const permissions = computed(() => session.value?.permissions || [])
  const directoryOptions = computed(() => collectDirectoryOptions(tree.value))
  const can = (permission: string) => permissions.value.includes(permission)

  async function refreshTree() {
    if (!session.value || !can('kb:view')) return
    const result = await api.tree()
    tree.value = result.items
  }

  async function refreshAdmin() {
    if (can('role:assign')) roles.value = (await api.roles()).items
    if (can('user:update')) users.value = (await api.users()).items
  }

  async function loadArticle(path: string) {
    activePath.value = path
    activeArticle.value = await api.article(path)
    editorContent.value = activeArticle.value.content
    editing.value = false
  }

  async function login() {
    error.value = ''
    try {
      const result = await api.login(loginForm.value.username, loginForm.value.password)
      setToken(result.token)
      session.value = result.user
      loginOpen.value = false
      await refreshTree()
      await refreshAdmin()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登录失败'
    }
  }

  function logout() {
    clearToken()
    session.value = null
    tree.value = []
    activeArticle.value = null
    aiOpen.value = false
    viewMode.value = 'read'
  }

  function startCreate() {
    articleDirectoryInput.value = activePath.value ? activePath.value.replace(/\/[^/]+$/, '') : ''
    articleFileNameInput.value = ''
    articleDialogError.value = ''
    articleDialogOpen.value = true
  }

  async function submitCreateArticle() {
    const filename = articleFileNameInput.value.trim()
    const directory = articleDirectoryInput.value.trim().replace(/^\/|\/$/g, '')
    if (!filename) {
      articleDialogError.value = '请输入文件名称'
      return
    }
    if (filename.includes('/')) {
      articleDialogError.value = '文件名称不能包含目录分隔符，请在目录字段中选择位置'
      return
    }
    const normalizedFilename = filename.endsWith('.md') ? filename : `${filename}.md`
    const path = directory ? `${directory}/${normalizedFilename}` : normalizedFilename
    const title = path.split('/').pop()?.replace(/\.md$/, '') || '新文章'
    try {
      activeArticle.value = await api.createArticle(path, `# ${title}\n\n开始编写内容。\n`)
      activePath.value = activeArticle.value.path
      editorContent.value = activeArticle.value.content
      editing.value = true
      viewMode.value = 'read'
      articleDialogOpen.value = false
      articleDirectoryInput.value = ''
      articleFileNameInput.value = ''
      await refreshTree()
    } catch (err) {
      articleDialogError.value = err instanceof Error ? err.message : '创建文章失败'
    }
  }

  async function saveArticle() {
    if (!activeArticle.value) return
    activeArticle.value = await api.updateArticle(activeArticle.value.path, editorContent.value)
    editorContent.value = activeArticle.value.content
    editing.value = false
    await refreshTree()
  }

  async function removeArticle() {
    if (!activeArticle.value) return
    const confirmed = window.confirm(
      `确认删除 ${activeArticle.value.path}？该操作会直接删除 Markdown 文件。`
    )
    if (!confirmed) return
    await api.deleteArticle(activeArticle.value.path)
    activeArticle.value = null
    activePath.value = ''
    editorContent.value = ''
    await refreshTree()
  }

  async function sendMessage() {
    if (!prompt.value.trim()) return
    const content = prompt.value.trim()
    prompt.value = ''
    const history = messages.value
      .filter(message => message.content)
      .map(({ role, content }) => ({ role, content }))
    messages.value.push({ role: 'user', content })
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      streaming: true,
      toolCalls: [{ name: '准备请求', status: 'running', detail: '建立流式连接' }],
    }
    messages.value.push(assistantMessage)
    sending.value = true
    try {
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getToken() ? `Bearer ${getToken()}` : '',
        },
        body: JSON.stringify({
          message: content,
          currentPath: activePath.value,
          conversationId: conversationId.value,
          useWebSearch: useWebSearch.value,
          history,
        }),
      })
      if (!response.ok || !response.body) throw new Error('AI 流式请求失败')
      await readAiStream(response, assistantMessage)
    } finally {
      assistantMessage.streaming = false
      sending.value = false
    }
  }

  async function readAiStream(response: Response, assistantMessage: ChatMessage) {
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const packets = buffer.split('\n\n')
      buffer = packets.pop() || ''

      for (const packet of packets) {
        const event = packet.match(/^event:\s*(.+)$/m)?.[1]?.trim()
        const dataLine = packet.match(/^data:\s*(.+)$/m)?.[1]
        if (!event || !dataLine) continue
        const data = JSON.parse(dataLine)

        if (event === 'meta') {
          conversationId.value = data.conversationId
        } else if (event === 'tool') {
          upsertToolStep(assistantMessage, data)
        } else if (event === 'reasoning') {
          assistantMessage.reasoning = data.reasoning
        } else if (event === 'delta') {
          assistantMessage.content += data.delta
        } else if (event === 'done') {
          conversationId.value = data.conversationId
          assistantMessage.content = data.content || assistantMessage.content
          assistantMessage.reasoning = data.reasoning
          assistantMessage.draft = data.draft
          assistantMessage.sources = data.sources
          assistantMessage.streaming = false
        } else if (event === 'error') {
          upsertToolStep(assistantMessage, {
            name: '流式响应',
            status: 'error',
            detail: data.message,
          })
          assistantMessage.content ||= `请求失败：${data.message}`
        }
      }
    }
  }

  function upsertToolStep(message: ChatMessage, step: ToolStep) {
    const steps = message.toolCalls || []
    const index = steps.findIndex(item => item.name === step.name)
    if (index >= 0) {
      steps[index] = step
    } else {
      steps.push(step)
    }
    message.toolCalls = [...steps]
  }

  async function applyDraft(draft: Draft) {
    const confirmed = window.confirm(`确认执行 ${draft.operation}：${draft.path}？`)
    if (!confirmed) return
    const result = await api.applyDraft(draft)
    await refreshTree()
    if ('content' in result) await loadArticle(result.path)
  }

  function createUser() {
    usernameInput.value = ''
    userDialogError.value = ''
    userDialogOpen.value = true
  }

  async function submitCreateUser() {
    const username = usernameInput.value.trim()
    if (!username) {
      userDialogError.value = '请输入账号名'
      return
    }
    const readerRole =
      roles.value.find(role => role.permissions.includes('kb:view')) || roles.value[0]
    const result = await api.createUser({ username, roleIds: readerRole ? [readerRole.id] : [] })
    userDialogOpen.value = false
    usernameInput.value = ''
    window.alert(`账号已创建\n用户名：${result.user.username}\n初始密码：${result.password}`)
    await refreshAdmin()
  }

  function roleNames(roleIds: string[]) {
    return roleIds.map(id => roles.value.find(role => role.id === id)?.name || id).join('、')
  }

  function collectDirectoryOptions(
    items: TreeItem[],
    depth = 0
  ): { path: string; label: string }[] {
    return items.flatMap(item => {
      if (item.type !== 'directory') return []
      const prefix = depth ? `${'　'.repeat(depth)}└ ` : ''
      return [
        { path: item.path, label: `${prefix}${item.name}` },
        ...collectDirectoryOptions(item.children || [], depth + 1),
      ]
    })
  }

  onMounted(async () => {
    try {
      session.value = await api.me()
      if (session.value) {
        await refreshTree()
        await refreshAdmin()
      }
    } catch {
      clearToken()
    }
  })
</script>
