# Design System Audit Synthesis

Status: working pass / Phase 4 audit synthesis  
Scope: explicit judgments from the completed design-system audits

This document is the bridge from audit to model.

It interprets the existing audit artifacts:

- [design-system-token-audit.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/design-system-token-audit.md)
- [design-system-control-inventory.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/design-system-control-inventory.md)
- [design-system-system-layer-audit.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/design-system-system-layer-audit.md)
- [interaction-layer-design.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/interaction-layer-design.md)

This is **not** the final canonical design-system model.

Its purpose is to make the current judgments explicit so they can be reviewed
with the user before any dependency-map or rollout work proceeds.

## 1. Working judgment mode

These are **proposed working judgments**, not closed conclusions.

They should be reviewed with the user in detail.

The right question for this pass is not:

- "What can be made consistent as fast as possible?"

It is:

- "Which repeated patterns look like real product intent?"
- "Which repeated patterns look like local drift?"
- "Which exceptions are important to keep because they belong to different
  systems or semantics?"

## 2. Candidate canon

These currently look like the strongest candidates for future shared
design-system canon.

### 2.1. Foundation-like token families

Most likely canon:

- dark-surface color family
  - `#020617`
  - `#081226`
  - `#0f172a`
  - `#1e293b`
- light-foreground text family
  - `#f8fafc`
  - `#e2e8f0`
  - `#cbd5e1`
  - `#94a3b8`
- compact spacing steps
  - especially `8`, `10`, `12`, `14`, `16`, `24`
- radius steps
  - especially `10`, `12`, `16`, `999`
- shadow tiers
  - especially the repeated dark elevated panel shadows
- `HTML_UI_FONT_FAMILY`

Why these look like canon:

- they recur across room shell, board control, ops, media, and overlays;
- they already form a recognizable project UI language;
- they do not appear tied to one isolated subsystem only.

### 2.2. Surface families

Most likely canon:

- elevated dark panel / surface shell
- dark text field shell
- muted text / strong text pairing
- compact status callout language

Why these look like canon:

- they span entry, session panel, ops, media, and overlay/info surfaces;
- the repetition looks intentional enough to treat as emerging product language,
  not just coincidence.

### 2.3. Control families

Most likely canon candidates:

- compact action button family
- dark input family
- status callout family
- swatch selector family
- data/inspection row family

Important nuance:

- these look like **candidate shared families**
- they do **not** yet look like a settled single-class implementation in code

### 2.4. Interaction-layer canon

Strongest current canon:

- `RemoteInteractionIndicator`
- interaction-layer rule set in
  [interaction-layer-design.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/interaction-layer-design.md)
- viewport-stable interaction chrome principle
- image + note-card as canonical box-object interaction references
- token as canonical pin exception

Why this is stronger than the rest:

- it is already explicitly named and documented;
- one shared base control already exists;
- current runtime behavior and documentation are more aligned here than in the
  app-shell/control layers.

## 3. Likely drift

These currently look more like local implementation drift than real canon.

### 3.1. Slightly different dark-panel recipes

Likely drift:

- repeated but slightly different border alpha
- repeated but slightly different opacity
- repeated but slightly different blur/shadow values
- repeated but slightly different corner radius choices

Why this looks like drift:

- the overall family is clearly shared;
- the differences are usually too small to read as product-significant.

### 3.2. Parallel compact button implementations

Likely drift:

- ops compact button
- media compact button
- toolbar button
- dice tray button
- board floating add-image button

Why this looks partly like drift:

- several are visually/functionally close enough to suggest one shared family;
- they currently exist as local implementations mostly because the project has
  not unified them yet.

Important caution:

- not all of these should become one exact class
- the drift judgment applies most strongly to the **base button language**, not
  necessarily every variant

### 3.3. Dark field duplication

Likely drift:

- entry text inputs
- ops password input
- entry debug select shell

Why this looks like drift:

- same dark field grammar appears repeatedly with only small local variation.

### 3.4. Repeated data/inspection row patterns

Likely drift:

- ops info/data rows
- object semantics rows
- governance debug rows

Why this looks like drift:

- the project clearly has one emerging inspection/data language, but it is still
  hand-built per surface.

### 3.5. Overloaded “shared” appearance without shared base controls

Likely drift in the current codebase structure:

- shared feature wrappers make some controls look more systematized than they are
- `ParticipantSessionPanel`, `BoardToolbar`, and `CursorOverlay` are shared
  surfaces, but most controls inside them are still local

This is not visual drift so much as **structural drift** between appearance and
implementation maturity.

## 4. Intentional exceptions

These should currently remain explicit exceptions rather than being flattened
into a general shared family too early.

### 4.1. Interaction-layer exceptions

- `RemoteInteractionIndicator`
- image object-adjacent floating controls
- note editing textarea overlay
- transformer chrome

Why:

- these belong to interaction semantics, not ordinary app-shell control classes.

### 4.2. Presence-family exceptions

- cursor label pill
- cursor dot marker

Why:

- these currently read more like the start of a presence-specific family than as
  proof of a general chip/pill canon.

### 4.3. Object-shell exceptions

- note-card shell
- token shell

Why:

- these belong first to object semantics and object rendering, not to general
  panel/control families.

### 4.4. Subsystem-shell exceptions

- media dock shell
- dice tray shell

Why:

- both borrow shared surface language, but they are subsystem shells rather than
  general-purpose overlays or generic app controls.

They may still later consume shared surface tokens, but they should not be used
as the baseline definition of a general overlay component.

## 5. Open decisions that should stay open for now

These look important enough to discuss explicitly with the user rather than
settling in this pass.

### 5.1. Button unification depth

Still open:

- should toolbar, ops, media, and dice buttons share one base button with
  variants
- or should there be multiple button families with only shared tokens beneath
  them

### 5.2. Presence-family independence

Still open:

- should cursor labels and cursor markers become their own formal presence
  component family
- or should they partially merge into broader chip/swatch language later

### 5.3. Overlay family boundaries

Still open:

- where the line should sit between:
  - generic overlay/info surfaces
  - board control overlays
  - interaction overlays
  - subsystem shells

### 5.4. Data row family scope

Still open:

- should selectable list rows and inspection key-value rows live in one broader
  “data row” family
- or should they split into:
  - selectable rows
  - info rows
  - key-value rows

### 5.5. Light-surface canon

Still open:

- whether the system should eventually have a true light-surface family beyond
  note-card
- or whether note-card should remain mostly an object-specific exception

## 6. Highest-value first rollout targets

These look like the strongest early rollout candidates **after** the model is
made explicit.

### 6.1. Shared app-surface foundation

Highest-value candidate:

- elevated dark panel surface
- dark input shell
- muted/strong text pairing

Why first:

- high repetition
- low semantic ambiguity
- broad cross-system payoff

### 6.2. Compact action button family

High-value candidate:

- ops
- media
- toolbar
- some entry/debug actions

Why:

- many repeated local implementations
- visible consistency gain
- likely manageable rollout slice if kept narrow

### 6.3. Status callout family

High-value candidate:

- entry warnings/errors
- media error
- dice error

Why:

- clearly repeated
- semantically coherent
- easier to align than more complex controls

### 6.4. Interaction-layer refinement

Still a strong rollout candidate:

- `RemoteInteractionIndicator` usage and related interaction chrome

Why:

- already the cleanest subsystem
- strongest current canon candidate

Important caution:

- this should not cause the interaction layer to define the whole design system
- it is a strong early slice, but not the whole base

## 7. What should explicitly not be rolled into the first rollout

These should stay out of the first rollout wave.

- note-card shell as a general panel family
- token shell as a general badge/pill family
- cursor presence controls as general chip/swatch controls
- media dock as a generic overlay shell
- dice tray as a generic overlay shell
- note editing textarea overlay as a general input component
- broad row/list unification before the user confirms the desired scope

Why:

- these are either intentional exceptions, subsystem shells, or still
  semantically ambiguous

## 8. Questions for user alignment

These are the main questions this pass surfaces for review.

### 8.1. Shared app-shell language

Does the current repeated dark-panel / dark-field / muted-text language feel
like real intended product language to preserve and formalize, or does any major
part of it feel like temporary styling that should not be canonized?

### 8.2. Button strategy

Should the project aim for:

- one shared compact button base with variants

or:

- several related button families sharing tokens only

### 8.3. Presence-family independence

Do you want cursor labels/markers to be treated as the beginning of a distinct
presence control family, rather than being absorbed into generic pill/swatch
language?

### 8.4. First rollout priority

Which feels like the best first rollout target after the model is defined:

- shared dark surfaces/fields
- compact action buttons
- status callouts
- interaction-layer chrome refinement

### 8.5. Exception boundaries

Should note-card, dice tray, and media dock remain explicit exceptions/special
surfaces in the near term, even if they later consume shared tokens?

## 9. Recommended next step

Review these judgments explicitly with the user before moving on.

Only after that alignment should the chapter continue to:

- dependency-map work
- canonical model definition
- rollout planning
