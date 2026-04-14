# design

## Scope
本 change 仅实现 MySQL FULLTEXT 关键词搜索，不实现内容分块和语义检索。

## Data
基于 `documents` 表现有字段：
- title
- summary
- content

为上述字段建立 FULLTEXT 索引。

## Search Behavior
- 支持关键词输入
- 支持按相关度排序
- 支持分页
- 支持空结果
- 支持返回文档基础元数据

## API
- GET `/api/search?q=...&page=1&pageSize=10`

响应建议：
- items[]
  - id
  - slug
  - title
  - summary
  - excerpt
  - score
  - status
  - visibility
  - tags
  - categories
- page
- pageSize
- total

## UI
- `/search`
- 支持输入框、结果列表、空状态、加载状态

## DAL
新增 `searchDocuments()`，统一处理：
- 权限范围过滤
- FULLTEXT 查询
- 结果整形

## Decisions
- 首版只搜索已允许当前用户访问的文档
- 首版不做复杂高亮，仅返回 excerpt
- 首版不做拼写纠错、同义词、搜索分析

## Risks
- FULLTEXT 对中文效果取决于分词策略
- 若中文命中效果不足，后续可增加 ngram / 分词中间层或切换更强检索方案
