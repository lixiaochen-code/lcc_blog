---
title: "杀疯了！前端最强 10 个 AI Skills ！效率提升500%！"
summary: "给前端同学整理了10个超实用的Agent开发技能，覆盖界面开发、项目搭建、代码质检、自动化测试、文档维护等全流程\n一、界面开发 & 项目搭建🎨 frontend-design来自Anthropic官方的前端界面构建工具，主打快速产出有设计感的页面。 不管是从零封装组件，还是对现有"
tags: ["微信", "AI", "前端"]
category: "web-clips"
sourceUrl: "https://mp.weixin.qq.com/s/6PVDG5yHJfnwDKEVwYdUgg"
sourceSite: "微信公众平台"
createdAt: "2026-04-08T02:46:30.114Z"
updatedAt: "2026-04-08T02:46:30.114Z"
---

# 杀疯了！前端最强 10 个 AI Skills ！效率提升500%！
> 来源：[微信公众平台](https://mp.weixin.qq.com/s/6PVDG5yHJfnwDKEVwYdUgg)
> 作者：林三心不学挖掘机
> 抓取方式：http
给前端同学整理了10个**超实用的Agent开发技能**，覆盖界面开发、项目搭建、代码质检、自动化测试、文档维护等全流程

## 一、界面开发 & 项目搭建

#### 🎨 frontend-design

来自Anthropic官方的前端界面构建工具，主打快速产出有设计感的页面。 不管是从零封装组件，还是对现有页面做重构升级，都能直接生成可用的UI代码，特别适合需要快速出稿、又不想太丑的业务场景。

- 仓库地址：https://github.com/anthropics/skills/tree/main/skills/frontend-design
- 安装命令：

```
npx skills add anthropics/skills --skill frontend-design
```

#### 🧩 fullstack-developer

一站式全栈项目脚手架助手，适合快速落地想法。 可以直接帮你搭建一套完整项目：前端用React/Next.js，后端基于Node.js，顺带把数据库和接口逻辑串联起来。做Demo、侧项目或快速原型非常香。

- 仓库地址：https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/awesome_agent_skills/fullstack-developer
- 安装命令：

```
npx skills add https://github.com/Shubhamsaboo/awesome-llm-apps --skill fullstack-developer
```

#### ⚡ cache-components

Next.js团队内部使用的组件缓存优化工具，专门适配PPR（Partial Prerendering）。 它会自动帮你梳理缓存逻辑，该缓存的缓存、该失效的失效，同时清理掉旧版不合理的页面级缓存策略，对性能敏感的Next.js项目极度友好。

- 仓库地址：https://github.com/vercel/next.js/tree/canary/.claude-plugin/plugins/cache-components/skills/cache-components
- 安装命令：

```
npx skills add https://github.com/vercel/next.js --skill cache-components
```

---

## 二、代码质量 & 自动审查

#### 🔍 frontend-code-review

Dify官方出品的前端专属代码审查工具，专注.ts/.tsx/.js文件。 会自动扫描代码问题，并按严重程度分级：哪些必须改、哪些建议优化，同时精确标出文件和行号，不用自己逐行盯，提PR前自检非常好用。

- 仓库地址：https://github.com/langgenius/dify/tree/main/.agents/skills/frontend-code-review
- 安装命令：

```
npx skills add https://github.com/langgenius/dify --skill frontend-code-review
```

#### 🧪 code-reviewer

Google Gemini CLI官方提供的通用代码审查技能，审查更全面、更严格。 支持本地变更检查和远程PR扫描，从代码正确性、可维护性、规范一致性多个维度把关，适合团队协作中提升整体代码质量。

- 仓库地址：https://github.com/google-gemini/gemini-cli/tree/main/.gemini/skills/code-reviewer
- 安装命令：

```
npx skills add https://github.com/google-gemini/gemini-cli --skill code-reviewer
```

---

## 三、测试 & 工程化提效

#### 🤖 webapp-testing

Anthropic官方的前端自动化测试技能，基于Playwright驱动。 可以自动模拟页面操作流程，跑完核心交互逻辑，同时截图、捕获控制台日志，帮你快速发现UI和交互bug，省去大量重复手动点测的时间。

- 仓库地址：https://github.com/anthropics/skills/tree/main/skills/webapp-testing
- 安装命令：

```
npx skills add anthropics/skills --skill webapp-testing
```

#### ✨ fix

React官方内部使用的代码格式化与Lint修复工具。 自动跑Prettier统一风格，再通过lint检查深层问题，避免因为格式或规范问题在CI阶段被打回，堪称提交代码前的“保险步骤”。

- 仓库地址：https://github.com/facebook/react/tree/main/.claude/skills/fix
- 安装命令：

```
npx skills add https://github.com/facebook/react --skill fix
```

#### 📝 pr-creator

Google Gemini官方的PR自动生成工具，专治PR写得乱、不规范。 按照项目模板自动填充修改内容、改动原因、影响范围等信息，顺带完成基础检查，让你的PR更专业、更少被打回修改。

- 仓库地址：https://github.com/google-gemini/gemini-cli/tree/main/.gemini/skills/pr-creator
- 安装命令：

```
npx skills add https://github.com/google-gemini/gemini-cli --skill pr-creator
```

---

## 四、文档 & 工具搜索

#### 📖 update-docs

Next.js官方自用的文档自动更新工具。 根据代码改动自动对比差异，同步更新对应文档，为新功能生成说明，解决代码一直在更、文档永远滞后的痛点，让项目文档保持最新。

- 仓库地址：https://github.com/vercel/next.js/tree/canary/.claude-plugin/plugins/update-docs
- 安装命令：

```
npx skills add https://github.com/vercel/next.js --skill update-docs
```

#### 🔎 find-skills

一个专门用来找Agent技能的“搜索引擎”。 你只需要描述你想实现的需求，它就会自动检索各类仓库，返回匹配的技能、安装命令和相关链接，不用再到处翻仓库找工具。

- 仓库地址：https://github.com/vercel-labs/skills/tree/main/skills/find-skills
- 安装命令：

```
npx skills add https://github.com/vercel-labs/skills --skill find-skills
```
