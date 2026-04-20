# Task Brief: Design System Button Family First Slice

## Task

Implement the first ordinary-interface button-family rollout slice on top of the
runtime design-system substrate that now exists under `src/ui/system/`.

This pass should:

- create the first shared ordinary button family runtime module;
- migrate the cleanest ordinary button consumers onto that shared family path;
- preserve the current structural migration-first approach;
- avoid widening into floating controls, object-adjacent controls, callouts,
  rows, or visual tuning work.

## Goal

After this pass:

- the project has a real shared ordinary button family in runtime code;
- the first ordinary button consumers use that shared family path instead of
  file-local button clones;
- the rollout stays within ordinary interface controls and does not pull in
  board-sensitive systems;
- visual tuning is still intentionally deferred.

This is a structural migration slice, not a polished visual acceptance pass.

## Constraints

Must not change:

- room entry semantics
- ops behavior
- media behavior
- dice behavior
- board/object interaction behavior
- `BoardStage` interaction logic

Out of scope:

- floating add-image trigger
- object-adjacent image controls
- transparent text actions in the participant panel
- session-panel destructive micro-action unless it turns out to fit the shared
  family with no extra branching
- callout family
- row family
- swatch / pill family
- subsystem shell migration
- visual tuning pass

Additional constraints:

- structural migration first, visual tuning later
- do not widen the substrate beyond what the button slice actually needs
- do not turn this into a broad button-system architecture exercise
- do not introduce new local button helpers in consumer files once the shared
  family exists

## Relevant context

The runtime design-system substrate and first `field` family groundwork now
exist under `src/ui/system/`.

The migration chapter is currently proceeding in this mode:

- structural migration first
- visual reconciliation later

That means:

- temporary visual shifts are acceptable if usability stays intact
- the purpose of this pass is to move runtime ownership into the shared family
  layer
- the purpose is **not** to finalize button visuals yet

The button-family planning context is already recorded in:

- [docs/03_PRODUCT/03_INTERFACE_SYSTEM/02_CANON/CANONICAL.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/03_INTERFACE_SYSTEM/02_CANON/CANONICAL.md)
- [docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/MIGRATION_MAP.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/MIGRATION_MAP.md)
- [docs/06_EXECUTION/01_EXECPLANS/execplan-design-system-ordinary-interface-migration.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/06_EXECUTION/01_EXECPLANS/execplan-design-system-ordinary-interface-migration.md)
- [docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/RUNTIME_SUBSTRATE_PLAN.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/RUNTIME_SUBSTRATE_PLAN.md)

## Files to inspect first

- [docs/03_PRODUCT/03_INTERFACE_SYSTEM/02_CANON/CANONICAL.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/03_INTERFACE_SYSTEM/02_CANON/CANONICAL.md)
- [docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/MIGRATION_MAP.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/MIGRATION_MAP.md)
- [docs/06_EXECUTION/01_EXECPLANS/execplan-design-system-ordinary-interface-migration.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/06_EXECUTION/01_EXECPLANS/execplan-design-system-ordinary-interface-migration.md)
- [docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/RUNTIME_SUBSTRATE_PLAN.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/RUNTIME_SUBSTRATE_PLAN.md)
- [src/ui/system/](/Users/fedorpodrezov/Developer/play-space-alpha/src/ui/system)
- [src/ops/RoomsOpsPage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/ops/RoomsOpsPage.tsx)
- [src/board/components/BoardToolbar.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/BoardToolbar.tsx)
- [src/media/LiveKitMediaDock.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/media/LiveKitMediaDock.tsx)
- [src/dice/DiceSpikeOverlay.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/dice/DiceSpikeOverlay.tsx)

## Deliverables

Return:

- Summary
- Files changed
- What changed
- Validation
- Risks / notes
- Suggested next step

Implementation deliverables:

1. A shared ordinary button family runtime module under `src/ui/system/families/`
2. The minimal substrate additions needed for that family
3. Migrated first-slice consumers
4. No widening into excluded button-adjacent or board-sensitive controls

## Required family scope

The first ordinary button family should cover only the cleanest shared ordinary
button cases.

Included variants:

- `primary`
- `secondary`
- `danger`

Included scales:

- `default`
- `small`

This pass should target the strongest ordinary action-button cluster, not every
button-like thing in the repo.

## Required family structure

The button family should expose one clearly named shared family export, close in
spirit to:

- `buttonRecipes.primary.default`
- `buttonRecipes.primary.small`
- `buttonRecipes.secondary.default`
- `buttonRecipes.secondary.small`
- `buttonRecipes.danger.default`
- `buttonRecipes.danger.small`

The exact syntax may vary, but the family should stay structurally this close.

Working rule:

- the family should own the ordinary button recipe
- consumer files should not recompose buttons from primitives or semantic tokens
- avoid many disconnected helper functions that make the family harder to apply
  consistently

## Required semantic links

The button family should resolve through the already agreed layers.

Each recipe should resolve through:

- control scale geometry
  - height
  - padding
  - content gap
- ordinary button text via `bodyText`
- semantic foundation roles
  - surface
  - border
  - text
- ordinary interaction-state model
  - `default`
  - `hover`
  - `focus`
  - `active`
  - `disabled`

Working rule:

- button text should continue to map through `bodyText`
- do not introduce a competing button-local typography system

## State requirements

The button family must support:

- `default`
- `hover`
- `focus`
- `active`
- `disabled`

Rules:

- use the ordinary interaction-state layer already agreed in the design-system
  model
- do not invent button-local state vocabulary
- `focus` must stay explicit and visible
- `disabled` must suppress hover/active behavior

## First-slice consumers

Required migration targets:

- ops primary button
- ops secondary buttons
- ops danger button
- board toolbar ordinary buttons

Conditional migration targets only if they fit cleanly with no extra branching:

- media ordinary action buttons
- dice ordinary tray buttons

Explicit non-targets for this slice:

- entry primary CTA
- entry debug pills
- board add-image floating trigger
- object-adjacent image controls
- transparent participant-panel text actions
- session-panel destructive micro-action

## Structural migration mode

This pass is still in structural migration mode.

That means:

- move ownership into the shared family layer
- reduce local file-owned button clones
- accept that visuals may still need later reconciliation

Do not spend the pass on:

- visual polish
- per-surface tuning
- reconciling every spacing nuance immediately

## Validation

Required:

- `npm run build`

Manual QA:

- ops buttons still trigger the same actions
- destructive ops action still reads and behaves as destructive
- toolbar buttons still fire correctly
- focus treatment is visible on migrated ordinary buttons
- disabled button behavior still works where exercised

If media or dice buttons are included:

- media action buttons still preserve their current behavior
- dice buttons still work correctly

## Stop conditions

Stop and report instead of widening if:

- the family starts absorbing floating or object-adjacent controls
- entry CTA starts needing a separate large-primary path in the same pass
- media/dice buttons require divergent button architecture rather than ordinary
  family reuse
- transparent text actions begin to get pulled into the shared family
- the pass starts touching callouts, rows, or swatch/pill migration
- the rollout begins to turn into a visual tuning pass rather than structural
  migration
