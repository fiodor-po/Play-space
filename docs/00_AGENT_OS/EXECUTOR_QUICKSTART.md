# Executor Quickstart

Use this when you are starting a fresh implementation thread and need the smallest safe read-first set.

## 1. Read First

For a narrow coding task, start with:

1. `docs/01_CURRENT_STATE/ROADMAP.md`
2. `AGENTS.md`
3. `docs/00_AGENT_OS/CURRENT_CONTEXT.md`
4. the focused doc for the touched area

Also read these when the task is non-trivial or changes semantics:

- `docs/00_AGENT_OS/PLANS.md`
- `docs/03_PRODUCT/00_OVERVIEW/PRODUCT_FOUNDATION.md`

Use `docs/README.md` to find the focused doc quickly.

Common task-to-doc mapping:

- room lifecycle / recovery: `docs/03_PRODUCT/01_FLOWS/room-behavior-spec.md`, `docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-memory-model.md`
- color / participant semantics: `docs/03_PRODUCT/02_SEMANTICS/color-model-design.md`
- multiplayer indication / occupied-state cues: `docs/03_PRODUCT/02_SEMANTICS/indication-design.md`
- local startup / env / tooling: `docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/dev-workflows.md`
- video / LiveKit: `docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/livekit-local-dev.md`
- hosted deployment/runtime assumptions: `docs/05_OPERATIONS_AND_VALIDATION/02_DEPLOYMENT/hosted-alpha-deployment-plan.md`
- board/runtime regression checks: `docs/05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/playwright-smoke-harness.md`, `docs/05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/manual-qa-runbook.md`, `docs/05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/stabilization-checklist.md`

## 2. Commands

Install:

```bash
npm install
```

One-time browser install for local smoke:

```bash
npm run smoke:e2e:install
```

Preferred local dev:

```bash
npm run dev:local
```

LAN HTTPS dev:

```bash
npm run dev:lan
```

Manual component startup for debugging:

```bash
npm run dev
npm run presence-server
npm run livekit-server
```

Default validation:

```bash
npm run build
```

Additional checks:

```bash
npm run smoke:e2e
npm run smoke:e2e:headed
npm run test:e2e:runtime
npm run test:e2e:media
npm run test:e2e:design-system
npm run test:e2e:all
npm run build:smoke
npm run lint
```

## 3. Current Validation Truth

As of 2026-04-16:

- `npm run build` passes
- `npm run smoke:e2e` passes as the accepted local board/runtime smoke baseline
- `npm run lint` fails with pre-existing issues only in:
  - `src/components/BoardStage.tsx`
  - `tests/e2e/helpers/roomSmoke.ts`

Current lint debt is now narrow:

- `src/components/BoardStage.tsx` holds one remaining participant-marker
  `set-state-in-effect` finding plus several dependency warnings.
- `tests/e2e/helpers/roomSmoke.ts` still holds `@typescript-eslint/no-explicit-any`
  lint debt.

Low-risk hygiene lint issues in `src/lib/roomSession.ts`,
`src/ui/system/debug.tsx`, and `src/media/LiveKitMediaDock.tsx` have already
been cleaned up.

Do not present those as newly introduced by your change unless you actually touched and worsened them.

## 4. Sensitive Areas

Do not change these casually:

- `src/components/BoardStage.tsx`
- empty-space panning semantics
- wheel-zoom behavior
- image drag / resize / draw / preview flows
- room bootstrap / recovery / reset paths
- combined realtime + persistence + video + dice behavior in one pass

If the mechanism is unclear:

1. inspect current behavior first
2. describe the actual mechanism
3. identify risks
4. make the narrowest change that solves the task

## 5. Validation Expectations

After a meaningful implementation pass:

- run `npm run build`
- run `npm run smoke:e2e` for the short local demo gate
- add `npm run test:e2e:runtime` for room/runtime/recovery corridor changes
- add `npm run test:e2e:media` for media/audio-meter changes
- add `npm run test:e2e:design-system` for DOM state-delta sandbox changes
- state exactly what you validated
- say what you did not validate
- list manual QA steps for the touched flow

If the change touches board/runtime behavior, use:

- `docs/05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/playwright-smoke-harness.md`
- `docs/05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/manual-qa-runbook.md`
- `docs/05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/stabilization-checklist.md`

If the change is architectural or runtime-internal, prefer a small inspectability path over relying only on "UI still looks fine."

`npm run smoke:e2e` is the short machine gate for this phase.
It does not replace human product validation.
If the task changes replica-track recovery semantics, review the bridge-bound
smoke assertions in `docs/05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/playwright-smoke-harness.md` and
`docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-document-replica-track-plan.md` before assuming the current smoke
baseline should stay unchanged.

If a task depends on hosted access, connectors, auth, protected URLs, project
permissions, cloud logs, or similar prerequisites, check that access early. If
it is missing, report it immediately and stop the dependent part of the task.

## 6. Environment And Runtime Data

Remember:

- local env files are machine-local configuration, not evidence of product behavior
- never print secret values in reports
- runtime room data under `.runtime-data/` is mutable operational state, not normal feature code
- do not treat `.runtime-data/room-snapshots.json` or `.runtime-data/room-identities.json` diffs as user-authored product changes

## 7. Reporting Pre-Existing Failures

If you hit an issue that appears unrelated to your task:

1. note the exact command
2. record the failing file(s)
3. distinguish pre-existing failure from change-related failure
4. stop short of opportunistic cleanup unless the task explicitly includes it

Preferred executor report shape:

- Summary
- Files changed
- What changed
- Validation
- Risks / notes
- Suggested next step
