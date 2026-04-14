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
