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

Для narrative history используй `play-space-alpha_case-study-log.md`.

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
   - `ROADMAP.md`
   - `play-space-alpha_current-context.md`
   - `play-space-alpha_case-study-log.md` when the workflow lesson or milestone matters
4. update the entry status in the same pass.

## Open entries

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
