# ExecPlan: Board Architecture Phase Plan

> Status: historical baseline, not current execution plan.
>
> This document is materially outdated as of 2026-04-14.
> It reflects an older architecture-planning snapshot and should not be treated
> as the current phase plan for the repo.
>
> Use it only as an old reference for broad direction.
> For current priorities, sequencing, and active chapters, use:
> - `ROADMAP.md`
> - `play-space-alpha_current-context.md`
>
> Practical rule:
> - do not treat the phases in this file as the live migration order without
>   re-checking the repo and current docs first.

## 1. Goal

Reorganize the repo toward clearer boundaries between app shell, board domain, per-object ownership, and sync/presence/persistence, while preserving current multiplayer board behavior. The immediate target is to reduce `BoardStage.tsx` responsibility through small extractions rather than a broad rewrite.

`ROADMAP.md` remains the live project-plan, backlog, and decision-log document; this file remains architecture-specific.

## 2. In Scope

- Architectural planning for:
  - app/UI shell vs board domain split
  - board object split by type
  - interaction/tool logic separation from renderers
  - sync/presence/persistence separation from rendering
  - incremental reduction of `BoardStage` responsibility
- Documentation outputs:
  - `docs/refactor-audit.md`
  - `docs/refactor-plan.md`
- Recommended Phase 1 only, with no production code changes in this run.

## 3. Out of Scope

- Any production code changes in this run.
- Broad rewrite of `src/components/BoardStage.tsx`.
- Changes to current interaction semantics.
- New product functionality.
- Heavy-VTT style architecture changes.

## 4. Current Architecture Summary

- `src/App.tsx` owns room selection, join flow, participant session bootstrap, and presence connection lifecycle.
- `src/components/BoardStage.tsx` owns almost everything else:
  - viewport state and Stage event handling
  - board object state
  - selection/edit/drawing/transform interaction state
  - room object sync setup
  - persistence writes
  - image loading cache
  - cursor overlay rendering
  - participant panel and top toolbar shell UI
  - per-object Konva render logic
- Realtime sync is already split by object family in `src/lib/roomTokensRealtime.ts`, `src/lib/roomImagesRealtime.ts`, and `src/lib/roomTextCardsRealtime.ts`.
- Presence is already a separate awareness transport in `src/lib/roomPresenceRealtime.ts`.
- The main architectural problem is not missing modules; it is that `BoardStage` is currently orchestrating too many of them directly.

## 5. Target Architecture

### Desired ownership split

- App/UI shell
  - join flow
  - room routing
  - participant shell controls
  - top-level orchestration
- Board domain
  - board object state and commands
  - viewport math
  - selection state
  - tool/interactions state
  - board composition
- Object modules by type
  - image
  - text-card
  - token
- Transport/persistence
  - sync adapters per room object family
  - presence awareness
  - local persistence

### Practical target for `BoardStage`

- Keep it as the integration surface during migration.
- Shrink it into a coordinator that wires:
  - board state
  - interaction callbacks
  - renderer components
  - sync adapters
- Avoid changing sensitive image/panning behavior until after safer extractions land.

## 6. Migration Plan

### Phase 0: Audit and docs

Purpose:
- Create a shared map before changing production code.

Files likely touched:
- `docs/refactor-audit.md`
- `docs/refactor-plan.md`

Validation:
- Confirm docs match `AGENTS.md` and `PLANS.md`.

Rollback / stop conditions:
- None. Documentation only.

### Phase 1: Safe leaf extraction with no behavior change

Purpose:
- Reduce `BoardStage` size and improve boundaries without moving sensitive behavior.

Files likely touched:
- `src/components/BoardStage.tsx`
- new board shell/render helper files under a new `src/board/` or `src/components/board/` slice
- possible helper moves from `src/lib/` into board-specific modules

Recommended contents:
- Extract pure board constants and viewport helpers.
- Extract cursor overlay component.
- Extract participant/session panel component.
- Extract top toolbar component.
- Extract token renderer component.
- Extract text-card renderer component.

Explicitly not in Phase 1:
- No change to Stage pan/zoom handlers.
- No change to image renderer behavior.
- No change to image draw/resize/preview flow.
- No change to Yjs transport contracts.
- No type-model redesign yet.

Validation:
- `npm run build`
- Manual QA:
  - empty-space mouse panning
  - touch panning if supported now
  - wheel zoom around pointer
  - room switching
  - presence cursor rendering
  - token create/drag/delete
  - text-card create/drag/edit via header handle
  - image add/drag/resize/draw/clear

Rollback / stop conditions:
- If extraction forces event-order changes in Stage or image handlers, stop and split further.
- If extracted components need direct access to transport refs, stop and keep them presentational-only.
- If text-card handle drag behavior changes, roll back and reduce scope.

### Phase 2: Shell/UI split from board domain

Purpose:
- Move non-board shell UI out of `BoardStage` while keeping behavior stable.

Files likely touched:
- `src/components/BoardStage.tsx`
- new shell/overlay components

Likely moves:
- session panel
- room change affordance
- participant color/name controls
- top-right creation toolbar
- cursor overlay composition

Validation:
- `npm run build`
- Manual QA for room switching, participant editing, and overlay interactions.

Rollback / stop conditions:
- If overlay extraction requires changing board state ownership, stop and keep extraction prop-driven.

### Phase 3: Per-object module split

Purpose:
- Establish ownership boundaries by object type.

Files likely touched:
- `src/types/board.ts`
- `src/lib/boardImage.ts`
- `src/lib/boardObjects.ts`
- new object-specific modules
- `src/components/BoardStage.tsx`

Likely moves:
- token creation/render helpers
- text-card creation/render helpers
- image render helpers and factory helpers

Validation:
- `npm run build`
- Manual QA for all object types.

Rollback / stop conditions:
- If the change starts forcing a full data-model rewrite, stop and retain compatibility types.

### Phase 4: Board sync adapter layer

Purpose:
- Separate board-domain mutations from transport details.

Files likely touched:
- `src/components/BoardStage.tsx`
- `src/lib/roomTokensRealtime.ts`
- `src/lib/roomImagesRealtime.ts`
- `src/lib/roomTextCardsRealtime.ts`
- new `board sync` adapter module(s)

Likely moves:
- replace `applyBoardObjectsUpdate` transport branching with adapter calls
- centralize object-kind routing for sync updates

Validation:
- `npm run build`
- Manual QA focused on shared object propagation and room resets.

Rollback / stop conditions:
- If adapter extraction changes when remote updates appear during drag/transform, stop and split image handling into its own narrower step.

### Phase 5: Tool/interactions split

Purpose:
- Move cross-object interaction logic out of render branches.

Files likely touched:
- `src/components/BoardStage.tsx`
- new interaction modules/hooks

Likely moves:
- keyboard shortcuts
- viewport pan/zoom helpers
- text-card edit controller
- selection helpers
- later, image interaction helpers

Validation:
- `npm run build`
- Manual QA focused on event ordering and selection state transitions.

Rollback / stop conditions:
- If event propagation or Konva drag semantics change, stop and narrow to one interaction type at a time.

### Phase 6: Type model tightening

Purpose:
- Move from one broad `BoardObject` shape toward per-kind domain types with compatibility mapping.

Files likely touched:
- `src/types/board.ts`
- object-specific modules
- sync/persistence adapter code

Validation:
- `npm run build`
- Manual QA across all shared object flows.

Rollback / stop conditions:
- If transport/storage compatibility becomes unclear, stop and add adapter types first.

## 7. Validation

For every implementation phase after this planning run:

- Run `npm run build`.
- Verify:
  - room switching still works
  - presence/cursors still work
  - tokens remain shared
  - images remain shared
  - text-cards remain shared
  - manual empty-space panning still works
  - image drag/resize/draw mode behavior is unchanged

Recommended manual QA checklist:

1. Join a room and confirm participant name/color still appear correctly.
2. Switch to another room and confirm object set and presence reset correctly.
3. Create, drag, and delete a token.
4. Create, drag, and edit a text-card, including the header drag handle.
5. Upload an image, drag it, resize it, enter draw mode, draw strokes, save, and clear.
6. Verify a second client still sees presence and shared object updates.
7. Pan on empty space and zoom with the wheel without object interaction regressions.

## 8. Risks

- `BoardStage.tsx` is the sensitive integration seam, especially around Stage event ordering.
- Image interaction is the highest-regression area because it mixes:
  - drawing state
  - awareness locks
  - preview transport
  - local stroke buffering
  - resize stroke rescaling
- Text-card drag and edit behavior is easier than image work, but still depends on specific event behavior.
- Room reset/switch logic touches both local state and remote transport setup.

## 9. Stop Conditions

- The change requires rewriting the Stage event surface instead of extracting leaf pieces.
- The change modifies empty-space panning semantics.
- The change modifies image drag, resize, preview, or draw-mode behavior.
- The change requires changing transport contracts and renderer behavior in the same step.
- The phase no longer leaves the repo buildable at each increment.

## Recommended Phase 1

Recommended Phase 1 is:

- extract board constants and viewport math helpers
- extract cursor overlay UI
- extract participant/session panel UI
- extract top toolbar UI
- extract token creation factory
- extract text-card creation factory
- extract token renderer
- extract text-card renderer

Why this phase first:

- It reduces `BoardStage` responsibility immediately.
- It improves the app-shell vs board-domain split without changing who owns state yet.
- It creates object-by-type footholds for token and text-card work.
- It avoids the repo’s most fragile areas:
  - empty-space panning
  - image drag/resize
  - image draw mode
  - realtime image preview/lock behavior

Success criteria for Phase 1:

- `BoardStage.tsx` becomes smaller and more coordinator-like.
- No behavior changes are introduced.
- New modules are mostly presentational or pure-helper extractions.
- The repo still builds and passes the manual QA flows above.
