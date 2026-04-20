## Task

Implement the first shared `selection controls` migration batch by establishing
shared runtime ownership for the current checkbox-row cases and preparing the
shared family shape for future `radio` and `switch` rows without forcing their
product rollout now.

## Goal

After this pass:

- the current checkbox-row cases no longer remain fully local clones
- the runtime design-system substrate has a real shared `selection controls`
  family
- the family shape is clear enough that later `radio` and `switch` rows can
  join without ad hoc invention
- the pass stays narrow and does not widen into unrelated panel/layout cleanup

This is still structural migration first, visual tuning later.

## Constraints

Must not change:

- checkbox semantics
- dev-tools toggle behavior
- participant-panel layout
- `BoardStage` interaction behavior
- room/bootstrap/recovery behavior

Out of scope:

- introducing new radio controls into product UI
- introducing new switch controls into product UI
- broader panel shell refactors
- row family work
- swatch/pill work
- callout work
- object-adjacent control work
- visual reconciliation beyond what is minimally needed for a coherent
  structural migration

Additional constraints:

- treat `checkbox / radio / switch` as one family
- only checkbox is expected to become an actual migrated consumer in this pass
- do not build a large future-facing form framework
- do not widen this into generic control-row abstraction unless it is clearly
  required by the narrow family implementation

## Relevant context

The canonical design-system direction already accepted is:

- selection controls family includes:
  - checkbox row
  - radio row
  - switch row
- they share the same outer control-height rhythm as ordinary controls
- top label is not part of the standard selection-control pattern
- caption can exist below the control when needed
- internal indicator geometry may differ, but row/block alignment should remain
  systemically consistent

Current project reality:

- the live runtime currently has checkbox-row cases
- the clearest visible checkbox-row case is the `Dev tools` checkbox in
  `ParticipantSessionPanel`
- there are board-related checkbox usages in the repo history/audits, but the
  pass should stay narrow and migrate only the cases that fit cleanly

## Files to inspect first

- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/02_CANON/CANONICAL.md`
- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/MIGRATION_MAP.md`
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

1. The minimal shared runtime `selection controls` family module under
   `src/ui/system/families/`
2. Shared ownership for current checkbox-row usage where it fits cleanly
3. A family shape that already leaves room for `radio` and `switch` rows later
4. No widening into unrelated panel/layout refactors

## Required family direction

The shared family should be structured around row-level ownership first, not
just isolated indicator styling.

The runtime shape should cover the concepts of:

- row
- label text
- indicator

It may expose this as a recipe object or narrow helpers, but the family should
clearly own:

- row alignment
- row gap
- row text treatment
- selection-indicator visual ownership

Working rule:

- do not make `checkbox` a one-off helper if the family can be shaped cleanly
- do not overbuild full `radio` and `switch` implementation if the product does
  not need them yet
- do build the family in a way that prevents later ad hoc radio/switch arrival

## Required migration scope

Required:

- migrate the participant-panel `Dev tools` checkbox row onto the shared family
  path

Optional only if it fits cleanly in the same pass:

- any other current checkbox-row case that already matches the same family
  without dragging in broader board-sensitive refactors

Do not force in:

- speculative radio controls
- speculative switch controls
- board-sensitive layout rewrites

## State direction

This pass should support the ordinary and family-specific states actually needed
for current checkbox usage:

- unchecked
- checked
- disabled if a clean narrow path exists

Do not widen this into a full new states chapter.

## Validation

Required:

- `npm run build`

Manual QA if practical:

- `Dev tools` checkbox still toggles correctly
- checkbox-row alignment still looks coherent in the participant panel
- no visible panel regressions were introduced around that area

If manual QA is not actually run, say so explicitly.

## Stop conditions

Stop and report instead of widening if:

- shared selection-controls ownership starts requiring a broader participant-
  panel layout refactor
- the pass begins to pull in unrelated row-family work
- `radio` / `switch` start forcing speculative implementation rather than a
  clean family shape
- board-sensitive checkbox cases require `BoardStage`-level reorganization
- the work turns into visual reconciliation rather than structural migration
