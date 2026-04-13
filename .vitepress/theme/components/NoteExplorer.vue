<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

type NoteItem = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  sectionId: string;
  sectionTitle: string;
  updatedAt: string;
  url: string;
};

type SectionItem = {
  id: string;
  title: string;
};

const query = ref("");
const selectedSection = ref("");
const notes = ref<NoteItem[]>([]);
const sections = ref<SectionItem[]>([]);
const loading = ref(false);

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

async function loadNotes() {
  loading.value = true;

  try {
    const params = new URLSearchParams();
    params.set("limit", "50");
    if (query.value.trim()) {
      params.set("query", query.value.trim());
    }
    if (selectedSection.value) {
      params.set("section", selectedSection.value);
    }

    const response = await fetch(`${getApiBase()}/notes?${params.toString()}`);
    const payload = await response.json();
    notes.value = payload.items || [];
    sections.value = (payload.sections || []).map((item: SectionItem) => ({
      id: item.id,
      title: item.title,
    }));
  } finally {
    loading.value = false;
  }
}

const emptyText = computed(() => {
  if (loading.value) {
    return "正在加载知识目录…";
  }
  if (query.value.trim()) {
    return "当前关键词没有命中任何笔记。";
  }
  return "当前没有可显示的笔记。";
});

onMounted(() => {
  void loadNotes();
});
</script>

<template>
  <section class="note-explorer">
    <article class="kb-panel">
      <div class="kb-toolbar">
        <input
          v-model="query"
          class="kb-input"
          type="search"
          placeholder="按标题、摘要、标签或正文搜索"
          @keydown.enter="loadNotes"
        />
        <select v-model="selectedSection" class="kb-select" @change="loadNotes">
          <option value="">全部分区</option>
          <option v-for="section in sections" :key="section.id" :value="section.id">
            {{ section.title }}
          </option>
        </select>
        <button class="kb-button" :disabled="loading" @click="loadNotes">
          {{ loading ? "检索中…" : "刷新目录" }}
        </button>
      </div>

      <div v-if="notes.length" class="kb-list">
        <article v-for="note in notes" :key="note.id" class="kb-message">
          <a :href="note.url">{{ note.title }}</a>
          <p class="kb-muted">{{ note.sectionTitle }} · {{ String(note.updatedAt).slice(0, 10) }}</p>
          <p>{{ note.summary }}</p>
          <div class="kb-chip-row">
            <span v-for="tag in note.tags" :key="tag" class="kb-chip">{{ tag }}</span>
          </div>
        </article>
      </div>
      <p v-else class="kb-muted">{{ emptyText }}</p>
    </article>
  </section>
</template>
