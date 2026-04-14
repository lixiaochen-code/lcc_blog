# change-010-provider-management

## Why
系统需要允许超级管理员管理 AI 模型来源、协议、基础地址、启停状态和默认模型，以满足多 provider 和可切换模型的要求。

## What Changes
- 新增 provider_configs 表与管理 API
- 新增 provider 管理后台页面
- 支持创建、编辑、启停、默认 provider 设置
- 支持按任务类型配置默认模型
- 对敏感字段进行加密存储

## Impact
- super_admin 可管理模型来源
- Agent 与 AI 搜索/写作任务可使用统一 provider registry
