# Node 服务目录结构

## 典型分层

Node 后端服务可以按照职责拆分为配置、路由、领域逻辑、存储访问和外部服务适配。清晰的目录结构能降低后续功能扩展成本。

## 推荐结构

```txt
src/
  config.js
  server.js
  routes/
  services/
  repositories/
  integrations/
  utils/
```

## 当前项目示例

- `server.js`：负责 HTTP 路由、认证和响应。
- `ai.js`：负责 AI 上下文构建、工具调用和流式回复。
- `mcp.js`：负责检索服务适配。
- `markdown.js`：负责知识库 Markdown 文件读写。
- `store.js`：负责 JSON 开发存储。

## 维护建议

当路由继续增多时，可以逐步把管理接口、知识库接口、AI 接口拆到独立路由模块中。拆分时保持 API 返回结构不变，避免前端联动成本过高。
