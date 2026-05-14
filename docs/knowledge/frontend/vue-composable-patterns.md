# Vue Composable 设计模式

## 背景

当 Vue 单文件组件中的状态和行为越来越多时，可以把可复用逻辑拆成 composable。这样组件只负责组织视图，业务状态由独立函数维护。

## 适合拆分的逻辑

- 登录状态和 token 管理。
- 列表加载、刷新和错误处理。
- 编辑器保存、撤销和校验。
- AI 对话流式读取。
- 表单提交和权限判断。

## 示例命名

```txt
useAuth()
useKnowledgeTree()
useArticleEditor()
useAiChat()
useAdminUsers()
```

## 注意事项

Composable 不应该成为新的“大杂烩”。每个 composable 需要有清晰边界，并返回组件真正需要的状态和方法。跨模块共享的类型应放在统一的 API 类型文件中。
