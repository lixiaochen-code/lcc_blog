# design

## Scope
本 change 实现只读 AI 能力：
- AI 搜索
- AI 问答
- AI 摘要

不包含：
- AI 写入
- change set
- 审批流

## Input Flow
1. 用户提交问题
2. API 校验 `ai.search` / `ai.ask` 权限
3. 调用 `searchDocuments()` 召回候选文档
4. 截取文档摘要或正文片段作为上下文
5. 调用 provider 生成回答
6. 返回回答与来源引用
7. 记录 agent task / audit log

## API
- POST `/api/ai/search`

请求：
- query
- mode (`search` | `ask` | `summarize`)
- topK

响应：
- answer
- citations[]
- relatedDocuments[]
- taskId（可选）

## UI
- `/ai/search`
- 对话输入框
- 回答区域
- 来源引用区域
- 错误态 / 无权限态

## Provider Registry v1
新增简化 provider 调用层：
- 获取默认 provider
- 获取默认 model
- `generateText()`

首版只需要满足文本生成。

## Logging
- 记录 ai search task
- 记录使用的 provider / model
- 记录引用文档 ID 列表

## Decisions
- 首版不做多轮会话记忆持久化
- 首版回答必须附带来源引用
- 首版仅使用本地知识库作为主要上下文来源

## Risks
- 若召回内容质量不稳定，AI 回答可能不够准确
- 后续需要 `content_chunks` 提升上下文质量
