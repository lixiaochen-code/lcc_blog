# AI Driven Knowledge Hub Technical Document

## 1. Document Positioning

This document is the implementation-oriented technical baseline for the AI driven knowledge hub project.

It consolidates the product goals from `PRD.md` and the OpenSpec decomposition guidance from `Spec.md` into a single engineering reference used for:

- architecture decisions
- module boundaries
- data and API design
- delivery sequencing
- OpenSpec implementation planning
- AI agent collaboration rules

This project should be treated as an AI driven knowledge platform, not as a traditional blog with a few AI features added on top.

## 2. Product Goal and Scope

### 2.1 Product Definition

The system is a knowledge-base blog and documentation platform that supports:

- public and internal content browsing
- structured taxonomy and sidebar navigation
- keyword search and AI-assisted retrieval
- AI-assisted content drafting and rewriting
- controlled external knowledge sync via MCP
- approval, audit, version snapshot, and rollback
- RBAC, provider management, and MCP governance

### 2.2 MVP Boundaries

The first implementation phases should prioritize controlled, observable, and maintainable capabilities:

- documentation site and admin shell
- document CRUD and publishing lifecycle
- taxonomy and navigation management
- authentication and RBAC
- keyword search
- read-only AI search with citations
- AI content draft and rewrite through change sets
- approval, rollback, and audit infrastructure

The following are explicitly out of first-version scope:

- zero-approval autonomous publishing
- multi-tenant SaaS capabilities
- complex workflow engine
- heavy media asset management
- enterprise-grade full search platform replacement
- private model training platform

## 3. Core Principles

The implementation must follow these principles:

- standardize before automating
- control before autonomy
- AI can suggest and execute within constraints, but the system owns policy and audit
- all write behavior must be reviewable, traceable, and reversible
- frontend visibility is not security; server-side authorization is the source of truth
- tool integration must be schema-first and permission-first
- OpenSpec remains the long-term source of truth for changes and domain requirements

## 4. User Roles and Permission Model

### 4.1 Roles

- `guest`: can read public content only, cannot use AI
- `user`: can log in, read allowed content, use read-only AI capabilities
- `admin`: can manage content, taxonomy, and AI writing tasks within content scope
- `super_admin`: can manage users, roles, providers, MCP servers, and high-risk operations

### 4.2 Permission Strategy

Authorization must be implemented with permission codes, not role checks alone.

Key permission groups:

- document: `doc.read`, `doc.search`, `doc.create`, `doc.update`, `doc.delete`, `doc.publish`, `doc.archive`, `doc.rollback`
- taxonomy: `category.read`, `category.manage`, `tag.read`, `tag.manage`, `sidebar.read`, `sidebar.update`
- AI: `ai.search`, `ai.ask`, `ai.summarize`, `ai.write`, `ai.organize`, `ai.delete`, `ai.sync`
- system: `user.manage`, `role.manage`, `provider.manage`, `mcp.manage`, `audit.read`, `system.manage`

### 4.3 AI Authorization Layers

- read-only AI: retrieval, QA, summarize, related content recommendation
- write AI: draft generation, rewrite suggestion, metadata enrichment, taxonomy suggestion
- high-risk AI: delete, bulk changes, publish, rollback, provider update, MCP credential update

High-risk AI operations must require at least one of:

- elevated role
- approval workflow
- explicit confirmation
- audit logging

## 5. Functional Domains

The system is split into the following implementation domains.

### 5.1 Authentication and Authorization

Responsibilities:

- user authentication and session management
- user status validation
- RBAC permission aggregation
- API-level and tool-level authorization

Primary implementation stack:

- Auth.js
- DAL-based authorization helpers
- server-side permission middleware

### 5.2 Content Management

Responsibilities:

- document CRUD
- content status transition
- version snapshot creation
- publish and archive flow
- rollback support

Core rule:

- published content must never be directly overwritten by AI write flows without generating a reviewable change set or version record

### 5.3 Taxonomy and Navigation

Responsibilities:

- category hierarchy
- tag system
- sidebar tree and ordering
- content-to-navigation mapping

Important decision:

- sidebar tree and categories are related but decoupled concepts

### 5.4 Search and Retrieval

Responsibilities:

- keyword search across title, summary, and content
- permission-aware search filtering
- excerpt generation
- retrieval interface reusable by AI search

Planned stages:

- Phase 1: MySQL FULLTEXT
- Phase 2: content chunks
- Phase 3: embeddings and hybrid retrieval

### 5.5 AI Search

Responsibilities:

- AI search, ask, summarize modes
- source citation assembly
- provider invocation for read-only AI flows
- query logging and audit

Constraints:

- `guest` cannot access AI search
- responses must include citations
- knowledge context should prioritize local content over remote sources

### 5.6 AI Content Operations

Responsibilities:

- AI draft creation
- AI rewrite suggestion
- AI tag and taxonomy suggestion
- change set generation for review
- task orchestration and status tracking

Constraints:

- all AI write operations must be tracked as tasks
- rewrite of published content must generate a change set
- direct publish is not allowed in normal AI write flow

### 5.7 Approvals and Rollback

Responsibilities:

- change set persistence
- before/after/diff generation
- approval queue and decisions
- rollback execution and audit

Important state model:

- `pending`
- `approved`
- `rejected`
- `applied`
- `rolled_back`

### 5.8 Provider Management

Responsibilities:

- provider registry
- model capability metadata
- default provider and model mapping
- task-type-based model selection
- encrypted secret management

Constraints:

- only `super_admin` can manage providers
- sensitive fields must be encrypted at rest and masked on read APIs

### 5.9 MCP Gateway and Remote Sync

Responsibilities:

- MCP server registry
- server/tool access control
- risk-based execution policy
- remote content fetch and normalization
- sync task logging

Constraints:

- all MCP access must go through the gateway
- external auth must remain separated from app sessions
- remote sync should produce draft or suggestion output by default

### 5.10 Audit and Observability

Responsibilities:

- audit logs for all critical operations
- task and tool execution logs
- structured logging
- failure monitoring and tracing

Must-cover events:

- sign-in and sign-out
- user status changes
- role changes
- provider changes
- MCP changes
- AI write tasks
- tool executions
- approvals
- rollback
- destructive actions

## 6. Target Architecture

### 6.1 Logical Architecture

```text
Browser / Admin / Super Admin
            |
      Next.js Web App
            |
 Admin UI + App Router APIs + DAL + Auth
            |
    Agent Orchestrator Service
      |- Planner
      |- Retriever
      |- Tool Router
      |- Writer
      |- Reviewer
      |- Executor
      |- Scheduler
            |
   Local Tool SDK + MCP Gateway
            |
    MySQL + Redis + Object Storage
```

### 6.2 Layering

#### Frontend Layer

Owns:

- content presentation
- admin flows
- search interactions
- AI search interactions
- task and approval views

Does not own:

- authorization truth
- long-running AI execution
- direct MCP access

#### API and DAL Layer

Owns:

- request validation
- session handling
- authorization enforcement
- data access orchestration
- async task submission

#### Agent Service Layer

Owns:

- task planning
- context assembly
- provider execution
- tool routing
- writeback to task logs and change sets

#### Tool Layer

Owns:

- tool schema definition
- permission declaration
- risk declaration
- timeout and retry policy
- call logging

#### Data Layer

Owns:

- transactional persistence
- audit and version history
- permission data
- provider and MCP config data

## 7. Recommended Technology Stack

### 7.1 Web and UI

- Next.js App Router
- Nextra
- MDX
- Tailwind CSS
- shadcn/ui

### 7.2 Auth and Validation

- Auth.js
- Zod
- custom DAL authorization utilities

### 7.3 Data and Queue

- MySQL 8+
- Prisma ORM
- Redis
- BullMQ

### 7.4 Agent and Integration

- Node.js
- TypeScript strict mode
- local Tool SDK
- MCP client and gateway abstraction

### 7.5 Observability

- Sentry
- OpenTelemetry
- structured JSON logs

### 7.6 Infrastructure

- pnpm monorepo
- Docker Compose for development
- containerized deployment for production

## 8. Monorepo Structure

Recommended structure:

```text
apps/
  web/
    app/
    components/
    lib/
    styles/
  agent/
    src/
      core/
      planner/
      retriever/
      tool-router/
      writer/
      reviewer/
      executor/
      jobs/
      providers/
      mcp/
      db/
packages/
  db/
  shared/
  tool-sdk/
  content-schema/
  ui/
infra/
  docker/
  mysql/
  redis/
openspec/
  specs/
  changes/
```

### 8.1 Responsibility Split

- `apps/web`: site frontend, admin console, API routes
- `apps/agent`: task workers and orchestration runtime
- `packages/db`: Prisma schema, migrations, data helpers
- `packages/shared`: types, constants, permission codes, DTOs, schemas
- `packages/tool-sdk`: tool contracts, authorization hooks, execution wrappers
- `packages/content-schema`: document schema and content-related validation
- `packages/ui`: reusable UI primitives shared by frontend surfaces

## 9. Data Model Blueprint

The current logical model from `PRD.md` should be converted into Prisma schema incrementally.

### 9.1 Identity and Access

- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`

### 9.2 Content and Taxonomy

- `documents`
- `document_versions`
- `categories`
- `tags`
- `document_categories`
- `document_tags`
- `sidebars`
- `sidebar_items`

### 9.3 AI Operations and Governance

- `change_sets`
- `agent_tasks`
- `task_steps`
- `tool_execution_logs`
- `audit_logs`

### 9.4 Provider and MCP

- `provider_configs`
- `mcp_servers`
- `mcp_server_permissions`

### 9.5 Planned Extensions

- `content_chunks` for Phase 2 retrieval
- `document_embeddings` for Phase 3 semantic search
- `remote_sources` and `sync_jobs` for remote sync workflow

### 9.6 Key Persistence Rules

- every important published-content update should produce a version snapshot
- AI write outputs should be linked to task metadata and provider metadata
- all sensitive credentials must be stored encrypted
- change sets should preserve `before_json`, `after_json`, and readable diff output

## 10. API Design Baseline

### 10.1 Public and Auth APIs

- `/api/auth/*`
- `/api/search`
- `/api/ai/search`

### 10.2 Content and Taxonomy APIs

- `/api/documents`
- `/api/documents/:id`
- `/api/categories`
- `/api/tags`
- `/api/sidebar`

### 10.3 AI and Workflow APIs

- `/api/ai/tasks`
- `/api/ai/tasks/:id`
- `/api/ai/sync`
- `/api/approvals`
- `/api/versions`

### 10.4 System Administration APIs

- `/api/users`
- `/api/roles`
- `/api/providers`
- `/api/mcp`
- `/api/audit`

### 10.5 API Conventions

- validate all input with schema definitions
- enforce permission checks before DAL access
- return masked values for sensitive configurations
- return task IDs for long-running operations
- preserve audit context such as user, request ID, provider, tool, and task references

## 11. Agent Orchestration Design

### 11.1 Core Modules

- `Planner`: parse intent and build execution plan
- `Retriever`: gather local knowledge context
- `Tool Router`: decide whether tools are needed and limit tool usage
- `Writer`: generate answer, summary, draft, or suggestion
- `Reviewer`: validate quality, format, and policy conformance
- `Executor`: persist task outputs, change sets, and logs
- `Scheduler`: run periodic sync and governance jobs

### 11.2 Local Tool Contract

Every tool definition should declare:

- name
- description
- input schema
- output schema
- permission requirement
- approval policy
- risk level
- timeout
- retry policy

### 11.3 First Tool Set

Document tools:

- `list_documents`
- `get_document`
- `create_document`
- `update_document`
- `delete_document`
- `publish_document`
- `rollback_document`

Search tools:

- `search_documents`
- `get_document_chunks`
- `find_similar_documents`
- `find_stale_documents`
- `find_broken_links`

Taxonomy tools:

- `get_sidebar_tree`
- `move_document_to_category`
- `reorder_sidebar_items`
- `suggest_taxonomy`

Change tools:

- `create_change_set`
- `get_change_set`
- `approve_change_set`
- `reject_change_set`

### 11.4 Unified AI Authorization Hook

The project should implement a single policy entry point:

```ts
authorizeAIAction(user, task, tool, resource)
```

Expected output:

- `allow`
- `deny`
- `reason`
- `needApproval`
- `maskedInput`
- `maxToolCalls`

## 12. Provider Abstraction

Business modules must not depend directly on one provider SDK.

### 12.1 Required Interface

- `generateText()`
- `streamText()`
- `embedText()`
- `supportsToolCalling()`
- `supportsStreaming()`
- `supportsVision()`
- `supportsReasoning()`

### 12.2 Model Routing Strategy

- search and ask: fast, low-cost models
- summarize and classify: mid-tier models
- content writing and rewrite: stronger text models
- taxonomy and governance decisions: stronger reasoning models

### 12.3 Configuration Strategy

Provider configuration should support:

- default provider
- default model
- task-type model override
- role-based model restriction
- provider enable and disable
- future quota and rate limit extension

## 13. Content Lifecycle

### 13.1 Status Model

- `draft`
- `review`
- `published`
- `archived`

### 13.2 Main Flows

Manual authoring:

```text
create -> draft -> review -> published
```

AI-generated new document:

```text
ai draft -> review -> approved -> published
```

Published document update:

```text
published -> change set -> review -> applied -> published(new version)
```

Deletion flow:

```text
published -> delete request -> approval -> archived or deleted
```

### 13.3 Source Traceability

Documents should preserve origin metadata when possible:

- `human`
- `ai`
- `import`
- `sync`
- external reference metadata

## 14. Search Strategy

### 14.1 Phase 1

- MySQL FULLTEXT over title, summary, content
- excerpt-based result response
- relevance sorting and pagination

### 14.2 Phase 2

- split documents into chunks
- retrieve chunks instead of full documents for AI context
- reduce token usage and improve answer quality

### 14.3 Phase 3

- embedding generation
- semantic recall
- hybrid retrieval with keyword plus semantic search

### 14.4 Retrieval Rules

- prefer local knowledge base as source of truth
- return citations whenever AI answers are shown
- annotate remote source and fetch time
- design for hallucination reduction rather than broad speculation

## 15. Security, Risk, and Compliance

### 15.1 Security Requirements

- all protected operations require server-side authz
- AI cannot bypass permissions by direct tool execution
- provider and MCP credentials must be encrypted
- external authorization must be isolated from app sessions

### 15.2 Risk Levels

- low: read-only, no side effects
- medium: draft creation, metadata changes
- high: delete, publish, rollback, provider change, MCP config change

### 15.3 Approval Defaults

Auto-allow:

- AI retrieval
- AI QA
- AI summarize
- read-only remote fetch

Admin-direct:

- draft creation
- small rewrite suggestion draft
- tag suggestion
- taxonomy suggestion

Approval-required:

- publish
- delete
- rollback
- batch move or merge
- provider changes
- MCP config changes

## 16. Observability and Operations

### 16.1 Structured Logging Fields

- `request_id`
- `task_id`
- `user_id`
- `tool_name`
- `provider_name`
- `mcp_server_name`
- `duration_ms`
- `result_status`

### 16.2 Tracing Scope

Critical trace chain:

```text
user request -> API -> agent -> tool -> MCP -> DB/change set
```

### 16.3 Minimum Alerts

- repeated task failures
- failed high-risk operations
- provider outage
- MCP server outage
- search instability

## 17. OpenSpec Implementation Strategy

### 17.1 Recommended Domain Specs

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

### 17.2 Recommended Change Workflow

Each meaningful feature change should follow:

1. `proposal.md`
2. `design.md`
3. `tasks.md`
4. delta spec update
5. implementation
6. verify
7. archive

### 17.3 Good Change Granularity

Suitable unit:

- one complete admin module
- one complete domain capability
- one clear end-to-end workflow

Avoid:

- implementing the whole platform in one change
- vague, boundary-less tasks

## 18. Delivery Roadmap

### 18.1 Phase 0 Foundation

Deliver:

- monorepo setup
- shared TS, lint, formatter, CI baseline
- MySQL and Redis local infra
- Next.js and agent service skeleton
- OpenSpec initialization

### 18.2 Phase 1 Docs MVP

Deliver:

- frontend docs site shell
- document detail pages
- categories, tags, sidebar basics
- document CRUD and publish flow
- FULLTEXT search foundation

### 18.3 Phase 2 Auth and RBAC

Deliver:

- Auth.js login flow
- users, roles, permissions
- permission middleware and admin visibility controls
- audit baseline

### 18.4 Phase 3 AI Search

Deliver:

- provider registry v1
- AI search API and page
- citation-aware answer flow
- AI query logging

### 18.5 Phase 4 AI Content Ops

Deliver:

- AI task center
- AI draft and rewrite flow
- change sets, diff, approvals, version history

### 18.6 Phase 5 MCP and Sync

Deliver:

- MCP gateway
- MCP management UI
- fetch and filesystem integration
- remote sync task flows

### 18.7 Phase 6 Knowledge Governance

Deliver:

- duplicate detection
- stale content detection
- broken link checks
- taxonomy optimization suggestions
- health dashboard

### 18.8 Phase 7 Semi-Automated Operations

Deliver:

- scheduled jobs
- webhook triggers
- policy-driven auto-draft behavior
- alerting and cost controls

## 19. Immediate Engineering Priorities

Based on `Spec.md`, the recommended first change sequence is:

1. `change-001-foundation-monorepo`
2. `change-002-web-docs-shell`
3. `change-003-content-crud`
4. `change-004-taxonomy-sidebar`
5. `change-005-auth-rbac`
6. `change-006-search-fulltext`
7. `change-007-ai-search`
8. `change-008-change-sets-approvals`
9. `change-009-ai-content-drafts`
10. `change-010-provider-management`
11. `change-011-mcp-gateway`
12. `change-012-remote-sync`

Dependency notes:

- `change-007` depends on `change-006`
- `change-009` depends on `change-008`
- `change-012` depends on `change-011`
- provider management should land before advanced AI writing and sync workflows become widespread

## 20. Implementation Output Expectations

For each future implementation round, engineering output should explicitly state:

1. current goal
2. affected modules
3. data model changes
4. API changes
5. page changes
6. risk and compatibility notes
7. implementation result
8. test coverage or test recommendations

## 21. Final Recommendation

The correct implementation direction is:

```text
Next.js + Nextra + MySQL + Prisma + Auth.js + Agent Service + MCP Gateway + OpenSpec
```

The project should be built as a governed AI knowledge platform with strong content controls, clear module boundaries, and long-term OpenSpec-driven evolution.
