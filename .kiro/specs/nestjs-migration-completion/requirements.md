# Requirements Document

## Introduction

本需求文档对应 spec `nestjs-migration-completion`。范围严格沿用 `HANDOVER.md` 第 §1 / §2 / §4 / §5 / §7，覆盖五个步骤：Web 模块（Step 5.5）、AI 模块（Step 5.6）、MCP 模块（Step 5.7）、前端拆分（Step 5.9）、切流量与清理（Step 5.10）。所有条款都可由代码 review、`pnpm type-check / lint / build` 与 HANDOVER §7 手工回归清单逐项核验。术语一律来自 HANDOVER；不重复 HANDOVER 已锁定的决策细节。

## Glossary

- **KB_Server**：`apps/server`（NestJS + TypeScript）后端进程，本规格收尾后是唯一存活的后端。
- **Legacy_Server**：`apps/kb-server`（Node `http` + JS）旧后端，本规格末态被删除（除 `data/dev-store.json`）。
- **KB_Web**：`apps/kb-web`（Vue 3 + Vite）前端。
- **Web_Module**：`apps/server/src/web/*`，含 `WebSearchService` / `WebFetchService` / `WebIngestService` 与 `WebController`。
- **Ai_Module**：`apps/server/src/ai/*`，含 Provider 抽象、`ToolRegistry`、七件工具与 `AiService` / `AiController`。
- **Mcp_Module**：`apps/server/src/mcp/*`，含 `McpAdapter` 接口、`HttpMcpAdapter`、`McpService` 与 `McpController`。
- **Tool_Registry**：`apps/server/src/ai/tools/tool-registry.ts`，按 `AuthContext` 暴露可见工具集。
- **Provider**：`AiProvider` 接口；v1 实现为 `OpenAiCompatibleProvider`。
- **Draft**：模型输出文本中通过 `[DRAFT op="…" path="…"]` 结构化标记声明的写盘草稿。
- **Auto_Apply_Gate**：根据 `AuthContext.permissions` 是否含 `ai:auto_apply`，决定 `Tool_Registry` 是暴露 `kb_write` / `web_ingest` 还是只暴露 `propose_draft` 的二选一逻辑。
- **Dev_Store**：`apps/kb-server/data/dev-store.json`（路径不变），通过 `JsonStoreService` 读写。
- **Sse_Stream**：`POST /api/ai/chat/stream` 的 `text/event-stream` 响应，事件名为 `tool` / `delta` / `done` / `error`。
- **Safe_Path_Gate**：`KbService.assertSafePath()`，所有知识库写入路径的唯一过滤函数。
- **Handover_Checklist**：`HANDOVER.md` §7 的「任务完成」验收清单。

## Requirements

### Requirement 1: Web 模块（Step 5.5）

**User Story:** 作为知识库使用者，我希望 KB_Server 能直接搜索互联网、抓取指定 URL 的网页正文，并把网页摘要落进知识库，从而把「贴 URL → 总结 → 落盘」这条主路打通。

#### Acceptance Criteria

1. WHEN 客户端 `POST /api/web/search` 携带非空 `query`，THE Web_Module SHALL 返回 `{ query, source, results, error? }`，其中 `source ∈ { 'duckduckgo', 'bing', 'mcp', 'search-unavailable' }` 且 `results` 是 `{ title, url, snippet }` 数组。
2. WHEN Dev_Store 的 `mcpServers` 中存在 `enabled=true` 且 `type='http'` 的记录，THE Web_Module SHALL 优先使用该 endpoint 完成搜索，仅当 endpoint 失败时再回落到 DuckDuckGo 与 Bing。
3. WHEN 客户端 `POST /api/web/fetch` 携带 `http` 或 `https` 协议的 URL，THE Web_Module SHALL 在 8 秒内返回 `{ url, title, content, fetchedAt }`，且 `content.length` ≤ 8000 字符。
4. WHILE `WebFetchService` 正在读取响应体，THE Web_Module SHALL 在累计字节 ≥ 2 MB 时停止读取并返回已获得的部分。
5. THE Web_Module SHALL 在 `WebFetchService` 的所有出站请求上设置 `User-Agent` 头。
6. IF `web-fetch` 收到非 `http(s)` 协议、空字符串或 URL 解析失败，THEN THE Web_Module SHALL 返回 HTTP 400 并附描述性错误信息。
7. THE Web_Module SHALL 不依赖 `jsdom` / `@mozilla/readability` / `cheerio` 任何一者，仅使用正则与字符串处理实现正文抽取。
8. WHEN 客户端 `POST /api/web/ingest` 携带合法 URL，THE Web_Module SHALL 调用 `WebFetchService` 抓取正文、调用 Provider 生成 `{ title, slug, category, markdown }` 摘要、调用 `KbService.writeArticle` 落盘，并返回 `{ path, title }`。
9. THE Web_Module SHALL 在 `web-ingest` 落盘前把生成的相对路径交给 Safe_Path_Gate 校验。
10. THE Web_Module SHALL 把 `/api/web/search` 与 `/api/web/fetch` 端点的最低权限声明为 `ai:web`，把 `/api/web/ingest` 端点的最低权限声明为 `ai:web` ∧ `ai:write_kb`。

### Requirement 2: AI 模块（Step 5.6）

**User Story:** 作为知识库使用者，我希望 AI 助手能基于工具调用循环阅读、检索、抓取并起草内容；当我具备 `ai:auto_apply` 权限时它直接落盘，否则只能提交草稿等我确认。

#### Acceptance Criteria

1. WHEN 客户端 `POST /api/ai/chat/stream` 携带非空 `message`，THE Ai_Module SHALL 以 `Content-Type: text/event-stream` 响应，并设置 `Cache-Control: no-cache`、`Connection: keep-alive`、`X-Accel-Buffering: no` 三个响应头。
2. WHILE 一次 `chat/stream` 响应进行中，THE Ai_Module SHALL 仅发出一次 `event=done` 或一次 `event=error`，且二者互斥。
3. THE Ai_Module SHALL 在研究阶段中限制 Provider 的非流式 `chat` 调用次数不超过 `MAX_TOOL_ROUNDS=4`。
4. THE Ai_Module SHALL 仅在最终回答阶段使用 Provider 的 `streamChat`；研究阶段全部使用非流式 `chat`。
5. THE Ai_Module SHALL 把 `[DRAFT op="create|update|delete|organize" path="…"]` 标记的解析正则保持与 KB_Web `apps/kb-web/src/markdown.ts` 中 `DRAFT_MARKER_RE` 同义（同一组 op 与 path 输入解析结果一致）。
6. WHERE `AuthContext.permissions` 包含 `ai:auto_apply`，THE Tool_Registry SHALL 把 `kb_write` 与 `web_ingest` 暴露给模型。
7. WHERE `AuthContext.permissions` 不包含 `ai:auto_apply`，THE Tool_Registry SHALL 不暴露 `kb_write` 与 `web_ingest`，仅暴露 `propose_draft`。
8. THE Tool_Registry SHALL 对每个待暴露工具检查其 `requiredPermissions` 是 `AuthContext.permissions` 子集，否则不暴露。
9. WHEN `useWebSearch=true` 且 `AuthContext.permissions` 包含 `ai:web`，THE Tool_Registry SHALL 暴露 `web_search` 与 `web_fetch`。
10. IF `useWebSearch=false` 或 `AuthContext.permissions` 不含 `ai:web`，THEN THE Tool_Registry SHALL 不暴露任何 `web_*` 工具。
11. THE Ai_Module SHALL 不基于用户消息文本做正则意图判定（明确禁止复活旧 `inferDraftIntent`）。
12. THE Ai_Module SHALL 在每次工具调用结果回灌前，把字符串字段截断到 ≤ 4000 字符；文章正文读取截断到 ≤ 8000 字符。
13. WHEN `config.openai.apiKey` 为空，THE Ai_Module SHALL 返回带本地候选文章列表的兜底回答，并完成 `event=delta` + `event=done` 闭环。
14. WHEN 客户端 `POST /api/ai/apply` 携带合法 Draft，THE Ai_Module SHALL 调用 `KbService` 对应的 `writeArticle` / `deleteArticle` / `moveArticle` 完成落盘并返回结果。
15. WHEN 客户端 `GET /api/ai/conversations`，THE Ai_Module SHALL 仅返回当前用户的会话条目，按 `updatedAt` 倒序排列。
16. THE Ai_Module SHALL 把 `chat/stream` 端点声明权限 `ai:use`、`apply` 端点声明 `ai:write_kb`、`conversations` 端点声明 `ai:use`。
17. THE Ai_Module SHALL 通过 `AiProvider` 接口访问大模型 API；不允许 `AiService` 直接调用 `fetch('.../chat/completions')`。
18. WHEN Provider 返回 5xx，THE Ai_Module SHALL 重试一次（间隔约 500 ms），仍失败则发出 `event=error` 并结束流。
19. IF 客户端在 SSE 期间断开连接，THEN THE Ai_Module SHALL 通过 `AbortController` 中止上游 Provider 请求且不发起重试。
20. THE Ai_Module SHALL 在每次 `chat/stream` 请求结束时把本轮 `user` 与 `assistant` 两条消息追加到 Dev_Store 的对应 `conversations` 记录中。

### Requirement 3: MCP 模块（Step 5.7）

**User Story:** 作为系统管理员，我希望能在管理界面里 CRUD 一组 HTTP MCP endpoint，并让 Web_Module 自动选择启用的那一个。

#### Acceptance Criteria

1. THE Mcp_Module SHALL 提供 `GET /api/admin/mcp` 返回当前所有 MCP 记录。
2. WHEN 客户端 `POST /api/admin/mcp` 携带 `{ name, endpoint }`，THE Mcp_Module SHALL 在 Dev_Store 的 `mcpServers` 数组中追加一条记录，并返回完整记录。
3. WHEN 客户端 `PUT /api/admin/mcp/:id` 携带局部字段，THE Mcp_Module SHALL 仅更新提供的字段，并刷新 `updatedAt`。
4. WHEN 客户端 `DELETE /api/admin/mcp/:id`，THE Mcp_Module SHALL 删除对应记录并返回 `{ id }`。
5. THE Mcp_Module SHALL 把以上四个端点的最低权限统一声明为 `mcp:configure`。
6. THE Mcp_Module SHALL 提供 `McpAdapter` 接口与 `HttpMcpAdapter` 实现，且 `WebSearchService` 通过 `McpService.pickActive()` 取得当前 endpoint，而不再直接读 `JsonStoreService.read().mcpServers`。

### Requirement 4: 前端拆分（Step 5.9）

**User Story:** 作为前端维护者，我希望把单文件 `App.vue` 拆成可复用的组件 / composable / api 模块，并让 AiPanel 支持「URL 摘要」与新工具链事件渲染。

#### Acceptance Criteria

1. THE KB_Web SHALL 包含组件文件 `Workspace.vue` / `AiPanel.vue` / `AdminPanel.vue` / `RoleManager.vue` / `UserManager.vue` / `LoginModal.vue` / `TreeList.vue`，全部位于 `apps/kb-web/src/components/` 下。
2. THE KB_Web SHALL 包含 composable 文件 `useSession.ts` / `useKb.ts` / `useAi.ts`，全部位于 `apps/kb-web/src/composables/` 下。
3. THE KB_Web SHALL 把 `api.ts` 拆成 `api/{auth,kb,ai,admin,web}.api.ts` 五个模块文件 + `api/index.ts` barrel；保持原 `api.ts` 作为 re-export 入口，避免外部 import 路径失效。
4. THE KB_Web SHALL 把 `[DRAFT op="…"]` 标记正则集中到 `apps/kb-web/src/markdown.ts` 暴露的 `DRAFT_MARKER_RE` 常量，组件统一从此引用，不在 SFC 内重复定义。
5. THE AiPanel SHALL 在面板顶部提供「从 URL 摘要」快捷输入框；提交后向 `/api/ai/chat/stream` 发起一次消息，文案以「请抓取并总结这个网址，整理成一篇文章：」开头并附用户输入的 URL。
6. THE AiPanel SHALL 在工具链时间线上为 `kb_search` / `kb_read` / `web_search` / `web_fetch` / `web_ingest` / `kb_write` / `propose_draft` 各自渲染独立的步骤项。
7. WHERE 当前会话用户具有 `ai:auto_apply`，THE AiPanel SHALL 不渲染「确认草稿」按钮，仅渲染落盘操作日志。
8. THE KB_Web SHALL 保留 `apps/kb-web/src/styles.css` 中所有 Linear 设计 token，不引入 CSS-in-JS、组件库或 emoji 图标。
9. THE KB_Web SHALL 通过 `useAi.ts` 实现 `EventSource` 之外的 SSE 客户端逻辑（因 `EventSource` 不支持 POST 与自定义头，必须使用 `fetch` + `ReadableStream` 解析）。
10. THE AiPanel SHALL 把 `event=delta` 增量按到达顺序追加到当前 assistant 消息的 `content` 上。

### Requirement 5: 切流量与清理（Step 5.10）

**User Story:** 作为发布者，我希望在所有验收通过后删除旧 Legacy_Server，并刷新文档中所有指向旧目录的引用，但保留 `dev-store.json`。

#### Acceptance Criteria

1. THE Cutover SHALL 在删除 Legacy_Server 之前完成 Handover_Checklist 全部条目；任一条目未通过时禁止执行删除。
2. THE Cutover SHALL 删除 `apps/kb-server/src/` 与 `apps/kb-server/package.json`，但保留 `apps/kb-server/data/dev-store.json` 文件不变。
3. THE Cutover SHALL 维持 `apps/server` 在启动时仍指向 `apps/kb-server/data/dev-store.json` 作为默认 `KB_DATA_FILE`。
4. THE Cutover SHALL 从根 `package.json` 移除 `kb:server:legacy` 脚本，并从 `lint` 脚本中去掉 `apps/kb-server` 路径。
5. THE Cutover SHALL 更新 `docs/kb-architecture.md`，使所有指向 `apps/kb-server` 源代码的描述改为 `apps/server`。
6. THE Cutover SHALL 更新 `AGENTS.md` §2 / §3 / §5，使其引用 `apps/server` 与新 NestJS 模块路径，不再提及旧 JS 文件。
7. IF 任意提交把 `docs/knowledge/` 下的内容文件标记为删除或重命名为非 `.md`，THEN THE Cutover SHALL 拒绝该提交并要求人工复核。

### Requirement 6: 验证与质量门禁（贯穿 Step 5.5–5.10）

**User Story:** 作为质量负责人，我希望在每一步收尾时 type-check / lint / build 全绿，避免回归。

#### Acceptance Criteria

1. THE Build_Pipeline SHALL 在 Step 5.5 / 5.6 / 5.7 / 5.9 / 5.10 各自结束时通过 `pnpm type-check`、`pnpm lint`、`pnpm kb:server:build`、`pnpm kb:build` 四个命令的零错误零警告（warning 视为错误）退出。
2. THE Build_Pipeline SHALL 在执行任何被 HANDOVER §7 列明的回归路径之前先完成上一条所述静态门禁。
3. THE Build_Pipeline SHALL 不引入任何新顶层依赖；如需新增请单独提交并经人工复核。
4. THE Project SHALL 维持 ES Modules（`"type": "module"`）配置不变；新增前端文件不得使用 CommonJS。
5. THE Project SHALL 维持 `apps/server` 的 `dev` 脚本使用 `ts-node-dev`，禁止改回 `tsx`。
6. THE Project SHALL 维持 `AuthGuard` 通过 `APP_GUARD` provider 注册，禁止改为 `app.useGlobalGuards(...)`。
