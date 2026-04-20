# Project Health Audit Report

Audit date: 2026-04-13

## 1. Executive summary
- Audit plan executed: read the repo’s canonical guidance first, inventoried structure and workflows, inspected docs/config/deploy artifacts, then ran only low-impact validations: `npm run lint` and `npm run smoke:artifact`.
- This is a single-repo TypeScript app with a Vite/React frontend, a custom Node/Yjs realtime/API server, optional LiveKit video, and lightweight hosted deployment artifacts.
- The repo has unusually strong durable agent context: `AGENTS.md`, `docs/01_CURRENT_STATE/ROADMAP.md`, `docs/00_AGENT_OS/PLANS.md`, `docs/00_AGENT_OS/CURRENT_CONTEXT.md`, and `docs/02_DECISIONS_LOG/CASE_STUDY_LOG.md` are a real strength.
- Human onboarding is much weaker than agent onboarding because `README.md` is still the default Vite template and does not describe the actual product, architecture, or startup path.
- Local workflows are present and reasonably explicit in `package.json` and `docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/dev-workflows.md`, including `dev:local`, `dev:lan`, `presence-server`, LiveKit, and hosted deployment notes.
- Validation hygiene is incomplete: there is `build`, `lint`, and an artifact smoke check, but no test suite, no typecheck script separate from build, and no visible CI workflow.
- `npm run lint` currently fails with 16 errors and 14 warnings, including conditional hooks in `src/App.tsx`, hook-effect issues, unused vars, and fast-refresh export issues.
- Existing built output passed `npm run smoke:artifact`, but that only proves the current `dist/` bundle contains expected runtime markers; it does not prove the artifact is fresh.
- Maintainability risk is concentrated in a few very large files: `src/components/BoardStage.tsx` is 3,716 lines, `src/App.tsx` is 1,296 lines, and `scripts/yjs-dev-server.mjs` is 1,183 lines.
- Structure is partly improving: `src/board/objects/token` and `src/board/objects/noteCard` exist, but a lot of behavior still appears concentrated in `BoardStage`, `App`, and the realtime server.
- Environment hygiene is the weakest area: tracked local env files exist, `.gitignore` does not ignore `.env*`, and repo-local data files are used as mutable persistence stores.
- The repo is highly agent-ready for strategy/executor workflows, but less ready for clean execution loops because validation is red, runtime data dirties the worktree, and top-level onboarding is misleading.
- The next highest-leverage fixes are not feature work: replace the README, clean up env/data hygiene, restore a green baseline for lint/typecheck, and make local/hosted operational expectations easier to verify.

## 2. Repository snapshot
- Probable project type: single-repo app with a frontend plus a custom long-running realtime/API service, plus optional hosted serverless token endpoint.
- Primary languages / frameworks: TypeScript, React 19, Vite 8, Konva/react-konva, Yjs/y-websocket, Node server scripts, optional LiveKit. Evidence: `package.json`.
- Package manager(s): npm with lockfile v3. Evidence: `package-lock.json`.
- Build / test / lint / typecheck entry points:
  - Build: `npm run build` and `npm run build:smoke`. Evidence: `package.json`.
  - Test: none found.
  - Lint: `npm run lint`. Evidence: `package.json`.
  - Typecheck: no dedicated script; bundled into `build` via `tsc -b`. Evidence: `package.json`.
  - Format: none found.
- Major apps / packages / services:
  - Frontend app under `src/`
  - Realtime/API server under `scripts/yjs-dev-server.mjs`
  - Vercel token function under `api/livekit/token.ts`
  - Hosted config via `Dockerfile.realtime-api` and `vercel.json`
- High-level architecture guess: board-first multiplayer app; React/Konva client; Yjs WebSocket presence/state server; durable room snapshot and identity JSON stores under `data/`; optional LiveKit media; Vercel-hosted frontend with optional token fallback.
- Audit confidence level: Medium-High

## 3. Current health scorecard
- Onboarding: 2/5 — strong deep docs, but the first thing a newcomer sees is a stale template README.
- Runability: 3/5 — dev workflows are documented and scripted, but require external tools (`livekit-server`, `caddy`) and env knowledge.
- Validation hygiene: 2/5 — lint/build/artifact smoke exist, but lint is red and there are no tests or formatter workflow.
- CI hygiene: 0/5 — no `.github/workflows` directory found; external CI is unknown / not verified.
- Documentation quality: 4/5 — extensive, thoughtful, and durable; weakened by doc sprawl and a stale README.
- Agent-readiness: 4/5 — one of the repo’s strongest areas due to explicit guardrails, handoff templates, roadmap/current-context cadence, and skill/config artifacts.
- Repo structure clarity: 3/5 — top-level purpose is understandable after reading docs, but code ownership is still concentrated in large integration files.
- Environment / secrets hygiene: 1/5 — tracked local env files and repo-local mutable data stores create avoidable operational risk.
- Dependency hygiene: 3/5 — lockfile exists and toolchain is coherent, but versions are not pinned via `.nvmrc` or equivalent and there is no CI validation.
- Maintainability: 2/5 — maintainable only with repo-specific tribal knowledge plus docs; large files and red lint raise ongoing change risk.

## 4. Evidence-based findings

### 4.1 Documentation and onboarding
- The repo’s true source of truth is the docs set, not the README. Evidence: `AGENTS.md` requires reading roadmap/plans/foundation/current-context first.
- The top-level README is stale and misleading. Evidence: `README.md` still describes a generic Vite React template.
- Onboarding for actual local startup is strong once you find the right doc. Evidence: `docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/dev-workflows.md` explicitly says it is the canonical entry point for local startup.
- The repo maintains durable project memory unusually well. Evidence: `docs/03_PRODUCT/00_OVERVIEW/PRODUCT_FOUNDATION.md`, `docs/01_CURRENT_STATE/ROADMAP.md`, `docs/00_AGENT_OS/CURRENT_CONTEXT.md`, `docs/02_DECISIONS_LOG/CASE_STUDY_LOG.md`.
- Documentation is rich but fragmented. Evidence: `git ls-files '*.md'` shows a large planning/design/doc surface, including many focused design docs and task briefs.

### 4.2 Commands, scripts, and local workflows
- Core scripts are centralized in npm scripts and shell wrappers. Evidence: `package.json`.
- Local dev has two clear scripted modes: localhost and LAN HTTPS. Evidence: `docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/dev-workflows.md`, `scripts/dev-local.sh`, `scripts/dev-lan.sh`.
- The LAN workflow is repo-contained and concrete. Evidence: `Caddyfile.lan` and `scripts/run-lan-proxy.sh`.
- Required prerequisites are documented but not surfaced at the repo entry point. Evidence: `docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/dev-workflows.md` lists Node, npm, `livekit-server`, and `caddy`.
- Install workflow is implicit rather than explicit. Evidence: no repo-specific install section was found in `README.md`; only runtime workflow docs were found.

### 4.3 Validation and CI
- Local validation entry points exist but are incomplete. Evidence: `package.json` includes `build`, `lint`, `smoke:artifact`, but no `test`, `typecheck`, or `format`.
- There is a useful repo-specific artifact validation step. Evidence: `scripts/check-built-artifact.mjs` verifies expected runtime markers in the built bundle.
- `npm run smoke:artifact` passed during this audit.
- `npm run lint` failed during this audit with 16 errors and 14 warnings. Key failures:
  - `src/App.tsx:134`, `:136` conditional hooks
  - multiple `react-hooks/set-state-in-effect` findings in `src/App.tsx`
  - unused vars in `src/lib/roomSession.ts:288` and `:367`
  - fast-refresh export issues in `src/ui/system/debug.tsx:16`, `:22`, `:36`
- No automated test suite was found. Evidence: `rg` for `vitest|jest|playwright|cypress|pytest|describe|it|test` found no actual test files.
- No visible CI config was found. Evidence: `find .github -maxdepth 3 -type f` returned no directory.

### 4.4 Environment and secrets handling
- Local env files are tracked in git. Evidence: `git ls-files` includes `.env.localdev` and `.env.landev`.
- `.gitignore` does not ignore `.env*`, only `*.local`. Evidence: `.gitignore`.
- Repo-local env files contain development credentials and machine-specific values. I am not reproducing them here, but evidence is in `.env.localdev` and `.env.landev`.
- Hosted env expectations are documented reasonably well. Evidence: `.env.hosted.example`.
- Runtime config has explicit fallback behavior and logging, which is good for operations. Evidence: `src/lib/runtimeConfig.ts`.
- Media is enabled by default if `VITE_ENABLE_LIVEKIT_MEDIA` is unset. Evidence: `src/lib/runtimeConfig.ts`. This is workable, but easy to misread operationally.
- Mutable persistence data lives inside the repo. Evidence: `scripts/yjs-dev-server.mjs` defaults to `data/room-snapshots.json` and `data/room-identities.json`; `git status --short` showed those files becoming dirty/untracked.
- The Docker realtime image also copies `data/` into the container and defaults snapshots there. Evidence: `Dockerfile.realtime-api`.

### 4.5 Repository structure and module boundaries
- Top-level layout is understandable: `src`, `api`, `scripts`, `docs`, `data`, and deployment files.
- Code organization has meaningful domain folders. Evidence: `src/board`, `src/dice`, `src/media`, `src/ops`, `src/lib`, `src/ui/system`.
- Object-specific extraction has started. Evidence: `src/board/objects/token/*` and `src/board/objects/noteCard/*`.
- The main risk is oversized integration surfaces:
  - `src/components/BoardStage.tsx` — 3,716 lines
  - `src/App.tsx` — 1,296 lines
  - `scripts/yjs-dev-server.mjs` — 1,183 lines
- The docs explicitly acknowledge these sensitivities. Evidence: `AGENTS.md` calls out `BoardStage` as a sensitive integration surface.

### 4.6 Agent guidance and durable context
- Agent guidance is a standout strength. Evidence: `AGENTS.md` includes product guardrails, no-go zones, validation defaults, doc update rules, and strategist/executor split.
- There are durable templates for handoff quality. Evidence: `docs/06_EXECUTION/03_TEMPLATES/task-brief-template.md` and `docs/06_EXECUTION/03_TEMPLATES/executor-report-template.md`.
- There is a repo-specific Codex agent config for architecture auditing. Evidence: `.codex/agents/board_refactor_auditor.toml`.
- There is at least one reusable skill aligned with repo needs. Evidence: `.agents/skills/board-architecture-audit/SKILL.md`.
- Missing piece: there is no concise “executor quickstart” doc for a fresh thread that only needs run/validate/edit rules without reading the full documentation stack.

### 4.7 Reusable workflows / likely skill candidates
- Architecture/read-only refactor audit is already skill-shaped and implemented. Evidence: `.agents/skills/board-architecture-audit/SKILL.md`.
- Repeated workflows that look skill-worthy:
  - hosted debug verification before blaming code
  - room lifecycle / snapshot / identity audit
  - manual QA smoke selection from the runbook
  - design-system batch task brief generation
  - runtime config / artifact smoke inspection
- Some workflows should remain plain repo guidance, not skills:
  - basic startup commands
  - basic “read these docs first”
  - generic safe-edit constraints already covered well in `AGENTS.md`

### 4.8 Main maintenance risks
- Misleading first impression: a newcomer will start from the wrong mental model because README does not match the product.
- Validation drift: lint is red, so “run lint before/after changes” is currently not a trustworthy gate.
- Runtime data drift: repo-local snapshot/identity files make the worktree dirty during normal operation.
- Secret/config drift: tracked local env files encourage accidental disclosure and make machine-local values look canonical.
- Integration hotspots: too much behavior remains concentrated in `BoardStage`, `App`, and the realtime server.
- Documentation sprawl: there is a lot of durable context, but it is easy for a new thread to over-read or miss the one operational doc that matters.

## 5. What is missing or weak
- A real project README with product overview, install/start commands, architecture snapshot, and links to canonical docs.
- A dedicated `typecheck` script.
- Any test suite or explicit statement that testing is currently manual-only.
- Any formatter command or formatting convention entry point.
- Visible CI automation.
- A clearer policy for env files and local secrets.
- A clear policy for mutable runtime data files so they do not pollute git status.
- A concise “executor quickstart” or “operator quickstart” doc.
- Directory-specific guidance for `src/components/BoardStage.tsx`, `scripts/`, or `src/lib/` choke points.
- A short architecture overview doc for humans; architecture exists across many design docs, but not as one compact map.
- Toolchain version pinning via `.nvmrc`, `.node-version`, or equivalent.
- Explicit release/deploy runbook steps for humans separate from strategy docs.

## 6. Priority recommendations

### P0 — highest leverage / should fix first
- Replace the top-level README.
  - Why it matters: the current README actively misleads humans and agents about what this repo is.
  - Expected impact: much faster onboarding, fewer wrong assumptions, less doc spelunking.
  - Implementation effort: Low
  - Exact files to create or improve: `README.md`
  - Suggested first step: replace the Vite template with a 1-page repo overview linking to `docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/dev-workflows.md`, `AGENTS.md`, `docs/01_CURRENT_STATE/ROADMAP.md`, and hosted/deploy docs.
- Fix env and secret hygiene.
  - Why it matters: tracked local env files are the biggest operational footgun in the repo.
  - Expected impact: lower leak risk, cleaner onboarding, less machine-specific drift.
  - Implementation effort: Medium
  - Exact files to create or improve: `.gitignore`, `.env.example`, new `.env.localdev.example`, new `.env.landev.example`, docs in `docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/dev-workflows.md`
  - Suggested first step: stop tracking machine-local env files and replace them with sanitized examples.
- Restore a green baseline for lint and add an explicit typecheck command.
  - Why it matters: execution threads need one reliable non-destructive validation gate.
  - Expected impact: safer edits, less ambiguity, better agent loops.
  - Implementation effort: Medium
  - Exact files to create or improve: `package.json`, `eslint.config.js`, affected source files such as `src/App.tsx`
  - Suggested first step: decide whether current lint rules are intended policy or need temporary narrowing; then get to one passing `lint` and one dedicated `typecheck`.
- Move mutable runtime data out of tracked repo state.
  - Why it matters: normal dev use dirties the repo and creates agent confusion.
  - Expected impact: cleaner git status, fewer accidental commits, easier debugging.
  - Implementation effort: Medium
  - Exact files to create or improve: `scripts/yjs-dev-server.mjs`, `.gitignore`, `docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/dev-workflows.md`
  - Suggested first step: default snapshot/identity stores to an ignored local runtime path outside tracked `data/`.

### P1 — important next improvements
- Add visible CI for lint and build-smoke.
  - Why it matters: current local hygiene does not scale or stay honest without automation.
  - Expected impact: reduces drift and catches breakage earlier.
  - Implementation effort: Medium
  - Exact files to create or improve: `.github/workflows/ci.yml`
  - Suggested first step: run `npm ci`, `npm run lint`, and `npm run build:smoke` in CI.
- Create a short architecture overview doc.
  - Why it matters: current architecture knowledge is distributed across many design docs.
  - Expected impact: faster orientation for humans and new agent threads.
  - Implementation effort: Low
  - Exact files to create or improve: `docs/PROJECT_OVERVIEW.md` or `docs/04_ARCHITECTURE/00_OVERVIEW/ARCHITECTURE.md`
  - Suggested first step: document frontend, realtime/API, LiveKit, persistence, and main sensitive files on one page.
- Add an executor quickstart.
  - Why it matters: `AGENTS.md` is strong but long; not every task needs the full strategic frame.
  - Expected impact: faster safe execution with less context overload.
  - Implementation effort: Low
  - Exact files to create or improve: `docs/00_AGENT_OS/EXECUTOR_QUICKSTART.md` or a new section in `AGENTS.md`
  - Suggested first step: list read-first files, startup commands, validation commands, no-go files, and doc-update expectations.
- Add a formatter story.
  - Why it matters: style consistency is currently implicit.
  - Expected impact: fewer noisy diffs and lower friction for automated edits.
  - Implementation effort: Low-Medium
  - Exact files to create or improve: `package.json`, formatter config file, `AGENTS.md`
  - Suggested first step: decide whether to adopt Prettier or explicitly remain formatter-free.

### P2 — nice-to-have improvements
- Pin Node/toolchain version.
  - Why it matters: reproducibility is weaker without a declared runtime baseline.
  - Expected impact: fewer local mismatch bugs.
  - Implementation effort: Low
  - Exact files to create or improve: `.nvmrc` or `.node-version`, `README.md`
  - Suggested first step: choose one supported Node LTS and document it.
- Add directory-specific agent notes for choke points.
  - Why it matters: `BoardStage`, `scripts/`, and ops/runtime code have repo-specific hazards.
  - Expected impact: fewer accidental broad changes.
  - Implementation effort: Low
  - Exact files to create or improve: `src/components/AGENTS.md`, `scripts/AGENTS.md`, or expanded sections in root `AGENTS.md`
  - Suggested first step: document “what not to touch casually” near the highest-risk directories.
- Reduce doc sprawl with a doc index.
  - Why it matters: there are many excellent docs, but discoverability is uneven.
  - Expected impact: lower search cost for both humans and agents.
  - Implementation effort: Low
  - Exact files to create or improve: `docs/README.md`
  - Suggested first step: group docs by product, runtime, architecture, validation, and historical baseline.

## 7. Suggested AGENTS.md improvements
- Add a short “Fast Start” section near the top with the exact commands a fresh executor thread should use:
  - install: `npm ci`
  - local dev: `npm run dev:local`
  - LAN dev: `npm run dev:lan`
  - validate: `npm run lint`, `npm run build:smoke`
- Add an explicit “Current validation truth” section that states whether lint is currently expected to pass and what to do when baseline red issues already exist.
- Add an “Environment hygiene” rule:
  - never commit machine-local env files
  - use example env files only
  - do not print secret values in reports
- Add a “Mutable runtime data” rule:
  - snapshot/identity stores are operational data, not source files
  - do not treat dirty `data/*.json` as normal code edits
- Add a “Quick repo map” section:
  - `src/components/BoardStage.tsx` = sensitive integration surface
  - `src/App.tsx` = room/session shell
  - `scripts/yjs-dev-server.mjs` = realtime/API plus ops surface
  - `api/livekit/token.ts` = hosted token fallback
- Add a “Doc update triggers” checklist:
  - update `docs/01_CURRENT_STATE/ROADMAP.md` for priority/phase changes
  - update current-context for operational state changes
  - update case-study log for lessons, milestones, and workflow decisions
- Add directory-specific notes if possible for `src/components`, `scripts`, and `src/lib`.
- Add one short rule about not assuming `dist/` is fresh unless `build` or `build:smoke` was run in the current pass.

## 8. Suggested durable docs for long-running work
- `docs/PROJECT_OVERVIEW.md`
  - Role: one-page human/agent orientation to product, runtime shape, and current top-level module map.
- `docs/04_ARCHITECTURE/00_OVERVIEW/ARCHITECTURE.md`
  - Role: concise current-state architecture map across frontend, realtime/API, persistence, media, and ops.
- `docs/00_AGENT_OS/EXECUTOR_QUICKSTART.md`
  - Role: minimal run/validate/safe-edit guide for a fresh implementation thread.
- `docs/OPERATIONS_RUNBOOK.md`
  - Role: practical local/hosted operations checklist, including room ops, snapshot stores, and deploy-debug order.
- `docs/DECISIONS.md`
  - Role: a compact index of durable architectural/product decisions, separate from the narrative case-study log.
- `docs/README.md`
  - Role: index the existing docs set by category and indicate which docs are canonical versus historical.
- `docs/STATUS.md`
  - Role: very short current operational state, active focus, and known red validations; lighter-weight than the full current-context doc.

## 9. Suggested skill candidates
- `repo-health-audit`
  - When it should be used: periodic read-only repo hygiene reviews.
  - Inputs it needs: repo root, desired scope, whether validations are allowed.
  - Expected output: structured health report with findings, risks, and recommendations.
  - Why this should be a skill: repeatable multi-artifact audit process with stable output shape.
- `hosted-debug-preflight`
  - When it should be used: before investigating hosted behavior regressions.
  - Inputs it needs: suspected area, current branch/commit, deploy target, relevant docs.
  - Expected output: checklist confirming commit/push/deploy/artifact alignment and likely next checks.
  - Why this should be a skill: the repo already treats this as a workflow rule, not a one-off reminder.
- `room-lifecycle-audit`
  - When it should be used: any change touching room bootstrap, snapshot recovery, creator truth, or rejoin behavior.
  - Inputs it needs: touched files, target behavior, room docs.
  - Expected output: state-category map, risk list, required manual QA, stop conditions.
  - Why this should be a skill: the state model is subtle and easy for agents to mis-handle.
- `manual-qa-selector`
  - When it should be used: after a narrow runtime/UI change.
  - Inputs it needs: changed areas and risk surface.
  - Expected output: smallest relevant subset of checks from the manual QA runbook and stabilization checklist.
  - Why this should be a skill: it can turn large runbooks into targeted validation without guesswork.
- `design-system-task-brief-writer`
  - When it should be used: preparing narrow executor work for design-system or UI cleanup slices.
  - Inputs it needs: target UI slice, constraints, relevant docs.
  - Expected output: a filled task brief matching repo conventions.
  - Why this should be a skill: the repo already uses repeated task-brief patterns for this work.
- `runtime-config-smoke`
  - When it should be used: validating build/runtime config paths and artifact markers.
  - Inputs it needs: frontend artifact, env mode, relevant config files.
  - Expected output: config-source summary, fallback assumptions, artifact smoke results, open risks.
  - Why this should be a skill: it is operationally specific and already partially encoded in repo scripts/docs.

## 10. Unknowns and verification gaps
- Whether any external CI exists outside this repository: unknown / not verified.
- Whether `dist/` was produced from the current source state: unknown / not verified.
- Whether `npm run build` currently passes: not verified because it would write files.
- Whether hosted deployment instructions are fully current in all places: partially evidenced, not fully verified.
- Whether all docs beyond the sampled set are current: unknown / not verified.
- Whether local runtime data files are intentionally tracked for demo purposes or accidentally committed: unknown / not verified.
- Whether there are branch protection rules or external release procedures: unknown / not verified.
- Whether the current dirty worktree reflects active feature work, incomplete refactors, or expected local state: unknown / not verified.

## 11. Pasteable summary for an external reviewer
This repository is a single-repo TypeScript/React/Vite multiplayer board app with a custom Node/Yjs realtime server, optional LiveKit video, repo-local persistence files, and lightweight hosted artifacts for a Vercel frontend plus a separate realtime/API service. The project is past pure prototype stage: it has substantial product/architecture docs, explicit agent guidance, hosted-alpha thinking, and real operational workflows.

Its biggest strengths are documentation for long-running AI-assisted work and explicit scope-control. `AGENTS.md`, `docs/01_CURRENT_STATE/ROADMAP.md`, `docs/00_AGENT_OS/PLANS.md`, current-context, case-study log, and focused design/runbook docs make it unusually agent-readable. Its biggest weaknesses are repo hygiene and execution hygiene: the README is still the default Vite template, lint is currently red, there is no visible CI or test suite, local env files are tracked, and mutable runtime data lives inside the repo and dirties the worktree.

Top 5 recommended improvements:
1. Replace the stale README with a real project overview and startup guide.
2. Stop tracking machine-local env files; move to sanitized example env files and stronger ignore rules.
3. Restore a green validation baseline and add a dedicated `typecheck` command.
4. Move mutable runtime data out of tracked repo state or ignore it properly.
5. Add visible CI for lint and build-smoke.

Best AGENTS.md additions:
- fast-start commands
- current validation truth
- env/secrets hygiene rules
- mutable runtime data rules
- a quick repo map for `BoardStage`, `App`, and `yjs-dev-server`
- stronger doc-update triggers

Best candidate skills:
- `repo-health-audit`
- `hosted-debug-preflight`
- `room-lifecycle-audit`
- `manual-qa-selector`
- `design-system-task-brief-writer`
- `runtime-config-smoke`
