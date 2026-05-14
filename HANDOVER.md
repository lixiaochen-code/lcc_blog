# LCC 知识库 · 重构交接文档

> 写给：以后接手这份项目的我（可能在另一台电脑上）。
> 状态截止时间：2026-05-15（Step 5.4 完成、Step 5.5 待开始）。

---

## 0. 一句话背景

这是一个**单用户个人知识库**：Markdown 文件存盘 + Vue 3 阅读器 + AI 草稿/落盘助手。

正在做的事：把后端从「Node 原生 http + JS」迁到「NestJS + TypeScript」，
并把 AI 从「正则猜意图 → 草稿」升级成「工具调用循环 → 真正的 CRUD + 网页抓取摘要」。

---

## 1. 当前进度

| #   | 任务                              | 状态        | 说明                                       |
| --- | --------------------------------- | ----------- | ------------------------------------------ |
| 1   | AI pipeline 重写（旧 JS 版本）    | ✅ 已完成   | `apps/kb-server/src/ai.js` 已重构为工具调用循环，作为中间态 |
| 2   | UI 套 Linear 设计系统             | ✅ 已完成   | `apps/kb-web/src/styles.css`               |
| 3   | AGENTS.md                         | ✅ 已完成   | 仓库根目录                                 |
| 4   | NestJS 骨架 + config + store      | ✅ 已完成   | `apps/server/` 已建好，依赖已装             |
| 5.1 | Auth 模块（NestJS 版）            | ✅ 已完成   | login + me；contract 与旧版一致             |
| 5.2 | Users 模块                        | ✅ 已完成   | REST `/api/admin/users/:id`；删自己 / 停用自己 / 移除全部角色都拒 |
| 5.3 | Roles 模块                        | ✅ 已完成   | REST `/api/admin/roles/:id` + `/api/admin/permissions`；系统角色仅可改权限 |
| 5.4 | KB 模块（NestJS 版）              | ✅ 已完成   | `apps/server/src/kb/*`，迁好旧 markdown.js + 关键词搜索 |
| 5.5 | Web 模块（search/fetch/ingest）   | ⬜ 待开始   | 这是「AI 没法读 URL」问题的根因，下一步先做      |
| 5.6 | AI 模块（NestJS 版）+ 工具集      | ⬜ 待开始   |                                            |
| 5.7 | MCP 模块                          | ⬜ 待开始   |                                            |
| 5.9 | 前端拆分 + 管理 UI 改造           | 🟡 部分完成 | 「账号与权限」页已重做（账号/角色 Tab + 权限矩阵 + 模态编辑器），其余还是单文件 App.vue |
| 5.10| 切流量 + 清理旧 server            | 🟡 部分完成 | 根 `kb:server` 已切到新 server，旧 `apps/kb-server` 未删除 |

> 切到新机后：第一件事就是 **Step 5.5（Web 模块）**。

---

## 1.1 跨机继续：在新电脑要做的事

```bash
git clone <repo> && cd lcc_blog
git pull
pnpm install                 # 含 apps/server，pnpm-workspace.yaml 已配
cp .env.kb.example .env.kb   # 然后填 OPENAI_API_KEY 等
```

**`.env.kb` 注意点**：

- `OPENAI_BASE_URL` 当前指向本地代理 `http://127.0.0.1:8317/v1`，模型别名 `gpt-5.4-mini`（不是
  OpenAI 官方型号）。新机如果没起这个代理，要改回 `https://api.openai.com/v1` + 真实模型名，
  或者在新机也起对应代理。
- `KB_DATA_FILE` 默认 `apps/kb-server/data/dev-store.json`，新旧 server 共用，**别覆盖**：里面是
  唯一的 `superadmin / Admin@123456`。

**启动**：

```bash
pnpm kb:server   # 现在已经指向新 NestJS 后端（apps/server，端口 4010）
pnpm kb:web      # vite，5173 → 代理 /api 到 :4010
# 旧 server 想做对照时：pnpm kb:server:legacy
```

**验收当前状态**：

- 登录 `superadmin / Admin@123456`。
- 左侧目录树有内容（来自 `docs/knowledge/`）。
- 顶部「管理」→ 账号 / 角色两个 Tab，新增/编辑/删除都能跑通；新建账号会展示一次明文密码。
- AI 面板还在用**旧后端的逻辑**——新 NestJS 的 AI 模块还没建，所以面板里发消息会 404。这是预期。

---

## 1.2 已经做完的关键决策（接手前必读）

1. **构建工具**：`apps/server` 用 `ts-node-dev`（不是 tsx）。esbuild 不发 decorator metadata，
   Nest 的构造函数注入会全部炸，这点已踩过。`build` 走 `tsc`，`dev` 走 `ts-node-dev --respawn
   --transpile-only --exit-child`。
2. **包管理**：根 `pnpm-workspace.yaml` 已加 `apps/*`。`apps/server` 不再单独 `pnpm install`。
3. **AuthGuard 注册**：用 `APP_GUARD` provider，**不要**再 `useGlobalGuards(app.get(AuthGuard))`，
   后者拿到的实例不会被 DI 填进 Reflector / JwtService。
4. **配置路径**：`apps/server/src/config/app.config.ts` 改成上溯找 `.env.kb` 定位 repo 根，
   所有相对路径都基于 repo 根（不是 `process.cwd()`）。否则用 `pnpm --filter @lcc/server dev`
   时会在 `apps/server/` 里创出空的 `docs/knowledge` 和 `apps/kb-server/data` 副本。
5. **store 自愈**：`JsonStoreService.migrate()` 现在会确保 `r_super` 永远拥有全部 `PERMISSIONS`。
   将来再加新权限项，老 dev-store 会自动补齐，不用手动 reseed。
6. **`/api/auth/me` 返回 `null`**（显式 JSON `null`，不是空 body）：前端首屏探测 session 用，
   不能 401。
7. **新增账号管理 UI 前端契约**：`POST /api/admin/users`、`PUT /api/admin/users/:id`、
   `DELETE /api/admin/users/:id`；角色同理；外加 `GET /api/admin/permissions` 返回
   `{ groups: PERMISSION_GROUPS }`。`api.ts` 已经按这个写好了。

---

## 2. 整体目标结构（要做成什么样）

```
apps/
  server/                            # 新：NestJS + TypeScript 后端
    src/
      main.ts                        # ✅ 已写
      app.module.ts                  # ✅ 已写
      common/
        auth-context.ts              # ✅ 已写
        auth-context.service.ts      # ✅ 已写
        common.module.ts             # ✅ 已写
        permissions.ts               # ✅ 已写（含 PERMISSIONS + PERMISSION_GROUPS）
        decorators/
          current-user.decorator.ts  # ✅ 已写
          public.decorator.ts        # ✅ 已写
          require-permissions.decorator.ts # ✅ 已写
        guards/
          auth.guard.ts              # ✅ 已写（统一鉴权 + 鉴权）
        filters/
          http-exception.filter.ts   # ⬜ 待写（统一错误格式）
        utils/
          password.ts                # ✅ 已写
      config/
        app.config.ts                # ✅ 已写（已修：上溯找 .env.kb 定位 repo 根）
        config.module.ts             # ✅ 已写（提供 APP_CONFIG token）
      store/
        store.types.ts               # ✅ 已写
        json-store.service.ts        # ✅ 已写（含 migrate()，含 r_super 权限自愈）
        store.module.ts              # ✅ 已写
      auth/
        jwt.service.ts               # ✅ 已写
        auth.service.ts              # ✅ 已写
        auth.controller.ts           # ✅ 已写（/login + /me）
        dto/login.dto.ts             # ✅ 已写
        auth.module.ts               # ✅ 已写
      users/
        users.service.ts             # ✅ 已写
        users.controller.ts          # ✅ 已写（REST `/api/admin/users/:id`）
        dto/{create,update}-user.dto.ts # ✅ 已写
        users.module.ts              # ✅ 已写
      roles/
        roles.service.ts             # ✅ 已写
        roles.controller.ts          # ✅ 已写（含 `/api/admin/permissions`）
        dto/{create,update}-role.dto.ts # ✅ 已写
        roles.module.ts              # ✅ 已写
      kb/
        kb.types.ts                  # ✅ 已写
        kb.service.ts                # ✅ 已写（filesystem CRUD + path safety）
        kb-search.service.ts         # ✅ 已写（关键词召回，可后续升级为 embedding）
        kb.controller.ts             # ✅ 已写
        dto/{upsert-article,move-article}.dto.ts # ✅ 已写
        kb.module.ts                 # ✅ 已写
      web/
        web-search.service.ts        # ⬜ 待写（迁移 mcp.js 的 DDG/Bing）
        web-fetch.service.ts         # ⬜ 待写（fetch + 简易 readability）
        web-ingest.service.ts        # ⬜ 待写（URL → 抓 → 摘要 → 落 KB）
        web.controller.ts            # ⬜ 待写
        web.module.ts                # ⬜ 待写
      mcp/
        mcp.service.ts               # ⬜ 待写
        mcp.controller.ts            # ⬜ 待写
        adapters/
          mcp-adapter.interface.ts   # ⬜ 待写
          http-mcp.adapter.ts        # ⬜ 待写
        mcp.module.ts                # ⬜ 待写
      ai/
        prompts.ts                   # ⬜ 待写（系统提示词）
        providers/
          provider.interface.ts      # ⬜ 待写
          openai-compatible.provider.ts # ⬜ 待写
        tools/
          tool.interface.ts          # ⬜ 待写
          tool-registry.ts           # ⬜ 待写
          kb-search.tool.ts          # ⬜ 待写
          kb-read.tool.ts            # ⬜ 待写
          kb-write.tool.ts           # ⬜ 待写（create/update/delete/move 四合一）
          web-search.tool.ts         # ⬜ 待写
          web-fetch.tool.ts          # ⬜ 待写
          web-ingest.tool.ts         # ⬜ 待写
        ai.service.ts                # ⬜ 待写（工具调用循环 + SSE 流）
        ai.controller.ts             # ⬜ 待写
        ai.module.ts                 # ⬜ 待写
      audit/
        audit.service.ts             # ✅ 已写
        audit.controller.ts          # ✅ 已写
        audit.module.ts              # ✅ 已写
    data/                            # ⬜ 待复制（沿用旧的 dev-store.json，下文 §6）
    package.json                     # ✅ 已写（已切到 ts-node-dev）
    tsconfig.json                    # ✅ 已写
  kb-web/                            # 前端，保留
    src/
      App.vue                        # 🟡 单文件，账号/角色管理已重做；其余还没拆
      api.ts                         # ✅ 已对齐新后端契约
      components/                    # ⬜ 待拆出
        Workspace.vue
        AiPanel.vue
        AdminPanel.vue
        RoleManager.vue
        UserManager.vue
        LoginModal.vue
        TreeList.vue
      composables/
        useSession.ts
        useKb.ts
        useAi.ts
      api/                           # ⬜ 待拆（目前都在 api.ts 里）
        index.ts
        auth.api.ts
        kb.api.ts
        ai.api.ts
        admin.api.ts
        web.api.ts
      markdown.ts
      styles.css                     # ✅ 已套 Linear（含 Admin v2 块）
  kb-server/                         # 🟡 旧 JS 后端，仍可用 `pnpm kb:server:legacy` 起；最终要删
docs/
  knowledge/                         # 内容
  kb-architecture.md                 # 完成后更新
pnpm-workspace.yaml                  # ✅ 已加（packages: ['apps/*']）
HANDOVER.md                          # ← 你正在看的这个
AGENTS.md                            # ✅ 已写
```

---

## 3. 已经写好的代码，下面这些**别动**

- `apps/server/package.json` —— 依赖已 `pnpm install` 完成；`dev` 已切到 `ts-node-dev`（**不要**换回 `tsx`）。
- `apps/server/tsconfig.json` —— `experimentalDecorators` + `emitDecoratorMetadata` 都开了。
- `apps/server/src/config/*` —— 加载 `.env.kb`、提供 `APP_CONFIG` DI token；路径基于 repo 根（上溯找 `.env.kb`），**别改回 `process.cwd()`**。
- `apps/server/src/store/*` —— `JsonStoreService` 已带 `migrate()`（含 r_super 自愈），**新字段加在 `store.types.ts` + `buildInitialStore()` + `migrate()` 三处**即可。
- `apps/server/src/common/*` —— 鉴权基础设施全在这（permissions / AuthContext / AuthGuard / 装饰器）。
- `apps/server/src/auth/*` —— jwt + login/me；`/api/auth/me` 显式回 JSON `null`，前端首屏需要。
- `apps/server/src/users/*`、`apps/server/src/roles/*` —— Step 5.2 / 5.3 完整 CRUD，含「不能删自己 / 不能停用自己 / 系统角色仅可改权限」等防御。
- `apps/server/src/kb/*` —— Step 5.4，路径安全走 `assertSafePath`，**任何新功能也走它**。
- `apps/server/src/audit/*` —— 日志服务、`audit:view` 权限的查看接口。
- `apps/server/src/common/utils/password.ts` —— pbkdf2 + 16 字节盐。
- `apps/server/src/app.module.ts` —— 已用 `APP_GUARD` 注册 `AuthGuard`；**不要**改成 `useGlobalGuards()`。
- `pnpm-workspace.yaml` —— `apps/*`，新机别忘记。
- `apps/kb-web/src/api.ts` —— 已对齐新后端契约（`PUT /admin/users/:id`、`/admin/permissions { groups }` 等）。

⚠️ **不要把旧仓库里的 `dev-store.json` 删掉**：里面已经有 `superadmin / Admin@123456`。
新 server 默认还指向 `apps/kb-server/data/dev-store.json`（见 `app.config.ts`），保留兼容。

⚠️ **不要清 `docs/knowledge/` 里的内容**——AI 模块没建之前已经手动写过几篇，是用户的实际笔记。

---

## 4. 下一步要做什么（按顺序，每一步都让 lint/type-check/build 过）

> **接手须知**：5.1 / 5.2 / 5.3 / 5.4 已完成，下面那几节当**实现回顾**看就行。
> **真正要从这里开始**：跳到 **Step 5.5**。

### Step 5.1 · Auth 模块（先做这个）  ✅ 已完成

文件：

- `auth/auth.service.ts`：`login(username, password)` 校验账号 → 返回 `{ token, user }`；`me(ctx)` 直接回 `AuthContext`。
- `auth/auth.controller.ts`：`POST /api/auth/login`（`@Public()`）、`GET /api/auth/me`（默认需登录）。
- `auth/dto/login.dto.ts`：`class-validator` 装饰，`username` `password` 都是 `@IsString() @MinLength(...)`.
- `auth/auth.module.ts`：导出 `JwtService` + `AuthService`，被 `AppModule` 引用。

接口契约**必须**和旧版完全一致（前端已经在用）：
```
POST /api/auth/login → { token, user: AuthContext }
GET  /api/auth/me   → AuthContext | null
```

### Step 5.2 · Users 模块  ✅ 已完成

- `users.service.ts`：`list()` / `create(dto)` / `update(id, dto)` / `resetPassword(id)` / `remove(id, currentUserId)`。
  - **`remove` 不允许删自己**（带 `currentUserId` 防御）。
  - `create` 没指定密码时用 `randomPassword()`，返回明文给前端展示一次。
  - 所有 mutate 走 `JsonStoreService.mutate()`，写完调 `AuditService.log()`。
- `users.controller.ts`：
  ```
  GET    /api/admin/users          → user:update
  POST   /api/admin/users          → user:create
  PUT    /api/admin/users/:id      → user:update
  DELETE /api/admin/users/:id      → user:delete
  ```
- DTO：`CreateUserDto { username, password?, roleIds[] }`，`UpdateUserDto { roleIds?, disabled?, resetPassword? }`。

### Step 5.3 · Roles 模块  ✅ 已完成

- `roles.service.ts`：`list()` / `create(dto)` / `update(id, dto)` / `remove(id)`；
  **系统角色（`system: true`）不能改 `permissions` 之外的字段、不能删**。
- `roles.controller.ts`：
  ```
  GET    /api/admin/roles                 → role:assign
  POST   /api/admin/roles                 → role:create
  PUT    /api/admin/roles/:id             → role:update
  DELETE /api/admin/roles/:id             → role:delete
  GET    /api/admin/permissions           → role:assign  （返回 PERMISSION_GROUPS）
  ```

### Step 5.4 · KB 模块（迁移 + 增强）  ✅ 已完成

复用旧 `apps/kb-server/src/markdown.js` 的逻辑，**改成 TS**：

- `kb.service.ts`：
  - `assertSafePath(rawPath)` —— 路径安全（不准 `..`，必须 `.md`）。
  - `listTree()` / `readArticle(path)` / `writeArticle(path, content)` / `deleteArticle(path)` / `moveArticle(from, to, title?)` / `flattenTree()`.
- `kb-search.service.ts`：先实现关键词召回（match 路径 + 标题，可选 + 正文）。
  - 留 `searchByQuery(query, limit)` 接口，将来换 embedding 不改外部。
- `kb.controller.ts`：
  ```
  GET    /api/kb/tree          → kb:view
  GET    /api/kb/article?path= → kb:view
  POST   /api/kb/article       → kb:create
  PUT    /api/kb/article       → kb:update
  DELETE /api/kb/article?path= → kb:delete
  POST   /api/kb/move          → kb:move    body: { from, to, title? }
  GET    /api/kb/search?q=     → kb:view
  ```

### Step 5.5 · Web 模块（搜索 + 抓取 + ingest）  ⬅️ **从这里开始**

> **为什么这是下一步**：用户最近一次会话给了 GitHub README 的 URL，AI 没法读，只能凭仓库名瞎
> 总结。根因不是模型，是**当前 AI pipeline 物理上没有 `web_fetch` 工具**——只有 `web_search`，
> 且后者走 DDG/Bing 搜索接口，不会拿正文。先把 web-fetch 这一件做出来，AI 模块（5.6）一接就能
> 解锁「贴 URL → 抓 → 总结 → 草稿」这条主路。

- `web-search.service.ts`：迁移旧 `mcp.js` 的 DDG / Bing 兜底逻辑，**支持 MCP HTTP endpoint 优先**。
- `web-fetch.service.ts`：
  - 输入 URL，`fetch` 拉 HTML（带 UA、8s 超时、限制最大 2MB）。
  - 简易正文提取：去掉 `<script> <style> <nav> <aside> <footer>`；取 `<main>` / `<article>` / 最长 `<div>`；再 strip tag 转纯文本。
  - 返回 `{ url, title, content, fetchedAt }`。
  - **关键**：不要装 jsdom / readability 这类大依赖，正则 + DOM 解析即可（社区里有 100 行版本可参考）。
- `web-ingest.service.ts`：
  - `ingest(url, options)`：调 `web-fetch` 抓正文 → 调 AI provider 让模型生成 `{ title, slug, category, markdown }` 摘要 → 调 `kb.service.writeArticle` 落盘。
  - 这是用户的主场景之一：「看到好文章 → 让 AI 抓 → 落进知识库」。

### Step 5.6 · AI 模块（核心，最重要）

#### 工具接口

```ts
// tools/tool.interface.ts
export interface AiTool<TArgs = unknown, TResult = unknown> {
  readonly name: string
  readonly description: string
  readonly schema: object                   // JSON schema for the function-calling API
  readonly requiredPermissions: Permission[]
  execute(args: TArgs, ctx: AuthContext): Promise<TResult>
}
```

每个工具：

| 工具 name        | 行为                                          | requiredPermissions             |
| ---------------- | --------------------------------------------- | ------------------------------- |
| `kb_search`      | 调 `KbSearchService.searchByQuery`            | `ai:use`                        |
| `kb_read`        | 调 `KbService.readArticle`                    | `ai:use`                        |
| `kb_write`       | `op: create/update/delete/move` + path/content | `ai:write_kb` + 对应 `kb:*`     |
| `web_search`     | 调 `WebSearchService`                         | `ai:use`, `ai:web`              |
| `web_fetch`      | 调 `WebFetchService`                          | `ai:use`, `ai:web`              |
| `web_ingest`     | 调 `WebIngestService`                         | `ai:write_kb`, `ai:web`         |
| `propose_draft`  | 不落盘，把 op + path + content 标记成草稿     | `ai:use`                        |

#### 自动落盘 vs 草稿确认（关键设计）

```ts
const canAutoApply = ctx.permissions.includes('ai:auto_apply')
const writeTools = canAutoApply
  ? [kbWriteTool, webIngestTool]
  : [proposeDraftTool]   // 没权限就只能提草稿，前端确认
```

- 有 `ai:auto_apply`：模型直接调 `kb_write` / `web_ingest`，服务端真写盘。
- 没有：模型只能调 `propose_draft`，前端 UI 出确认按钮，用户点了再走 `POST /api/ai/apply`。

#### 编排器

```ts
@Injectable()
export class AiService {
  async stream(message, ctx, options): Promise<void> {
    // 1. 构建初始 messages（system + 目录 + 当前文章 + 历史压缩 + 用户输入）
    // 2. Research loop（非流式）：最多 4 轮工具调用
    //    每轮：调 provider.chat({ messages, tools }) → 处理 tool_calls
    //    每个 tool 调用前后通过 handlers.onTool() 推送 SSE
    // 3. 最终回答（流式）：provider.streamChat({ messages: 已注入工具结果 })
    // 4. 把流式增量通过 handlers.onDelta() 推送
    // 5. 结束时 handlers.onDone({ content, reasoning, draft?, sources })
  }
}
```

#### Provider 抽象

```ts
// providers/provider.interface.ts
export interface AiProvider {
  chat(req): Promise<ChatResponse>            // 非流式 + 可带工具
  streamChat(req, onDelta): Promise<string>   // 流式纯文本
}
```

先只实现 `openai-compatible.provider.ts`，未来 Claude / DeepSeek 都按这个接口加。

#### Controller

```
POST /api/ai/chat/stream   → ai:use  (SSE)
POST /api/ai/apply         → ai:write_kb  (确认草稿)
GET  /api/ai/conversations → ai:use
```

### Step 5.7 · MCP 模块（薄薄一层）

短期就是个配置 CRUD（前端能加 HTTP MCP endpoint）。
长期：`McpAdapter` 接口 + `HttpMcpAdapter` 实现，让 AI 工具可以动态注册。

```
GET /api/admin/mcp         → mcp:configure
PUT /api/admin/mcp/:id     → mcp:configure
```

### Step 5.8 · 总装

`src/main.ts`：

```ts
import 'reflect-metadata'
import { NestFactory, Reflector } from '@nestjs/core'
import { AppModule } from './app.module'
import { AuthGuard } from './common/guards/auth.guard'
import { appConfig } from './config/app.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true })
  const reflector = app.get(Reflector)
  app.useGlobalGuards(app.get(AuthGuard))    // 默认所有路由都要登录，@Public() 才豁免
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
  await app.listen(appConfig.port)
  console.log(`KB server listening on http://localhost:${appConfig.port}`)
}
bootstrap()
```

`src/app.module.ts`：把所有 feature module 串起来。

### Step 5.9 · 前端拆分 + 角色管理 UI

把 `App.vue` 拆成上文 §2 列的组件。**API 调用统一走 `api/` 下的模块文件**，别在组件里直接 `fetch`.

`RoleManager.vue` 必须包含：

- 角色列表（含「系统」标记），点编辑展开右侧面板。
- 权限矩阵：按 `PERMISSION_GROUPS` 分组渲染 checkbox。
- 新建角色按钮（要 `role:create`）。
- 系统角色禁用「删除」「改名」按钮，但允许改权限。

`UserManager.vue` 必须包含：

- 用户列表 + 状态（启用/禁用）+ 角色 chip。
- 新建：要选角色（多选）、用户名，提交后弹窗显示明文密码。
- 操作：改角色、改密、停用/启用、删除（不能删自己 —— 后端会拒，前端禁用按钮也行）。

`AiPanel.vue` 新增能力：

- 顶部加一个「从 URL 摘要」快捷输入框 → 直接调 `/api/ai/chat/stream`，message 用 `请抓取并总结这个网址，整理成一篇文章： <url>`。
- 工具调用链事件除了 `kb_search` / `web_search`，要支持新的 `web_fetch` / `web_ingest` / `kb_write` 的展示。
- 如果是 `ai:auto_apply` 角色，不再渲染「确认草稿」按钮（写已经自动了），只展示操作日志。

### Step 5.10 · 切流量

1. 更新根 `package.json`：
   ```json
   "kb:server": "pnpm -F @lcc/server dev",
   "kb:server:build": "pnpm -F @lcc/server build",
   ```
2. 全量回归一遍（见 §7 清单），都通过后再：
   ```bash
   rm -rf apps/kb-server
   ```
3. 更新 `docs/kb-architecture.md` 和 `AGENTS.md` 里指向 `apps/kb-server` 的文字。

---

## 5. 关键设计决策（不要忘）

1. **AI 默认通过工具调用走 CRUD**，不再用正则猜意图。
   - 旧 `ai.js` 里 `inferDraftIntent` 那套**坚决不要复活**。
2. **有 `ai:auto_apply` 才直接落盘**，没有就强制走草稿确认（前端 → `/api/ai/apply`）。
3. **工具调用循环最多 4 轮**，每轮工具结果都先截断（`truncate`，正文 ≤ 8000 字），防止上下文炸。
4. **流式只发生在「最终回答」阶段**，研究阶段非流式。理由：跨厂商 streaming + tool_use 太脆，等 SDK 都稳了再统一。
5. **每个工具自带 `requiredPermissions`**，注册到 registry 时按当前用户的 `AuthContext` 过滤可见工具集。
6. **JSON store 是临时态**：所有读写都通过 `JsonStoreService`，未来换 MySQL 只需要替换这一个类，不动 controller / service。
7. **路径安全永远走 `assertSafePath`**，不准在任何地方拼路径。
8. **密码用 pbkdf2 + 16B 盐 + 12 万次**（`common/utils/password.ts` 已固化）。
9. **JWT 7 天 TTL**，HS256，`KB_JWT_SECRET` 从 `.env.kb` 取，默认值开发用，生产必换。
10. **不引入 ORM / DB / Redis / readability / lodash**。这是单人项目，依赖越少越好。

---

## 6. 环境与命令

### 复制项目到新电脑后

```bash
git clone <repo>
cd lcc_blog
pnpm install                # 装根 + 所有 workspace
cp .env.kb.example .env.kb  # 然后填 OPENAI_API_KEY 等
```

`.env.kb` 示例字段：

```
KB_SERVER_PORT=4010
KB_MARKDOWN_ROOT=docs/knowledge
KB_DATA_FILE=apps/kb-server/data/dev-store.json
KB_JWT_SECRET=please-change-me

OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### 开发命令

```bash
pnpm kb:server         # 启动后端（已切到 apps/server，NestJS + ts-node-dev）
pnpm kb:server:legacy  # 旧 JS 后端，对照用，端口冲突时别同时起
pnpm kb:web            # 启动前端 Vite（5173），代理 /api → :4010
pnpm type-check        # vue-tsc
pnpm lint              # eslint --fix
pnpm format            # prettier
pnpm kb:build          # 前端 production build
pnpm kb:server:build   # 新后端 tsc 构建
```

新 server 独立命令：

```bash
pnpm --filter @lcc/server dev      # ts-node-dev（带 --respawn --transpile-only）
pnpm --filter @lcc/server build    # tsc
```

### 数据

- **默认账号**：`superadmin / Admin@123456`
- **数据文件**：`apps/kb-server/data/dev-store.json`（新旧 server 共用）
- **知识库内容**：`docs/knowledge/*.md`

---

## 7. 「任务完成」验收清单

新 server 上线前必须全部通过：

- [ ] `pnpm --filter @lcc/server build` 无报错
- [ ] `pnpm type-check` 全绿
- [ ] `pnpm lint` 全绿
- [ ] `pnpm kb:build`（前端）全绿
- [ ] 启动新 server，用旧前端登录 `superadmin / Admin@123456` 成功
- [ ] 列出目录、读文章、编辑保存、删除 —— 都正常
- [ ] AI 面板：问问题、调 `kb_search`、调 `kb_read`、生成回答 —— SSE 工具链能展示
- [ ] AI 面板：允许联网，丢一个 URL，让 AI 总结 + 落盘 —— 文章正确出现在目录里
- [ ] 角色管理 UI：新建角色、勾选权限、保存；新建用户并指派
- [ ] 系统角色不可删 / 不可改名
- [ ] 删除自己 → 后端拒绝（403 或 400）
- [ ] 删除 `apps/kb-server/`，根 `package.json` 脚本切到新 server，再跑一遍上面所有
- [ ] `AGENTS.md` 和 `docs/kb-architecture.md` 已更新

---

## 8. 几个容易踩的坑

- **NestJS 装饰器顺序**：参数装饰器（如 `@Body()` `@CurrentUser()`）和类型注解之间不能多任何东西，否则 metadata 读不到。
- **`@nestjs/platform-express` 没装会跑不起来**，已在 `package.json` 里。
- **`tsx watch` 的输出有时不刷新**：改 `tsconfig.json` 后要重启。
- **SSE 在 nginx 之类反代后面要关闭缓冲**（`X-Accel-Buffering: no`），目前直连无问题。
- **`class-validator` 不会自动开**，需要在 `main.ts` 里 `app.useGlobalPipes(new ValidationPipe(...))`.
- **`AuthGuard` 是全局守卫**（`useGlobalGuards`），不要再在每个 controller 上重复挂 `@UseGuards(AuthGuard)`，只用 `@Public()` 跳过。
- **写入 dev-store.json 不是原子的**：单机单进程不用管，多进程要加 lock。
- **`renderMarkdown`（前端）非常基础**，如果给 AI 让它输出表格 / 嵌套 list 显示会丑。后面要换 `marked` + `dompurify`。

---

## 9. 后续路线（不在这次范围内，但记一下）

- 知识库向量检索：`@lancedb/lancedb` 或 sqlite-vec 都行，每篇文章变更后异步重建索引。
- 增量编辑：用 `str_replace` 风格的工具替代「整篇重写」式 update。
- 对话恢复：前端在 `localStorage` 持久化 `conversationId`，刷新后从 `/api/ai/conversations/:id` 拉回。
- Prompt caching：OpenAI / Anthropic 都已支持，把 system + 目录列表设为 cache_control。
- 真正的 MCP 客户端：用 `@modelcontextprotocol/sdk`，把工具集自动暴露。
- MySQL：实现 `StoreInterface`，把 `JsonStoreService` 替换。Schema 已在 `docs/mysql/`。

---

祝顺利。代码里所有 `// 待写` 或留空的接口都已经在上面列出，照着 §4 一步步做就行。
