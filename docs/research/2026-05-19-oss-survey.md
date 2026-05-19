# OSS AI-KB Survey — Lessons for `lcc_blog`

Date: 2026-05-19
Author: research note for refactor planning
Scope: AnythingLLM, Open WebUI, Khoj, LibreChat, LobeChat, Cherry Studio
Goal: borrow ideas that fix our "AI keeps asking before writing the article" problem and to reorganise content vs. admin pages.

Method: read each project's README, agent/tool source files, and key system prompts via the GitHub API. WebSearch / WebFetch were intermittently unavailable, so depth is uneven — flagged per project.

---

## 1. TL;DR table

| Project | Scale (stars / lang) | Article-gen workflow | Tool model | Standout feature for us |
|---|---|---|---|---|
| AnythingLLM | 60.3k / JS+React | Agent invoked via `@agent`; calls `create-text-file` which writes to a sandboxed file (download card), **with per-tool `requestToolApproval` hook** | Custom "Aibitat" framework, OpenAI-style function defs, MCP layer, "Intelligent Skill Selection" (loads only relevant tools to save tokens) | Per-call approval gate baked into the tool runtime |
| Open WebUI | 137.7k / Python | Built-in `write_note(title, content)` tool — one shot, no confirmation; notes are first-class objects with `replace_note_content` for edits | Native Python function-calling, Pydantic-typed signatures, magic `__user__` / `__request__` injection; pluggable Tools + Functions + Pipelines | First-class `notes` + `knowledge` separation; tool registry with auto OpenAPI schema |
| Khoj | 34.6k / Python | "Researcher" plan-and-execute loop with `max_iterations`; system prompt explicitly forbids asking the user to confirm assumptions | "Tool AIs" — each tool is itself a sub-agent invoked with a self-contained prompt; multi-step research plan generated up front | The "do not ask, decide and document" prompt clause + multi-turn planner |
| LibreChat | 37.2k / TS | Agent endpoint with `SKILL.md` bundles (manual / automatic / always-on) and **Subagents** for delegated context windows; agent marketplace | LangGraph-style agents, MCP-first, structured tools registry, code interpreter API | Reusable `SKILL.md` instruction bundles + subagent context isolation |
| LobeChat | 77.3k / TS | Dedicated `builtin-tool-agent-documents` package: `createDocument(title, content)`, plus node-level XML edits with stable IDs (`modifyNodes`); system prompt says "decide what is reasonable, proceed, document later" | 30+ in-tree builtin-tool packages, each with own manifest + executor + Inspector UI + Render UI; MCP plugin marketplace | Node-level XML editing via `modifyNodes` (preserves stable IDs for surgical edits) |
| Cherry Studio | 45.9k / TS (Electron) | Notes live as `.md` files on disk; `NotesService.addNote(name, content, parentPath)` + tree; AI writes via MCP/agent | Desktop client, MCP-first, 300+ assistant presets, no opinionated agent loop | Filesystem-native notes (tree on disk, no DB) — closest to our model |

---

## 2. Per-project notes

### 2.1 AnythingLLM — `Mintplex-Labs/anything-llm`

Investigated source: `server/utils/agents/aibitat/plugins/*` and `server/utils/agents/defaults.js`.

- **Article workflow**: in v1.11+ there is a dedicated `create-files-agent` plugin with five sub-tools: `create-text-file`, `create-pdf-file`, `create-docx-file`, `create-excel-file`, `create-pptx-file`. Each tool accepts `{filename, content, extension}`, writes a buffer to disk, and emits a `fileDownloadCard` socket event so the UI can render a download chip. Each tool also calls `this.super.requestToolApproval(...)` before writing — i.e. the runtime supports a per-call approval prompt, not just a global toggle. This is the closest analogue to our `propose_draft` flow but expressed as a generic mechanism every tool can opt into.
- **Tool model**: custom "Aibitat" agent framework (forked from Microsoft AutoGen). Tools are JSON-schema function definitions; an "Intelligent Skill Selection" router loads only relevant tools per query to cut tokens (claimed ~80% reduction). MCP servers are surfaced through a `MCPCompatibilityLayer` and merged into the agent's function list.
- **System prompt**: by default just `"You are a helpful AI assistant."`. The actual prompt is composed from workspace settings; there is a commented-out AutoGen "TERMINATE when done" prompt in `aibitat/index.js`. Not the standout part of this project.
- **Admin / settings layout**: left sidebar with workspaces; a separate `/settings` shell with sub-routes (LLM, embeddings, vector DB, agent skills, security, customisation, system, experimental). Agent skills are configured under `Settings > Agent Skills` with a master list and per-skill sub-skill toggles (e.g. enable `create-files-agent` then disable individual extensions).
- **What's good and we lack**: (a) per-tool approval hook inside the runtime, not glued on; (b) `fileDownloadCard` event — a cleaner "here is the artefact" affordance than embedding the markdown in the chat; (c) the disabled-sub-skills pattern (`disabled_create_files_skills`) gives users granular control without N feature flags.

### 2.2 Open WebUI — `open-webui/open-webui`

Investigated source: `backend/open_webui/tools/builtin.py` (118 KB), `backend/open_webui/utils/tools.py`.

- **Article workflow**: `write_note(title, content, __request__, __user__)` is a built-in tool. It is a one-shot — no clarification, no diff preview. The note is created via `Notes.insert_new_note(user_id, NoteForm(...))` and is private by default. `replace_note_content(note_id, content)` is the edit twin; `view_note` and `search_notes` round out the CRUD. The model is encouraged to call them directly.
- **Tool model**: Python functions with type hints + docstrings → auto-converted to OpenAI function specs via `langchain_core.utils.function_calling.convert_to_openai_function`. Special-name params (`__user__`, `__request__`, `__event_emitter__`) are runtime-injected and stripped from the LLM-visible schema. This is the cleanest "BYO function" model of any project surveyed.
- **System prompt**: per-model and per-Tool. Each Tool can declare a system-prompt fragment that is prepended when the tool is enabled. There is no "ask before write" instruction by default — the prompt + the typed signatures are enough.
- **Admin / settings layout**: top-level `Workspace` tab (Models, Knowledge, Prompts, Tools, Functions) is for **content**; `Admin Panel` is a separate page for **users, groups, evaluations, pipelines, settings**. Critical lesson: content authoring lives where chats live; admin lives in a different shell. This maps directly to our pain point.
- **What's good and we lack**: (a) `write_note` / `replace_note_content` is a literal blueprint for our `kb_write`; (b) the auto-schema-from-typing pattern (we hand-write JSON schemas today); (c) Workspace vs. Admin separation; (d) `#` prefix in the composer to attach a file/URL/knowledge to a single message — a much lighter-weight RAG than ours.

### 2.3 Khoj — `khoj-ai/khoj`

Investigated source: `src/khoj/processor/conversation/prompts.py`, `src/khoj/processor/tools/{online_search.py, run_code.py, mcp.py}`.

- **Article workflow**: Khoj does not have a single "write_article" tool. Instead the "Researcher" agent (prompt `plan_function_execution`) produces a multi-step plan that uses "tool AIs" (semantic search, web search, page reader, code runner) and returns a synthesised answer. Saving to notes is delegated to the client (Obsidian / Emacs / web). The relevant lesson is in the **prompt**, not the tools.
- **Tool model**: each tool is itself an LLM sub-agent given a self-contained sub-prompt — they are not raw functions. This is heavier than function-calling but gives each tool its own latitude to plan.
- **System prompt** (the gem): the `plan_function_execution` prompt contains this clause verbatim — **"Do not ask the user to confirm or clarify assumptions for information gathering tasks and non-destructive actions, as you can always adjust later — decide what the most reasonable assumption is, proceed with it, and document it for the user's reference after you finish acting."** That is the exact prescription for our current problem. It also caps iterations (`max_iterations`) so the loop can't run away.
- **Admin / settings layout**: settings live under `/settings` with categories (Account, Agents, Automations, Subscription, Configure → Files / Plugins / Models). "Agents" is content (you create agents). "Automations" is user-owned cron jobs. Not as clean a split as Open WebUI.
- **What's good and we lack**: (a) the "decide and document" prompt phrase — copy it verbatim; (b) `max_iterations` as a guardrail; (c) Automations (scheduled prompts that produce articles unattended) — a tiny feature with high single-user value.

### 2.4 LibreChat — `danny-avila/LibreChat`

Investigated source: `api/server/services/Endpoints/agents/initialize.js`, README feature list. Docs site not reachable from this session.

- **Article workflow**: not opinionated. The Agents endpoint exposes any registered tool (MCP, structured, code interpreter, file search). Article generation comes from chaining `web_search` → `code_interpreter` (for artefacts) → manual export. The notable primitives are **Skills** and **Subagents**.
- **Tool model**: LangGraph-style. Each agent has a tool registry, an `AgentClient`, and a streaming/callback layer. MCP is the recommended way to add new tools — LibreChat is the heaviest MCP consumer on this list. Skills (`SKILL.md` bundles) can be `manual` / `automatic` / `always-on`.
- **System prompt**: built per-agent, generally short; the model is steered by the SKILL.md bundle attached to the agent.
- **Admin / settings layout**: standard SaaS-style: `Settings` modal (account, general, beta, data, balance, speech), `Agent Builder` panel for content. Multi-user auth is the dominant concern, which is why "admin" pages are so heavy — we should ignore that.
- **What's good and we lack**: (a) **`SKILL.md` bundles** — a flat-file way to ship reusable instructions (perfect for a single-user KB that grows over time); (b) **Subagents** — delegating "write the article" to a child agent with its own context window so the main chat doesn't get polluted with research dumps; (c) **Code Artifacts** in chat (React/HTML/Mermaid live preview). Docs were not directly reachable so this is from README.

### 2.5 LobeChat — `lobehub/lobe-chat`

Investigated source: `packages/builtin-tool-agent-documents/src/{manifest.ts, systemRole.ts, types.ts}`. Probably the most directly relevant project.

- **Article workflow**: the `builtin-tool-agent-documents` package exposes 9 APIs: `createDocument`, `readDocument`, `replaceDocumentContent`, `modifyNodes`, `removeDocument`, `renameDocument`, `copyDocument`, `listDocuments`, `updateLoadRule`. `createDocument(title, content, scope, hintIsSkill)` is the one-shot path. `modifyNodes` does node-level XML edits using stable IDs returned by `readDocument(format="xml")` — i.e. the model gets a tree with IDs, then sends `{action: "modify", litexml: "<p id='42'>…</p>"}` rather than rewriting the whole doc. `replaceDocumentContent` is reserved for "overwriting most or all of the document".
- **Tool model**: 30+ `builtin-tool-*` packages, each with `manifest.ts` (API schema + descriptions), `systemRole.ts` (per-tool system-prompt fragment), an `ExecutionRuntime`, an `Inspector` (UI for the tool-call args), and a `Render` (UI for the result). This is by far the most engineered tool architecture in the survey — overkill for us, but the **separation of manifest / executor / inspector / render is a great mental model**.
- **System prompt**: the `agent-documents` `systemRole.ts` is worth reading top to bottom. Key sections:
  - `<core_capabilities>` lists APIs and equates them to Unix verbs (`touch`, `cat`, `rm`, `mv`, `cp`) — gives the model a familiar mental model.
  - `<tool_selection_guidelines>` tells the model exactly when to use `modifyNodes` vs `replaceDocumentContent` vs `renameDocument`.
  - `<best_practices>` includes "prefer readDocument with format='xml' before modifyNodes/remove if content state is uncertain" and "use copyDocument before major edits when user may want a backup version".
- **Admin / settings layout**: left sidebar (chat list, sessions); top tabs for `Discover / Files / Settings`. Settings is multi-page: General / Common / System Agent / Provider / Plugin / TTS / Agent / About. Content (sessions, files, agents) is fully separate from settings.
- **What's good and we lack**: (a) the entire `agent-documents` tool family — copy the API surface, especially `modifyNodes` for surgical edits; (b) the Unix-verb framing in the system prompt; (c) the "Inspector" pattern — a per-tool UI for the call arguments and the result, instead of dumping JSON into the chat; (d) `hintIsSkill` flag so the model can mark a doc as "this is reusable procedural knowledge".

### 2.6 Cherry Studio — `CherryHQ/cherry-studio`

Investigated source: `src/renderer/src/services/NotesService.ts`. Docs not deeply explored.

- **Article workflow**: closest model to ours. Notes are `.md` files on disk under a user-chosen `notesPath`, organised as a tree (`NotesTreeService`). The AI writes via MCP — there is no built-in `write_article` tool, but `addNote(name, content, parentPath)` is the underlying call. The roadmap mentions "Notes and Collections", "Dynamic Canvas", "Document Preprocessing" — currently early.
- **Tool model**: MCP-first, with a built-in MCP server. 300+ assistant presets (essentially named system prompts) ship in-tree.
- **System prompt**: per-assistant; no universally clever prompt to copy.
- **Admin / settings layout**: it is an Electron desktop client, so `Settings` is one giant panel (Providers / General / Display / MCP Servers / WebSearch / Data / Shortcuts / About). Content lives in the main window.
- **What's good and we lack**: (a) `notesPath` as a user setting — they treat the folder as the source of truth, just like our `docs/knowledge/`; (b) tree on disk with no DB indirection; (c) shipping a fleet of preset assistants (cheap to add, high perceived value for a single user). Confirms our filesystem-as-KB direction.

---

## 3. What to borrow (prioritised by value / cost)

Ranked by `value_for_user / implementation_cost`. Effort: S = ½–1 day, M = 2–4 days, L = ≥1 week.

1. **(S) Add a "decide and document" clause to our system prompt.** Lift the wording from Khoj's `plan_function_execution`: "Do not ask the user to confirm or clarify assumptions for information gathering tasks and non-destructive actions — decide what is reasonable, proceed, and document your assumptions in the article." Fixes the user's #1 pain. *Best source: Khoj.*
2. **(S) Split `kb_write` into `create_article`, `replace_article`, `rename_article`, `delete_article` (and keep `propose_draft` as a separate gated tool).** Today the model has to pick a `mode` field which is noisy; named tools are clearer to the LLM and easier to permission. Matches Open WebUI's `write_note` / `replace_note_content` and LobeChat's API surface. *Best source: Open WebUI + LobeChat.*
3. **(S) Reframe tools with Unix-verb mental model in the prompt.** Tell the model that `create_article` is `touch`, `read_article` is `cat`, `replace_article` is full overwrite, etc. LobeChat shows this pays off — the model picks the right tool more often. *Best source: LobeChat `agent-documents/systemRole.ts`.*
4. **(M) Add an `edit_article_section(article_id, anchor, new_markdown)` tool that does anchor-targeted patching.** Lighter than LobeChat's full LiteXML/`modifyNodes`, but solves the same problem: the model can fix a section without rewriting the whole file. Anchors can be markdown headings or HTML comment IDs. *Best source: LobeChat `modifyNodes` (simplified).*
5. **(M) Move per-tool approval into the tool runtime, not the prompt.** Right now `propose_draft` is a separate tool. Borrow AnythingLLM's pattern: every write-tool optionally calls `requestToolApproval(...)` based on a per-tool flag in user settings. Then `ai:auto_apply` becomes a UI toggle per tool, not a global one. *Best source: AnythingLLM.*
6. **(M) Auto-generate tool JSON schemas from TypeScript types.** Today we hand-write schemas in `kb_write`. Open WebUI's pattern (type hints → OpenAI function spec) avoids drift. Use `zod-to-json-schema` or `ts-json-schema-generator`. *Best source: Open WebUI.*
7. **(M) Restructure the admin shell into two top-level routes: `/workspace` (content: KB, articles, prompts, tools) and `/admin` (users, roles, audit, MCP, system).** Open WebUI's split is the cleanest. Today everything is tabs under one viewMode. *Best source: Open WebUI.*
8. **(M) Add `cite_source(url|article_id, anchor)` so generated articles get inline footnotes automatically.** Khoj enforces this in its persona prompt with `[1](url)` markdown citations. Cheap to mandate, big quality lift. *Best source: Khoj.*
9. **(M) Ship a small library of "preset agents" (system-prompt + tool subset).** "Blog post writer", "Notes summariser", "Linkdump curator". Cherry Studio's 300 presets are gimmicky, but 5–6 well-tuned ones materially improve single-shot quality. *Best source: Cherry Studio.*
10. **(L) Add a subagent for "long article research".** When the user says "write an in-depth article on X", spawn a child agent with its own context window, let it run `web_search` / `web_fetch` / `search_kb` for N rounds, then return only the final draft + citations to the main chat. Stops research dumps from polluting history. *Best source: LibreChat Subagents.*

---

## 4. What NOT to borrow

1. **Multi-tenant workspaces (AnythingLLM, LibreChat, Open WebUI groups/RBAC).** We are a single-user app; even our current users-and-roles screen is over-built for the requirement. Don't take this further.
2. **MCP marketplace / plugin store (LobeChat, AnythingLLM).** We have 7 tools; we know what each one does. A plugin browser is solving a problem we don't have.
3. **Vector DB requirement (AnythingLLM, Open WebUI's 9 backends, LobeChat).** Keyword search already covers a single-user, single-language KB of ≤10k articles. Adding pgvector/Qdrant now is a multi-week distraction. Revisit only when keyword precision is the bottleneck.
4. **LobeChat-style per-tool Inspector + Render UI infrastructure.** Beautiful, but it is ~30 React packages. Our current SSE tool-chain visualisation is sufficient; we can iterate it without forking that architecture.
5. **OAuth / LDAP / SCIM / SSO (LibreChat, Open WebUI Enterprise).** A single-user blog doesn't need identity federation. Keep our existing auth.

---

## 5. Recommendations on the user's specific pain points

### 5.1 "I have to repeat myself to get a complete article"

Root cause, in order of likelihood:

1. **System prompt is too cautious.** Open WebUI's `write_note` works one-shot because the prompt doesn't tell the model to clarify. Khoj's prompt explicitly forbids clarification on non-destructive tasks. Today we likely steer toward `propose_draft`, which encourages a confirm loop. Concrete fix: add a section to the system prompt:
   > When the user asks for a complete article and `ai:auto_apply` is on, you MUST produce the full article in this turn. Decide reasonable defaults for length (≥800 words unless told otherwise), structure (intro / 3–5 sections / conclusion), and tone. Document any non-obvious assumption in a final `## 备注` section. Do not ask the user to confirm scope, length, or style up front.
2. **`propose_draft` is the path of least resistance.** Because it is gated and `kb_write` is risky, the model defaults to the safe one. Fix by item 5 in the borrow list — make approval per-tool, then let `create_article` go direct under `ai:auto_apply=on`, and reserve `propose_draft` for explicit "preview this" requests.
3. **Tool-call budget is too small.** If the model only gets 1 round, it can't `web_search` + `read_article` + `create_article` in one turn. Khoj uses `max_iterations` (default ~10). Confirm our SSE driver allows ≥6 tool rounds per user turn; if not, raise it.
4. **No "write a long doc" macro.** Borrow item 9 (preset agents). A `/agent blog-writer` slash command can pre-load the right prompt + tool subset.

### 5.2 Content vs. admin page architecture

Comparing the three serious contenders:

| | Open WebUI | LobeChat | AnythingLLM |
|---|---|---|---|
| Content shell | `/workspace` with sub-tabs (Models, Knowledge, Prompts, Tools, Functions) | Left rail (chats / sessions) + `Files` + `Discover` top tabs | Left rail (workspaces) only |
| Admin shell | `/admin` separate route (Users, Groups, Evals, Pipelines, Settings) | `Settings` page with sub-pages | `/settings` sub-route tree |
| User config | `Settings` modal opened from avatar | Settings page | Same `/settings`, different sub-route |

Recommendation: **mirror Open WebUI**.

- Add a `/workspace` route group with sub-routes: `/workspace/articles`, `/workspace/prompts`, `/workspace/tools`, `/workspace/mcp` (when we add it). This is where the user creates and curates content.
- Keep `/admin` (or rename current admin view) for: `users`, `roles`, `audit`, `system` (model settings, API keys, env). Add `audit` and `mcp` here as new tabs.
- Move per-user preferences (theme, default model, `ai:auto_apply`) to a `Settings` modal opened from the avatar — *not* under `/admin`. Today these are mixed and that is part of the confusion.
- Routing recipe: `App.vue` decides `<router-view>` shell based on path prefix; the current single-viewMode-with-tabs becomes two shells with their own sidebars.

Net effect: a writer never has to enter the admin shell to write, and an admin never sees content tabs while configuring the system. This is the smallest change with the largest perceived cleanup.

---

## 6. Open questions / things this survey didn't answer

- LibreChat's `SKILL.md` format — I have the README claim but couldn't reach the docs site. If we want to copy this, do a follow-up fetch of `docs.librechat.ai/docs/features/skills`.
- Open WebUI's `Pipelines` plugin framework — potentially relevant for our `web_ingest` flow, but out of scope here.
- None of these projects has a clearly better answer than ours for **single-user permission UX**. Our 3-permission model (`ai:auto_apply`, `ai:web_search`, etc.) is actually simpler than any of them and worth keeping.

---

## 7. References

- AnythingLLM: <https://github.com/Mintplex-Labs/anything-llm>, plugin tree under `server/utils/agents/aibitat/plugins/`
- Open WebUI: <https://github.com/open-webui/open-webui>, `backend/open_webui/tools/builtin.py`
- Khoj: <https://github.com/khoj-ai/khoj>, `src/khoj/processor/conversation/prompts.py`
- LibreChat: <https://github.com/danny-avila/LibreChat>, `api/server/services/Endpoints/agents/initialize.js`
- LobeChat: <https://github.com/lobehub/lobe-chat>, `packages/builtin-tool-agent-documents/`
- Cherry Studio: <https://github.com/CherryHQ/cherry-studio>, `src/renderer/src/services/NotesService.ts`
