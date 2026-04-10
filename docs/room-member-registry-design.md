# Room Member Registry and Room-Scoped Color Allocation Design

Status: focused design source  
Scope: room member registry, room-scoped participant identity, unique/stable room color assignment

This document defines the smallest coherent model for making participant colors:

- unique within a room;
- stable over time within that room;
- preserved for returning participants;
- conflict-safe under simultaneous joins.

This is not:

- a full account/auth system;
- a global identity platform;
- a heavy admin/member-management chapter.

## 1. Why this chapter exists

The current project already treats participant color as a core identity signal.

That signal becomes much more useful if room colors are:

- unique;
- stable;
- preserved for returning participants.

The current architecture does not guarantee that because:

- live presence is awareness-only and ephemeral;
- local participant session is browser-local;
- room metadata currently does not hold member records;
- entry-time filtering cannot resolve simultaneous joins authoritatively.

So stable unique room colors require a real room member model.

## 2. Canonical distinction: presence vs member registry

### Live presence

Live presence answers:

> who is here right now?

Current home:

- awareness / realtime presence

Properties:

- ephemeral;
- disappears on disconnect;
- not durable room memory.

### Room member registry

Room member registry answers:

> who belongs to this room's participant history, and which color is reserved for them?

Properties:

- persistent room-level metadata;
- includes offline members;
- survives temporary absence;
- authoritative source for room-scoped color assignment.

This distinction is required.
Presence alone cannot provide stable color identity.

## 3. Recommended room member model

Smallest coherent member record:

```ts
type RoomMemberRecord = {
  participantId: string;
  displayName: string;
  assignedColor: string;
  joinedAt: number;
  lastSeenAt: number;
  isRoomCreator: boolean;
};
```

Recommended registry shape:

```ts
type RoomMemberRegistry = Record<string, RoomMemberRecord>;
```

Key design choice:

- member identity is keyed by `participantId`, not by display name

Why:

- names can change;
- color assignment should survive name edits;
- current local participant session already has a stable room-scoped `id` for the current browser participant.

## 4. Recommended room-scoped color allocation model

Room color should be treated as:

- assigned to a member record;
- unique within the room registry;
- reserved while that member record exists.

Canonical allocation rule:

1. participant joins room;
2. system resolves room member record by `participantId`;
3. if a member record already exists, reuse its `assignedColor`;
4. otherwise allocate a free color from room palette;
5. persist that color in the room member registry;
6. use resolved assigned color as the participant's live room color.

Important implication:

- local entry-screen color should become a preference hint, not final authority

## 5. Is entry-only filtering sufficient?

No.

Entry-only filtering can improve UX, but it is not authoritative because:

- two clients can join simultaneously;
- awareness is not durable enough to reserve colors for offline members;
- local browser state cannot resolve room-wide races.

So:

- entry filtering is optional UI assistance;
- room member registry is the real source of truth.

## 6. Conflict and race resolution

Recommended narrow conflict model:

- registry write is authoritative;
- first successful color claim keeps the color;
- later conflicting join is reallocated.

Practical resolution rule:

1. joining participant proposes preferred/free color;
2. registry reconciliation checks whether it is still unclaimed;
3. if already claimed:
   - keep existing owner unchanged;
   - assign next available free color to the joining participant;
4. sync resolved assigned color back into:
   - local participant session;
   - live presence;
   - any visible participant UI.

This design assumes conflicts are handled at room-registry level, not only in entry UI.

## 7. Returning participants

Returning participant rule:

- look up by `participantId`
- if member record exists, restore its `assignedColor`
- do not reallocate unless an explicit future member-management action changes it

This means:

- color is stable within the room over time
- a return to the same room in the same browser/client identity keeps the same color

## 8. Offline participants

Offline members should remain in the room member registry.

Why:

- color stability requires reservation beyond active presence;
- room membership and live presence are different concepts;
- future room members surface should reflect offline members too.

Important product effect:

- some colors may remain unavailable even when nobody is currently online

That is acceptable if stability is a higher-priority contract than temporary reuse.

## 9. Relationship to current room memory model

Recommended placement in room-memory terms:

- member registry = persistent room metadata / room memory
- live presence = awareness-only state
- local participant session = client-local cache of resolved room member identity/color

This fits the current memory model better than trying to push color uniqueness into presence.

## 10. Relationship to current color model

This chapter does not change the semantic role of participant color.

It changes how that color is resolved inside a room.

Current meaning remains:

- participant color = live identity color

New additional rule:

- within a room, that live identity color should be resolved from authoritative room member assignment when available

## 11. Relationship to room creator semantics

Room creator remains:

- a room member;
- with additional room-level semantics.

The member registry does not imply a broad role system.

For now the only special member meaning needed is:

- `isRoomCreator`

This is enough to support later host-facing member tools without inventing global accounts or admin roles.

## 12. Future host/member surface implications

This model implies a later small room members surface.

Eventually useful host-facing capabilities:

- see room members, including offline ones;
- see which color is assigned to whom;
- possibly reassign a member color;
- possibly remove/archive stale members.

That future surface should remain:

- room-scoped;
- lightweight;
- adjacent to room tools;
- not a broad admin system.

## 13. Out of scope for this chapter

This design does not assume:

- global login;
- cross-device identity solved universally;
- invitation systems;
- member roles beyond room creator;
- full moderation system;
- heavy admin/member dashboard.

## 14. Recommended first implementation shape

Smallest safe first implementation:

1. extend room metadata with `members`
2. add room-member resolution helper on join
3. allocate unique room color from registry
4. reconcile local participant session color to resolved room color
5. publish resolved color into live presence
6. treat offline members as still reserving their colors

Only after that should the project add:

- entry-screen color availability hints
- host-facing room members surface

## 15. Open questions / deferred items

Open but intentionally deferred:

- how to handle palette exhaustion cleanly
- when to allow host-driven member removal
- whether stale offline members get automatic archival rules
- what limited cross-device recovery, if any, should exist later

These questions should not block the first registry/allocation implementation slice.
