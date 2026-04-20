# Interaction Layer Design

Status: canonical current-alpha interaction layer source  
Scope: object-adjacent live manipulation/readability layer

This document defines the current alpha interaction layer.

It is intentionally narrower than:

- object semantics;
- fixed control surfaces;
- presence/awareness systems;
- dice or other special interaction systems;
- a broad visual design-system spec.

## 1. Canonical definition

The interaction layer is the **object-adjacent live manipulation and readability
layer around board objects**.

Its job is to answer:

- what object is currently being acted on;
- what kind of action is happening right now;
- whether the object is available or occupied;
- whether what the viewer sees is committed content or a live preview;
- where object-adjacent controls/frames should appear during interaction.

It should not answer:

- what the object fundamentally means;
- what global controls exist in the room;
- who is present in the room in general;
- how special systems like dice work.

## 2. Current reference object families

For the current alpha, the canonical reference families are:

- `image` = canonical box/media object
- `note-card` = canonical text box
- `token` = canonical pin exception

Legacy `text-card` is not the canonical future interaction reference.

## 3. Canonical interaction-state matrix

| Interaction state | Image | Note-card | Token |
| --- | --- | --- | --- |
| Selection | Yes, transformer-selected box object | Yes, transformer-selected text box | Yes, viewport-stable pin selection ring |
| Local move / drag | Yes | Yes | Yes |
| Local resize / transform | Yes, transformer corners | Yes, transformer corners | No |
| Local active mode | Yes, drawing mode | Yes, editing mode | No separate mode |
| Remote preview | Yes, remote drag/transform preview frame | No separate remote preview state now | No separate remote preview state now |
| Remote occupied / blocked | Yes, drawing lock frame | Yes, remote editing / remote resize frame | Yes, occupied move frame |
| Object-adjacent live controls | Yes, attached floating controls | No | No |
| Interaction gating | Yes, lock / selection / mode gated | Yes, edit / resize / selection gated | Yes, move occupancy gated |

## 4. Shared rules across object families

### 4.0. Canonical interaction-space rule

Interaction-layer elements should be **object-anchored but viewport-stable**.

This is the canonical default rule for the current alpha:

- interaction-layer presentation should anchor to object geometry or effective bounds;
- interaction-layer presentation should not scale like ordinary board content during zoom;
- if current runtime behavior diverges from this rule, that divergence should be treated as a candidate for correction rather than as canonical semantics.

In practical terms:

- board content lives in board space;
- interaction chrome lives in interaction space;
- interaction space is derived from object geometry but rendered for stable readability and operability in the viewport.

### 4.1. Frame-first remote interaction rule

`RemoteInteractionIndicator` is the canonical object-scoped remote interaction
surface.

Use it for:

- occupied/blocked live interaction;
- remote active interaction when that materially affects local actionability;
- remote preview when the preview is spatially important.

Variant rule:

- `interaction` = object is currently occupied or actively being acted on
- `preview` = transient remote preview, not committed content

Shape rule:

- rectangle by default for box objects
- circle for pin objects

### 4.2. Box-object manipulation rule

Resizable box objects should use:

- selection by transformer
- manipulation by transformer
- no bespoke resize chrome by default

Current runtime users:

- image
- note-card

### 4.3. Viewport-stable interaction chrome rule

Interaction chrome should remain visually stable relative to the viewport.

This follows directly from the canonical interaction-space rule above.

This should apply to:

- token body and selection treatment
- interaction frames
- image attached controls

If any of those currently behave like board-scaled content instead of
viewport-stable interaction chrome, that behavior should be treated as drift
from the target model.

### 4.4. Committed vs live rule

The interaction layer should keep a clear distinction between:

- committed object content
- local active manipulation
- remote transient preview/occupied state

Do not blur preview into committed content.

This distinction should be implemented through interaction-layer presentation,
not by letting transient interaction chrome masquerade as committed board
content.

### 4.5. Readability-over-transform rule

When content objects need live interaction treatment, readability should win
over image-like visual scaling.

This is especially important for text-like box objects such as `note-card`.

## 5. Image-specific interaction rules

Image keeps these intentional interaction rules:

- transformer-based resize/transform
- remote spatial preview frame during drag/transform
- occupied frame during drawing lock
- local drawing mode as a special active interaction state
- object-adjacent floating controls anchored to effective bounds

Image is therefore the canonical current **box/media interaction object**, not
just a generic resizable rectangle.

## 6. Note-card-specific interaction rules

Note-card keeps these intentional interaction rules:

- transformer-based non-proportional text-box resize
- whole-card drag surface
- editing as a local active mode
- remote editing frame
- remote resize frame
- text-box-like live layout/readability behavior rather than image-like scaling

Note-card is therefore the canonical current **text-box interaction object**.

It should share the box-object interaction language where practical, but keep
text readability as the stronger constraint.

## 7. Token-specific interaction rules

Token keeps these intentional exception rules:

- no transformer
- viewport-stable pin rendering
- selection ring centered on the pin
- drag-only manipulation
- occupied/blocked move indication using the shared frame language

Token is therefore the canonical current **pin interaction exception** rather
than a normal box-object user.

## 8. What stays intentionally undefined for now

Still intentionally undefined:

- one unified future selection style across every object family
- future token controls
- future note-card media-relative interaction
- richer shape-aware interaction silhouettes beyond the current simple rect/circle rule
- a full object-by-object interaction policy table for every future object kind

These should remain later work, not be overdesigned now.

## 9. What stays out of this layer

Out of this layer:

- object semantics
- toolbar/panel/control layer
- room presence/cursors as a general system
- governance policy meaning
- dice/system-specific interaction families

Those systems may influence interaction states, but they are not the interaction
layer itself.

## 10. Recommended first standardization slice

The best narrow next implementation chapter is:

1. standardize the shared interaction-state matrix in code comments/docs terms
2. align `RemoteInteractionIndicator` usage across current object families
3. align box-object selection/manipulation rules for image + note-card
4. preserve token as the explicit pin exception

This is enough to reduce drift without turning into a broad redesign.
