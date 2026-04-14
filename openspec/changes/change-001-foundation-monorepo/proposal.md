# change-001-foundation-monorepo

## Why
当前项目需要一个统一的工程基础，以支持 Web、Agent、数据库、共享包以及 OpenSpec 的长期演化。

## What Changes
- 初始化 pnpm monorepo
- 初始化 apps/web
- 初始化 apps/agent
- 初始化 packages/db、packages/shared、packages/tool-sdk
- 初始化 Docker Compose（MySQL、Redis）
- 初始化基础 lint / typecheck / build 流程
- 初始化 openspec 目录

## Impact
- 为后续所有 change 提供统一工程基础
- 不直接引入业务功能
