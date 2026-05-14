<template>
  <div class="kb-shell" :class="{ 'ai-open': aiOpen }">
    <header class="kb-header">
      <div class="brand">
        <span class="brand-mark">L</span>
        <div>
          <strong>LCC Knowledge</strong>
          <small>personal · markdown</small>
        </div>
      </div>

      <nav class="top-nav">
        <button :class="{ active: viewMode === 'read' }" @click="viewMode = 'read'">文档</button>
        <button
          v-if="can('user:update') || can('role:assign')"
          :class="{ active: viewMode === 'admin' }"
          @click="viewMode = 'admin'"
        >
          管理
        </button>
      </nav>

      <div class="header-actions">
        <button
          v-if="session && can('ai:use')"
          class="ai-toggle"
          :class="{ active: aiOpen }"
          @click="aiOpen = !aiOpen"
        >
          AI 面板
        </button>
        <button v-else class="ai-toggle ghost" @click="loginOpen = true">登录使用 AI</button>
        <span v-if="session" class="user-chip">{{ session.user.username }}</span>
        <button v-if="session" class="plain" @click="logout">退出</button>
        <button v-else class="primary" @click="loginOpen = true">登录</button>
      </div>
    </header>

    <div class="kb-body">
      <aside class="sidebar">
        <div class="sidebar-head">
          <span>目录</span>
          <button v-if="can('kb:create')" title="新增文章" @click="startCreate">+</button>
        </div>
        <div v-if="!session" class="empty-state">登录后查看知识库目录。</div>
        <TreeList v-else :items="tree" :active-path="activePath" @select="selectArticle" />
      </aside>

      <main class="workspace">
        <section v-if="viewMode === 'admin'" class="admin-view">
          <div class="page-title">
            <p>Admin</p>
            <h1>账号与权限</h1>
          </div>

          <div class="admin-tabs">
            <button
              :class="{ active: adminTab === 'users' }"
              type="button"
              @click="adminTab = 'users'"
            >
              账号
              <span class="tab-count">{{ users.length }}</span>
            </button>
            <button
              :class="{ active: adminTab === 'roles' }"
              type="button"
              @click="adminTab = 'roles'"
            >
              角色
              <span class="tab-count">{{ roles.length }}</span>
            </button>
          </div>

          <p v-if="adminError" class="error">{{ adminError }}</p>

          <!-- USERS TAB -->
          <section v-if="adminTab === 'users'" class="admin-block">
            <div class="block-toolbar">
              <div>
                <h2>账号</h2>
                <p class="block-hint">管理可登录的账号、为其分配角色，或重置密码。</p>
              </div>
              <button v-if="can('user:create')" class="primary" @click="openCreateUser">
                新增账号
              </button>
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
                    <small v-if="user.id === session?.user.id">当前登录</small>
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
                  <button v-if="can('user:update')" @click="openEditUser(user)">编辑</button>
                  <button
                    v-if="can('user:delete') && user.id !== session?.user.id"
                    class="danger"
                    @click="removeUser(user)"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- ROLES TAB -->
          <section v-else class="admin-block">
            <div class="block-toolbar">
              <div>
                <h2>角色</h2>
                <p class="block-hint">每个角色对应一组权限。系统角色（超管/编辑/只读）不可删除。</p>
              </div>
              <button v-if="can('role:create')" class="primary" @click="openCreateRole">
                新增角色
              </button>
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
                    <button v-if="can('role:update')" @click="openEditRole(role)">编辑</button>
                    <button
                      v-if="can('role:delete') && !role.system"
                      class="danger"
                      @click="removeRole(role)"
                    >
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
          </section>
        </section>

        <section v-else-if="!session" class="welcome">
          <p>Private Knowledge Base</p>
          <h1>登录后进入可迭代知识库</h1>
          <button class="primary large" @click="loginOpen = true">登录知识库</button>
        </section>

        <section v-else class="doc-view">
          <div class="doc-toolbar">
            <div>
              <p>{{ activeArticle?.path || '请选择文章' }}</p>
              <h1>{{ activeArticle?.title || '知识库' }}</h1>
            </div>
            <div v-if="activeArticle" class="toolbar-actions">
              <button v-if="can('kb:update')" @click="editing = !editing">
                {{ editing ? '预览' : '编辑' }}
              </button>
              <button v-if="can('kb:update')" class="primary" @click="saveArticle">保存</button>
              <button @click="clearActiveArticle">取消选择</button>
              <button v-if="can('kb:delete')" class="danger" @click="removeArticle">删除</button>
            </div>
          </div>

          <textarea
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
            <div class="ai-context">
              <span>{{ activePath || '未选择文章' }}</span>
              <button
                v-if="activePath"
                class="plain context-clear"
                type="button"
                title="取消绑定当前文章"
                @click="clearActiveArticle"
              >
                取消绑定
              </button>
            </div>
          </div>
          <button title="收起" @click="aiOpen = false">×</button>
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
                v-if="can('ai:write_kb') && canApplyDraft(message.draft)"
                :class="message.draft.operation === 'delete' ? 'danger' : 'primary'"
                :disabled="applyingDraft"
                @click="applyDraft(message.draft)"
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

        <form class="composer" @submit.prevent="sendMessage">
          <label class="search-toggle">
            <input v-model="useWebSearch" type="checkbox" />
            允许网络检索
          </label>
          <textarea
            v-model="prompt"
            placeholder="让 AI 阅读、撰写或整理知识库……"
            @keydown.enter.meta.prevent="sendMessage"
            @keydown.enter.ctrl.prevent="sendMessage"
          />
          <div class="composer-actions">
            <span class="hint">⌘/Ctrl + Enter 发送 · Shift + Enter 换行</span>
            <button v-if="sending" type="button" class="ghost" @click="stopGenerating">停止</button>
            <button class="primary" :disabled="sending || !prompt.trim()">发送</button>
          </div>
        </form>
      </aside>
    </div>

    <div v-if="loginOpen" class="modal-backdrop" @click.self="loginOpen = false">
      <form class="login-modal" @submit.prevent="login">
        <h2>登录知识库</h2>
        <label>
          账号
          <input v-model="loginForm.username" autocomplete="username" />
        </label>
        <label>
          密码
          <input v-model="loginForm.password" type="password" autocomplete="current-password" />
        </label>
        <p v-if="error" class="error">{{ error }}</p>
        <button class="primary large">登录</button>
        <small>默认超管：superadmin / Admin@123456</small>
      </form>
    </div>

    <!-- USER EDITOR -->
    <div v-if="userModal.open" class="modal-backdrop" @click.self="closeUserModal">
      <form class="admin-modal" @submit.prevent="submitUser">
        <header>
          <h2>{{ userModal.mode === 'create' ? '新增账号' : '编辑账号' }}</h2>
          <button type="button" class="plain icon" aria-label="关闭" @click="closeUserModal">
            ×
          </button>
        </header>

        <div class="modal-body">
          <label class="field">
            <span>用户名</span>
            <input
              v-model="userModal.form.username"
              :disabled="userModal.mode === 'edit'"
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
                  :checked="userModal.form.roleIds.includes(role.id)"
                  @change="toggleUserRole(role.id, ($event.target as HTMLInputElement).checked)"
                />
                <div>
                  <strong>{{ role.name }}</strong>
                  <small>{{ role.description || '—' }}</small>
                </div>
              </label>
            </div>
          </fieldset>

          <label v-if="userModal.mode === 'edit'" class="check-row standalone">
            <input v-model="userModal.form.disabled" type="checkbox" />
            <div>
              <strong>停用账号</strong>
              <small>停用后该账号无法登录</small>
            </div>
          </label>

          <label v-if="userModal.mode === 'edit'" class="check-row standalone">
            <input v-model="userModal.form.resetPassword" type="checkbox" />
            <div>
              <strong>重置密码</strong>
              <small>勾选后保存时生成新密码</small>
            </div>
          </label>

          <div v-if="userModal.issuedPassword" class="issued-password">
            <strong>初始密码</strong>
            <code>{{ userModal.issuedPassword }}</code>
            <p>密码仅显示一次，请立即妥善保管。</p>
          </div>

          <p v-if="userModal.error" class="error">{{ userModal.error }}</p>
        </div>

        <footer>
          <button type="button" class="ghost" @click="closeUserModal">
            {{ userModal.issuedPassword ? '关闭' : '取消' }}
          </button>
          <button v-if="!userModal.issuedPassword" class="primary" :disabled="userModal.busy">
            {{ userModal.busy ? '保存中…' : '保存' }}
          </button>
        </footer>
      </form>
    </div>

    <!-- ROLE EDITOR -->
    <div v-if="roleModal.open" class="modal-backdrop" @click.self="closeRoleModal">
      <form class="admin-modal wide" @submit.prevent="submitRole">
        <header>
          <h2>
            {{ roleModal.mode === 'create' ? '新增角色' : '编辑角色' }}
            <span v-if="roleModal.form.system" class="badge">系统</span>
          </h2>
          <button type="button" class="plain icon" aria-label="关闭" @click="closeRoleModal">
            ×
          </button>
        </header>

        <div class="modal-body">
          <label class="field">
            <span>名称</span>
            <input
              v-model="roleModal.form.name"
              :disabled="roleModal.form.system"
              placeholder="例如 编辑"
              required
            />
            <small v-if="roleModal.form.system">系统角色不可改名</small>
          </label>

          <label class="field">
            <span>描述</span>
            <input
              v-model="roleModal.form.description"
              :disabled="roleModal.form.system"
              placeholder="一句话说明这个角色的职责"
            />
            <small v-if="roleModal.form.system">系统角色不可改描述</small>
          </label>

          <fieldset class="field">
            <legend>
              权限
              <span class="muted">{{ roleModal.form.permissions.length }} 项已选</span>
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
                      :checked="roleModal.form.permissions.includes(p)"
                      @change="toggleRolePermission(p, ($event.target as HTMLInputElement).checked)"
                    />
                    <code>{{ p }}</code>
                  </label>
                </div>
              </section>
            </div>
          </fieldset>

          <p v-if="roleModal.error" class="error">{{ roleModal.error }}</p>
        </div>

        <footer>
          <button type="button" class="ghost" @click="closeRoleModal">取消</button>
          <button class="primary" :disabled="roleModal.busy">
            {{ roleModal.busy ? '保存中…' : '保存' }}
          </button>
        </footer>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, defineComponent, h, onMounted, reactive, ref, type VNode } from 'vue'
  import { api, clearToken, getToken, setToken } from './api'
  import type {
    Article,
    Draft,
    PermissionGroup,
    Role,
    SearchSource,
    SessionUser,
    TreeItem,
    User,
  } from './api'
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
                  onClick: () =>
                    item.type === 'article' &&
                    emit('select', props.activePath === item.path ? '' : item.path),
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
  const adminTab = ref<'users' | 'roles'>('users')
  const adminError = ref('')
  const roles = ref<Role[]>([])
  const users = ref<User[]>([])
  const permissionGroups = ref<PermissionGroup[]>([])
  const messages = ref<ChatMessage[]>([])
  const prompt = ref('')
  const sending = ref(false)
  const applyingDraft = ref(false)
  const conversationId = ref('')
  const useWebSearch = ref(false)
  const loginForm = ref({ username: 'superadmin', password: 'Admin@123456' })

  const permissions = computed(() => session.value?.permissions || [])
  const can = (permission: string) => permissions.value.includes(permission)

  async function refreshTree() {
    if (!session.value || !can('kb:view')) return
    const result = await api.tree()
    tree.value = result.items
  }

  async function refreshAdmin() {
    adminError.value = ''
    try {
      if (can('role:assign')) {
        const [rolesResp, permResp] = await Promise.all([api.roles(), api.permissionGroups()])
        roles.value = rolesResp.items
        permissionGroups.value = permResp.groups
      }
      if (can('user:update')) users.value = (await api.users()).items
    } catch (err) {
      adminError.value = err instanceof Error ? err.message : '加载失败'
    }
  }

  async function loadArticle(path: string) {
    activePath.value = path
    activeArticle.value = await api.article(path)
    editorContent.value = activeArticle.value.content
    editing.value = false
  }

  async function selectArticle(path: string) {
    if (!path) {
      clearActiveArticle()
      return
    }
    await loadArticle(path)
  }

  function clearActiveArticle() {
    activePath.value = ''
    activeArticle.value = null
    editorContent.value = ''
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
    clearActiveArticle()
    aiOpen.value = false
    viewMode.value = 'read'
  }

  async function startCreate() {
    const path = window.prompt('请输入文章路径，例如 guide/intro.md')
    if (!path) return
    const title = path.split('/').pop()?.replace(/\.md$/, '') || '新文章'
    activeArticle.value = await api.createArticle(path, `# ${title}\n\n开始编写内容。\n`)
    activePath.value = activeArticle.value.path
    editorContent.value = activeArticle.value.content
    editing.value = true
    await refreshTree()
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
    clearActiveArticle()
    await refreshTree()
  }

  let activeController: AbortController | null = null

  async function sendMessage() {
    if (!prompt.value.trim() || sending.value) return
    const content = prompt.value.trim()
    prompt.value = ''
    const history = messages.value
      .filter(message => message.content)
      .map(message => ({ role: message.role, content: message.content }))
    messages.value.push({ role: 'user', content })
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      streaming: true,
      toolCalls: [{ name: '准备请求', status: 'running', detail: '建立流式连接' }],
    }
    messages.value.push(assistantMessage)
    sending.value = true
    activeController = new AbortController()
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
        signal: activeController.signal,
      })
      if (!response.ok || !response.body) throw new Error('AI 流式请求失败')
      await readAiStream(response, assistantMessage)
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        assistantMessage.content ||= `请求失败：${(err as Error).message}`
      }
    } finally {
      assistantMessage.streaming = false
      sending.value = false
      activeController = null
    }
  }

  function stopGenerating() {
    activeController?.abort()
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

  const DRAFT_MARKER_RE =
    /\[DRAFT\s+op="(?:create|update|delete|organize)"(?:\s+path="[^"]+")?\]\s*(?:```(?:markdown|md|json)?\n[\s\S]*?```)?/i

  function displayContent(message: ChatMessage) {
    return renderMarkdown((message.content || '').replace(DRAFT_MARKER_RE, '').trim())
  }

  const draftOperationLabels: Record<Draft['operation'], string> = {
    create: '新增文章',
    update: '更新文章',
    delete: '删除文章',
    organize: '整理目录',
  }

  function draftOperationLabel(operation: Draft['operation']) {
    return draftOperationLabels[operation]
  }

  function draftTargetLabel(draft: Draft) {
    if (draft.operation === 'organize') {
      const count = draft.actions?.length || 0
      return count ? `知识库目录 · ${count} 项调整` : '知识库目录'
    }
    return draft.path
  }

  function draftActionLabel(draft: Draft) {
    if (draft.operation === 'organize') return '确认整理'
    if (draft.operation === 'create') return '确认新增'
    if (draft.operation === 'delete') return '确认删除'
    return '确认更新'
  }

  function canApplyDraft(draft: Draft) {
    return draft.operation !== 'organize' || Boolean(draft.actions?.length)
  }

  function draftConfirmMessage(draft: Draft) {
    if (draft.operation === 'organize') {
      const count = draft.actions?.length || 0
      return `确认整理知识库目录？\n将按草稿移动 ${count} 篇文章，并刷新左侧目录。`
    }
    if (draft.operation === 'delete') return `确认删除文章：${draft.path}？`
    if (draft.operation === 'create') return `确认新增文章：${draft.path}？`
    return `确认把这份草稿更新到文章：${draft.path}？`
  }

  async function applyDraft(draft: Draft) {
    const confirmed = window.confirm(draftConfirmMessage(draft))
    if (!confirmed) return
    applyingDraft.value = true
    try {
      const result = await api.applyDraft(draft)
      await refreshTree()

      if (draft.operation === 'organize') {
        const movedActive = draft.actions?.find(action => action.from === activePath.value)
        if (movedActive) await loadArticle(movedActive.to)
        return
      }

      if (draft.operation === 'delete') {
        if (activePath.value === draft.path) clearActiveArticle()
        return
      }

      if ('content' in result) await loadArticle(result.path)
    } finally {
      applyingDraft.value = false
    }
  }

  // ---- Admin: users ----
  type UserModalState = {
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

  const userModal = reactive<UserModalState>({
    open: false,
    mode: 'create',
    targetId: '',
    form: { username: '', roleIds: [], disabled: false, resetPassword: false },
    busy: false,
    error: '',
    issuedPassword: '',
  })

  function defaultRoleIds(): string[] {
    const reader = roles.value.find(role => role.permissions.includes('kb:view') && !role.system)
    if (reader) return [reader.id]
    const fallback = roles.value.find(role => !role.system) || roles.value[0]
    return fallback ? [fallback.id] : []
  }

  function openCreateUser() {
    userModal.mode = 'create'
    userModal.targetId = ''
    userModal.form = {
      username: '',
      roleIds: defaultRoleIds(),
      disabled: false,
      resetPassword: false,
    }
    userModal.error = ''
    userModal.issuedPassword = ''
    userModal.open = true
  }

  function openEditUser(user: User) {
    userModal.mode = 'edit'
    userModal.targetId = user.id
    userModal.form = {
      username: user.username,
      roleIds: [...user.roleIds],
      disabled: user.disabled,
      resetPassword: false,
    }
    userModal.error = ''
    userModal.issuedPassword = ''
    userModal.open = true
  }

  function closeUserModal() {
    userModal.open = false
  }

  function toggleUserRole(roleId: string, checked: boolean) {
    const set = new Set(userModal.form.roleIds)
    if (checked) set.add(roleId)
    else set.delete(roleId)
    userModal.form.roleIds = [...set]
  }

  async function submitUser() {
    if (!userModal.form.username.trim()) {
      userModal.error = '请输入用户名'
      return
    }
    if (!userModal.form.roleIds.length) {
      userModal.error = '至少选择一个角色'
      return
    }
    userModal.busy = true
    userModal.error = ''
    try {
      if (userModal.mode === 'create') {
        const result = await api.createUser({
          username: userModal.form.username.trim(),
          roleIds: userModal.form.roleIds,
        })
        userModal.issuedPassword = result.password
      } else {
        const result = await api.updateUser(userModal.targetId, {
          roleIds: userModal.form.roleIds,
          disabled: userModal.form.disabled,
          resetPassword: userModal.form.resetPassword,
        })
        if (result.password) userModal.issuedPassword = result.password
        else userModal.open = false
      }
      await refreshAdmin()
    } catch (err) {
      userModal.error = err instanceof Error ? err.message : '保存失败'
    } finally {
      userModal.busy = false
    }
  }

  async function removeUser(user: User) {
    if (user.id === session.value?.user.id) return
    const confirmed = window.confirm(`确认删除账号 ${user.username}？此操作不可恢复。`)
    if (!confirmed) return
    try {
      await api.deleteUser(user.id)
      await refreshAdmin()
    } catch (err) {
      adminError.value = err instanceof Error ? err.message : '删除失败'
    }
  }

  // ---- Admin: roles ----
  type RoleModalState = {
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

  const roleModal = reactive<RoleModalState>({
    open: false,
    mode: 'create',
    targetId: '',
    form: { name: '', description: '', permissions: [], system: false },
    busy: false,
    error: '',
  })

  function openCreateRole() {
    roleModal.mode = 'create'
    roleModal.targetId = ''
    roleModal.form = { name: '', description: '', permissions: [], system: false }
    roleModal.error = ''
    roleModal.open = true
  }

  function openEditRole(role: Role) {
    roleModal.mode = 'edit'
    roleModal.targetId = role.id
    roleModal.form = {
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
      system: Boolean(role.system),
    }
    roleModal.error = ''
    roleModal.open = true
  }

  function closeRoleModal() {
    roleModal.open = false
  }

  function toggleRolePermission(permission: string, checked: boolean) {
    const set = new Set(roleModal.form.permissions)
    if (checked) set.add(permission)
    else set.delete(permission)
    roleModal.form.permissions = [...set]
  }

  function allSelected(group: string[]) {
    return group.every(item => roleModal.form.permissions.includes(item))
  }

  function toggleGroupPermissions(group: string[]) {
    const everyOn = allSelected(group)
    const set = new Set(roleModal.form.permissions)
    for (const item of group) {
      if (everyOn) set.delete(item)
      else set.add(item)
    }
    roleModal.form.permissions = [...set]
  }

  async function submitRole() {
    if (!roleModal.form.name.trim()) {
      roleModal.error = '请输入角色名称'
      return
    }
    roleModal.busy = true
    roleModal.error = ''
    try {
      if (roleModal.mode === 'create') {
        await api.createRole({
          name: roleModal.form.name.trim(),
          description: roleModal.form.description.trim(),
          permissions: roleModal.form.permissions,
        })
      } else if (roleModal.form.system) {
        // System role: only permissions are mutable.
        await api.updateRole(roleModal.targetId, {
          permissions: roleModal.form.permissions,
        })
      } else {
        await api.updateRole(roleModal.targetId, {
          name: roleModal.form.name.trim(),
          description: roleModal.form.description.trim(),
          permissions: roleModal.form.permissions,
        })
      }
      roleModal.open = false
      await refreshAdmin()
    } catch (err) {
      roleModal.error = err instanceof Error ? err.message : '保存失败'
    } finally {
      roleModal.busy = false
    }
  }

  async function removeRole(role: Role) {
    if (role.system) return
    const confirmed = window.confirm(`确认删除角色「${role.name}」？`)
    if (!confirmed) return
    try {
      await api.deleteRole(role.id)
      await refreshAdmin()
    } catch (err) {
      adminError.value = err instanceof Error ? err.message : '删除失败'
    }
  }

  function roleNameOf(roleId: string) {
    return roles.value.find(role => role.id === roleId)?.name || roleId
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
