# Participant Identity Design

Status: canonical near-term design source  
Scope: browser-local participant identity, repeat join semantics, foreground/background tab behavior

This document defines the intended participant identity model for the current product stage.

It is intentionally narrow.

It is not:

- a full auth/account system;
- a cross-device identity guarantee;
- a host/member management UI chapter;
- a redesign of room color logic.

## 1. Canonical participant identity model

For the current product stage:

- same browser profile = same participant;
- participant identity is not name-based;
- participant identity is browser-local;
- new browser or new device still counts as a new participant for now.

The canonical participant identity source should be:

- a stable browser-local participant id;
- reused across reload, close/reopen, and new tabs in the same browser profile.

This is the intended correction to the current too-tab-scoped model.

## 2. What "same participant" means

Near-term product meaning:

- reload in the same tab = same participant;
- close the tab and reopen later in the same browser profile = same participant;
- open a new tab in the same browser profile = same participant;
- open the room in another browser profile/device = new participant.

Name does not define identity.

Display name remains:

- editable;
- participant-facing;
- a label only.

## 3. Multi-tab rule

Multiple tabs are allowed.

But multiple tabs in the same browser profile should not behave like multiple independent participants.

Canonical rule:

- one browser profile may have multiple room tabs open;
- they still represent one participant identity;
- only the foreground/visible tab should act as the live participant carrier;
- background tabs should be soft-suspended for active presence behavior.

## 4. Foreground-tab vs background-tab behavior

Foreground/visible tab:

- may publish active participant presence;
- may publish cursor and other live participant-facing presence signals;
- acts as the live participant carrier for that browser-local identity.

Background/hidden tab:

- should not keep publishing active participant presence as if it were a second participant;
- should be soft-suspended for active presence behavior;
- may remain open as a viewing/editing shell, but should not present as a separate active participant actor.

This rule is specifically about live participant presence behavior.

It does not imply:

- forced tab closing;
- full session invalidation;
- account/session management complexity.

## 5. Repeat-join semantics

Repeat join should now mean:

- if the browser has a known participant identity for that room flow, reuse it;
- restore the participant's room-local defaults/history from that identity;
- preselect previous room color if free;
- allow choosing another currently free color before join;
- do not infer identity from name alone.

This keeps repeat join coherent without turning color/history into ownership.

## 6. Relationship to room-member history

Room-member history may safely assume:

- a browser-local participant identity is meaningful enough to remember previous room defaults;
- previous display name and previous room color can be stored as room history/defaults;
- room-member history is now stronger than a single tab session, but still not global person identity.

Room-member history should not yet assume:

- cross-device same-person guarantees;
- human-verified real identity;
- moderation/admin-grade membership semantics.

## 7. Relationship to active presence

Important distinction:

- participant identity = who this browser-local participant is;
- active presence = whether a foreground tab is currently acting as the live carrier for that participant.

So the system should treat:

- identity as durable browser-local state;
- active presence as foreground-tab-scoped live behavior.

This is why background tabs may remain the same participant but should not publish active presence as a separate actor.

## 8. What remains out of scope

Out of scope:

- auth/login/accounts;
- global cross-device participant identity;
- participant profile sync across browsers/devices;
- host/member admin surface;
- room permissions redesign;
- broad room color redesign.

Also out of scope for the first slice:

- solving every multi-tab edge case perfectly;
- building a heavy leader-election/session-lock system.

## 9. Recommended first implementation slice

The smallest safe implementation slice should be:

1. move participant identity from tab-scoped session persistence to stable browser-local persistence;
2. keep room-scoped name/color defaults layered on top of that identity;
3. add foreground/background tab handling for active presence publishing;
4. treat background tabs as soft-suspended live carriers instead of separate active participants.

That first slice should improve:

- repeat join coherence;
- close/reopen behavior;
- room-member-history usefulness;
- same-browser multi-tab honesty.
