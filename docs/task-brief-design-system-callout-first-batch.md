## Task

Implement the first shared `callout` migration batch for the ordinary interface
layer.

## Goal

After this pass:

- the project has a real shared runtime `callout` family
- the clearest boxed warning/error callout cases no longer remain fully local
  clones
- the pass stays narrow and does not widen into inline status-text cleanup,
  panel-shell work, or broader row/layout work

This is still structural migration first, visual tuning later.

## Constraints

Must not change:

- entry/join semantics
- media behavior
- dice behavior
- room/bootstrap/recovery behavior

Out of scope:

- inline muted status text
- inline error text
- section-emphasis blocks such as `Room tools`
- panel-shell refactors
- row family work
- broader visual reconciliation

Additional constraints:

- treat this as the boxed `callout` chapter only
- keep inline/helper/status text separate for now
- do not widen this into a general message/notification platform

## Relevant context

The canonical design-system direction already accepted is:

- boxed callout family:
  - `callout.warning`
  - `callout.danger`
- no fixed height
- single-line cases should naturally sit near the `40px` rhythm through text
  recipe and internal padding
- multi-line cases may grow naturally
- outer spacing comes from parent stack rhythm

Current strongest migration candidates:

- entry room-full warning block
- entry join-failure warning/error block
- media error block
- dice error block

## Files to inspect first

- `docs/design-system-canonical.md`
- `docs/design-system-migration-map.md`
- `src/App.tsx`
- `src/media/LiveKitMediaDock.tsx`
- `src/dice/DiceSpikeOverlay.tsx`
- `src/ui/system/`

## Deliverables

Return:

- Summary
- Files changed
- What changed
- Validation
- Risks / notes
- Suggested next step

Implementation deliverables:

1. A minimal shared runtime `callout` family module under `src/ui/system/families/`
2. Migrated entry room-full warning block
3. Migrated entry join-failure block
4. Migrated media error block
5. Migrated dice error block
6. No widening into inline status/helper-text cleanup

## Required family direction

The shared family should cover:

- `warning`
- `danger`

The family should clearly own:

- callout surface
- callout border
- internal padding
- text treatment for boxed callouts

Working rule:

- keep this focused on boxed message surfaces
- do not absorb all status/helper text into the same family
- do not force every local message into a callout if it is semantically just
  inline helper text

## Required migration scope

Required:

- entry room-full warning block
- entry join-failure block
- media error block
- dice error block

Do not force in:

- ops inline auth/detail errors
- muted helper/status text
- local section emphasis

## State / intent direction

This pass should reflect the currently accepted callout intents:

- `warning`
- `danger`

Do not widen this into a broader message taxonomy.

## Validation

Required:

- `npm run build`

Manual QA if practical:

- entry room-full warning still appears at the right time
- entry join-failure message still appears at the right time
- media error block still appears when media setup fails
- dice error block still appears when dice startup fails

If manual QA is not actually run, say so explicitly.

## Stop conditions

Stop and report instead of widening if:

- shared callout ownership starts requiring a broader panel-shell refactor
- inline helper/error text begins to get pulled into the boxed callout family
- media or dice message handling starts requiring subsystem-shell redesign
- the pass turns into visual reconciliation rather than structural migration
