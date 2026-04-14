# content spec

## Purpose
定义文档内容的创建、编辑、发布、归档、删除、版本管理与来源追踪规则。

## Requirements

### Requirement: 文档 CRUD
系统 MUST 支持文档的创建、读取、更新、删除。

#### Scenario: 创建文档
- GIVEN 用户拥有 `doc.create`
- WHEN 提交合法文档数据
- THEN 系统创建 draft 文档

### Requirement: 文档状态流转
系统 MUST 支持 draft、review、published、archived 四种状态。

#### Scenario: 发布文档
- GIVEN 文档处于 draft 或 review
- WHEN 用户拥有 `doc.publish`
- THEN 系统将文档状态改为 published

### Requirement: 版本快照
系统 MUST 在重要变更时保存版本快照。

#### Scenario: 编辑已发布文档
- GIVEN 文档当前为 published
- WHEN 管理员修改正文
- THEN 系统保留历史版本并创建新版本

### Requirement: 来源追踪
系统 SHOULD 记录内容来源类型与外部引用信息。
