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
- `why_deferred`: current slice intentionally stopped at local read semantics and did not remove the compatibility path
- `expected_action`: keep the fallback as a compatibility path for now and review whether it should narrow further during `Durable write model`
- `target_chapter`: `Durable write model`
- `status`: `planned`
