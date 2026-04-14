# design

## Architecture
- `apps/web`：Next.js + Nextra
- `apps/agent`：Node.js + TypeScript worker
- `packages/db`：Prisma schema 与 client
- `packages/shared`：共享类型、常量、schema
- `packages/tool-sdk`：工具定义与执行抽象
- `openspec`：规格与变更管理

## Decisions
- 使用 pnpm workspace
- 使用 TypeScript strict
- 使用 Docker Compose 管理 MySQL 与 Redis
- 保持 Web 与 Agent 分离

## Risks
- 初始化依赖较多
- 目录结构一旦敲定，后续调整成本较高
