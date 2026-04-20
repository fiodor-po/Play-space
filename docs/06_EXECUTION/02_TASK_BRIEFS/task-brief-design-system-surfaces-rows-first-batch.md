## Task

Implement the first shared `surfaces + rows` migration batch for the ordinary
interface layer.

## Goal

After this pass:

- the project has a real shared runtime `surface` language for the clearest
  ordinary interface shells
- the clearest ordinary interface row cases no longer remain fully local clones
- shared row recipes now sit inside a shared surface language instead of
  continuing as isolated local blocks
- the pass stays within ordinary interface surfaces/rows and does not widen
  into object-adjacent controls, presence, or broad `BoardStage` cleanup

This is still structural migration first, visual tuning later.

## Constraints

Must not change:

- entry/join behavior
- ops behavior
- room/bootstrap/recovery behavior
- participant-panel semantics
- board/object interaction behavior

Out of scope:

- object-adjacent controls
- note editing overlay
- cursor/presence surfaces
- broad BoardStage cleanup
- subsystem-specific redesign beyond what cleanly fits the ordinary surface
  chapter
- broad visual reconciliation

Additional constraints:

- treat `surfaces` and `rows` as one linked migration chunk
- keep the pass focused on ordinary interface shells and rows
- do not force every board-adjacent inspection block into the same pass if it
  starts widening the scope
- do not turn this into a full app-shell redesign

## Relevant context

The ordinary-interface migration chapter now already has structural shared
ownership for:

- fields
- buttons
- selection controls
- swatches
- boxed callouts

The strongest remaining ordinary-interface duplication clusters are now:

- dark elevated panel/surface shells
- selectable/list/data rows inside those shells

Current strongest migration candidates:

### Surfaces

- entry main panel
- entry debug inset panel
- ops main panels
- ops info cards
- participant session panel ordinary surface language

### Rows

- ops room rows
- ops live-slice/info rows

Conditional / later in the same pass only if they fit cleanly:

- board-adjacent governance/inspection rows that are still semantically
  ordinary enough

## Files to inspect first

- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/02_CANON/CANONICAL.md`
- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/MIGRATION_MAP.md`
- `src/App.tsx`
- `src/ops/RoomsOpsPage.tsx`
- `src/board/components/ParticipantSessionPanel.tsx`
- `src/components/BoardStage.tsx`
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

1. A minimal shared runtime `surface` family/language under `src/ui/system/`
2. A minimal shared runtime `row` family under `src/ui/system/families/`
3. Migrated ordinary entry/ops/panel surface cases where they fit cleanly
4. Migrated ops room rows and ops info/data rows
5. No widening into object-adjacent controls or broad `BoardStage` cleanup

## Required family direction

### Surface direction

The shared surface language should cover the clearest ordinary interface
surface roles first, such as:

- main panel surface
- inset panel/subpanel surface
- compact info-card surface

The surface layer should clearly own:

- background
- border
- radius
- shadow where applicable
- internal padding where the surface recipe genuinely owns it

### Row direction

The shared row family should cover at least:

- selectable row
- data / inspection row

The row layer should clearly own:

- spacing
- typography composition
- row border/background when part of the row recipe
- alignment of primary vs supporting text

Working rule:

- rows should not be forced into ordinary button geometry
- surfaces and rows should align through shared spacing/radius/typography
  language
- keep board-adjacent rows out unless they fit cleanly without widening the
  pass

## Required migration scope

Required:

- entry main panel
- entry debug inset panel
- ops main panels
- ops info cards
- ops room rows
- ops live-slice/info rows

Strongly preferred if it fits cleanly:

- participant session panel surface language

Optional only if it still stays narrow:

- governance/inspection rows that are semantically ordinary enough

Do not force in:

- object semantics tooltip / object-adjacent overlays
- note-card shell
- token shell
- cursor/presence shells
- note editing overlay

## Validation

Required:

- `npm run build`

Manual QA if practical:

- entry panel still behaves the same
- ops page still behaves the same
- room rows still select/open correctly
- ops info/data rows still render correctly
- participant session panel still behaves the same if it is included

If manual QA is not actually run, say so explicitly.

## Stop conditions

Stop and report instead of widening if:

- surface migration starts requiring broad app-shell redesign
- row migration starts requiring broader BoardStage cleanup
- board-adjacent inspection rows pull the pass toward object-surface/system
  cleanup
- subsystem shells start needing redesign rather than clean shared-surface
  reuse
- the pass turns into visual reconciliation rather than structural migration
