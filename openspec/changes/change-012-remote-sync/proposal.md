# change-012-remote-sync

## Why
管理员希望 AI 能从远程网页、仓库文档或其他知识源获取内容，并生成草稿或变更建议，以降低知识库维护成本。

## What Changes
- 基于 MCP Gateway 接入首批远程读取能力
- 新增远程抓取 / 同步任务
- 新增 remote source 记录与同步日志
- 支持将远程内容转为摘要、草稿或 change set
- 新增远程同步任务页面

## Impact
- admin 可发起远程内容同步
- AI 可基于外部内容生成更新建议
- 所有远程来源与同步过程可追踪
