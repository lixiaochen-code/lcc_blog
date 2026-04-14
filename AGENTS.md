# Project Agents Guide

## 1. Purpose

This file defines how coding agents should work in this repository.

The repository goal is to build an AI driven knowledge hub with:

- Next.js + Nextra frontend and admin console
- MySQL + Prisma data layer
- Auth.js + RBAC authorization
- Node.js agent service for orchestration
- MCP gateway for controlled external access
- OpenSpec as the long-term specification source

Agents must optimize for correctness, maintainability, and safe incremental delivery.

## 2. Source of Truth

Agents should use the following priority order when making decisions:

1. active user request
2. `PRD.md`
3. `Spec.md`
4. `TECHNICAL.md`
5. existing code and repository conventions

If two sources conflict, prefer the higher-priority source and document the tradeoff in the response.

## 3. Product Framing

Do not treat this repository as a normal blog.

Treat it as:

- a documentation site
- a knowledge base
- an AI-assisted content operations platform
- a governed system with approval, audit, and rollback

Any implementation that weakens authorization, traceability, or rollback safety is wrong even if it appears faster.

## 4. Delivery Strategy

Agents should implement in small vertical slices that match OpenSpec change boundaries.

Preferred implementation order:

1. foundation monorepo
2. web docs shell
3. content CRUD
4. taxonomy and sidebar
5. auth and RBAC
6. search fulltext
7. AI search
8. change sets and approvals
9. AI content drafts
10. provider management
11. MCP gateway
12. remote sync

Do not jump to advanced AI writing or MCP sync before the repository has:

- stable content models
- permission enforcement
- change set infrastructure
- audit logging baseline

## 5. Architecture Rules

### 5.1 Layer Boundaries

Respect these boundaries:

- `apps/web` owns UI, route handlers, and web-specific composition
- `apps/agent` owns task orchestration and async execution
- `packages/db` owns Prisma schema and database access primitives
- `packages/shared` owns shared types, constants, and schemas
- `packages/tool-sdk` owns tool contracts and execution wrappers

Do not leak provider SDK logic into route handlers or UI code.

Do not let frontend code become the real authorization layer.

Do not let the agent service bypass DAL or policy enforcement for writes.

### 5.2 Authorization Rules

All protected operations must be enforced server-side.

Minimum expectations:

- page visibility can be role-aware
- API routes must validate session and permission
- tool calls must run through centralized AI authorization
- MCP access must run through a gateway with whitelist and risk checks

### 5.3 Content Safety Rules

For published content:

- do not directly overwrite published content from AI write flows
- generate a change set or draft first
- preserve version snapshots for important content changes
- record approval and rollback actions in audit logs

## 6. OpenSpec Rules

OpenSpec is the long-term planning and change-management system for this project.

Agents should align implementation to these domains when relevant:

- `auth`
- `content`
- `taxonomy`
- `search`
- `ai-search`
- `ai-content-ops`
- `approvals`
- `providers`
- `mcp-gateway`
- `audit`
- `admin-console`
- `agent-orchestration`

When implementing a feature that clearly matches an existing or planned change, structure work around:

1. proposal intent
2. design decisions
3. task list
4. implementation
5. verification

If the repo does not yet contain the OpenSpec files, preserve naming and module boundaries so those artifacts can be added without reshaping the code.

## 7. Coding Guidelines

### 7.1 General

- prefer minimal correct changes
- keep module boundaries explicit
- use TypeScript strict-friendly patterns
- avoid hidden coupling across apps and packages
- add comments only when the logic is not obvious

### 7.2 Schemas and Contracts

- define input and output schemas for APIs and tools
- prefer shared schema definitions when contracts cross package boundaries
- avoid ad hoc object shapes for task payloads and tool results

### 7.3 Error Handling

- return explicit, actionable errors
- distinguish auth failure, validation failure, not found, and policy denial
- preserve audit context for high-risk failures

### 7.4 Database and State Changes

- favor additive schema evolution
- keep migration scope aligned with the current change
- do not introduce unused tables or speculative schema unless the change needs them

## 8. AI and Tooling Rules

### 8.1 Provider Abstraction

Do not bind business logic directly to one LLM SDK.

Use a provider abstraction that can support at minimum:

- text generation
- streaming
- embeddings
- capability checks

### 8.2 Tool Contract Requirements

Each local or gateway tool should declare:

- name
- description
- input schema
- output schema
- permission requirement
- approval policy
- risk level
- timeout
- retry policy

### 8.3 AI Authorization Hook

Prefer a unified policy function such as:

```ts
authorizeAIAction(user, task, tool, resource)
```

Expected decision fields:

- allow or deny
- reason
- needApproval
- maskedInput
- maxToolCalls

### 8.4 MCP Rules

- all MCP access must go through the gateway
- do not allow direct model or agent access to arbitrary MCP endpoints
- preserve per-call logging for allowed and denied execution attempts
- high-risk MCP tools should be super-admin-only unless requirements explicitly say otherwise

## 9. Testing Expectations

When implementing a non-trivial feature, prefer tests around:

- permission enforcement
- status transitions
- published-content write safety
- provider and MCP config masking
- search behavior and visibility filtering
- AI citation presence
- approval and rollback behavior

If full automated tests are not possible in the current step, call out the missing coverage clearly.

## 10. Observability Expectations

Critical flows should preserve structured logging context where possible:

- request ID
- task ID
- user ID
- provider name
- tool name
- MCP server name
- result status
- duration

High-risk operations must be auditable.

Minimum auditable categories:

- login/logout
- role changes
- provider updates
- MCP updates
- AI write tasks
- approvals
- rollback
- delete actions

## 11. Frontend Expectations

For web and admin UI work:

- preserve the distinction between public docs and protected admin flows
- keep permission-aware states explicit
- include loading, empty, error, and unauthorized states where needed
- design admin pages around workflow clarity, not cosmetic complexity

For docs and search experiences:

- optimize for readability and information scent
- make navigation, taxonomy, and citations easy to understand

## 12. What Agents Should Avoid

Agents should not:

- implement direct AI publish flows before approvals exist
- hide authorization only in UI checks
- hardcode provider credentials or MCP endpoints in feature code
- collapse domain logic into route handlers
- add broad speculative abstractions without immediate need
- weaken auditability for convenience

## 13. Expected Implementation Summary Format

When finishing a meaningful coding task, agents should summarize with:

1. goal
2. affected modules
3. data model changes
4. API changes
5. UI changes
6. risks or follow-ups
7. verification status

## 14. Immediate Next Outputs

The most valuable next deliverables for this repository are:

1. `openspec/specs/*/spec.md` initial files
2. `change-001-foundation-monorepo` proposal, design, and tasks
3. Prisma schema draft
4. monorepo scaffold
5. Auth and RBAC skeleton
6. agent service skeleton
7. provider registry and MCP gateway interfaces
