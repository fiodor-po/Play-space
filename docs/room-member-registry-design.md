# Room Member History and 8-Seat Room Color Design

Status: corrected design source  
Scope: room member history, remembered room color defaults, active color blocking

This document defines the corrected target model for the current product stage:

- exactly 8 allowed participant colors;
- at most 8 simultaneous active participants per room;
- only currently active participants block colors;
- offline participants do not reserve colors;
- returning participants get their previous room color preselected if it is free;
- returning participants may still choose another currently free color before join;
- no generated overflow colors.

This is not:

- a permanent room-color ownership system;
- an offline color reservation system;
- a host/member management UI chapter;
- a full account/auth system.

## 1. Why this correction exists

The project already built part of a heavier room-color direction:

- room member registry groundwork;
- join-time member registration;
- authoritative room-color assignment;
- returning-member fixed-color behavior.

That is no longer the intended target.

The current product stage wants a lighter, stricter model:

- fixed 8-color palette;
- 8 active seats;
- active presence drives color blocking;
- room member history remembers previous defaults, but does not hard-own colors.

## 2. Canonical distinction: active presence vs room member history

### Active presence

Active presence answers:

> who is in the room right now, and which colors are currently occupied?

Properties:

- live;
- ephemeral;
- source of active color blocking.

### Room member history

Room member history answers:

> who has used this room identity before, and what was their previous room color?

Properties:

- persistent room metadata;
- room history / remembered defaults only;
- not an active reservation source.

This is the core correction.

Room member history may stay.
Permanent room-color ownership is not the active direction.

## 3. Recommended room member model

The current member record shape is still acceptable as room history:

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

But `assignedColor` should now be interpreted as:

- previous room color / remembered default

and not as:

- permanently reserved room color

So room members are now framed as:

- room history
- remembered defaults
- not authoritative color owners

## 4. Corrected room color model

The room color system should now follow these rules:

1. the room has exactly 8 valid participant colors;
2. only active participants block those colors;
3. offline members do not block colors;
4. a returning participant may have a remembered previous room color;
5. if that remembered color is free, preselect it;
6. if it is occupied, preselect another free color;
7. the participant may still choose any currently free color before join;
8. if all 8 colors are occupied, joining is blocked.

## 5. What is explicitly superseded

These assumptions are explicitly superseded:

- offline members reserve colors
- returning members must always be restored to a fixed room color
- room color is a durable ownership contract
- overflow/generated colors are acceptable after the main palette is exhausted
- entry color choice is mostly cosmetic because authoritative room color will overwrite it

## 6. Returning participants

Returning participant rule:

- look up by current local `participantId`
- read previous room color from room member history
- if it is free among active participants, preselect it
- if it is occupied, choose another free color as the current default
- participant may still choose any other currently free color before join

So repeat join means:

- remembered default
- not fixed ownership

## 7. Active color blocking

Blocked colors should now be derived from:

- currently active room presence

not from:

- offline room-member history

This means:

- entry hints should reflect active occupancy
- join validation should also reflect active occupancy
- room metadata should not deny a color just because an offline participant used it previously

## 8. Full room behavior

If all 8 colors are occupied by active participants:

- room is at active participant capacity
- joining is blocked
- no ninth color should be generated

This rule is part of the product model, not an implementation fallback.

## 9. Relationship to current color semantics

This correction does not change what participant color means semantically.

It still means:

- current live participant identity color

What changes is only:

- how that color is chosen at room entry
- what blocks it
- whether it is treated as permanent ownership

## 10. Relationship to room creator semantics

Room creator remains:

- a room member in the history sense;
- with separate room-level governance semantics.

The color system correction does not imply any new host/member management surface.

## 11. Out of scope

Out of scope:

- host/member management UI
- account/auth system
- global cross-device identity guarantees
- broad room moderation model
- permanent color ownership semantics

## 12. Recommended next implementation shape

Smallest safe next implementation:

1. keep room member records as room history / remembered defaults;
2. stop treating room-member color as offline reservation;
3. derive active occupied colors from live presence;
4. preselect previous room color only if currently free;
5. allow choosing any currently free color before join;
6. block join when all 8 colors are occupied.
