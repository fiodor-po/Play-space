# Room Document Persistence Target Memo

## Status

Accepted target-direction memo.

This memo records the preferred mature model for room content persistence and recovery.

Product reference point:

- aim for FigJam-style behavior and reliability;
- keep play-space-alpha board-first and lightweight;
- preserve current product guardrails;
- avoid temporary compromises becoming the long-term model.

## Problem Statement

Current room-content persistence uses three separate practical layers for the same committed board content:

- live shared room state;
- durable room snapshot;
- browser-local room snapshot.

This creates avoidable arbitration problems:

- committed changes can exist locally before durable snapshot catches up;
- stale durable snapshot can beat fresher local state during same-browser recovery;
- persistence timing depends on broad effect windows and interaction flags instead of commit boundaries;
- narrow hotfixes fix one corridor at a time without improving the core model.

## Target Model

The target model is a single logical room document with multiple replicas.

### 1. Room identity layer

This stays separate and small:

- `roomId`
- `creatorId`
- `createdAt`

This remains outside board-content persistence.

### 2. Room document

This is the committed room content document for the board.

It should contain:

- tokens
- images
- text cards
- committed drawing result
- later: room-scoped last-known participant appearance

It should not contain:

- presence
- cursor
- temporary previews
- drag/transform previews
- active locks as durable truth

### 3. Local replica

The browser stores a persistent local replica of the same room document.

Purpose:

- instant reopen in the same browser;
- offline-friendly continuity;
- safety against short network/durable lag.

This is not a separate fallback truth model.
It is a replica of the room document.

Accepted first implementation shape:

- use `IndexedDB` as the browser-local replica store;
- store one full room-document replica per room as the first baseline;
- keep the document shape close to the current room-document envelope;
- defer delta-log / compaction work until the IndexedDB baseline is stable.

Reason:

- current realistic room payloads can already exceed `localStorage` quota;
- image-heavy content makes synchronous string-based storage a poor long-term fit;
- the project needs a safe same-browser recovery base before it needs a
  Figma-class local update-log engine.

### 4. Server durable replica

The server stores the durable replica of the same room document.

Preferred mature shape:

- append-only update log;
- periodic checkpoint / compacted snapshot.

Checkpoint exists for load speed.
Update log exists for freshness and correctness.

### 5. Live collaboration layer

Active clients exchange live updates against the same logical room document.

Live state is the active-session source of truth.
Durable state is the non-live shared source of truth.

### 6. Awareness layer

Awareness remains separate and ephemeral:

- presence
- cursors
- activity indicators
- locks
- previews

Awareness does not participate in durable persistence arbitration.

## Behavioral Rules

### Commit boundary rule

A board mutation becomes persistence-eligible exactly when it becomes committed room content.

Examples:

- token drop finalization
- image drag end
- image transform end
- committed drawing result
- note-card resize end
- note-card edit save

Preview and in-progress interaction state stay outside persistence.

### Read rule

Mature target behavior:

1. open the local replica immediately;
2. render it immediately;
3. attach live transport;
4. fetch or receive missing durable/live updates;
5. converge to the freshest shared room document state.

Accepted phase-1 bridge behavior:

1. preserve active-room `live-wins` behavior;
2. keep durable replica as shared non-live truth;
3. use the local IndexedDB replica as a same-browser fast-recovery fallback when
   live state is absent or not ready yet;
4. avoid turning local browser state into cross-browser arbitration authority.

### Write rule

Committed mutation pipeline should behave like this:

1. apply mutation to in-memory room document;
2. persist to local replica immediately;
3. enqueue/send durable/live update immediately;
4. record acknowledgement/version when durable write is accepted.

### Arbitration rule

Arbitration should happen at the room-document version/update level.

It should not depend on:

- choosing between separate local and durable snapshots by ad hoc priority;
- `savedAt` timestamps as the main correctness mechanism;
- late effect windows that hope interaction flags have settled.

## Why This Matches FigJam-Class Behavior

This model matches the practical shape used by strong browser-multiplayer products:

- one logical collaborative document;
- local persistent copy for instant continuity;
- server durable copy for shared non-live truth;
- live sync for active sessions;
- awareness separated from durable content;
- checkpoints for speed, logs/updates for correctness.

This is the right direction for play-space-alpha because it gives:

- faster same-browser recovery;
- better cross-browser correctness;
- fewer timing bugs around exit/refresh;
- a cleaner path to reliable hosted behavior.

## What This Replaces

This target model replaces the current practical framing where:

- local room snapshot behaves like a separate fallback source;
- durable snapshot behaves like a separate competing source;
- recovery picks winners between snapshots instead of converging replicas.

The project can keep the current implementation temporarily, but the target model should guide new work.

## Migration Direction

### Phase A. Commit-boundary persistence policy

Introduce one rule:

- committed room content is eligible for persistence immediately at commit boundary.

Use this to remove effect-window dependence from the known loss corridors.

### Phase B. Local replica semantics

Reframe browser-local room snapshot as a local replica of the room document.

Add explicit version or revision tracking for the room document at the client layer.

Accepted first implementation slice inside this direction:

- move browser-local replica storage from `localStorage` to `IndexedDB`;
- write the full room document on commit boundary;
- add a narrow same-browser bootstrap read bridge;
- leave delta-log / checkpoint compaction as a later follow-up.

### Phase C. Durable write model

Move durable persistence from whole-room ad hoc snapshot timing toward:

- update-driven persistence;
- checkpointed durable recovery.

### Phase D. Recovery convergence model

Open local replica first, then converge with live/durable updates.

This phase removes most of the current arbitration complexity.

### Phase E. Participant appearance in the room document

Add room-scoped last-known participant appearance as part of durable recoverable room document state.

This supports creator-linked fallback without mixing it into room identity.

## What Should Stay Separate

These concerns should remain separate even in the mature model:

- room identity
- room content document
- awareness/presence
- UI-only state
- local interaction state

## What Not To Do

- do not make awareness the persistence layer;
- do not use object-baked color as long-term creator truth;
- do not use browser-local snapshot as shared arbitration authority;
- do not keep expanding corridor-specific hotfixes without converging on the room-document model;
- do not turn this into a heavy VTT entity platform.

## Accepted Follow-up Direction

Accepted decisions:

1. this memo is the target persistence direction for the project;
2. `docs/refactor-plan.md` should treat room-document replicas as the active architecture chapter;
3. the chosen migration strategy is `parallel replacement`;
4. the next implementation phase is `narrow commit-boundary persistence phase`.
5. the first concrete local-replica storage baseline is `IndexedDB`, not
   `localStorage`;
6. the first concrete local-replica shape is a full room-document replica per
   room;
7. local delta-log / compaction design stays deferred until the IndexedDB
   baseline is stable.
