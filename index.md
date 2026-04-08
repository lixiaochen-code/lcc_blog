---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "小晨的学习笔记"
  text: "低 token、可检索、可持续整理的个人知识库"
  tagline: "Markdown 做底座，本地脚本做索引，AI 只处理命中的少量上下文。"
  actions:
    - theme: brand
      text: 打开知识库
      link: /notes/
    - theme: alt
      text: 查看工作流
      link: /notes/inbox/getting-started

features:
  - title: 本地检索优先
    details: 先筛出最相关的少量笔记，再把紧凑上下文交给 AI，尽量避免全量喂给模型。
  - title: 自动目录维护
    details: 新增或更新笔记时，会自动重建目录页、站点导航和本地索引。
  - title: 面向对话式更新
    details: 可以逐步把对话收束成 add、append、update-meta、search 等稳定动作，便于接入 Codex 或 OpenCode。
---
