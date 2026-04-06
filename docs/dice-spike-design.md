# Dice Spike Design — Shared 3D Public Rolls

## Status
Proposed canonical design for the first dice chapter in `play-space-alpha`.

## Purpose
This document defines the first narrow 3D dice spike for `play-space-alpha`.

The goal is to add a beautiful shared 3D dice ritual to the product:
- one player rolls;
- everyone sees the same public roll;
- the dice are visually associated with the rolling player;
- the roll feels tactile and satisfying;
- the feature remains a narrow layer and does not turn into a full dice platform or rules engine.

This chapter is about validating a strong multiplayer play signal, not about building a complete TTRPG rules subsystem.

## Product Goal
The first dice chapter should answer a simple product question:

Can `play-space-alpha` support a visually satisfying, multiplayer-visible dice ritual that feels like part of the shared play session?

The intended value is:
- social;
- visual;
- tactile;
- multiplayer-readable.

This is not primarily about:
- notation depth;
- modifiers;
- rules automation;
- logs/history;
- GM tooling;
- persistence.

## First-Pass Scope

### In scope
- public rolls only;
- 3D dice animation;
- shared synchronized roll event visible to all connected participants;
- support for:
  - d4
  - d6
  - d8
  - d10
  - d12
  - d20
- dice visually colored by the rolling participant’s player color;
- dice remain visible briefly after landing, then disappear automatically;
- minimal controls for choosing a die and rolling it.

### Explicitly out of scope
- roll history / roll log;
- labels like “Alice rolled 17”;
- modifiers;
- notation parsing like `2d6+3`;
- advantage/disadvantage;
- private / GM rolls;
- persistent dice objects on the board;
- durable storage of recent rolls;
- reconnect/replay of old rolls;
- drag-to-throw interaction;
- rules-engine behavior;
- broad dice UX/platform work.

## Core Product Positioning
This feature should be treated as a narrow integration/prototype spike.

It should:
- strengthen the shared play-space feeling;
- stay compatible with the board-first product direction;
- avoid turning the project into a heavy VTT;
- avoid opening a large new surface area before the core shared ritual is validated.

## Primary Placement Decision

### Chosen first-pass placement
The first dice layer should be implemented as a viewport-fixed overlay:
- above the board rendering;
- below top-level controls and video/media UI;
- not part of board world-space;
- not affected by pan/zoom.

### Why this is the preferred first pass
This preserves the main signal we want:
- everyone sees the same roll moment;
- the roll feels shared and intentional;
- the dice can visually feel like they are “over the table”.

At the same time, it avoids prematurely coupling dice to:
- board coordinates;
- pan/zoom state;
- different viewport sizes;
- room/world placement semantics;
- collision with future board object semantics.

### Deferred alternative
A later path may move toward world-space dice on the board.

That option is attractive because:
- it would feel more literally “on the table”;
- it could deepen board-native immersion.

But it is intentionally deferred because it would introduce harder questions too early:
- how dice positions map across different viewports;
- whether dice become board objects;
- whether they should persist;
- how they interact with pan/zoom/camera;
- whether they are part of room content or only a transient scene effect.

For the first spike, those questions are noise.

## Sync Model

### Main rule
Do NOT replicate physics frame-by-frame.

The shared synchronized unit should be a roll event, not a streamed simulation.

### Proposed shared event shape

Use this proposed TypeScript shape in the design doc as a concrete reference:

```ts
export type SupportedDie = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";

export type DiceRollOutcome = {
  die: SupportedDie;
  value: number;
};

export type DiceRollEvent = {
  id: string;
  roomId: string;
  actorId: string;
  actorName: string;
  actorColor: string;
  outcomes: DiceRollOutcome[];
  seed: string;
  createdAt: number;
  ttlMs: number;
};
```

### Why event sync is preferred
Event-level sync gives the product behavior we actually need:
- all participants see a shared roll;
- all participants land on the same outcome;
- the visual experience can still be rich locally.

It avoids a much more fragile and expensive path:
- networked physics replication;
- per-frame state streaming;
- heavy synchronization complexity;
- debugging nondeterministic divergence.

## Result Generation Model

### First-pass recommendation
The initiating client should:
1. decide the roll request;
2. generate a deterministic seed;
3. compute the final outcomes;
4. publish a shared `DiceRollEvent`.

Each client should then:
- receive the same event;
- replay a local visual roll presentation;
- end on the same final outcome.

### Why this is acceptable for the first spike
This is enough for:
- public multiplayer rolls;
- a social shared ritual;
- fast implementation;
- clear debugging.

It avoids premature backend/security complexity.

### Deferred trust/security concerns
If trust becomes important later, future options could include:
- server-authoritative roll generation;
- stronger deterministic replay guarantees;
- signed or validated roll events.

Those are explicitly not required for the first spike.

## Realtime / State Model

### First-pass recommendation
Dice rolls should live in the existing multiplayer/realtime system as transient shared events.

Preferred model:
- a shared transient collection / map / array of active dice roll events;
- automatic cleanup after TTL expiry;
- not part of durable room persistence.

### Why not awareness-only
Pure awareness-style presence is usually too ephemeral for this use case.

A roll needs to:
- appear reliably for all connected clients;
- remain visible for a few seconds;
- be inspectable/debuggable as an event.

A transient shared collection is a better fit.

### Persistence rule
Dice rolls are not durable room content in the first pass.
They should not be stored as part of room recovery state.
They are transient shared effects.

## Visual / Color Semantics

Dice color should be actor-linked.

Meaning:
- the dice color marks who performed the roll;
- it is a transient multiplayer cue;
- it does not imply ownership or permissions.

### Color payload rule
The roll event should carry `actorColor` directly as presentation data.

This is preferred in the first pass because:
- it keeps the event self-describing;
- it avoids late resolution problems;
- it avoids accidental viewer-local color substitution.

### Fallback rule
If actor color is unavailable, fallback should be neutral.

It should never silently fall back to the local viewer’s own color.

## UI / Controls

### First-pass controls
Use the smallest usable control surface:
- a minimal dice tray / panel;
- six actions:
  - d4
  - d6
  - d8
  - d10
  - d12
  - d20
- one click rolls one die of that type.

### Why this is preferred
This gets to a working public ritual quickly without:
- parser work;
- heavy controls;
- multi-step forms;
- large UX decisions.

### Deferred controls
Later layers may add:
- multi-die presets;
- modifiers;
- notation entry;
- private/public toggle;
- roll history.

Those are not part of this design.

## Layering / Interaction Rules

### Overlay behavior
The dice scene should be mounted as a visual layer:
- above the board;
- below top controls and media/video UI;
- fixed to the viewport;
- independent from board pan/zoom.

### Interaction rule
The dice overlay should not break normal board interaction.

Likely rule:
- scene container uses `pointer-events: none`;
- controls use `pointer-events: auto`.

### Layering priority
For the first pass, the intended layering order is:
- board content below dice overlay;
- dice overlay below toolbar/session controls;
- dice overlay below media/video dock;
- cursor labels should be validated during implementation, but the safe default is to keep them above the dice layer if readability becomes an issue.

### Lifetime rule
Dice should:
- animate into the scene;
- come to rest;
- remain visible briefly;
- disappear automatically.

Initial target:
- around 5–6 seconds TTL.

### Concurrency rule
The first pass should keep active concurrent rolls bounded.
It is acceptable to:
- allow only a small number of recent active roll scenes;
- drop or expire older ones quickly;
- prefer visual clarity over full history.

## Candidate Library Direction

### Preferred first candidate
The first candidate renderer to evaluate is:
- `@3d-dice/dice-box`

### Why it is the preferred first candidate
It appears to fit the desired direction:
- embeddable 3D dice renderer;
- oriented toward app integration;
- better fit than outsourcing the ritual to an external dice service.

### What must be verified later in an implementation pass
- compatibility with the current React/Vite setup;
- asset/runtime integration complexity;
- ability to control outcomes or at least reliably align visual presentation with known outcomes;
- ability to theme/style dice color from player color;
- performance and layering behavior in the current app shell.

### Fallback path
If the first candidate proves awkward in this repo, alternatives may be documented in a later feasibility note.
But the current design should stay library-light and should not turn into a broad tool comparison document.

## Manual QA Targets for the Future Implementation Pass
When implementation begins, manually verify:
- local single-user roll;
- two-tab local shared roll;
- different viewport sizes;
- roll while actively using the board;
- roll while the video/media dock is visible;
- rapid repeated rolls;
- two different participants rolling one after another;
- player color change followed by a new roll;
- late join during an already-active TTL window.

## Success Criteria
This spike is successful if:
- the roll feels beautiful/tactile enough to be worth having;
- multiple participants can observe the same public roll moment;
- the rolling player’s color reads clearly in the dice;
- the overlay does not fight the board UX;
- the implementation remains narrow and does not force a broad rewrite.

## Non-Goals / Deferred Questions
The following questions are intentionally deferred:
- roll history/log;
- text labels;
- private / GM rolls;
- modifiers;
- notation parsing;
- multi-die presets;
- world-space board-native dice;
- persistence of old rolls;
- stronger trust/security model.

## Repo-Specific Integration Notes

### Top-level app shell
The current room-level shell lives in [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx).

Today it mounts:
- [BoardStage](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) as the primary board surface;
- [LiveKitMediaDock](/Users/fedorpodrezov/Developer/play-space-alpha/src/media/LiveKitMediaDock.tsx) as a sibling fixed overlay.

That makes `App.tsx` the cleanest first-pass mounting point for a dice layer:
- it already owns `roomId`;
- it already owns `participantSession`;
- it already owns `participantPresences`;
- it already hosts a sibling fixed media layer without pushing media concerns into `BoardStage`.

### Board rendering and fixed overlays
The board world itself is still rendered inside [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) with `react-konva`.

Current fixed UI layers already used around the board:
- [ParticipantSessionPanel](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/ParticipantSessionPanel.tsx)
  - fixed top-left
  - `z-index: 10`
- [BoardToolbar](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/BoardToolbar.tsx)
  - fixed top-right
  - `z-index: 10`
- [CursorOverlay](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/CursorOverlay.tsx)
  - fixed cursor labels
  - `pointer-events: none`
  - `z-index: 12`
- [LiveKitMediaDock](/Users/fedorpodrezov/Developer/play-space-alpha/src/media/LiveKitMediaDock.tsx)
  - fixed bottom-right
  - `z-index: 20`

This suggests the dice spike should follow the same app-shell overlay pattern:
- fixed to viewport;
- not nested into board world coordinates;
- below the media dock;
- careful not to obscure the session panel or toolbar.

### Player identity and player color
The current participant identity source is [src/lib/roomSession.ts](/Users/fedorpodrezov/Developer/play-space-alpha/src/lib/roomSession.ts).

Relevant fields:
- `LocalParticipantSession.id`
- `LocalParticipantSession.name`
- `LocalParticipantSession.color`

The current participant color model is already canonicalized in:
- [docs/color-model-design.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/color-model-design.md)

For the dice spike, the actor payload should come directly from the current local participant session:
- `actorId <- participantSession.id`
- `actorName <- participantSession.name`
- `actorColor <- participantSession.color`

### Existing transient multiplayer patterns
The repo already uses two lightweight realtime patterns:

1. Yjs shared collections/maps for transient or shared room state:
- [src/lib/roomTokensRealtime.ts](/Users/fedorpodrezov/Developer/play-space-alpha/src/lib/roomTokensRealtime.ts)
- [src/lib/roomImagesRealtime.ts](/Users/fedorpodrezov/Developer/play-space-alpha/src/lib/roomImagesRealtime.ts)
- [src/lib/roomTextCardsRealtime.ts](/Users/fedorpodrezov/Developer/play-space-alpha/src/lib/roomTextCardsRealtime.ts)

2. Awareness-only ephemeral signals for “who is doing something right now”:
- cursor/presence in [src/lib/roomPresenceRealtime.ts](/Users/fedorpodrezov/Developer/play-space-alpha/src/lib/roomPresenceRealtime.ts)
- image drawing lock in [src/lib/roomImagesRealtime.ts](/Users/fedorpodrezov/Developer/play-space-alpha/src/lib/roomImagesRealtime.ts)
- text-card editing presence in [src/lib/roomTextCardsRealtime.ts](/Users/fedorpodrezov/Developer/play-space-alpha/src/lib/roomTextCardsRealtime.ts)

The dice spike is closer to the first pattern than the second:
- a roll should survive long enough for everyone connected to see it;
- a short-lived Yjs collection/map entry is a better fit than pure awareness.

### Persistence boundaries
Current room bootstrap and recovery in [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) prioritizes:
- live shared room state;
- durable room snapshot;
- local room snapshot;
- zero state.

Dice should not enter that stack in the first pass.
They should not be added to:
- board object persistence;
- durable room snapshots;
- local room snapshots;
- room reset semantics.

### Narrowest likely integration surface
The safest narrow first-pass integration shape in this repo is:
1. a room-level dice event helper near the existing realtime helpers;
2. a viewport-fixed dice overlay mounted from `App.tsx` as a sibling to `BoardStage` and `LiveKitMediaDock`;
3. a minimal dice control surface that does not require `BoardStage` architecture changes.

This preserves the current pattern:
- board logic stays in `BoardStage`;
- media stays in its own dock component;
- dice can arrive as another room-level overlay layer.

## Recommended Next Step
After this design doc is accepted, the next step should be a narrow implementation pass:
1. prove local 3D dice feasibility in the real stack;
2. mount a viewport-fixed dice overlay;
3. add transient shared public roll events;
4. support one public die roll visible to all;
5. expand to the base set;
6. keep scope narrow.