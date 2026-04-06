# Dice Spike Implementation Plan

## Summary
Chosen direction:
- viewport-fixed 3D dice overlay;
- shared public roll events only;
- actor-colored dice;
- transient Yjs-backed event model;
- no persistence;
- no rules/logging platform work.

This plan is intentionally narrow and keeps the spike outside board object persistence and outside durable room state.

## Phase 1 — Renderer feasibility
Goal:
- prove a candidate 3D dice renderer works in the current React/Vite app shell;
- prove that the renderer can deliver a visually satisfying enough tactile-feel for the intended product ritual.

Verify first:
- library compatibility with current Vite build;
- how the renderer mounts inside a fixed overlay container;
- whether known outcomes can be driven deterministically enough for shared event replay;
- what asset/runtime setup is required;
- whether the resulting visual feels good enough to justify continuing with this renderer.

Stop if:
- the renderer demands broad asset/build surgery;
- outcome control is too weak for synchronized public rolls;
- the visual result is not strong enough to justify the chosen library path.

## Phase 2 — Overlay mounting
Goal:
- mount a viewport-fixed dice scene as a sibling room-level layer.

Target shape:
- mounted from `src/App.tsx`;
- separate from `BoardStage`;
- separate from `LiveKitMediaDock`;
- not affected by board pan/zoom.

Verify:
- no interference with current board interaction;
- clean layering against toolbar, session panel, cursors, and media dock.

## Phase 3 — Transient shared event model
Goal:
- add a room-scoped transient shared collection for active dice roll events.

Preferred direction:
- a dedicated realtime helper alongside current room realtime modules;
- Yjs shared collection/map with TTL cleanup;
- event-level sync only, not physics sync.

Verify:
- two connected clients receive the same roll event;
- event expiry clears the visual scene cleanly;
- no interaction with durable room snapshots;
- a late joiner during an active TTL window sees still-active rolls if the shared event has not yet expired.

## Phase 4 — Actor color mapping
Goal:
- propagate roll actor identity and color correctly.

Inputs:
- `participantSession.id`
- `participantSession.name`
- `participantSession.color`

Rules:
- publish `actorColor` directly on the roll event;
- never fall back to viewer-local color for remote rolls;
- fallback to neutral only if actor color is absent.

## Phase 5 — Base dice set
Goal:
- support the first public set:
  - d4
  - d6
  - d8
  - d10
  - d12
  - d20

UI target:
- one minimal dice tray/control surface;
- one click = one public die roll.

## Phase 6 — TTL cleanup and bounded concurrency
Goal:
- keep the visual layer readable and self-cleaning.

Verify:
- rolls remain visible briefly after landing;
- older rolls expire automatically;
- rapid repeated rolls stay bounded and do not create a runaway scene.

## Explicit non-goals
- roll history/log
- labels/toasts
- modifiers
- notation parsing
- private rolls
- persistence
- board-world dice objects
- drag-to-throw
- rules logic
- broad dice UX/platform work

## Specific uncertainties to verify first in code
- whether the preferred renderer can be driven toward a known outcome from a supplied seed/result;
- whether the overlay should sit above or below current cursor overlays for best readability;
- whether a single dedicated Yjs map or a short-lived array/list is the cleanest transient event container in this codebase;
- whether TTL cleanup should be client-driven, shared-document-driven, or a hybrid.

## Manual QA targets for the first implementation pass
- one-tab local roll
- two-tab shared roll
- roll with board panning active
- roll with media dock open
- rapid repeated rolls
- different participant colors on sequential rolls
- late join during active TTL window