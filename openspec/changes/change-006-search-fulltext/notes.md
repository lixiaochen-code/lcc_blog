# Search Limitations

## 已知限制

- MySQL FULLTEXT 对中文分词效果依赖底层分词策略，首版可能更适合命中较长关键词或中英文混合标题。
- 当前相关度策略为应用层简单加权：`title > summary > content`，不是数据库级 BM25 或自定义排序。
- 当前 excerpt 基于命中位置截取，不包含高亮、同义词扩展、拼写纠错。
- 首版搜索以 in-memory 仓库模拟 DAL 行为，迁移已预留 FULLTEXT 索引，但未在当前 change 内接入真实 Prisma 查询。

## 后续方向

- 针对中文场景评估 ngram、分词中间层或外部搜索引擎。
- 将当前 `searchDocuments()` 从 in-memory 排序迁移到真实 MySQL FULLTEXT 查询。
- 在 `change-007-ai-search` 中复用该搜索接口作为基础召回层。
