# Project Health Audit Report

Audit date: 2026-04-16

Note: this audit snapshot predates the later same-day closure of
`browser-local participant identity stabilization` and the later planning-mode
promotion of `participant-marker / creator-color` to the next candidate chapter.

## 1. Executive summary
- This full audit was run as a fresh read-only checkpoint and compared mentally against the previous full audit from 2026-04-14.
- The repo remains operationally healthy and well-documented, but validation health regressed since the previous full audit.
- The project is still a single-repo TypeScript app with a React/Vite frontend, a custom Node/Yjs realtime/API backend, optional LiveKit media, and lightweight hosted deployment artifacts.
- Repo guidance is still strong: `AGENTS.md`, `README.md`, `ROADMAP.md`, `play-space-alpha_current-context.md`, and the doc index create a durable working context for humans and agents.
- The roadmap and current-context have advanced into a new chapter: phase C is now centered on room document persistence / recovery architecture, with the next active chapter framed as browser-local participant identity stabilization.
- The repo now has a real Playwright smoke harness. This is a meaningful improvement over the 2026-04-14 full audit, where automated tests were still absent.
- Current automated-validation surface now includes:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build:smoke`
  - `npm run smoke:e2e`
- Safe read-only typecheck equivalents passed for both app and node scopes in this audit.
- `npm run smoke:artifact` passed in this audit.
- I did not rerun `npm run build` because it writes artifacts.
- I also did not rerun `npm run smoke:e2e` in this pass, because the Playwright harness may leave repo-local artifacts on failure and this audit stayed on the read-only side of validation.
- `npm run lint` regressed compared with the previous full audit. It is no longer red only in `src/components/BoardStage.tsx`; it now also fails in `tests/e2e/helpers/roomSmoke.ts`.
- The largest current structural hotspot remains `src/components/BoardStage.tsx`, and it has grown significantly since the last full audit.
- `scripts/yjs-dev-server.mjs` also grew and remains the main backend integration hotspot.
- In-repo CI is still absent. This is now a more visible weakness because the repo has matured enough to benefit from automating the existing validation stack.

## 2. Repository snapshot
- Probable project type: single-repo application with a frontend plus a custom long-running realtime/API backend, plus optional hosted token routing.
- Primary languages / frameworks: TypeScript, React 19, Vite 8, Konva/react-konva, Yjs/y-websocket, Node scripts, optional LiveKit.
- Package manager(s): npm with `package-lock.json`.
- Build / test / lint / typecheck entry points:
  - Build: `npm run build`, `npm run build:smoke`
  - Lint: `npm run lint`
  - Typecheck: `npm run typecheck`
  - Browser smoke: `npm run smoke:e2e`, `npm run smoke:e2e:headed`
  - Browser install helper: `npm run smoke:e2e:install`
  - Format: none found
- Major apps / packages / services:
  - frontend in `src/`
  - realtime/API backend in `scripts/yjs-dev-server.mjs`
  - hosted token route in `api/livekit/token.ts`
  - Playwright smoke suite in `tests/e2e/`
- High-level architecture guess:
  - board-first multiplayer frontend
  - Yjs/websocket shared room runtime
  - room document persistence/recovery track now treated as an explicit architecture chapter
  - optional LiveKit media
  - Vercel-style frontend + separate Node backend hosted shape
- Audit confidence level: High

## 3. Current health scorecard
- onboarding: 4/5 — onboarding remains strong and discoverable through README + docs index.
- runability: 4/5 — workflows are explicit and scripted, though external tools are still required for full local flows.
- validation hygiene: 3/5 — stronger than before because Playwright smoke exists, but weaker than the previous full audit because lint truth regressed.
- CI hygiene: 0/5 — still no in-repo CI workflows.
- documentation quality: 4/5 — still strong, but there is renewed drift between guidance files and actual validation truth.
- agent-readiness: 5/5 — still unusually strong due to durable context, task framing, and explicit repo rules.
- repo structure clarity: 3/5 — understandable top-level structure, but major runtime ownership remains concentrated in a few very large files.
- environment / secrets hygiene: 4/5 — env/runtime-data hygiene remains solid.
- dependency hygiene: 4/5 — improved relative to the 2026-04-14 full audit because there is now a real Playwright-based smoke dependency and test harness, though no Node pinning or CI enforcement exists.
- maintainability: 3/5 — still workable, but current growth in `BoardStage` and backend runtime files raises future change risk.

## 4. Evidence-based findings

### 4.1 Documentation and onboarding
- Top-level onboarding is still good.
  Evidence: `README.md` remains project-specific and operationally useful.
- The docs tree remains navigable.
  Evidence: `docs/README.md`, `docs/ARCHITECTURE.md`, and `docs/EXECUTOR_QUICKSTART.md`.
- Repo guidance has advanced to the new architecture chapter.
  Evidence: `ROADMAP.md` now frames the active phase as `Phase C — Room document persistence / recovery architecture`.
- Current-context is richer and more operationally precise than in the 2026-04-14 full audit.
  Evidence: `play-space-alpha_current-context.md` now includes replica-track completion, local smoke harness mention, debug-tools cleanup checkpoint, and next active chapter framing.
- Guidance drift has reappeared.
  Evidence:
  - `AGENTS.md` says current lint failures are only in `src/components/BoardStage.tsx`
  - `docs/EXECUTOR_QUICKSTART.md` says the same
  - actual `npm run lint` in this audit also fails in `tests/e2e/helpers/roomSmoke.ts`

### 4.2 Commands, scripts, and local workflows
- The command surface is richer than in the previous full audit.
  Evidence: `package.json` now includes:
  - `smoke:e2e:install`
  - `smoke:e2e`
  - `smoke:e2e:headed`
- Playwright smoke is now documented as a first-class machine gate.
  Evidence: `docs/playwright-smoke-harness.md`.
- Local workflows remain wrapper-driven and coherent.
  Evidence: `dev:local`, `dev:lan`, `presence-server`, `livekit-server`.
- The repo still depends on external local tools and browser provisioning for the full stack.
  Evidence: `README.md`, `AGENTS.md`, and `docs/playwright-smoke-harness.md`.

### 4.3 Validation and CI
- Read-only typecheck equivalents passed.
  Evidence:
  - `./node_modules/.bin/tsc --noEmit -p tsconfig.app.json` passed
  - `./node_modules/.bin/tsc --noEmit -p tsconfig.node.json` passed
- `npm run smoke:artifact` passed.
  Evidence: artifact smoke still found the expected runtime markers.
- `npm run lint` failed and currently reports 18 problems.
  Evidence from this audit:
  - `src/components/BoardStage.tsx`
    - `useEffectEvent` usage violations
    - ref immutability violations
    - use-before-declaration around `flushLocalCursorPresence`
    - dependency warnings
  - `tests/e2e/helpers/roomSmoke.ts`
    - `@typescript-eslint/no-explicit-any`
- This is a regression relative to the 2026-04-14 full audit, which found lint red only in `src/components/BoardStage.tsx`.
- The repo now has a real automated smoke suite.
  Evidence:
  - `playwright.config.ts`
  - `tests/e2e/room-corridors.spec.ts`
  - `tests/e2e/helpers/smokeRuntime.ts`
  - `docs/playwright-smoke-harness.md`
- CI is still absent.
  Evidence: `find .github -maxdepth 3 -type f` returned nothing.

### 4.4 Environment and secrets handling
- Env hygiene remains healthy.
  Evidence: the repo still uses `.env*` ignore rules with explicit example-file exceptions.
- Runtime-data hygiene remains healthy.
  Evidence: worktree dirtiness did not come from `.runtime-data/`; current modified files are only `ROADMAP.md` and `play-space-alpha_current-context.md`.
- Secret handling remains convention-based rather than tool-enforced.
  Evidence: no CI secrets surface or stronger secret-management tooling is present.

### 4.5 Repository structure and module boundaries
- `src/app/` remains in place and still marks successful earlier extraction work.
  Evidence:
  - `src/app/useEntryAvailabilityState.ts`
  - `src/app/useJoinedRoomPresenceTransport.ts`
- `src/board/runtime/` now exists, which suggests runtime concern growth around the board domain.
  Evidence: `find src -maxdepth 2 -type d` now shows `src/board/runtime`.
- The main frontend hotspot is still `src/components/BoardStage.tsx`.
  Evidence:
  - current lint output is dominated by it
  - `wc -l` shows it at 5355 lines, up from 3875 in the 2026-04-14 full audit
- `src/App.tsx` is no longer the main structural hotspot from the lint perspective, but it remains a large file.
  Evidence: `wc -l` shows 1242 lines.
- The backend integration surface also expanded.
  Evidence: `scripts/yjs-dev-server.mjs` is now 1347 lines, up from 1185 in the 2026-04-14 full audit.

### 4.6 Agent guidance and durable context
- Agent-readiness remains one of the strongest parts of the repo.
  Evidence: `AGENTS.md`, `ROADMAP.md`, `play-space-alpha_current-context.md`, templates, and the accumulated audit series.
- The repo now supports a stronger machine-validation story for board/runtime work.
  Evidence: Playwright smoke harness docs and scripts are integrated into guidance.
- The main weakness in the guidance layer is now drift, not missing docs.
  Evidence: validation truth in guidance files no longer exactly matches actual lint output.

### 4.7 Reusable workflows / likely skill candidates
- The repo is now even more skill-friendly than in the previous full audit.
  Evidence:
  - explicit Playwright smoke harness
  - richer architecture chapter framing
  - accumulated audit history
- Strong candidate workflows remain:
  - repo-health audit
  - architecture/runtime checkpoint audit
  - hosted-debug verification
  - manual QA selector
  - smoke harness review after replica-track transitions

### 4.8 Main maintenance risks
- `src/components/BoardStage.tsx` is still the main structural risk and is now larger than before.
- `scripts/yjs-dev-server.mjs` is becoming a stronger backend risk surface.
- Validation truth drift inside docs can now mislead both humans and agents.
- CI is still missing despite the repo now having enough validation surface to justify it.
- The new Playwright suite is valuable, but until it is consistently enforced or at least routinely rerun, it remains a process promise more than a guaranteed baseline.

## 5. What is missing or weak
- In-repo CI workflows.
- Enforcement or regular execution discipline around `npm run smoke:e2e`.
- A formatter command or explicit formatting policy.
- Pinned Node version via `.nvmrc` or `.node-version`.
- Guidance sync across `README.md`, `AGENTS.md`, and `docs/EXECUTOR_QUICKSTART.md`.
- Structural reduction of `src/components/BoardStage.tsx`.
- Later structural reduction of `scripts/yjs-dev-server.mjs`.

## 6. Priority recommendations

### P0 — highest leverage / should fix first
- Restore a truthful validation baseline in docs.
  - Why it matters: the repo uses docs as operational truth.
  - Expected impact: immediate reduction in human/agent confusion.
  - Implementation effort: Low
  - Exact files to create or improve: `README.md`, `AGENTS.md`, `docs/EXECUTOR_QUICKSTART.md`
  - Suggested first step: update all three to reflect the current lint truth, including the `tests/e2e/helpers/roomSmoke.ts` failure.
- Decide whether the current lint regression is accepted temporary debt or should be brought back to the previous checkpoint.
  - Why it matters: the repo regressed relative to the last full audit.
  - Expected impact: restores trust in the stated validation baseline.
  - Implementation effort: Low-Medium
  - Exact files to create or improve: likely `src/components/BoardStage.tsx` and `tests/e2e/helpers/roomSmoke.ts`
  - Suggested first step: classify which lint findings are intentional transitional debt vs accidental regression.
- Add lightweight CI.
  - Why it matters: the repo now has enough validation surface that automation will pay off immediately.
  - Expected impact: protects typecheck/lint/build-smoke and later smoke:e2e.
  - Implementation effort: Medium
  - Exact files to create or improve: `.github/workflows/ci.yml`
  - Suggested first step: start with typecheck, lint, and build:smoke before deciding whether smoke:e2e should run in CI by default.

### P1 — important next improvements
- Keep the current phase-C architecture work honest by pairing it with validation checkpoints.
  - Why it matters: persistence/recovery architecture is now the active chapter, and that raises regression risk.
  - Expected impact: keeps the replica-track and participant-identity work grounded in reproducible checks.
  - Implementation effort: Low for process, higher for follow-up work
  - Exact files to create or improve: likely `AGENTS.md`, `docs/playwright-smoke-harness.md`, roadmap/current-context docs as needed
  - Suggested first step: explicitly state when `smoke:e2e` must be rerun during phase-C work.
- Decide on a formatter story.
  - Why it matters: file size and structural churn make formatting noise more costly.
  - Expected impact: lower diff noise in future cleanup and architecture passes.
  - Implementation effort: Low-Medium
  - Exact files to create or improve: `package.json`, formatter config if adopted, `AGENTS.md`
  - Suggested first step: adopt Prettier or document manual formatting policy explicitly.

### P2 — nice-to-have improvements
- Pin the Node version.
  - Why it matters: the test/tooling surface is now richer and more version-sensitive.
  - Expected impact: fewer machine-specific mismatches.
  - Implementation effort: Low
  - Exact files to create or improve: `.nvmrc` or `.node-version`, `README.md`
  - Suggested first step: choose one supported Node LTS and document it.
- Add a small non-Playwright unit/integration layer around utility/runtime helpers.
  - Why it matters: e2e smoke is valuable but expensive; utility-level checks would catch cheaper regressions.
  - Expected impact: broader validation pyramid.
  - Implementation effort: Medium
  - Exact files to create or improve: chosen test config and initial utility-level tests
  - Suggested first step: start with runtime config or room-state helper slices.

## 7. Suggested AGENTS.md improvements
- Keep the current new validation commands section.
- Update the validation-truth block to match the actual current lint output.
- Add one short line clarifying whether `smoke:e2e` is required for all phase-C persistence/identity work or only for a subset of corridors.
- Keep the current phase-C doc list; it is a real improvement over the previous audit.

## 8. Suggested durable docs for long-running work
- The repo already has the right doc shape for the current phase.
- The next most useful durable artifact is not a new broad doc, but continued upkeep of:
  - `docs/playwright-smoke-harness.md`
  - roadmap/current-context
  - phase-C persistence/replica docs
- A future `docs/CI_AND_VALIDATION.md` becomes worthwhile once CI lands.

## 9. Suggested skill candidates
- `repo-health-audit`
  - when it should be used: recurring full or checkpoint repo audits
  - inputs it needs: repo root, allowed validations, comparison baseline
  - expected output: structured repo-health report with current truth and deltas
  - why this should be a skill: the repo already repeats this workflow
- `architecture-runtime-checkpoint`
  - when it should be used: after a structural or architecture chapter checkpoint
  - inputs it needs: roadmap/current-context, hotspot files, validation truth
  - expected output: current ownership map and recommendation for the next chapter
  - why this should be a skill: it matches the strategist/executor planning model
- `smoke-harness-review`
  - when it should be used: after replica-track or persistence/recovery transitions
  - inputs it needs: harness docs, current tests, changed runtime semantics
  - expected output: what smoke assertions remain stable, what assertions must change
  - why this should be a skill: the repo already documents explicit review moments for the smoke harness
- `hosted-debug-verifier`
  - when it should be used: before or during hosted debugging
  - inputs it needs: current code/deploy/runtime assumptions
  - expected output: verified checklist before blaming app logic
  - why this should be a skill: the workflow is explicit and repeatedly useful

## 10. Unknowns and verification gaps
- `npm run build` was not re-run in this pass.
- `npm run smoke:e2e` was not re-run in this pass.
- Hidden/external CI outside the repo is unknown / not verified.
- Hosted runtime behavior was not re-verified in this pass.

## 11. Pasteable summary for an external reviewer
This repeat full audit on 2026-04-16 found that the repo has moved forward structurally and procedurally since the 2026-04-14 full audit, but validation health regressed. The project now has a real Playwright smoke harness, richer phase-C persistence/recovery architecture docs, and stronger roadmap/current-context guidance. The main repo-level win since the previous full audit is that automated smoke tooling now exists. The main repo-level loss is that lint is no longer red only in `BoardStage.tsx`; it now also fails in `tests/e2e/helpers/roomSmoke.ts`.

Current truth from this audit:
- read-only typecheck equivalents pass
- `npm run smoke:artifact` passes
- `npm run lint` fails with 12 errors and 6 warnings across `src/components/BoardStage.tsx` and `tests/e2e/helpers/roomSmoke.ts`
- `npm run build` and `npm run smoke:e2e` were not rerun in this pass

Main current risks:
- `BoardStage.tsx` is now even larger than before
- `scripts/yjs-dev-server.mjs` also grew
- docs drifted away from actual validation truth
- CI is still absent despite the richer validation surface
