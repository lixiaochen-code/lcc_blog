# design

## Scope
只建立站点外壳与前台基础交互，不包含完整内容 CRUD 与后台权限。

## Pages
- `/`
- `/docs`
- `/docs/[...slug]`
- `/search`

## Decisions
- 使用 Nextra 作为文档主题基础
- 先使用 mock data 或本地静态样例驱动页面
- 布局需兼容后续接入真实 API
