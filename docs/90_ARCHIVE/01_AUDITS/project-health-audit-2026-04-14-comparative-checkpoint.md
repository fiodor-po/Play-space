# Project Health Audit Report

Summary: compared with the earlier stabilization/hygiene/validation audits, the repo is materially healthier and the `App.tsx` track did produce real structural progress. But the remaining `App` debt is no longer best described as generic split cleanup. What remains is the app-shell lifecycle/ownership knot: boot, direct-room bootstrap, active-room restore, join/leave collapse, participant session persistence, room-record/creator sync, and foreground presence-carrier coordination.

### 1. What improved since previous audits
- Onboarding and repo entry are genuinely better now.
  Evidence: `README.md`, `docs/README.md`, `docs/00_AGENT_OS/EXECUTOR_QUICKSTART.md`, and `docs/04_ARCHITECTURE/00_OVERVIEW/ARCHITECTURE.md` now exist and route a fresh reader correctly. This directly closes the biggest onboarding weakness from the earlier audits.
- Env/runtime-data hygiene really changed, not just in prose.
  Evidence: `.gitignore` and runtime docs now point to `.runtime-data/`; repo guidance no longer expects tracked room snapshot data as normal repo state. `rg` confirmed `.runtime-data/room-snapshots.json` and `.runtime-data/room-identities.json` are now the documented defaults in README/dev docs.
- Validation ergonomics improved.
  Evidence: `package.json` now has a dedicated `typecheck` script, and `build` runs it first. This was explicitly missing in the earliest audit.
- The `App.tsx` split track produced real code movement.
  Evidence: new extracted hooks in `src/app/useEntryAvailabilityState.ts` and `src/app/useJoinedRoomPresenceTransport.ts`.
- `App.tsx` is materially smaller than in the earlier audits.
  Evidence: earlier audit baseline was 1283 lines; current `wc -l` shows `src/App.tsx` at 1117 lines. That is real structural progress, not just lint churn.
- Lint debt narrowed again.
  Evidence: earlier audits saw `16 errors / 14 warnings`, then `11 / 13`; this pass found `7 errors / 12 warnings`, and the failures are now only in `src/App.tsx` and `src/components/BoardStage.tsx`.
- Low-risk hygiene lint noise that used to pollute the picture is no longer central.
  Evidence: this pass did not reproduce the earlier findings in `src/lib/roomSession.ts`, `src/ui/system/debug.tsx`, or `src/media/LiveKitMediaDock.tsx`.
- Typecheck truth is now stronger than in the earlier audits.
  Evidence: I safely ran `./node_modules/.bin/tsc --noEmit -p tsconfig.app.json` and `./node_modules/.bin/tsc --noEmit -p tsconfig.node.json`; both passed.
- The roadmap itself has moved from generic hygiene toward `App` structural analysis.
  Evidence: `docs/01_CURRENT_STATE/ROADMAP.md` now frames the active phase as a repo/runtime health pass centered on `src/App.tsx`.

### 2. Current hotspots
- `App.tsx` is still a structural hotspot, but the character of the hotspot changed.
  It is no longer mainly “entry availability is mixed with joined-room presence transport.” Those two concerns were extracted.
  What remains is the app-shell lifecycle core inside `BootstrappedApp`: initial room derivation, restore-vs-entry decision, local participant session restore, active room persistence, room-record initialization, creator sync connection, join claim settle logic, entry collapse, and room leave.
- The remaining `App.tsx` lint findings point at real lifecycle coupling, not cosmetic cleanup.
  Evidence from current lint:
  - conditional hook ordering around the top-level route split
  - synchronous effect-driven state resets around room/session restore
  - dependency warnings around functions like `rememberRoomMemberState` and `collapseToEntryScreen`
  This is exactly where shell ownership is still mixed.
- `BoardStage.tsx` is still the other major hotspot, and it remains riskier than `App.tsx`.
  Evidence: current lint still reports image-drawing helper ordering/ref-mutation/dependency issues there, and `wc -l` now shows `src/components/BoardStage.tsx` at 3796 lines, slightly larger than the previous audit baseline.
- CI remains a repo-level hotspot.
  Evidence: no `.github/workflows` are present. Earlier audits already called this out; it is still true.
- Some docs are now healthier overall but have started to drift locally.
  Evidence:
  - `README.md` still says lint has pre-existing failures in `src/lib/roomSession.ts` and `src/ui/system/debug.tsx`, which the current lint output no longer shows.
  - `AGENTS.md` still has one stale quick-repo-map line pointing to `data/` even though later in the same file it correctly documents `.runtime-data/`.

### 3. Validation truth now
- `typecheck`:
  - Safe read-only equivalent re-verified now: pass.
  - Evidence: `./node_modules/.bin/tsc --noEmit -p tsconfig.app.json` passed, and `./node_modules/.bin/tsc --noEmit -p tsconfig.node.json` passed.
  - Note: I did not run `npm run typecheck` directly because the configured `tsc -b` path may write build-info state.
- `build`:
  - Not re-run in this audit.
  - Reason: `npm run build` writes artifacts and is not read-only.
  - Current best evidence: repo docs still claim it passes as of 2026-04-13, and `smoke:artifact` passed against the current built artifact, but that is not the same as a fresh build verification.
  - So the honest status is: unknown / not re-verified in this pass.
- `lint`:
  - Re-verified now: fails.
  - Current result: `19 problems (7 errors, 12 warnings)`.
- Where lint is still red:
  - `src/App.tsx`
    - conditional hook ordering
    - synchronous `setState` inside effects
    - effect dependency warnings
  - `src/components/BoardStage.tsx`
    - use-before-declaration around image drawing helpers
    - ref mutation findings from hooks/immutability rules
    - effect/useMemo dependency warnings
- `smoke:artifact`:
  - Re-verified now: pass.

### 4. `App.tsx` status now
- Is it still the best next target?
  - Yes.
- Why yes?
  - It is still safer and higher-signal than `BoardStage.tsx`.
  - Real structural progress already landed there, which means another pass can build on extracted seams instead of starting from zero.
  - The remaining lint debt in `App` is smaller in count than before, but more semantically concentrated. That usually means the next pass can be sharper, not broader.
- What kind of work remains there now?
  - Not “one more generic split slice.”
  - The remaining work is app-shell lifecycle/ownership work:
    - route-mode / ops-route shell separation
    - boot readiness and app bootstrap ownership
    - active-room restore vs entry-mode ownership
    - join/leave/collapse transitions
    - participant session + room-record + creator-id synchronization
    - foreground presence-carrier coordination
  - In other words: `App` is still the next target, but the honest framing has shifted from render-ownership cleanup to lifecycle/ownership clarification inside the app shell.

### 5. Suggested next chapter
- Best current framing: explicit `App lifecycle / ownership` chapter.
- Why this is better than “one more narrow App split slice”:
  - the easy/highly mechanical extractions already happened
  - the remaining `App` findings cluster around state transition ownership, not just view composition
  - the current roadmap question is no longer “can we extract another hook?” but “what owns boot/join/restore/collapse/creator/session truth?”
- Why this is better than pivoting now to `BoardStage`:
  - `BoardStage` remains more fragile and still carries canvas/image-interaction risk
  - `App` is the safer place to finish the current structural cleanup story before starting a more delicate board analysis chapter
- Why this is better than pivoting back to design-system work:
  - the comparative audits and the current roadmap both point to structural/runtime clarity, not visual-system continuation, as the current high-value next step
- Practical recommendation:
  - stay on `App` as the next chapter
  - but formally rename the effort from narrow split cleanup to `App lifecycle / ownership`
  - keep it analysis-first and scoped to shell/state-transition ownership, without widening into room-semantic redesign

### 6. Confidence level
- High confidence.

Main reasons:
- there are clear, evidence-backed deltas from prior audits
- current lint and file-shape data support the conclusion directly
- the extracted hooks prove the `App` split track already moved the codebase
- the remaining `App` issues now cluster around lifecycle ownership strongly enough that calling it just “more split cleanup” would understate what is actually left
