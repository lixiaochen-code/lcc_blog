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
