# lcc_blog

这是一个基于 `VitePress` 的个人知识库项目。  
项目目标不是单纯做博客，而是把个人笔记、外部资料整理、AI 检索和后续的站内智能助手整合成一个可持续演进的知识系统。

## 项目目标

当前项目希望解决这几件事：

- 用 `Markdown` 作为知识内容的唯一真源
- 用结构化文件驱动知识库目录，而不是依赖文件夹自然生长
- 让 AI 能参与新增、整理、检索、归档知识
- 尽量用低 token 成本完成准确回答
- 后续支持在网站内直接使用 AI 对话能力

## 当前已实现

### 1. Markdown-first 知识库

知识内容保存在：

- [`notes/`](/Users/apple/Documents/ai/lcc_blog/notes)

原则：

- 文档内容以 Markdown 为准
- AI 不直接自由修改整个仓库
- 写入动作通过结构化命令和脚本完成

### 2. docs.json 驱动目录结构

知识库的信息架构由：

- [`data/docs.json`](/Users/apple/Documents/ai/lcc_blog/data/docs.json)

驱动。

这个文件描述：

- section 分组
- 导航标题
- 展示短标题
- 排序顺序
- 某条内容是否隐藏

构建时会基于它自动生成：

- 顶部导航
- `/notes/` 目录页
- `/notes/` 侧边栏

### 3. 低 token 检索链路

已经实现的检索策略：

- 先本地检索相关笔记
- 返回紧凑摘要、标题、标签、片段
- AI 优先基于命中结果回答
- 避免每次把整个知识库喂给模型

相关脚本：

- `pnpm kb:search`
- `pnpm kb:context`
- `pnpm kb:agent --action retrieve`

### 4. AI 驱动的结构化写入

已经支持的知识库动作：

- `add`
- `append`
- `update-meta`
- `retrieve`
- `inspect-url`
- `ingest-url`

核心入口：

- [`scripts/kb/agent.mjs`](/Users/apple/Documents/ai/lcc_blog/scripts/kb/agent.mjs)

补充说明：

- `kb:agent` 的写入动作默认只修改开发环境源码
- 只有显式传入 `--build true` 时，才会在写入后自动执行知识库重建
- 这更适合后续接入“生产 AI 修改开发环境、由 owner 决定是否发布”的流程

### 5. 运行时配置、登录与权限控制

项目后续接入生产 AI 时，默认按“服务器直接运行 Node 进程”设计，不依赖 Docker。

运行时配置模板：

- [`data/ai-runtime.example.json`](/Users/apple/Documents/ai/lcc_blog/data/ai-runtime.example.json)

服务器本地私有配置：

- `data/ai-runtime.local.json`（已加入 `.gitignore`）

配置入口：

- `pnpm kb:runtime-config --action inspect`
- `pnpm kb:runtime-config --action set --protocol https --baseUrl api.openai.com/v1 --model gpt-4.1-mini`

用户授权入口：

- `pnpm kb:access --action inspect`
- `pnpm kb:access --action add-user --name Alice --role admin`
- `pnpm kb:access --action grant --id alice --permission notes.create`
- `pnpm kb:access --action set-quota --id alice --dailyRequests 30 --monthlyTokens 300000`

约束：

- 最高权限角色为 `super_admin`
- `super_admin` 可修改 `protocol`、`baseUrl`、`apiKey`、`model`
- 当前只允许选择一个生效模型，不开放普通用户自行切换
- `apiKey` 应保存在服务器本地配置中，不应提交到仓库
- 普通用户角色为 `admin`
- `admin` 只能在被授权范围内增删改查知识库
- 用户只能由 `super_admin` 添加
- 登录时需要同时校验 `昵称 + userId`
- 当前本地 AI 模块已接入最小可用登录态和会话 token

### 5. 网页导入

已支持把外部网页导入知识库：

- 先尝试 `curl`
- 如果需要，再回退到 `headless Chrome --dump-dom`
- 提取正文后转成 Markdown
- 自动写入 `notes/`
- 自动更新目录和导航

相关脚本：

- [`scripts/kb/url.mjs`](/Users/apple/Documents/ai/lcc_blog/scripts/kb/url.mjs)
- [`scripts/kb/extract_article.py`](/Users/apple/Documents/ai/lcc_blog/scripts/kb/extract_article.py)

## 当前命令

开发与构建：

- `pnpm docs:dev`
- `pnpm dev:ai`
- `pnpm docs:build`
- `pnpm docs:preview`

知识库维护：

- `pnpm kb:build`
- `pnpm kb:add --title "标题" --category inbox --tags 标签1,标签2 --content "正文"`
- `pnpm kb:update --slug 笔记-slug --append "补充内容"`
- `pnpm kb:search 检索词`
- `pnpm kb:context 检索词`
- `pnpm kb:agent --action retrieve --query "问题"`
- `pnpm kb:agent --action add --title "标题" --category inbox --content "正文" --build false`
- `pnpm kb:agent --action append --slug getting-started --append "补充内容" --build false`
- `pnpm kb:agent --action ingest-url --url "https://example.com"`
- `pnpm kb:runtime-config --action inspect`
- `pnpm kb:runtime-config --action set --protocol https --baseUrl api.openai.com/v1 --model gpt-4.1-mini`
- `pnpm kb:access --action inspect`
- `pnpm kb:access --action add-user --name Alice --role admin`
- `pnpm kb:access --action set-role --id alice --role admin`
- `pnpm kb:access --action grant --id alice --permission notes.delete`
- `pnpm kb:access --action set-quota --id alice --dailyRequests 30 --monthlyTokens 300000`
- `pnpm kb:access --action suspend --id alice`
- `pnpm kb:access --action activate --id alice`
- `pnpm kb:access --action delete-user --id alice`

本地 AI dev 流程：

- `pnpm dev:ai`
- 打开本地站点首页或任意知识库页面
- 在 `header` 右侧点击 `AI` 入口展开控制台
- 若未登录，先输入 `昵称 + userId` 登录 AI 模块
- 控制台会连接 `http://localhost:3030/api/*`

## 当前目录约定

- `notes/`：知识库正文
- `data/docs.json`：知识库目录和信息架构
- `data/knowledge-base.json`：构建出的知识索引
- `scripts/kb/`：知识库脚本
- `skills/`：仓库内 skill
- `.vitepress/`：站点配置与静态构建输出

## 部署方式

当前项目是静态站点，部署方式很直接：

1. 安装依赖
2. 执行 `pnpm docs:build`
3. 部署 `.vitepress/dist`

说明：

- `pnpm docs:build` 之前会自动执行 `node ./scripts/kb/build.mjs`
- 所以知识库更新后，只需要重新构建并重新发布静态产物

## 我们的核心需求整理

目前这个项目围绕以下需求持续演进：

### A. 知识库能力

- 能新增知识
- 能修改知识
- 能检索知识
- 能自动整理目录
- 能根据 `docs.json` 重组结构
- 能导入网页、文章、外部资料

### B. AI 驱动

- AI 在上层理解用户意图
- 脚本在下层执行具体动作
- AI 优先通过结构化动作更新知识库
- AI 优先通过紧凑上下文回答，而不是直接读全库

### C. 可持续维护

- 导航和目录自动生成
- 构建前自动刷新知识索引
- 部署流程简单
- 后续能扩展到网站端直接使用

### D. 站内控制台体验

- AI 入口应放在 `header` 右侧，而不是混在知识库正文里
- 点击 AI 入口后，不发生页面跳转，只展开站内 AI 控制台
- 桌面端应采用“左侧文档 + 右侧 AI”分栏布局
- 右侧 AI 区应是独立工作区，不应表现为浮层遮罩或覆盖正文
- AI 控制台内部应采用纵向 `tab` 切换
- `AI 对话` 是主入口
- `我的` 用于查看当前登录身份、权限表和执行日志
- `用户管理` 只对 `super_admin` 开放
- 聊天区按“先自然语言理解，再做服务端权限校验，再执行脚本”工作
- AI 面板支持拖拽调宽，桌面端最大宽度为视口 `50%`

## 当前界面需求

目前已明确的网页端需求如下。

### 1. Header 入口

- `header` 右侧保留一个 `AI` 入口
- 这个入口的视觉应更像导航区里的操作项，而不是突出的大按钮
- 点击后只切换右侧 AI 工作区展开/收起，不跳转路由
- 当 AI 工作区展开时，`header` 顶部背景需要延续到最右侧，不能出现断层

### 2. 页面布局

- 默认状态下页面只展示文档区
- 展开 AI 后，页面切换为左右布局
- 左侧是原有文档阅读区
- 右侧是独立 AI 工作区
- 右侧工作区应与页面正文并排展示，而不是悬浮在上层

### 3. AI 工作区结构

- 右侧 AI 工作区内部使用纵向 icon `tab`
- `AI 对话` 为默认主入口
- `我的` 显示当前账号信息、完整权限表和执行日志
- `用户管理` 显示用户列表、详情展开、权限编辑、角色切换和删除用户
- 对话区采用“header 固定、输入框固定、消息区独立滚动”的布局

### 4. 权限要求

- `super_admin` 拥有最高权限
- `super_admin` 可修改 `baseUrl`、`protocol`、`apiKey`、`model`
- 系统同一时间只允许一个生效模型
- `admin` 用户必须先由 `super_admin` 添加
- `admin` 默认只拥有基础权限，具体知识库权限由 `super_admin` 分配
- 登录时校验 `昵称 + userId`
- 服务端不再信任前端传入的用户身份，而是按登录 token 识别当前用户

### 5. 当前已接入的 AI 动作

- `retrieve`
- `add`
- `append`
- `update-meta`
- `delete`
- `inspect-url`
- `ingest-url`

说明：

- 当前 `AI 对话` 已接入自然语言入口
- 实际链路为：`自然语言 -> 模型规划动作 -> 服务端权限校验 -> kb:agent / kb:url`
- 当前仍然是受控动作式 AI，不允许模型直接自由改仓库
- 服务端对动作做最终权限判定，模型不直接决定“有没有权限”

## 当前阶段判断

当前项目已经不再是单纯的 VitePress 笔记站，而是在向“带登录、权限和受控动作的站内 AI 工作区”演进。

更具体地说，现在项目同时包含四层目标：

- 知识内容层：`Markdown` 与 `notes/`
- 结构管理层：`docs.json`
- 受控执行层：`kb:agent`、`kb:url`、本地权限与运行时配置
- 站内交互层：`header` 入口、右侧 AI 工作区、登录态、分角色权限

因此接下来的优先级，不是继续补零散页面，而是把“站内 AI 工作区”这条链彻底打通。

## 接下来优先级

### P1. 收敛站内 AI 工作区 UI

这是当前最优先的前端任务。

目标：

- 把“左侧文档 + 右侧 AI”布局继续打磨到稳定状态
- 继续优化 AI 对话页的视觉和滚动体验
- 保证聊天区 header、消息区、输入区的高度和滚动逻辑稳定
- 继续打磨拖拽调宽体验

当前重点不是继续加更多模块，而是先把已有交互骨架和布局定型。

### P2. 打通 super_admin 用户管理

`super_admin` 工作区需要优先稳定，因为它是权限和配置的总入口。

目标：

- 管理用户授权
- 管理权限位
- 管理 token 配额
- 管理 `baseUrl`、`protocol`、`apiKey`、`model`
- 保证系统始终只有一个生效模型
- 继续补全用户详情、删除、状态切换和可见性细节

这部分稳定之后，普通用户能力才有可靠基础。

### P3. 完成受控 AI 对话流

当前 `AI 对话` 已经接上了自然语言到受控动作的主链，但还不是最终形态。

下一步目标：

- 继续提升自然语言到结构化动作的稳定性
- 优先命中 `retrieve`
- 在有权限时再触发 `add`、`append`、`update-meta`、`delete`
- 保持所有写入动作仍然走权限网关
- 优化回复内容和结果展示，而不是单纯返回动作日志

这里的原则仍然不变：

- AI 负责理解意图
- 脚本负责执行动作
- 不让模型直接自由改仓库

## 本轮已落地

这轮对话已经实际完成了下面这些改动：

- `header` 中的 `AI` 入口已稳定为右侧操作项
- 右侧 AI 面板已接入登录态
- 登录改为 `昵称 + userId` 双校验
- 角色已收敛为 `super_admin / admin`
- `AI 对话` 已改成自然语言入口
- 当前链路为：模型先规划动作，服务端再校验权限，最后执行脚本
- `我的` 已展示当前账号信息、完整权限表、执行日志
- `用户管理` 仅对 `super_admin` 显示
- `新增用户` 已改为只填昵称、服务端自动生成随机 `userId`
- `用户管理` 已支持用户列表、详情展开、权限授予/回收、角色切换、删除用户、停用/启用
- AI 面板已支持拖拽调宽，桌面端最大宽度为视口 `50%`
- 聊天页已调整为：header 固定、输入区固定、消息区独立滚动、自动滚到底

## 新对话续接建议

如果换一个新对话，希望直接延续当前需求，优先告诉模型下面几点：

- 这是一个 `VitePress + Markdown + 受控 AI 动作` 的知识库博客系统
- 当前 AI 模块已经有 `登录 / 对话 / 我的 / 用户管理`
- 角色只有两种：`super_admin` 和 `admin`
- 用户只能由 `super_admin` 添加
- 登录必须校验 `昵称 + userId`
- AI 对话必须遵循：`自然语言 -> 模型规划动作 -> 服务端权限校验 -> 脚本执行`
- 不允许让模型直接自由修改整个仓库
- 当前最优先是继续打磨右侧 AI 工作区的 UI、滚动、布局和用户管理体验

### P4. 发布流程彻底两阶段化

当前已经明确“写入开发环境”和“更新生产”要分离，后续需要把这件事做完整。

目标：

- 普通写入只改开发环境源码
- 是否 `build` 和是否发布由 owner 决定
- 后续补待发布记录、审批记录和发布入口

### P5. 复用 skills 与 MCP

等 UI、权限和动作流稳定后，再继续把技能复用做深。

目标：

- 站内 AI 对话复用现有知识库工作流
- 检索、网页导入、结构化写入都复用已有脚本与 skill
- 后续再考虑 skill 选择和更细粒度动作调度

## 当前结论

这个项目当前已经从“个人笔记站”演进成了“AI 辅助的 Markdown 知识库”。

接下来的核心方向不是继续堆页面，而是把下面三层打通：

- 内容层：Markdown + notes
- 结构层：docs.json
- 智能层：站内 AI 对话、skills、权限控制

如果后续继续迭代，README 应该始终跟着同步更新，作为项目级需求和路线图的基线文档。
