# ExecPlan — Room Member Registry and Unique Room Colors

## 1. Goal

Introduce the smallest coherent architecture for room-scoped participant identity so that:

- participant colors become unique within a room;
- colors remain stable over time within that room;
- returning participants keep their assigned room color;
- simultaneous color conflicts resolve correctly;
- future host-facing room member surfaces can include offline members.

## 2. Why now

This chapter is now necessary because participant color is already a meaningful product identity signal, and the project wants that signal to become room-stable and conflict-safe.

The current architecture can no longer get there with entry-time filtering or awareness presence alone.

Without this work:

- simultaneous joins can still conflict;
- offline returning members cannot keep reserved colors reliably;
- future host/member tooling would rest on weak identity assumptions.

## 3. Roadmap link

Supports:

- `ROADMAP.md` Phase B follow-up product hardening
- P1/P2 style room lifecycle clarity and stronger multiplayer readability
- future backlog area adjacent to room tools / governance / member surfaces

This work is not a full permissions/admin chapter.
It is a room identity and room metadata chapter.

## 4. In scope

In scope for the planned chapter:

- room member registry data model
- room-scoped color assignment model
- join-time member resolution
- simultaneous color conflict handling
- offline member persistence
- local participant session reconciliation to assigned room color
- future room-members host surface implications

Primary files/modules likely involved:

- `src/lib/roomMetadata.ts`
- `src/lib/roomSession.ts`
- `src/lib/roomPresenceRealtime.ts`
- `src/App.tsx`
- current room docs and color docs

## 5. Out of scope

Out of scope:

- full account/auth system
- global cross-device identity guarantees
- invitations
- broad member-management UI
- role system beyond current room creator semantics
- unrelated header/panel redesign
- broad rewrite of presence transport

## 6. Current mechanism

Current system shape:

- local participant session lives in browser session storage
- participant color is chosen locally and stored locally
- live presence publishes the current participant color via awareness
- room metadata stores creator/baseline state, but not members
- awareness presence disappears on disconnect
- no authoritative room-scoped member/color reservation exists

Consequences:

- entry-time filtering could only be advisory
- simultaneous joins can race
- offline members cannot reserve colors
- returning participant color stability is only browser-local best effort

## 7. Target mechanism

Target mechanism:

- room metadata includes a persistent room member registry
- each room member has an assigned room color
- that assigned color is unique within the room
- local participant session is reconciled against the room member record
- live presence publishes the resolved room color, not an arbitrary local choice
- offline members remain in registry and keep their color reservation

Important architectural separation:

- room member registry = room metadata / durable room identity layer
- live presence = awareness-only current activity layer
- local participant session = client-local cache of resolved room member identity

## 8. Migration plan

### Phase 1 — Data model groundwork

Add room member registry types and storage helpers to room metadata without changing visible behavior yet.

Safe outcome:

- repo remains buildable
- room metadata can represent members
- existing room behavior remains unchanged

### Phase 2 — Join-time member resolution

At room join:

- resolve or create room member record by `participantId`
- if record exists, reuse assigned color
- if record does not exist, allocate first free color
- persist result in room metadata

Safe outcome:

- room color becomes authoritative at join time
- no host UI required yet

### Phase 3 — Conflict-safe color allocation

Make color allocation robust against simultaneous joins by reconciling proposed color against stored room member registry state.

Rule:

- first successful claim keeps color
- later conflict gets next free color

Safe outcome:

- uniqueness is enforced by registry logic, not only entry UI

### Phase 4 — Local/presence reconciliation

After resolution:

- update local participant session with assigned room color
- publish resolved color to live presence
- ensure current UI reads the resolved room color consistently

Safe outcome:

- presence, UI, and stored session agree on room identity color

### Phase 5 — Entry-screen hints

Only after authoritative registry logic exists:

- expose used/reserved colors as advisory UI in room entry flow
- present picker as preference hint rather than source of truth

Safe outcome:

- better UX without pretending the picker is authoritative

### Phase 6 — Host-facing room members surface

After registry logic is stable:

- add a small room members surface for host/room creator
- include offline members
- possibly show assigned colors and member list

Safe outcome:

- host-facing surface rests on real member data rather than ephemeral presence

## 9. Validation

Implementation phases should validate with:

- `npm run build`

Manual QA by phase:

### After Phase 1

- existing room join/leave flow still works
- existing room metadata still loads for pre-member rooms

### After Phase 2

- joining a room creates/resolves a room member record
- rejoining same room in same browser restores assigned color

### After Phase 3

- simultaneous joins do not end with the same assigned color
- conflict resolution converges to distinct final colors

### After Phase 4

- local session color matches resolved room color
- live presence shows the resolved room color
- returning participant keeps same room color

### After Phase 5

- entry screen hints match registry state
- hints do not break if another participant joins concurrently

### After Phase 6

- room creator sees member list including offline members
- colors shown there match assigned room colors

## 10. Risks

Key risks:

- backwards compatibility for existing room metadata
- palette exhaustion with current small color set
- confusing distinction between local preferred color and resolved room color
- race handling if storage/realtime update order is not explicit enough
- overreaching into account/global identity work

Rollback points:

- after Phase 1 types/storage only
- after Phase 2 join-time registry without UI hints
- after Phase 4 before host-facing member surface

## 11. Stop conditions

Stop and split the work if:

- implementation starts requiring global auth/account assumptions
- the room member registry starts implying a broad role/admin system
- join-time reconciliation cannot be added without touching too many unrelated room bootstrap paths
- host/member UI starts expanding beyond a small room-scoped member list
- palette exhaustion forces a separate color-palette design chapter first

## 12. Documentation updates

If this plan lands, update:

- `ROADMAP.md`
- `play-space-alpha_current-context.md`
- `play-space-alpha_case-study-log.md`
- `docs/color-model-design.md`
- `docs/room-behavior-spec.md`
- `docs/room-memory-model.md`
- `docs/room-member-registry-design.md`

If host/member surface becomes real later, also update any room-tools / governance-facing docs that mention room creator capabilities.
