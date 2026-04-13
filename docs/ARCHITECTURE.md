# Architecture Overview

This is a compact orientation doc for the current alpha runtime shape. Use the focused docs for deeper semantics.

## Frontend

The frontend is a React + TypeScript + Vite app in `src/`.

Important current areas:

- `src/components/BoardStage.tsx` — board interaction/rendering integration surface
- `src/board/` — board object/domain modules and sync helpers
- `src/dice/` — authoritative shared dice layer
- `src/media/` — optional LiveKit media UI/runtime
- `src/ui/` and `src/ui/system/` — interface/system surfaces and debug affordances

Rendering is board-first and currently uses Konva/react-konva.

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

Hosted/container setups can override those paths explicitly with `ROOM_SNAPSHOT_STORE_FILE` and `ROOM_IDENTITY_STORE_FILE`.

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
