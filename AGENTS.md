# AGENTS.md

This file is the contract any AI agent (Claude Code, Cursor, Codex, etc.)
must read before touching this repository. It supersedes ad-hoc instructions
in commits or chat — when the two disagree, this file wins.

It follows the [agents.md](https://agents.md) convention.

---

## 1. What this project is

**LCC Knowledge Base** — a single-user personal knowledge base.

- Markdown files live under `docs/knowledge/`. They **are** the source of
  truth; the database is incidental.
- `apps/kb-web` (Vue 3 + Vite) is the reading / editing UI.
- `apps/kb-server` (Node 18+, no framework — just `node:http`) serves the
  REST + SSE API and reads/writes Markdown directly on disk.
- `apps/kb-server/data/dev-store.json` is a JSON store for non-content state
  (users, roles, conversations, audit logs, MCP config).
- There is **one** product surface here. No multi-tenant, no public posting,
  no comment system. Don't propose features that imply otherwise.

---

## 2. Layout

```
apps/
  kb-server/
    src/
      server.js       # http server + routing (no framework)
      ai.js           # AI pipeline: tool-calling loop, draft contract
      markdown.js     # filesystem CRUD for .md (path-traversal safe)
      mcp.js          # web search (DuckDuckGo + Bing fallback, MCP-aware)
      auth.js         # password hash, JWT issue/verify
      store.js        # JSON store for non-content state
      config.js       # .env.kb loader
    data/dev-store.json
  kb-web/
    src/
      App.vue         # single-file UI (workspace + AI side panel)
      api.ts          # typed fetch wrapper for /api
      markdown.ts     # tiny Markdown renderer (no deps)
      styles.css      # Linear-inspired dark design tokens + components
docs/
  knowledge/          # the actual knowledge base
  kb-architecture.md  # short architecture note
  mysql/              # eventual schema (currently unused)
```

---

## 3. Commands

| Task                      | Command              |
| ------------------------- | -------------------- |
| Start API server          | `pnpm kb:server`     |
| Start web dev server      | `pnpm kb:web`        |
| Production build (web)    | `pnpm kb:build`      |
| Type-check                | `pnpm type-check`    |
| Lint + auto-fix           | `pnpm lint`          |
| Format                    | `pnpm format`        |

Default API port: `4010`. Default web port: Vite's default (5173).
Web proxies `/api` to `:4010` via `vite.config.ts`.

Default superadmin: `superadmin / Admin@123456`.

Environment is loaded from `.env.kb` at repo root (see `.env.kb.example`).
The agent must never commit a real `.env.kb`.

---

## 4. Conventions

### File / module style

- ES modules only (`"type": "module"`). No CommonJS, no `require`.
- Server source uses plain `.js`. The web app uses TypeScript.
- Prettier + ESLint already configured — let them format. Do not hand-tune
  whitespace, semicolons, quote style.
- Functions: small, single-purpose, named. Prefer named exports.
- No dead exports, no "just in case" abstractions.
- Don't add comments that paraphrase the code. Reserve comments for
  *non-obvious* invariants, hidden constraints, or workarounds.

### Path safety

Every filesystem operation against the knowledge base must go through
`resolveDocPath` / `assertSafePath` in `markdown.js`. Never `join` a
user-supplied path directly — path traversal is the one bug we'll always
treat as P0.

### Auth / permissions

Routes use `requireAuth` / `requirePermission` from `server.js`. Permissions
are strings (`kb:view`, `kb:update`, `ai:use`, `ai:write_kb`, etc.) stored
on roles in `dev-store.json`. New endpoints must declare a permission;
"superadmin only" is not a valid answer — name the permission.

### Errors

- Throw `Error` objects with an optional `.status` numeric field. The
  top-level handler in `server.js` maps that to the HTTP status. Don't
  invent custom error classes.
- Validate at the boundary (request handler). Trust internal calls.
- Never swallow an error silently — at minimum log it, and prefer letting
  it propagate to the boundary.

### Commits

- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).
  enforced by commitlint.
- Subject ≤ 72 chars, imperative mood, no trailing period.
- One logical change per commit. Bundling KB content edits with code
  refactors makes review impossible.

---

## 5. The AI pipeline

This is the part the project has historically struggled with — read it
carefully.

### Architecture (current)

`apps/kb-server/src/ai.js` implements a **research-then-respond** loop:

1. Build a message stack: system prompt + KB directory listing +
   current-article body + compacted history + the user turn.
2. **Research loop** (non-streaming, up to `MAX_TOOL_ROUNDS = 4`): the
   model can call `search_kb`, `read_article`, and (if the user opted in)
   `web_search`. Each tool call result is fed back as a `tool` role message.
3. **Final answer** (streaming): once the model stops requesting tools,
   stream the final assistant turn to the client via SSE.
4. **Draft extraction**: the assistant text may contain a structured
   `[DRAFT op="..." path="..."]` marker followed by a fenced block. The
   server parses it and returns a `draft` object in the `done` event. The
   client only writes to disk after the user confirms.

### Hard rules for any change to `ai.js`

- **Do not** add regex pre-classification of user intent based on Chinese
  keywords. That's what the rewrite removed. Intent comes from the model
  via the draft contract.
- **Do not** stream tool-call decisions. Streaming + tool-use across
  OpenAI-compatible providers is brittle. Run the tool loop non-streamed,
  then stream the final reply.
- Keep `MAX_TOOL_ROUNDS` ≤ 5. If a request truly needs more, the system
  prompt or tool design is wrong.
- Truncate every tool result before feeding it back (`truncate`,
  `truncateToolResult`). Long documents will blow the context window.
- The **draft contract** is the contract — don't change `[DRAFT op="…"]`
  marker syntax without also updating both the system prompt and the web
  client's `DRAFT_MARKER_RE`.
- When adding a new tool, register it in `buildTools` *and* dispatch it in
  `dispatchTool`. Both. No silent fallthrough.

### When there's no API key

`config.openai.apiKey` may be empty (dev / first-run). In that case we
return a deterministic "local fallback" reply that suggests related
articles via `searchKb`. Don't crash, don't hang. Don't fake a model reply.

---

## 6. The knowledge base itself

`docs/knowledge/` is content, not code.

- Filenames: ASCII / pinyin slugs, lowercase, `-` separated, `.md` extension.
  No spaces, no Chinese in filenames except when the user explicitly asks.
- One `# Title` per file, on the first non-empty line.
- Folder roots are categories (`ai/`, `backend/`, `frontend/`, `data/`,
  `devops/`, `projects/`, `security/`). Add a new root only if the user
  asks. Don't restructure unprompted.
- `docs/knowledge/index.md` is the landing page; keep it in sync when major
  topics are added.
- Treat content edits as the user's authored work. Don't reword prose
  unless asked. Code/config blocks can be corrected for obvious errors.

The AI assistant **never writes to disk directly**. It always emits a draft;
the user confirms in the UI; only then does the server call `writeArticle`.

---

## 7. Frontend conventions

- Single-file Vue 3 SFC (`App.vue`) for now. Don't introduce a router,
  Pinia, or component library unless the page count justifies it.
- Tokens live in `styles.css` as CSS custom properties on `:root`. Use
  them; don't hardcode hex.
- The design language is Linear (dark canvas `#010102`, lavender accent
  `#5e6ad2`, surface ladder, hairline borders, Inter Display headings).
  See `styles.css` for the full token list. Stay in palette.
- `renderMarkdown` (`markdown.ts`) is intentionally small. If you need GFM
  tables / footnotes / etc., add a real library — don't grow the hand-roll.
- Don't import emoji icons. Use the existing pseudo-element bullets / dots
  in `styles.css` for status.

---

## 8. Testing

There are no automated tests yet. Until that changes:

- Manually verify changes against the dev superadmin login.
- If you change `ai.js` or `markdown.js`, exercise: list tree → read
  article → AI chat (with and without web search) → propose a draft →
  apply it → confirm file written → delete it.
- Type-check (`pnpm type-check`) and lint (`pnpm lint`) must pass before
  the agent declares a task done. The build (`pnpm kb:build`) must succeed.

---

## 9. Things the agent must not do

- Don't rename `superadmin` or change the default password format without
  an explicit user instruction.
- Don't write a real `.env.kb`, `.env`, or any file containing API keys.
  `.env.kb.example` is the only env file the agent commits.
- Don't push, force-push, rebase main, or delete branches autonomously.
- Don't migrate the JSON store to a database "while you're in there" — that
  is a separate, scoped task.
- Don't `rm -rf` anything inside `docs/knowledge/`. If a file is wrong,
  ask. The user's notes are not disposable.
- Don't introduce a CSS-in-JS or component library to replace the current
  hand-tuned CSS. The Linear-inspired stylesheet is intentional.
- Don't add telemetry, analytics, or "anonymous usage reporting".

---

## 10. When in doubt

Ask. This is a personal tool with strong opinions; guessing is more
expensive than a one-line clarification.
