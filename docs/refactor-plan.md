# Refactor Plan

Status: supporting architecture migration companion  
Last updated: 2026-04-15

This document is a supporting architecture migration companion for the repo.

Primary current control docs are:

- `ROADMAP.md` for live priorities and chapter order;
- `play-space-alpha_current-context.md` for operational handoff state;
- `docs/room-document-replica-map.md` for the human-facing control map of the
  replica migration track.

It is no longer the older broad leaf-extraction-first ladder.
It now follows the accepted post-`App` / post-narrow-`BoardStage` checkpoint framing:

- `App.tsx` structural hotspot is closed for the current phase;
- narrow `BoardStage.tsx` cleanup chapter is checkpoint-closed;
- `room document persistence / recovery architecture` is now the active migration track;
- the chosen strategy is `parallel replacement`:
  - keep the current product surface;
  - build the target room-document replica model beside the current snapshot-arbitration model;
  - cut over by phases;
- the first narrow `IndexedDB` local-replica checkpoint is complete;
- `participant-marker / creator-color` remains a later follow-up chapter after persistence/recovery stabilization;
- backend/runtime reshaping stays later unless it becomes the main blocker again.

`ROADMAP.md` remains the live project-plan and priority source.
This file remains architecture-oriented reference context, not the primary
current control document.

## 1. Goal

Move the repo toward a room-document-replica persistence model that preserves
current product behavior while making recovery and durability correct.

The target is not:

- a broad rewrite;
- a heavy VTT scene/entity model;
- a hook-splitting exercise for its own sake.

The target is:

- `App` owns room/session lifecycle;
- `src/app/*` owns room-level transport hooks;
- board runtime still moves toward clearer ownership;
- committed room content should be modeled as one logical room document;
- that room document should have:
  - a browser-local replica
  - a live collaboration replica
  - a durable server replica
- persistence eligibility should be decided at commit boundary, not by broad
  late effect windows;
- `BoardStage` stays the Konva/Stage integration surface rather than becoming a
  second hidden board-runtime store;
- object families and interaction families become clearer over phased passes;
- creator-linked fallback semantics later move to the accepted target model:
  - `creatorId` in durable room identity
  - snapshot-backed room-scoped last-known participant appearance
  - only temporary legacy object-color fallback after that

## 2. Current accepted target architecture

### App shell

Owns:

- boot and reset-policy gate;
- room route split;
- draft vs joined-room lifecycle;
- browser-local participant session lifecycle;
- creator/governance/media/dice/ops composition.

### Room/runtime adapters

Own:

- entry availability and join-claim logic;
- joined-room presence transport;
- durable room identity;
- durable room snapshot;
- client reset policy;
- room ops API.

### Room document replicas

The accepted target model for committed board content is:

- one logical room document;
- browser-local persistent replica;
- live replica through active collaboration transport;
- durable server replica;
- awareness separated from the room document.

This is a logical model first.
It does not require immediate transport unification into one physical Yjs
document in phase 1.

### Board runtime

Should still become the explicit owner of:

- room-scoped board object store;
- board commands;
- sync composition/routing;
- persistence coordination for board runtime state.

The persistence side of that work now sits inside the room-document-replica
chapter rather than as a separate later detail.

### Board integration surface

`BoardStage` should remain the sensitive Konva/Stage coordinator that owns:

- Stage pointer/wheel event bridge;
- empty-space pan/zoom ordering;
- overlay composition;
- mapping runtime output into render nodes.

### Object families

Object-family ownership should become more explicit for:

- `token`
- `note-card`
- `image`

### Interaction families

Interaction ownership should gradually clarify around:

- generic selection / move / edit;
- viewport/navigation;
- the intentionally sensitive image corridor.

### Backend runtime

The backend remains one practical alpha boundary for now:

- websocket docs;
- durable room identity;
- durable room snapshot;
- ops;
- reset policy;
- LiveKit token route.

## 3. What must not change during this migration

- no broad rewrite of `src/components/BoardStage.tsx`;
- no casual change to empty-space pan/zoom semantics;
- no casual change to image drag / resize / draw / preview behavior;
- no room bootstrap priority changes without explicit design work;
- no auth/account/member-management drift;
- no backend service split as part of the next frontend runtime phase.

## 4. Phase plan

### Phase 0 — Audit and plan refresh

Status:

- completed

Purpose:

- replace the old historical planning baseline with the current target-oriented
  architecture map and migration order.

Files:

- `docs/refactor-audit.md`
- `docs/refactor-plan.md`
- `ROADMAP.md`
- `play-space-alpha_current-context.md`

Validation:

- docs-only consistency check

Stop conditions:

- if the plan starts depending on a broad rewrite, stop and rescope.

### Phase 1 — Room document persistence / recovery architecture

Status:

- active migration track

Purpose:

- replace snapshot-arbitration thinking with room-document replica thinking;
- keep the product surface stable while persistence and recovery move under it;
- establish the phased bridge from the current model to the accepted target
  model.

Current state inside this phase:

- `Phase 1A — Narrow commit-boundary persistence phase` is checkpoint-complete;
- the broader migration track remains open;
- next required internal replica-track steps are:
  - local replica semantics;
  - durable write model;
  - recovery convergence model;
  - final cutover from snapshot arbitration.

Likely focus areas:

- commit-boundary persistence policy;
- IndexedDB-backed local replica foundation;
- local replica read semantics;
- durable write model;
- recovery convergence model.

Files likely touched:

- `src/components/BoardStage.tsx`
- `src/board/runtime/*`
- `src/lib/storage.ts`
- `src/lib/durableRoomSnapshot.ts`
- `scripts/yjs-dev-server.mjs`
- focused room-memory / planning docs

Must not change:

- room identity semantics;
- live-wins behavior for active rooms;
- pan/zoom semantics;
- image interaction semantics;
- participant-marker semantics;
- creator-color fallback semantics;
- backend service topology.

Validation:

- `npm run build`
- `npm run smoke:e2e` for board/runtime/recovery changes inside this phase
- manual QA for:
  - quick leave / re-enter
  - refresh recovery
  - same-browser reopen
  - second-browser reopen
  - image drag/resize/draw commit boundaries
  - live room still staying live-wins

Stop conditions:

- if the work starts rewriting all live transport in one phase, stop;
- if the work starts forcing backend service split, stop;
- if the work starts mixing participant-marker logic into persistence work, stop.

### Phase 1A — Narrow commit-boundary persistence phase

Purpose:

- define and honor commit boundaries for committed room content;
- remove reliance on late effect windows for known loss corridors;
- make committed mutations persistence-eligible immediately;
- persist those committed mutations into an IndexedDB-backed full local replica
  as the first browser-local baseline.

Files likely touched:

- `src/components/BoardStage.tsx`
- `src/board/runtime/*`
- selected persistence helpers
- `src/lib/storage.ts`

Must not change:

- room identity semantics;
- live-wins priority;
- image interaction behavior itself;
- participant-marker semantics;
- creator-color fallback semantics.

Validation:

- `npm run build`
- manual QA for:
  - image drag end + immediate leave/reload
  - image transform end + immediate leave/reload
  - draw commit + immediate leave/reload
  - empty-room first committed mutation
  - DevTools verification that IndexedDB room-document replica records are
    written at commit boundary
  - same-browser and second-browser recovery where applicable

Stop conditions:

- if the work starts redesigning the whole persistence stack, stop;
- if the work starts changing interaction semantics, stop;
- if the work cannot be expressed as commit-boundary discipline, stop.

Current concrete slice for Phase 1A:

- replace `localStorage` as the browser-local room-document replica base with
  `IndexedDB`;
- keep one full local room-document replica per room;
- keep active-room `live-wins` behavior;
- add a narrow same-browser recovery bridge that can read the IndexedDB replica
  before durable/live convergence finishes.

Phase 1A current result:

- complete as the first narrow checkpoint;
- not equivalent to closing the full room-document replica migration track.

### Phase 2 — Local replica semantics

Status:

- completed

Purpose:

- turn browser-local room snapshot into an explicit local replica of the room
  document instead of a competing fallback snapshot;
- refine read/convergence semantics after the IndexedDB local baseline exists.

Files likely touched:

- `src/lib/storage.ts`
- board runtime / persistence modules
- `src/components/BoardStage.tsx`

Must not change:

- room identity semantics;
- active-room live-wins behavior;
- current transport contracts unless required narrowly.

Validation:

- `npm run build`
- `npm run smoke:e2e` for board/runtime/recovery changes inside this phase
- manual QA for:
  - refresh in the same browser
  - reopen after short leave/offline gap
  - correct use of the fresher same-browser local replica without changing
    shared truth

Stop conditions:

- if the work starts introducing broad merge logic, stop.

### Phase 3 — Durable write model

Purpose:

- move durable persistence from whole-room ad hoc timing toward a clearer
  update/checkpoint model.

Files likely touched:

- `src/lib/durableRoomSnapshot.ts`
- `scripts/yjs-dev-server.mjs`
- board runtime / persistence modules

Must not change:

- room identity layer;
- awareness separation;
- room interaction semantics.

Validation:

- `npm run build`
- `npm run smoke:e2e` for board/runtime/recovery changes inside this phase
- manual QA for:
  - durable recovery after live room disappears
  - conflict handling
  - same-browser vs second-browser consistency

Stop conditions:

- if this begins forcing backend service split, stop.

### Phase 4 — Recovery convergence

Purpose:

- remove snapshot winner-picking as the main model and move toward replica
  convergence.

Files likely touched:

- board runtime / storage modules
- `src/components/BoardStage.tsx`

Must not change:

- live-wins for active rooms;
- room identity precedence;
- board interaction behavior.

Validation:

- `npm run build`
- manual QA for:
  - refresh
  - quick leave / re-enter
  - same-browser reopen
  - second-browser reopen
  - live room still beating durable/local state

Stop conditions:

- if this starts requiring a full live-transport rewrite in one pass, stop.

### Phase 5 — Board runtime ownership and object-family cleanup

Purpose:

- continue explicit board runtime ownership once the persistence spine is on the
  accepted replica path;
- continue object-family ownership work from a cleaner base.

### Phase 6 — Participant-marker / creator-color chapter

Purpose:

- resolve participant-marker ownership and creator-linked fallback truth on top
  of a clearer token/runtime boundary.

Accepted target direction for this phase:

- `creatorId` remains durable room identity truth;
- live participant state remains the primary current name/color source;
- snapshot-backed room-scoped last-known participant appearance becomes the
  non-live fallback;
- temporary legacy object-color fallback can remain only as migration residue.

Files likely touched:

- creator-color resolution paths
- participant-marker runtime
- durable room snapshot shape and adapter
- app-layer participant session update writers

Must not change:

- room identity semantics;
- auth/member-platform scope;
- board runtime chapter goals by pulling them back into this phase.

Validation:

- `npm run build`
- manual QA for:
  - creator-colored token fallback on refresh/leave/rejoin
  - participant-marker behavior
  - rename/recolor propagation

Stop conditions:

- if the phase starts drifting into full participant management or auth, stop.

### Phase 7 — Backend/runtime maintainability work

Purpose:

- later cleanup for backend single-file maintainability or hosted durability
  needs, only after frontend runtime and creator-fallback chapters are clearer.

Files likely touched:

- `scripts/yjs-dev-server.mjs`
- related server/runtime adapters

Must not change:

- current frontend runtime contracts unless this later chapter explicitly says so.

Validation:

- chapter-specific; not current priority

Stop conditions:

- if backend reshaping is not the current top blocker, keep this in backlog.

## 5. Why this phase order is the current preferred order

- It follows the accepted current hotspot map:
  - `App` no longer dominates
  - persistence/recovery correctness now dominates
- It treats local and durable room state as future replicas of one logical room
  document instead of continuing to patch snapshot arbitration
- It keeps creator-color work after persistence/recovery stabilization
- It avoids spending the next major step on backend service internals when the
  stronger product/runtime signal is still in room-content correctness

## 6. Recommended next phase only

The next internal replica-track implementation chapter should be:

- **Phase 3 — Durable write model**

Short reason:

- local read/write semantics are now version-aware enough to leave the browser-local fallback stage;
- durable persistence remains the next unresolved replica-track correctness layer;
- this keeps the migration moving without reopening bootstrap work immediately.

## 7. Relationship to current roadmap phase

This plan supports the active `ROADMAP.md` phase by turning the completed
architecture work into a concrete persistence/recovery migration sequence.

Immediate roadmap-aligned result:

- room-document replica chapter chosen as the new active architecture track
- phase-1 `narrow commit-boundary persistence phase` checkpoint completed
- `Local replica semantics` completed as the next internal replica-track step
- next internal replica-track step: `Durable write model`
- later follow-up chapter remains: `participant-marker / creator-color`
