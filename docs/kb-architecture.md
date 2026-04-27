# AI 知识库架构说明

## 技术选择

本仓库新增了两个独立模块：

- `apps/kb-web`：桌面端知识库 Web 界面，使用 Vue 3 + Vite。
- `apps/kb-server`：知识库 API 服务，使用 Node.js 内置 HTTP 服务。

知识库不直接使用 VitePress。界面保持 VitePress 风格，但运行时支持实时 Markdown 更新、权限、AI 会话、账号分配和 MCP 配置。

## 本地开发账号

默认超管：

```txt
superadmin / Admin@123456
```

## 环境变量

可在仓库根目录创建 `.env.kb`：

```txt
KB_SERVER_PORT=4010
KB_MARKDOWN_ROOT=docs/knowledge
KB_DATA_FILE=apps/kb-server/data/dev-store.json
KB_JWT_SECRET=please-change-me

OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

没有配置 `OPENAI_API_KEY` 时，AI 接口会返回本地模拟草稿，方便先调通权限和写入流程。

## 网络检索与 MCP

AI 面板支持勾选“网络检索”。后端优先调用已配置的 HTTP MCP endpoint，并将查询词以 `q` 参数传入；没有配置 endpoint 时，会使用基础免 key 网络检索作为兜底。

后续扩展本地 MCP 时，建议保持统一的工具返回格式：

```json
{
  "query": "检索词",
  "results": [
    {
      "title": "标题",
      "url": "https://example.com",
      "snippet": "摘要"
    }
  ]
}
```

## 启动

```bash
pnpm kb:server
pnpm kb:web
```

访问：

```txt
http://localhost:4020
```

## MySQL

表结构位于：

```txt
docs/mysql/kb-schema.sql
```

当前第一版使用 JSON 开发存储，便于无数据库启动。后续接 MySQL 时，保持 API 不变，只替换 `apps/kb-server/src/store.js` 的存储实现即可。
