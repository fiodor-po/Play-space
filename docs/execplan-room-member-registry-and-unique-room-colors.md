# ExecPlan — Room Color Defaults and 8-Seat Active Color Blocking

## 1. Goal

Correct the room color/member chapter toward the current intended product rule:

- exactly 8 allowed participant colors;
- at most 8 simultaneous active participants per room;
- only currently active participants block colors;
- offline participants do not reserve colors;
- returning participants get their previous room color preselected if it is free;
- returning participants may still choose another currently free color before join;
- no generated overflow colors.

## 2. Why now

The current code and docs moved partway into a heavier model:

- persistent room member registry;
- authoritative room-color assignment;
- offline color reservation;
- returning-member fixed-color behavior.

That is no longer the active direction.

The project now wants a lighter room-presence-driven model that is easier to explain and better matched to the current product stage.

## 3. Roadmap link

Supports:

- current multiplayer readability and room-entry clarity
- a strict 8-color / 8-concurrent-user room model
- a later narrow corrective runtime pass

This does not introduce:

- host/member management UI
- global identity/auth
- heavy member ownership semantics

## 4. In scope

In scope for the corrected chapter:

- fixed 8-color palette
- active-presence-driven color blocking
- remembered previous room color for repeat joins
- join-time selection of any currently free color
- blocking join when all 8 active colors are occupied
- narrowing room members to room history / remembered defaults

Primary files/modules likely involved:

- `src/lib/roomSession.ts`
- `src/lib/roomPresenceRealtime.ts`
- `src/App.tsx`
- `src/lib/roomMetadata.ts`
- current room/color docs

## 5. Out of scope

Out of scope:

- host/member management UI
- global cross-device identity guarantees
- offline color reservation
- unlimited palette growth
- generated overflow colors
- broad account/auth work
- broad room lifecycle redesign

## 6. Superseded assumptions

These are explicitly no longer the active direction:

- offline participants reserve colors
- room-member `assignedColor` is a permanent room-ownership contract
- returning participants should be locked back to their previous room color before join
- palette growth beyond the fixed room palette is acceptable
- future host/member surface is needed to justify the color system

## 7. Target mechanism

Target mechanism:

- room uses exactly 8 valid participant colors
- active colors are derived from currently active room presence
- only active participants block those colors
- room member records may remain as room history / remembered defaults
- previous room color is remembered for repeat joins, but not hard-owned
- if remembered color is free, it is preselected
- if remembered color is occupied, another free color is preselected
- participant may choose any currently free color before join
- if all 8 colors are occupied, joining is blocked

Important architectural separation:

- active presence = who is in the room right now and which colors are occupied
- room members = room history / remembered defaults only
- local participant session = local cache of identity and last chosen room color

## 8. Corrective migration plan

### Phase A — Docs correction

Correct the docs so they stop describing offline color reservation and authoritative permanent color ownership as the active direction.

### Phase B — Runtime softening

Keep room member records, but reinterpret them as:

- remembered room history
- previous/default color memory

and not as authoritative color owners.

### Phase C — Active blocking join path

At entry/join:

- derive occupied colors from active presence
- preselect remembered previous color only if it is free
- allow any currently free color to be chosen
- block join if all 8 colors are occupied

### Phase D — Entry-screen truthfulness

Update entry UI so:

- repeat joins show remembered previous color as a default, not a lock
- blocked/occupied colors are derived from current active participants
- no UI implies offline reservation

## 9. Validation

Implementation phases should validate with:

- `npm run build`

Manual QA by phase:

### After Phase A

- docs no longer mix old and new directions
- 8-color / 8-active-user rule is recorded clearly

### After Phase B

- room members still load safely from existing metadata
- room history/defaults remain intact
- offline members no longer act as active color blockers

### After Phase C

- first-time join can choose any currently free color
- repeat join preselects previous color only if free
- active participants do not share a color
- join is blocked when all 8 colors are occupied

### After Phase D

- entry screen reflects active occupancy honestly
- no UI implies permanent room-color ownership

## 10. Risks

Key risks:

- mixing remembered defaults with active color blocking in the same UI
- leaving current code half on the old authoritative model
- not defining a clear behavior when all 8 colors are occupied
- treating current room metadata as stronger than the new product rule intends

Rollback point:

- after docs correction and before runtime behavior change

## 11. Stop conditions

Stop and split the work if:

- implementation starts drifting back toward offline reservation
- the room member registry starts implying a broad member-management system
- the 8-color / 8-concurrent-user rule stops being treated as strict
- the work starts requiring host/member UI to make sense

## 12. Documentation updates

If this corrected plan lands, update:

- `play-space-alpha_current-context.md`
- `ROADMAP.md`
- `docs/room-member-registry-design.md`
- any room-entry/current-state docs that still imply permanent room-color ownership
