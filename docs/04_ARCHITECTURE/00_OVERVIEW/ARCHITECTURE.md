# Architecture Overview

This is a compact orientation doc for the current alpha runtime shape.
For the explicit current/target layer split, open:

- `docs/04_ARCHITECTURE/00_OVERVIEW/architecture-layer-map.md`
- `docs/04_ARCHITECTURE/00_OVERVIEW/architecture-summary.md`

Use the focused docs for deeper semantics.

## Frontend

The frontend is a React + TypeScript + Vite app in `src/`.

Important current areas:

- `src/components/BoardStage.tsx` — board interaction/rendering integration surface
- `src/board/` — board object/domain modules and sync helpers
- `src/dice/` — authoritative shared dice layer
- `src/media/` — optional LiveKit media UI/runtime
- `src/ui/` and `src/ui/system/` — interface/system surfaces and debug affordances

Rendering is board-first and currently uses Konva/react-konva.

## BoardStage Target Architecture

`BoardStage` is the orchestration shell for board runtime.

Current structural direction:

- `BoardStage` keeps runtime ownership:
  - state
  - refs
  - effects
  - selectors
  - runtime callbacks
  - room/session wiring
  - persistence and realtime orchestration
- `BoardStageScene` is the target render boundary for the Konva scene:
  - board surface
  - object branches
  - scene-attached controls
  - selection / transform visuals
- `BoardStageShellOverlays` owns ordinary HTML overlays and shell chrome:
  - session panel
  - media dock
  - add-image button
  - dev tools
  - scene-attached HTML overlays such as note-editor textarea and object-semantics tooltip
- `BoardStageDevToolsContent` owns debug and inspection UI.
- pure view-model helpers should sit between runtime state and render layers and build render-ready props.

Decision rule for future extractions:

- runtime state, subscriptions, effects, and commit behavior stay in `BoardStage` or runtime coordinator modules
- pure derived prop shaping moves to helper modules
- Konva tree rendering moves toward `BoardStageScene`
- ordinary HTML overlays move toward `BoardStageShellOverlays`
- debug and inspection UI moves toward `BoardStageDevToolsContent`

Near-term cleanup direction:

1. reduce `BoardStage` by extracting scene composition into `BoardStageScene`
2. move more prop-shaping into pure view-model helpers
3. extract high-pressure scene corridors one by one
4. move recovery/bootstrap coordination later, after safer render-layer splits

## BoardStage Orchestrator Logical Map

`BoardStage` is the runtime owner and coordinator for board behavior.

The logical blocks inside the orchestrator are:

1. session and room inputs
   - room id
   - participant session
   - room creator data
   - join / leave callbacks
   - active room context
2. persistence and recovery coordination
   - local replica bootstrap
   - durable catch-up
   - settled recovery state
   - local writes
   - durable slice writes
3. realtime coordination
   - token slice connection
   - image slice connection
   - text-card slice connection
   - presence publish / receive
   - shared ephemeral collaboration state
4. interaction coordination
   - selection
   - pan / zoom
   - drag / drop
   - transform
   - image draw mode
   - note edit lifecycle
   - remote previews and locks
5. governance and access resolution
   - room-level access
   - object-level access
   - derived action permissions
6. pure view-model shaping
   - scene-ready props
   - overlay-ready props
   - tooltip rows
   - button and control layout inputs
   - debug and inspection view models
7. render outputs
   - `BoardStageScene`
   - `BoardStageShellOverlays`
   - `BoardStageDevToolsContent`
8. outbound effects and callbacks
   - participant-session updates
   - leave-room actions
   - persistence writes
   - realtime publishes

Ownership rule:

- `BoardStage` owns runtime truth, effects, subscriptions, and commit behavior
- render layers receive ready props and callbacks
- render layers do not own persistence, recovery, or room-runtime truth

## Render Stack Target

The agreed app-owned visual stack is:

1. top layer: `DiceDisplaySurface`
   - shared 3D dice render above every app-owned board layer
2. upper app overlays
   - session panel
   - media dock
   - add-image button
   - dev tools
3. scene-attached HTML overlays
   - note-editor textarea
   - object-semantics tooltip
4. board scene
   - board surface
   - objects
   - transformers
   - selected controls
   - object-attached controls

Remote cursors and drag previews stay below the top dice layer.
The system cursor stays outside the app stack and remains above every app-owned layer.

## Realtime / API Server

The main server-side runtime is the long-running Node/Yjs process in:

- `scripts/yjs-dev-server.mjs`

This service currently owns the practical alpha backend responsibilities:

- Yjs/websocket realtime
- presence/session-adjacent runtime endpoints
- room snapshot routes and related room-level storage logic
- backend health/debug surfaces used by the current hosted alpha workflow

There is also a narrow optional hosted token endpoint:

- `api/livekit/token.ts`

That route is used as a hosted fallback path when LiveKit token minting is not served from the long-running backend.

## Persistence / Runtime State

Current state model is intentionally split.

Main categories:

- durable room identity
- live shared room state
- durable room snapshot recovery
- local room convenience state
- awareness-only ephemeral signals
- local UI and interaction state

Canonical semantics live in:

- `room-behavior-spec.md`
- `room-memory-model.md`

Default local runtime data files:

- `.runtime-data/room-snapshots.json`
- `.runtime-data/room-identities.json`
- `.runtime-data/feedback.jsonl`

Hosted/container setups can override those paths explicitly with
`ROOM_SNAPSHOT_STORE_FILE`, `ROOM_IDENTITY_STORE_FILE`, and
`FEEDBACK_STORE_FILE`.

Important hosted caveat:

- the current hosted snapshot layer is useful as a best-effort recovery path
- it has been observed to survive restart but not redeploy
- treat hosted room durability as not yet deploy-stable

## Optional Media / LiveKit

Video is an optional alpha layer, not the core product contract.

Current shape:

- LiveKit runs separately from the main frontend and realtime/API server
- local workflows usually use native `livekit-server`
- hosted setups may use either backend token minting or the narrow Vercel token fallback

Relevant docs:

- `livekit-local-dev.md`
- `hosted-alpha-deployment-plan.md`

## Hosted Deployment Shape

Current intended hosted split:

- frontend: static Vite build on a Vercel-style host
- realtime/API backend: separate long-running Node service
- LiveKit: separate service if media is enabled

This is a practical alpha deployment shape, not a final production platform design.

## Known Sensitive Surfaces

These areas carry the highest regression risk:

- `src/components/BoardStage.tsx`
- empty-space panning and wheel zoom
- image drag / resize / draw / preview behavior
- room switch / leave / bootstrap / recovery paths
- transport/persistence/video/dice changes combined into one pass

Repo rule of thumb:

- inspect first
- avoid broad rewrites
- keep behavior and docs aligned when semantics change
