## Task

Implement the first shared `swatch / pill` migration batch for the ordinary
interface layer.

## Goal

After this pass:

- the project has a real shared runtime `swatch / pill` family
- the clearest current swatch cases no longer remain fully local clones
- the clearest current pill cases no longer remain fully local clones
- the pass stays within ordinary interface controls and does not widen into
  presence markers, object-adjacent controls, or broader panel/layout cleanup

This is still structural migration first, visual tuning later.

## Constraints

Must not change:

- room join semantics
- participant color selection semantics
- occupied/pending color behavior
- participant-panel color selection behavior
- debug override behavior

Out of scope:

- presence/cursor dots and labels
- object-adjacent controls
- panel shell refactors
- row family work
- callout family work
- broader visual reconciliation

Additional constraints:

- treat swatches and pills as one chapter with two related branches
- migrate only the cleanest ordinary-interface cases
- do not force non-interactive accent dots into the shared swatch family
- do not widen this into a full color-indication redesign

## Relevant context

The canonical design-system direction already accepted is:

- `swatch` = circular / near-circular color selection controls
- `pill` = compact rounded text controls / compact actions
- presence/cursor UI does not automatically belong there
- tiny accent dots and object-specific circular controls stay excluded unless
  explicitly brought in later

Current strongest migration candidates:

- entry color picker swatches
- participant-panel color trigger and palette swatches
- entry debug action pills

## Files to inspect first

- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/02_CANON/CANONICAL.md`
- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/MIGRATION_MAP.md`
- `src/App.tsx`
- `src/board/components/ParticipantSessionPanel.tsx`
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

1. A minimal shared runtime `swatch / pill` family module under
   `src/ui/system/families/`
2. Migrated entry color-picker swatches
3. Migrated participant-panel color trigger / palette swatches if they fit
   cleanly
4. Migrated entry debug pills
5. No widening into presence markers or object-adjacent controls

## Required family direction

The shared family should cover two related branches:

- `swatch`
- `pill`

The family should clearly own:

- swatch shape/size
- swatch selected-state structure
- pill shape/size
- pill text treatment

Working rule:

- keep participant color semantics and occupied/pending behavior intact
- keep this focused on reusable recipe ownership, not on redesigning color
  semantics
- do not force presence dots or tiny non-control markers into the same family

## Required migration scope

Required:

- entry color picker swatches
- entry debug action pills

Optional only if they fit cleanly in the same pass:

- participant-panel color trigger
- participant-panel palette swatches

Do not force in:

- presence accent dots
- object-adjacent round controls
- unrelated debug indicators

## State direction

Support the states actually needed by the current consumers:

- default
- selected
- occupied where applicable
- pending where applicable
- disabled if already present in the current behavior

Do not widen this into a new general states chapter.

## Validation

Required:

- `npm run build`

Manual QA if practical:

- entry color selection still works
- occupied / pending color states still read correctly
- participant-panel color selection still works if included
- entry debug pills still trigger the same debug actions

If manual QA is not actually run, say so explicitly.

## Stop conditions

Stop and report instead of widening if:

- swatch migration starts requiring a broader color-semantics redesign
- participant-panel swatches start requiring panel-shell refactor
- pills start needing a much broader text-action family decision than this pass
- the work begins to pull in presence markers or object-adjacent controls
- the pass turns into visual reconciliation rather than structural migration
