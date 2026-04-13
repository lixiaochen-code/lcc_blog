# Workflows

## Answer a question from the knowledge base

Command:

```bash
pnpm kb:agent --action retrieve --query "如何低 token 检索知识库"
```

Response pattern:

- Summarize only from returned notes.
- If only one result is relevant, say that the answer is based mainly on that note.
- If no result is good enough, say the knowledge base does not yet contain enough material.

## Add a note from conversation

Map the conversation into:

- title
- category
- tags
- summary
- content

Then run:

```bash
pnpm kb:agent --action add --title "对话式新增笔记" --category inbox --tags 知识库,AI --summary "说明如何通过对话新增笔记" --content "把用户自然语言请求收束成结构化写入动作。"
```

## Append new information

When the user says“补充到那篇笔记里”, prefer append:

```bash
pnpm kb:agent --action append --slug 对话式知识库接入设想 --section "新增补充" --append "这里是新增内容"
```

## Update only metadata

When only title, tags, aliases, summary, or category changed:

```bash
pnpm kb:agent --action update-meta --slug 对话式知识库接入设想 --summary "更聚焦的新摘要" --tags 知识库,AI,检索
```

## Rebuild knowledge base index

When the user asks to reorganize or refresh the knowledge base index:

```bash
pnpm kb:agent --action build
```
