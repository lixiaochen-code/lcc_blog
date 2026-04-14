<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

type Reference = {
  id: string;
  title: string;
  url: string;
};

type ChatBubble = {
  role: "user" | "assistant";
  content: string;
  references?: Reference[];
};

type RuntimeInfo = {
  configured: boolean;
  provider: string;
  model: string;
  baseUrl: string;
};

const prompt = ref("这个知识库现在主要解决什么问题？");
const loading = ref(false);
const runtime = ref<RuntimeInfo | null>(null);
const warning = ref("");
const messages = ref<ChatBubble[]>([
  {
    role: "assistant",
    content: "我会先检索知识库，再结合命中的笔记给出回答。如果配置了 OpenAI 兼容模型接口，我也会自动调用模型进行二次整理。",
  },
]);

function getApiBase() {
  if (typeof window === "undefined") {
    return "/api";
  }

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:3030/api";
  }

  return "/api";
}

const runtimeLabel = computed(() => {
  if (!runtime.value) {
    return "正在检测 AI 运行状态…";
  }

  if (!runtime.value.configured) {
    return "当前未配置远程模型，将使用本地检索模式回答。";
  }

  return `当前模型：${runtime.value.provider} / ${runtime.value.model}`;
});

async function loadRuntime() {
  try {
    const response = await fetch(`${getApiBase()}/runtime`);
    const payload = await response.json();
    runtime.value = payload.runtime;
  } catch {
    runtime.value = {
      configured: false,
      provider: "",
      model: "",
      baseUrl: "",
    };
  }
}

async function submit() {
  if (!prompt.value.trim() || loading.value) {
    return;
  }

  const userMessage = prompt.value.trim();
  messages.value.push({ role: "user", content: userMessage });
  loading.value = true;
  warning.value = "";
  prompt.value = "";

  try {
    const response = await fetch(`${getApiBase()}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessage,
        history: messages.value
          .filter((item) => item.role === "user" || item.role === "assistant")
          .map((item) => ({
            role: item.role,
            content: item.content,
          })),
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "请求失败");
    }

    warning.value = payload.warning || "";
    messages.value.push({
      role: "assistant",
      content: payload.answer,
      references: payload.references || [],
    });
  } catch (error) {
    messages.value.push({
      role: "assistant",
      content: error instanceof Error ? error.message : "请求失败，请检查后端服务是否已启动。",
    });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadRuntime();
});
</script>

<template>
  <section class="ai-workbench">
    <div class="kb-card-grid">
      <article class="kb-panel">
        <h2>AI 工作台</h2>
        <p>{{ runtimeLabel }}</p>
        <p class="kb-muted">
          这里不再依赖旧控制台的登录流和状态耦合，直接围绕当前知识库索引工作。
        </p>
      </article>

      <article class="kb-panel">
        <h2>推荐提问方式</h2>
        <div class="kb-list">
          <div>“这个项目的知识库部分是怎么设计的？”</div>
          <div>“有哪些笔记提到了权限控制？”</div>
          <div>“帮我概括一下 Vite 学习笔记的重点。”</div>
        </div>
      </article>
    </div>

    <article class="kb-panel" style="margin-top: 1rem">
      <div class="kb-chat-thread">
        <article
          v-for="(message, index) in messages"
          :key="index"
          class="kb-message"
          :class="{ 'kb-message-user': message.role === 'user' }"
        >
          <strong>{{ message.role === "user" ? "你" : "知识库助手" }}</strong>
          <p style="white-space: pre-wrap; margin-bottom: 0">{{ message.content }}</p>
          <div v-if="message.references?.length" class="kb-reference-list">
            <a v-for="item in message.references" :key="item.id" :href="item.url">
              {{ item.title }}
            </a>
          </div>
        </article>
      </div>

      <p v-if="warning" class="kb-muted kb-chat-warning">{{ warning }}</p>

      <div class="kb-chat-composer">
        <div class="kb-toolbar kb-chat-toolbar">
          <textarea
            v-model="prompt"
            class="kb-textarea"
            placeholder="输入问题，系统会先做本地检索，再决定是否调用远程模型。"
          />
          <button class="kb-button" :disabled="loading" @click="submit">
            {{ loading ? "正在回答…" : "发送问题" }}
          </button>
        </div>
      </div>
    </article>
  </section>
</template>
