# change-007-ai-search

## Why
用户希望通过 AI 对知识库进行自然语言检索、问答与摘要，而不是只使用关键词搜索。

## What Changes
- 新增 AI 搜索 / 问答接口
- 新增 AI 搜索前端页面
- 引入 provider registry 初版
- 将 FULLTEXT 搜索作为 AI 检索召回来源
- 为回答结果增加来源引用信息
- 为 AI 访问增加权限限制与日志记录

## Impact
- `user` 及以上角色可使用 AI 检索
- `guest` 不可访问 AI 搜索
- 为后续 AI 内容生成与治理打下 provider 与任务模型基础
