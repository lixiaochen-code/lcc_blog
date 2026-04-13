<script setup lang="ts">
import { kbData } from "../../generated/kb.mjs";

function formatDate(input: string) {
  return String(input || "").slice(0, 10);
}
</script>

<template>
  <section class="kb-dashboard">
    <div class="kb-card-grid">
      <article class="kb-panel" v-for="item in [
        { label: '笔记总数', value: kbData.stats.totalNotes, desc: '所有内容都直接来自 notes/*.md' },
        { label: '知识分区', value: kbData.stats.totalSections, desc: '站点导航与目录按分区组织' },
        { label: '标签数量', value: kbData.stats.totalTags, desc: '标签用于快速聚类和交叉发现' },
        { label: '预计阅读', value: `${kbData.stats.totalReadingMinutes} 分钟`, desc: '面向长期沉淀而不是短期发布' },
      ]" :key="item.label">
        <p class="kb-muted">{{ item.label }}</p>
        <div class="kb-stat">{{ item.value }}</div>
        <p class="kb-muted">{{ item.desc }}</p>
      </article>
    </div>

    <div class="kb-card-grid" style="margin-top: 1rem">
      <article class="kb-panel">
        <h2>知识分区</h2>
        <div class="kb-list">
          <div v-for="section in kbData.sections" :key="section.id">
            <strong>{{ section.title }}</strong>
            <p class="kb-muted">{{ section.description }}</p>
            <p class="kb-muted">当前 {{ section.count }} 篇</p>
          </div>
        </div>
      </article>

      <article class="kb-panel">
        <h2>最近值得先看</h2>
        <div class="kb-list">
          <div v-for="note in kbData.featured" :key="note.id">
            <a :href="note.url">{{ note.title }}</a>
            <p class="kb-muted">{{ note.sectionTitle }} · {{ formatDate(note.updatedAt) }}</p>
            <p>{{ note.summary }}</p>
          </div>
        </div>
      </article>
    </div>

    <article class="kb-panel" style="margin-top: 1rem">
      <h2>热门标签</h2>
      <div class="kb-chip-row">
        <span class="kb-chip" v-for="tag in kbData.tags" :key="tag.name">
          {{ tag.name }} · {{ tag.count }}
        </span>
      </div>
    </article>
  </section>
</template>
