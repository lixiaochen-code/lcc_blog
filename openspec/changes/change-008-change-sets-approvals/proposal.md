# change-008-change-sets-approvals

## Why
系统需要让 AI 或管理员对内容变更先形成草稿和 diff，再进入审批，而不是直接覆盖正式内容。

## What Changes
- 新增 change_sets 数据模型
- 新增 before / after / diff 展示能力
- 新增审批流基础能力
- 新增变更状态流转
- 新增版本回滚入口

## Impact
- 为 AI 写入型任务提供安全边界
- 管理员可查看、审批、拒绝变更
- 后续 `change-009-ai-content-drafts` 可复用该变更机制
