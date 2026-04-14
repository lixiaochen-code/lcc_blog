
# 21. OpenSpec 落地建议

## 21.1 OpenSpec 使用目标

OpenSpec 用来做：

* 持续维护规格源
* 将大规格拆成多个 domain spec
* 为每个变更生成 proposal / design / tasks
* 在多轮 AI 开发中保持“要求 > 设计 > 任务 > 实现”的一致性

## 21.2 建议的 openspec/specs 目录

```text
openspec/
  specs/
    auth/
      spec.md
    content/
      spec.md
    taxonomy/
      spec.md
    search/
      spec.md
    ai-search/
      spec.md
    ai-content-ops/
      spec.md
    approvals/
      spec.md
    providers/
      spec.md
    mcp-gateway/
      spec.md
    audit/
      spec.md
    admin-console/
      spec.md
    agent-orchestration/
      spec.md
```

## 21.3 建议的 first-pass domain 拆分

### auth

* 登录
* 会话
* 角色权限
* 邀请制 / 白名单

### content

* 文档 CRUD
* 版本管理
* 状态流转

### taxonomy

* 分类、标签、目录

### search

* 关键词搜索
* 搜索排序
* 结果分页

### ai-search

* AI 检索、问答、来源引用

### ai-content-ops

* AI 草稿
* AI 改写
* 标签与目录建议

### approvals

* change set
* diff
* 审批
* 回滚

### providers

* provider 注册
* 模型选择
* 配额与限制

### mcp-gateway

* MCP server 管理
* 调用授权
* 日志

### audit

* 审计日志
* 高风险操作追踪

### admin-console

* 后台页面可见性与操作流程

### agent-orchestration

* 任务执行链
* planner / retriever / router / reviewer / executor

## 21.4 变更管理建议

每次大功能都走：

1. proposal.md
2. design.md
3. tasks.md
4. delta spec
5. 实现
6. verify
7. archive

## 21.5 OpenSpec 粒度建议

### 适合一个 change 的粒度

* 一个完整后台模块
* 一个完整领域能力
* 一个明确端到端流程

### 不适合一个 change 的粒度

* 整个项目一次性做完
* 完全无边界的“把系统做出来”

---

# 22. 给 GPT-5.4 / GPT-5.3 Code 的实施说明

## 22.1 代码实现原则

1. 严格遵守本规格
2. 先实现稳定骨架，再逐步增强
3. 所有敏感操作必须服务端鉴权
4. 所有 AI 写入必须保留 change set
5. 所有高风险操作必须有审计日志
6. 工具必须先定义 schema 再接入
7. Provider / MCP 必须做抽象，不允许写死业务逻辑
8. 优先可维护性，不追求一次做满

## 22.2 AI 开发流程建议

每轮开发建议输入：

* 当前目标 phase
* 当前 OpenSpec change
* 当前模块边界
* 验收标准
* 不允许破坏的既有约束

## 22.3 每轮开发输出要求

AI 每轮应输出：

1. 本轮目标
2. 受影响模块
3. 数据模型变更
4. API 变更
5. 页面变更
6. 风险与兼容性说明
7. 代码实现
8. 测试建议

## 22.4 代码质量要求

* TypeScript strict
* 输入输出 schema 明确
* 明确错误处理
* 尽量减少隐式依赖
* 模块边界清晰
* 关键逻辑可测试

---

# 23. 首批 OpenSpec change 建议

## change-001-foundation-monorepo

* 初始化 monorepo
* 初始化 web / agent / db / shared
* 初始化 Docker Compose
* 初始化 OpenSpec

## change-002-web-docs-shell

* 首页
* 文档布局
* 基础导航
* 基础样式

## change-003-content-crud

* documents 表
* 文档 CRUD API
* 后台文档管理页

## change-004-taxonomy-sidebar

* categories / tags / sidebar
* 前台目录展示
* 后台目录管理

## change-005-auth-rbac

* Auth.js
* users / roles / permissions
* DAL 鉴权库

## change-006-search-fulltext

* FULLTEXT 搜索
* 搜索接口
* 搜索页

## change-007-ai-search

* provider registry 基础版
* AI 检索接口
* AI 搜索页

## change-008-change-sets-approvals

* change_sets
* diff 页面
* 审批流

## change-009-ai-content-drafts

* AI 草稿生成
* AI 改写
* 写入前 change set

## change-010-provider-management

* provider 管理页
* provider 配置 API

## change-011-mcp-gateway

* mcp_servers
* 网关鉴权
* 调用日志

## change-012-remote-sync

* 远程抓取
* 外部来源记录
* 同步任务页

---

# 24. 验收总则

项目验收必须覆盖：

## 产品验收

* 页面是否符合角色权限
* 流程是否顺畅
* AI 是否符合预期边界

## 技术验收

* 类型安全
* 模块边界清晰
* API 合理
* 任务可追踪

## 安全验收

* 权限是否绕不过
* 敏感配置是否加密
* 高风险动作是否有日志

## 内容验收

* 文档结构是否稳定
* 发布与回滚是否可靠
* 搜索结果是否可用

---

# 25. 最终建议

这个项目的正确落地方向是：

> **Next.js + Nextra + MySQL + Prisma + Auth.js + Agent Service + MCP Gateway + OpenSpec**

不要把它当成“普通博客增强 AI 功能”，而要把它当成：

> **AI 驱动知识平台**

最合理的推进顺序：

1. 先建规格与工程基线
2. 再做文档站和后台骨架
3. 再做权限
4. 再做 AI 检索
5. 再做 AI 写入与审批
6. 再做 MCP 与同步
7. 最后做知识治理与半自动运营

---

# 26. 下一步最值得直接产出

1. `openspec/specs/*/spec.md` 首版拆分稿
2. `change-001-foundation-monorepo` 的 proposal / design / tasks
3. MySQL / Prisma 完整 schema
4. Monorepo 项目骨架
5. Auth + RBAC 实现骨架
6. Agent Service 骨架
7. Provider Registry 与 MCP Gateway 接口定义

---

# 27. OpenSpec 首版规格拆分草稿

> 本章节给出建议的 `openspec/specs/*/spec.md` 首版内容骨架，供后续直接复制到仓库中继续细化。

## 27.1 `openspec/specs/auth/spec.md`

```md
# auth spec

## Purpose
定义系统认证、会话、用户状态、角色与权限控制规则。

## Requirements

### Requirement: 用户认证
系统 MUST 支持用户登录、登出、会话校验与用户状态校验。

#### Scenario: 正常登录
- GIVEN 用户存在且状态为 active
- WHEN 用户提交有效凭证
- THEN 系统创建有效会话
- AND 返回当前用户基础信息与角色

#### Scenario: disabled 用户登录
- GIVEN 用户状态为 disabled
- WHEN 用户尝试登录
- THEN 系统拒绝登录

### Requirement: 角色权限校验
系统 MUST 支持基于角色和权限点的服务端鉴权。

#### Scenario: admin 访问后台文档管理
- GIVEN 当前用户角色为 admin
- WHEN 访问后台文档管理接口
- THEN 系统允许访问

#### Scenario: user 访问 provider 管理
- GIVEN 当前用户角色为 user
- WHEN 请求 provider 管理接口
- THEN 系统拒绝访问

### Requirement: 游客限制
系统 MUST 将未登录用户视为 guest，并限制其使用 AI 能力。

#### Scenario: guest 发起 AI 搜索
- GIVEN 当前请求无有效登录会话
- WHEN 请求 AI 搜索接口
- THEN 系统拒绝访问
```

## 27.2 `openspec/specs/content/spec.md`

```md
# content spec

## Purpose
定义文档内容的创建、编辑、发布、归档、删除、版本管理与来源追踪规则。

## Requirements

### Requirement: 文档 CRUD
系统 MUST 支持文档的创建、读取、更新、删除。

#### Scenario: 创建文档
- GIVEN 用户拥有 `doc.create`
- WHEN 提交合法文档数据
- THEN 系统创建 draft 文档

### Requirement: 文档状态流转
系统 MUST 支持 draft、review、published、archived 四种状态。

#### Scenario: 发布文档
- GIVEN 文档处于 draft 或 review
- WHEN 用户拥有 `doc.publish`
- THEN 系统将文档状态改为 published

### Requirement: 版本快照
系统 MUST 在重要变更时保存版本快照。

#### Scenario: 编辑已发布文档
- GIVEN 文档当前为 published
- WHEN 管理员修改正文
- THEN 系统保留历史版本并创建新版本

### Requirement: 来源追踪
系统 SHOULD 记录内容来源类型与外部引用信息。
```

## 27.3 `openspec/specs/taxonomy/spec.md`

```md
# taxonomy spec

## Purpose
定义分类、标签、目录树与导航结构规则。

## Requirements

### Requirement: 分类管理
系统 MUST 支持分类的创建、编辑、层级组织与排序。

### Requirement: 标签管理
系统 MUST 支持标签创建、编辑、绑定与去重。

### Requirement: Sidebar 管理
系统 MUST 支持目录树配置、层级、排序和文档映射。

#### Scenario: 移动目录节点
- GIVEN 用户拥有 `sidebar.update`
- WHEN 将文档移动到新目录节点
- THEN 前台目录结构正确反映变更
```

## 27.4 `openspec/specs/search/spec.md`

```md
# search spec

## Purpose
定义关键词搜索、结果排序、分页与后续内容分块检索策略。

## Requirements

### Requirement: 关键词搜索
系统 MUST 支持按标题、摘要、正文进行全文检索。

#### Scenario: 搜索关键字
- GIVEN 文档已建立 FULLTEXT 索引
- WHEN 用户输入关键词
- THEN 系统返回匹配文档列表

### Requirement: 搜索结果结构
系统 MUST 返回标题、摘要片段、slug、相关度、分类、标签等信息。

### Requirement: 分页
系统 SHOULD 支持分页、排序与空结果处理。
```

## 27.5 `openspec/specs/ai-search/spec.md`

```md
# ai-search spec

## Purpose
定义 AI 检索、问答、摘要与来源引用规则。

## Requirements

### Requirement: AI 问答
系统 MUST 支持用户基于知识库发起问题并获取答案。

#### Scenario: user 发起问题
- GIVEN 用户拥有 `ai.ask`
- WHEN 提交问题
- THEN 系统检索相关文档并生成回答

### Requirement: 来源引用
系统 MUST 为 AI 回答附带来源文档引用。

#### Scenario: 展示引用来源
- GIVEN 已生成回答
- WHEN 返回结果
- THEN 同时返回文档引用信息

### Requirement: 游客不可用
系统 MUST 限制 guest 使用 AI 检索能力。
```

## 27.6 `openspec/specs/ai-content-ops/spec.md`

```md
# ai-content-ops spec

## Purpose
定义 AI 草稿生成、文档改写、目录建议、标签建议与 change set 生成规则。

## Requirements

### Requirement: AI 生成草稿
系统 MUST 支持管理员使用 AI 生成文档草稿。

#### Scenario: 新建草稿
- GIVEN 用户拥有 `ai.write`
- WHEN 提交主题和要求
- THEN 生成 draft 文档或 change set

### Requirement: AI 改写现有文档
系统 MUST 支持对已存在文档生成修改建议和 diff。

#### Scenario: 改写已发布文档
- GIVEN 文档已发布
- WHEN 管理员发起改写任务
- THEN 系统生成变更草稿
- AND 不直接覆盖原文

### Requirement: AI 整理建议
系统 SHOULD 支持分类、标签、目录建议，但默认不自动应用。
```

## 27.7 `openspec/specs/approvals/spec.md`

```md
# approvals spec

## Purpose
定义 change set、diff、审批、发布、回滚的行为规则。

## Requirements

### Requirement: 提交审批
系统 MUST 支持对高风险变更提交审批。

#### Scenario: AI 生成 change set
- GIVEN 变更策略要求审批
- WHEN AI 生成变更
- THEN change set 状态为 pending

### Requirement: Diff 展示
系统 MUST 提供 before / after / diff 展示能力。

### Requirement: 回滚
系统 MUST 支持按历史版本回滚。
```

## 27.8 `openspec/specs/providers/spec.md`

```md
# providers spec

## Purpose
定义 AI provider、模型、协议、任务模型映射与敏感配置管理规则。

## Requirements

### Requirement: Provider 管理
系统 MUST 支持 super_admin 管理 provider 配置。

### Requirement: 模型选择策略
系统 MUST 支持按任务类型选择不同模型。

### Requirement: 敏感字段保护
系统 MUST 加密保存 provider 密钥与敏感配置。
```

## 27.9 `openspec/specs/mcp-gateway/spec.md`

```md
# mcp-gateway spec

## Purpose
定义 MCP server 注册、调用授权、日志记录与风险控制规则。

## Requirements

### Requirement: MCP server 管理
系统 MUST 支持注册、启停、配置 MCP server。

### Requirement: 调用授权
系统 MUST 控制不同角色可使用的 MCP server 与工具。

### Requirement: 风险日志
系统 MUST 记录所有 MCP 调用日志及拒绝记录。
```

## 27.10 `openspec/specs/audit/spec.md`

```md
# audit spec

## Purpose
定义关键操作审计、日志范围、敏感操作追踪与检索规则。

## Requirements

### Requirement: 审计覆盖范围
系统 MUST 记录登录、角色变更、provider 变更、MCP 变更、AI 写入、审批、删除等关键操作。

### Requirement: 可查询
系统 SHOULD 支持按操作者、时间、目标对象、动作类型查询审计日志。
```

## 27.11 `openspec/specs/admin-console/spec.md`

```md
# admin-console spec

## Purpose
定义后台页面、菜单可见性、操作流程和状态反馈规则。

## Requirements

### Requirement: 菜单可见性
系统 MUST 根据角色和权限控制后台菜单展示。

### Requirement: 关键流程页
系统 MUST 提供文档管理、任务中心、审批中心、用户管理、provider 管理、MCP 管理和审计日志页面。
```

## 27.12 `openspec/specs/agent-orchestration/spec.md`

```md
# agent-orchestration spec

## Purpose
定义 Agent 任务拆解、上下文检索、工具决策、执行、重试与记录规则。

## Requirements

### Requirement: 任务执行链
系统 MUST 支持 planner -> retriever -> tool router -> writer/reviewer -> executor 的任务链路。

### Requirement: 可观测性
系统 MUST 为任务步骤、工具调用与失败重试保留记录。

### Requirement: 权限前置
系统 MUST 在工具调用前进行权限校验。
```

---

# 28. 首批 OpenSpec Changes 详细草稿

## 28.1 `change-001-foundation-monorepo`

### proposal.md

```md
# change-001-foundation-monorepo

## Why
当前项目需要一个统一的工程基础，以支持 Web、Agent、数据库、共享包以及 OpenSpec 的长期演化。

## What Changes
- 初始化 pnpm monorepo
- 初始化 apps/web
- 初始化 apps/agent
- 初始化 packages/db、packages/shared、packages/tool-sdk
- 初始化 Docker Compose（MySQL、Redis）
- 初始化基础 lint / typecheck / build 流程
- 初始化 openspec 目录

## Impact
- 为后续所有 change 提供统一工程基础
- 不直接引入业务功能
```

### design.md

```md
# design

## Architecture
- `apps/web`：Next.js + Nextra
- `apps/agent`：Node.js + TypeScript worker
- `packages/db`：Prisma schema 与 client
- `packages/shared`：共享类型、常量、schema
- `packages/tool-sdk`：工具定义与执行抽象
- `openspec`：规格与变更管理

## Decisions
- 使用 pnpm workspace
- 使用 TypeScript strict
- 使用 Docker Compose 管理 MySQL 与 Redis
- 保持 Web 与 Agent 分离

## Risks
- 初始化依赖较多
- 目录结构一旦敲定，后续调整成本较高
```

### tasks.md

```md
# tasks

- [ ] 初始化 pnpm workspace
- [ ] 创建 apps/web
- [ ] 创建 apps/agent
- [ ] 创建 packages/db
- [ ] 创建 packages/shared
- [ ] 创建 packages/tool-sdk
- [ ] 配置 tsconfig base
- [ ] 配置 eslint / prettier
- [ ] 配置 docker-compose.yml（mysql、redis）
- [ ] 初始化 openspec 目录
- [ ] 添加根目录 README
- [ ] 确保 lint / typecheck / build 可运行
```

## 28.2 `change-002-web-docs-shell`

### proposal.md

```md
# change-002-web-docs-shell

## Why
项目需要先建立一个可访问的文档站壳体，作为前台内容展示与后续后台整合的基础。

## What Changes
- 搭建首页
- 搭建 docs 布局
- 搭建基础导航、页头、页脚
- 搭建文档详情页骨架
- 搭建基础搜索入口
- 接入 Nextra docs theme
```

### design.md

```md
# design

## Scope
只建立站点外壳与前台基础交互，不包含完整内容 CRUD 与后台权限。

## Pages
- `/`
- `/docs`
- `/docs/[...slug]`
- `/search`

## Decisions
- 使用 Nextra 作为文档主题基础
- 先使用 mock data 或本地静态样例驱动页面
- 布局需兼容后续接入真实 API
```

### tasks.md

```md
# tasks

- [ ] 初始化 Nextra docs theme
- [ ] 创建首页
- [ ] 创建 docs layout
- [ ] 创建文档详情页壳体
- [ ] 创建搜索页壳体
- [ ] 添加站点导航与页脚
- [ ] 添加基础 SEO metadata
- [ ] 添加空状态与错误状态页面
```

## 28.3 `change-003-content-crud`

### proposal.md

```md
# change-003-content-crud

## Why
文档管理是整个系统的核心数据能力，需要尽早具备可用的文档增删改查。

## What Changes
- 新增 documents、document_versions 等核心表
- 新增文档 CRUD API
- 新增后台文档管理页面
- 支持 draft / published 等基础状态
- 支持基础版本快照
```

### design.md

```md
# design

## Data Model
- documents
- document_versions

## API
- GET /api/documents
- POST /api/documents
- GET /api/documents/:id
- PATCH /api/documents/:id
- DELETE /api/documents/:id

## UI
- `/admin/documents`
- `/admin/documents/[id]`

## Decisions
- 首版正文直接存数据库
- 发布时写入版本快照
- 删除默认先做软删除或 archive 策略
```

### tasks.md

```md
# tasks

- [ ] 编写 Prisma schema：documents、document_versions
- [ ] 生成迁移
- [ ] 实现 documents DAL
- [ ] 实现 documents API
- [ ] 实现文档列表页
- [ ] 实现文档编辑页
- [ ] 实现发布动作
- [ ] 实现基础版本快照
- [ ] 编写 CRUD 测试
```

## 28.4 `change-004-taxonomy-sidebar`

### proposal.md

```md
# change-004-taxonomy-sidebar

## Why
知识库类站点需要稳定的分类、标签和目录树，否则内容难以维护和浏览。

## What Changes
- 新增 categories、tags、sidebars、sidebar_items 表
- 支持分类与标签管理
- 支持目录树管理
- 前台展示分类、标签与 sidebar
```

### design.md

```md
# design

## Data Model
- categories
- tags
- document_categories
- document_tags
- sidebars
- sidebar_items

## UI
- `/admin/categories`
- `/admin/tags`
- `/admin/sidebar`
- 前台 docs 目录展示

## Decisions
- 目录树与分类解耦
- 支持一个文档绑定多个标签
- sidebar_items 支持 document/category/link 三类节点
```

### tasks.md

```md
# tasks

- [ ] 编写 taxonomy 相关 Prisma schema
- [ ] 实现分类 CRUD API
- [ ] 实现标签 CRUD API
- [ ] 实现 sidebar CRUD API
- [ ] 实现后台分类页
- [ ] 实现后台标签页
- [ ] 实现后台目录管理页
- [ ] 实现前台目录渲染
- [ ] 编写 taxonomy 测试
```

## 28.5 `change-005-auth-rbac`

### proposal.md

```md
# change-005-auth-rbac

## Why
系统需要明确区分 guest、user、admin、super_admin，并为 AI、内容管理、provider、MCP 等能力建立统一权限边界。

## What Changes
- 接入 Auth.js
- 新增 users、roles、permissions、user_roles、role_permissions 表
- 实现服务端鉴权库
- 实现后台菜单可见性控制
- 实现 API 权限校验
- 为 AI 接口预留权限网关
```

### design.md

```md
# design

## Roles
- guest
- user
- admin
- super_admin

## Core Permission Flow
1. 解析当前会话
2. 获取用户角色
3. 聚合权限点
4. 调用 `requirePermission()` 或 `requireRole()`
5. 记录拒绝或允许日志

## Decisions
- guest 作为未登录态，不强制入库
- 权限判断以 permission code 为主
- 页面菜单只做可见性优化，非最终安全边界
```

### tasks.md

```md
# tasks

- [ ] 接入 Auth.js
- [ ] 编写 users/roles/permissions 相关 Prisma schema
- [ ] 实现登录页与会话管理
- [ ] 实现角色与权限初始化脚本
- [ ] 实现 `requireAuth()`
- [ ] 实现 `requirePermission()`
- [ ] 实现后台菜单权限过滤
- [ ] 为 AI API 增加基础权限拦截
- [ ] 编写 RBAC 测试
```

---

# 29. 建议的下一轮 AI 开发顺序

建议你后续直接用 GPT-5.4 / 5.3 Code 按以下顺序推进：

1. 先让它基于本方案输出 `openspec/specs/*/spec.md`
2. 再让它生成 `change-001-foundation-monorepo`
3. 实现 monorepo + web/agent/db 基础骨架
4. 然后依次做 `change-002`、`change-003`、`change-004`、`change-005`
5. 等权限系统完成后，再进入 AI 检索与 AI 内容管理

---

# 30. 下一步最适合继续产出的内容

1. `change-006-search-fulltext` 到 `change-012-remote-sync` 的 proposal / design / tasks
2. MySQL / Prisma 完整 schema 草稿
3. Monorepo 目录骨架与模块职责文档
4. Auth + RBAC + DAL 设计细化
5. Agent Service 与 Tool SDK 接口规范

---

# 31. OpenSpec Changes 详细草稿（change-006 ~ change-012）

## 31.1 `change-006-search-fulltext`

### proposal.md

```md
# change-006-search-fulltext

## Why
知识库站点必须具备稳定、快速、可解释的基础搜索能力。项目当前需要先建立关键词搜索能力，作为前台搜索和 AI 检索的基础召回层。

## What Changes
- 为 documents 表增加 FULLTEXT 搜索能力
- 新增搜索 DAL 与搜索 API
- 新增前台搜索页面与后台搜索复用能力
- 定义搜索结果结构与分页能力
- 为后续 AI 检索提供基础召回接口

## Impact
- 用户可按关键词搜索文档
- 后续 `change-007-ai-search` 可以直接复用搜索接口做初级检索增强
- 不包含 embedding 与语义检索
```

### design.md

```md
# design

## Scope
本 change 仅实现 MySQL FULLTEXT 关键词搜索，不实现内容分块和语义检索。

## Data
基于 `documents` 表现有字段：
- title
- summary
- content

为上述字段建立 FULLTEXT 索引。

## Search Behavior
- 支持关键词输入
- 支持按相关度排序
- 支持分页
- 支持空结果
- 支持返回文档基础元数据

## API
- GET `/api/search?q=...&page=1&pageSize=10`

响应建议：
- items[]
  - id
  - slug
  - title
  - summary
  - excerpt
  - score
  - status
  - visibility
  - tags
  - categories
- page
- pageSize
- total

## UI
- `/search`
- 支持输入框、结果列表、空状态、加载状态

## DAL
新增 `searchDocuments()`，统一处理：
- 权限范围过滤
- FULLTEXT 查询
- 结果整形

## Decisions
- 首版只搜索已允许当前用户访问的文档
- 首版不做复杂高亮，仅返回 excerpt
- 首版不做拼写纠错、同义词、搜索分析

## Risks
- FULLTEXT 对中文效果取决于分词策略
- 若中文命中效果不足，后续可增加 ngram / 分词中间层或切换更强检索方案
```

### tasks.md

```md
# tasks

- [ ] 为 documents.title/summary/content 建立 FULLTEXT 索引
- [ ] 实现 search DAL
- [ ] 实现 GET /api/search
- [ ] 为搜索结果补充 categories / tags 信息
- [ ] 实现前台 `/search` 页面
- [ ] 实现搜索输入、分页、空状态、加载状态
- [ ] 实现搜索权限过滤（public/internal/private）
- [ ] 编写搜索单元测试
- [ ] 编写搜索 API 集成测试
- [ ] 记录已知限制（中文分词、相关度策略）
```

## 31.2 `change-007-ai-search`

### proposal.md

```md
# change-007-ai-search

## Why
用户希望通过 AI 对知识库进行自然语言检索、问答与摘要，而不是只使用关键词搜索。

## What Changes
- 新增 AI 搜索 / 问答接口
- 新增 AI 搜索前端页面
- 引入 provider registry 初版
- 将 FULLTEXT 搜索作为 AI 检索召回来源
- 为回答结果增加来源引用信息
- 为 AI 访问增加权限限制与日志记录

## Impact
- `user` 及以上角色可使用 AI 检索
- `guest` 不可访问 AI 搜索
- 为后续 AI 内容生成与治理打下 provider 与任务模型基础
```

### design.md

```md
# design

## Scope
本 change 实现只读 AI 能力：
- AI 搜索
- AI 问答
- AI 摘要

不包含：
- AI 写入
- change set
- 审批流

## Input Flow
1. 用户提交问题
2. API 校验 `ai.search` / `ai.ask` 权限
3. 调用 `searchDocuments()` 召回候选文档
4. 截取文档摘要或正文片段作为上下文
5. 调用 provider 生成回答
6. 返回回答与来源引用
7. 记录 agent task / audit log

## API
- POST `/api/ai/search`

请求：
- query
- mode (`search` | `ask` | `summarize`)
- topK

响应：
- answer
- citations[]
- relatedDocuments[]
- taskId（可选）

## UI
- `/ai/search`
- 对话输入框
- 回答区域
- 来源引用区域
- 错误态 / 无权限态

## Provider Registry v1
新增简化 provider 调用层：
- 获取默认 provider
- 获取默认 model
- `generateText()`

首版只需要满足文本生成。

## Logging
- 记录 ai search task
- 记录使用的 provider / model
- 记录引用文档 ID 列表

## Decisions
- 首版不做多轮会话记忆持久化
- 首版回答必须附带来源引用
- 首版仅使用本地知识库作为主要上下文来源

## Risks
- 若召回内容质量不稳定，AI 回答可能不够准确
- 后续需要 `content_chunks` 提升上下文质量
```

### tasks.md

```md
# tasks

- [ ] 设计 provider registry v1 抽象
- [ ] 实现默认 provider 调用链路
- [ ] 实现 POST /api/ai/search
- [ ] 接入 FULLTEXT 搜索作为召回源
- [ ] 实现上下文裁剪逻辑
- [ ] 实现来源引用结构
- [ ] 实现 `/ai/search` 页面
- [ ] 增加 guest/user/admin/super_admin 权限校验
- [ ] 记录 AI 查询日志与审计日志
- [ ] 编写 AI 搜索接口测试
- [ ] 编写来源引用与权限测试
```

## 31.3 `change-008-change-sets-approvals`

### proposal.md

```md
# change-008-change-sets-approvals

## Why
系统需要让 AI 或管理员对内容变更先形成草稿和 diff，再进入审批，而不是直接覆盖正式内容。

## What Changes
- 新增 change_sets 数据模型
- 新增 before / after / diff 展示能力
- 新增审批流基础能力
- 新增变更状态流转
- 新增版本回滚入口

## Impact
- 为 AI 写入型任务提供安全边界
- 管理员可查看、审批、拒绝变更
- 后续 `change-009-ai-content-drafts` 可复用该变更机制
```

### design.md

```md
# design

## Scope
实现变更集与审批的基础设施，不限定变更来源必须是 AI。

## Data Model
新增或完善：
- change_sets
- audit_logs
- document_versions（与回滚联动）

## Change Set States
- pending
- approved
- rejected
- applied
- rolled_back

## Change Types
- create
- update
- delete
- move
- merge
- split
- publish
- rollback

## API
- GET `/api/approvals`
- GET `/api/approvals/:id`
- POST `/api/approvals/:id/approve`
- POST `/api/approvals/:id/reject`
- GET `/api/change-sets/:id`

## UI
- `/admin/approvals`
- `/admin/tasks/[id]` 可联动跳转 change set
- diff 详情页

## Diff Strategy
首版可使用文本 diff：
- before_content
- after_content
- diff_text

## Decisions
- 所有已发布文档的写入型变更默认通过 change set
- change set 应绑定触发来源：user / agent / system
- 审批与应用分离，批准后可立即应用或进入下一步发布流程

## Risks
- diff 可读性会影响审批效率
- 后续可能需要更友好的富文本 diff
```

### tasks.md

```md
# tasks

- [ ] 编写 change_sets Prisma schema
- [ ] 实现 change set DAL
- [ ] 实现 diff 生成逻辑
- [ ] 实现审批列表 API
- [ ] 实现审批详情 API
- [ ] 实现 approve/reject API
- [ ] 实现 `/admin/approvals` 页面
- [ ] 实现 diff 详情页
- [ ] 接入审计日志
- [ ] 编写审批与 diff 测试
```

## 31.4 `change-009-ai-content-drafts`

### proposal.md

```md
# change-009-ai-content-drafts

## Why
管理员需要使用 AI 生成文档草稿、改写现有文档并产出目录或标签建议，但这些输出必须先进入可审查的变更流程。

## What Changes
- 新增 AI 文档草稿任务
- 新增 AI 改写现有文档任务
- 新增 AI 标签与目录建议任务
- 将 AI 写入结果统一转为 draft 文档或 change set
- 新增 AI 任务中心基础页面

## Impact
- admin 可以开始真正使用 AI 管理内容
- 不会直接覆盖正式内容
- 与 `change-008-change-sets-approvals` 紧密联动
```

### design.md

```md
# design

## Scope
本 change 只实现“AI 生成建议 / 草稿”，不自动发布。

## Supported Task Types
- ai-create-draft
- ai-rewrite-document
- ai-suggest-tags
- ai-suggest-taxonomy

## Flow: Create Draft
1. admin 提交写作主题与约束
2. API 校验 `ai.write`
3. 创建 agent task
4. Agent 调用 provider 生成草稿
5. 系统保存为 draft 文档或 create 类型 change set

## Flow: Rewrite Document
1. admin 选择目标文档
2. API 校验 `ai.write`
3. Agent 获取原文与上下文
4. 生成修改建议
5. 系统保存 update 类型 change set
6. 管理员在审批页查看 diff

## Flow: Suggest Tags / Taxonomy
1. admin 提交整理任务
2. Agent 分析文档内容
3. 输出建议列表
4. 默认不自动应用，仅写入 task output 或生成待确认 change set

## API
- POST `/api/ai/tasks`
- GET `/api/ai/tasks`
- GET `/api/ai/tasks/:id`

## UI
- `/admin/tasks`
- `/admin/tasks/[id]`
- 任务提交表单
- 任务状态与结果页面

## Decisions
- AI 写入型任务必须绑定 task record
- 所有 rewrite 结果必须经过 change set
- 所有 AI 输出必须记录 provider / model / prompt metadata（可脱敏）

## Risks
- 草稿质量波动
- diff 过大时审批成本较高
- 需要合理限制单次输入长度与任务并发
```

### tasks.md

```md
# tasks

- [ ] 扩展 agent_tasks 支持写入型任务
- [ ] 实现 POST /api/ai/tasks
- [ ] 实现 GET /api/ai/tasks
- [ ] 实现 GET /api/ai/tasks/:id
- [ ] 实现 AI 草稿生成流程
- [ ] 实现 AI 改写文档流程
- [ ] 实现标签建议流程
- [ ] 实现目录建议流程
- [ ] 将 rewrite 任务结果接入 change set
- [ ] 实现 `/admin/tasks` 页面
- [ ] 实现任务详情页
- [ ] 编写 AI 写入流程测试
```

## 31.5 `change-010-provider-management`

### proposal.md

```md
# change-010-provider-management

## Why
系统需要允许超级管理员管理 AI 模型来源、协议、基础地址、启停状态和默认模型，以满足多 provider 和可切换模型的要求。

## What Changes
- 新增 provider_configs 表与管理 API
- 新增 provider 管理后台页面
- 支持创建、编辑、启停、默认 provider 设置
- 支持按任务类型配置默认模型
- 对敏感字段进行加密存储

## Impact
- super_admin 可管理模型来源
- Agent 与 AI 搜索/写作任务可使用统一 provider registry
```

### design.md

```md
# design

## Scope
实现 provider 管理后台与数据模型，不在此 change 中实现复杂计费、限流和高级路由策略。

## Data Model
- provider_configs

核心字段：
- provider_name
- protocol_type
- base_url
- api_key_encrypted
- model_json
- capability_json
- is_enabled
- is_default

## API
- GET `/api/providers`
- POST `/api/providers`
- GET `/api/providers/:id`
- PATCH `/api/providers/:id`
- POST `/api/providers/:id/enable`
- POST `/api/providers/:id/disable`
- POST `/api/providers/:id/set-default`

## UI
- `/admin/providers`
- provider 列表
- provider 新建/编辑表单
- 默认 provider 设置

## Security
- 仅 `super_admin` 可访问
- API key 与敏感凭据加密保存
- 返回列表时敏感字段做脱敏

## Decisions
- protocol_type 首版支持 `openai-compatible`、`anthropic`、`custom`
- model_json 可包含多个模型及能力描述
- 默认 provider 仅允许一个

## Risks
- 若 provider schema 设计过死，后续扩展成本高
- 需为不同协议预留适配层
```

### tasks.md

```md
# tasks

- [ ] 编写 provider_configs Prisma schema
- [ ] 实现敏感字段加密/解密工具
- [ ] 实现 providers DAL
- [ ] 实现 providers API
- [ ] 实现默认 provider 规则校验
- [ ] 实现 `/admin/providers` 页面
- [ ] 实现 provider 新建/编辑表单
- [ ] 实现启停与设为默认操作
- [ ] 接入审计日志
- [ ] 编写 provider 管理测试
```

## 31.6 `change-011-mcp-gateway`

### proposal.md

```md
# change-011-mcp-gateway

## Why
系统需要在受控条件下接入外部 MCP server，为 AI 提供远程内容抓取和外部工具能力，同时确保权限、日志与风险可控。

## What Changes
- 新增 mcp_servers 与相关权限配置模型
- 实现 MCP Gateway 基础层
- 支持 MCP server 注册、启停、配置
- 支持角色 / 权限对 MCP 访问控制
- 记录 MCP 调用日志

## Impact
- 为后续远程同步与外部知识获取奠定基础
- super_admin 可管理 MCP 连接
- Agent 可通过统一网关访问允许的 MCP 能力
```

### design.md

```md
# design

## Scope
本 change 只实现 MCP Gateway 基础设施，不在此 change 中完成完整远程同步业务流程。

## Data Model
- mcp_servers
- mcp_server_permissions
- tool_execution_logs（复用）

## Gateway Responsibilities
- server registry
- server enable/disable
- tool whitelist
- permission checks
- risk level enforcement
- logging
- timeout / retry policy

## API
- GET `/api/mcp`
- POST `/api/mcp`
- GET `/api/mcp/:id`
- PATCH `/api/mcp/:id`
- POST `/api/mcp/:id/enable`
- POST `/api/mcp/:id/disable`

## UI
- `/admin/mcp`
- MCP server 列表
- MCP server 配置表单
- 风险等级与权限映射配置

## Access Rules
- 仅 `super_admin` 可管理 MCP server
- `user` 默认只能访问低风险只读 MCP（若被显式授权）
- `admin` 可访问允许的只读/中风险 MCP
- 高风险写入型 MCP 默认仅 `super_admin`

## Decisions
- 首版优先支持 http / stdio 两类 transport
- tool 级别权限先用简单 role/permission 映射实现
- 每次 MCP 调用必须经过 Gateway，而不是由 Agent 直接连接

## Risks
- 第三方 MCP server 行为不可完全信任
- 需要严格限制默认开放范围
```

### tasks.md

```md
# tasks

- [ ] 编写 mcp_servers Prisma schema
- [ ] 编写 mcp_server_permissions Prisma schema
- [ ] 实现 MCP Gateway 基础接口
- [ ] 实现 MCP server DAL
- [ ] 实现 MCP 管理 API
- [ ] 实现 `/admin/mcp` 页面
- [ ] 实现 MCP 配置表单
- [ ] 实现 Gateway 权限校验
- [ ] 实现 MCP 调用日志记录
- [ ] 编写 MCP Gateway 测试
```

## 31.7 `change-012-remote-sync`

### proposal.md

```md
# change-012-remote-sync

## Why
管理员希望 AI 能从远程网页、仓库文档或其他知识源获取内容，并生成草稿或变更建议，以降低知识库维护成本。

## What Changes
- 基于 MCP Gateway 接入首批远程读取能力
- 新增远程抓取 / 同步任务
- 新增 remote source 记录与同步日志
- 支持将远程内容转为摘要、草稿或 change set
- 新增远程同步任务页面

## Impact
- admin 可发起远程内容同步
- AI 可基于外部内容生成更新建议
- 所有远程来源与同步过程可追踪
```

### design.md

```md
# design

## Scope
本 change 聚焦“只读远程内容获取 + 生成草稿/建议”，不实现高风险自动写入外部系统。

## Supported Sources v1
- Web page（通过 Fetch MCP 或受控抓取工具）
- GitHub docs / release（通过允许的 MCP）
- Filesystem 受控目录读取

## Data Model
建议新增：
- remote_sources
- sync_jobs

### remote_sources
- id
- source_type(web/github/filesystem/other)
- source_ref
- title
- metadata_json
- created_by
- created_at

### sync_jobs
- id
- remote_source_id
- task_id
- sync_type(import/summarize/draft/update-suggestion)
- status
- result_json
- created_by
- created_at
- finished_at

## Flow
1. admin 提交远程 URL / source
2. API 校验 `ai.sync`
3. 创建 sync task
4. Agent 通过 MCP Gateway 获取远程内容
5. 清洗内容
6. 生成摘要 / draft / change set
7. 记录 remote source 与 sync job
8. 返回任务结果与来源信息

## API
- POST `/api/ai/sync`
- GET `/api/ai/sync`
- GET `/api/ai/sync/:id`

## UI
- `/admin/tasks` 可展示 sync 类型任务
- 可新增 `/admin/sync` 页面
- 支持查看来源、状态、结果、失败原因

## Decisions
- 远程内容默认只读
- 远程同步默认产出草稿或建议，而不是直接发布
- 每个远程任务都必须记录来源和抓取时间

## Risks
- 外部页面内容格式不稳定
- 远程抓取内容可能噪声较大
- 需要避免将未经清洗的内容直接写入正式文档
```

### tasks.md

```md
# tasks

- [ ] 编写 remote_sources Prisma schema
- [ ] 编写 sync_jobs Prisma schema
- [ ] 实现 POST /api/ai/sync
- [ ] 实现 GET /api/ai/sync
- [ ] 实现 GET /api/ai/sync/:id
- [ ] 实现 Agent 远程抓取任务流程
- [ ] 接入首批远程源（Fetch MCP / Filesystem MCP）
- [ ] 实现远程内容清洗逻辑
- [ ] 实现远程内容转摘要/草稿/change set
- [ ] 实现 `/admin/sync` 页面或任务筛选视图
- [ ] 记录来源与同步日志
- [ ] 编写远程同步测试
```

---

# 32. change-006 ~ change-012 的依赖顺序建议

建议依赖关系：

1. `change-006-search-fulltext`
2. `change-007-ai-search`
3. `change-008-change-sets-approvals`
4. `change-009-ai-content-drafts`
5. `change-010-provider-management`
6. `change-011-mcp-gateway`
7. `change-012-remote-sync`

说明：

* `change-007` 依赖 `change-006`
* `change-009` 强依赖 `change-008`
* `change-011` 应在 `change-012` 之前完成
* `change-010` 最好在 AI 写入和远程同步前完成，以统一 provider 来源

---

# 33. 建议的下一轮产出

1. MySQL / Prisma 完整 schema 草稿
2. `change-001` ~ `change-012` 对应的目录与文件树示例
3. OpenSpec 中每个 spec 与 change 的命名规范
4. 面向 GPT-5.4 / 5.3 Code 的“首轮实现提示词模板”
