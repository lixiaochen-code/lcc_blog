# auth spec

## Purpose
定义系统认证、会话、用户状态、角色与权限控制规则。

## Requirements

### Requirement: 用户认证
系统 MUST 支持用户登录、登出、会话校验与用户状态校验。

#### Scenario: 正常登录
- GIVEN 用户存在且状态为 active
- WHEN 用户提交有效凭证
- THEN 系统创建有效会话
- AND 返回当前用户基础信息与角色

#### Scenario: disabled 用户登录
- GIVEN 用户状态为 disabled
- WHEN 用户尝试登录
- THEN 系统拒绝登录

### Requirement: 角色权限校验
系统 MUST 支持基于角色和权限点的服务端鉴权。

#### Scenario: admin 访问后台文档管理
- GIVEN 当前用户角色为 admin
- WHEN 访问后台文档管理接口
- THEN 系统允许访问

#### Scenario: user 访问 provider 管理
- GIVEN 当前用户角色为 user
- WHEN 请求 provider 管理接口
- THEN 系统拒绝访问

### Requirement: 游客限制
系统 MUST 将未登录用户视为 guest，并限制其使用 AI 能力。

#### Scenario: guest 发起 AI 搜索
- GIVEN 当前请求无有效登录会话
- WHEN 请求 AI 搜索接口
- THEN 系统拒绝访问
