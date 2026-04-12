# Design System Migration Map

Status: working dependency and migration map  
Scope: ordinary interface-layer migration planning for `play-space-alpha`

This document translates the canonical design-system draft into a practical
migration map.

It is intentionally narrower than the full project runtime.

Its purpose is:

- to define what should migrate into the ordinary interface design-system layer;
- to define what should stay out of that migration for now;
- to map current runtime families onto canonical families and token layers;
- to identify the safest rollout order.

This is not the final implementation plan for one rollout slice yet.
It is the dependency and targeting map that should exist before rollout work.

## 1. Scope and exclusion rule

This migration map covers the **ordinary interface layer** only.

Included:

- entry flow
- app-shell controls
- panel-contained ordinary controls
- ops controls
- media internal ordinary controls
- dice internal ordinary controls
- standard fields
- standard buttons
- standard callouts
- standard rows
- standard selection controls
- swatches and pills where they behave like ordinary interface controls

Explicitly excluded from the main migration target:

- board-object shells
- board-object controls
- object-adjacent Konva controls
- interaction-layer chrome
- object selection / occupancy / manipulation indications
- note editing overlay
- cursor / presence controls
- subsystem shells such as the media dock shell and dice tray shell

Working rule:

- excluded systems may later consume shared primitives or semantic tokens
- but they should not be treated as first-wave migration targets for the
  ordinary interface design-system rollout
- some board/object-related token and family work already exists in the
  canonical model
- that does **not** mean those areas belong in the first migration pass
- they should be treated as second- or third-pass design-system work after the
  ordinary interface layer has a stable migration baseline

## 2. Dependency model

The intended dependency order is:

- primitive tokens
- semantic foundation tokens
- semantic typography tokens
- control-scale tokens
- component / family tokens
- system-level consumers

Working rule:

- product code should migrate toward component and family tokens first
- direct migration from ad hoc runtime values straight to primitives should not
  be the default strategy

In other words:

- do not replace scattered local values with raw token soup
- replace local implementations with canonical family recipes that already
  consume the right semantic and primitive layers underneath

## 3. Ordinary interface migration targets

### 3.1. Shared app-surface language

Current repeated runtime language:

- elevated dark panels
- dark inset/surface pairings
- strong/muted text pairing
- subtle light borders on dark surfaces

Canonical target:

- surface roles:
  - `surface.panel`
  - `surface.panelSubtle`
  - `surface.inset`
- text roles:
  - `text.primary`
  - `text.secondary`
  - `text.muted`
- border roles:
  - `border.subtle`
  - `border.default`
- radius roles:
  - `radius.surface`
  - `radius.inset`
- shadow roles where needed:
  - `shadow.ui.floating`

Primary migration targets:

- entry screen panels and cards
- ops info cards and panel-like shells
- participant/session panel ordinary inset surfaces

Not a first-wave target:

- note-card shell
- token shell
- media dock shell as a generic overlay shell
- dice tray shell as a generic overlay shell
- board inspection / tooltip surfaces that live too close to board-object and
  interaction boundaries

### 3.2. Field family

Current runtime cluster:

- dark text fields in entry and ops
- compact select-like field in entry debug area

Canonical target:

- `field.default`
  - `height = control.default.height`
  - `paddingY = control.default.paddingY`
  - `paddingX = control.default.paddingX`
  - `bodyText = control.default.bodyText`
- `field.small`
  - `height = control.small.height`
  - `paddingY = control.small.paddingY`
  - `paddingX = control.small.paddingX`
  - `bodyText = control.small.bodyText`

Family members:

- text input
- password input
- select

Explicit exceptions:

- participant inline rename input
- note editing textarea overlay
- hidden file input

Primary migration targets:

- entry room input
- entry player input
- ops unlock field
- entry debug select

### 3.3. Button family

Current runtime cluster:

- ordinary action buttons across entry, toolbar, ops, media, and dice

Canonical target:

- `button.primary`
- `button.secondary`
- `button.danger`

Shared geometry target:

- `button.default`
  - `height = control.default.height`
  - `paddingY = control.default.paddingY`
  - `paddingX = control.default.paddingX`
  - `text = control.default.bodyText`
- `button.small`
  - `height = control.small.height`
  - `paddingY = control.small.paddingY`
  - `paddingX = control.small.paddingX`
  - `text = control.small.bodyText`

Interaction-state target:

- `default`
- `hover`
- `focus`
- `active`
- `disabled`

Primary migration targets:

- ops primary / secondary / danger actions
- board toolbar ordinary actions
- media ordinary action buttons
- dice ordinary tray buttons
- entry debug action pills only if they can cleanly resolve as the `pill`
  branch rather than being forced into rectangular buttons

Kept out of the ordinary button migration:

- board add-image floating trigger
- object-adjacent image controls
- transparent text actions in the participant panel
- session-panel destructive micro-action if it still reads as a surface-local
  subtype after visual review

### 3.4. Selection controls family

Current runtime cluster:

- native checkbox rows with label text

Canonical target:

- `selection.default`
  - `height = control.default.height`
  - `labelText = control.default.labelText`
- `selection.small`
  - `height = control.small.height`
  - `labelText = control.small.labelText`

Shared layout target:

- `display: flex`
- `align-items: center`
- `gap = space.small`

Family members:

- checkbox row
- radio row
- switch row

Current migration reality:

- checkbox rows are immediate migration candidates
- radio and switch are future family members, not current implementation targets

### 3.5. Disclosure / accordion family

Current runtime cluster:

- entry debug disclosure via native `details/summary`

Canonical target:

- disclosure trigger participates in standard control rhythm
- disclosure content is a block below the trigger
- accordion later builds on the same family

Primary migration target:

- entry debug disclosure behavior and styling if later normalized

Special caution:

- this family is modeled, but it still requires explicit visual review during
  real implementation

### 3.6. Callout family

Current runtime cluster:

- entry warning/error callouts
- media error callout
- dice error callout

Canonical target:

- `callout.warning`
- `callout.danger`

Geometry rule:

- no fixed height
- single-line cases should naturally sit near the `40px` rhythm through text
  recipe and internal padding

Primary migration targets:

- entry room-full message
- entry join-failure message
- media error block
- dice error block

Kept out of the boxed callout migration:

- inline muted status text
- inline error text
- local section-emphasis blocks such as `Room tools`

### 3.7. Row family

Current runtime cluster:

- ops room rows
- ops live-slice rows
- board inspection / semantics rows

Canonical target:

- one standardized `row` family
- with allowed variants:
  - selectable rows
  - data / inspection rows

Working rule:

- migrate row implementations toward shared spacing, typography, radius, and
  surface language
- do not force them into button geometry

Primary migration targets:

- ops room rows
- ops slice rows

Later / conditional targets:

- board-adjacent inspection rows only in a later pass, after the ordinary
  interface migration is stable and the board/object chapter is taken
  deliberately on its own

### 3.8. Swatch / pill family

Current runtime cluster:

- entry color swatches
- participant-panel color swatches
- entry debug pills

Canonical target:

- `swatch`
- `pill`

Primary migration targets:

- entry swatch group
- participant-panel swatch group
- entry debug text pills where they still behave as ordinary interface controls

Kept out:

- cursor markers
- cursor label pills
- tiny accent dots
- object-specific circular controls

## 4. Ordinary interface state migration rule

Ordinary interactive controls should migrate toward one shared universal
interaction-state layer:

- `default`
- `hover`
- `focus`
- `active`
- `disabled`

And a separate semantic/value-state layer where relevant, such as:

- `selected`
- `checked`
- `expanded`
- `open`
- `error`
- `warning`
- `danger`

Working rule:

- family rollout should not invent local state vocabularies during migration
- local runtime cases should be normalized toward these two layers instead

## 5. Horizontal geometry migration rule

Ordinary controls should migrate toward the control geometry contract already
defined in the canonical draft.

Default:

- `paddingY = space.small`
- `paddingX = space.medium`
- `contentGap = space.small`

Small:

- `paddingY = space.compact`
- `paddingX = space.small`
- `contentGap = space.compact`

Working rule:

- current runtime `10 / 14` drift should first normalize toward `8 / 12`
- do not add extra primitive spacing steps just to preserve current drift
- visual review can later reopen that choice if the normalized result proves too
  tight

## 6. First-wave rollout boundaries

These look safe enough to treat as first-wave migration targets:

1. shared app-surface foundation
2. field family
3. compact/default ordinary buttons
4. boxed callout family

These should remain second-wave or conditional:

1. row family
2. swatch / pill family
3. disclosure / accordion family
4. selection controls beyond checkbox rows

These should remain outside the ordinary interface migration:

1. board-object shells
2. board-object controls
3. interaction-layer chrome
4. object-adjacent floating controls
5. note editing overlay
6. cursor / presence controls
7. subsystem shells such as media dock and dice tray

Additional sequencing rule:

- board-object and board-adjacent control/system work is still valid
  design-system work
- it should simply happen later, as a separate second or third pass, rather
  than being mixed into the ordinary interface migration baseline

## 7. File-level targeting map

This map is intentionally coarse.
It is meant to guide rollout slicing, not to act as a final implementation
checklist.

### High-confidence ordinary interface targets

- `src/App.tsx`
  - entry surfaces
  - entry fields
  - entry primary CTA
  - entry callouts
  - entry swatches
  - entry debug disclosure and pills
- `src/ops/RoomsOpsPage.tsx`
  - panel/info-card language
  - fields
  - primary/secondary/danger buttons
  - rows
  - inline muted/error text
- `src/board/components/BoardToolbar.tsx`
  - ordinary toolbar action buttons
- `src/board/components/ParticipantSessionPanel.tsx`
  - ordinary inset/panel language
  - checkbox row
  - swatch controls
  - ordinary local actions only where they fit the canonical families cleanly
- `src/media/LiveKitMediaDock.tsx`
  - ordinary internal buttons
  - boxed error callout
  - not the dock shell
- `src/dice/DiceSpikeOverlay.tsx`
  - ordinary internal tray buttons
  - boxed error callout
  - not the tray shell

### Boundary / exception files

- `src/components/BoardStage.tsx`
  - use only as a boundary check for exclusions in the ordinary interface
    migration
  - do not treat board-object and interaction controls here as first-wave design
    system migration targets
- `src/board/components/CursorOverlay.tsx`
  - presence family boundary, not ordinary interface migration
- `src/board/components/RemoteInteractionIndicator.tsx`
  - interaction-layer boundary, not ordinary interface migration
- `src/board/objects/*`
  - object layer boundary, not ordinary interface migration

## 8. Rollout strategy rule

Migration should proceed like this:

1. establish or extract the smallest shared family recipe
2. migrate one narrow family/system slice onto it
3. validate the result
4. only then migrate the next slice

Do not do this:

- one giant repo-wide token replacement pass
- mixed rollout of ordinary interface controls together with board-object or
  interaction controls
- direct migration from local values to primitives without a stable family layer

## 9. Immediate next step

The next clean step after this map is:

- choose the first implementation slice inside the ordinary interface layer

Current best candidates:

- field family
- ordinary compact/default button family
- boxed callout family

The board-object and object-control layer should stay explicitly outside that
first migration slice unless a separate later chapter chooses to bring it in.
