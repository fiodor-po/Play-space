# Project Health Audit Report

## 1. Executive summary
- Audit plan followed: read canonical repo guidance first, inventory structure/config/workflows, inspect agent-facing artifacts, then run only low-impact validations.
- This is a single-repo TypeScript application with a React/Vite frontend, a custom Node/Yjs realtime/API server, optional LiveKit video, and lightweight hosted deployment artifacts.
- The repo is much stronger at preserving long-running project context than most small app repos: `AGENTS.md`, `ROADMAP.md`, `PLANS.md`, `play-space-project-foundation.md`, `play-space-alpha_current-context.md`, and `play-space-alpha_case-study-log.md` form a real operating system for humans and agents.
- Human onboarding is currently weak because the top-level `README.md` is still the default Vite template and does not describe the actual project.
- Local workflows are present and reasonably explicit in `package.json` and `docs/dev-workflows.md`, including `dev:local`, `dev:lan`, the presence server, LiveKit, and hosted deployment notes.
- Validation hygiene is incomplete: `build`, `lint`, and an artifact smoke check exist, but there is no test suite, no dedicated `typecheck` script, no formatter workflow, and no visible CI.
- Lightweight validation found one green and one red signal: `npm run smoke:artifact` passed, while `npm run lint` failed with 16 errors and 14 warnings, concentrated in `src/App.tsx`, `src/components/BoardStage.tsx`, `src/lib/roomSession.ts`, and `src/ui/system/debug.tsx`.
- Maintainability risk is concentrated in a few very large integration surfaces: `BoardStage.tsx` is 3743 lines, `App.tsx` is 1283 lines, and `scripts/yjs-dev-server.mjs` is 1183 lines.
- Environment hygiene is the weakest area: tracked local env files exist, `.gitignore` does not ignore `.env*`, and normal runtime data is stored under tracked `data/`, which already dirties the worktree.
- Repo structure is partially improving: domain folders exist under `src/board`, `src/lib`, `src/media`, `src/dice`, and `src/ui/system`, and object-specific extraction has begun for tokens and note cards.
- Agent-readiness is a major strength for planning and scope control, especially the strategist/executor model, task-brief/report templates, and explicit no-go rules around sensitive surfaces like `BoardStage`.
- The highest-leverage next work is organizational rather than feature work: replace the README, clean up env/data hygiene, restore a green validation baseline, and add lightweight CI.

## 2. Repository snapshot
- Probable project type: single-repo app with one frontend plus a custom long-running realtime/API service, with an optional hosted serverless token endpoint.
- Primary languages / frameworks: TypeScript, React 19, Vite 8, Konva/react-konva, Yjs/y-websocket, Node server scripts, optional LiveKit.
- Package manager(s): npm with `package-lock.json` lockfile v3.
- Build / test / lint / typecheck entry points:
  - Build: `npm run build`, `npm run build:smoke`
  - Test: none found
  - Lint: `npm run lint`
  - Typecheck: no dedicated script; bundled into `npm run build` via `tsc -b`
  - Format: none found
- Major apps / packages / services:
  - Frontend app in `src/`
  - Realtime/API server in `scripts/yjs-dev-server.mjs`
  - Hosted LiveKit token function in `api/livekit/token.ts`
  - Hosted deployment artifacts in `Dockerfile.realtime-api` and `vercel.json`
- High-level architecture guess: board-first multiplayer app; React/Konva client; Yjs WebSocket presence/state server; JSON-backed room snapshot and identity stores under `data/`; optional LiveKit media; frontend intended for Vercel-style hosting and backend as a separate Node service.
- Audit confidence level: Medium-High

## 3. Current health scorecard
- onboarding: 2/5 — deep docs are strong, but the first file most newcomers open is misleading.
- runability: 3/5 — local workflows are documented and scripted, but require external tools and env setup.
- validation hygiene: 2/5 — some entry points exist, but lint is red and there are no tests.
- CI hygiene: 0/5 — no `.github/workflows` found; any external CI is unknown / not verified.
- documentation quality: 4/5 — extensive, durable, and thoughtful; weakened by sprawl and a stale README.
- agent-readiness: 4/5 — unusually strong repo guidance, task templates, and durable context for long-running AI work.
- repo structure clarity: 3/5 — top-level layout is understandable, but ownership still collapses into a few oversized files.
- environment / secrets hygiene: 1/5 — tracked local env files and tracked runtime data create avoidable operational risk.
- dependency hygiene: 3/5 — lockfile exists and toolchain is coherent, but Node version is not pinned and automated checks are missing.
- maintainability: 2/5 — maintainable with repo-specific context, but fragile due to large integration surfaces and a red validation baseline.

## 4. Evidence-based findings

### 4.1 Documentation and onboarding
- The real source of truth is the docs set, not the README. Evidence: `AGENTS.md` explicitly tells agents to read `ROADMAP.md`, `PLANS.md`, foundation, and current-context first.
- The top-level README is stale. Evidence: `README.md` still describes the generic React + TypeScript + Vite template.
- Onboarding becomes much better once the right doc is found. Evidence: `docs/dev-workflows.md` declares itself the canonical startup guide and documents both localhost and LAN workflows.
- Durable project memory is a clear strength. Evidence: `ROADMAP.md`, `play-space-alpha_current-context.md`, and `play-space-alpha_case-study-log.md` preserve roadmap, operating state, and narrative decisions.
- Documentation is rich but fragmented. Evidence: `docs/` contains design docs, runbooks, ExecPlans, templates, audits, and task briefs, but there is no `docs/README.md` index.

### 4.2 Commands, scripts, and local workflows
- Core workflows are centralized in npm scripts. Evidence: `package.json` defines `dev`, `dev:local`, `dev:lan`, `build`, `build:smoke`, `lint`, `presence-server`, `livekit-server`, and `preview`.
- Local startup wrappers are practical and concrete. Evidence: `scripts/dev-local.sh` and `scripts/dev-lan.sh` validate required commands, load env files, and orchestrate the local stack.
- External prerequisites are documented, but not surfaced from the repo entry point. Evidence: `docs/dev-workflows.md` lists Node, npm, `livekit-server`, and `caddy`.
- Install workflow is only implicit. Evidence: there is no repo-specific install section in `README.md`; the expected package manager is only inferable from `package-lock.json`.
- Hosted/runtime assumptions are reasonably explicit. Evidence: `docs/hosted-alpha-deployment-plan.md`, `vercel.json`, and `Dockerfile.realtime-api`.

### 4.3 Validation and CI
- Validation entry points exist but are incomplete. Evidence: `package.json` has `build`, `lint`, and `smoke:artifact`, but no `test`, `typecheck`, or `format`.
- There is a useful repo-specific smoke check for the built frontend artifact. Evidence: `scripts/check-built-artifact.mjs`, run via `npm run smoke:artifact`.
- `npm run smoke:artifact` passed during this audit. Evidence from command output: it validated expected markers in `dist/assets/index-DQGco48J.js`.
- `npm run lint` failed during this audit. Evidence from command output:
  - conditional hook usage and set-state-in-effect issues in `src/App.tsx`
  - hook immutability / ordering issues in `src/components/BoardStage.tsx`
  - unused vars in `src/lib/roomSession.ts`
  - fast-refresh export issues in `src/ui/system/debug.tsx`
- No automated test suite was found. Evidence: no Vitest/Jest/Playwright/Cypress/Pytest config or test files were found by repo search.
- No visible CI workflow was found. Evidence: `find .github -maxdepth 3 -type f` returned nothing.
- I did not run `npm run build` because it would write build outputs and TypeScript build info files; that would violate the audit’s read-only discipline.

### 4.4 Environment and secrets handling
- Local env files are tracked in git. Evidence: `.env.localdev` and `.env.landev` exist at repo root; `git status --short` showed `.env.localdev` modified.
- `.gitignore` does not ignore `.env*`. Evidence: `.gitignore` ignores `*.local` but not `.env.localdev` / `.env.landev`.
- The repo at least provides a hosted example env file. Evidence: `.env.hosted.example`.
- Runtime config is explicit and diagnosable, which is good. Evidence: `src/lib/runtimeConfig.ts` logs derived vs env-provided URLs and warns on fallback assumptions.
- Media enablement defaults are operationally subtle. Evidence: `src/lib/runtimeConfig.ts` makes LiveKit media enabled unless `VITE_ENABLE_LIVEKIT_MEDIA` is explicitly false-ish.
- Mutable runtime data lives in tracked repo paths. Evidence: `scripts/yjs-dev-server.mjs` defaults to `data/room-snapshots.json` and `data/room-identities.json`, and `git status --short` showed those files changing.
- The backend container image also bakes in tracked `data/`. Evidence: `Dockerfile.realtime-api` copies `data/` and sets `ROOM_SNAPSHOT_STORE_FILE=/app/data/room-snapshots.json`.
- I found risky secret-handling patterns, but I am intentionally not printing any secret values.

### 4.5 Repository structure and module boundaries
- Top-level layout is broadly understandable. Evidence: top-level folders include `src`, `api`, `scripts`, `docs`, `data`, `public`, `.agents`, and `.codex`.
- Code organization has meaningful domain folders. Evidence: `src/board`, `src/lib`, `src/media`, `src/dice`, `src/ops`, `src/ui/system`.
- Object-specific extraction has started but is incomplete. Evidence: `src/board/objects/token` and `src/board/objects/noteCard` contain renderer and factory files, while other behavior still concentrates elsewhere.
- The main structural risk is oversized integration surfaces. Evidence from `wc -l`:
  - `src/components/BoardStage.tsx`: 3743 lines
  - `src/App.tsx`: 1283 lines
  - `scripts/yjs-dev-server.mjs`: 1183 lines
- The repo already knows these are sensitive. Evidence: `AGENTS.md` explicitly warns not to broad-rewrite `BoardStage` and to keep room/bootstrap/recovery changes narrow.

### 4.6 Agent guidance and durable context
- Root-level agent guidance is one of the repo’s strongest assets. Evidence: `AGENTS.md` covers product guardrails, no-go zones, validation defaults, doc update expectations, and strategist/executor split.
- The repo supports dual-thread AI work unusually well. Evidence: `AGENTS.md` defines strategist vs executor responsibilities and handoff/report formats.
- Durable templates reduce ambiguity for future implementation passes. Evidence: `docs/task-brief-template.md` and `docs/executor-report-template.md`.
- There is explicit Codex configuration. Evidence: `.codex/config.toml` and `.codex/agents/board_refactor_auditor.toml`.
- There is at least one reusable local skill. Evidence: `.agents/skills/board-architecture-audit/SKILL.md`.
- What is missing is a shorter execution quickstart for fresh implementation threads; today the repo has strong deep guidance but weaker fast orientation.

### 4.7 Reusable workflows / likely skill candidates
- Existing evidence of reusable workflows is strong. Evidence: task briefs, executor reports, manual QA runbook, stabilization checklist, deployment plan, and the local board-architecture audit skill.
- Workflows that look skill-worthy later:
  - project-health / repo-health audit
  - hosted deployment/debug verification using the repo’s commit-push-deploy discipline
  - room lifecycle / room memory / participant identity audit
  - manual QA scenario selection from `docs/manual-qa-runbook.md`
  - design-system migration brief generation from the existing task-brief pattern
- Workflows that should stay as repo guidance, not a skill:
  - “read these docs first”
  - basic startup commands
  - safe-edit/no-go rules already well handled in `AGENTS.md`

### 4.8 Main maintenance risks
- Misleading first impression: newcomers will start from the wrong mental model because `README.md` does not describe the product.
- Validation drift: `lint` is red, so “run lint before/after changes” is not yet a trustworthy gate.
- Runtime data drift: normal usage dirties tracked `data/*.json`, which can confuse agents and humans about what changed.
- Secret/config drift: tracked local env files encourage accidental disclosure and make machine-local state look canonical.
- Integration hotspots: too much behavior remains concentrated in `App`, `BoardStage`, and the realtime server.
- Documentation discoverability risk: there is a lot of good context, but the repo lacks a small document index or quickstart to tell a new thread what to read for which task.

## 5. What is missing or weak
- A real top-level README with product overview, setup, startup, validation, and doc links.
- A dedicated `typecheck` script.
- Any test suite, or a clear statement that testing is currently manual-first.
- Any formatter command or formatting policy entry point.
- Visible CI automation.
- A clean env-file policy using examples instead of tracked machine-local files.
- A clean runtime-data policy so normal operation does not dirty tracked files.
- A concise executor/operator quickstart.
- A short architecture overview doc for humans and fresh agent threads.
- Toolchain version pinning such as `.nvmrc` or `.node-version`.
- A docs index page for the large `docs/` surface.
- Directory-specific guidance for the highest-risk areas like `src/components` and `scripts/`.

## 6. Priority recommendations

### P0 — highest leverage / should fix first
- Replace `README.md`.
  - why it matters: it currently gives the wrong project identity.
  - expected impact: faster onboarding and fewer wrong assumptions.
  - implementation effort: Low
  - exact files to create or improve: `README.md`
  - suggested first step: write a one-page overview with install, `dev:local`, `dev:lan`, validation commands, and links to canonical docs.
- Fix env and local secret hygiene.
  - why it matters: tracked local env files are the biggest operational footgun here.
  - expected impact: lower leak risk and cleaner onboarding.
  - implementation effort: Medium
  - exact files to create or improve: `.gitignore`, `.env.example`, new `.env.localdev.example`, new `.env.landev.example`, `docs/dev-workflows.md`
  - suggested first step: stop treating machine-local env files as tracked project artifacts.
- Restore a green validation baseline and add a dedicated `typecheck`.
  - why it matters: agents need one reliable non-destructive validation loop.
  - expected impact: safer implementation passes and less ambiguity.
  - implementation effort: Medium
  - exact files to create or improve: `package.json`, `eslint.config.js`, affected source files currently failing lint
  - suggested first step: decide whether the current lint rule set is intended policy, then get `npm run lint` and `npm run typecheck` green.
- Move mutable runtime data out of tracked repo state.
  - why it matters: normal use should not pollute `git status`.
  - expected impact: cleaner worktrees and less accidental commit noise.
  - implementation effort: Medium
  - exact files to create or improve: `scripts/yjs-dev-server.mjs`, `.gitignore`, `docs/dev-workflows.md`, `Dockerfile.realtime-api`
  - suggested first step: default snapshot/identity stores to an ignored runtime path.

### P1 — important next improvements
- Add visible CI.
  - why it matters: local discipline will drift without automation.
  - expected impact: earlier breakage detection and a clearer merge baseline.
  - implementation effort: Medium
  - exact files to create or improve: `.github/workflows/ci.yml`
  - suggested first step: run `npm ci`, `npm run lint`, and `npm run build:smoke`.
- Create a short architecture overview doc.
  - why it matters: current architecture knowledge is spread across many focused docs.
  - expected impact: faster orientation for both humans and coding agents.
  - implementation effort: Low
  - exact files to create or improve: `docs/ARCHITECTURE.md` or `docs/PROJECT_OVERVIEW.md`
  - suggested first step: document frontend, realtime/API, persistence, media, and major sensitive surfaces on one page.
- Add an executor quickstart.
  - why it matters: current guidance is excellent but heavy.
  - expected impact: faster safe execution for narrow coding tasks.
  - implementation effort: Low
  - exact files to create or improve: `docs/EXECUTOR_QUICKSTART.md` or an early section in `AGENTS.md`
  - suggested first step: list read-first docs, run commands, validation commands, and no-go files.
- Add a formatter story.
  - why it matters: style consistency is currently implicit.
  - expected impact: fewer noisy diffs and lower friction for automated edits.
  - implementation effort: Low-Medium
  - exact files to create or improve: `package.json`, formatter config if adopted, `AGENTS.md`
  - suggested first step: either adopt Prettier or explicitly document that formatting is manual.

### P2 — nice-to-have improvements
- Pin the Node/toolchain version.
  - why it matters: reproducibility is weaker without a declared baseline.
  - expected impact: fewer machine-specific bugs.
  - implementation effort: Low
  - exact files to create or improve: `.nvmrc` or `.node-version`, `README.md`
  - suggested first step: choose one supported Node LTS and document it.
- Add directory-specific agent notes for choke points.
  - why it matters: `BoardStage`, runtime scripts, and room-state code have special hazards.
  - expected impact: fewer accidental broad changes.
  - implementation effort: Low
  - exact files to create or improve: `src/components/AGENTS.md`, `scripts/AGENTS.md`, or expanded sections in root `AGENTS.md`
  - suggested first step: document “what not to change casually” nearest the risky directories.
- Add a docs index.
  - why it matters: the repo already has good docs, but discoverability is weaker than content quality.
  - expected impact: lower search cost for humans and agents.
  - implementation effort: Low
  - exact files to create or improve: `docs/README.md`
  - suggested first step: group docs by onboarding, runtime, architecture, validation, planning, and historical baseline.

## 7. Suggested AGENTS.md improvements
- Add a short “Fast Start” block near the top with exact install/run/validate commands.
- Add a “Current validation truth” block that says whether lint/build are expected to pass right now and how to report pre-existing failures.
- Add an “Environment hygiene” rule:
  - never commit machine-local env files
  - use example env files
  - never print secret values in reports
- Add a “Mutable runtime data” rule explaining that snapshot/identity JSON files are operational data, not normal code changes.
- Add a “Quick repo map” section for:
  - `src/components/BoardStage.tsx`
  - `src/App.tsx`
  - `scripts/yjs-dev-server.mjs`
  - `api/livekit/token.ts`
- Add a rule that `dist/` should not be trusted as fresh unless the current pass explicitly built it.
- Add a compact “When to read which doc” table so fresh threads do not over-read the whole `docs/` tree.
- Add optional directory-specific notes for `src/components`, `src/lib`, and `scripts`.

## 8. Suggested durable docs for long-running work
- `docs/PROJECT_OVERVIEW.md`
  - role: one-page orientation to product, runtime shape, and codebase map.
- `docs/ARCHITECTURE.md`
  - role: concise current-state architecture across frontend, realtime/API, persistence, media, and hosted topology.
- `docs/EXECUTOR_QUICKSTART.md`
  - role: minimal guide for a new coding thread to start safely without reading every deep doc first.
- `docs/OPERATIONS_RUNBOOK.md`
  - role: practical local/hosted ops steps, deploy-debug order, runtime-data locations, and room ops checks.
- `docs/DECISIONS.md`
  - role: compact index of durable product/architecture decisions separate from the narrative case-study log.
- `docs/README.md`
  - role: index the docs tree and mark which files are canonical, focused, or historical.
- `docs/STATUS.md`
  - role: very short current operational state and active focus, lighter than the full current-context handoff.

## 9. Suggested skill candidates
- `repo-health-audit`
  - when it should be used: periodic read-only repo health reviews.
  - inputs it needs: repo root, whether lightweight validations are allowed, audit scope.
  - expected output: structured health report with findings, risks, and priorities.
  - why this should be a skill: it is a repeatable cross-cutting workflow with a stable output shape.
- `hosted-debug-verifier`
  - when it should be used: before or during hosted deployment debugging.
  - inputs it needs: target bug area, current commit, deploy artifact assumptions, relevant runtime docs.
  - expected output: verified checklist of commit/push/deploy/runtime alignment and likely failure surface.
  - why this should be a skill: the repo already treats this as a workflow rule, not a one-off tip.
- `room-lifecycle-audit`
  - when it should be used: changes touching room entry/leave/bootstrap/recovery/identity/persistence.
  - inputs it needs: relevant files, room docs, current roadmap phase.
  - expected output: state-category map, risks, and a narrow change plan or audit report.
  - why this should be a skill: the repo has stable semantics and repeated room-state complexity.
- `manual-qa-selector`
  - when it should be used: after board/runtime changes to derive the right smoke set from the runbook.
  - inputs it needs: changed files, touched behavior, local vs hosted context.
  - expected output: a minimal manual QA checklist tailored to the change.
  - why this should be a skill: it turns a large runbook into a targeted repeatable procedure.
- `design-system-brief-writer`
  - when it should be used: narrow design-system migration or cleanup batches.
  - inputs it needs: migration target, relevant docs, affected components/files.
  - expected output: executor-ready task brief following the repo template.
  - why this should be a skill: the repo already produces many repeatable design-system task briefs.
- `runtime-config-inspector`
  - when it should be used: changes around env handling, hosted config, LiveKit URLs, or token routing.
  - inputs it needs: runtime-related files, env examples, deployment mode.
  - expected output: config surface map, fallback behavior summary, and validation checklist.
  - why this should be a skill: runtime assumptions are subtle and central to safe operation.

## 10. Unknowns and verification gaps
- Whether hidden/external CI exists outside the repo: unknown / not verified.
- Whether the current `dist/` artifact was built from the current source tree: unknown / not verified.
- Whether the tracked local env files currently contain active secrets vs placeholder values: not verified; I intentionally did not print them.
- Whether `npm run build` currently passes: not verified, because running it would modify build outputs and TypeScript build-info files.
- Whether all docs are current relative to latest code: partially verified only.
- Whether hosted deployment artifacts are still used exactly as documented: unknown / not verified.
- Whether the large-file hotspots are already under active refactor in another branch/thread: unknown / not verified.

## 11. Pasteable summary for an external reviewer
This repo is a single-repo TypeScript multiplayer app: React/Vite frontend, custom Node/Yjs realtime/API backend, optional LiveKit video, and lightweight hosted deployment artifacts. It is more mature in documentation and project-memory discipline than in engineering hygiene: `AGENTS.md`, roadmap/current-context/case-study docs, templates, and a local skill make it highly agent-friendly for strategy and scoped execution.

The biggest risks are operational and organizational rather than product-direction risk. The top-level README is stale and misleading, local env files are tracked, runtime snapshot data is stored in tracked repo paths, validation is incomplete, and `npm run lint` is currently red with 16 errors and 14 warnings. Maintainability risk concentrates in oversized integration surfaces: `src/components/BoardStage.tsx`, `src/App.tsx`, and `scripts/yjs-dev-server.mjs`.

Top 5 recommended improvements:
1. Replace `README.md` with a real project overview and startup guide.
2. Stop tracking machine-local env files; move to example env files plus documented setup.
3. Move mutable runtime data out of tracked repo paths and ignore it.
4. Restore a green validation baseline and add a dedicated `typecheck` script.
5. Add lightweight CI for `npm ci`, `npm run lint`, and `npm run build:smoke`.

Best candidate AGENTS.md additions:
- fast-start commands
- current validation truth / how to report pre-existing failures
- env/secrets hygiene rules
- mutable runtime data rules
- quick repo map for `App`, `BoardStage`, realtime server, and token endpoint
- doc-reading guide by task type
- rule not to trust `dist/` unless freshly built

Best candidate skills:
- `repo-health-audit`
- `hosted-debug-verifier`
- `room-lifecycle-audit`
- `manual-qa-selector`
- `design-system-brief-writer`
- `runtime-config-inspector`
