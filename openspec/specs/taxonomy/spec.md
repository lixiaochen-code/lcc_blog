# taxonomy spec

## Purpose
定义分类、标签、目录树与导航结构规则。

## Requirements

### Requirement: 分类管理
系统 MUST 支持分类的创建、编辑、层级组织与排序。

### Requirement: 标签管理
系统 MUST 支持标签创建、编辑、绑定与去重。

### Requirement: Sidebar 管理
系统 MUST 支持目录树配置、层级、排序和文档映射。

#### Scenario: 移动目录节点
- GIVEN 用户拥有 `sidebar.update`
- WHEN 将文档移动到新目录节点
- THEN 前台目录结构正确反映变更
