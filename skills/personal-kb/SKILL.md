---
name: personal-kb
description: Use this skill to retrieve from or update the local Markdown knowledge base in a low-token way. Always retrieve compact context first, then answer or write through the kb agent command.
metadata:
  short-description: Low-token local knowledge-base workflow
---

# Personal KB

Use this skill when the user wants to search notes, answer from the knowledge base, or update notes through conversation.

## Core rule

Always prefer `pnpm kb:agent` over reading many Markdown files directly.

## Retrieval workflow

For questions answered from notes:

1. Run `pnpm kb:agent --action retrieve --query "<user question>"`.
2. Answer only from the returned `results`.
3. If the results are weak, say that clearly instead of guessing.
4. Mention note titles or paths when grounding the answer helps.

This keeps token usage low because the agent returns only summaries, headings, snippets, and paths.

## Write workflow

For note creation or updates, convert the user intent into one of these actions:

- `add`
- `append`
- `update-meta`
- `build`

Then execute `pnpm kb:agent` with structured arguments instead of editing files freehand.

## Commands

- `pnpm kb:agent --action retrieve --query "vite 插件"`
- `pnpm kb:agent --action add --title "标题" --category inbox --tags 标签1,标签2 --summary "摘要" --content "正文"`
- `pnpm kb:agent --action append --slug note-slug --section "补充" --append "新增内容"`
- `pnpm kb:agent --action update-meta --slug note-slug --summary "新摘要" --tags 标签1,标签2`
- `pnpm kb:agent --action build`

## When direct file reads are still okay

Only read a note file directly when:

- the retrieved results point to one specific note and you need exact wording from that note
- you are verifying that a write landed correctly

## Reference

For examples and response patterns, see [references/workflows.md](references/workflows.md).
