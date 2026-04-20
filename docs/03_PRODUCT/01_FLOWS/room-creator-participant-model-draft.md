# Room / Creator / Participant Model Draft

Status: working draft  
Scope: room identity, creator truth, live participant state, creator-colored object fallback, snapshot-backed appearance cache

## 1. Purpose

This draft records a working target model for one narrow question:

- what belongs to room identity,
- what belongs to live participant state,
- what belongs to room-scoped remembered appearance,
- and how creator-colored objects should resolve color and name.

This is not:

- an auth/account design;
- a permissions system;
- a durable participant roster platform;
- a full participant-marker implementation plan.

## 2. Current problem

The current repo already distinguishes some layers correctly:

- durable room identity;
- live occupancy/presence;
- local room member history;
- creator-linked board objects.

But creator-colored rendering still has a gap:

- objects store `creatorId`, which is good;
- live current color is resolved by `creatorId`, which is good;
- when live resolution disappears, rendering falls back to baked-in object color, which is not honest current creator truth.

This draft proposes a cleaner target model.

## 3. Target model

### A. Durable room identity

Room identity should remain very small.

```ts
type DurableRoomIdentity = {
  roomId: string;
  creatorId: string | null;
  createdAt: string;
};
```

Purpose:

- identify the room as a room;
- identify the room creator;
- exist independently of whether the room is currently live.

Room identity should not own:

- current participants;
- participant colors;
- participant history;
- creator-colored object fallback state.

### B. Live participant state

This is the current active room participant layer.

```ts
type LiveParticipantState = {
  participantId: string;
  currentName: string;
  currentColor: string;
  cursor: { x: number; y: number } | null;
  lastActiveAt: number;
};
```

Purpose:

- answer who is in the room right now;
- drive active color blocking;
- drive active presence/cursor rendering;
- provide current creator-linked color/name while the participant is live.

This layer is ephemeral.
It may disappear when the participant leaves or disconnects.

### C. Room-scoped last-known participant appearance

This is the proposed missing layer.

```ts
type RoomParticipantAppearance = {
  participantId: string;
  lastKnownName: string;
  lastKnownColor: string;
  lastSeenAt: number;
};
```

Purpose:

- provide non-live fallback for creator-linked rendering;
- remember the last known appearance of a participant in this room;
- keep creator-linked objects stable when live participant state is currently absent.

Important rule:

- this is room-scoped;
- not global cross-room person identity;
- not a durable participant roster with authority over room access or membership.
- this draft currently treats it as part of durable room snapshot state rather than as a separate backend store.

### D. Local room member history

Local room member history may still exist, but stays convenience-only.

It may remember:

- previous display name;
- previous assigned color;
- joinedAt / lastSeenAt;
- whether the participant was known as creator in that local browser view.

But it should not be treated as canonical shared truth for creator-colored rendering.

### E. Creator-linked objects

Creator-linked objects should persist:

- `creatorId`
- object-specific geometry/content data

They should not treat baked-in historical creator color as canonical truth.

Existing object-local color fields may remain temporarily for migration compatibility,
but should not be the target long-term authority.

## 4. Rendering resolution order

### Creator-linked color

The intended color resolution order is:

1. live current participant color by `creatorId`
2. room-scoped last-known participant color by `creatorId`
3. temporary legacy fallback from stored object color
4. explicit unresolved fallback if needed

### Creator-linked name

The intended name resolution order is:

1. live current participant name by `creatorId`
2. room-scoped last-known participant name by `creatorId`
3. explicit unresolved label

## 5. Ownership draft

This revised draft treats participant appearance like this:

- `creatorId` stays in durable room identity
- current name/color stay in live participant state
- room-scoped last-known appearance lives in durable room snapshot

Proposed snapshot-side shape:

```ts
type DurableRoomSnapshot = {
  roomId: string;
  revision: number;
  savedAt: string;
  tokens: BoardObject[];
  images: BoardObject[];
  textCards: BoardObject[];
  participantAppearance?: Record<string, RoomParticipantAppearance>;
};
```

Interpretation:

- room snapshot is no longer only "what objects are on the board"
- it becomes "recoverable durable room state except identity facts"

This means:

- room identity still stays separate
- board content still stays in snapshot
- room-scoped creator appearance fallback is restored together with other durable room state
## 6. Example behavior

Scenario:

- user A creates the room;
- users B and V enter;
- B and V create objects;
- B leaves;
- G later joins and chooses the same visible color B previously used;
- B later returns with a new color.

Expected behavior under this model:

- room identity still says creator is A;
- objects created by B keep `creatorId = B`;
- while B is live, B-owned creator-colored objects render with B's current live color;
- after B leaves, B-owned creator-colored objects render with B's room-scoped last known color;
- G taking the same raw color does not change B-owned objects, because rendering resolves by `creatorId`, not by "who currently has this color";
- if B returns with a new color, B-owned objects switch to the new live color, and the room-scoped last known color also updates.

## 7. What this model intentionally does not require

This draft does not require:

- a shared durable participant roster;
- offline color reservation;
- global participant profile storage;
- account/auth identity;
- heavy room membership semantics.

## 8. Why this model is attractive

Benefits:

- keeps room identity small and honest;
- keeps creator truth room-level;
- keeps current active participants in the live layer where they belong;
- gives creator-linked objects a stable offline fallback that is better than baked-in object color;
- keeps fallback recovery inside the existing durable room snapshot channel instead of requiring a separate first-pass backend store;
- avoids turning room history into a heavy membership system.

## 9. Risks and open questions

### Risk 1: snapshot scope becomes broader

This model makes snapshot broader than pure board-content recovery.

That can be good, but it changes the meaning of snapshot from:

- "saved board content"

to:

- "recoverable durable room state except identity facts"

The repo must accept that broadened snapshot role explicitly if this draft is chosen.

### Risk 2: update cadence may diverge from content writes

Participant appearance can change without board content changing.

If snapshot writes still happen only on board-content-oriented checkpoints,
appearance truth may lag behind participant updates.

So this model only works well if snapshot write policy is allowed to include
participant appearance updates without waiting for object mutations.

### Risk 3: object-local fallback may linger too long

If migration stalls, the repo could end up with:

- live participant color,
- last-known appearance,
- and still-active baked-in object color fallback.

That would preserve too many competing sources.

### Risk 4: some object families may need different rules

The model is strongest for:

- participant-marker tokens;
- creator-colored token rendering;
- creator-linked drawing strokes.

It may not apply identically to every object type without nuance.

### Risk 5: appearance state may deserve different durability semantics later

This draft assumes snapshot durability is good enough for creator fallback.

If later the product needs:

- stronger deploy-stable room durability,
- appearance updates independent of content snapshot cadence,
- or richer room-level participant memory,

then appearance may eventually want its own backend layer after all.

## 10. Provisional judgment

This is now a plausible target direction, not an obviously final one.

Why:

- it separates room identity from participant presence cleanly;
- it avoids heavy roster/platform semantics;
- it gives a coherent answer to the offline creator-color problem;
- it reuses an already existing durable room channel instead of adding a new one immediately;
- it fits the current alpha product stage better than either:
  - "creator color is only live and becomes unresolved when offline", or
  - "stored object color is the canonical fallback forever".

But it is still not a complete implementation-ready design.

Before implementation, one more decision is still required:

- whether snapshot durability and snapshot write cadence are honest enough owners for participant appearance updates.

## 11. Recommended next interpretation

Use this draft as:

- a target-model note;
- a framing input for the later participant-marker / creator-color chapter.

Do not yet treat it as accepted canonical architecture without a follow-up decision on:

- whether snapshot-backed ownership is the right durable owner in practice, or only the right simplifying hypothesis for the next decision pass.
