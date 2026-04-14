# change-006-search-fulltext

## Why
知识库站点必须具备稳定、快速、可解释的基础搜索能力。项目当前需要先建立关键词搜索能力，作为前台搜索和 AI 检索的基础召回层。

## What Changes
- 为 documents 表增加 FULLTEXT 搜索能力
- 新增搜索 DAL 与搜索 API
- 新增前台搜索页面与后台搜索复用能力
- 定义搜索结果结构与分页能力
- 为后续 AI 检索提供基础召回接口

## Impact
- 用户可按关键词搜索文档
- 后续 `change-007-ai-search` 可以直接复用搜索接口做初级检索增强
- 不包含 embedding 与语义检索
