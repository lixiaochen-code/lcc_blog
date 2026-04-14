# AI 驱动知识库博客项目完整方案（OpenSpec / GPT Code 实施版）

> 目标：生成一份可以直接交给 GPT-5.4 / GPT-5.3 Code 在多轮对话中持续实现、并可用 OpenSpec 持续拆分任务与维护变更的**主规格文档**。

---

# 0. 文档定位

这不是普通 PRD，也不是单纯的技术选型说明。

这份文档同时承担 4 个角色：

1. **产品主规格**：定义系统目标、范围、角色、能力边界
2. **技术蓝图**：定义架构、模块、接口、数据模型、约束
3. **AI 开发输入**：可直接交给 GPT-5.4 / GPT-5.3 Code 作为长期上下文
4. **OpenSpec 源规格草案**：后续可拆分为 domain specs、proposal、design、tasks

本方案默认：

* 前台采用 **Next.js + Nextra**
* 后台与 API 采用 **Next.js App Router**
* 数据库采用 **MySQL + Prisma**
* AI 编排采用 **独立 Agent Service（Node.js + TypeScript）**
* 外部能力接入采用 **MCP Gateway + 本地 Tool SDK**
* 权限采用 **Auth.js + RBAC + 服务端 DAL 鉴权**

---

# 1. 项目定义

## 1.1 项目名称

候选名称：

* Agentic Docs
* AI Knowledge Ops
* MCP Knowledge Hub
* AI 驱动知识库博客

以下统一称为：

**AI 驱动知识库博客项目**

## 1.2 一句话定义

一个由 AI 辅助甚至半自动维护的知识库型博客 / 文档网站，支持 AI 自主选择工具、接入 MCP 获取远程知识、对内容进行增删改查与目录治理，并具备权限、审批、审计、回滚等企业级控制能力。

## 1.3 核心价值

### 对读者

* 获得结构化、可检索、持续更新的知识库
* 可通过 AI 快速检索、总结、问答

### 对管理员

* 可借助 AI 高效创建、更新、归类、整理知识内容
* 可管理内容生命周期与目录结构

### 对超级管理员

* 可控制用户、权限、AI 模型来源、AI 协议、MCP 接入与风险边界

### 对系统

* 从“静态博客”升级为“可运营的知识平台”
* 从“人工维护”升级为“AI 辅助维护”
* 从“文档站”升级为“知识治理系统”

---

# 2. 背景与设计原则

## 2.1 为什么不是普通博客

普通博客只解决“发布文章”。

本项目要解决的是：

* 内容长期维护
* 内容过期治理
* 目录与知识体系治理
* 外部资料同步
* AI 驱动的内容更新
* 权限与审批
* 可追踪、可回滚、可审计

因此它的正确产品形态不是“简单博客”，而是：

> **文档站 + 知识库 + AI Agent + 内容治理平台**

## 2.2 设计原则

1. **先规范，再自动化**
2. **先可控，再自治**
3. **AI 负责建议与执行，系统负责约束与审计**
4. **默认草稿化，谨慎发布化，严格删除化**
5. **读操作尽量自动，写操作尽量审批**
6. **工具标准化优先，Prompt 技巧次之**
7. **服务端鉴权优先，前端隐藏不算权限**
8. **可回滚是 AI 写入的前提**
9. **OpenSpec 作为长期规格源，而不是一次性文档**

---

# 3. 项目范围

## 3.1 项目目标

本项目需要实现以下能力：

1. 以文档站 + 博客形式展示知识内容
2. 支持内容新增、编辑、删除、查询、发布、归档
3. 支持目录整理、分类管理、标签体系、相关文章推荐
4. 支持 AI 检索、问答、摘要
5. 支持管理员使用 AI 管理文档内容
6. 支持 AI 在受控条件下自主选择工具
7. 支持接入 MCP 获取远程内容与外部知识源
8. 支持权限系统、用户管理、角色管理
9. 支持模型来源与协议配置
10. 支持审批、审计、版本快照、回滚
11. 支持后续通过 OpenSpec 逐步演化

## 3.2 首版不做的内容

以下内容默认不在首版范围：

* 完全自治且零审批的自动发布
* 多租户 SaaS
* 高度复杂的流程引擎
* 海量媒体资产管理系统
* 企业全文搜索平台替代品
* 强依赖私有模型训练的平台能力

## 3.3 目标用户

### 外部用户

* 浏览内容
* 搜索内容
* 阅读知识文档

### 内部普通用户

* 登录后使用 AI 进行知识检索 / 问答 / 摘要

### 内容管理员

* 使用 AI 辅助内容运营
* 管理文档、分类、标签、目录、变更审批

### 超级管理员

* 管理所有用户与系统级配置
* 管理 AI 模型来源与 MCP 接入
* 控制高风险操作

---

# 4. 用户角色与权限模型

## 4.1 角色定义

### 游客（guest）

* 只能浏览公开内容
* 不能登录后台
* 不能使用 AI

### 用户（user）

* 可登录
* 可浏览授权范围内文档
* 可使用 AI 检索 / 问答 / 摘要
* 不可使用 AI 写入内容
* 不可修改任何文档

### 管理员（admin）

* 拥有 user 能力
* 可使用 AI 生成内容草稿
* 可修改文档内容
* 可整理目录、标签、分类
* 可发起 AI 内容任务
* 可审批普通内容变更
* 不可管理用户
* 不可管理 AI provider / 协议 / MCP 配置

### 超级管理员（super_admin）

* 拥有 admin 能力
* 可管理所有用户
* 可管理角色与权限映射
* 可管理 AI 模型来源与协议
* 可管理 MCP server、密钥、白名单、风险等级
* 可执行高风险操作

## 4.2 权限点模型

建议统一使用权限点而不是仅使用角色判断。

### 文档权限

* `doc.read`
* `doc.search`
* `doc.create`
* `doc.update`
* `doc.delete`
* `doc.publish`
* `doc.archive`
* `doc.rollback`

### 目录与分类权限

* `category.read`
* `category.manage`
* `tag.read`
* `tag.manage`
* `sidebar.read`
* `sidebar.update`

### AI 权限

* `ai.search`
* `ai.ask`
* `ai.summarize`
* `ai.write`
* `ai.organize`
* `ai.delete`
* `ai.sync`

### 系统权限

* `user.manage`
* `role.manage`
* `provider.manage`
* `mcp.manage`
* `audit.read`
* `system.manage`

## 4.3 AI 权限分层

### 只读 AI

* 检索
* 问答
* 总结
* 推荐相关文章

角色：`user` / `admin` / `super_admin`

### 写入型 AI

* 新建文档草稿
* 改写现有文档
* 补充元数据
* 整理标签
* 调整目录建议

角色：`admin` / `super_admin`

### 高风险 AI

* 删除文档
* 批量移动
* 批量覆盖
* 批量合并
* 发布
* 回滚
* 修改 provider 配置
* 修改 MCP 凭据

角色：仅 `super_admin`，且默认要求审批或二次确认

## 4.4 权限实现原则

1. 页面层有可见性控制
2. API 层做真实权限校验
3. AI 工具层做统一授权拦截
4. MCP 层做 server / tool 白名单校验
5. 所有高风险操作写审计日志

---

# 5. 核心业务场景

## 5.1 阅读场景

* 游客浏览公开文档
* 用户按分类、标签、目录浏览内容
* 用户查看相关文章和版本信息

## 5.2 检索场景

* 用户通过关键词搜索文档
* 用户通过 AI 问答获取结果
* 用户查看 AI 回答的来源依据

## 5.3 内容管理场景

* 管理员新建文档
* 管理员编辑文档
* 管理员发布文档
* 管理员归档文档
* 管理员整理分类与标签

## 5.4 AI 协助写作场景

* 管理员让 AI 生成文档草稿
* 管理员让 AI 优化摘要和标题
* 管理员让 AI 根据现有内容生成 FAQ
* 管理员让 AI 对多篇文档进行去重合并建议

## 5.5 远程同步场景

* 管理员让 AI 从网页抓取资料
* 管理员让 AI 从 GitHub docs / release 获取更新
* AI 根据远程内容生成变更草稿
* 管理员审批后再发布

## 5.6 审批与回滚场景

* AI 或管理员提交 change set
* 审批人查看 diff
* 审批通过后发布
* 若出现问题可按版本回滚

## 5.7 系统配置场景

* 超级管理员管理用户
* 超级管理员添加 provider
* 超级管理员切换默认模型
* 超级管理员管理 MCP server 与权限

---

# 6. 信息架构与产品模块

## 6.1 前台模块

* 首页
* 文档中心
* 文档详情页
* 分类页
* 标签页
* 搜索页
* AI 检索页
* 相关文章模块
* 更新日志页（可选）

## 6.2 后台模块

* 仪表盘
* 文档管理
* 分类管理
* 标签管理
* 目录管理
* AI 任务中心
* 审批中心
* 版本与回滚
* 用户管理
* 角色权限管理
* 模型配置管理
* MCP 管理
* 审计日志
* 系统设置

## 6.3 Agent / Tool 模块

* Planner
* Retriever
* Tool Router
* Writer
* Reviewer
* Executor
* Provider Registry
* MCP Gateway
* Job Scheduler

## 6.4 搜索与治理模块

* 关键词搜索
* 内容分块
* 相似文档检测
* 过期内容检测
* 失效链接检测
* 内容健康度评估

---

# 7. 功能需求（适合 OpenSpec 拆分的主规格）

> 这一章按“Requirement + Scenario”的风格编写，便于后续拆到 OpenSpec 各 domain spec。

## 7.1 Domain：Authentication & Authorization

### Requirement: 用户身份认证

系统 MUST 支持用户登录、登出与会话管理。

#### Scenario: 合法用户登录

* GIVEN 用户已存在且状态为 active
* WHEN 用户使用有效凭证登录
* THEN 系统创建有效会话
* AND 记录登录审计日志

#### Scenario: 被禁用用户登录

* GIVEN 用户状态为 disabled
* WHEN 用户尝试登录
* THEN 系统拒绝登录
* AND 返回明确错误原因

### Requirement: 角色与权限控制

系统 MUST 基于角色与权限点控制页面、API、AI 工具和系统配置访问。

#### Scenario: 普通用户访问 AI 检索

* GIVEN 用户角色为 user
* WHEN 用户发起 AI 检索
* THEN 系统允许执行只读 AI 流程

#### Scenario: 普通用户发起 AI 写入任务

* GIVEN 用户角色为 user
* WHEN 用户提交 AI 写入任务
* THEN 系统拒绝执行
* AND 返回权限不足说明

#### Scenario: 超级管理员管理 provider

* GIVEN 用户角色为 super_admin
* WHEN 用户创建或修改 provider 配置
* THEN 系统允许保存配置
* AND 记录审计日志

## 7.2 Domain：Content Management

### Requirement: 文档 CRUD

系统 MUST 支持文档新增、查询、编辑、删除、发布、归档。

#### Scenario: 创建新文档

* GIVEN 管理员拥有 `doc.create`
* WHEN 提交合法文档表单
* THEN 系统创建 draft 状态文档
* AND 记录创建者与时间

#### Scenario: 发布文档

* GIVEN 文档状态为 draft 或 review
* WHEN 拥有 `doc.publish` 的用户执行发布
* THEN 系统将状态更新为 published
* AND 创建版本快照

### Requirement: 内容版本控制

系统 MUST 为每次重要内容变更保留版本快照。

#### Scenario: 编辑已发布文档

* GIVEN 文档当前状态为 published
* WHEN 管理员更新正文
* THEN 系统保存新版内容
* AND 保留旧版本快照

### Requirement: 可回滚

系统 MUST 支持将文档回滚至指定历史版本。

#### Scenario: 回滚到上一版本

* GIVEN 用户拥有 `doc.rollback`
* WHEN 选择历史版本执行回滚
* THEN 系统恢复目标版本内容
* AND 记录回滚审计日志

## 7.3 Domain：Taxonomy & Navigation

### Requirement: 分类与标签

系统 MUST 支持分类、标签、目录树管理。

#### Scenario: 调整分类

* GIVEN 管理员拥有 `category.manage`
* WHEN 修改分类名称或层级
* THEN 系统更新分类结构
* AND 维持文档映射有效

### Requirement: Sidebar 管理

系统 MUST 支持维护文档站目录树与排序。

#### Scenario: 移动文档到新目录

* GIVEN 管理员拥有 `sidebar.update`
* WHEN 将文档移动到目标节点
* THEN 系统更新 sidebar_item 位置
* AND 前台目录即时反映新结构

## 7.4 Domain：Search & Retrieval

### Requirement: 关键词搜索

系统 MUST 支持按标题、摘要和正文进行关键词搜索。

#### Scenario: 搜索命中文档

* GIVEN 数据库已建立 FULLTEXT 索引
* WHEN 用户输入关键词
* THEN 系统返回按相关度排序的文档结果

### Requirement: AI 检索与问答

系统 MUST 支持用户基于知识库进行 AI 检索、摘要与问答。

#### Scenario: 用户提出问题

* GIVEN 用户拥有 `ai.ask`
* WHEN 用户输入问题
* THEN 系统检索相关文档
* AND 生成带来源的回答

### Requirement: 结果可溯源

系统 MUST 为 AI 回答提供可追踪的来源文档引用。

#### Scenario: 展示来源

* GIVEN AI 已生成回答
* WHEN 回答返回给用户
* THEN 系统同时展示引用文档列表

## 7.5 Domain：AI Content Operations

### Requirement: AI 生成草稿

系统 MUST 支持管理员使用 AI 生成文档草稿。

#### Scenario: 新建草稿

* GIVEN 管理员拥有 `ai.write`
* WHEN 提交写作任务与主题说明
* THEN AI 生成 draft 文档或 change set 草稿
* AND 不直接覆盖已发布内容

### Requirement: AI 改写现有文档

系统 MUST 支持 AI 基于现有内容生成修改建议与 diff。

#### Scenario: 改写已发布文档

* GIVEN 文档已发布
* WHEN 管理员请求 AI 优化文档
* THEN 系统生成变更草稿与 diff
* AND 等待审批或确认

### Requirement: AI 目录整理

系统 MUST 支持 AI 提供目录、分类、标签调整建议。

#### Scenario: 建议标签体系

* GIVEN 管理员拥有 `ai.organize`
* WHEN 发起整理任务
* THEN AI 返回建议标签与目录调整方案
* AND 仅在确认后写入系统

## 7.6 Domain：Approval, Publish, Rollback

### Requirement: 变更审批

系统 MUST 支持对高风险内容变更进行审批。

#### Scenario: 提交审批

* GIVEN AI 或管理员生成 change set
* WHEN 变更策略要求审批
* THEN 系统将状态标记为 pending
* AND 发送到审批队列

### Requirement: Diff 可视化

系统 MUST 提供变更前后差异对比。

#### Scenario: 查看变更

* GIVEN 某个 change set 已生成
* WHEN 审批人打开详情页
* THEN 系统展示 before / after / diff

## 7.7 Domain：Provider & Model Management

### Requirement: Provider 配置管理

系统 MUST 支持超级管理员管理 AI 模型提供商配置。

#### Scenario: 新增 provider

* GIVEN 用户为 super_admin
* WHEN 输入 provider 名称、协议类型、base URL、模型列表
* THEN 系统保存 provider 配置
* AND 加密保存敏感字段

### Requirement: 模型选择策略

系统 MUST 支持按任务类型选择不同模型。

#### Scenario: 不同任务不同模型

* GIVEN 系统配置了多个 provider / model
* WHEN 任务类型为 search / summarize / write / organize
* THEN 系统按任务策略选择匹配模型

## 7.8 Domain：MCP Gateway & External Sync

### Requirement: MCP Server 管理

系统 MUST 支持超级管理员注册和管理 MCP server。

#### Scenario: 新增 MCP server

* GIVEN 用户为 super_admin
* WHEN 输入 transport、server URL、权限、风险等级
* THEN 系统保存 server 配置
* AND 该 server 默认处于受控可见状态

### Requirement: 远程内容抓取

系统 MUST 支持受控抓取远程内容并转为 AI 可处理上下文。

#### Scenario: 抓取网页并生成草稿

* GIVEN 管理员拥有 `ai.sync`
* WHEN 管理员提交 URL 抓取任务
* THEN 系统通过允许的 MCP / 本地抓取工具获取内容
* AND 生成摘要或文档草稿

### Requirement: MCP 权限隔离

系统 MUST 控制不同角色可使用的 MCP server 与工具。

#### Scenario: user 访问高风险 MCP

* GIVEN 用户角色为 user
* WHEN 请求调用高风险写入型 MCP 工具
* THEN 系统拒绝该调用
* AND 记录拒绝日志

## 7.9 Domain：Audit & Compliance

### Requirement: 审计日志

系统 MUST 记录重要操作的审计日志。

#### Scenario: 记录 AI 写入行为

* GIVEN AI 生成或应用了内容变更
* WHEN 任务完成
* THEN 系统记录操作者、模型、工具、时间、结果

### Requirement: 敏感配置保护

系统 MUST 对 API key、MCP 凭据等敏感信息进行加密存储。

#### Scenario: 保存 provider key

* GIVEN 超级管理员提交 provider 配置
* WHEN 配置被写入数据库
* THEN 敏感字段以加密形式保存

---

# 8. 非功能需求

## 8.1 安全

* 服务端权限校验必须覆盖所有受保护操作
* 敏感配置必须加密存储
* 高风险操作必须有审计日志
* MCP 外部授权必须与站内登录态分离
* 禁止 AI 绕过权限直接执行写入

## 8.2 可用性

* 前台页面需快速加载
* 搜索结果需在可接受延迟范围内返回
* AI 任务需可查看状态
* 长任务需可重试、取消、失败追踪

## 8.3 可维护性

* 采用 monorepo
* 共享类型与 schema
* 模块边界清晰
* 规格与实现同步更新

## 8.4 可扩展性

* 可增加新 provider
* 可增加新 MCP server
* 可增加新角色或权限点
* 可增加语义检索层
* 可增加新的 Agent 子模块

## 8.5 可观测性

* 关键 API、任务、工具调用、变更发布都必须可追踪
* 应支持错误监控、链路追踪、结构化日志

---

# 9. 技术架构

## 9.1 总体架构

```text
浏览器 / 用户 / 管理员 / 超级管理员
                ↓
        Next.js + Nextra Web App
                ↓
     Admin Console + API + DAL + Auth
                ↓
         Agent Orchestrator Service
         ├─ Planner
         ├─ Retriever
         ├─ Tool Router
         ├─ Writer
         ├─ Reviewer
         ├─ Executor
         └─ Scheduler
                ↓
           Tool Gateway
         ├─ Local Tools
         ├─ Search Tools
         ├─ Content Tools
         ├─ Publish Tools
         └─ MCP Gateway
                ↓
        MySQL / Redis / Object Storage
```

## 9.2 技术栈

### Web

* Next.js App Router
* Nextra
* MDX
* Tailwind CSS
* shadcn/ui

### Auth & Validation

* Auth.js
* Zod
* DAL（自建服务端访问层）

### Data

* MySQL 8+
* Prisma ORM
* Redis

### Agent

* Node.js
* TypeScript
* BullMQ

### Search

* MySQL FULLTEXT（MVP）
* Content Chunks（Phase 2）
* Embeddings / Semantic Retrieval（Phase 3）

### External Tools

* MCP Client / Gateway
* 本地 Tool SDK

### Observability

* Sentry
* OpenTelemetry
* Structured Logs

### Infra

* Docker Compose（开发）
* 容器化部署（生产）
* 对象存储（可选）

---

# 10. 系统分层设计

## 10.1 展示层（Web / Frontend）

职责：

* 文档展示
* 搜索交互
* AI 检索交互
* 后台管理页面
* 审批与日志查看

不负责：

* 实际长任务执行
* 直接访问高风险 MCP
* 绕过 API 的权限逻辑

## 10.2 应用层（API + DAL）

职责：

* 接收前端请求
* 鉴权
* 参数校验
* 数据访问
* 提交异步任务
* 返回同步结果或任务 ID

## 10.3 编排层（Agent Service）

职责：

* 任务拆解
* 检索上下文
* 决定是否调用工具
* 调用 provider
* 调用本地工具或 MCP 工具
* 写 change set、任务日志、工具日志

## 10.4 工具层（Tool SDK + MCP Gateway）

职责：

* 统一封装工具
* 声明输入 / 输出 schema
* 声明权限要求与风险等级
* 记录每次调用
* 管理工具白名单

## 10.5 数据层

职责：

* 存文档、版本、任务、日志、权限、配置、索引元数据
* 提供事务边界
* 支持审计追踪

---

# 11. 数据模型（逻辑设计）

## 11.1 users

* id
* email
* name
* avatar_url
* status(active/disabled/pending)
* last_login_at
* created_at
* updated_at

## 11.2 roles

* id
* code(super_admin/admin/user)
* name
* description

## 11.3 permissions

* id
* code
* module
* name
* description

## 11.4 user_roles

* user_id
* role_id

## 11.5 role_permissions

* role_id
* permission_id

## 11.6 documents

* id
* slug
* title
* summary
* content
* format(md/mdx)
* status(draft/review/published/archived)
* visibility(public/internal/private)
* source_type(human/ai/import/sync)
* source_meta_json
* created_by
* updated_by
* published_at
* created_at
* updated_at

## 11.7 document_versions

* id
* document_id
* version_no
* title_snapshot
* summary_snapshot
* content_snapshot
* created_by
* created_at

## 11.8 categories

* id
* name
* slug
* parent_id
* sort_order

## 11.9 tags

* id
* name
* slug

## 11.10 document_categories

* document_id
* category_id

## 11.11 document_tags

* document_id
* tag_id

## 11.12 sidebars

* id
* code
* name
* description

## 11.13 sidebar_items

* id
* sidebar_id
* parent_id
* document_id
* category_id
* title_override
* sort_order
* item_type(document/category/link)

## 11.14 change_sets

* id
* entity_type(document/sidebar/category/tag/provider/mcp)
* entity_id
* action(create/update/delete/move/merge/split/publish/rollback)
* before_json
* after_json
* diff_text
* reason
* triggered_by_type(user/agent/system)
* triggered_by_id
* status(pending/approved/rejected/applied/rolled_back)
* approved_by
* created_at
* applied_at

## 11.15 agent_tasks

* id
* task_type(search/ask/summarize/write/organize/sync/publish/rollback)
* task_status(pending/running/success/failed/cancelled)
* priority
* input_json
* context_json
* output_json
* error_message
* created_by
* started_at
* finished_at
* created_at

## 11.16 task_steps

* id
* task_id
* step_type(planning/retrieval/tool_call/generation/review/writeback)
* step_status
* input_json
* output_json
* error_message
* started_at
* finished_at

## 11.17 tool_execution_logs

* id
* task_id
* step_id
* tool_name
* tool_source(local/mcp)
* provider_name
* input_json
* output_json
* is_read_only
* is_destructive
* risk_level
* status(success/failure/blocked)
* started_at
* finished_at

## 11.18 provider_configs

* id
* provider_name
* protocol_type
* base_url
* api_key_encrypted
* model_json
* capability_json
* is_enabled
* is_default
* created_by
* updated_by
* created_at
* updated_at

## 11.19 mcp_servers

* id
* name
* transport_type(stdio/http)
* server_url
* auth_type(none/api_key/oauth)
* credential_encrypted
* risk_level(low/medium/high)
* is_enabled
* config_json
* created_by
* updated_by
* created_at
* updated_at

## 11.20 mcp_server_permissions

* mcp_server_id
* permission_code
* role_code

## 11.21 audit_logs

* id
* actor_type(user/agent/system)
* actor_id
* action
* target_type
* target_id
* metadata_json
* created_at

## 11.22 content_chunks（Phase 2）

* id
* document_id
* chunk_index
* chunk_text
* token_count
* hash

## 11.23 document_embeddings（Phase 3）

* id
* document_id 或 chunk_id
* embedding_vector / external_ref
* model_name
* created_at

---

# 12. 页面与路由设计

## 12.1 前台路由

* `/`
* `/docs`
* `/docs/[...slug]`
* `/categories/[slug]`
* `/tags/[slug]`
* `/search`
* `/ai/search`
* `/updates`（可选）

## 12.2 后台路由

* `/admin`
* `/admin/documents`
* `/admin/documents/[id]`
* `/admin/categories`
* `/admin/tags`
* `/admin/sidebar`
* `/admin/tasks`
* `/admin/tasks/[id]`
* `/admin/approvals`
* `/admin/versions`
* `/admin/users`
* `/admin/roles`
* `/admin/providers`
* `/admin/mcp`
* `/admin/audit`
* `/admin/settings`

## 12.3 API 路由建议

* `/api/auth/*`
* `/api/documents`
* `/api/documents/:id`
* `/api/categories`
* `/api/tags`
* `/api/sidebar`
* `/api/search`
* `/api/ai/search`
* `/api/ai/tasks`
* `/api/ai/tasks/:id`
* `/api/approvals`
* `/api/versions`
* `/api/users`
* `/api/roles`
* `/api/providers`
* `/api/mcp`
* `/api/audit`

---

# 13. AI 编排与工具设计

## 13.1 Agent 子模块

### Planner

* 解析任务目标
* 识别任务类型
* 输出执行计划

### Retriever

* 搜索本地文档
* 获取上下文
* 选择需提供给模型的片段

### Tool Router

* 判断是否需要工具
* 决定使用哪个工具
* 限制工具调用次数和范围

### Writer

* 生成摘要、问答、草稿、修改建议

### Reviewer

* 检查输出质量
* 检查格式、元数据、链接、diff 合理性

### Executor

* 写入 change set
* 调用审批 / 发布流程
* 记录日志

### Scheduler

* 处理定时任务
* 触发同步与治理任务

## 13.2 本地 Tool SDK

所有本地工具都应具备：

* name
* description
* input schema
* output schema
* permission requirement
* approval policy
* risk level
* timeout
* retry policy

### 首批本地工具

#### 文档工具

* `list_documents`
* `get_document`
* `create_document`
* `update_document`
* `delete_document`
* `publish_document`
* `rollback_document`

#### 检索工具

* `search_documents`
* `get_document_chunks`
* `find_similar_documents`
* `find_stale_documents`
* `find_broken_links`

#### 目录工具

* `get_sidebar_tree`
* `move_document_to_category`
* `reorder_sidebar_items`
* `suggest_taxonomy`

#### 变更工具

* `create_change_set`
* `get_change_set`
* `approve_change_set`
* `reject_change_set`

## 13.3 MCP Gateway

MCP Gateway 负责：

* 受控注册 MCP server
* 维护 server 元数据
* 控制哪些角色/权限可以访问哪些 server / tool
* 维护敏感凭据
* 记录每次 MCP 调用
* 实现风险等级与审批策略

### 推荐首批 MCP 接入

* Fetch MCP
* Filesystem MCP
* GitHub docs / release 类 MCP

### 后续 MCP

* 数据库类 MCP
* Notion / Confluence 类 MCP
* 内部业务系统 MCP

## 13.4 工具权限统一入口

必须实现统一授权函数：

`authorizeAIAction(user, task, tool, resource)`

输出：

* allow / deny
* reason
* needApproval
* maskedInput
* maxToolCalls

---

# 14. Provider / 模型抽象设计

## 14.1 目标

避免业务层直接绑定某一家模型 SDK。

## 14.2 抽象接口

### 文本生成

* `generateText()`
* `streamText()`

### 嵌入

* `embedText()`

### 能力探测

* `supportsToolCalling()`
* `supportsStreaming()`
* `supportsVision()`
* `supportsReasoning()`

## 14.3 任务到模型的映射建议

### 检索 / 问答

* 偏快、低成本模型优先

### 摘要 / 标签归类

* 中等成本模型

### 内容生成 / 改写

* 更强文本质量模型

### 目录治理 / 综合判断

* 更强推理模型

## 14.4 配置能力

* 默认 provider
* 默认模型
* 按任务类型覆盖模型
* 按角色限制可用模型
* provider 启停
* 限流与配额

---

# 15. 内容生命周期设计

## 15.1 文档状态流转

* draft
* review
* published
* archived

## 15.2 常见流程

### 人工新建

create -> draft -> review -> published

### AI 生成草稿

AI draft -> review -> approved -> published

### 已发布文档更新

published -> change set -> review -> applied -> published(new version)

### 删除文档

published -> delete request -> approval -> archived or deleted

## 15.3 来源追踪

每篇文档应尽量保留来源信息：

* human
* ai
* import
* sync
* external references

---

# 16. 搜索与知识检索策略

## 16.1 Phase 1：关键词搜索

* 基于 MySQL FULLTEXT
* 面向标题、摘要、正文

## 16.2 Phase 2：内容分块检索

* 将文档切分为 chunks
* 用 chunks 替代整篇文档进入 AI 上下文
* 降低 token 成本

## 16.3 Phase 3：语义检索

* 生成 embedding
* 支持相似内容召回
* 支持混合检索（关键词 + 语义）

## 16.4 检索响应原则

* 尽量返回来源
* 尽量限制幻觉
* 优先引用本地知识库
* 远程知识需标注来源与时间

---

# 17. 审批、审计与风控

## 17.1 默认策略

### 自动允许

* AI 检索
* AI 问答
* AI 摘要
* 只读远程抓取

### 管理员可直接执行

* 草稿新建
* 小范围文本改写草稿
* 标签建议
* 目录建议

### 必须审批

* 正式发布
* 删除文档
* 回滚版本
* 批量移动
* 批量合并
* 修改 provider
* 修改 MCP 配置

## 17.2 审计范围

必须记录：

* 登录 / 登出
* 用户禁用 / 启用
* 角色变更
* provider 修改
* MCP 修改
* AI 写入任务
* 工具调用
* 审批与回滚
* 删除类操作

## 17.3 风险等级

* low：只读、无副作用
* medium：创建草稿、元数据更新
* high：删除、发布、回滚、系统配置变更

---

# 18. 可观测性与运维

## 18.1 错误监控

* Web 前端错误
* API 错误
* Agent 任务错误
* MCP 调用错误

## 18.2 链路追踪

应追踪以下链路：
用户请求 -> API -> Agent -> Tool -> MCP -> DB / Change Set

## 18.3 结构化日志

建议统一输出：

* request_id
* task_id
* user_id
* tool_name
* provider_name
* mcp_server_name
* duration_ms
* result_status

## 18.4 告警

需要基础告警：

* 高频失败任务
* 高风险操作失败
* provider 不可用
* MCP server 不可用
* 搜索服务异常

---

# 19. 代码库结构建议

```text
apps/
  web/
    app/
      (docs)/
      admin/
      api/
    components/
    lib/
    styles/
  agent/
    src/
      core/
      planner/
      retriever/
      tool-router/
      writer/
      reviewer/
      executor/
      jobs/
      providers/
      mcp/
      db/
packages/
  db/
  shared/
  tool-sdk/
  content-schema/
  ui/
infra/
  docker/
  mysql/
  redis/
openspec/
  specs/
  changes/
```

---

# 20. 开发阶段规划

## Phase 0：规格与工程基线

### 目标

建立仓库、规范、基础设施与核心规格。

### 范围

* Monorepo 初始化
* TypeScript / ESLint / Prettier / CI
* MySQL / Redis / Docker Compose
* 基础 Next.js + Nextra 骨架
* 基础 Agent Service 骨架
* OpenSpec 初始化

### 交付物

* 可启动的 monorepo
* 统一环境变量模板
* OpenSpec 初始 specs 结构
* 架构图、ER 图、权限矩阵

### 验收标准

* `web`、`agent`、`db`、`redis` 本地可启动
* 基础 lint / typecheck / build 通过

## Phase 1：文档站 MVP

### 目标

先做可展示、可管理、可搜索的知识站。

### 范围

* 前台文档首页
* 文档详情页
* 分类 / 标签页
* 后台文档 CRUD
* Sidebar 管理
* MySQL FULLTEXT 搜索

### 交付物

* 前台文档站
* 后台基础管理
* 文档 CRUD API
* 搜索 API

### 验收标准

* 能创建 / 编辑 / 删除 / 发布文档
* 能查看目录、分类、标签
* 能搜索命中文档

## Phase 2：认证与权限系统

### 目标

建立用户、角色、权限、审计的完整框架。

### 范围

* Auth.js 登录
* users / roles / permissions 表
* API 权限中间层
* admin 权限页
* 审计日志基础版

### 交付物

* 登录页
* 用户管理页
* 角色权限配置页
* 权限校验库

### 验收标准

* 游客不能使用 AI
* user 只能只读 AI
* admin 可以内容管理
* super_admin 可以管理 provider / MCP

## Phase 3：AI 检索与问答

### 目标

让 AI 成为可用的知识检索入口。

### 范围

* AI 搜索页
* 问答与摘要
* 文档来源引用
* provider registry 初版
* 基础对话日志

### 交付物

* AI 搜索接口
* AI 搜索前端
* provider 配置页（基础）

### 验收标准

* user 可用 AI 检索
* 返回可追溯来源
* 游客不可访问

## Phase 4：AI 内容管理

### 目标

让 admin 可使用 AI 管理内容，但默认走草稿 / 审批。

### 范围

* AI 新建草稿
* AI 改写已有文档
* 标签 / 目录建议
* change set
* diff 展示
* 审批流

### 交付物

* AI 任务中心
* 审批中心
* 版本历史页

### 验收标准

* admin 能生成草稿
* 不会直接覆盖 published 内容
* diff 可查看
* 审批后才能正式发布

## Phase 5：MCP 与远程同步

### 目标

允许 AI 在受控条件下使用远程工具。

### 范围

* MCP Gateway
* Fetch MCP
* Filesystem MCP
* MCP 配置页
* 远程抓取任务
* 来源记录

### 交付物

* MCP 管理页面
* 抓取 / 同步任务页
* MCP 调用日志

### 验收标准

* AI 可使用允许的 MCP
* 权限生效
* 每次调用有日志

## Phase 6：知识治理

### 目标

从“内容管理”升级到“知识治理”。

### 范围

* 相似文档检测
* 重复内容合并建议
* 过期内容发现
* 失效链接检查
* 标签 / 分类优化建议
* 健康度看板

### 交付物

* 内容治理页
* 健康度报告
* 失效链接报告

### 验收标准

* 能输出重复文档列表
* 能输出过期文档建议
* 能输出目录治理建议

## Phase 7：半自动运营

### 目标

实现定时同步和策略化执行。

### 范围

* 定时任务
* Webhook 触发
* 任务调度
* 成本与限流
* 自动草稿策略
* 失败告警

### 交付物

* 定时任务管理页
* 策略管理页
* 告警与监控页

### 验收标准

* 定时任务稳定运行
* 低风险变更可自动生成草稿
* 高风险变更仍需审批

## Phase 8：高级能力（可选）

### 范围

* Embeddings / 语义检索
* 多 Agent 分工
* 细粒度资源范围权限
* 多知识源统一视图
* 更强治理策略

---
