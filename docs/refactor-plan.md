# Refactor Plan

Status: current target-oriented architecture plan  
Last updated: 2026-04-14

This document is the current architecture migration plan for the repo.

It is no longer the older broad leaf-extraction-first ladder.
It now follows the accepted post-`App` / post-narrow-`BoardStage` checkpoint framing:

- `App.tsx` structural hotspot is closed for the current phase;
- narrow `BoardStage.tsx` cleanup chapter is checkpoint-closed;
- the next main chapter is `next runtime/object chapter`;
- `participant-marker / creator-color` remains the required follow-up chapter after that;
- backend/runtime reshaping stays later unless it becomes the main blocker again.

`ROADMAP.md` remains the live project-plan and priority source.
This file is the architecture-specific migration companion.

## 1. Goal

Move the repo toward a board-runtime-centered architecture that preserves current
product behavior while making ownership boundaries clearer.

The target is not:

- a broad rewrite;
- a heavy VTT scene/entity model;
- a hook-splitting exercise for its own sake.

The target is:

- `App` owns room/session lifecycle;
- `src/app/*` owns room-level transport hooks;
- board runtime owns room-scoped board state, bootstrap/recovery coordination,
  board commands, sync routing, and persistence coordination;
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

### Board runtime

Should become the explicit owner of:

- room-scoped board object store;
- bootstrap/recovery decisions for board runtime;
- board commands;
- sync composition/routing;
- persistence coordination for board runtime state.

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

### Phase 1 — Explicit board runtime ownership

Status:

- next chapter

Purpose:

- make board runtime ownership more explicit around `BoardStage` without
  changing behavior;
- clarify who owns:
  - room-scoped `objects`
  - board bootstrap/recovery coordination
  - sync composition/routing
  - persistence coordination
- keep `BoardStage` as Konva integration surface rather than a hidden all-in-one
  runtime/store/renderer knot.

Likely focus areas:

- board runtime boundary around the current `BoardStage` object/runtime cluster;
- explicit separation between runtime ownership and render branching;
- safer command/sync ownership seams.

Files likely touched:

- `src/components/BoardStage.tsx`
- new board-runtime-focused modules under `src/board/`
- possibly `src/board/sync/*`
- possibly selected helpers in `src/lib/*`

Must not change:

- pan/zoom semantics;
- image interaction semantics;
- room bootstrap priority;
- participant-marker semantics;
- creator-color fallback semantics.

Validation:

- `npm run build`
- manual QA for:
  - room switch/reset/bootstrap
  - empty-space pan/zoom
  - image drag/resize/draw/preview
  - note-card edit/resize
  - token drag/attachment

Stop conditions:

- if the work starts forcing participant-marker logic into the same phase, stop;
- if the work starts forcing broad `BoardStage` rewrite, stop;
- if the work starts changing Stage event ordering, stop and narrow further.

### Phase 2 — Object-family ownership completion

Purpose:

- complete the board-layer per-object ownership trend, especially the missing
  `image` family boundary.

Files likely touched:

- `src/board/objects/image/*` or equivalent
- existing token/note-card object modules
- board object helpers and selectors
- `src/components/BoardStage.tsx`

Must not change:

- draw/transform/preview semantics;
- attachment behavior;
- realtime propagation semantics.

Validation:

- `npm run build`
- manual QA across all object families

Stop conditions:

- if the work starts forcing a broad type-model rewrite all at once, stop.

### Phase 3 — Command and sync routing clarification

Purpose:

- make board commands and sync routing explicit rather than incidental inside
  `BoardStage` branching.

Files likely touched:

- `src/board/sync/*`
- board runtime modules
- `src/components/BoardStage.tsx`

Must not change:

- remote update timing expectations;
- room-scoped reset semantics;
- current transport contracts unless absolutely necessary.

Validation:

- `npm run build`
- manual QA focused on shared object propagation and recovery

Stop conditions:

- if this begins changing transport protocol rather than ownership boundaries,
  stop and defer.

### Phase 4 — Interaction-family clarification

Purpose:

- move safer generic interaction ownership out first while keeping the image
  corridor intentionally integrated longer.

Files likely touched:

- board interaction helpers/modules
- `src/components/BoardStage.tsx`

Must not change:

- image corridor behavior;
- Stage event ordering;
- generic object drag/edit semantics.

Validation:

- `npm run build`
- manual QA focused on selection, drag, edit, and viewport interactions

Stop conditions:

- if image-sensitive behavior becomes entangled, stop and keep it for a later
  narrower step.

### Phase 5 — Participant-marker / creator-color chapter

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

### Phase 6 — Backend/runtime maintainability work

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
  - `BoardStage` runtime ownership does
- It does not drag participant-marker semantics into the runtime/object phase too
  early
- It keeps creator-color work after the runtime/object chapter where the token
  and board-runtime boundaries are clearer
- It avoids spending the next major step on backend internals when the stronger
  product/runtime signal is still in frontend board ownership

## 6. Recommended next phase only

The next implementation chapter should be:

- **Phase 1 — Explicit board runtime ownership**

Short reason:

- it is the highest-signal structural hotspot now;
- it prepares the repo for the later participant-marker / creator-color chapter;
- it is reachable through narrow phased passes without committing to a broad
  rewrite.

## 7. Relationship to current roadmap phase

This plan supports the active `ROADMAP.md` phase by turning the completed
refreshed architecture/runtime audit into a concrete migration sequence.

Immediate roadmap-aligned result:

- refreshed audit completed
- next chapter chosen: `next runtime/object chapter`
- later follow-up chapter remains: `participant-marker / creator-color`
