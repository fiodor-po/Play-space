# Review Follow-ups Log

## Role

Этот файл хранит concrete follow-ups, найденные во время strategist review,
executor review и read-only audit passes.

Он нужен для двух задач:

- не терять review findings между chat turns и chapter passes;
- закрывать chapter или checkpoint с явным разбором открытых follow-ups.

## What belongs here

Сюда попадают только concrete later actions:

- узкий technical follow-up;
- новый chapter candidate;
- docs/process follow-up;
- validation or inspectability gap, который не закрывается в текущем pass.

Сюда не попадают:

- narrative history;
- already completed work;
- vague worries without a concrete next action.

Для narrative history используй `docs/02_DECISIONS_LOG/CASE_STUDY_LOG.md`.

## Entry shape

Каждая запись должна содержать:

- `id`
- `date`
- `source`
- `finding`
- `why_deferred`
- `expected_action`
- `target_chapter`
- `status`

Recommended statuses:

- `open`
- `planned`
- `absorbed-into-current-chapter`
- `spawned-as-new-chapter`
- `closed`
- `dropped`

## Chapter / checkpoint closure rule

Перед закрытием chapter или checkpoint:

1. review open entries touched by the chapter;
2. decide for each entry:
   - close it
   - keep it deferred
   - absorb it into the next step of the same chapter
   - spawn a new later chapter or roadmap task
3. if a new task or chapter is created, update:
   - `docs/01_CURRENT_STATE/ROADMAP.md`
   - `docs/00_AGENT_OS/CURRENT_CONTEXT.md`
   - `docs/02_DECISIONS_LOG/CASE_STUDY_LOG.md` when the workflow lesson or milestone matters
4. update the entry status in the same pass.

## Open entries

### RF-2026-04-19-01

- `id`: `RF-2026-04-19-01`
- `date`: `2026-04-19`
- `source`: strategist decision after suppressing token selection chrome in the selection normalization pass
- `finding`: token selection mechanism stays in the runtime, but the previous local and remote token selection chrome path is still rough and adds visual noise in the current one-token-per-player checkpoint
- `why_deferred`: current product checkpoint keeps one non-deletable token per participant, so token selection chrome is not needed for current play and does not justify a separate polish pass inside the current chapter
- `expected_action`: before re-enabling token selection chrome, run a dedicated token-selection polish pass and verify local and remote token selection treatment, readability, and delete-flow readiness for a future multi-token product state
- `target_chapter`: `token selection polish before re-enable`
- `status`: `planned`

### RF-2026-04-15-01

- `id`: `RF-2026-04-15-01`
- `date`: `2026-04-15`
- `source`: strategist review after the read-side `Local replica semantics` slice
- `finding`: legacy `room-snapshot` remains as a compatibility fallback after version-aware local replica adoption
- `why_deferred`: `Durable write model` closed without needing fallback removal; the remaining decision belongs to the recovery-side chapter where bootstrap and convergence semantics are already in scope
- `expected_action`: keep the fallback as a compatibility path for now and review whether it should narrow further during `Recovery convergence model`
- `closure_result`: bootstrap read path now uses version-aware local replica or `none`, committed add/remove corridors now write local replica, and stale `room-snapshot` no longer affects same-browser recovery decisions
- `target_chapter`: `Recovery convergence model`
- `status`: `closed`

### RF-2026-04-15-02

- `id`: `RF-2026-04-15-02`
- `date`: `2026-04-15`
- `source`: strategist review after manual runtime check of the new durable inspectability surface
- `finding`: Dev tools panel now overflows the viewport and hides lower debug actions because the panel has no human-usable scroll behavior
- `why_deferred`: current pass is about durable write semantics; the inspectability surface still works for automation, and the layout fix belongs to a separate narrow usability pass
- `expected_action`: add viewport-bounded layout and internal scroll behavior so the full Dev tools panel remains reachable on ordinary desktop viewports
- `closure_result`: the panel now stays viewport-bounded, lower debug sections stay reachable through internal scroll, and smoke-facing inspectability hooks stay stable
- `target_chapter`: `debug-tools usability cleanup`
- `status`: `closed`

### RF-2026-04-15-03

- `id`: `RF-2026-04-15-03`
- `date`: `2026-04-15`
- `source`: strategist review during `Durable write model` closure after manual ops/admin validation
- `finding`: destructive ops delete removes the durable snapshot until the next covered commit, and leave-to-entry during that window can temporarily leave the room without durable recoverability
- `why_deferred`: ordinary durable write corridors and recovery order are already validated; reseed or leave-flush policy is a separate room-ops/runtime ergonomics decision
- `expected_action`: decide whether destructive snapshot delete should trigger immediate durable reseed, explicit leave-time flush, or clearer destructive semantics in the ops path
- `target_chapter`: `room-ops durability ergonomics`
- `status`: `planned`

### RF-2026-04-15-04

- `id`: `RF-2026-04-15-04`
- `date`: `2026-04-15`
- `source`: strategist review during `Recovery convergence model` closure
- `finding`: write-side `room-snapshot` cache still exists as a legacy local cache after recovery semantics stopped reading it
- `why_deferred`: recovery now opens and settles through version-aware local replica plus per-slice durable convergence; removing the remaining write-only cache is hygiene work and does not block chapter closure
- `expected_action`: decide whether to remove the `saveRoomSnapshot` write effect, dead storage helpers, and stale smoke helpers in a separate cleanup pass after cutover or as an optional hygiene step
- `target_chapter`: `legacy room-snapshot write-cache cleanup`
- `status`: `planned`

### RF-2026-04-15-05

- `id`: `RF-2026-04-15-05`
- `date`: `2026-04-15`
- `source`: strategist closeout review during `Core semantic cutover from snapshot arbitration`
- `finding`: internal recovery naming and log tags still use `bootstrap-*` vocabulary after the settled recovery contract moved to state-first replica semantics
- `why_deferred`: visible debug contract, smoke contract, and core runtime state already use settled recovery outcome and settled slice sources; renaming internal refs and log tags is hygiene work and does not block chapter closure
- `expected_action`: decide whether to rename remaining `bootstrap-*` refs, helper names, and log tags in a separate cleanup pass after cutover
- `target_chapter`: `internal recovery naming/log cleanup`
- `status`: `planned`

### RF-2026-04-16-01

- `id`: `RF-2026-04-16-01`
- `date`: `2026-04-16`
- `source`: strategist review during `browser-local participant identity stabilization` closure
- `finding`: attempted same-browser cross-tab leave propagation automation emits `yjs` warning `Tried to remove event handler that doesn't exist.`
- `why_deferred`: chapter closure already has acceptable runtime behavior and honest human proof; the warning is a teardown-order hygiene issue rather than a blocker for the participant identity model
- `expected_action`: review room/presence/creator teardown ordering during same-browser cross-tab leave propagation and remove the warning in a separate narrow runtime cleanup pass
- `closure_result`: `roomCreatorRealtime` teardown is now idempotent; the same-browser two-tab leave probe returns both tabs to entry state without the `yjs` warning locally or on the hosted deploy
- `target_chapter`: `same-browser leave propagation warning cleanup`
- `status`: `closed`

### RF-2026-04-16-02

- `id`: `RF-2026-04-16-02`
- `date`: `2026-04-16`
- `source`: strategist review after `sprint/cleanup-lint-boardstage-foundation` reached its `BoardStage` checkpoint
- `finding`: cleanup sprint brought `BoardStage` close to the agreed orchestration-shell target, and the next deferred semantic/runtime review item is still `participant-marker / creator-color`
- `why_deferred`: cleanup sprint intentionally stayed out of participant-marker semantics, creator-color fallback truth, and creator-linked rendering behavior
- `expected_action`: review `participant-marker / creator-color` as the next candidate chapter and decide whether the accepted creator-color fallback gap is real in current runtime behavior before implementing the durable room-scoped last-known participant appearance fallback by `creatorId`
- `closure_result`: the gap was partially confirmed; room-scoped `participantAppearance` now provides `room-document` fallback, creator color now resolves as `live -> room-document -> legacy-fill`, precise creator-color source inspectability exists, and the remaining abrupt-tab-close liveness issue was split into a separate follow-up
- `target_chapter`: `participant-marker / creator-color`
- `status`: `closed`

### RF-2026-04-16-03

- `id`: `RF-2026-04-16-03`
- `date`: `2026-04-16`
- `source`: strategist review after `BoardStage` cleanup sprint checkpoint closure
- `finding`: the cleanup branch changed `BoardStage` structure substantially through scene, shell, dev-tools, and helper extraction, but hosted truth for that checkpoint is still unverified
- `why_deferred`: the sprint was intentionally local and branch-scoped; hosted validation belongs after the checkpoint is pushed or merged
- `expected_action`: run hosted playable-session validation against the cleanup checkpoint after deploy, with explicit checks for board scene rendering, shell overlays, note editor overlay, selected-image controls, and dice/top-layer behavior
- `target_chapter`: `hosted validation after BoardStage cleanup checkpoint`
- `closure_result`: exact preview deploy was verified against branch `HEAD`; note editor overlay and hosted debug gate hotfixes were confirmed there; hosted probes and manual checks did not show a branch-specific blocker, so the cleanup checkpoint is merge-ready
- `status`: `closed`

### RF-2026-04-16-04

- `id`: `RF-2026-04-16-04`
- `date`: `2026-04-16`
- `source`: strategist review during hosted validation of the cleanup checkpoint
- `finding`: cleanup preview showed delayed room hydration and visibly staged object arrival, but current live hosted deploy appears to load the same kind of room much faster and more coherently
- `why_deferred`: current evidence points to a branch-specific or preview-specific regression candidate rather than a proven general hosted performance problem; the hotfix batch should stay narrow and fix the concrete regressions first
- `expected_action`: compare cleanup preview against current live on fresh room ids and determine whether the delayed participant-marker and staged note/image arrival come from branch-specific hydration behavior, preview config, or room-state noise before opening a broader performance pass
- `target_chapter`: `cleanup preview room-hydration regression investigation`
- `closure_result`: preview and current live show the same staged hydration waves and the same multi-context slowdown pattern; same-tab `1 -> 2 -> 3` reopening does not degrade monotonically on the cleanup preview, so branch-specific regression is not confirmed
- `status`: `closed`

### RF-2026-04-16-05

- `id`: `RF-2026-04-16-05`
- `date`: `2026-04-16`
- `source`: strategist review after hosted comparison between the cleanup preview and current live
- `finding`: hosted room open still arrives in staged waves across token/image/note slices, and slowdown becomes more visible when multiple room contexts stay live in the same browser session
- `why_deferred`: cleanup checkpoint is safe to merge; the remaining issue belongs to general hosted/runtime coordination rather than to branch-specific cleanup regressions
- `expected_action`: inspect bootstrap coordination, separate token/image/text-card shared-slice connection startup, and durable snapshot failure noise during room open before opening a broader hosted performance chapter
- `closure_result`: measurement identified bootstrap coordination as the main bottleneck; a narrow `scene-usable` split and a live-attach follow-up materially moved the early usable boundary on hosted deploys; post-split re-benchmark confirmed the main attach/live mismatch is closed, and no further hydration implementation slice is active now
- `target_chapter`: `hosted room hydration and bootstrap coordination`
- `status`: `closed`

### RF-2026-04-16-06

- `id`: `RF-2026-04-16-06`
- `date`: `2026-04-16`
- `source`: strategist closeout review after the creator-color room-document fallback checkpoint
- `finding`: creator-color fallback now works through `room-document`, but abrupt tab close still leaves stale `live-occupancy`, so `room-document` fallback does not activate in that path
- `why_deferred`: creator-color fallback itself reached an honest checkpoint; unload-cleanup and occupancy-freshness experiments did not close the abrupt-close liveness path and were reverted
- `expected_action`: open a separate room-occupancy liveness follow-up for abrupt tab close, verify which source still keeps occupancy alive, and implement a truthful teardown/staleness model there instead of mixing more liveness hacks into the closed creator-color checkpoint
- `target_chapter`: `tab-close room-occupancy liveness`
- `status`: `planned`
