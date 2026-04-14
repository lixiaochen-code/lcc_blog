# design

## Scope
本 change 聚焦“只读远程内容获取 + 生成草稿/建议”，不实现高风险自动写入外部系统。

## Supported Sources v1
- Web page（通过 Fetch MCP 或受控抓取工具）
- GitHub docs / release（通过允许的 MCP）
- Filesystem 受控目录读取

## Data Model
建议新增：
- remote_sources
- sync_jobs

### remote_sources
- id
- source_type(web/github/filesystem/other)
- source_ref
- title
- metadata_json
- created_by
- created_at

### sync_jobs
- id
- remote_source_id
- task_id
- sync_type(import/summarize/draft/update-suggestion)
- status
- result_json
- created_by
- created_at
- finished_at

## Flow
1. admin 提交远程 URL / source
2. API 校验 `ai.sync`
3. 创建 sync task
4. Agent 通过 MCP Gateway 获取远程内容
5. 清洗内容
6. 生成摘要 / draft / change set
7. 记录 remote source 与 sync job
8. 返回任务结果与来源信息

## API
- POST `/api/ai/sync`
- GET `/api/ai/sync`
- GET `/api/ai/sync/:id`

## UI
- `/admin/tasks` 可展示 sync 类型任务
- 可新增 `/admin/sync` 页面
- 支持查看来源、状态、结果、失败原因

## Decisions
- 远程内容默认只读
- 远程同步默认产出草稿或建议，而不是直接发布
- 每个远程任务都必须记录来源和抓取时间

## Risks
- 外部页面内容格式不稳定
- 远程抓取内容可能噪声较大
- 需要避免将未经清洗的内容直接写入正式文档
