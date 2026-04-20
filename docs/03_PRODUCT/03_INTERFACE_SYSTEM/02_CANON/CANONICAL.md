# Design System Canonical

Status: working canonical spec  
Scope: emerging canonical design-system structure for `play-space-alpha`

This document records the working canonical decisions that emerge after the
audit phases and user-alignment review.

It is not final yet.

Its purpose is:

- to capture agreed design-system direction in one place;
- to prevent repeated re-derivation of the same canonical decisions;
- to provide a stable target for later dependency-map and rollout work.

This document should only record decisions that have already been reviewed and
accepted at least at a working level.

## 1. Current decisions

### 1.1. Primitive token categories

The current draft primitive-token categories are:

- `color`
- `spacing`
- `radius`
- `stroke`
- `opacity`
- `shadow`
- `typography`
- `layering`

Not yet included as first-class primitive categories:

- `motion`
- `size`

Reason:

- motion does not yet exist as a meaningful shared token layer in the current
  runtime;
- many observed size values currently read more like component-local dimensions
  than foundation-level primitive tokens.

### 1.2. Primitive color structure

The current draft primitive color organization is:

- `color.neutral`
- `color.accent`
- `color.participant`
- `alpha`

#### `color.neutral`

Purpose:

- the base interface palette
- dark surfaces
- light foregrounds
- neutral borders / background pairings

This is the main non-user-specific visual material of the product.

#### `color.accent`

Purpose:

- system accents
- admin / ops / debug emphasis
- warning / destructive / service-style accents
- non-user-owned emphasis

Important:

- this palette is intentionally separate from participant identity colors
- it should not be assumed to be the same thing as the user-facing accent model

#### `color.participant`

Purpose:

- participant identity colors
- user/session accent language
- the main accent system visible to users during ordinary board/session use

Working rule:

- in normal user-facing flows, UI emphasis will often be built from:
  - neutral palette
  - participant accent
- not from generic system accent colors

#### `alpha`

Purpose:

- reusable opacity values
- translucent dark surfaces
- subtle borders
- preview / disabled / occupied opacity treatments

Working rule:

- alpha should be treated as its own primitive layer rather than hidden inside a
  flat list of raw `rgba(...)` values

## 2. Open next step inside this draft

The next item to define is:

- the draft contents of `color.neutral`

That work should continue here rather than being split across audit docs.

## 3. Primitive color draft

This section records the emerging primitive color sets that will later feed the
stable semantic foundation layer.

### 3.1. `color.neutral.dark`

The current draft `color.neutral.dark` set is a 4-step scale:

- `color.neutral.dark.0 = #020617`
- `color.neutral.dark.1 = #081226`
- `color.neutral.dark.2 = #0f172a`
- `color.neutral.dark.3 = #1e293b`

Working rule:

- this is a primitive dark neutral scale
- it should stay ordered and non-semantic at the primitive level
- semantic roles such as `surface.panel` or `surface.inset` should resolve into
  this scale later rather than being embedded into primitive token names

### 3.2. `color.neutral.light`

The current draft `color.neutral.light` set is a 4-step scale:

- `color.neutral.light.0 = #ffffff`
- `color.neutral.light.1 = #f8fafc`
- `color.neutral.light.2 = #e2e8f0`
- `color.neutral.light.3 = #cbd5e1`

Working rule:

- this is a primitive light neutral scale
- it should stay ordered and non-semantic at the primitive level
- semantic roles should resolve into this scale later rather than being embedded
  into primitive token names

### 3.3. `color.neutral.mid`

The current draft `color.neutral.mid` set exists for intermediate neutral tones
that do not sit cleanly inside either the dark or light scale.

Current draft values:

- `color.neutral.mid.0 = #94a3b8`

Working rule:

- this set exists to hold systemically important neutral tones that should not
  be forced into either `neutral.dark` or `neutral.light`
- it should stay small unless the runtime later proves that more intermediate
  neutral tones genuinely behave as part of the same primitive branch

### 3.4. `color.accent`

The current draft primitive accent families are:

- `color.accent.blue`
- `color.accent.teal`
- `color.accent.amber`
- `color.accent.red`

Current working interpretation:

- `color.accent.blue` = system/service accent
- `color.accent.teal` = rare constructive/affirmative accent
- `color.accent.amber` = warning accent
- `color.accent.red` = destructive accent

Working rule:

- accent families should remain separate from participant identity colors
- ordinary user-facing UI should still primarily read through:
  - neutral palette
  - participant accent
- system accent families exist mainly for:
  - admin / ops / debug use
  - warning/destructive semantics
  - occasional non-user-owned emphasis

The current draft primitive accent structure uses a small operational model:

- `base`
- `soft`
- `tint`

This is meant to cover the current runtime reality without prematurely creating
large decorative color scales.

#### `color.accent.blue`

- `color.accent.blue.base = #2563eb`
- `color.accent.blue.soft = #93c5fd`
- `color.accent.blue.tint = rgba(96, 165, 250, 0.7)`

#### `color.accent.teal`

- `color.accent.teal.base = #0f766e`
- `color.accent.teal.soft = #ecfeff`

Current note:

- teal is currently the narrowest accent family
- it is intended as a rarer constructive/affirmative accent rather than a
  heavily used everyday system accent
- a `tint` value may be added later if runtime usage justifies it

#### `color.accent.amber`

- `color.accent.amber.soft = #fde68a`
- `color.accent.amber.tint = rgba(251, 191, 36, 0.35)`

Current note:

- amber currently behaves more like warning text/tint than a broad full-depth
  family
- a stronger `base` value can be added later if the runtime needs a fuller
  warning scale

#### `color.accent.red`

- `color.accent.red.base = #fca5a5`
- `color.accent.red.soft = #fecaca`
- `color.accent.red.tint = rgba(127, 29, 29, 0.3)`

Additional currently active related red values:

- `#fecdd3`
- `rgba(248, 113, 113, 0.35)`

Current note:

- destructive red is already used in multiple nearby forms in the runtime
- the values above are enough to cover the current canonical draft
- nearby related red values can remain part of the factual audit until a later
  refinement pass decides whether they belong in the same primitive family or
  should remain derived/state-specific values

### 3.5. `color.participant`

The participant palette should be modeled as an ordered primitive set rather
than as semantically named accent colors.

Current draft form:

- `color.participant.0`
- `color.participant.1`
- `color.participant.2`
- `color.participant.3`
- `color.participant.4`
- `color.participant.5`
- `color.participant.6`
- `color.participant.7`

Working rule:

- participant colors are identity slots, not semantic UI colors
- they should stay ordered rather than named by hue
- later systems should resolve participant accent usage through these ordered
  slots rather than through semantic names like “blue” or “green”

### 3.6. `alpha`

The current draft primitive alpha set is:

- `alpha.strong`
- `alpha.medium`
- `alpha.soft`
- `alpha.faint`

Working interpretation:

- `alpha.strong` = dense translucent surfaces / strong overlay opacity
- `alpha.medium` = ordinary tinted backgrounds / stronger translucent borders
- `alpha.soft` = subtle borders / softer translucent treatments
- `alpha.faint` = very quiet separators / low-emphasis translucency

Working rule:

- alpha remains a primitive opacity ladder
- state- or system-specific meanings such as `disabled`, `preview`, or
  `occupied` should be expressed later in higher semantic layers rather than as
  primitive alpha names

### 3.7. `stroke`

The current draft primitive stroke set is:

- `stroke.thin`
- `stroke.default`
- `stroke.strong`

Current draft mapping to the existing runtime:

- `stroke.thin = 1`
- `stroke.default = 2`
- `stroke.strong = 3`

Working rule:

- stroke primitives should stay named by relative role, not by hard-coded raw
  numeric values
- this keeps the primitive names stable even if the underlying numeric line
  widths change later

### 3.8. `radius`

The current draft primitive radius set is:

- `radius.small`
- `radius.medium`
- `radius.large`
- `radius.pill`

Current draft mapping to the emerging canonical scale:

- `radius.small = 8`
- `radius.medium = 12`
- `radius.large = 16`
- `radius.pill = 999`

Working rule:

- primitive radius values should represent the intended canonical scale rather
  than every currently observed runtime radius
- currently observed `10`-radius usage should be treated as a later
  normalization question rather than as proof that `10` must become a
  foundation primitive step

### 3.9. `spacing`

The current draft primitive spacing set is:

- `space.tight = 4`
- `space.compact = 6`
- `space.small = 8`
- `space.medium = 12`
- `space.large = 16`
- `space.xlarge = 24`

Working rule:

- this primitive spacing scale represents the intended emerging canonical
  spacing rhythm
- currently observed runtime values such as `2`, `10`, and `14` should be
  treated as normalization questions rather than automatically promoted to
  foundation primitive steps

### 3.10. `font.family`

The current draft primitive font-family set is:

- `font.family.ui`
- `font.family.content`
- `font.family.handwritten`

Current draft mapping:

- `font.family.ui = HTML_UI_FONT_FAMILY`
- `font.family.content = TEXT_CARD_BODY_FONT_FAMILY`
- `font.family.handwritten = TBD`

Current note:

- `font.family.ui` is the strongest current foundation candidate
- `font.family.content` is currently a separate content/text family and remains
  important even if it later changes
- `font.family.handwritten` is being reserved now as a canonical slot for later
  use rather than introduced ad hoc in a future pass

### 3.11. `font.weight`

The current draft primitive font-weight set is:

- `font.weight.light`
- `font.weight.regular`
- `font.weight.medium`
- `font.weight.semibold`
- `font.weight.bold`
- `font.weight.heavy`

Current draft mapping:

- `font.weight.light = 300`
- `font.weight.regular = 400`
- `font.weight.medium = 500`
- `font.weight.semibold = 600`
- `font.weight.bold = 700`
- `font.weight.heavy = 800`

Current note:

- the current runtime most clearly uses `400`, `600`, `700`, and `800`
- `300` and `500` are being reserved now as part of a reasonable working scale
  rather than being added later in a fragmented way

### 3.12. `font.size`

The current draft primitive font-size set is:

- `font.size.xs = 11`
- `font.size.sm = 12`
- `font.size.md = 14`
- `font.size.lg = 16`
- `font.size.xl = 20`
- `font.size.2xl = 28`
- `font.size.3xl = 52`

Current note:

- primitive font-size names should stay ordered and non-functional
- semantic and component layers should decide whether a given size is used for
  label, body, heading, decorative text, or another role
- `12` is the strongest current small/supporting text size across compact
  controls, helper text, metadata, and secondary UI copy
- `14` currently behaves most consistently as a label-tier size rather than as
  the main control/body size
- `16` is the strongest current candidate for default control/content text in
  larger primary UI moments such as entry fields and the main CTA
- `20`, `28`, and `52` are currently treated as heading/decorative tiers rather
  than ordinary control text sizes
- currently observed `15` should be treated as a normalization question rather
  than as proof of a required canonical primitive step
- currently observed `18` remains a special/emphasis size in the runtime and is
  not yet being promoted into the primitive scale
- currently observed `22` behaves more like content-specific or exceptional
  heading typography and is not yet part of the canonical UI size ladder

### 3.13. `shadow`

The current draft primitive shadow set mirrors the compact depth model of the
product.

Current draft primitive shadow tokens:

- `shadow.board.resting`
- `shadow.board.raised`
- `shadow.board.active`
- `shadow.ui.floating`

Current draft runtime-aligned readings:

- `shadow.board.resting`
  - quiet board-object separation
  - aligned with current lighter Konva object shadows such as note-card and
    token shadows
- `shadow.board.raised`
  - stronger board-object lift
  - aligned with current board-world shadows around `8px` blur and darker
    board-object lift
- `shadow.board.active`
  - active manipulation depth on the board plane
  - aligned with stronger board-adjacent HTML/Konva lift recipes around
    `0 18px 40px rgba(2, 6, 23, 0.3)` and nearby values
- `shadow.ui.floating`
  - floating UI plane separation
  - aligned with current panel/overlay recipes such as:
    - `0 18px 50px rgba(2, 6, 23, 0.35)`
    - `0 20px 48px rgba(2, 6, 23, 0.34)`
    - `0 24px 60px rgba(2, 6, 23, 0.35)`
    - `0 24px 80px rgba(2, 6, 23, 0.55)`

Working rule:

- shadow primitives should remain raw reusable recipes
- for shadows, the primitive token set may intentionally stay very close to the
  semantic depth model because the current shadow system is compact and tightly
  coupled to board/UI depth
- each shadow token should receive different raw values per active scheme
- the semantic hierarchy of depth should stay stable across themes even if the
  exact primitive recipe values change

Current note:

- the project currently provides enough evidence to define the token set and
  its dark-side runtime readings first
- light-scheme shadow values are expected later, but they do not need to be
  invented before the canonical shadow token structure is stable

### 3.14. `lineHeight`

The current project does **not** yet justify a fully canonical primitive
line-height scale.

Working rule:

- ordinary UI should currently prefer automatic/default line-height
- existing explicit line-height overrides should be reviewed in a later cleanup
  pass and removed where they are not meaningfully necessary
- line-height should later be made explicit only where it materially improves:
  - text-style clarity
  - component fit
  - display typography
  - longer readable content
- when explicit line-height later becomes necessary, it should usually be
  decided at the semantic text-style or component level rather than forced too
  early into the primitive layer

Current note:

- the current runtime only contains a small number of explicit line-height
  overrides
- that makes line-height unlike spacing, radius, or font size, where a clearer
  canonical primitive scale is already visible

### 3.15. `letterSpacing`

The current draft primitive letter-spacing set is:

- `letterSpacing.tight = -0.02em`
- `letterSpacing.normal = 0`
- `letterSpacing.wide = 0.04em`

Working rule:

- primitive letter-spacing values should stay minimal
- this scale is being reserved now so that later text-style recipes do not
  reintroduce ad hoc tracking values

Current note:

- `letterSpacing.tight` is mainly for larger display text that benefits from
  slightly denser tracking
- `letterSpacing.normal` is the default for most UI/body text
- `letterSpacing.wide` is mainly for labels, uppercase metadata, and other text
  that benefits from a slightly more open rhythm

## 4. Foundation semantic layer (draft)

This section records the draft semantic layer only for the **foundations**
portion of the design system.

This is intentionally separate from later semantic layers for:

- buttons
- callouts
- rows
- interaction
- presence
- other component/system families

### 4.1. Surface semantics

The current draft foundation surface semantic set is:

- `surface.app`
- `surface.panel`
- `surface.panelSubtle`
- `surface.overlay`
- `surface.inset`

#### `surface.app`

Purpose:

- the base application/page background layer
- the broad base surface behind major UI shells

#### `surface.panel`

Purpose:

- the main elevated surface language
- primary dark panel shells and similar core surfaces

#### `surface.panelSubtle`

Purpose:

- a quieter/lower-emphasis panel variant
- secondary or softer panel treatment inside a stronger surface context

#### `surface.overlay`

Purpose:

- floating or fixed-position overlay surfaces
- overlay-like UI that should read above ordinary page or board shell surfaces

#### `surface.inset`

Purpose:

- internal inset surfaces
- embedded inner blocks inside a larger parent surface

Working rule:

- this draft surface set should stay minimal for now
- it should not yet expand into component/system-specific surface names such as:
  - tooltip
  - media
  - note
  - card
  - other more specialized surface labels

### 4.2. Text semantics

The current draft foundation text semantic set is:

- `text.primary`
- `text.secondary`
- `text.muted`
- `text.inverse`

These foundation text semantics currently describe **text color roles only**.

They do not yet define:

- font sizes
- weights
- line heights
- letter spacing
- stateful/accent text variants

#### `text.primary`

Purpose:

- main readable text on the current base surfaces

#### `text.secondary`

Purpose:

- secondary but still important supporting text

#### `text.muted`

Purpose:

- quieter helper text
- metadata
- low-emphasis labels

#### `text.inverse`

Purpose:

- text for an inverted surface polarity
- especially useful when light-surface cases exist alongside a mostly dark UI

Working rule:

- foundation text semantics should stay minimal for now
- accent/state/presence/feature-specific text roles should be defined later in
  higher semantic layers rather than being pushed into the foundation text set

### 4.3. Border semantics

The current draft foundation border semantic set is:

- `border.subtle`
- `border.default`
- `border.strong`
- `border.accent`

#### `border.subtle`

Purpose:

- quiet separators
- low-emphasis panel borders
- soft surface boundaries

#### `border.default`

Purpose:

- standard control and surface borders
- ordinary UI boundary treatment

#### `border.strong`

Purpose:

- more visible structural borders
- stronger framing when higher emphasis is needed without moving into a more
  specialized state family

#### `border.accent`

Purpose:

- a general accent structural border role
- highlighted structural emphasis without immediately implying:
  - warning
  - danger
  - participant ownership
  - interaction-specific semantics

Working rule:

- foundation border semantics should stay structural
- stateful/system-specific border roles should be defined later in higher
  semantic layers

### 4.4. Shadow semantics

The current draft foundation shadow model is based on **planes and depth**, not
on generic visual emphasis by itself.

The current draft set is:

- `shadow.board.resting`
- `shadow.board.raised`
- `shadow.board.active`
- `shadow.ui.floating`

#### Physical model

The current product is best understood as two main visual planes:

- a **board plane**
- a **UI plane above the board**

Shadow semantics should primarily describe depth within and above those planes.

#### `shadow.board.resting`

Purpose:

- objects resting on the board plane
- quiet contact/separation from the board surface

#### `shadow.board.raised`

Purpose:

- board objects that are visually slightly lifted above their resting state
- a stronger board-object depth without turning the object into UI chrome

#### `shadow.board.active`

Purpose:

- actively manipulated board objects
- strongest board-plane lift while the object still remains part of the board
  world

#### `shadow.ui.floating`

Purpose:

- floating/fixed UI surfaces above the board
- panel-like or overlay-like interface elements that clearly live in the UI
  plane rather than the board plane

Working rule:

- foundation shadows should describe **layer/depth**
- not generic emphasis for its own sake
- stronger emphasis should usually be expressed later through other semantic
  layers rather than by overloading the shadow layer

### 4.5. Radius semantics

The current draft foundation radius semantic set is:

- `radius.surface`
- `radius.inset`
- `radius.control`
- `radius.pill`

These are semantic roles, not raw numeric values.

#### `radius.surface`

Purpose:

- primary surface shells
- main panels
- cards
- major overlay shells

#### `radius.inset`

Purpose:

- inset or nested surface blocks inside larger parent surfaces
- quieter inner sections / info blocks / subpanels

#### `radius.control`

Purpose:

- ordinary rounded-rectangle controls
- buttons
- inputs
- rows
- callouts
- other control-like rectangular elements

#### `radius.pill`

Purpose:

- pill-like and circular controls
- chips
- swatches
- circular triggers
- fully rounded controls

Working rule:

- `radius.surface` and `radius.inset` should stay distinct
- nested surface blocks should not be forced into the same radius role as outer
  shells if they clearly behave as a quieter inner surface class

### 4.6. Spacing semantics

The current draft foundation spacing semantic set is:

- `space.surface.padding`
- `space.inset.padding`
- `space.control.x`
- `space.control.y`
- `space.stack.gap`
- `space.inline.gap`

These are semantic roles, not raw spacing values.

#### `space.surface.padding`

Purpose:

- padding inside primary surface shells
- main panels, cards, and overlay shells

#### `space.inset.padding`

Purpose:

- padding inside inset or nested inner blocks
- internal sections and embedded surface-like regions

#### `space.control.x`

Purpose:

- horizontal internal spacing for control-like elements

#### `space.control.y`

Purpose:

- vertical internal spacing for control-like elements

#### `space.stack.gap`

Purpose:

- vertical rhythm between stacked blocks
- common column/grid stack spacing

#### `space.inline.gap`

Purpose:

- horizontal rhythm between inline or row-based neighboring elements

Working rule:

- foundation spacing semantics should stay simple for now
- more specialized spacing roles should be introduced later only when a clearer
  component/system need is established

### 4.7. Typography semantics

The current draft foundation typography semantic set is split into:

- `font.ui`
- a full default UI text-style set
- a reduced small UI text-style set

These typography semantics are intentionally separate from `text.*` color
semantics.

Working distinction:

- `text.*` = text color roles
- `textStyle.*` = typographic style roles

#### `font.ui`

Purpose:

- the primary UI font-family role

### Default UI text-style set

The current draft full default UI text-style set is:

- `uiTextStyle.display`
- `uiTextStyle.titleLarge`
- `uiTextStyle.title`
- `uiTextStyle.body`
- `uiTextStyle.label`
- `uiTextStyle.labelSmall`
- `uiTextStyle.overline`
- `uiTextStyle.caption`

Working rule:

- this is the primary canonical UI typography set
- it should be complete enough to cover the current ordinary UI without being
  designed for speculative future breadth
- smaller text roles that are needed in ordinary default-scale UI may still
  live inside this set

#### `uiTextStyle.display`

Purpose:

- large display/headline text
- hero-like or title-like UI moments

Current draft primitive mapping:

- `font.family.ui`
- `font.weight.heavy`
- `font.size.3xl`
- `letterSpacing.tight`

Current note:

- display is already the cleanest current UI text-style recipe in the runtime
- explicit line-height remains a special display-level override for now rather
  than part of the general primitive canon

#### `uiTextStyle.title`

Purpose:

- panel titles
- section headings
- stronger UI heading moments below hero/display scale

Current draft primitive mapping:

- `font.family.ui`
- `font.weight.bold`
- `font.size.md`
- `letterSpacing.normal`

Current note:

- `uiTextStyle.title` is a real functional role, but its runtime size is not
  yet fully normalized
- the current working canonical choice is to treat `uiTextStyle.title` as the
  ordinary `14px / 700` UI heading tier
- this should remain open to later tuning by visual review if live UI usage
  proves that a different size is needed

#### `uiTextStyle.titleLarge`

Purpose:

- larger page or major-section headings inside ordinary UI
- stronger UI titles that are clearly below display/hero scale but above the
  ordinary title tier

Current draft primitive mapping:

- `font.family.ui`
- `font.weight.heavy`
- `font.size.xl`
- `letterSpacing.normal`

Current note:

- current runtime already shows this role, but not yet as one fully normalized
  step
- the current working canonical choice is to treat `uiTextStyle.titleLarge` as
  the ordinary `20px / 800` large UI heading tier
- `28px / 800` should currently be treated as a less common escalation point,
  not as the baseline recipe for this role

#### `uiTextStyle.body`

Purpose:

- standard readable body text

Current draft primitive mapping:

- `font.family.ui`
- `font.weight.regular`
- `font.size.lg`
- `letterSpacing.normal`

Current note:

- this is the strongest current candidate for the default UI body/control text
  recipe
- some local runtime usage still sits at `15px`, but it currently reads more
  like a normalization tail than like a distinct canonical body step

#### `uiTextStyle.label`

Purpose:

- control labels
- short UI labels
- button text
- medium-emphasis metadata

Current draft primitive mapping:

- `font.family.ui`
- `font.weight.bold`
- `font.size.md`
- `letterSpacing.normal`

Current note:

- this role is already one of the cleanest and most repeatable current UI text
  recipes
- it maps well to ordinary labels, button text, and row titles in the current
  runtime

#### `uiTextStyle.labelSmall`

Purpose:

- smaller label text inside ordinary default-scale UI
- compact top labels
- smaller structural labels that still belong to the default UI set

Current draft primitive mapping:

- `font.family.ui`
- `font.weight.semibold`
- `font.size.sm`
- `letterSpacing.normal`

Current note:

- this is the ordinary small-label role for default-scale UI
- top labels that do not need a deliberate meta/overline voice should use this
  style rather than borrowing uppercase/tracked meta typography
- this role should stay visually quieter and more ordinary than the overline
  tier

#### `uiTextStyle.overline`

Purpose:

- small meta labels above content
- overline-like structural markers
- uppercase-friendly micro headings where a deliberate meta voice is intended

Current draft primitive mapping:

- `font.family.ui`
- `font.weight.semibold`
- `font.size.xs` to `font.size.sm`
- `letterSpacing.wide`

Current note:

- this role exists to keep meta/overline typography separate from ordinary
  small labels
- it should be used only where that stronger meta voice is actually intended
- current runtime already contains examples of this role in version labels,
  tool-section labels, and small uppercase metadata
- where current top labels are using overline-like styling without needing that
  voice, they should later normalize toward `uiTextStyle.labelSmall`

Required follow-up:

- a later normalization pass must review current overline-like usages across UI
  controls and surfaces
- that pass should explicitly decide, case by case, whether each current usage
  is a true `uiTextStyle.overline` case or should be normalized to
  `uiTextStyle.labelSmall`

#### `uiTextStyle.caption`

Purpose:

- small supporting text
- helper text
- muted metadata
- lower-emphasis UI copy

Current draft primitive mapping:

- `font.family.ui`
- `font.weight.regular`
- `font.size.sm`
- `letterSpacing.normal`

Current note:

- this is already a strong and stable current runtime recipe
- it is the clearest supporting-text companion to the default UI body scale

### Small UI text-style set

The current draft reduced small UI text-style set is:

- `uiTextStyleSmall.body`
- `uiTextStyleSmall.label`
- `uiTextStyleSmall.caption`

Working rule:

- this is a supplementary compact set for small-scale UI contexts
- it is intentionally smaller than the default set
- it should only contain the roles that are actually needed in compact control
  and compact UI contexts

Current note:

- the current runtime is already strong enough to justify the existence of this
  set
- exact primitive mappings for the small set should be finalized only after the
  default UI text-style set has been normalized first

#### `uiTextStyleSmall.body`

Current draft primitive mapping:

- `font.family.ui`
- `font.weight.regular`
- `font.size.sm`
- `letterSpacing.normal`

Current note:

- this role is currently being defined mainly by analogy with the default UI
  body tier rather than by a strongly distinct runtime pattern
- that is acceptable for now because the small set is intentionally a reduced
  companion set, not a fully independent typography system

#### `uiTextStyleSmall.label`

Current draft primitive mapping:

- `font.family.ui`
- `font.weight.semibold`
- `font.size.sm`
- `letterSpacing.normal`

Current note:

- this role is already strongly supported by current compact controls and small
  button-like surfaces in the runtime

#### `uiTextStyleSmall.caption`

Current draft primitive mapping:

- `font.family.ui`
- `font.weight.regular`
- `font.size.sm`
- `letterSpacing.normal`

Current note:

- although `font.size.xs` exists in the system, the current runtime still
  points much more strongly to `12px` as the main compact supporting-text tier
- `font.size.xs` should remain the micro/overline tail, not the baseline small
  caption size

Working rule:

- foundation typography semantics should stay general
- stateful/component/system-specific text styles should be introduced later in
  higher semantic layers

### 4.8. Layering semantics

The current draft foundation layering semantic set is:

- `layer.board`
- `layer.ui`
- `layer.overlay`
- `layer.top`

These are semantic layer tiers, not arbitrary raw `z-index` numbers.

#### `layer.board`

Purpose:

- the board world
- board-stage content and board-plane visual elements

#### `layer.ui`

Purpose:

- ordinary fixed/floating interface surfaces above the board

#### `layer.overlay`

Purpose:

- overlay surfaces that should clearly read above ordinary UI

#### `layer.top`

Purpose:

- rare topmost cases that should not be casually occluded by lower UI layers

## 5. Control scale layer (draft)

This section records the emerging control scale model that sits above
foundations and below final component-family recipes.

The current draft uses:

- a full `default` control scale
- a supplementary `small` control scale

`large` is not being introduced yet.

### 5.1. Standard control height rhythm

The current draft standard control heights are:

- `control.default.height = 40`
- `control.small.height = 32`

Purpose:

- these heights define the baseline vertical rhythm for standard rectangular
  controls such as:
  - buttons
  - text inputs
  - selects
  - similar standard control shells

Working rule:

- `control.default.height = 40` is the canonical baseline for ordinary
  controls
- `control.small.height = 32` is the compact companion height and should sit
  comfortably inside default-scale UI contexts
- these heights should drive later control recipes more strongly than the
  current scattered ad hoc padding values

Current note:

- current runtime recipes already cluster around these two bands
- the canonical model is therefore acting mainly as normalization and
  clarification, not as an artificial new sizing system

### 5.0. Control-system growth rule

Once the project has migrated onto the design-system model, subsequent UI work
should follow this rule:

- if an existing design-system control, control pattern, or semantic token
  already fits the need, new implementation work should be based on that
  existing system element
- if the needed control, control group, or supporting system pattern does not
  exist yet, it should be added to the design-system model first
- only after that design-system addition is understood and recorded should the
  product implementation continue

This applies not only to single controls, but also to grouped-control patterns
such as:

- checkbox groups
- radio groups
- switch rows
- disclosure/accordion groups
- similar future compound control structures

Working rule:

- new control families and grouped-control patterns should not be added ad hoc
  after the system migration
- the design system should remain the place where new UI building blocks are
  introduced deliberately before rollout into product code

### 5.2. Control block vertical rhythm

Control blocks should be understood as a vertical stack that may include:

- `topLabelText`
- the control itself
- `captionText`

The current draft vertical rhythm is:

- `control.default.topLabelGap = space.compact`
- `control.default.captionGap = space.tight`
- `control.small.topLabelGap = space.compact`
- `control.small.captionGap = space.tight`

Current draft resolved values:

- `topLabelGap = 6`
- `captionGap = 4`

Working rule:

- top labels should sit slightly looser above the control than captions sit
  below it
- captions should stay visually attached to the control they explain
- the small control block should initially keep the same top-label/caption gap
  rhythm as the default block, with compactness coming first from control
  height and text scale rather than from aggressively tighter vertical spacing

### 5.3. Control text-role mapping

The current draft `control.default` text-role mapping is:

- `control.default.topLabelText -> uiTextStyle.labelSmall`
- `control.default.labelText -> uiTextStyle.label`
- `control.default.bodyText -> uiTextStyle.body`
- `control.default.captionText -> uiTextStyle.caption`

The current draft `control.small` text-role mapping is:

- `control.small.topLabelText -> uiTextStyle.labelSmall`
- `control.small.labelText -> uiTextStyleSmall.label`
- `control.small.bodyText -> uiTextStyleSmall.body`
- `control.small.captionText -> uiTextStyleSmall.caption`

Working rule:

- button text and other primary text inside controls should map through
  `bodyText`, not `labelText`
- `topLabelText` should default to the ordinary small-label voice, not to the
  overline/meta voice
- `uiTextStyle.overline` remains an explicit special-case choice rather than a
  default control-stack text role

### 5.4. Control state layer

The current draft control-state model is split into:

- universal interaction states
- semantic / value states

#### Universal interaction states

The current draft universal interaction states for ordinary controls are:

- `default`
- `hover`
- `focus`
- `active`
- `disabled`

Working rule:

- these states form the standard interaction baseline for ordinary controls such
  as buttons, fields, selects, and disclosure triggers
- they should be treated as state deltas layered on top of the base control
  recipe rather than as separate component recipes

Current state behavior model:

- `default`
  - base control recipe only
- `hover`
  - subtle surface/border emphasis
  - no layout or typography shift
- `focus`
  - explicit focus ring
  - may also strengthen the border, but must remain distinguishable from hover
- `active`
  - pressed-state surface/border delta
  - no geometry or layout shift
- `disabled`
  - non-interactive, de-emphasized state
  - no hover/focus/active response

Current note:

- current runtime already provides a strong factual base for:
  - `default`
  - `disabled`
- `hover`, `focus`, and `active` should currently be treated as required
  canonical states rather than as already standardized runtime behavior

Current draft visual contract:

- `default`
  - control uses its base surface, border, and text recipe
- `hover`
  - strengthen border by one step
  - slightly increase surface separation
  - do not change typography, height, or layout
- `focus`
  - apply an explicit outer focus ring
  - keep the focus ring visually stronger than hover
  - optional border strengthening is allowed, but focus must not rely on border
    change alone
- `active`
  - apply a pressed-state surface delta that is slightly stronger than hover
  - allow a slightly denser border treatment than hover
  - do not shift geometry, sizing, or layout
- `disabled`
  - remove interaction response
  - mute text, border, and surface treatment
  - allow moderate opacity reduction
  - no hover, focus, or active deltas

Disabled surface rule:

- the system now distinguishes two disabled surface classes for controls:
  - `control.surface.disabled`
  - `control.surface.disabledFilled`
- `control.surface.disabledFilled` is for controls whose ordinary resting state
  is filled
- `control.surface.disabled` is for non-filled controls
- disabled border and disabled text remain shared branches for now
- disabled should preserve the material class of the control:
  - filled controls should remain filled when disabled
  - non-filled controls should remain non-filled when disabled

Unified disabled contract for DOM controls:

- every DOM control family should apply disabled through the same mechanism:
  - interaction is disabled
  - current visual vars switch to disabled branches
  - shared disabled opacity may be added on top
  - the control keeps its material class
- this rule applies to:
  - `button`
  - `field`
  - `swatch`
  - `pill`
  - `row-selectable`
- `row-selectable` is an ordinary non-filled control:
  - it should follow the same disabled contract as other non-filled controls
  - it should not remain on an implicit half-disabled path
- disabled must stop being a mix of unrelated local patterns such as:
  - token branch swap in one family
  - opacity-only treatment in another family
  - native `disabled` with no visual branch in a third family

Current draft semantic token targets:

- `control.surface.default`
- `control.surface.hover`
- `control.surface.active`
- `control.surface.disabled`
- `control.surface.disabledFilled`
- `control.border.default`
- `control.border.hover`
- `control.border.focus`
- `control.border.active`
- `control.border.disabled`
- `control.text.default`
- `control.text.disabled`
- `control.focusRing`

Current draft mapping principles:

- `hover` should usually read through `control.border.hover` first and only
  secondarily through surface change
- `focus` should read primarily through `control.focusRing`
- `active` should read primarily through `control.surface.active`
- `disabled` should read through both muted text and muted surface/border
  treatment, not through opacity alone
- `disabledFilled` should serve filled controls
- `disabled` should serve non-filled controls

Best-practice rule:

- ordinary controls should support all five universal interaction states even
  if some current runtime cases do not yet expose them
- `focus` must be visibly distinct from `hover`
- `active` must not rely on geometry shifts or pressed transforms to
  communicate state
- `disabled` should remain readable while clearly non-interactive

#### Semantic / value states

The current draft semantic / value state layer includes states such as:

- `selected`
- `checked`
- `expanded`
- `open`
- `error`
- `warning`
- `danger`

Working rule:

- these are also states, but they are not the same layer as universal
  interaction states
- they should be modeled as meaning/value/intent deltas that can combine with
  the universal interaction layer
- `occupied` and similar domain-specific conditions remain outside this
  ordinary control-state layer unless a later pass promotes them explicitly

Layering rule:

- final control appearance should be understood as:
  - base recipe
  - plus universal interaction-state delta
  - plus semantic/value-state delta where relevant

### 5.5. Control geometry and internal alignment

The current draft ordinary-control geometry contract is:

- `control.default.paddingY -> space.small`
- `control.default.paddingX -> space.medium`
- `control.default.contentGap -> space.small`
- `control.small.paddingY -> space.compact`
- `control.small.paddingX -> space.small`
- `control.small.contentGap -> space.compact`

Current draft resolved values:

- default control = `8 / 12` internal padding with `8` content gap
- small control = `6 / 8` internal padding with `6` content gap

Working rule:

- ordinary controls should normalize toward this primitive-based geometry rather
  than preserving current local `10 / 14` drift by default
- height remains the primary source of vertical rhythm
- padding and content gap should refine the interior geometry without becoming
  the main source of vertical alignment

Alignment rule:

- text-only controls do not need forced flex layout when no mixed content is
  present
- mixed-content controls should use:
  - `display: flex`
  - `align-items: center`
- selection rows should use:
  - `display: flex`
  - `align-items: center`
  - `gap -> space.small`

Disclosure rule:

- disclosure triggers with mixed content (for example text plus chevron) should
  follow the same mixed-content alignment contract
- text-only disclosure triggers may remain text-only controls if no extra inner
  layout is needed

Current note:

- rows and callouts should not automatically inherit this exact padding
  contract
- those families already have their own geometry rules and should only align
  with the broader rhythm, not collapse into ordinary control internals

## 6. Control families (draft)

This section records the first explicit control-family rules that sit on top of
the control scale layer.

### 6.1. Field family

The current draft standard field family includes:

- text input
- password input
- select

Working rule:

- standard fields participate in the same control-height rhythm as other
  standard controls
- `field.default.height = control.default.height = 40`
- `field.small.height = control.small.height = 32`
- field text should map through the same control text-role model as other
  standard controls, with field value/content primarily using `bodyText`

Select rule:

- `select` should currently be treated as a field-family member
- it may have hybrid interaction semantics between field and button, but its
  geometry and vertical rhythm should follow the field family rather than
  forming a separate sizing system

Explicit exceptions:

- inline transparent rename input
- note editing textarea overlay
- hidden file input

Exception rule:

- these should not be forced into the standard field family just because they
  are technically inputs
- they remain explicit special cases until a later design-system pass proves
  that a more general editable-surface family is needed

### 6.2. Selection controls family

The current draft selection-controls family includes:

- checkbox row
- radio row
- switch row

Working rule:

- selection controls should share the same outer control-height rhythm as other
  standard controls
- `selection.default.height = control.default.height = 40`
- `selection.small.height = control.small.height = 32`
- their inner indicator geometry may differ, but their outer row/block
  alignment should remain systemically consistent with the broader control
  layer

Text-role rule:

- selection controls should primarily use `labelText` beside the control
- `selection.default.labelText -> control.default.labelText`
- `selection.small.labelText -> control.small.labelText`

Stack rule:

- top labels should not be part of the standard selection-control pattern
- `captionText` may still appear below a selection control when supporting or
  explanatory text is needed

Current note:

- the current runtime only contains checkbox-row cases
- radio and switch are being included now as family members by rule so that
  they do not arrive later as ad hoc geometry exceptions

### 6.3. Disclosure / accordion family

The current draft disclosure family includes:

- disclosure trigger
- disclosure content block
- accordion item header
- accordion item content

Working rule:

- disclosure triggers should participate in the same standard control-height
  rhythm as other controls
- `disclosure.default.height = control.default.height = 40`
- `disclosure.small.height = control.small.height = 32`
- disclosure content should be treated as a content/inset block below the
  trigger rather than as another control-height element

Text-role rule:

- disclosure trigger text should primarily map through `bodyText`
- supporting text inside revealed content should use ordinary body/caption roles
  from the surrounding typography system rather than a separate disclosure-only
  text scale

Accordion rule:

- accordion should be treated as a structured disclosure specialization
- accordion headers should inherit disclosure-trigger geometry rather than
  introducing a separate baseline control rhythm

Current note:

- the current runtime only contains a debug-oriented `details/summary` case
- this family is still worth defining now so that later disclosure and
  accordion patterns are added systematically rather than ad hoc
- this family has not yet gone through close visual/user review in this draft
  pass
- real implementation should include a fresh visual check before treating this
  model as settled

### 6.4. Button family

The current draft standard button family includes:

- `button.primary`
- `button.secondary`
- `button.danger`

Scale rule:

- `button.default.height = control.default.height = 40`
- `button.small.height = control.small.height = 32`
- `button.compact.height = 24`

Text-role rule:

- button text should map through `bodyText`
- `button.default.text -> control.default.bodyText`
- `button.small.text -> control.small.bodyText`
- `button.compact.text -> compact button body text = 12`

Family rule:

- the standard button family covers ordinary rectangular action controls in the
  app/control layer
- it should be the default home for standard primary, secondary, and danger
  actions before introducing more specialized action families
- `button.compact` is now an accepted standard branch inside the same family
  rather than a later speculative extension

Current `secondary` surface note:

- the current shared `button.secondary` path reuses the same `surface.inset`
  branch that also serves inset-style container surfaces
- this is accepted as the current working semantic path because both cases read
  as the same neutral recessed material class in the runtime
- keep one open design question explicit:
  - if later runtime usage shows that secondary buttons need a distinct
    semantic surface role from inset containers, add that as a separate
    button-facing surface branch rather than continuing to overload
    `surface.inset`

Compact branch rule:

- `button.compact` remains an ordinary text button, but with denser geometry
- it should use the same variant and state model as the rest of the button
  family:
  - `primary`
  - `secondary`
  - `danger`
  - `default`
  - `hover`
  - `focus`
  - `active`
  - `disabled`
- its current accepted geometry is:
  - `height = 24`
  - `paddingY = 2`
  - `paddingX = 6`
  - `contentGap = 4`
  - `radius = radius.control`
- its current accepted text treatment is:
  - `font size = 12`
  - `line height = 1`
- this compact geometry is currently accepted as a button-local branch, not as
  proof that the whole system needs a global `compact` control scale

Neutral-primary tone rule:

- the system now also accepts a neutral primary tone path for cases where
  user/session-facing controls should not read through the system blue accent
- this path should remain available as a shared button tone rather than as a
  one-off local override
- current practical intent:
  - ordinary system-facing primary actions may still use the blue accent path
  - session-facing or board-interaction-facing primary actions may instead use
    the neutral primary tone where that reads more honestly

Current boundary exclusions:

- Konva object-adjacent image controls
- swatch buttons
- cursor/presence controls

Current note:

- these exclusions should remain outside the standard button family until a
  later pass proves that they belong in a more general action-control family
- the shared ordinary button chapter now already covers:
  - ops buttons
  - board toolbar buttons
  - dice tray buttons
  - media buttons
  - entry primary CTA
  - fixed add-image trigger
- the main later-return button-like exceptions are:
  - board-object interaction controls that now want their own
    `interactionButton` family branch
  - participant-panel micro-actions
  - participant-panel creator-only destructive button such as `Reset board`
  - object-adjacent image controls

Text-action rule:

- `text button` remains inside the button system as a button-derived path
- it should keep ordinary button semantics, states, and size branches
- it should replace the filled shell with a transparent treatment rather than
  becoming a separate adjacent family by default
- current accepted direction:
  - keep `text button` inside `src/ui/system/families/button.ts`
  - treat it as a valid button-derived class rather than a temporary adjacent-
    family bridge

Interaction-button rule:

- board-object interaction controls now have an accepted derived family branch:
  - `interactionButton.pill`
  - `interactionButton.circle`
- this branch should remain derived from the ordinary button system rather than
  introducing a separate tone/state model
- current accepted baseline:
  - inherit the same variants as ordinary buttons:
    - `primary`
    - `secondary`
    - `danger`
  - inherit the same interaction states:
    - `default`
    - `hover`
    - `focus`
    - `active`
    - `disabled`
  - inherit the same text basis as `button.small`
  - inherit the same size baseline as `button.small`
  - use `radius.pill`
- current shape rule:
  - `interactionButton.pill` = default text-capable board-interaction shape
  - `interactionButton.circle` = equal-width/equal-height variant, expected
    mainly for icons, `+`, and similarly short content
- current boundary rule:
  - this branch is reserved for board-object / object-adjacent interaction
    controls so that classic interface controls and board-interaction controls
    remain visually separated

Subtype direction:

- participant-colored button cases should currently be treated as subtypes of
  the ordinary button family rather than as separate button families
- the current intended direction is:
  - dice buttons = `secondary` button with participant-accent subtype
  - title/hero-ish participant-accent action = `primary` button with selected-
    participant accent subtype

Working rule:

- participant-accent button cases should inherit ordinary button-family
  structure first
- accent color should behave as an overlaying subtype dimension, not as proof
  of a separate family
- toggle behavior should also behave as a subtype dimension, not as proof of a
  separate button family

Subtype recipe rule:

- participant-accent button subtypes should inherit the ordinary button-family
  recipe completely and override only the tone layer
- tone override may affect:
  - surface
  - border
  - text contrast where required
  - hover/active tonal states
- tone override should not affect:
  - geometry
  - typography
  - focus-ring structure
  - disabled-state structure

In practical terms:

- `participantAccentSecondary` = shared `secondary` button recipe + participant-
  accent tone override
- `participantAccentPrimary` = shared `primary` button recipe + participant-
  accent tone override
- `toggleSecondarySmall` = shared `secondary.small` button recipe + toggle tone
  override

### 6.5. Callout family

The current draft standard boxed callout family includes:

- `callout.warning`
- `callout.danger`

Family rule:

- boxed callouts should be treated as message surfaces rather than as fixed
  control-height elements
- they should still align with the broader control/surface language through
  shared radius, spacing, and typography rules
- single-line boxed callouts should naturally land near the `40px` rhythm
  through their text recipe and internal padding, without introducing a fixed
  height contract
- multi-line boxed callouts should be allowed to grow naturally

Text-role rule:

- callout text should primarily use ordinary body/caption text roles from the
  surrounding typography system rather than a separate callout-only text scale

Spacing rule:

- boxed callouts should use internal padding that supports the single-line
  `40px` rhythm target
- outer spacing around callouts should come from the surrounding parent stack
  rhythm rather than from a separate callout-only outer layout contract

Current exclusions:

- inline muted status text
- inline error text
- subsection emphasis blocks such as `Room tools`

Current note:

- the standard callout family should cover boxed warning/error message surfaces
- quieter inline status and helper text should remain separate for now rather
  than being forced into the boxed callout model

### 6.6. Row family

The current draft row family is a standardized structured-block family with
allowed internal variants such as:

- selectable rows
- data / inspection rows

Family rule:

- rows should be treated as structured content/control blocks rather than as
  fixed control-height elements
- rows should align with the broader system through shared spacing, radius,
  surface, border, and typography language
- the family should remain standardized even if individual row variants differ
  in interactivity or content density

Selectable-row rule:

- `row-selectable` is an ordinary non-filled control
- it is separate from ordinary buttons because of layout and content structure,
  not because it has a different state model
- it should use the shared control-state language for:
  - hover
  - focus
  - active
  - disabled
- it may keep a row-specific semantic `selected` state
- its disabled state should use the shared non-filled disabled branch

Text-role rule:

- rows should compose from the ordinary UI text-style set rather than from a
  separate row-only typography scale
- rows may combine:
  - a stronger primary line
  - one or more supporting caption lines

Current note:

- the project already shows enough evidence for a standardized row family
- it does not yet justify a single fully unified row component recipe
- current room rows, slice rows, and inspection rows should later normalize
  toward this family instead of continuing as unrelated local patterns

### 6.7. Swatch / pill family

The current draft swatch / pill family includes:

- color swatches
- text action pills

Family rule:

- this family should cover small rounded controls that primarily communicate:
  - color selection
  - compact action choice
  - compact filter/state choice where applicable later
- it should not automatically absorb presence-specific markers or cursor UI

Current internal split:

- `swatch`
  - circular or near-circular color-selection controls
- `pill`
  - compact rounded text controls or compact chip-like actions

Current direction correction:

- swatch remains a valid shared family branch
- pill should not currently be treated as a required long-term family branch
- the current entry debug pills are now better treated as
  `button.compact`
- if ordinary `small` button geometry proves too loose, add a separate
  `compact button` path rather than preserving `pill` as a required family by
  default

Scale rule:

- swatch / pill controls may participate in the `default` and `small` control
  scales where relevant
- their geometry may remain more rounded than standard rectangular controls,
  but they should still align with the broader spacing, text, and vertical
  rhythm language

Current exclusions:

- cursor/presence controls
- tiny non-interactive accent dots
- object-specific board controls that only happen to be circular

Current note:

- entry and participant color controls already provide strong evidence for a
  shared swatch family
- entry debug pills provide the clearest current text-pill pattern
- cursor/presence controls should continue to remain outside this family unless
  a later pass proves a stronger shared language than currently exists

#### Current draft numeric ranges

Each semantic layer currently gets a reserved numeric range of 100 values:

- `layer.board` = `0–99`
- `layer.ui` = `100–199`
- `layer.overlay` = `200–299`
- `layer.top` = `300–399`

Working rule:

- these ranges exist to provide internal headroom inside each semantic layer
- the design system should avoid chaotic high magic numbers such as `9999`
- negative `z-index` values should not be part of the canonical layering model
- if a layer ever genuinely runs out of internal depth, that should be treated
  as an explicit model decision rather than solved ad hoc

## 3. Theme / scheme support

Theme / scheme switching is part of the canonical foundations model from the
start.

### 3.1. First supported scheme behavior

The first required behavior is:

- support for system light / dark preference

That means the design system should not be modeled as a single fixed palette.

Instead, the foundations should be able to resolve through at least:

- `light`
- `dark`

with initial default behavior:

- follow the operating-system / browser color-scheme preference

### 3.2. Later extension path

The model should also leave room for a later extension where a room can affect
or choose its own visual scheme.

This later path may include:

- room-level scheme choice
- room-level visual tuning
- room-level thematic appearance

This is not an immediate rollout requirement, but it should be treated as a
real future design constraint now.

### 3.3. Foundation-layer implication

Foundations should therefore be modeled so that:

- primitive color tokens can exist per scheme
- semantic foundation tokens resolve through the active scheme
- component tokens should consume semantic tokens rather than hard-coding one
  fixed palette

### 3.4. Current working rule

The working rule is:

- the design system should be **scheme-aware from the beginning**
- but the first concrete implementation target is only:
  - system dark / light support

Later room-level visual customization should extend this model rather than
replace it.

### 3.5. Primitive-to-semantic resolution rule

The current draft rule is:

- the semantic layer should stay structurally stable
- visual scheme changes should happen primarily by swapping the primitive token
  sets that feed it

In other words:

- semantic tokens describe roles
- primitive tokens provide the raw values for the active scheme

So the preferred model is:

- fixed semantic foundation layer
- scheme-specific primitive sets

rather than:

- separate semantic systems per scheme

This rule should guide later token naming and theme implementation decisions.

## 4. Dependency and migration map

The canonical model now has a separate dependency and migration companion:

- [docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/MIGRATION_MAP.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/MIGRATION_MAP.md)

Working rule:

- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/02_CANON/CANONICAL.md` should define what the system is
- the migration map should define what migrates first, what stays excluded, and
  how runtime families map onto the canonical model

Important scope rule:

- the ordinary interface migration should stay separate from:
  - board-object shells
  - board-object controls
  - interaction-layer chrome
  - object-adjacent floating controls
  - note editing overlays
  - cursor / presence controls

Those areas may later consume shared tokens, but they are not part of the
ordinary interface migration baseline.

Sequencing note:

- the canonical model may already define some board/object-related tokens or
  families where that improved the model
- this does not mean those areas belong in the first rollout wave
- board/object design-system rollout should be treated as a later deliberate
  pass after the ordinary interface migration baseline is in place
