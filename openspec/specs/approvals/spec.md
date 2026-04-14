# approvals spec

## Purpose
定义 change set、diff、审批、发布、回滚的行为规则。

## Requirements

### Requirement: 提交审批
系统 MUST 支持对高风险变更提交审批。

#### Scenario: AI 生成 change set
- GIVEN 变更策略要求审批
- WHEN AI 生成变更
- THEN change set 状态为 pending

### Requirement: Diff 展示
系统 MUST 提供 before / after / diff 展示能力。

### Requirement: 回滚
系统 MUST 支持按历史版本回滚。
