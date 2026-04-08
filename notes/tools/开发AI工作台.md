---
title: "AI 控制台接入说明"
summary: "说明站点内的 AI 控制台现在已从正文页移到 header 入口，并以独立右侧工作区展示。"
tags: ["AI", "控制台", "Dev", "权限"]
aliases: ["dev ai console", "dev ai workbench"]
category: "tools"
createdAt: "2026-04-08T00:00:00.000Z"
updatedAt: "2026-04-08T00:00:00.000Z"
---

# AI 控制台接入说明

AI 控制台现在不再作为正文页嵌在内容区里，而是：

- 入口放在 header
- 点击后展开独立右侧工作区
- 工作区内部使用纵向 Tab
- 与页面正文分栏展示，不再混进文档内容

当前已接入的动作：

- `retrieve`
- `add`
- `append`
- `update-meta`
- `delete`
- `inspect-url`
- `ingest-url`

说明：

- `读` 已接入
- `增` 已接入
- `改` 已接入
- `删` 现在也已接入
- 真正的自然语言模型编排还没接到这个 dev 页面里，当前是“对话式受控动作台”
