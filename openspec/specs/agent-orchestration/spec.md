# agent-orchestration spec

## Purpose
定义 Agent 任务拆解、上下文检索、工具决策、执行、重试与记录规则。

## Requirements

### Requirement: 任务执行链
系统 MUST 支持 planner -> retriever -> tool router -> writer/reviewer -> executor 的任务链路。

### Requirement: 可观测性
系统 MUST 为任务步骤、工具调用与失败重试保留记录。

### Requirement: 权限前置
系统 MUST 在工具调用前进行权限校验。
