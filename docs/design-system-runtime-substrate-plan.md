# Design System Runtime Substrate Plan

Status: working implementation-prep note  
Scope: minimal runtime design-system layer for the first ordinary-interface
 migration slices

This document defines the smallest practical runtime substrate that should
 exist before the design-system migration starts landing in product code.

It is intentionally narrow.

Its purpose is:

- to define where the ordinary interface design-system layer should live in
  code;
- to define what should exist in that layer before the first migration slice;
- to prevent the first rollout from turning into scattered local helpers;
- to keep the runtime substrate only slightly ahead of rollout, not massively
  ahead of it.

## 1. Working rule

The runtime design-system layer should be:

- a small code layer inside the project;
- real runtime code, not only markdown documentation;
- narrow enough to support the first migration slices;
- not a broad future-facing framework built far ahead of rollout.

Working rule:

- move confirmed current canon and immediate rollout support into the substrate
- do not preload the whole future design system into code before it is needed

## 2. Recommended location

The ordinary interface runtime substrate should live under:

- `src/ui/system/`

Why this location:

- clearly separate from board object code
- clearly separate from interaction-layer code
- neutral enough to support both entry/app-shell and internal ordinary controls
- small and explicit rather than framework-like

## 3. Recommended representation model

The recommended first-pass runtime model is:

- primitive token values through CSS custom properties
- semantic and family recipes through TypeScript modules
- product code consumes shared recipe objects and small recipe helpers

Working rule:

- do not rely on raw primitive usage directly in product files
- do not require a broad class-based CSS rewrite for the first migration slice

This means:

- `tokens.css` provides primitive runtime values
- TypeScript modules resolve those values into semantic and family recipes
- product files consume family recipes rather than rebuilding styles locally

## 4. Minimal first-pass file structure

The first-pass runtime substrate should start with:

- `src/ui/system/tokens.css`
- `src/ui/system/foundations.ts`
- `src/ui/system/typography.ts`
- `src/ui/system/controlScale.ts`
- `src/ui/system/families/field.ts`

Optional only if it proves helpful immediately:

- `src/ui/system/primitives.ts`

Not required in the initial substrate:

- `button.ts`
- `callout.ts`
- `row.ts`
- `selection.ts`
- `swatch.ts`
- `pill.ts`

Those should arrive only when their rollout slice actually begins.

## 5. File-by-file purpose

### 5.1. `src/ui/system/tokens.css`

Purpose:

- define the primitive CSS custom properties that the first migration slice
  actually needs

First-pass contents should include only the values needed for ordinary
 interface field rollout:

- dark neutral surfaces
- light neutral foregrounds
- spacing steps
- radius steps
- border colors relevant to fields
- focus-ring color only if the field slice introduces it immediately

Working rule:

- do not preload every token from the canonical draft on day one
- add only the primitive values needed by the current rollout horizon

### 5.2. `src/ui/system/foundations.ts`

Purpose:

- expose semantic foundation recipes for ordinary interface work

First-pass contents:

- surface roles
- text roles
- border roles
- radius roles
- shadow roles only if needed by the first slice

Example shape:

- `surface.panel`
- `surface.panelSubtle`
- `surface.inset`
- `text.primary`
- `text.secondary`
- `text.muted`
- `border.subtle`
- `border.default`
- `radius.surface`
- `radius.inset`

Working rule:

- this module should express semantics, not component families

### 5.3. `src/ui/system/typography.ts`

Purpose:

- expose the UI text-style recipes needed by early ordinary-interface families

First-pass contents:

- `uiTextStyle.body`
- `uiTextStyle.label`
- `uiTextStyle.labelSmall`
- `uiTextStyle.caption`
- small-set equivalents only where the first migration slice really needs them

Working rule:

- do not try to exhaustively implement every future text style before the first
  family migration begins

### 5.4. `src/ui/system/controlScale.ts`

Purpose:

- expose the ordinary control geometry contract already agreed in the canonical
  draft

First-pass contents:

- `control.default.height`
- `control.small.height`
- `control.default.paddingY`
- `control.default.paddingX`
- `control.default.contentGap`
- `control.small.paddingY`
- `control.small.paddingX`
- `control.small.contentGap`
- text-role links needed by the first family slice

Working rule:

- this module should define shared ordinary-control geometry
- it should not become a per-component recipe file

### 5.5. `src/ui/system/families/field.ts`

Purpose:

- provide the first real family-level runtime recipes for ordinary interface
  migration

First-pass contents:

- `field.default`
- `field.small`
- shared field shell recipe
- shared field text recipe links
- select support only if the same slice actually migrates the compact select

Primary first-slice consumers:

- entry room input
- entry player input
- ops unlock field
- optionally entry debug select

Working rule:

- this file should be the first real proof that the substrate can carry a
  rollout slice without spawning new local helpers

## 6. What should move into the substrate first

The substrate should initially absorb:

- confirmed primitive values needed by fields
- confirmed semantic foundation mappings needed by fields
- confirmed typography mappings needed by fields
- confirmed control-scale rules needed by fields
- the field family recipe itself

It should **not** initially absorb:

- board/object layer recipes
- interaction-layer recipes
- presence-family recipes
- subsystem-shell recipes
- speculative future families without an immediate rollout need

## 7. What should not happen in the first substrate pass

Do not do this:

- create a huge one-file design-system runtime module
- preload the entire canonical draft into code
- introduce component-family files for every possible family before migration
- move board-object and interaction exceptions into the same substrate pass
- turn the substrate into a broad styling framework before the first family
  migration proves the approach

## 8. Immediate next step

Once this substrate shape is accepted, the next implementation-prep step should
be:

1. create the minimal `src/ui/system/` structure
2. wire in only the first-pass field-supporting pieces
3. then begin the `field` family rollout as the first ordinary-interface
   migration slice

## 9. First family runtime shape: `field`

This section defines the expected runtime shape of the first family module so
that later implementation does not drift into ad hoc local structure.

### 9.1. Scope of the first `field` family

The first `field` family should cover only:

- ordinary text input
- password input
- select as a thin field subtype

It should support only:

- `default`
- `small`

It should **not** cover in the first pass:

- participant inline rename input
- note editing textarea overlay
- hidden file input
- textarea as a general family member
- validation-heavy variant system

### 9.2. Family structure rule

The `field` family should be split into:

- shell recipe
- inner text/input recipe

Working rule:

- do not collapse the outer field shell and the inner text-bearing element into
  one monolithic style object
- the shell and the inner element serve different responsibilities and should
  remain separate

### 9.3. Required exported shape

The first-pass `field` runtime module should expose a structure equivalent to:

- `fieldRecipes.default.shell`
- `fieldRecipes.default.input`
- `fieldRecipes.small.shell`
- `fieldRecipes.small.input`
- `fieldRecipes.small.select`

The exact TypeScript syntax may vary slightly, but the exported shape should
stay conceptually this close.

Working rule:

- use one clearly named family export
- do not export many disconnected helpers that recreate the same family through
  composition in product files

### 9.4. Responsibility of `shell`

The shell recipe should own:

- height
- vertical and horizontal padding
- border radius
- background/surface
- border treatment
- horizontal mixed-content alignment behavior where needed later
- interaction-state treatment at the shell level

The shell recipe should resolve through:

- semantic foundation roles
- control-scale geometry
- ordinary interaction-state rules

It should **not** own:

- inner text typography details beyond inherited foreground color
- select-specific browser cleanup rules

### 9.5. Responsibility of `input`

The input recipe should own:

- font family
- font size
- font weight
- letter spacing
- inner text color where needed
- transparent/native-reset behavior
- width behavior for the text-bearing element

The input recipe should resolve through:

- semantic typography roles
- ordinary text color roles

It should **not** own:

- outer shell geometry
- field border/surface treatment
- state-ring behavior

### 9.6. Required semantic links

The `field` family should resolve through the already agreed design-system
 layers rather than inventing a new local mapping.

`field.default.shell` should resolve through:

- `control.default.height`
- `control.default.paddingY`
- `control.default.paddingX`
- `radius.control`
- ordinary field surface/border semantic roles

`field.default.input` should resolve through:

- `control.default.bodyText`

`field.small.shell` should resolve through:

- `control.small.height`
- `control.small.paddingY`
- `control.small.paddingX`
- `radius.control`
- the same ordinary field surface/border semantic roles

`field.small.input` should resolve through:

- `control.small.bodyText`

`field.small.select` should:

- reuse the small field shell
- reuse the small field text recipe as closely as possible
- only add the minimum select-specific behavior needed for the browser control

### 9.7. State support required in the first pass

The first-pass `field` family should explicitly support:

- `default`
- `hover`
- `focus`
- `disabled`

Working rule:

- these states should be expressed through the canonical ordinary interaction
  state layer
- do not create field-local state names

Additional rule:

- `focus` must use an explicit focus ring rather than relying only on a border
  change
- `disabled` must suppress hover/focus behavior

### 9.8. Select handling rule

The first-pass `select` treatment should remain thin.

Working rule:

- `select` is a member of the field family
- it should not become its own independent geometry system in the first pass
- it should reuse the same shell and text logic as closely as possible

Allowed select-specific behavior:

- native browser cleanup/reset where necessary
- caret/appearance handling only where required for ordinary consistency

Not allowed in the first pass:

- a large custom select/listbox implementation
- a separate select-only token family
- deep divergence from the ordinary field shell

### 9.9. Product-file consumption rule

Product files migrating to the `field` family should consume the shared family
 export directly.

Working rule:

- product files should not reconstruct field styles from primitives or semantic
  tokens on their own
- product files should not create new local `inputStyle` clones once the family
  module exists

The intended consumption pattern is:

- shared family recipe imported from the runtime substrate
- product file applies the family recipe
- file-local overrides only where there is a clearly justified local exception

### 9.10. First migration consumers

The first implementation slice should target these consumers:

- entry room input
- entry player input
- ops unlock field
- optionally the entry debug select if it fits cleanly in the same pass

Explicit non-consumers in the first slice:

- participant inline rename input
- note editing textarea overlay
- hidden file input

### 9.11. Stop conditions for the `field` family pass

Stop and split the work if:

- the field family starts absorbing textarea/inline-edit exceptions
- select needs a much deeper custom interaction model than the thin subtype
  rule allows
- product files still need to rebuild local shell recipes after the family
  export exists
- the implementation begins to widen into a button/callout/surface migration at
  the same time
