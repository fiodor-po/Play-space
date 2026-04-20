# Interaction Layer Sizing Audit

Status: working pass / interim audit  
Scope: factual current-value dump, not canonical token spec

This document records the current interaction-layer sizing values found in the
runtime code.

It is intentionally not the final design-token source of truth.

Its purpose is:

- to preserve the current factual sizing map;
- to avoid re-deriving these values from `BoardStage` by hand later;
- to support the next discussion about interaction tokens / design-system shape.

## 1. Shared interaction indicator

Sources:

- [src/board/components/RemoteInteractionIndicator.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/RemoteInteractionIndicator.tsx)
- [src/board/constants.ts](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/constants.ts)

Current values:

- `REMOTE_INTERACTION_FRAME_OUTSET = 6`
- `REMOTE_INTERACTION_FRAME_STROKE_WIDTH = 2`
- `dash = [10, 6]`
- `interaction` opacity = `1`
- `preview` opacity = `0.85`

Current geometry behavior:

- rect frame expands object bounds by `6` on each side
- circle frame uses:
  - `radius = max(width, height) / 2 + 6`

## 2. Token interaction

Source:

- [src/board/objects/token/TokenRenderer.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/objects/token/TokenRenderer.tsx)

Viewport-stable rule already present:

- token group uses:
  - `scaleX = 1 / stageScale`
  - `scaleY = 1 / stageScale`

Current token sizing:

- selection ring radius = `radius + 5`
- selection ring stroke width = `3`
- body stroke width = `2`
- body radius = `max(radius - 3, 8)`
- body shadow blur = `8`

Current occupied-frame behavior:

- token uses `RemoteInteractionIndicator` with `shape="circle"`
- therefore inherits:
  - outset `6`
  - stroke width `2`
  - dash `[10, 6]`

## 3. Note-card interaction

Sources:

- [src/board/objects/noteCard/NoteCardRenderer.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/objects/noteCard/NoteCardRenderer.tsx)
- [src/board/constants.ts](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/constants.ts)

Current remote interaction frame behavior:

- remote edit frame uses `RemoteInteractionIndicator`
- remote resize frame uses `RemoteInteractionIndicator`
- therefore both inherit:
  - outset `6`
  - stroke width `2`
  - dash `[10, 6]`

Current note-card shell values:

- card stroke width = `1`
- corner radius = `10`
- shadow blur = `10`
- shadow offset Y = `4`

Current note-card content layout values:

- body inset X = `16`
- body inset Y = `16`
- font size = `22`
- line height = `1.2`

## 4. Note-card edit overlay

Sources:

- [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx)

Current edit overlay behavior:

- HTML textarea overlay is positioned from object bounds and stage transform
- width minimum = `40`
- height minimum = `32`
- font size = `TEXT_CARD_BODY_FONT_SIZE * stageScale`
- padding = `0`
- border = `none`
- border radius = `0`

This is already an interaction-space HTML surface rather than Konva board
content.

## 5. Transformer chrome

Source:

- [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx)

Current note-card transformer values:

- border stroke width = `3`
- anchor corner radius = `999`
- anchor fill = `#f8fafc`
- anchor stroke = `currentUserColor`
- enabled anchors:
  - `top-left`
  - `top-right`
  - `bottom-left`
  - `bottom-right`
- anchor size is not explicitly set
  - current behavior therefore depends on Konva default

Current image transformer values:

- border stroke width = `3`
- anchor corner radius = `999`
- anchor fill = `#f8fafc`
- anchor stroke = `currentUserColor`
- enabled anchors:
  - `top-left`
  - `top-right`
  - `bottom-left`
  - `bottom-right`
- anchor size is not explicitly set
  - current behavior therefore depends on Konva default

## 6. Image attached controls

Sources:

- [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx)

Current viewport-stable behavior:

- attached controls group uses:
  - `scaleX = 1 / stageScale`
  - `scaleY = 1 / stageScale`

Current layout values:

- button min width = `44`
- button height = `28`
- gap = `8`
- outer offset Y = `12`
- width formula:
  - `max(44, label.length * 7 + 18)`

Current button chrome values:

- corner radius = `999`
- stroke width = `1`
- shadow blur = `8`
- label Y offset = `7`

## 7. Current de-facto tokens

The runtime already contains several de-facto interaction sizing tokens, even
though they are not yet formalized as one interaction-layer token system:

- remote frame outset = `6`
- remote frame stroke width = `2`
- remote frame dash = `[10, 6]`
- token selection stroke width = `3`
- transformer border stroke width = `3`
- image control button min width = `44`
- image control button height = `28`
- image control gap = `8`
- image control outer offset Y = `12`
- note-card shell corner radius = `10`

## 8. What is still not formalized

Still implicit or inconsistent:

- transformer anchor size
- transformer padding / hit-area policy
- shared selection stroke policy across families
- shared radius policy across interaction chrome
- shared spacing relationships between frame / handles / attached controls
- explicit distinction between content-shell tokens and interaction-chrome tokens

## 9. Why this doc exists

This document is a working audit snapshot.

It should support the next design step:

- deciding whether the project now needs an explicit interaction token system
- and whether that should broaden into a wider UI / design-system layer earlier
  than previously planned
