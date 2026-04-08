---
title: "生产 AI 权限与发布控制设计"
summary: "规划生产站点中的 AI 工具如何受控地修改开发环境知识库，并由 owner 决定是否重建和发布生产。"
tags: ["知识库", "AI", "权限", "发布", "工作流"]
aliases: ["production ai auth", "权限设计"]
category: "architecture"
createdAt: "2026-04-08T00:00:00.000Z"
updatedAt: "2026-04-08T00:00:00.000Z"
---

# 生产 AI 权限与发布控制设计

目标不是让生产站点里的 AI 直接拥有任意文件权限，而是让它成为一个受控入口：

- 可以调用现有 MCP 和 skills
- 可以按权限修改开发环境知识库
- 是否重建与发布生产，由 owner 单独决定

## 核心原则

- Markdown 和仓库源码仍然是唯一真源。
- 生产 AI 只能调用白名单动作，不能直接获得任意 shell 权限。
- 开发环境写入与生产环境发布必须拆成两个阶段。
- 所有写入、授权、发布都必须可审计。
- Token 消耗由 owner 控制，默认不对外开放。

## 身份模型

建议至少定义四类身份：

- `owner`：最高权限，负责用户授权、权限分配、Token 配额、知识库增删改查、重建和发布。
- `editor`：可检索、可新增、可追加、可更新元信息，不可发布，不可管理用户。
- `viewer`：只能检索和问答，不能写入。
- `suspended`：账户保留，但禁止调用 AI。

身份只负责给出默认能力，真正执行时仍然要检查细粒度权限位。

## 权限位

建议把权限拆成可独立分配的能力位：

- `notes.read`
- `notes.create`
- `notes.update`
- `notes.delete`
- `docs.reorganize`
- `kb.ingest_url`
- `site.build`
- `site.deploy`
- `users.manage`
- `tokens.use`

这样可以实现：

- 某些用户只能查和新增，不能删除
- 某些用户可以整理目录，但不能发布
- 只有 owner 才能分配权限和管理 Token

## Token 与授权

非 owner 用户建议使用邀请制，而不是开放注册。

推荐流程：

1. 用户申请使用生产 AI。
2. owner 审核并决定是否开通。
3. owner 指定角色、权限位和 Token 配额。
4. 系统记录授权来源、授权时间和配额变更。
5. 用户调用 AI 时先做身份、权限、配额校验，再执行动作。

配额建议至少包含：

- 每日请求上限
- 每月 Token 上限
- 是否允许网页导入
- 是否允许写入
- 是否允许提交发布申请

## 动作白名单

生产 AI 不应直接把模型输出映射为任意命令，而是只允许调用这些受控动作：

- `retrieve`
- `add`
- `append`
- `update-meta`
- `inspect-url`
- `ingest-url`
- `rebuild`
- `deploy`

其中：

- `retrieve`、`inspect-url` 属于只读动作
- `add`、`append`、`update-meta`、`ingest-url` 属于开发环境写入动作
- `rebuild`、`deploy` 属于高权限发布动作

## 两阶段流程

生产 AI 修改知识库建议固定成两阶段：

### 第一阶段：修改开发环境

1. 用户在生产站点发起请求。
2. AI 识别意图并生成结构化动作参数。
3. 服务端权限网关校验身份、权限位和 Token 配额。
4. 网关调用现有 `kb:agent`、MCP 或 skill 执行写入。
5. 改动落到开发仓库源码，但默认不自动 build。
6. 系统记录操作日志与变更摘要。

### 第二阶段：决定是否更新生产

1. 系统生成一条“待发布变更”记录。
2. owner 查看变更摘要、操作者、涉及文件和风险说明。
3. owner 决定是否执行 `kb:build`。
4. 只有 owner 确认后，才继续部署生产静态产物。

这样可以避免：

- 普通用户改一条笔记就立即上线
- AI 写入和发布耦合
- Token 被未授权用户持续消耗

## 与现有仓库的衔接

当前仓库已有这些可直接复用的能力：

- [`scripts/kb/agent.mjs`](/Users/apple/Documents/ai/lcc_blog/scripts/kb/agent.mjs)：统一动作入口
- [`scripts/kb/url.mjs`](/Users/apple/Documents/ai/lcc_blog/scripts/kb/url.mjs)：网页抓取与导入
- [`skills/personal-kb/SKILL.md`](/Users/apple/Documents/ai/lcc_blog/skills/personal-kb/SKILL.md)：优先检索、低 token 回答约束

建议新增一个服务端动作网关，作为生产 AI 的唯一执行入口。它负责：

- 校验用户身份
- 判断权限位
- 控制 Token 额度
- 决定可调用哪些 MCP / skills / kb 脚本
- 记录审计日志

也就是说，MCP 和 skills 是能力层，权限判断必须放在外层网关里。

## 数据模型建议

最小可用的数据表可以包括：

- `users`
- `user_permissions`
- `ai_token_quotas`
- `ai_action_logs`
- `publish_requests`

建议字段示例：

- `users`：`id`、`name`、`email`、`status`、`role`
- `user_permissions`：`user_id`、`permission`、`granted_by`、`granted_at`
- `ai_token_quotas`：`user_id`、`daily_limit`、`monthly_limit`、`used_today`、`used_month`
- `ai_action_logs`：`user_id`、`action`、`target`、`args`、`result`、`created_at`
- `publish_requests`：`id`、`requested_by`、`summary`、`status`、`approved_by`、`created_at`

## 后端接口建议

建议至少提供这些接口：

- `POST /api/ai/chat`
- `POST /api/ai/actions`
- `GET /api/ai/permissions/me`
- `POST /api/admin/users/:id/permissions`
- `POST /api/admin/users/:id/quota`
- `GET /api/admin/publish-requests`
- `POST /api/admin/publish-requests/:id/approve`
- `POST /api/admin/publish-requests/:id/reject`

其中：

- `/api/ai/chat` 负责自然语言对话
- `/api/ai/actions` 负责结构化白名单动作执行
- `/api/admin/*` 只对 owner 开放

## 前端呈现建议

生产站点内的 AI 工具建议显式展示当前用户状态：

- 当前身份
- 可执行动作
- 当前 Token 剩余额度
- 最近一次写入记录
- 是否存在待 owner 审批的发布请求

对于无权限动作，不要隐藏能力说明，而是要清楚提示“需要 owner 授权”。

## 当前落地建议

第一步先改造脚本层：

- 让 `kb:agent` 的写入动作默认只写文件，不自动重建
- 把 `kb:build` 变成独立发布前动作

第二步再补应用层：

- 增加用户、权限、额度和审计表
- 增加服务端动作网关
- 增加 owner 审批发布界面

## 当前约束

如果站点未来允许“删除笔记”或“重组 docs.json”，建议一律加入二次确认，且默认只对 owner 放开。

因为这些动作的影响范围比普通追加内容更大，更容易导致导航错乱、引用失效或线上内容回退。
