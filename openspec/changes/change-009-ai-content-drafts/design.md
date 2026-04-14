# design

## Scope
本 change 只实现“AI 生成建议 / 草稿”，不自动发布。

## Supported Task Types
- ai-create-draft
- ai-rewrite-document
- ai-suggest-tags
- ai-suggest-taxonomy

## Flow: Create Draft
1. admin 提交写作主题与约束
2. API 校验 `ai.write`
3. 创建 agent task
4. Agent 调用 provider 生成草稿
5. 系统保存为 draft 文档或 create 类型 change set

## Flow: Rewrite Document
1. admin 选择目标文档
2. API 校验 `ai.write`
3. Agent 获取原文与上下文
4. 生成修改建议
5. 系统保存 update 类型 change set
6. 管理员在审批页查看 diff

## Flow: Suggest Tags / Taxonomy
1. admin 提交整理任务
2. Agent 分析文档内容
3. 输出建议列表
4. 默认不自动应用，仅写入 task output 或生成待确认 change set

## API
- POST `/api/ai/tasks`
- GET `/api/ai/tasks`
- GET `/api/ai/tasks/:id`

## UI
- `/admin/tasks`
- `/admin/tasks/[id]`
- 任务提交表单
- 任务状态与结果页面

## Decisions
- AI 写入型任务必须绑定 task record
- 所有 rewrite 结果必须经过 change set
- 所有 AI 输出必须记录 provider / model / prompt metadata（可脱敏）

## Risks
- 草稿质量波动
- diff 过大时审批成本较高
- 需要合理限制单次输入长度与任务并发
