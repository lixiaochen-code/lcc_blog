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
