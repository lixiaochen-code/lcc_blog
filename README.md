# lcc_blog

AI 驱动知识库博客项目工程基线。

## 当前阶段

当前仓库已完成 OpenSpec 与 monorepo 基础骨架初始化，对应 change：`change-001-foundation-monorepo`。

## 目录结构

```text
apps/
  web/
  agent/
packages/
  db/
  shared/
  tool-sdk/
openspec/
```

## 常用命令

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
docker compose up -d
```

## 环境要求

- Node.js 23+
- pnpm 9+
- Docker

## OpenSpec

- 配置文件：`openspec/config.yaml`
- specs：`openspec/specs/*/spec.md`
- changes：`openspec/changes/*`
