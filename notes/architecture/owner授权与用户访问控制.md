---
title: "Owner 授权与用户访问控制"
summary: "定义 owner 如何授权普通用户使用生产 AI，并控制其知识库权限、运行时权限和 token 配额。"
tags: ["知识库", "AI", "权限", "用户"]
aliases: ["user access control", "owner approval"]
category: "architecture"
createdAt: "2026-04-08T00:00:00.000Z"
updatedAt: "2026-04-08T00:00:00.000Z"
---

# Owner 授权与用户访问控制

生产 AI 不应面向所有访客默认开放，而应采用 owner 授权模式。

## 授权原则

- 只有 owner 可以批准新用户使用 AI。
- 普通用户默认无权消耗 token。
- 权限应细粒度控制，不只依赖单一角色。
- 配额控制必须与权限控制同时存在。

## 角色

建议基础角色如下：

- `owner`
- `editor`
- `viewer`
- `suspended`

其中 owner 拥有最高权限，并额外掌握运行时配置管理能力。

## 基础权限位

知识库相关：

- `notes.read`
- `notes.create`
- `notes.update`
- `notes.delete`
- `docs.reorganize`
- `kb.ingest_url`

站点相关：

- `site.build`
- `site.deploy`

系统相关：

- `users.manage`
- `tokens.use`
- `runtime.manage_connection`
- `runtime.manage_model`
- `runtime.manage_secret`

## owner 能力

owner 除了知识库增删改查，还应能管理：

- 用户开通与停用
- 用户角色调整
- 单个权限位授予和回收
- 每日请求上限
- 每月 token 上限
- `baseUrl`
- `protocol`
- `apiKey`
- 当前唯一生效模型

## 普通用户能力边界

普通用户不应拥有以下能力：

- 修改上游连接配置
- 修改 API Key
- 自主切换模型
- 直接发布生产
- 管理其他用户

即使是 editor，也建议默认不开放删除和发布。

## 本地配置文件

当前建议使用：

- [`data/ai-access.example.json`](/Users/apple/Documents/ai/lcc_blog/data/ai-access.example.json)
- `data/ai-access.local.json`

其中：

- example 文件用于定义结构和默认 owner
- local 文件用于服务器真实用户数据

## 管理命令

仓库当前已经提供了一个轻量管理入口：

- `pnpm kb:access --action inspect`
- `pnpm kb:access --action add-user --id alice --name Alice --role viewer`
- `pnpm kb:access --action set-role --id alice --role editor`
- `pnpm kb:access --action grant --id alice --permission notes.create`
- `pnpm kb:access --action revoke --id alice --permission notes.delete`
- `pnpm kb:access --action set-quota --id alice --dailyRequests 30 --monthlyTokens 300000`
- `pnpm kb:access --action suspend --id alice`
- `pnpm kb:access --action activate --id alice`

这些命令适合在真正后台页面完成之前，先由 owner 在服务器上直接管理用户。

## 配额建议

建议配额至少分成两层：

- 每日请求次数
- 每月 token 总量

这样比只限制 token 更容易控制滥用，因为请求次数和 token 消耗分别对应不同风险。

## 应用层接入方式

后续服务端接入时，建议流程如下：

1. 用户登录或携带身份信息访问 AI。
2. 服务端读取用户角色、权限位和配额。
3. 先判断是否允许消耗 token。
4. 再判断是否允许执行目标动作。
5. 执行动作后记录审计日志。
6. 如涉及发布，转成待 owner 审批。

## 单模型约束

模型切换不属于普通功能，而属于系统配置。

因此建议始终保持：

- 系统只保留一个当前生效模型
- 由 owner 统一决定模型
- 普通用户只能共享使用该模型

这样可以避免：

- 用户自行切模型导致成本失控
- 不同模型行为不一致
- 上游配置变得难以审计
