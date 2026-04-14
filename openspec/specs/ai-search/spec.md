# ai-search spec

## Purpose
定义 AI 检索、问答、摘要与来源引用规则。

## Requirements

### Requirement: AI 问答
系统 MUST 支持用户基于知识库发起问题并获取答案。

#### Scenario: user 发起问题
- GIVEN 用户拥有 `ai.ask`
- WHEN 提交问题
- THEN 系统检索相关文档并生成回答

### Requirement: 来源引用
系统 MUST 为 AI 回答附带来源文档引用。

#### Scenario: 展示引用来源
- GIVEN 已生成回答
- WHEN 返回结果
- THEN 同时返回文档引用信息

### Requirement: 游客不可用
系统 MUST 限制 guest 使用 AI 检索能力。
