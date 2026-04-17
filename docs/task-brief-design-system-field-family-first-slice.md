# Task Brief: Design System Field Family First Slice

## Task

Implement the first ordinary-interface design-system rollout slice by creating
the minimal runtime substrate under `src/ui/system/` and migrating the first
`field` family consumers onto it.

This pass should:

- create the minimal runtime design-system structure needed for fields;
- implement the first `field` family runtime recipes;
- migrate the ordinary dark-field consumers that already fit that family;
- avoid widening into buttons, callouts, rows, board-object controls, or
  interaction-layer work.

## Goal

After this pass:

- the project has a real runtime design-system substrate for ordinary interface
  work;
- the `field` family exists as a shared runtime family, not as repeated local
  style objects;
- the first field consumers use that shared family path;
- no new local field-style clones are introduced in migrated files.

This is the first proof that the design-system model can land in runtime code
without creating another wave of local helpers.

## Constraints

Must not change:

- room entry semantics
- join flow behavior
- ops unlock behavior
- board/object interaction behavior
- `BoardStage` interaction logic
- note editing behavior
- participant inline rename behavior

Out of scope:

- button family
- callout family
- row family
- swatch / pill family
- selection controls beyond any existing field-adjacent needs
- board-object controls
- interaction-layer chrome
- cursor / presence controls
- media/dice subsystem shells
- broad CSS rewrite

Additional constraints:

- do not introduce a big future-facing styling framework
- do not preload the entire canonical design-system draft into code
- do not do raw primitive replacement directly inside product files
- do not create one-off local field helpers in consumer files once the shared
  family exists

## Relevant context

The design-system chapter has already established:

- primitive token draft
- semantic foundation layer
- semantic UI typography layer
- control scale layer
- ordinary control-state model
- ordinary interface migration map
- runtime substrate plan
- first family runtime shape for `field`

The agreed runtime direction is:

- `src/ui/system/` as the ordinary interface runtime substrate
- CSS variables for the primitive runtime layer
- TypeScript modules for semantic and family recipes
- family-level consumption in product files

The first rollout slice was intentionally chosen as `field` because it is the
cleanest high-confidence family:

- entry room input
- entry player input
- ops unlock field
- optionally entry debug select if it fits cleanly as the small field subtype

Canonical field-family expectations are recorded in:

- [design-system-runtime-substrate-plan.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/design-system-runtime-substrate-plan.md)
- [design-system-migration-map.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/design-system-migration-map.md)
- [execplan-design-system-ordinary-interface-migration.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/execplan-design-system-ordinary-interface-migration.md)

## Files to inspect first

- [docs/design-system-runtime-substrate-plan.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/design-system-runtime-substrate-plan.md)
- [docs/design-system-migration-map.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/design-system-migration-map.md)
- [docs/execplan-design-system-ordinary-interface-migration.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/execplan-design-system-ordinary-interface-migration.md)
- [docs/design-system-canonical.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/design-system-canonical.md)
- [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx)
- [src/ops/RoomsOpsPage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/ops/RoomsOpsPage.tsx)
- [src/index.css](/Users/fedorpodrezov/Developer/play-space-alpha/src/index.css)

## Deliverables

Return:

- Summary
- Files changed
- What changed
- Validation
- Risks / notes
- Suggested next step

Implementation deliverables:

1. Minimal runtime substrate files under `src/ui/system/`
   - only what is needed for the field slice
2. A shared `field` family runtime module
3. Migrated field consumers
   - entry room input
   - entry player input
   - ops unlock field
   - entry debug select only if it cleanly fits the same pass
4. No broad unrelated cleanup

## Required runtime shape

The first-pass runtime substrate should begin with:

- `src/ui/system/tokens.css`
- `src/ui/system/foundations.ts`
- `src/ui/system/typography.ts`
- `src/ui/system/controlScale.ts`
- `src/ui/system/families/field.ts`

You may add `src/ui/system/primitives.ts` only if it clearly helps immediately.

Do not add future family modules such as:

- `button.ts`
- `callout.ts`
- `row.ts`
- `selection.ts`

## Required `field` family shape

The `field` family should expose a structure equivalent to:

- `fieldRecipes.default.shell`
- `fieldRecipes.default.input`
- `fieldRecipes.small.shell`
- `fieldRecipes.small.input`
- `fieldRecipes.small.select`

Rules:

- keep shell and inner input recipes separate
- do not collapse them into one monolithic style object
- do not force product files to rebuild field recipes from tokens

### Shell responsibilities

`shell` should own:

- height
- vertical/horizontal padding
- border radius
- background/surface
- border treatment
- shell-level state treatment

### Input responsibilities

`input` should own:

- font family
- font size
- font weight
- letter spacing
- transparent/native reset behavior
- width behavior

### Semantic links

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

- reuse the small shell
- reuse the small text recipe as closely as possible
- only add the minimum select-specific browser cleanup required

## Required state support

The first-pass `field` family must explicitly support:

- `default`
- `hover`
- `focus`
- `disabled`

Rules:

- use the canonical ordinary interaction-state model
- do not create field-local state names
- `focus` must use an explicit focus ring
- `disabled` must suppress hover/focus behavior

`active` does not need to become a distinct first-pass field state unless the
implementation finds a strong reason and keeps the scope narrow.

## Consumers to migrate

Required:

- entry room input in `src/App.tsx`
- entry player input in `src/App.tsx`
- ops unlock field in `src/ops/RoomsOpsPage.tsx`

Optional only if clean in the same pass:

- entry debug select in `src/App.tsx`

Explicit non-consumers:

- participant inline rename input
- note editing textarea overlay
- hidden file input

## Validation

Required:

- `npm run build`

Manual QA:

- room input still behaves the same
- player input still behaves the same
- join flow still works
- ops unlock field still works
- if the debug select is included, it still works correctly
- focus treatment is visible and not broken
- disabled field behavior remains readable and non-interactive

## Stop conditions

Stop and report instead of widening the pass if:

- the work starts requiring meaningful `BoardStage` reorganization
- the field family starts absorbing textarea or inline-edit exceptions
- select needs a much deeper custom control model than the thin subtype rule
  allows
- the pass starts pulling in buttons, callouts, or rows
- product files still need to rebuild local field shell recipes after the
  shared family exists
- the runtime substrate starts expanding into a broad all-families framework
  before the field slice proves itself
