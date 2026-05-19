# LCC 知识库 · 重构交接文档

> 写给：以后接手这份项目的我（可能在另一台电脑上）。
> 状态截止时间：2026-05-19（HANDOVER 列的 5.1–5.10 全部完成）。

---

## 0. 一句话背景

这是一个**单用户个人知识库**：Markdown 文件存盘 + Vue 3 阅读器 + AI 草稿/落盘助手。

完成的工作：
- 后端从「Node 原生 http + JS」迁到「NestJS + TypeScript」。
- AI 从「正则猜意图 → 草稿」升级成「工具调用循环 → 真正的 CRUD + 网页抓取摘要」。
- 前端从 1110 行单文件 App.vue 拆成 API 层 / composables / 7 个 SFC。

---

## 1. 当前进度

| #   | 任务                              | 状态        | 落地位置                                       |
| --- | --------------------------------- | ----------- | ------------------------------------------ |
| 1   | AI pipeline 重写（旧 JS 版本）    | ✅ 已完成   | `apps/kb-server/src/ai.js`（旧,作为对照保留） |
| 2   | UI 套 Linear 设计系统             | ✅ 已完成   | `apps/kb-web/src/styles.css`               |
| 3   | AGENTS.md                         | ✅ 已完成   | 仓库根目录                                 |
| 4   | NestJS 骨架 + config + store      | ✅ 已完成   | `apps/server/`                              |
| 5.1 | Auth 模块                         | ✅ 已完成   | `apps/server/src/auth/*`                   |
| 5.2 | Users 模块                        | ✅ 已完成   | `apps/server/src/users/*`                  |
| 5.3 | Roles 模块 + permissions          | ✅ 已完成   | `apps/server/src/roles/*`                  |
| 5.4 | KB 模块                           | ✅ 已完成   | `apps/server/src/kb/*`                     |
| 5.5 | Web 模块（search/fetch/ingest）   | ✅ 已完成   | `apps/server/src/web/*`                    |
| 5.6 | AI 模块（providers + tools 注册表）| ✅ 已完成   | `apps/server/src/ai/*`                     |
| 5.7 | MCP 模块                          | ✅ 已完成   | `apps/server/src/mcp/*`                    |
| 5.8 | 总装 + 全局 exception filter      | ✅ 已完成   | `apps/server/src/{main,app.module}.ts` + `common/filters/` |
| 5.9 | 前端拆分                          | ✅ 已完成   | `apps/kb-web/src/{api,composables,components}/` |
| 5.10| 切流量                            | ✅ 已完成   | 根 `kb:server` 已切到 `@lcc/server`,旧 `apps/kb-server/` 保留作 legacy |

### 1.1 本轮（5/15 → 5/19）做了什么

1. **AI 模块按 HANDOVER 设计拆分**：
   - `ai/providers/{provider.interface.ts, openai-compatible.provider.ts}` — vendor-neutral chat 抽象。`streamChat` 返回 `AsyncIterable<ProviderStreamEvent>`。
   - `ai/tools/{tool.interface.ts, tool-registry.ts}` + 7 个 `*.tool.ts` — `kb_search` / `read_article` / `kb_write` / `web_search` / `web_fetch` / `web_ingest` / `propose_draft`。
   - `AiService` 瘦身到 ~430 行,只负责编排;不再直接 import 工具类,全部走 `ToolRegistry`。
2. **`ai:auto_apply` 权限分支真正生效**：有权限 → 暴露 `kb_write` / `web_ingest`（直接落盘）；没权限 → 暴露 `propose_draft`（用 `ctx.draftSink` 把草稿送给前端确认）。两组工具互斥。
3. **SSE 流式端点 `POST /api/ai/chat/stream`**：前端 `App.vue:699` 早已经在调用这个端点,后端补齐。事件名严格匹配前端 reader：`meta` / `tool` / `reasoning` / `delta` / `done` / `error`。SSE handler 自己处理错误（emit `error` 然后 `res.end()`),不 rethrow。
4. **MCP 模块**：`/api/admin/mcp` 完整 CRUD,DTO 走 class-validator,`mcp_web_search` 系统记录不可删。`HttpMcpAdapter` 已实现并被 `WebSearchService.search` 用上(替换了原来 inline 的 fetch 分支),失败会优雅降级到 DDG/Bing。
5. **HTTP exception filter**：全局 `{statusCode, message, error?}` 响应,前端 `api/http.ts` 已经在按这个 shape 解析。SSE 路径在 filter 里通过 `res.writableEnded || res.headersSent` 判空跳过。
6. **前端整个拆分**：
   - `api/{http.ts, types.ts, auth.api.ts, kb.api.ts, ai.api.ts, admin.api.ts, web.api.ts, index.ts}`
   - `composables/{useSession.ts, useKb.ts, useAi.ts}`（模块级单例 state）
   - `components/{TreeList, LoginModal, Workspace, AiPanel, AdminPanel, UserManager, RoleManager}.vue`
   - `App.vue` 从 1110 → 174 行,只剩 shell + 编排。
   - 删了旧 `apps/kb-web/src/api.ts` stub —— 同名文件 + 同名目录会让 TS 优先解析文件,导致循环 import,直接删掉。

### 1.2 已知边界

- AI 模型走的是本地代理 `http://127.0.0.1:8317/v1`,真机起来时若代理没启,SSE 第一帧 `meta` 后会卡住直到 LLM 超时——这是代理问题,不是 SSE 实现问题。改回 `https://api.openai.com/v1` + 真实模型名 + 真 key 就好。
- `MCP 管理 UI` 的后端 + `api.ts` methods 都齐了,前端没出页面（HANDOVER §1.3 未完成项之一）。
- 旧 `apps/kb-server/` 还在仓库里（用户要求保留作对照,`pnpm kb:server:legacy` 启动）。

### 1.3 未做项（不在本轮范围）

- 删除 `apps/kb-server/`（legacy 保留;`dev-store.json` 在那个目录下,删之前要先迁数据）。
- MCP 管理 UI（后端 + api.ts 都齐了,UI 没做）。
- 真正接入 `@modelcontextprotocol/sdk`(目前只有 HTTP 一种 transport)。
- 向量检索、prompt caching、增量编辑、对话恢复 — 见 §9 长期路线。

---

## 2. 跨机继续：在新电脑要做的事

```bash
git clone <repo> && cd lcc_blog
git pull
pnpm install                 # 含 apps/server,pnpm-workspace.yaml 已配
cp .env.kb.example .env.kb   # 然后填 OPENAI_API_KEY 等
```

**`.env.kb` 注意点**：

- `OPENAI_BASE_URL` 当前指向本地代理 `http://127.0.0.1:8317/v1`,模型别名 `gpt-5.5`（不是 OpenAI 官方型号）。新机如果没起这个代理,要改回 `https://api.openai.com/v1` + 真实模型名,或者在新机也起对应代理。
- `KB_DATA_FILE` 默认 `apps/kb-server/data/dev-store.json`,新旧 server 共用,**别覆盖**：里面是唯一的 `superadmin / Admin@123456`。

**启动**：

```bash
pnpm kb:server          # NestJS 后端,端口 4010(默认 ts-node-dev 启动)
pnpm kb:server:build    # tsc 编译到 dist/,可以 node dist/main.js 起 prod 模式
pnpm kb:server:legacy   # 旧 Node 原生 JS 后端,做对照时用,别同时起(端口冲突)
pnpm kb:web             # vite 5173/4020,代理 /api → :4010(SSE 透明转发)
```

**新机首跑验收**：

- 登录 `superadmin / Admin@123456`。
- 左侧目录树有内容（来自 `docs/knowledge/`）。
- 「管理」→ 账号 / 角色两个 Tab,新增/编辑/删除都能跑通;新建账号会展示一次明文密码。
- AI 面板：发一条消息,SSE 流过来,工具链气泡显示;OPENAI_API_KEY 没配会走 localFallback。

---

## 3. 项目结构

```
apps/
  server/                            # NestJS + TypeScript 后端
    src/
      main.ts                        # 注册 ValidationPipe + HttpExceptionFilter
      app.module.ts                  # 串起全部 feature module
      common/
        auth-context.{ts,service.ts} # AuthContext 类型 + 从 user id 构造的 service
        permissions.ts               # PERMISSIONS + PERMISSION_GROUPS(SoT)
        common.module.ts             # @Global() 导出 AuthContextService
        decorators/{current-user,public,require-permissions}.decorator.ts
        guards/auth.guard.ts         # 统一鉴权 + 鉴权(单一 guard)
        filters/http-exception.filter.ts  # 全局错误格式化,SSE 路径会跳过
        utils/password.ts            # pbkdf2 + 16B 盐
      config/
        app.config.ts                # 上溯找 .env.kb 定位 repo 根
        config.module.ts             # APP_CONFIG DI token
      store/
        store.types.ts               # UserRecord / RoleRecord / McpServerRecord / ...
        json-store.service.ts        # read() / mutate();含 migrate() + r_super 自愈
        store.module.ts              # @Global()
      auth/{jwt.service,auth.service,auth.controller,auth.module}.ts
      users/{users.service,users.controller,users.module}.ts + dto/
      roles/{roles.service,roles.controller,roles.module}.ts + dto/
      kb/{kb.types,kb.service,kb-search.service,kb.controller,kb.module}.ts + dto/
      web/
        web-search.service.ts        # MCP-first → DDG → Bing,失败降级
        web-fetch.service.ts         # URL 抓取 + 8KB 截断
        web-ingest.service.ts        # 抓取 → AI 摘要 → 落 KB
        web-http.util.ts             # fetchWithTimeout + cleanText 等共享工具
        web.controller.ts            # /api/web/{search,fetch,ingest}
        web.module.ts
      mcp/
        mcp.{service,controller,module}.ts
        dto/{create,update}-mcp-server.dto.ts
        adapters/
          mcp-adapter.interface.ts   # McpAdapter 接口(name/type/connect/listTools/callTool)
          http-mcp.adapter.ts        # 非 Nest 单例,通过 fromRecord() 实例化
      ai/
        ai.{service,controller,module,types}.ts
        prompts.ts                   # SYSTEM_PROMPT
        dto/chat.dto.ts              # ChatRequestDto + ChatHistoryItemDto
        providers/
          provider.interface.ts      # AiProvider + AI_PROVIDER token + 各类 type
          openai-compatible.provider.ts # HTTP /v1/chat/completions 实现
        tools/
          tool.interface.ts          # AiTool + ToolContext
          tool-registry.ts           # 权限/canWeb/canAutoApply 互斥过滤 + dispatch
          {kb-search,kb-read,kb-write,web-search,web-fetch,web-ingest,propose-draft}.tool.ts
      audit/{audit.service,audit.controller,audit.module}.ts  # @Global()
    data/                            # 不在 repo,运行时存 dev-store.json
  kb-web/                            # Vue 3 前端
    src/
      main.ts                        # createApp(App).mount + styles.css
      App.vue                        # 174 行 shell:header + sidebar + main + AiPanel + LoginModal
      markdown.ts                    # 简易 Markdown 渲染
      styles.css                     # Linear 暗色主题
      api/
        index.ts                     # 聚合 + re-export
        http.ts                      # request<T>() + getToken/setToken/clearToken
        types.ts                     # 共享类型
        auth.api.ts kb.api.ts ai.api.ts admin.api.ts web.api.ts
      composables/
        useSession.ts                # session + can(perm) + login/logout/bootstrap
        useKb.ts                     # tree/activeArticle/viewMode + CRUD 函数
        useAi.ts                     # messages/prompt/sending + SSE 读取 + 草稿确认
      components/
        TreeList.vue                 # 递归 SFC(name:'TreeList')
        LoginModal.vue
        Workspace.vue                # welcome + doc-view 二合一
        AiPanel.vue                  # 整个右侧面板
        AdminPanel.vue               # tabs + 子组件 + refresh
        UserManager.vue              # 列表 + 模态
        RoleManager.vue              # 卡片 + 权限矩阵模态
  kb-server/                         # 🟡 旧 JS 后端(legacy,仍可 `pnpm kb:server:legacy` 起)
docs/
  knowledge/                         # KB 内容
  kb-architecture.md                 # 旧设计文档(本轮未同步,见 §6.3)
pnpm-workspace.yaml                  # packages: ['apps/*']
AGENTS.md                            # AI 协作约定(本轮未同步,见 §6.3)
HANDOVER.md                          # 本文件
```

---

## 4. 不要动的代码（动了要小心）

- **`apps/server/package.json`** —— `dev` 是 `ts-node-dev`（不是 tsx）。esbuild 不发 decorator metadata,Nest 构造函数注入会全炸。`build` 走 `tsc`。
- **`apps/server/tsconfig.json`** —— `experimentalDecorators` + `emitDecoratorMetadata` 都开了。
- **`apps/server/src/config/*`** —— `findRepoRoot()` 上溯找 `.env.kb`,所有相对路径基于 repo 根。**别改回 `process.cwd()`**,否则在 `apps/server/` 里跑会创出空的 `docs/knowledge` 副本。
- **`json-store.service.ts` 的 `migrate()`** —— 含 `r_super` 权限自愈。加新权限项时,老 dev-store 自动补齐,不用手动 reseed。
- **`AuthGuard` 注册方式** —— `app.module.ts` 用 `APP_GUARD` provider。**不要**改成 `useGlobalGuards(app.get(AuthGuard))`,后者实例不会被 DI 填进 Reflector / JwtService。
- **`/api/auth/me` 返回显式 JSON `null`**(不是空 body),前端首屏探测 session 用,不能 401。
- **`AiService` 不直接 import 工具类** —— 只通过 `ToolRegistry`。加新工具:写 `*.tool.ts` + 改 `tool-registry.ts` 构造函数 + 改 `ai.module.ts` providers,**三处**。
- **`HttpMcpAdapter` 不是 `@Injectable()`** —— 每实例绑一个 `McpServerRecord`。NestJS 不能注入它,要用 `HttpMcpAdapter.fromRecord(record)`。
- **SSE handler 不 rethrow** —— `AiService.chatStream` 内部 catch 后 emit `error` + `res.end()`。如果重新抛,exception filter 会试图往已经流式的响应里写 JSON,前端 SSE reader 会崩。filter 内部 `res.writableEnded || res.headersSent` 判空保护是第二道防线。
- **`AiTool.requiredPermissions` 互斥规则** —— `kb_write` + `web_ingest` 要 `ai:auto_apply`;`propose_draft` 不要 `ai:auto_apply`(否则与前两个重复)。这层过滤在 `ToolRegistry.listFor` 里,如果改了规则,记得同步 §5 关键决策第 2 条的语义。
- **`apps/kb-web/src/api.ts` 不要恢复** —— 同名文件 + 同名目录会让 TS 文件解析优先,导致循环 import。统一从 `./api/` 目录 import。
- **`dev-store.json`** —— 里面有 `superadmin / Admin@123456`,别删。

---

## 5. 关键设计决策（不要忘）

1. **AI 通过工具调用走 CRUD**,不再用正则猜意图。旧 `ai.js` 里的 `inferDraftIntent` 那套**坚决不要复活**。
2. **`ai:auto_apply` 权限是开关**:有权限的角色,工具集里有 `kb_write` + `web_ingest`,直接落盘;没权限的角色,工具集里有 `propose_draft`,模型只能提案,前端 → `/api/ai/apply` 确认后落盘。两组互斥,模型同一时刻只看到其中一组。
3. **工具调用循环最多 4 轮**,每轮工具结果先截断(`MAX_CONTENT_CHARS = 4000`),防止上下文炸。
4. **流式只发生在「最终回答」阶段**,研究阶段非流式。跨厂商 streaming + tool_use 太脆,等 SDK 都稳了再统一。
5. **每个工具自带 `requiredPermissions`**,`ToolRegistry.listFor(ctx)` 按 `ctx.user.permissions` + `ctx.canWeb` + `ctx.canAutoApply` 过滤可见工具集。
6. **JSON store 是临时态**,所有读写都通过 `JsonStoreService`,未来换 MySQL 只需要替换这一个类,不动 controller / service。
7. **路径安全永远走 `KbService.assertSafePath`**,不准在任何地方拼路径。`kb_write` 工具也走它(`KbService` 内部已经检查)。
8. **密码用 pbkdf2 + 16B 盐 + 12 万次**(`common/utils/password.ts` 已固化)。
9. **JWT 7 天 TTL**,HS256,`KB_JWT_SECRET` 从 `.env.kb` 取,默认值开发用,生产必换。
10. **不引入 ORM / DB / Redis / readability / cheerio / lodash / @nestjs/mapped-types**。单人项目,依赖越少越好。
11. **`WebSearchService` MCP 失败优雅降级到 DDG/Bing**(非整个 500)。错误信息会进 `errors` 数组,DDG/Bing 也都失败时一起返回。
12. **HttpMcpAdapter 是 `fromRecord(record)` 模式**,不是 Nest 单例。原因:每个 MCP server 有自己的 endpoint,单例没法表达。

---

## 6. 环境与命令

### 6.1 开发命令

```bash
pnpm kb:server         # NestJS 后端(ts-node-dev,端口 4010)
pnpm kb:server:build   # tsc 构建到 apps/server/dist
pnpm kb:server:legacy  # 旧 JS 后端,对照用
pnpm kb:web            # vite 前端(默认端口 4020),代理 /api → :4010
pnpm kb:build          # 前端 production build → dist/kb-web
pnpm type-check        # vue-tsc 全工程
pnpm lint              # eslint --fix(apps/kb-web + apps/kb-server + apps/server)
pnpm format            # prettier --write .
```

新 server 独立命令(从 workspace 跑):

```bash
pnpm --filter @lcc/server dev      # ts-node-dev --respawn --transpile-only --exit-child
pnpm --filter @lcc/server build    # tsc -p tsconfig.json
```

### 6.2 数据

- **默认账号**:`superadmin / Admin@123456`
- **数据文件**:`apps/kb-server/data/dev-store.json`(新旧 server 共用)
- **知识库内容**:`docs/knowledge/*.md`

### 6.3 文档同步(待办)

`AGENTS.md` 和 `docs/kb-architecture.md` 是 5.4 完成时写的,本轮重构后没同步。需要补的点:
- AI 模块 providers / tools / registry 三层结构。
- MCP 模块的存在 + DTO + adapter。
- 前端 api / composables / components 拆分结构。
- `WebSearchService` 已接入 `HttpMcpAdapter`(原 inline fetch 已删)。
- HTTP exception filter 统一响应格式 `{statusCode, message, error?}`。

可以在下一轮顺手做。

---

## 7. 后续可选扩展

按价值/工作量排,挑感兴趣的做:

### 7.1 MCP 管理 UI（小工作量,完整闭环）

后端 + `api.ts` methods 都齐了,只缺前端。

- `apps/kb-web/src/components/McpManager.vue` —— 列表 + 模态,模仿 `RoleManager.vue` 结构。
- `AdminPanel.vue` 加第 3 个 Tab "MCP"(条件:`can('mcp:configure')`)。
- 列出 MCP server,显示 enabled / endpoint;新建/编辑/删除走 `api.createMcpServer` / `updateMcpServer` / `deleteMcpServer`。
- `mcp_web_search` 系统记录不展示删除按钮(后端会拒,前端也禁用)。

### 7.2 删除 apps/kb-server/（小,需小心）

1. **先迁数据**:`mv apps/kb-server/data /tmp/kb-data-backup`,然后改 `.env.kb`:`KB_DATA_FILE=data/dev-store.json` 或类似新位置,把数据放回来。
2. **改 `apps/server/src/config/app.config.ts`** 的 `dataFile` 默认值(`'apps/kb-server/data/dev-store.json'` → 新位置)。
3. **去掉 `kb:server:legacy` 脚本** 和根 `package.json` 的对应项。
4. **`rm -rf apps/kb-server`**。
5. 跑一遍 §2 验收清单。

风险点:`dev-store.json` 里有 superadmin 密码哈希,迁错会无法登录。建议先备份。

### 7.3 文档同步（小,见 §6.3）

更新 `AGENTS.md` + `docs/kb-architecture.md`,把本轮重构反映上去。

### 7.4 向量检索（中,大价值）

`kb-search.service.ts` 目前是关键词召回(match 路径 + 标题)。可以加 embedding:

- 选个轻量库:`@lancedb/lancedb` 或 sqlite-vec。
- 每篇文章 `writeArticle` 后异步重建索引。
- `KbSearchService.searchByQuery` 改成 hybrid:embedding top-k + 关键词 boost。
- 接口外部不变,`kb_search` 工具自动受益。

### 7.5 增量编辑工具（中)

目前 `kb_write` op=update 是「整篇重写」。可以加 `kb_patch` 工具,接 `str_replace` 风格(`{path, oldString, newString}`)。模型生成短 diff 比生成全文便宜。

### 7.6 对话恢复(小)

`/api/ai/conversations` 已经在了,前端 localStorage 持久化 `conversationId`,刷新后从 `/api/ai/conversations/:id` 拉历史。

### 7.7 Prompt caching(中)

OpenAI / Anthropic 都已支持。把 `SYSTEM_PROMPT` + 目录列表标 `cache_control`,省 token。

### 7.8 真正的 MCP 客户端(中)

用 `@modelcontextprotocol/sdk`,把 `WsMcpAdapter` / `StdioMcpAdapter` 加进来。`McpAdapter` 接口已经预留好,加新 transport 不改 `WebSearchService`。

### 7.9 MySQL 持久化(大)

实现 `StoreInterface`,把 `JsonStoreService` 替换。Schema 已经在 `docs/mysql/`。

---

## 8. 验收清单

新机起来后跑一遍:

- [ ] `pnpm --filter @lcc/server build` 无报错
- [ ] `pnpm type-check` 全绿
- [ ] `pnpm lint` 全绿
- [ ] `pnpm kb:build`(前端)全绿
- [ ] 启动 server,前端登录 `superadmin / Admin@123456`
- [ ] 列出目录、读文章、编辑保存、删除 —— 都正常
- [ ] AI 面板:发问题,SSE `meta` / `tool` / `delta` 事件按序流出,工具链气泡正常展示
- [ ] AI 面板:开「允许网络检索」,丢一个 URL,AI 调 `web_fetch` 并总结
- [ ] AI 面板(用 `ai:auto_apply` 角色,如 superadmin):让 AI 写一篇 → 应该直接落盘(`kb_write` 或 `web_ingest`)
- [ ] AI 面板(用无 `ai:auto_apply` 的角色,如 `r_editor`):让 AI 写一篇 → 应该弹草稿确认按钮(`propose_draft`)
- [ ] 角色管理:新建、勾选权限、保存
- [ ] 用户管理:新建,记录初始密码;停用/启用;删除自己 → 后端拒
- [ ] 系统角色不可删 / 不可改名
- [ ] MCP API:`curl GET /api/admin/mcp` 能拿到 `mcp_web_search`;`DELETE /api/admin/mcp/mcp_web_search` 返回 400

---

## 9. 几个容易踩的坑

- **NestJS 装饰器顺序**:参数装饰器(如 `@Body()` `@CurrentUser()`)和类型注解之间不能多任何东西,否则 metadata 读不到。
- **`@nestjs/platform-express` 没装会跑不起来**,已在 `package.json` 里。
- **`ts-node-dev` 冷启动慢**(~5-10s)。`pnpm kb:server` 之后等一下再 curl。
- **SSE 在 nginx 之类反代后面要关闭缓冲**(`X-Accel-Buffering: no`),目前直连无问题。
- **`class-validator` 不会自动开**,需要在 `main.ts` 里 `app.useGlobalPipes(new ValidationPipe(...))`。
- **`AuthGuard` 是全局守卫**(`APP_GUARD` provider 注册),不要再在每个 controller 上重复挂 `@UseGuards(AuthGuard)`,只用 `@Public()` 跳过。
- **写入 `dev-store.json` 不是原子的**:单机单进程不用管,多进程要加 lock。
- **`renderMarkdown`(前端)非常基础**,给 AI 让它输出表格 / 嵌套 list 显示会丑。要美化:换 `marked` + `dompurify`。
- **HttpMcpAdapter 不能注册成 Nest provider**:它的构造函数要 `McpServerRecord`,但 Nest 看到「有一个参数」就会去依赖图里找 `McpServerRecord` 类型 —— interface 在运行时不存在,Nest 解析不了直接炸 `"Nest can't resolve dependencies of the HttpMcpAdapter (?)"`。

---

## 10. 一些惯例

- **Action 字符串** = 权限 key:`audit.log(ctx.user.id, 'kb:update', { ... })`、`'role:delete'`、`'ai.tool.kb_write'`。
- **ID 前缀**:seeded record 用前缀(`u_super` / `r_super` / `r_editor` / `r_reader` / `mcp_web_search`);新建走 `randomUUID()`。
- **DTO 文件**:`dto/<verb>-<entity>.dto.ts`,一类一文件。class-validator 装饰每条带中文 `message`。
- **Service mutate 闭包**:所有验证和 throw 放进 `JsonStoreService.mutate(data => { ... })` 回调里,失败不写盘。
- **审计日志在 service 里调,不在 controller 里**:语义跟着业务,controller 只做 routing。

---

祝顺利。
