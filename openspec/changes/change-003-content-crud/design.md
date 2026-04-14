# design

## Data Model
- documents
- document_versions

## API
- GET /api/documents
- POST /api/documents
- GET /api/documents/:id
- PATCH /api/documents/:id
- DELETE /api/documents/:id

## UI
- `/admin/documents`
- `/admin/documents/[id]`

## Decisions
- 首版正文直接存数据库
- 发布时写入版本快照
- 删除默认先做软删除或 archive 策略
