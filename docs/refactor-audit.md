# Refactor Audit

## Scope and Method

- This audit is read-only and based on the current repository state.
- It follows the repo constraints from `AGENTS.md` and the required structure from `PLANS.md`.
- `ROADMAP.md` is the live project-plan, backlog, and decision-log document; this file remains architecture-specific.
- The main goal is to improve architectural boundaries without broad rewriting `BoardStage.tsx`.

## Current Architecture Map

### App shell

- `src/App.tsx`
  - Owns room selection from URL, join flow, participant session bootstrap, and presence connection lifecycle.
  - Renders either the join screen or `BoardStage`.
- `src/main.tsx`
  - App bootstrap only.

### Board surface

- `src/components/BoardStage.tsx`
  - The dominant integration surface.
  - Owns viewport state, board object state, selection state, text-card editing state, image drawing state, image transform state, image preview state, image loading cache, room-scoped resets, storage persistence, realtime connection setup, cursor updates, room UI, toolbar UI, and all Konva rendering.
  - At 2510 lines, it currently acts as:
    - board scene container
    - board object store
    - tool/interactions layer
    - shell overlay/UI layer
    - sync composition layer
    - object renderer layer

### Board model and helpers

- `src/types/board.ts`
  - Single shared `BoardObject` union-shaped type for image, text-card, and token.
  - Object kinds are distinguished by `kind`, but there are no per-type modules.
- `src/lib/boardObjects.ts`
  - Generic object list update helpers.
- `src/lib/boardImage.ts`
  - Image-specific helper logic for sizing, storage scaling, stroke mutation, and image object creation.
- `src/data/initialBoard.ts`
  - Seeds sample board objects.

### Room/session/presence/sync/persistence

- `src/lib/roomSession.ts`
  - Local participant session and presence data shape.
  - URL-to-room parsing and session storage helpers.
- `src/lib/roomPresenceRealtime.ts`
  - Yjs awareness transport for participant presence.
- `src/lib/roomTokensRealtime.ts`
  - Token sync connection with a dedicated Yjs map.
- `src/lib/roomImagesRealtime.ts`
  - Image sync connection with:
    - shared image map
    - preview position map
    - awareness-based image drawing locks
    - requestAnimationFrame batching
  - This is the richest transport module today.
- `src/lib/roomTextCardsRealtime.ts`
  - Text-card sync connection with a dedicated Yjs map.
- `src/lib/storage.ts`
  - Local storage persistence for:
    - board objects
    - viewport
    - legacy per-kind room objects

## State Classification

### Persisted/shared room state

- `src/lib/storage.ts`
  - local persisted board object snapshots
  - local viewport snapshots
  - legacy per-kind local persisted snapshots
- `src/data/initialBoard.ts`
  - default seeded board content

### Shared realtime state

- `src/lib/roomTokensRealtime.ts`
  - shared token objects
- `src/lib/roomImagesRealtime.ts`
  - shared image objects
- `src/lib/roomTextCardsRealtime.ts`
  - shared text-card objects
- `src/components/BoardStage.tsx`
  - mixes shared realtime writes directly into local board mutations via `applyBoardObjectsUpdate`

### Local transient UI state

- `src/App.tsx`
  - join form draft name and draft color
- `src/components/BoardStage.tsx`
  - participant panel open/edit state
  - selected image action button position
  - loaded image cache
  - textarea overlay layout

### Local interaction state

- `src/components/BoardStage.tsx`
  - selected object id
  - text-card editing state
  - stage pan state
  - image drag state
  - image transform state
  - active image stroke state
  - drawing mode state

### Awareness-only ephemeral state

- `src/lib/roomPresenceRealtime.ts`
  - participant cursor presence
- `src/lib/roomImagesRealtime.ts`
  - active image drawing lock via awareness
  - remote image preview bounds
- `src/components/BoardStage.tsx`
  - consumes and interprets awareness updates while also rendering and mutating objects

## Where Concerns Are Mixed

### `src/components/BoardStage.tsx`

- Board scene state, tool state, shell UI, object rendering, storage persistence, and realtime sync are all mixed in one file.
- `applyBoardObjectsUpdate` and related helpers combine local object mutation with transport decisions.
- Room change/reset logic resets viewport, board state, editing state, and transport-related local state together.
- Image behavior combines:
  - renderer event handlers
  - drawing tool state
  - local stroke buffering
  - awareness locks
  - preview publishing
  - persisted/shared data merge rules
- Text-card behavior combines rendering, drag rules, edit rules, overlay textarea management, and shared data updates.
- Cursor presence is translated to overlay UI in the same component that owns Stage pointer handlers.

### `src/types/board.ts`

- One broad object shape serves all object kinds.
- Fields like `src`, `imageStrokes`, and text styling live on the same type as tokens, which weakens ownership boundaries.

### `src/lib/storage.ts`

- Current storage layer mixes:
  - whole-board local persistence
  - viewport persistence
  - legacy per-kind storage migration compatibility
- This makes the persistence boundary harder to reason about.

## Top Coupling Hotspots

1. `src/components/BoardStage.tsx:334`
   - `applyBoardObjectsUpdate` is the main coupling knot.
   - A local object mutation also decides whether to replace tokens, upsert images, remove images, or replace text cards.
   - This tightly couples board-domain mutations to transport details.

2. `src/components/BoardStage.tsx:657`
   - Realtime connection setup for tokens, images, and text cards is embedded directly into the board renderer component.
   - Rendering lifecycle and transport lifecycle are coupled.

3. `src/components/BoardStage.tsx:1952`
   - Per-object render branching lives inline with Stage rendering.
   - Image, text-card, and token render logic are not separated by object module.

4. `src/components/BoardStage.tsx:1991`
   - Image rendering is fused with image interactions.
   - Drag, transform, draw, preview, selection, and locking behavior all live on one `KonvaImage` branch.

5. `src/components/BoardStage.tsx:1506`
   - Session panel and top-right toolbar shell UI live inside the same component as board domain and Konva event handling.

6. `src/components/BoardStage.tsx:1778`
   - Empty-space panning, deselection, drawing exit behavior, and zoom logic share the same Stage event surface.
   - This is a sensitive no-go area for broad refactor.

## What Is Already Going in a Good Direction

- Realtime is already split by object family into separate transport modules:
  - tokens
  - images
  - text-cards
- Presence transport is already separate from board object sync.
- Image-specific utility logic already exists in `src/lib/boardImage.ts`.
- `App.tsx` already keeps the join flow and presence bootstrap outside `BoardStage`.
- The repo is still small enough that extraction-by-slice is realistic without redesigning the whole product.

## What Is Risky to Change Now

- Empty-space manual panning in `BoardStage` Stage handlers.
- Image drag and resize flow, especially preview publishing and local stroke layer synchronization.
- Image drawing mode, including:
  - awareness locks
  - local active stroke buffering
  - merge of local strokes with shared image payloads
- Text-card drag-handle behavior.
- Room switching/reset behavior, because it resets local interaction state and reconnects room-scoped transports.

## No-Go Zones

- Do not broad-rewrite `src/components/BoardStage.tsx`.
- Do not change the semantics of empty-space panning.
- Do not change current image drag, transform, preview, or drawing behavior as part of architecture cleanup.
- Do not combine refactor phases with new product features.
- Do not introduce a heavy-VTT scene/entity system.

## Recommended Target Module Boundaries

### 1. App/UI shell vs board domain

- App shell should own:
  - room routing
  - join flow
  - participant settings shell
  - high-level board toolbar orchestration
- Board domain should own:
  - board scene state
  - board object commands
  - viewport math
  - board interactions
  - board rendering composition

### 2. Board objects by type

- Each object type should move toward its own module boundary:
  - `image`
  - `text-card`
  - `token`
- Each type should eventually own:
  - type definitions
  - creation helpers
  - render component
  - interaction helpers specific to the type
  - sync mapping rules if needed

### 3. Tools/interactions vs renderers

- Cross-object interaction modules should own:
  - selection
  - viewport pan/zoom
  - drawing mode
  - drag/transform orchestration
  - keyboard shortcuts
- Renderer modules should primarily map state to Konva nodes and call typed callbacks.

### 4. Sync/presence/persistence vs rendering

- Transport modules should not be triggered directly from leaf render handlers.
- Board state mutations should become transport-agnostic commands.
- A room/board sync adapter layer should translate command results to:
  - token transport updates
  - image transport updates
  - text-card transport updates
  - persistence writes

## Recommended Folder Tree

```text
src/
  app/
    AppShell.tsx
    room/
      useRoomSession.ts
      useRoomPresence.ts
  board/
    components/
      BoardCanvas.tsx
      BoardOverlays.tsx
      BoardToolbar.tsx
    domain/
      boardTypes.ts
      boardCommands.ts
      viewport.ts
      selection.ts
    objects/
      image/
        imageTypes.ts
        imageFactory.ts
        imageRenderer.tsx
        imageInteractions.ts
      textCard/
        textCardTypes.ts
        textCardFactory.ts
        textCardRenderer.tsx
        textCardInteractions.ts
      token/
        tokenTypes.ts
        tokenFactory.ts
        tokenRenderer.tsx
        tokenInteractions.ts
    sync/
      boardSync.ts
      roomTokensSync.ts
      roomImagesSync.ts
      roomTextCardsSync.ts
      roomPresenceSync.ts
    persistence/
      boardStorage.ts
      viewportStorage.ts
  shared/
    id.ts
```

## Migration Phases

### Phase 0: Audit and plan

- Output docs only.
- No production code changes.

### Phase 1: Extract board constants, board viewport helpers, and board object render branches into leaf modules

- Keep `BoardStage` as the integration surface.
- Extract only pure helpers and renderer leaf components.
- No behavior change.

### Phase 2: Extract shell overlays from `BoardStage`

- Move participant panel, cursor overlay, and top toolbar to separate components.
- Keep props explicit and keep state ownership in `BoardStage` at first.

### Phase 3: Introduce per-object renderer modules and typed creation helpers

- Split image/text-card/token rendering and factories by type.
- Keep current `BoardObject` compatibility adapter during the transition.

### Phase 4: Introduce a board sync adapter layer

- Move transport branching out of `applyBoardObjectsUpdate`.
- Keep the current Yjs modules, but wrap them behind a board-facing adapter.

### Phase 5: Move interaction/tool logic into dedicated board interaction modules

- Start with keyboard, viewport pan/zoom, and text-card editing helpers.
- Defer sensitive image behavior until the adapter and renderer boundaries are stable.

### Phase 6: Narrow the board data model by object type

- Move from one broad `BoardObject` shape toward per-kind domain types with compatibility mapping.

## Validation Steps for Every Implementation Phase

- Run `npm run build`.
- Re-test room switching.
- Re-test presence and cursor visibility.
- Re-test token create/drag/delete behavior.
- Re-test text-card create/drag/edit behavior.
- Re-test image add/drag/resize/draw/clear behavior.
- Re-test empty-space panning and wheel zoom.

## Recommended Phase 1

- Extract only leaf modules with no behavior change:
  - board constants and viewport helpers
  - cursor overlay component
  - participant/session panel component
  - toolbar component
  - token creation factory
  - text-card creation factory
  - pure renderer components for token and text-card
- Keep image rendering and image interactions inside `BoardStage` in Phase 1.
- Keep all existing state ownership and transport setup in `BoardStage`.
- Keep Stage-level event handlers in place.

This is the smallest useful step because it reduces `BoardStage` size and responsibility without touching the most fragile image and panning paths.
