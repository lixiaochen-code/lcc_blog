# ai-content-ops spec

## Purpose
定义 AI 草稿生成、文档改写、目录建议、标签建议与 change set 生成规则。

## Requirements

### Requirement: AI 生成草稿
系统 MUST 支持管理员使用 AI 生成文档草稿。

#### Scenario: 新建草稿
- GIVEN 用户拥有 `ai.write`
- WHEN 提交主题和要求
- THEN 生成 draft 文档或 change set

### Requirement: AI 改写现有文档
系统 MUST 支持对已存在文档生成修改建议和 diff。

#### Scenario: 改写已发布文档
- GIVEN 文档已发布
- WHEN 管理员发起改写任务
- THEN 系统生成变更草稿
- AND 不直接覆盖原文

### Requirement: AI 整理建议
系统 SHOULD 支持分类、标签、目录建议，但默认不自动应用。
