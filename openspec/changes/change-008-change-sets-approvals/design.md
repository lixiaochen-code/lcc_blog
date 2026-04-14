# design

## Scope
实现变更集与审批的基础设施，不限定变更来源必须是 AI。

## Data Model
新增或完善：
- change_sets
- audit_logs
- document_versions（与回滚联动）

## Change Set States
- pending
- approved
- rejected
- applied
- rolled_back

## Change Types
- create
- update
- delete
- move
- merge
- split
- publish
- rollback

## API
- GET `/api/approvals`
- GET `/api/approvals/:id`
- POST `/api/approvals/:id/approve`
- POST `/api/approvals/:id/reject`
- GET `/api/change-sets/:id`

## UI
- `/admin/approvals`
- `/admin/tasks/[id]` 可联动跳转 change set
- diff 详情页

## Diff Strategy
首版可使用文本 diff：
- before_content
- after_content
- diff_text

## Decisions
- 所有已发布文档的写入型变更默认通过 change set
- change set 应绑定触发来源：user / agent / system
- 审批与应用分离，批准后可立即应用或进入下一步发布流程

## Risks
- diff 可读性会影响审批效率
- 后续可能需要更友好的富文本 diff
