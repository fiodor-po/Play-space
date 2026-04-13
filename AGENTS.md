# play-space-alpha — agent guide

## Project identity

This repo is `play-space-alpha`.

Product frame:

- lightweight board-first multiplayer play space;
- not a heavy VTT;
- drag-and-drop-first;
- simple session entry;
- multiplayer readability matters more than feature breadth.

Core principle:

- prefer practical product progress over architecture theatre;
- prefer narrow, safe, high-signal changes over broad rewrites;
- prefer read-only analysis before implementation when semantics, architecture, or deployment shape are unclear.

## Fast start

For a fresh narrow implementation thread:

1. read `ROADMAP.md`
2. read `AGENTS.md`
3. read `play-space-alpha_current-context.md`
4. open the focused doc for the touched area via `docs/README.md`

For non-trivial or semantics-changing work, also read:

- `PLANS.md`
- `play-space-project-foundation.md`

Core commands:

- install: `npm install`
- preferred local dev: `npm run dev:local`
- LAN HTTPS dev: `npm run dev:lan`
- default validation: `npm run build`
- additional checks: `npm run typecheck`, `npm run build:smoke`, `npm run lint`

Fast orientation docs:

- `docs/EXECUTOR_QUICKSTART.md`
- `docs/ARCHITECTURE.md`
- `docs/README.md`

## Current project stage

The project is no longer just an early board foundation.

Current alpha-core reality:

- shared board objects, presence, and room switching work;
- durable room snapshot recovery exists as a best-effort room-level layer;
- participant/color semantics reached a coherent checkpoint;
- canonical zero-state and board-content-vs-viewport separation are established;
- narrow LiveKit integration is technically validated;
- authoritative shared 3D dice are accepted as part of alpha core;
- first hosted alpha core deploy is up;
- basic hosted validation of the core flow has passed;
- hosted video now works as an optional alpha layer on top of the hosted core stack;
- the project is now past first hosted core deployment and into continued hosted validation work.

Current preferred sequence:

1. keep the hosted core + hosted video checkpoint stable and honest;
2. continue hosted playable-session validation in the real hosted stack;
3. capture real rough edges before broad cleanup or polish;
4. only then move into slower UI/UX polish afterwards.

## Current validation truth

Current checked baseline as of 2026-04-13:

- `npm run typecheck` passes
- `npm run build` passes
- `npm run lint` is currently red with pre-existing failures in:
  - `src/App.tsx`
  - `src/components/BoardStage.tsx`
  - `src/lib/roomSession.ts`
  - `src/ui/system/debug.tsx`

Working rule:

- still run the relevant validation commands after meaningful work;
- if a command fails for pre-existing reasons, report that explicitly;
- do not silently treat pre-existing failures as introduced by the current task;
- do not opportunistically expand a narrow task just to clean unrelated validation debt unless asked.

## Deployment-debugging discipline

Before debugging live deploy behavior, first confirm:

- the relevant code is committed;
- the relevant commit is pushed;
- the deployed environment is actually built from that commit;
- the deployed artifact matches the code you think you are debugging.

This is now a project workflow rule, not just an incidental lesson.

## Canonical docs to read first

Before non-trivial work, read:

- `ROADMAP.md`
- `AGENTS.md`
- `PLANS.md`
- `play-space-project-foundation.md`
- `play-space-alpha_current-context.md`

Then read only the directly relevant focused docs, for example:

- `docs/color-model-design.md`
- `docs/indication-design.md`
- `docs/room-behavior-spec.md`
- `docs/room-memory-model.md`
- `docs/dev-workflows.md`
- `docs/manual-qa-runbook.md`
- `docs/dice-spike-design.md`
- `docs/hosted-alpha-deployment-plan.md`

Historical baseline docs:

- `docs/refactor-audit.md`
- `docs/refactor-plan.md`

Treat those as historical architecture baseline, not as unquestioned current truth.

## Quick repo map

Top-level working areas:

- `src/` — frontend app
- `src/components/BoardStage.tsx` — main board interaction/rendering integration surface
- `src/board/` — board-domain modules, object modules, sync helpers
- `src/dice/` — shared dice layer
- `src/media/` — optional LiveKit media layer
- `src/ui/` and `src/ui/system/` — interface/system/debug surfaces
- `scripts/yjs-dev-server.mjs` — long-running realtime/API backend
- `api/livekit/token.ts` — narrow hosted LiveKit token fallback
- `data/` — mutable room snapshot / room identity runtime data
- `docs/` — design docs, runbooks, audits, templates, and task briefs

Use `docs/ARCHITECTURE.md` for a compact runtime overview before reading deeper focused docs.

## Product guardrails

Do not evolve this project into:

- a heavy VTT;
- a rules engine;
- a permissions-heavy admin system;
- a feature-bloated media platform.

Default preference order:

1. preserve board-first session feel;
2. preserve simplicity;
3. preserve multiplayer readability;
4. preserve implementation safety;
5. only then pursue polish or extra capability.

When several options are possible, prefer:

- the narrowest change that improves the real playable-session product;
- the path that keeps AI-assisted iteration manageable;
- the path that does not create hidden infrastructure complexity.

## Indication default

When a change adds or modifies an important multiplayer, remote-state, occupied-state, or interaction-preview indication:

1. read `docs/indication-design.md` first;
2. classify the indication into an existing indication family if possible;
3. reuse the canonical indication source rather than inventing a local variant in the implementation file;
4. if a genuinely new variant is required, record that distinction in `docs/indication-design.md`.

Do not rely on "roughly matches the existing look" as sufficient.
For indication work, reuse of the canonical source is the default rule.

## Architecture guardrails

Important current realities:

- `BoardStage` remains a sensitive integration surface;
- empty-space pan/zoom behavior is fragile and must not change casually;
- image drag/resize/draw/preview flows are fragile;
- room switch/reset/bootstrap/recovery paths are sensitive;
- realtime, persistence, video, and dice integrations must not be casually rewritten together.

Default rules:

- do not broad-rewrite `BoardStage`;
- do not combine refactor + feature work in one pass;
- do not change event ordering unless explicitly required;
- do not redesign transport contracts unless the task explicitly calls for it.

If architecture is unclear:

1. inspect current behavior;
2. describe the actual mechanism;
3. identify risks and mixed concerns;
4. propose a narrow target model;
5. only then implement.

## No-go zones

Unless a task explicitly requires it, do not:

- broad-rewrite `src/components/BoardStage.tsx`;
- change empty-space panning semantics;
- change current image drag / resize / draw / preview behavior;
- change room bootstrap / recovery semantics casually;
- combine product-scope changes with large architecture cleanup;
- introduce heavy-VTT scene/entity architecture.

## Environment and secret handling reminders

- treat local env files as machine-local configuration, not stable project truth;
- do not print secret values in reports, screenshots, or debug notes;
- prefer env examples and docs over copying machine-specific values into code or prose;
- when diagnosing runtime config, report which variables or endpoints matter without exposing secret contents.

Current documented env/workflow sources:

- `docs/dev-workflows.md`
- `docs/livekit-local-dev.md`
- `docs/hosted-alpha-deployment-plan.md`

Default policy:

- tracked `*.example` env files are canonical;
- machine-local `.env.localdev`, `.env.landev`, `.env.hosted`, and root `.env` files should stay untracked.

## Mutable runtime data reminders

The local backend now defaults its mutable runtime JSON files to ignored repo-local paths under `.runtime-data/`, while hosted/container setups may override those paths explicitly.

- `.runtime-data/room-snapshots.json`
- `.runtime-data/room-identities.json`

Treat these as operational state, not normal feature code.

Rules:

- do not treat ordinary runtime churn in those files as product behavior changes by itself;
- do not hide when your validation changed runtime data;
- do not bundle runtime-data noise into unrelated code changes if it can be avoided.

## Working model: strategist and executor

This project may be developed using two complementary AI chats.

### A. Strategist chat

Purpose:

- product thinking;
- architecture framing;
- task decomposition;
- read-only analysis;
- risk assessment;
- prompt writing for implementation;
- review of Codex output;
- deciding whether docs/current-context/case-study should be updated.

The strategist chat should usually:

- not perform broad code edits directly;
- separate semantics questions from implementation questions;
- produce clean implementation briefs for the executor chat;
- keep scope small and explicit.

### B. Executor chat

Purpose:

- make narrow code changes;
- run builds/tests;
- inspect files;
- perform targeted debugging;
- return concise implementation reports.

The executor chat should:

- follow the task brief closely;
- avoid opportunistic rewrites;
- avoid mixing unrelated cleanup into one pass;
- report changed files, validation steps, risks, and any deviations.

## Strategist / executor handoff format

### Strategist -> Executor handoff

When the strategist thread sends work to the executor thread, use this structure:

- Task
- Goal
- Constraints
- Relevant context
- Files to inspect first
- Deliverables
- Validation
- Stop conditions

Rules:

- prefer narrow implementation-ready briefs;
- do not send broad or ambiguous execution prompts;
- keep scope explicit;
- state what must not change.

### Executor -> Strategist report

When the executor thread finishes a pass, return this structure:

- Summary
- Files changed
- What changed
- Validation
- Risks / notes
- Suggested next step

Rules:

- keep the report concise and factual;
- do not hide scope expansion;
- do not hide skipped validation;
- clearly distinguish completed work from follow-up work.

Canonical templates:

- `docs/task-brief-template.md`
- `docs/executor-report-template.md`

## When to use analysis-first vs implementation-first

Use analysis-first when the task involves:

- interaction model changes;
- product semantics;
- architecture uncertainty;
- persistence / recovery logic;
- source-of-truth questions;
- deployment topology;
- integration-path decisions;
- refactor decisions;
- ambiguous bug root cause.

Implementation-first is acceptable when:

- the desired behavior is already clear;
- the scope is narrow;
- the risk surface is known;
- the change does not require redefining semantics.

## Standard task brief for the executor chat

Every non-trivial implementation task should preferably include:

### Task
What to change.

### Goal
What product/technical outcome is required.

### Constraints
What must not change.

### Relevant context
Why this task exists now.

### Files to inspect first
Specific files/modules to read before editing.

### Deliverables
What the executor must return.

### Validation
Build/test/manual QA requirements.

### Stop conditions
When to stop instead of pushing through.

## Standard executor output

The executor chat should return:

### Summary
Short statement of what was done.

### Files changed
List of modified files.

### What changed
Concrete behavior/code changes.

### Validation
Build/test/manual checks run.

### Risks / notes
Anything fragile, incomplete, or worth follow-up.

### Suggested next step
A narrow next step, only if obvious.

## Architecture-specific rule

When asked for architecture audit or refactor planning:

- start read-only;
- classify state as:
  - persisted/shared room state
  - shared realtime state
  - local transient UI state
  - local interaction state
  - awareness-only ephemeral state
- identify where these concerns are mixed;
- produce a phased plan before touching production code;
- implement only one safe phase at a time.

For major refactors or multi-step reorganizations, use an ExecPlan that follows `PLANS.md`.

## Deployment-readiness mindset

Before hosted-alpha work:

- prefer explicit runtime boundaries;
- identify local-dev-only assumptions;
- keep frontend / realtime-backend / integrations conceptually separate;
- do not overbuild production infrastructure;
- optimize for first hosted alpha, not final platform maturity.

The default hosted-alpha shape to reason about is:

- frontend separately hosted;
- long-running Node service for realtime/API separately hosted;
- LiveKit separate if video remains enabled.

## Validation default

After any meaningful implementation pass:

- run `npm run build`;
- explain what behavior might have regressed;
- list manual QA steps for the touched flow;
- if the change touches board/runtime behavior, use `docs/manual-qa-runbook.md` and `docs/stabilization-checklist.md` as the baseline.

For docs-only or guidance-only passes, say which commands were intentionally not run if you skipped them.

## Inspectability default

When an important change is mostly architectural, runtime-level, semantic, or otherwise not reliably verifiable through ordinary visible UI behavior:

- add a minimal inspectability mechanism when practical;
- prefer existing lightweight dev surfaces such as Dev tools, inspect panels, or current debug affordances;
- do not treat successful builds and “nothing looks broken” as the main validation story by themselves.

Scope this narrowly:

- this rule applies to invisible/systemic changes, not every visible UI tweak;
- it does not require heavy tooling or a new debug surface for every pass;
- the goal is a small practical verification path, not a broad observability system.

## Canonical semantic / planning sources

## Which doc to read for which task

### Fast doc routing

- onboarding / repo entry: `README.md`, `docs/README.md`, `docs/EXECUTOR_QUICKSTART.md`
- architecture overview: `docs/ARCHITECTURE.md`
- roadmap / current priorities: `ROADMAP.md`
- current operational context: `play-space-alpha_current-context.md`
- larger multi-step work planning: `PLANS.md`
- stable product frame: `play-space-project-foundation.md`
- room lifecycle / recovery: `docs/room-behavior-spec.md`, `docs/room-memory-model.md`
- color / participant semantics: `docs/color-model-design.md`
- indication / multiplayer cues: `docs/indication-design.md`
- local startup and ops: `docs/dev-workflows.md`
- LiveKit specifics: `docs/livekit-local-dev.md`
- hosted deploy/runtime assumptions: `docs/hosted-alpha-deployment-plan.md`
- manual regression checks: `docs/manual-qa-runbook.md`, `docs/stabilization-checklist.md`
- task brief / executor report format: `docs/task-brief-template.md`, `docs/executor-report-template.md`

### Color
`docs/color-model-design.md`

### Room lifecycle and memory
- `docs/room-behavior-spec.md`
- `docs/room-memory-model.md`

### Dev/runtime workflows
- `docs/dev-workflows.md`
- `docs/livekit-local-dev.md`
- `docs/lan-https-trust.md`

### Dice layer
`docs/dice-spike-design.md`

### Hosted alpha deployment
`docs/hosted-alpha-deployment-plan.md`

Do not silently change semantic behavior or deployment assumptions in code unless the relevant design/planning doc is also aligned or explicitly superseded.

## Documentation discipline

After any meaningful step, decide whether to update:

- `ROADMAP.md`
- `play-space-alpha_current-context.md`
- `play-space-alpha_case-study-log.md`

Rules:

- `play-space-project-foundation.md` changes rarely;
- `ROADMAP.md` is the live development plan and priority map;
- `play-space-alpha_current-context.md` is short and operational;
- `play-space-alpha_case-study-log.md` stores decisions, milestones, bugs, and workflow lessons;
- do not lose major reasoning between chats.

If a step changes priorities, closes a roadmap item, changes the intended sequence of work, or changes product/deployment direction, update `ROADMAP.md` in the same change set when appropriate.
