# play-space-alpha

`play-space-alpha` is a lightweight board-first multiplayer play space.

It is intentionally **not** a heavy VTT, rules engine, or permissions-heavy platform. The current alpha is built around a shared board, simple room entry, drag-and-drop interaction, multiplayer readability, best-effort room recovery, authoritative shared dice, and an optional LiveKit-based media layer.

## What Is In This Repo

Current major runtime pieces:

- frontend app: React + TypeScript + Vite + Konva in `src/`
- realtime/API server: Node/Yjs server in `scripts/yjs-dev-server.mjs`
- optional hosted LiveKit token route: `api/livekit/token.ts`
- ignored local runtime data written by the default backend path:
  - `.runtime-data/room-snapshots.json`
  - `.runtime-data/room-identities.json`

Helpful orientation docs:

- `AGENTS.md` — repo rules, guardrails, strategist/executor model
- `docs/00_AGENT_OS/DOC_SYSTEM_RULES.md` — how current/product/architecture/execution/archive docs are separated
- `docs/00_AGENT_OS/EXECUTOR_QUICKSTART.md` — fastest safe entry point for a narrow implementation thread
- `docs/04_ARCHITECTURE/00_OVERVIEW/ARCHITECTURE.md` — concise runtime overview
- `docs/README.md` — full docs index
- `docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/dev-workflows.md` — canonical local startup guide

Project control docs live in:

- `docs/01_CURRENT_STATE/ROADMAP.md`
- `docs/00_AGENT_OS/PLANS.md`
- `docs/03_PRODUCT/00_OVERVIEW/PRODUCT_FOUNDATION.md`
- `docs/00_AGENT_OS/CURRENT_CONTEXT.md`

Long-running decisions and project-history context live in:

- `docs/02_DECISIONS_LOG/CASE_STUDY_LOG.md`

## Install

The repo uses `npm`.

Install dependencies:

```bash
npm install
```

External tools used by documented workflows:

- Node.js LTS
- npm
- `livekit-server` for the standard local video-enabled dev flow
- `caddy` for LAN HTTPS development

See `docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/dev-workflows.md` for the canonical environment-file and tool expectations.

Create local env files from the tracked examples before running the wrapper workflows:

```bash
cp .env.localdev.example .env.localdev
cp .env.landev.example .env.landev
```

## Start Local Development

Preferred localhost workflow:

```bash
npm run dev:local
```

This starts the Vite frontend, the realtime/API presence server, and native LiveKit.

Preferred LAN HTTPS workflow:

```bash
npm run dev:lan
```

This adds the Caddy HTTPS proxy for multi-device secure-origin testing.

Manual component startup is also supported for debugging:

```bash
npm run dev
npm run presence-server
npm run livekit-server
```

Canonical startup and environment details:

- `docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/dev-workflows.md`
- `docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/livekit-local-dev.md`
- `docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/lan-https-trust.md`

## Validate Work

Default validation command:

```bash
npm run build
```

Standalone type-check:

```bash
npm run typecheck
```

Artifact smoke check:

```bash
npm run build:smoke
```

Lint:

```bash
npm run lint
```

Current validation truth as of 2026-04-16:

- `npm run typecheck` passes
- `npm run build` passes
- `npm run smoke:e2e` passes as the accepted local board/runtime smoke baseline
- `npm run lint` has pre-existing failures in:
  - `src/components/BoardStage.tsx`
  - `tests/e2e/helpers/roomSmoke.ts`

For manual regression checks, use:

- `docs/05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/playwright-smoke-harness.md`
- `docs/05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/manual-qa-runbook.md`
- `docs/05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/stabilization-checklist.md`

## Canonical Docs

Read these first before non-trivial work:

1. `docs/01_CURRENT_STATE/ROADMAP.md`
2. `AGENTS.md`
3. `docs/00_AGENT_OS/PLANS.md`
4. `docs/03_PRODUCT/00_OVERVIEW/PRODUCT_FOUNDATION.md`
5. `docs/00_AGENT_OS/CURRENT_CONTEXT.md`

Then open only the focused docs that match the task. The fastest index is `docs/README.md`.

## Sensitive Areas

These areas should not be changed casually:

- `src/components/BoardStage.tsx`
- empty-space pan/zoom behavior
- image drag/resize/draw/preview flows
- room switch/reset/bootstrap/recovery paths
- realtime, persistence, video, and dice integrations when combined in one pass

Default project bias:

- preserve board-first session feel
- prefer narrow, safe changes
- inspect current behavior before rewriting sensitive flows
- keep hosted-core assumptions honest

For operational detail, use `AGENTS.md` and `docs/00_AGENT_OS/EXECUTOR_QUICKSTART.md`.
