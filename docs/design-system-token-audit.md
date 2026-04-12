# Design System Token Audit

Status: working pass / Phase 1 audit  
Scope: whole-project factual token inventory

This document records the result of the first design-system chapter pass:

- a whole-project read-only token audit
- using the working token framing:
  - primitive
  - semantic
  - component

This is not the final canonical token model yet.

Its purpose is:

- to preserve the current inventory;
- to support the next component-audit pass;
- to prevent later design-system work from re-deriving the same token map from scratch.

## 1. Summary

The project already has a real de facto token layer, but much of it still lives
as inline values and local constants rather than as one coherent shared system.

The strongest existing shared base currently appears in:

- board/interaction sizing
- font-family constants
- repeated dark-surface / light-foreground patterns

The weakest area is the broader app shell surface family, where similar visual
patterns repeat across entry, ops, overlays, media, and session UI with slightly
different values.

## 2. Primitive-like token inventory

### 2.1. Color primitives

Dark backgrounds / surfaces:

- `#020617`
- `#081226`
- `#0f172a`
- `#1e293b`

Light foreground / surfaces:

- `#ffffff`
- `#f8fafc`
- `#e2e8f0`
- `#cbd5e1`
- `#94a3b8`

Primary blue family:

- `#2563eb`
- `#93c5fd`
- `rgba(96, 165, 250, ...)`

Destructive red family:

- `#450a0a`
- `#fecaca`
- `#fca5a5`
- `#fecdd3`
- `rgba(248, 113, 113, ...)`

Warning amber family:

- `#fde68a`
- `rgba(251, 191, 36, ...)`

Teal family:

- `#0f766e`
- `#ecfeff`

### 2.2. Typography primitives

Font families:

- `HTML_UI_FONT_FAMILY`
- `TEXT_CARD_BODY_FONT_FAMILY = "Arial, sans-serif"`

Observed font sizes:

- `11`
- `12`
- `13`
- `14`
- `15`
- `16`
- `18`
- `20`
- `22`
- `28`
- `52`

Observed line heights:

- `0.94`
- `1`
- `1.2`

Observed letter spacing:

- `0.01em`
- `0.04em`
- `0.08em`
- `-0.055em`

### 2.3. Spacing primitives

Common repeated steps:

- `2`
- `4`
- `6`
- `7`
- `8`
- `10`
- `12`
- `14`
- `16`
- `18`
- `20`
- `24`
- `28`

### 2.4. Radius primitives

Rect-like radii:

- `8`
- `10`
- `12`
- `14`
- `16`
- `18`
- `20`
- `24`

Pill / circle:

- `999`

### 2.5. Stroke primitives

- `1`
- `2`
- `3`
- dash pattern `[10, 6]`

### 2.6. Shadow primitives

CSS shadow families:

- `0 8px 24px ...`
- `0 14px 36px ...`
- `0 18px 40px ...`
- `0 20px 48px ...`
- `0 24px 60px ...`
- `0 24px 80px ...`

Konva blur values:

- `8`
- `10`

### 2.7. Layering primitives

Observed z-indexes:

- `10`
- `12`
- `20`
- `30`
- `31`
- `40`

### 2.8. Smaller recurring size primitives

Observed recurring smaller-size values that plausibly behave like primitive-like
steps more than one-off component dimensions:

- `36`
- `44`
- `52`
- `84`
- `96`
- `104`

Larger repeated dimensions do exist in the project, but currently read more like
component-local sizes than foundation-like primitives. Examples include:

- `132`
- `180`
- `220`
- `240`
- `260`
- `320`

### 2.9. Motion

There is no meaningful shared motion token layer yet.

Current time-based values appear mostly as behavioral/runtime timings rather than
as reusable UI motion tokens.

## 3. Semantic-like token inventory

These values are already implied by runtime use even when not yet formally named.

### 3.1. Surface semantics

- app-shell background
- elevated dark panel
- light card surface
- subtle border
- shared overlay surface

### 3.2. Text semantics

- strong foreground text
- muted text

### 3.3. Status / action semantics

- primary action
- destructive action
- warning state
- neutral action

### 3.4. Interaction semantics

- selection / interaction emphasis
- preview vs occupied interaction
- viewport-stable interaction chrome

### 3.5. Object-family surface semantics

- light note surface
- token shell
- media tile shell
- ops card shell

## 4. Component-local token inventory

These are currently local component/family values rather than shared tokens.

This section intentionally includes a mix of:

- named constants already present in code;
- repeated local literals;
- derived sizing rules / formulas.

Those are all useful for inventory purposes, but they should not yet be treated
as the same kind of token.

### 4.1. Interaction layer

- `REMOTE_INTERACTION_FRAME_OUTSET = 6`
- `REMOTE_INTERACTION_FRAME_STROKE_WIDTH = 2`
- `dash = [10, 6]`
- transformer border `3`
- transformer anchor fill `#f8fafc`

### 4.2. Token

- `TOKEN_PIN_SIZE = 44`
- selection ring `radius + 5`
- body inset `-3`
- min body radius `8`
- body shadow blur `8`

### 4.3. Note-card

- min size `96 x 72`
- default width `260`
- shell radius `10`
- shell stroke `1`
- shell shadow blur `10`
- shell shadow offset Y `4`
- body insets `16 / 16`
- font size `22`
- line height `1.2`
- edit overlay mins `40 x 32`

### 4.4. Image attached controls

- floating action min width `44`
- button height `28`
- gap `8`
- outer offset `12`
- width formula `label.length * 7 + 18`

### 4.5. Board shell / overlays

- add-image button `36 x 36`
- object semantics tooltip `minWidth 220`, `maxWidth 240`

### 4.6. Entry flow

- entry card max width `420`
- swatches `36`
- debug swatches `24`

### 4.7. Participant panel

- fixed offsets `20 / 20`
- min width `180`
- panel radius `14`

### 4.8. Media dock

- dock width `320`
- tile width `132`
- tile min height `104`
- video height `84`

### 4.9. Dice overlay

- tray button min width `52`
- overlay z-index `30 / 31`

### 4.10. Larger repeated component-local dimensions

These values recur in the runtime, but currently behave more like component
dimensions than primitive-like shared size tokens:

- media tile width `132`
- participant/session panel min width `180`
- tooltip min/max widths `220 / 240`
- note-card default width `260`
- media dock width `320`

## 5. Repeated value clusters

Strong repeated clusters already visible:

### 5.1. Dark surface cluster

- `rgba(15, 23, 42, 0.88-0.96)`
- `#0f172a`
- `#020617`
- `#1e293b`

### 5.2. Light foreground cluster

- `#f8fafc`
- `#e2e8f0`
- `#cbd5e1`
- `#94a3b8`

### 5.3. Border cluster

- `1px solid rgba(148, 163, 184, 0.14-0.30)`

### 5.4. Radius cluster

- `10`
- `12`
- `14`
- `16`
- `18`
- `20`
- `999`

### 5.5. Spacing cluster

- `8`
- `10`
- `12`
- `14`
- `16`
- `24`

### 5.6. Small-label typography cluster

- `11`
- `12`
- `14`

### 5.7. Elevated shadow cluster

- `0 18px 40px rgba(2, 6, 23, 0.3x)`
- `0 24px 60px rgba(2, 6, 23, 0.35)`

### 5.8. Status-tone cluster

- primary blue
- destructive red
- warning amber

### 5.9. Interaction chrome cluster

- outset `6`
- stroke widths `2` and `3`
- pill radius `999`

## 6. Mixed / inconsistent token usage

### 6.1. Typography split

- HTML UI mostly uses `HTML_UI_FONT_FAMILY`
- note content still uses `TEXT_CARD_BODY_FONT_FAMILY = "Arial, sans-serif"`

### 6.2. Legacy naming drift

- `TEXT_CARD_*` constants now effectively serve `note-card`

### 6.3. Partial interaction centralization

- frame outset/stroke are centralized
- dash, preview opacity, transformer anchor sizing are still local or implicit

### 6.4. Repeated but unsystematic surface styling

- entry form
- ops panels
- media dock
- participant panel
- tooltip
- dice tray

These visibly belong to the same family more than the code currently reflects.

### 6.5. Border opacity drift

There are many variants of slate border with slightly different alpha values.

### 6.6. Radius scale without family rules

`10`, `12`, `14`, `16`, `18`, `20` are all active but not yet assigned to
clear component families or semantic rules.

### 6.7. Implicit layering tiers

Panels, cursor, media, dice, and tooltips already use local z-index tiers,
but the tier system is not yet named.

### 6.8. Inconsistent action-button language

Toolbar buttons, ops buttons, media buttons, and floating image buttons all use
related but different local recipes.

## 7. Likely first token families

Without jumping to the final canonical model yet, the most likely families are:

### 7.1. Foundations

- color palette
- typography scale / families
- spacing scale
- radius scale
- shadow levels
- z-index tiers

### 7.2. Surface tokens

- app background
- elevated dark panel
- light card surface
- subtle border
- muted / strong text

### 7.3. Status / action tokens

- primary
- destructive
- warning
- neutral

### 7.4. Interaction tokens

- remote frame
- transformer chrome
- token ring
- image attached controls

### 7.5. Form / control tokens

- input shell
- pill button
- primary button
- destructive button

### 7.6. Object-family tokens

- note-card shell / content
- token shell
- media tile shell
- ops card shell

## 8. Why this audit matters

This audit shows that the project already has enough real repetition to justify
the design-system chapter.

But it also shows that repeated values are not automatically canonical.

Some repeated values likely represent:

- useful emerging primitives

And some likely represent:

- drift
- local convenience
- ad hoc duplication

That is why the next chapter step should be the **base component audit**, not a
jump straight to the final token model.

## 9. Recommended next step

Proceed to:

- **Phase 2 — base component audit**

With special attention to repeated families such as:

- elevated dark panels
- small buttons
- input shells
- status messages
- object-adjacent interaction chrome
