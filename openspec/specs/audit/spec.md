# audit spec

## Purpose
定义关键操作审计、日志范围、敏感操作追踪与检索规则。

## Requirements

### Requirement: 审计覆盖范围
系统 MUST 记录登录、角色变更、provider 变更、MCP 变更、AI 写入、审批、删除等关键操作。

### Requirement: 可查询
系统 SHOULD 支持按操作者、时间、目标对象、动作类型查询审计日志。
