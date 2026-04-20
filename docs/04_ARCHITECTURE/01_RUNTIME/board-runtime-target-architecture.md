# Board Runtime Target Architecture

Status: accepted target-architecture ADR  
Date: 2026-04-20

Related docs:

- `docs/04_ARCHITECTURE/00_OVERVIEW/ARCHITECTURE.md`
- `docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-memory-model.md`
- `docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-document-persistence-target-memo.md`
- `docs/04_ARCHITECTURE/01_RUNTIME/board-runtime-staged-roadmap.md`
- `docs/01_CURRENT_STATE/ROADMAP.md`

## 1. Conclusion

`play-space-alpha` moves toward one logical room-document runtime on the current
`React + Konva + Yjs` stack.

Target shape:

- `App` stays app shell;
- `BoardStage` becomes thin composition shell;
- `RoomRuntime` owns room activation, room open, recovery orchestration,
  transport lifecycle, room health, and diagnostics;
- `RoomDocumentV1` owns typed shared board content and its schema version;
- transport stays adapter-based in the near term;
- awareness stays ephemeral and separate from durable room state;
- image binary leaves the room document and moves to asset references;
- tool logic moves out of render orchestration in later phases.

This is the target architecture.
This is not an immediate rewrite order.

## 2. Context

Current runtime already has several strong pieces:

- `App.tsx` already separates join/session shell from `BoardStage`;
- `BoardStageScene`, `BoardStageShellOverlays`, and
  `BoardStageDevToolsContent` already define the right render/UI split;
- `useBoardObjectRuntime` already started a narrow runtime abstraction path;
- room-open inspectability already exists in the current Dev tools surface;
- room-document replica semantics already exist for local replica, durable
  snapshot, and settled recovery.

Current architecture still has four major pressure points:

### A. `BoardStage` still owns too many concerns

`src/components/BoardStage.tsx` still mixes:

- room bootstrap;
- room-open phase wiring;
- recovery coordination;
- realtime attach and sync callbacks;
- durable/local persistence side effects;
- board mutations;
- interaction state;
- Konva event handling;
- render composition;
- inspectability wiring.

### B. Board document shape is too loose

`src/types/board.ts` still uses one broad `BoardObject` shape for:

- image;
- token;
- note-card;
- attachment metadata;
- creator metadata;
- image-specific drawing data.

This shape works for narrow alpha iteration.
It slows schema evolution, validation, migrations, and per-object ownership.

### C. Mutation and transport still sit too close

Current board updates often decide at the same time:

- local mutation result;
- shared slice sync;
- durable slice write;
- recovery-facing side effects.

This shape made the current alpha viable.
It hides boundaries between document commands, transport adapters, and
persistence adapters.

### D. Image binary still lives inside collaborative room content

Current image add flow still stores `data:` URLs directly inside room objects.

That increases:

- sync payload size;
- local replica size;
- durable snapshot size;
- hosted durability risk;
- future asset lifecycle complexity.

## 3. Decision

The project accepts the following target architecture.

Planning assumptions for this target:

- demo preparation and release stay on the current architecture before this
  migration starts;
- current work is in architecture-planning mode rather than mandatory execution
  sequencing;
- backward compatibility with old room states is not required for this
  migration;
- room wipe is an accepted migration tool when the new runtime/document shape is
  introduced;
- bridge code is allowed where it reduces runtime risk, but legacy support is
  not itself a goal.

### 3.1. One logical room document

Committed shared board content is one logical room document per room.

This means:

- one room-scoped document contract;
- one schema version space;
- one migration path;
- one replica story across live, local, and durable state.

This does not force one physical `Y.Doc` immediately.
Current transport adapters stay valid as a bridge.

### 3.2. `RoomRuntime` becomes the room-scoped orchestrator

`RoomRuntime` owns:

- room activation;
- room-open phase state;
- transport attach lifecycle;
- local replica read/write lifecycle;
- durable snapshot read/write lifecycle;
- recovery orchestration;
- room health and diagnostics;
- room-scoped runtime outputs for board, overlays, and Dev tools.

### 3.3. `RoomDocumentV1` becomes the typed shared-content contract

`RoomDocumentV1` is the first explicit schema boundary for committed board
content.

Minimum record families:

- `imageObject`
- `tokenObject`
- `noteCardObject`
- `participantAppearance`

Minimum document envelope:

- `schemaVersion`
- `roomId`
- `revision`
- `content`

### 3.4. Presence stays separate from persisted room state

Awareness/presence remains ephemeral.

It continues to own:

- cursors;
- participant activity;
- temporary drawing locks;
- temporary drag/transform previews;
- lightweight interaction hints.

It does not become persistence or recovery authority.

### 3.5. Assets leave the room document

Image objects move toward asset references instead of embedded binary payloads.

Target image fields:

- `assetId`
- `label`
- `width`
- `height`
- geometry fields
- creator metadata
- draw metadata
- resolved preview/source refs

Migration consequence:

- the target model does not require long-lived support for embedded legacy
  `data:` image records once the new canonical room-document shape is adopted.

### 3.6. `BoardStage` becomes a composition shell

In target state `BoardStage` owns:

- stage event bridge;
- empty-space pan/zoom bridge;
- composition of scene, overlays, and Dev tools;
- wiring runtime outputs into render nodes.

It stops owning the room-open state graph directly.

## 4. Runtime Boundaries

### A. App shell

Owns:

- routing;
- draft room selection;
- join/leave flow;
- participant session bootstrap;
- top-level env gating;
- feature gates.

### B. RoomRuntime

Owns:

- room lifecycle;
- room-open phases;
- transport status;
- replica lifecycle;
- recovery decisions;
- room diagnostics;
- room-scoped runtime outputs.

### C. RoomDocumentV1

Owns:

- typed records;
- schema version;
- migrations;
- validation;
- selectors;
- document commands.

### D. Transport adapters

Own:

- realtime attach/detach;
- inbound remote changes;
- outbound local changes;
- presence publication;
- transport status and failure reasons.

Near-term rule:

- current slice-based adapters stay in place;
- their product-facing owner becomes `RoomRuntime`.

### E. Persistence adapters

Own:

- local replica read/write;
- durable snapshot read/write;
- revision handoff;
- snapshot import/export.

Rule:

- local and durable persistence use the same room-document contract.

### F. Tool engine

Later owner for:

- selection;
- drag;
- transform;
- drawing;
- note editing;
- keyboard shortcuts;
- interaction arbitration.

Rule:

- tools talk to document commands and awareness helpers;
- tools do not own transport contracts.

### G. Scene/UI shell

Owns:

- Konva scene render;
- HTML overlays;
- shell panels;
- Dev tools UI.

## 5. Room-Open Target Model

Room open is an explicit runtime pipeline.

Canonical phase set:

1. `room-activation`
2. `shared-transport-attach`
3. `shared-bootstrap-sync`
4. `local-replica-read`
5. `durable-snapshot-read`
6. `bootstrap-decision`
7. `scene-usable`
8. `room-settled`

Canonical phase statuses:

- `idle`
- `started`
- `ready`
- `missing`
- `failed`
- `skipped`

Every phase can also carry:

- detail string;
- started timestamp;
- updated timestamp;
- reason code when useful.

User-facing loading and recovery copy stays a later derivative layer.

## 6. Invariants

This target architecture preserves the current product/runtime truths:

- empty-space panning semantics stay intact;
- image drag / resize / draw behavior stays intact through the bridge phases;
- live room state keeps priority for active-room truth;
- current hosted baseline remains valid during migration;
- current room-open semantics stay intact until an explicit product/runtime
  chapter changes them;
- current accepted recovery model stays intact until a later approved phase
  replaces it with aligned semantics.

## 7. Non-goals

This decision does not open:

- a broad `BoardStage` rewrite;
- a new canvas engine;
- a new sync vendor;
- a microservice split;
- a production-hardening infrastructure track;
- an auth/member-management platform;
- a forced one-`Y.Doc` transport rewrite in the first phase.

## 8. Consequences

### Benefits

- clearer ownership for room lifecycle and recovery;
- typed and migration-friendly shared content model;
- smaller sync and persistence payloads after asset extraction;
- more predictable AI-assisted iteration through explicit contracts;
- room-open diagnostics that do not depend on UI shell ownership.

### Costs

- more explicit adapter seams;
- schema and migration maintenance;
- asset pipeline work across frontend, backend, and hosted environments;
- temporary bridge code while old and new paths coexist.

### Migration planning consequence

This target is small enough to pursue as one focused architecture cycle.

Approximate duration with the current project tempo and without backward
compatibility burden:

- strong foundation checkpoint: `2–3 weeks`
- strong target checkpoint: `3–4 weeks`
- near-complete target state: `4–6 weeks`

## 9. Review Trigger

Review this ADR when one of the following becomes true:

- runtime implementation work is promoted after the demo release;
- `RoomRuntime` extraction starts implementation;
- `RoomDocumentV1` schema is proposed;
- image asset extraction starts;
- transport unification becomes an active phase;
- room-open semantics change.

## 10. External References

- Figma engineering:
  - https://www.figma.com/blog/how-figmas-multiplayer-technology-works/
  - https://www.figma.com/blog/how-figma-draws-inspiration-from-the-gaming-world/
- tldraw:
  - https://tldraw.dev/docs/sync
  - https://tldraw.dev/reference/sync/useSync
  - https://tldraw.dev/reference/store/Store
- Yjs:
  - https://docs.yjs.dev/api/about-awareness
  - https://docs.yjs.dev/getting-started/allowing-offline-editing
- Liveblocks:
  - https://liveblocks.io/docs/ready-made-features/multiplayer/sync-engine/liveblocks-storage
  - https://liveblocks.io/docs/platform/data-storage
