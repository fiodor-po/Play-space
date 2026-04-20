# Task Brief — IndexedDB Local Replica Phase 1

## Task
Перевести browser-local room-document replica с `localStorage` на `IndexedDB`
и добавить узкий same-browser recovery read bridge.

## Goal
После этого pass committed room content должен:

- писаться в IndexedDB на commit boundary;
- восстанавливаться в том же браузере быстрее и надёжнее;
- не зависеть от `localStorage` quota;
- сохранять active-room `live-wins` behavior и durable shared truth semantics.

## Constraints
- Не менять room identity semantics.
- Не менять live transport contracts широко.
- Не менять image interaction behavior.
- Не менять empty-space pan/zoom semantics.
- Не смешивать participant-marker / creator-color follow-up в этот pass.
- Не вводить local delta-log, compaction, merge logic, new ops UI, or broad backend reshaping.

## Relevant context
- Current room-document write-side foundation already exists.
- Current `localStorage` path can hit quota on realistic image-heavy rooms.
- Accepted first local-replica baseline is:
  - `IndexedDB`
  - one full room-document replica per room
- Delta-log design is deferred.

## Files to inspect first
- `docs/01_CURRENT_STATE/ROADMAP.md`
- `docs/00_AGENT_OS/CURRENT_CONTEXT.md`
- `docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-document-persistence-target-memo.md`
- `docs/90_ARCHIVE/02_HISTORICAL_BASELINE/refactor-plan.md`
- `src/lib/storage.ts`
- `src/board/runtime/useBoardObjectRuntime.ts`
- `src/components/BoardStage.tsx`

## Deliverables
- IndexedDB adapter for local room-document replica storage
- write-side switched from `localStorage` to IndexedDB
- narrow bootstrap read bridge for same-browser recovery
- minimal inspectability for verifying read/write behavior
- concise executor report with changed files, validation, and risks

## Validation
- `npm run build`
- Manual QA:
  - image drag end -> refresh
  - image transform end -> refresh
  - image draw commit -> refresh
  - same-browser reopen after short leave
  - second-browser reopen still respects durable/shared truth
  - DevTools verification that IndexedDB room-document replica entry exists and updates on commit boundary
- If lint is run, report pre-existing `BoardStage.tsx` failures separately from new regressions.

## Stop conditions
- Stop if the work starts redesigning the whole persistence stack.
- Stop if the work needs broad merge/arbitration logic.
- Stop if the work starts changing room bootstrap semantics beyond the narrow same-browser recovery bridge.
- Stop if the work starts pulling participant-marker fallback semantics into this pass.
