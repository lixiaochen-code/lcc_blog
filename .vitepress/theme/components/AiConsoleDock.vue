<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { aiConsoleOpen, aiConsoleTab, closeAiConsole } from "./aiConsoleState";

type RuntimeConfig = {
  server?: { protocol?: string; baseUrl?: string };
  model?: { selected?: string };
};

type AccessUser = {
  id: string;
  name: string;
  role: string;
  status: string;
  permissions: string[];
  quota?: { dailyRequests?: number; monthlyTokens?: number };
};

type ChatEntry = {
  role: "user" | "assistant";
  title: string;
  body: string;
  meta?: string;
};

const apiBase = "http://localhost:3030/api";
const storageKey = "ai-console-token";
const availablePermissions = [
  "notes.read",
  "notes.create",
  "notes.update",
  "notes.delete",
  "docs.reorganize",
  "kb.ingest_url",
  "site.build",
  "site.deploy",
  "users.manage",
  "tokens.use",
  "runtime.manage_connection",
  "runtime.manage_model",
  "runtime.manage_secret",
];

const busy = ref(false);
const statusText = ref("等待加载");
const serverHealth = ref<any>(null);
const runtime = ref<RuntimeConfig>({});
const users = ref<AccessUser[]>([]);
const logs = ref<string[]>([]);
const authToken = ref("");
const currentUser = ref<AccessUser | null>(null);
const loginName = ref("");
const loginUserId = ref("");
const selectedManagedUserId = ref("");
const dockWidth = ref(420);
const isDragging = ref(false);
const chatInput = ref("");
const chatStreamRef = ref<HTMLElement | null>(null);
const chatEntries = ref<ChatEntry[]>([
  {
    role: "assistant",
    title: "AI 助手",
    body: "登录后就可以直接用自然语言驱动知识库。你说需求，我来判断动作并在服务端完成权限校验。",
  },
]);

const addUserForm = reactive({
  name: "",
  role: "admin",
});

const tabs = [
  { key: "chat", label: "AI 对话" },
  { key: "me", label: "我的" },
  { key: "users", label: "用户管理" },
] as const;

const isAuthenticated = computed(() => Boolean(authToken.value && currentUser.value));
const isSuperAdmin = computed(() => currentUser.value?.role === "super_admin");
const runtimeSummary = computed(() => {
  if (!isSuperAdmin.value) {
    return "登录后可使用聊天；super_admin 可查看 AI 运行时配置。";
  }
  const protocol = runtime.value.server?.protocol || "https";
  const baseUrl = runtime.value.server?.baseUrl || "未配置";
  const model = runtime.value.model?.selected || "未配置";
  return `${protocol}://${baseUrl} · ${model}`;
});
const permissionRows = computed(() =>
  availablePermissions.map((permission) => ({
    permission,
    allowed: Boolean(currentUser.value?.permissions?.includes(permission)),
  }))
);

const visibleTabs = computed(() =>
  tabs.filter((tab) => {
    if (tab.key === "users") {
      return isSuperAdmin.value;
    }
    return true;
  })
);
const selectedManagedUser = computed(
  () => users.value.find((user) => user.id === selectedManagedUserId.value) || null
);
const selectedManagedPermissionRows = computed(() =>
  availablePermissions.map((permission) => ({
    permission,
    allowed: Boolean(selectedManagedUser.value?.permissions?.includes(permission)),
  }))
);

function applyDockWidth() {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.style.setProperty("--ai-console-width", `${dockWidth.value}px`);
}

let dragFrame = 0;
let pendingWidth = 0;

function flushDockWidth() {
  dragFrame = 0;
  if (!pendingWidth) {
    return;
  }
  dockWidth.value = pendingWidth;
  applyDockWidth();
}

function handleDrag(event: MouseEvent) {
  const min = 360;
  const max = Math.max(min, Math.floor(window.innerWidth * 0.5));
  pendingWidth = Math.min(max, Math.max(min, window.innerWidth - event.clientX));
  if (!dragFrame) {
    dragFrame = window.requestAnimationFrame(flushDockWidth);
  }
}

function stopDrag() {
  isDragging.value = false;
  document.documentElement.classList.remove("ai-console-dragging");
  window.removeEventListener("mousemove", handleDrag);
  window.removeEventListener("mouseup", stopDrag);
  if (dragFrame) {
    window.cancelAnimationFrame(dragFrame);
    dragFrame = 0;
  }
  if (pendingWidth) {
    dockWidth.value = pendingWidth;
    applyDockWidth();
    pendingWidth = 0;
  }
}

function startDrag() {
  isDragging.value = true;
  document.documentElement.classList.add("ai-console-dragging");
  window.addEventListener("mousemove", handleDrag);
  window.addEventListener("mouseup", stopDrag);
}

function pushLog(message: string) {
  logs.value = [`${new Date().toLocaleTimeString()}  ${message}`, ...logs.value].slice(0, 12);
}

function pushChat(role: "user" | "assistant", title: string, body: string, meta = "") {
  chatEntries.value = [...chatEntries.value, { role, title, body, meta }].slice(-20);
}

function scrollChatToBottom(behavior: ScrollBehavior = "auto") {
  const element = chatStreamRef.value;
  if (!element) {
    return;
  }
  element.scrollTo({
    top: element.scrollHeight,
    behavior,
  });
}

function saveToken(token: string) {
  authToken.value = token;
  if (typeof window !== "undefined") {
    if (token) {
      window.localStorage.setItem(storageKey, token);
    } else {
      window.localStorage.removeItem(storageKey);
    }
  }
}

async function request(path: string, options: RequestInit = {}, requireAuth = true) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (requireAuth && authToken.value) {
    headers.set("Authorization", `Bearer ${authToken.value}`);
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || data.stderr || "Request failed.");
  }
  return data;
}

async function loadHealth() {
  try {
    const health = await request("/health", {}, false);
    serverHealth.value = health;
  } catch (error: any) {
    statusText.value = error.message || "服务未就绪";
  }
}

async function loadState() {
  if (!isAuthenticated.value) {
    users.value = [];
    runtime.value = {};
    statusText.value = "未登录";
    return;
  }

  busy.value = true;
  try {
    const accessResult = await request("/access");
    currentUser.value = accessResult.currentUser || null;
    users.value = accessResult.users || [];
    if (currentUser.value?.role === "super_admin") {
      const nonSelfUsers = users.value.filter((user) => user.id !== currentUser.value?.id);
      if (!selectedManagedUserId.value || !users.value.some((user) => user.id === selectedManagedUserId.value)) {
        selectedManagedUserId.value = nonSelfUsers[0]?.id || "";
      }
    }

    if (currentUser.value?.role === "super_admin") {
      const runtimeResult = await request("/runtime-config");
      runtime.value = runtimeResult.config || {};
    } else {
      runtime.value = {};
    }

    statusText.value = "AI 工作区已就绪";
  } catch (error: any) {
    pushLog(`状态加载失败：${error.message}`);
    await logout(false);
    statusText.value = "登录失效，请重新登录";
  } finally {
    busy.value = false;
  }
}

async function restoreSession() {
  if (typeof window === "undefined") {
    return;
  }

  const savedToken = window.localStorage.getItem(storageKey) || "";
  if (!savedToken) {
    statusText.value = "未登录";
    return;
  }

  saveToken(savedToken);
  try {
    const data = await request("/auth/session");
    currentUser.value = data.user || null;
    await loadState();
  } catch (error: any) {
    await logout(false);
    statusText.value = error.message || "登录失效";
  }
}

async function login() {
  const name = loginName.value.trim();
  const userId = loginUserId.value.trim();
  if (!name || !userId) {
    pushLog("请输入昵称和用户 ID 后再登录");
    return;
  }

  busy.value = true;
  try {
    const data = await request(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ userId, name }),
      },
      false
    );
    saveToken(data.token || "");
    currentUser.value = data.user || null;
    loginName.value = "";
    loginUserId.value = "";
    pushLog(`已登录：${currentUser.value?.id || userId}`);
    await loadState();
  } catch (error: any) {
    pushLog(`登录失败：${error.message}`);
  } finally {
    busy.value = false;
  }
}

async function logout(shouldRequest = true) {
  try {
    if (shouldRequest && authToken.value) {
      await request("/auth/logout", { method: "POST", body: JSON.stringify({}) });
    }
  } catch {
    // ignore logout request errors
  }

  saveToken("");
  currentUser.value = null;
  users.value = [];
  runtime.value = {};
  statusText.value = "未登录";
}

async function addUser() {
  busy.value = true;
  try {
    const result = await request("/access/add-user", {
      method: "POST",
      body: JSON.stringify(addUserForm),
    });
    pushLog(`已新增用户：${result.result?.user?.name || addUserForm.name} / ${result.result?.user?.id || ""}`);
    addUserForm.name = "";
    addUserForm.role = "admin";
    await loadState();
  } catch (error: any) {
    pushLog(`新增用户失败：${error.message}`);
  } finally {
    busy.value = false;
  }
}

async function updateManagedUserRole(role: string) {
  if (!selectedManagedUser.value) {
    return;
  }
  busy.value = true;
  try {
    await request("/access/set-role", {
      method: "POST",
      body: JSON.stringify({ id: selectedManagedUser.value.id, role }),
    });
    pushLog(`已更新角色：${selectedManagedUser.value.id} -> ${role}`);
    await loadState();
  } catch (error: any) {
    pushLog(`角色更新失败：${error.message}`);
  } finally {
    busy.value = false;
  }
}

async function toggleManagedPermission(permission: string, allowed: boolean) {
  if (!selectedManagedUser.value) {
    return;
  }
  busy.value = true;
  try {
    const mode = allowed ? "revoke" : "grant";
    await request(`/access/${mode}`, {
      method: "POST",
      body: JSON.stringify({ id: selectedManagedUser.value.id, permission }),
    });
    pushLog(`${mode === "grant" ? "已授予" : "已回收"}权限：${selectedManagedUser.value.id} / ${permission}`);
    await loadState();
  } catch (error: any) {
    pushLog(`权限更新失败：${error.message}`);
  } finally {
    busy.value = false;
  }
}

async function deleteManagedUser() {
  if (!selectedManagedUser.value) {
    return;
  }
  busy.value = true;
  try {
    await request("/access/delete-user", {
      method: "POST",
      body: JSON.stringify({ id: selectedManagedUser.value.id }),
    });
    pushLog(`已删除用户：${selectedManagedUser.value.id}`);
    selectedManagedUserId.value = "";
    await loadState();
  } catch (error: any) {
    pushLog(`删除用户失败：${error.message}`);
  } finally {
    busy.value = false;
  }
}

async function setUserStatus(id: string, nextStatus: "suspend" | "activate") {
  busy.value = true;
  try {
    await request(`/access/${nextStatus}`, {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    pushLog(`${nextStatus === "suspend" ? "已停用" : "已启用"}用户：${id}`);
    await loadState();
  } catch (error: any) {
    pushLog(`用户状态更新失败：${error.message}`);
  } finally {
    busy.value = false;
  }
}

async function sendChat() {
  const message = chatInput.value.trim();
  if (!message) {
    return;
  }

  const history = chatEntries.value
    .slice()
    .map((entry) => ({
      role: entry.role,
      content: entry.body,
    }));

  pushChat("user", currentUser.value?.name || currentUser.value?.id || "当前用户", message, "自然语言请求");
  chatInput.value = "";
  busy.value = true;

  try {
    const data = await request("/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        history,
      }),
    });

    const metaParts = [
      data.plan?.action ? `动作：${data.plan.action}` : "",
      data.allowed === false ? "权限拒绝" : data.executed ? "已执行" : "未执行",
      data.respondedBy || data.plannedBy || "",
    ].filter(Boolean);

    pushChat(
      "assistant",
      data.plan?.title || "AI 助手",
      data.assistantMessage || "已处理你的请求。",
      metaParts.join(" · ")
    );
    pushLog(`AI 对话完成：${data.plan?.action || "none"}`);
    await loadState();
  } catch (error: any) {
    pushChat("assistant", "执行失败", error.message || "未知错误", "请求失败");
    pushLog(`AI 对话失败：${error.message}`);
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  applyDockWidth();
  await loadHealth();
  await restoreSession();
  await nextTick();
  scrollChatToBottom();
});

onBeforeUnmount(() => {
  stopDrag();
});

watch(
  () => chatEntries.value.length,
  async () => {
    await nextTick();
    scrollChatToBottom("smooth");
  }
);

watch(
  () => aiConsoleTab.value,
  async (tab) => {
    if (tab !== "chat") {
      return;
    }
    await nextTick();
    scrollChatToBottom();
  }
);
</script>

<template>
  <aside class="ai-console-dock" :class="{ open: aiConsoleOpen }" aria-hidden="false">
    <button class="ai-console-resizer" title="拖拽调整宽度" @mousedown.prevent="startDrag" />
    <div class="ai-console-head">
      <div>
        <p class="eyebrow">AI Console</p>
        <h2>{{ isAuthenticated ? "聊天驱动工作区" : "请先登录 AI 工作区" }}</h2>
      </div>
      <button class="ai-console-close icon-only" :title="isAuthenticated ? '关闭面板' : '收起'" @click="closeAiConsole">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6.7 5.3L12 10.6l5.3-5.3 1.4 1.4L13.4 12l5.3 5.3-1.4 1.4L12 13.4l-5.3 5.3-1.4-1.4L10.6 12 5.3 6.7z" />
        </svg>
      </button>
    </div>

    <template v-if="!isAuthenticated">
      <div class="console-stage auth-stage">
        <article class="panel auth-panel">
          <header class="panel-head">
            <h3>登录 AI 模块</h3>
            <p>点击 AI 后如果尚未登录，需要先输入 super_admin 分配的昵称和用户 ID 才能进入聊天区。</p>
          </header>
          <div class="form-grid">
            <label class="wide">
              <span>昵称</span>
              <input v-model="loginName" placeholder="例如：Owner / Alice" />
            </label>
            <label class="wide">
              <span>User ID</span>
              <input v-model="loginUserId" placeholder="例如：owner / alice" />
            </label>
          </div>
          <div class="inline-actions">
            <button class="primary-button" :disabled="busy" @click="login">登录</button>
          </div>
          <p class="footnote">{{ serverHealth?.ok ? "AI 服务已就绪" : "AI 服务未连接" }} · {{ statusText }}</p>
        </article>

        <article class="panel logs-panel">
          <header class="panel-head">
            <h3>执行日志</h3>
            <p>{{ serverHealth?.ok ? "本地服务已连接" : "等待本地服务" }} · {{ statusText }}</p>
          </header>
          <div class="log-list">
            <pre v-for="entry in logs" :key="entry">{{ entry }}</pre>
          </div>
        </article>
      </div>
    </template>

    <template v-else>
      <div class="ai-console-shell">
        <nav class="console-tabs">
          <button
            v-for="tab in visibleTabs"
            :key="tab.key"
            class="tab-button"
            :class="{ active: aiConsoleTab === tab.key }"
            :title="tab.label"
            @click="aiConsoleTab = tab.key"
          >
            <span v-if="tab.key === 'chat'" class="tab-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" />
              </svg>
            </span>
            <span v-else-if="tab.key === 'me'" class="tab-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.4 0-8 2-8 4.5V20h16v-1.5C20 16 16.4 14 12 14z" />
              </svg>
            </span>
            <span v-else class="tab-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 2l2.1 2.3 3.1-.4.7 3 2.8 1.3-1.3 2.8 1.3 2.8-2.8 1.3-.7 3-3.1-.4L12 22l-2.1-2.3-3.1.4-.7-3-2.8-1.3L4.6 11 3.3 8.2 6.1 6.9l.7-3 3.1.4zM12 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3z" />
              </svg>
            </span>
          </button>
        </nav>

        <div class="console-stage">
          <template v-if="aiConsoleTab === 'chat'">
            <div class="console-stack chat-stack">
              <section class="chat-surface">
                <header class="panel-head chat-tab-head">
                  <h3>知识库对话</h3>
                </header>

                <div ref="chatStreamRef" class="chat-stream">
                  <div
                    v-for="entry in chatEntries"
                    :key="entry.title + entry.body + entry.meta"
                    class="chat-row"
                    :class="entry.role"
                  >
                    <div class="chat-avatar" aria-hidden="true">
                      <span v-if="entry.role === 'assistant'">AI</span>
                      <span v-else>我</span>
                    </div>
                    <div class="chat-bubble" :class="entry.role">
                      <div class="chat-bubble-head">
                        <strong>{{ entry.title }}</strong>
                        <span v-if="entry.meta">{{ entry.meta }}</span>
                      </div>
                      <pre>{{ entry.body }}</pre>
                    </div>
                  </div>
                </div>

                <div class="composer composer-chat">
                  <textarea
                    v-model="chatInput"
                    rows="4"
                    placeholder="比如：帮我搜索一下 vite 插件相关笔记；或者：新增一篇关于 React Server Components 的笔记，分类 frontend。"
                  />
                  <div class="composer-bar">
                    <p>支持查询、增删改和网页导入</p>
                    <button class="primary-button" :disabled="busy" @click="sendChat">发送</button>
                  </div>
                </div>
              </section>
            </div>
          </template>

          <template v-else-if="aiConsoleTab === 'me'">
            <div class="console-stack">
              <article class="panel">
                <header class="panel-head">
                  <h3>我的</h3>
                  <p>当前登录身份与 AI 模块状态。</p>
                </header>
                <div class="user-list">
                  <div class="user-card">
                    <div class="user-card-head">
                      <strong>{{ currentUser?.name || currentUser?.id }}</strong>
                      <span>{{ currentUser?.id }}</span>
                    </div>
                    <p>{{ currentUser?.role }} · {{ currentUser?.status }}</p>
                    <p v-if="isSuperAdmin">{{ runtimeSummary }}</p>
                    <p v-else>当前身份可通过 AI 对话执行已授权的知识库动作。</p>
                  </div>
                </div>
                <div class="inline-actions">
                  <button class="ghost-button" :disabled="busy" @click="logout">退出登录</button>
                </div>
              </article>

              <article class="panel">
                <header class="panel-head">
                  <h3>权限表</h3>
                  <p>显示当前账号已经拥有和未拥有的全部权限。</p>
                </header>
                <div class="permission-table-wrap">
                  <table class="permission-table">
                    <thead>
                      <tr>
                        <th>权限</th>
                        <th>状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in permissionRows" :key="row.permission">
                        <td>{{ row.permission }}</td>
                        <td :class="{ yes: row.allowed, no: !row.allowed }">
                          {{ row.allowed ? "有" : "无" }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </article>

              <article class="panel logs-panel">
                <header class="panel-head">
                  <h3>执行日志</h3>
                  <p>{{ serverHealth?.ok ? "本地服务已连接" : "等待本地服务" }} · {{ statusText }}</p>
                </header>
                <div class="log-list">
                  <pre v-for="entry in logs" :key="entry">{{ entry }}</pre>
                </div>
              </article>
            </div>
          </template>

          <template v-else>
            <div class="console-stack">
              <article class="panel">
                <header class="panel-head">
                  <h3>用户管理</h3>
                  <p>仅 super_admin 可新增用户、调整角色和分配知识库权限。</p>
                </header>
                <div class="form-grid">
                  <label>
                    <span>Name</span>
                    <input v-model="addUserForm.name" />
                  </label>
                </div>
                <div class="inline-actions">
                  <button class="primary-button" :disabled="busy" @click="addUser">新增用户</button>
                </div>
              </article>

              <article class="panel">
                <header class="panel-head">
                  <h3>用户列表</h3>
                  <p>点击详情查看用户权限、调整角色、删除用户。</p>
                </header>
                <div class="user-list">
                  <div v-for="user in users" :key="user.id" class="user-card" :class="{ selected: selectedManagedUserId === user.id }">
                    <div class="user-card-head">
                      <strong>{{ user.name }}</strong>
                      <span>{{ user.id }}</span>
                    </div>
                    <p>{{ user.role }} · {{ user.status }}</p>
                    <div class="inline-actions">
                      <button class="ghost-button" :disabled="busy" @click="selectedManagedUserId = user.id">详情</button>
                      <button class="ghost-button danger" :disabled="busy" @click="selectedManagedUserId = user.id; deleteManagedUser()">删除</button>
                      <button
                        v-if="user.status === 'active'"
                        class="ghost-button danger"
                        :disabled="busy"
                        @click="setUserStatus(user.id, 'suspend')"
                      >
                        停用
                      </button>
                      <button
                        v-else
                        class="ghost-button"
                        :disabled="busy"
                        @click="setUserStatus(user.id, 'activate')"
                      >
                        启用
                      </button>
                    </div>
                    <div v-if="selectedManagedUserId === user.id" class="user-detail-card">
                      <div class="mini-card">
                        <h4>基本信息</h4>
                        <p>{{ user.role }} · {{ user.status }}</p>
                        <div class="inline-actions">
                          <button class="ghost-button" :disabled="busy" @click="updateManagedUserRole('admin')">设为 admin</button>
                          <button class="ghost-button" :disabled="busy" @click="updateManagedUserRole('super_admin')">设为 super_admin</button>
                        </div>
                      </div>

                      <div class="mini-card">
                        <h4>权限</h4>
                        <div class="permission-table-wrap">
                          <table class="permission-table">
                            <thead>
                              <tr>
                                <th>权限</th>
                                <th>状态</th>
                                <th>操作</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="row in selectedManagedPermissionRows" :key="row.permission">
                                <td>{{ row.permission }}</td>
                                <td :class="{ yes: row.allowed, no: !row.allowed }">{{ row.allowed ? "有" : "无" }}</td>
                                <td>
                                  <button class="permission-action" :disabled="busy" @click="toggleManagedPermission(row.permission, row.allowed)">
                                    {{ row.allowed ? "回收" : "授予" }}
                                  </button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </template>

        </div>
      </div>
    </template>
  </aside>
</template>
