---
title: "知识库开始使用"
summary: "通过开发工作台更新的摘要。"
tags: ["知识库", "工作流", "Codex", "OpenCode"]
aliases: ["kb guide", "知识库说明"]
category: "inbox"
createdAt: "2026-04-08T00:00:00.000Z"
updatedAt: "2026-04-08T05:41:57.887Z"
---


# 知识库开始使用

当前项目已经升级为一个以 Markdown 为底座的个人知识库系统。

## 核心原则

- Markdown 是唯一真源，AI 只负责辅助整理和写回。
- 检索优先，生成其次，避免每次问答都把整个知识库喂给模型。
- 目录、索引、最近更新这些高频结构由本地脚本维护，减少 token 消耗。
- 目录结构由 `data/docs.json` 驱动，AI 调整信息架构时优先改这个文件。

## 命令入口

- `pnpm kb:build`：重建知识库索引、目录页和站点导航。
- `pnpm kb:add --title "标题" --category inbox --tags 标签1,标签2 --content "正文"`：新增一篇笔记。
- `pnpm kb:update --slug getting-started --append "补充内容"`：给某篇笔记追加内容。
- `pnpm kb:search 检索词`：本地检索最相关的笔记。
- `pnpm kb:context 检索词`：输出适合喂给 AI 的紧凑上下文。
- `pnpm kb:agent --action retrieve --query "问题"`：给 AI 的统一入口，适合 Codex 或 OpenCode 在上层驱动。
- `pnpm kb:url --action inspect --url "https://example.com"`：抓取网页并提取正文，但不写入知识库。
- `pnpm kb:agent --action ingest-url --url "https://example.com"`：抓取网页正文并写入知识库。

## docs.json 驱动的目录

`data/docs.json` 记录每个文档的结构化信息，例如：

- 文档属于哪个 section
- 在导航里的显示标题
- 排序顺序
- 是否隐藏
- section 的名称和描述

构建时会先扫描 Markdown 文件，再和 `data/docs.json` 合并，最终生成：

- header 中的知识库总入口
- `notes/index.md`
- `/notes/` 侧边栏

这样做的好处是，AI 不需要通过文件夹名字猜目录结构，而是只需要维护一个紧凑的结构化文件。

## 未来如何接入对话式更新

后续无论是在 Codex 还是 OpenCode 中，都可以把用户意图收束成几个稳定动作：

- add：新增笔记
- append：向现有笔记追加内容
- update-meta：更新摘要、标签、别名
- search：先检索，再回答

这样做的好处是，AI 不需要直接“自由发挥改库”，而是执行有限的可审计动作。

## 仓库内 Skill

当前仓库还提供了一个轻量 skill：

- `skills/personal-kb/SKILL.md`

它的职责不是执行写入，而是约束 AI 始终先走 `kb:agent retrieve`，只在命中结果不足时才扩大读取范围。

## 网页导入

网页导入采用两层策略：

- 先用 `curl` 抓取，适合普通 SSR 页面。
- 如果正文过短、页面脚本过多，或者遇到验证页，再切到 `headless Chrome --dump-dom`，适合 SPA 或客户端渲染页面。

像微信文章这类页面，通常更适合走浏览器抓取。
