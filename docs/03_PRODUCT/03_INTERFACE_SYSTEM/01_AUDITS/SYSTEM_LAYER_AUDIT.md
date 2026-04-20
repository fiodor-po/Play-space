# Design System System-Layer Audit

Status: working pass / Phase 3 audit  
Scope: whole-project UI/system-layer mapping

This document records the result of the system-layer audit for the design-system
chapter.

It connects the earlier artifacts:

- [docs/03_PRODUCT/03_INTERFACE_SYSTEM/01_AUDITS/TOKEN_AUDIT.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/03_INTERFACE_SYSTEM/01_AUDITS/TOKEN_AUDIT.md)
- [docs/03_PRODUCT/03_INTERFACE_SYSTEM/01_AUDITS/CONTROL_INVENTORY.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/03_INTERFACE_SYSTEM/01_AUDITS/CONTROL_INVENTORY.md)

This is not the canonical design-system model yet.

Its purpose is:

- to map the actual current UI/system layers;
- to show which control classes primarily belong to which layers;
- to show which token families are primarily consumed by which layers;
- to identify cross-system families vs layer-local families;
- to make muddy dependency edges explicit before the audit-synthesis / decision pass.

## 1. Summary

The current UI splits into a handful of real runtime layers:

- room shell / entry
- board control layer
- interaction layer
- presence layer
- ops surface
- media surface
- special systems
- a small shared overlays / surfaces stratum

The key finding is that tokens and controls do not distribute evenly across
those layers:

- the interaction layer is the cleanest and most explicit;
- app-shell, ops, media, and board-control surfaces already reuse a lot of the
  same dark-panel / compact-button language;
- but that language still lives mostly as parallel local implementations rather
  than as true shared base controls.

## 2. Current UI/system layers

### 2.1. Room shell / entry layer

Primary location:

- [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx)

Includes:

- room/player inputs
- color selection
- entry debug controls
- join CTA
- entry warnings/failures
- entry shell surface

### 2.2. Board control layer

Primary locations:

- [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx)
- [src/board/components/ParticipantSessionPanel.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/ParticipantSessionPanel.tsx)
- [src/board/components/BoardToolbar.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/BoardToolbar.tsx)

Includes:

- fixed room/session controls around the board
- toolbar actions
- participant/session management controls
- governance/debug inset surfaces inside board-adjacent control UI

### 2.3. Interaction layer

Primary references:

- [docs/04_ARCHITECTURE/01_RUNTIME/interaction-layer-design.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/01_RUNTIME/interaction-layer-design.md)
- [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx)
- [src/board/components/RemoteInteractionIndicator.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/RemoteInteractionIndicator.tsx)

Includes:

- selection / transformer chrome
- remote interaction frames
- image floating object-adjacent actions
- note edit overlay
- object-semantics tooltip/data rows

### 2.4. Presence layer

Primary location:

- [src/board/components/CursorOverlay.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/CursorOverlay.tsx)

Includes:

- cursor dot markers
- cursor labels
- presence-derived visual occupancy pressure in some neighboring surfaces

### 2.5. Ops surface

Primary location:

- [src/ops/RoomsOpsPage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/ops/RoomsOpsPage.tsx)

Includes:

- protected internal inspection/repair surface
- ops buttons, input, room rows, stats cards, detail rows, helper/error text

### 2.6. Media surface

Primary location:

- [src/media/LiveKitMediaDock.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/media/LiveKitMediaDock.tsx)

Includes:

- media dock shell
- media action buttons
- participant video tiles
- media-specific status/callout UI

### 2.7. Special systems

Primary location:

- [src/dice/DiceSpikeOverlay.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/dice/DiceSpikeOverlay.tsx)

Includes:

- dice tray shell
- dice tray buttons
- dice error surface
- dice canvas overlay

### 2.8. Shared overlays / surfaces

Cross-cutting small stratum including:

- boot card
- floating triggers
- tooltips
- fixed overlay surfaces

This stratum is useful descriptively, but it is not yet a mature system in its
own right.

## 3. Control classes by layer

### 3.1. Room shell / entry

- dark text inputs
- color swatch selector
- entry CTA button
- warning/error callouts
- debug pills and debug select
- elevated entry shell panel

### 3.2. Board control layer

- session panel shell
- transparent text actions
- destructive room-tool action
- swatch trigger + palette
- native labeled checkboxes
- toolbar action buttons
- governance/debug inset cards

### 3.3. Interaction layer

- `RemoteInteractionIndicator`
- image floating object-adjacent actions
- transformer chrome
- note editing textarea overlay
- tooltip/data rows for object semantics

### 3.4. Presence layer

- cursor label pill
- cursor dot marker

Note:

- cursor controls currently behave more like a **presence-specific family**
  than as proven members of a broader chip/pill or swatch canon
- this presence/cursor family may grow later and should be allowed to remain a
  separate category if that continues to fit the product best

### 3.5. Ops surface

- primary / secondary / danger buttons
- dark input field
- selectable room rows
- info/stat cards
- live-slice rows
- muted helper text and inline error text
- dark panel shells

### 3.6. Media surface

- media action buttons
- media shell
- participant video tile cards
- media error callout
- accent dot

### 3.7. Special systems

- dice tray action buttons
- dice tray shell
- dice error callout

## 4. Token families by layer

### 4.1. Room shell / entry

Strong consumers of:

- app-shell background / gradient
- dark panel surface
- dark field shell
- swatch language
- warning/destructive callout language
- display typography

### 4.2. Board control layer

Strong consumers of:

- dark floating panel surface
- muted text
- compact actions
- swatch language
- subsection divider / inset-card treatment
- small-label typography

### 4.3. Interaction layer

Strongest consumers of explicitly interaction-specific tokens:

- frame outset / stroke / dash
- transformer stroke / anchor
- viewport-stable chrome sizing
- object-adjacent spacing
- note text metrics

### 4.4. Presence layer

Consumes:

- pill radius
- cursor dot sizing
- border ring treatment
- dark overlay pill colors

### 4.5. Ops surface

Strong consumers of reusable-looking app UI tokens:

- dark panels
- dark fields
- compact buttons
- muted/error text
- stat-card spacing

### 4.6. Media surface

Consumes:

- dark floating panel language
- compact-button language
- media-tile-specific card sizes
- destructive/error callout language

### 4.7. Special systems

Dice largely borrows:

- overlay surface language
- compact action-button language
- destructive/error callout language

but applies them inside a specialized dice subsystem.

## 5. Cross-system control families

These currently behave like genuinely cross-system or near-cross-system
families, even if they are not yet implemented as shared base controls:

### 5.1. Elevated dark surface / panel

Seen across:

- room shell
- board control shell
- ops
- media
- tooltip / debug surfaces

### 5.2. Compact action button

Seen across:

- ops
- media
- toolbar
- dice
- overlay actions

### 5.3. Dark field / input shell

Seen most clearly across:

- entry
- ops

### 5.4. Status callout language

Seen across:

- entry
- media
- dice

### 5.5. Swatch family

Seen most clearly across:

- entry
- participant panel

Note:

- cursor/presence controls should **not** currently be treated as proof that a
  broader chip/pill family is already settled cross-system

### 5.6. Small data / inspection row family

Seen across:

- ops detail
- governance/debug blocks
- object-semantics tooltip

### 5.7. Explicit shared base control

The clearest genuinely shared base control today remains:

- `RemoteInteractionIndicator`

## 6. Layer-local control families

### 6.1. Room shell / entry local families

- entry debug pills and debug select
- join CTA tied to chosen participant color

### 6.2. Board control layer local families

- participant inline rename input
- session-panel transparent text actions

### 6.3. Interaction layer local families

- image floating object-adjacent controls
- note edit textarea overlay
- transformer chrome

### 6.4. Presence layer local families

- cursor overlay composition
- cursor label pill treatment
- cursor dot marker treatment

### 6.5. Ops surface local families

- room rows
- slice rows
- stats cards as an ops-specific data-inspection grammar

### 6.6. Media surface local families

- participant video tile card

### 6.7. Special systems local families

- dice tray action set
- dice canvas overlay

## 7. Mixed / unclear dependency edges

### 7.1. Board control layer vs room shell

Both use much of the same dark-surface / button / swatch language, but that
language is not backed by shared base controls yet.

### 7.2. Ops vs media

These look surprisingly close in panel/button language, suggesting a future
shared app-surface family, but today they are still independently implemented.

### 7.3. Interaction layer vs overlay/surface family

Some fixed/floating surfaces in `BoardStage` are interaction-adjacent, while
others are really board-control overlays.

### 7.4. Presence vs broader chip/pill family

Cursor labels currently look pill-like, but presence controls should remain a
**decision point** rather than being silently absorbed into a broader chip
canon. A separate cursor/presence family is a plausible future direction.

### 7.5. Overlay shell vs subsystem shell

Media dock and dice tray visually read like overlay surfaces, but operationally
they are subsystem shells rather than generic overlay controls.

### 7.6. Rows vs buttons

Ops room rows are implemented as buttons, but should primarily be treated as
selectable data rows.

### 7.7. Object shell vs panel family

`note-card` is a light-surface shell, but it belongs to object semantics more
than shared app-surface control language.

## 8. Recommended next step

The next pass should be the explicit **audit synthesis / decision pass**
described in
[docs/03_PRODUCT/03_INTERFACE_SYSTEM/00_RULES/WORKING_PRINCIPLES.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/03_INTERFACE_SYSTEM/00_RULES/WORKING_PRINCIPLES.md).

That pass should use:

- [docs/03_PRODUCT/03_INTERFACE_SYSTEM/01_AUDITS/TOKEN_AUDIT.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/03_INTERFACE_SYSTEM/01_AUDITS/TOKEN_AUDIT.md)
- [docs/03_PRODUCT/03_INTERFACE_SYSTEM/01_AUDITS/CONTROL_INVENTORY.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/03_INTERFACE_SYSTEM/01_AUDITS/CONTROL_INVENTORY.md)
- this system-layer audit

to decide:

- what looks like candidate canon
- what looks like drift
- what should remain intentional exception
- what should change first
- what should stay untouched for now
