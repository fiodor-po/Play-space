# Indication Design

## Purpose

This document is the canonical source for the project's indication language.

Its job is to keep multiplayer, remote-state, occupied-state, and interaction-preview indications from drifting into one-off local variants.

This is not a broad design-system document.
It is a focused source for:

- what indication families currently exist;
- what visual language they use;
- which current surface acts as the reference precedent;
- what future implementation extraction should unify.

## Scope

This doc covers lightweight board/UI indications such as:

- remote editing indication;
- occupied/blocked interaction indication;
- remote drag/transform preview indication.

It does not define:

- general object styling;
- product branding;
- full control/button systems;
- governance policy itself.

## Canonical indication families

### 1. Remote interaction frame

Use when another participant is actively interacting with an object and that state should be legible directly on the object.

Current reference precedent:

- `src/board/objects/textCard/TextCardRenderer.tsx`

Current known uses:

- remote text-card editing indication;
- occupied-image indication while another participant holds the image drawing lock.

Current visual language:

- dashed colored frame around the object;
- small dark pill label near the object edge;
- participant color reused for the frame and label border;
- short participant-state label such as:
  - `<name> editing`
  - `<name> drawing`

Current shared geometry source in code:

- `REMOTE_INTERACTION_FRAME_OUTSET`
- `REMOTE_INTERACTION_FRAME_STROKE_WIDTH`

Design intent:

- these should read as the same multiplayer-state family, not as separate custom widgets.

### 2. Remote preview frame

Use when another participant is actively previewing a position or transform and the local client should show the transient projected result.

Current known use:

- image drag/transform preview in `src/components/BoardStage.tsx`

Current visual language:

- dashed frame at preview bounds;
- participant color reused where available;
- transient/preview treatment remains distinct from the occupied/locked family.

Design intent:

- preview frames may differ from occupied-state frames, but they should still evolve from this canonical source rather than as isolated local inventions.

## Current canonical precedent

The strongest current precedent for multiplayer-state indication language is:

- `src/board/objects/textCard/TextCardRenderer.tsx`

When a new indication is needed for another object family, start from that precedent unless this doc explicitly says otherwise.

If the new indication belongs to the same semantic family, it should reuse:

- the same geometry/stroke language;
- the same label treatment;
- the same participant-color semantics;
- the same level of visual weight.

## Rules for future indication work

When adding or changing an indication:

1. identify which indication family it belongs to;
2. consult this doc before inventing any local visual treatment;
3. reuse the current canonical precedent where the semantic family matches;
4. if a new variant is truly needed, record why here instead of only in the implementation file.

Do not treat "looks close enough" as sufficient when a matching indication family already exists.

## Intended later implementation extraction

This doc is meant to support a later narrow shared implementation pass such as:

- shared indication constants;
- shared indication label sizing/treatment;
- a small shared renderer/helper for remote interaction indications.

That extraction should follow this doc rather than invent the shared shape ad hoc.
