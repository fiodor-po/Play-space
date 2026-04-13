# Executor Quickstart

Use this when you are starting a fresh implementation thread and need the smallest safe read-first set.

## 1. Read First

For a narrow coding task, start with:

1. `ROADMAP.md`
2. `AGENTS.md`
3. `play-space-alpha_current-context.md`
4. the focused doc for the touched area

Also read these when the task is non-trivial or changes semantics:

- `PLANS.md`
- `play-space-project-foundation.md`

Use `docs/README.md` to find the focused doc quickly.

Common task-to-doc mapping:

- room lifecycle / recovery: `docs/room-behavior-spec.md`, `docs/room-memory-model.md`
- color / participant semantics: `docs/color-model-design.md`
- multiplayer indication / occupied-state cues: `docs/indication-design.md`
- local startup / env / tooling: `docs/dev-workflows.md`
- video / LiveKit: `docs/livekit-local-dev.md`
- hosted deployment/runtime assumptions: `docs/hosted-alpha-deployment-plan.md`
- board/runtime regression checks: `docs/manual-qa-runbook.md`, `docs/stabilization-checklist.md`

## 2. Commands

Install:

```bash
npm install
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
npm run build:smoke
npm run lint
```

## 3. Current Validation Truth

As of 2026-04-13:

- `npm run build` passes
- `npm run lint` fails with pre-existing issues in:
  - `src/App.tsx`
  - `src/components/BoardStage.tsx`

Current lint debt is narrower than before:

- `src/App.tsx` holds the remaining hook-order / set-state-in-effect /
  dependency findings.
- `src/components/BoardStage.tsx` holds the remaining image-drawing helper /
  ref-mutation / dependency findings.

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
- state exactly what you validated
- say what you did not validate
- list manual QA steps for the touched flow

If the change touches board/runtime behavior, use:

- `docs/manual-qa-runbook.md`
- `docs/stabilization-checklist.md`

If the change is architectural or runtime-internal, prefer a small inspectability path over relying only on "UI still looks fine."

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
