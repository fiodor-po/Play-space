# Dice Layer Spec — Accepted Authoritative Shared 3D Dice

## Status
Accepted alpha-core layer for `play-space-alpha`.

This document is no longer a speculative library-selection note.
It defines the accepted product semantics and architectural boundaries for the current dice layer.

## Purpose
The dice layer adds a visually satisfying, multiplayer-visible public roll ritual to the product:

- one participant rolls;
- everyone sees the same public roll moment;
- everyone lands on the same authoritative visible result;
- the dice are visually associated with the rolling participant;
- the feature remains narrow and does not turn into a rules platform.

## Current accepted product position

Dice are now part of the accepted alpha core.

They are:

- social;
- visual;
- tactile;
- multiplayer-readable.

They are **not** currently:

- a rules engine;
- a roll history platform;
- a persistence-heavy subsystem;
- a board-world durable object system.

## Current scope

### In scope
- public rolls only;
- viewport-fixed 3D overlay;
- shared synchronized roll event visible to all connected participants;
- support for:
  - d4
  - d6
  - d8
  - d10
  - d12
  - d20
  - d100
- dice colored by the rolling participant’s player color;
- minimal dice tray / control surface;
- transient lifetime with automatic cleanup.

### Out of scope
- roll history / roll log;
- labels like “Alice rolled 17”;
- modifiers;
- notation parsing like `2d6+3`;
- advantage/disadvantage;
- private / GM rolls;
- persistent dice objects on the board;
- durable storage of old rolls;
- reconnect/replay of old rolls;
- drag-to-throw interaction;
- broader dice platform work.

## Primary placement decision

The accepted first-pass placement is:

- viewport-fixed overlay;
- above the board rendering;
- below top-level controls / media UI where practical;
- not part of board world-space;
- not affected by pan/zoom.

This remains the correct alpha shape because it preserves the shared ritual without prematurely coupling dice to board coordinates or room content semantics.

## Accepted architecture

### Main sync rule
Do **not** replicate physics frame-by-frame.

The shared synchronized unit is a **roll event**, not a streamed simulation.

### Accepted product model
The accepted model is dddice-like:

- authoritative roll event;
- local 3D render on each client;
- identical visible final result for all participants;
- actor-linked color;
- overlay-first placement.

## Accepted result rule

Authoritative visible outcome is a mandatory product requirement.

A dice renderer path is unacceptable if it cannot safely produce the same visible final result for all participants.

## Current renderer direction

### Rejected path
Rejected for this product requirement:

- `@3d-dice/dice-box`

Reason:

- it did not give a safe/public forced visible outcome path for the required product semantics.

### Accepted current path
Accepted renderer path:

- `@3d-dice/dice-box-threejs`

Why:

- predetermined / forced outcome path works;
- shared authoritative visible result works;
- remote clients see the same final outcome;
- actor color works;
- overlay-first integration fits the app shell.

### Fallback
If the current path later becomes untenable:

- small custom controlled renderer on Three.js / React Three Fiber

`dddice` remains only a pragmatic hosted fallback idea, not the primary current path.

## Event / state model

Dice rolls should live as transient shared room events.

They should:

- appear reliably for connected participants;
- remain visible briefly;
- expire automatically;
- stay outside durable room persistence.

Dice should **not** be added to:

- board object persistence;
- durable room snapshots;
- local room snapshots;
- room reset content semantics.

## Actor color rule

Dice color is actor-linked.

Meaning:

- dice color marks who performed the roll;
- it is a transient multiplayer cue;
- it does not imply permissions or ownership.

### Payload rule
The shared roll event should carry actor presentation data directly:

- `actorId`
- `actorName`
- `actorColor`

If actor color is unavailable, fallback should be neutral.

It must never silently fall back to the local viewer’s own color.

## Control surface

The current accepted control surface is intentionally minimal:

- compact tray;
- buttons for `d4 / d6 / d8 / d10 / d12 / d20 / d100`;
- one click = one public roll.

This remains the right alpha scope.

## Layering and interaction rules

- dice overlay should not break normal board interaction;
- scene container should remain effectively non-blocking for board control;
- tray controls can use normal pointer interaction;
- dice should appear, settle, remain visible briefly, then disappear automatically.

## Current known debt

Accepted current debt:

- residual visual polish debt;
- tray/UI can still be tightened;
- no roll history;
- no labels;
- no private rolls;
- no advanced control surface.

This debt is acceptable for current alpha.

## Manual QA targets

When validating dice, check:

- local one-user roll
- two-client shared public roll
- sequential rolls by different participants
- actor color correctness for remote rolls
- visible final outcome consistency
- tray usability
- behavior with media dock open
- behavior while board is still usable behind the overlay

## Success criteria for the current layer

The current dice layer is considered healthy enough if:

- the roll feels tactile enough to justify the feature;
- multiple participants observe the same public roll moment;
- the final visible result matches across clients;
- actor color reads correctly;
- the overlay does not fight the board UX;
- the implementation remains narrow.

## Change control

This document is the canonical semantic/source-of-truth doc for the current dice layer in `play-space-alpha`.

If future implementation reveals ambiguity:

1. do read-only analysis first
2. update this doc if the semantic contract really changes
3. only then make semantic code changes
