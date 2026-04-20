# Board Runtime Staged Roadmap

Status: accepted staged roadmap for the board-runtime target architecture  
Date: 2026-04-20

Related docs:

- `docs/04_ARCHITECTURE/01_RUNTIME/board-runtime-target-architecture.md`
- `docs/04_ARCHITECTURE/00_OVERVIEW/ARCHITECTURE.md`
- `docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-document-persistence-target-memo.md`
- `docs/01_CURRENT_STATE/ROADMAP.md`
- `docs/00_AGENT_OS/CURRENT_CONTEXT.md`

## 1. Conclusion

Runtime architecture evolves through narrow bridge phases.

The safe order is:

1. finish room-open runtime ownership and diagnostics;
2. introduce `RoomRuntime` on top of current adapters;
3. introduce `RoomDocumentV1`;
4. move image writes to asset references with legacy read compatibility;
5. separate tool ownership;
6. revisit physical transport unification later.

This roadmap does not change the current active chapter.
It gives the next safe architecture track after explicit planning promotion.

## 2. Global guardrails

Every phase preserves these invariants:

- empty-space panning stays intact;
- image drag / resize / draw semantics stay intact;
- active-room live truth keeps priority;
- current hosted baseline stays valid;
- current room-open semantics stay intact unless a later approved chapter
  changes them;
- current accepted recovery model stays intact until a later aligned cutover.

Every phase also keeps these constraints:

- no broad `BoardStage` rewrite;
- no sync-vendor change;
- no canvas-engine change;
- no backend service split as part of this roadmap;
- no forced one-`Y.Doc` rewrite before the later transport phase.

## 3. Phase status map

### Phase 1 — Room-open runtime and diagnostics ownership

Status:

- active through the current chapter `room loading progress and async-state polish`

Purpose:

- make room-open state a runtime-owned model instead of a `BoardStage` effect
  graph;
- make phase diagnostics available outside the UI shell.

Scope:

- define the runtime-facing room-open model;
- keep canonical phase keys and statuses;
- make Dev tools read a room-owned diagnostics model instead of local shell-only
  state;
- document the first `RoomRuntime` API surface.

First contract to define:

```ts
type RoomRuntimeOpenPhaseKey =
  | "room-activation"
  | "shared-transport-attach"
  | "shared-bootstrap-sync"
  | "local-replica-read"
  | "durable-snapshot-read"
  | "bootstrap-decision"
  | "scene-usable"
  | "room-settled";

type RoomRuntimeStatus = {
  roomId: string;
  phases: Record<RoomRuntimeOpenPhaseKey, RoomOpenInspectionPhase>;
  isSceneUsable: boolean;
  settledState: "pending" | "ready" | "failed";
};
```

Acceptance:

- room-open phase graph is readable without direct `BoardStage` ownership;
- phase diagnostics are available outside the UI shell;
- ordinary room-open behavior stays unchanged.

Validation:

- `npm run build`
- targeted fresh-room open
- targeted broken-backend or stopped-transport probe when safely reproducible
- Dev tools verification for room-scoped phase outputs

Stop conditions:

- if the work starts changing room-open semantics instead of ownership;
- if the work starts changing recovery truth instead of diagnostics ownership.

### Phase 2 — `RoomRuntime` bridge extraction

Status:

- candidate later phase

Purpose:

- move room lifecycle, adapter wiring, and recovery orchestration into one
  room-scoped coordinator while keeping current adapters.

Scope:

- introduce `RoomRuntime`;
- move transport attach/detach and status ownership there;
- move local/durable replica orchestration there;
- keep current token/image/text-card/presence adapters unchanged at the
  transport boundary;
- make `BoardStage` consume runtime outputs.

Core API target:

```ts
type RoomRuntimeApi = {
  openStatus: RoomRuntimeStatus;
  boardDocument: RoomDocumentLike;
  presence: RoomPresenceLike;
  diagnostics: RoomDiagnosticsViewModel;
  actions: {
    leaveRoom: () => void;
    retryRoomOpen: () => void;
  };
};
```

Acceptance:

- `BoardStage` no longer owns room-open state graph directly;
- room transport and recovery wiring have one room-scoped owner;
- current room-open semantics stay intact.

Validation:

- `npm run build`
- `npm run smoke:e2e`
- manual QA for join, leave, refresh, same-browser reopen, live-room reopen

Stop conditions:

- if the phase starts changing current board interaction behavior;
- if transport adapters are being rewritten instead of wrapped.

### Phase 3 — `RoomDocumentV1` schema boundary

Status:

- candidate later phase

Purpose:

- introduce the first typed and versioned room-document contract.

Scope:

- define `RoomDocumentV1` envelope;
- define typed record families for `imageObject`, `tokenObject`,
  `noteCardObject`, `participantAppearance`;
- add schema version and migrations;
- add validation at document boundaries;
- keep current adapter topology.

First schema target:

```ts
type RoomDocumentV1 = {
  schemaVersion: 1;
  roomId: string;
  revision: number;
  content: {
    images: Record<string, ImageObjectRecordV1>;
    tokens: Record<string, TokenObjectRecordV1>;
    noteCards: Record<string, NoteCardObjectRecordV1>;
    participantAppearance: Record<string, ParticipantAppearanceRecordV1>;
  };
};
```

Acceptance:

- document contract is typed and versioned;
- local replica and durable snapshot can read/write the same schema family;
- current runtime semantics stay intact.

Validation:

- `npm run build`
- schema migration tests
- local replica read/write checks
- durable snapshot read/write checks
- smoke validation for current room content flows

Stop conditions:

- if the phase expands into asset migration;
- if the phase expands into full transport unification.

### Phase 4 — `BoardStage` composition-shell cut

Status:

- candidate later phase

Purpose:

- finish the ownership cut where `BoardStage` is a render/composition shell.

Scope:

- keep stage pointer/wheel bridge in `BoardStage`;
- keep scene/overlay/devtools composition in `BoardStage`;
- move room/runtime ownership fully out;
- keep interaction behavior stable while ownership changes.

Acceptance:

- `BoardStage` acts as composition shell;
- room-open graph, transport ownership, and replica orchestration live outside
  `BoardStage`;
- shell still preserves current interaction behavior.

Validation:

- `npm run build`
- `npm run smoke:e2e`
- manual QA for pan, zoom, selection, image draw, note edit, leave/rejoin

Stop conditions:

- if the phase starts changing empty-space pan ordering;
- if the phase starts changing image interaction semantics.

### Phase 5 — Asset-reference write path

Status:

- candidate later phase

Purpose:

- move image writes away from embedded `data:` URLs.

Scope:

- add asset reference fields to image document records;
- keep legacy read path for existing `data:` images;
- make new image writes produce asset references;
- keep durable snapshot and local replica aligned with the new record shape.

Migration rules:

- existing `data:` URL images continue to read through the legacy path;
- new writes go through asset references;
- hard migration of old rooms is optional and may stay deferred;
- physical transport unification stays later.

Acceptance:

- current images still load after migration;
- new image writes no longer embed binary into room objects;
- room document and persistence payloads shrink for the new path.

Validation:

- `npm run build`
- image add/move/resize/draw smoke checks
- same-browser reopen of old and new image records
- hosted add-image and reopen checks

Stop conditions:

- if the phase starts bundling object-storage platform hardening;
- if the phase starts changing image interaction UX at the same time.

### Phase 6 — Tool ownership separation

Status:

- candidate later phase

Purpose:

- move interaction logic to dedicated tool modules after document and runtime
  boundaries are stable.

Scope:

- selection;
- drag;
- transform;
- draw;
- note editing;
- interaction arbitration;
- keyboard shortcuts.

Acceptance:

- tool modules talk to document commands and awareness helpers;
- renderers stop owning cross-object interaction rules.

Validation:

- `npm run build`
- `npm run smoke:e2e`
- targeted manual QA for every moved tool family

Stop conditions:

- if tool extraction starts redesigning product semantics in the same pass.

### Phase 7 — Physical transport topology cleanup

Status:

- candidate later phase

Purpose:

- revisit whether one physical room document transport is worth the migration
  cost after runtime, schema, and asset boundaries are stable.

Scope:

- evaluate one-`Y.Doc` or equivalent physical topology only after earlier phases
  land;
- preserve one logical room-document contract regardless of physical topology.

Acceptance:

- physical transport cleanup gives clear runtime or maintenance benefit;
- migration cost is justified by real product/runtime gain.

Validation:

- architecture review first
- then normal build/smoke/manual QA if implementation is approved

Stop conditions:

- if the change is driven by aesthetic cleanup rather than product/runtime
  benefit.

## 4. Relationship to the current roadmap

This roadmap supports the current active chapter and the current next-chapter
order.

Current truth:

- Phase 1 aligns with `room loading progress and async-state polish`;
- `Mobile experience` stays the next chapter by the current roadmap;
- phases `2–7` stay candidate architecture work until explicit planning
  promotion.

## 5. What this roadmap intentionally avoids

- broad cleanup for aesthetics;
- mixed feature + refactor bundles;
- transport topology change before room/runtime boundaries are stable;
- asset migration before typed document boundary exists;
- tool rearchitecture before runtime/document ownership is explicit.
