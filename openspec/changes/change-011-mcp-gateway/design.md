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
