---
layout: home
title: LCC Knowledge Lab
titleTemplate: false
hero:
  name: LCC Knowledge Lab
  text: 重新开始的个人知识系统
  tagline: 用 Markdown 保存知识，用统一索引驱动站点，用检索优先的 AI 工作台回答问题。
  actions:
    - theme: brand
      text: 进入知识库
      link: /notes/
    - theme: alt
      text: 打开 AI 工作台
      link: /ai/
features:
  - title: Markdown-first
    details: 所有内容依旧直接存放在 notes/*.md，站点、搜索和 AI 都围绕同一份真源构建。
  - title: Retrieval-first
    details: 先检索知识库命中结果，再回答问题；如果配置了远程模型，再在检索结果上做二次整理。
  - title: Frontend / Backend Shared Index
    details: 前端目录、后端搜索和 CLI 检索统一使用 data/knowledge-base.json，不再各自维护一套逻辑。
---

<KnowledgeDashboard />
