# Task Brief: Design System Dice Button Subtype Slice

## Task

Implement the next narrow ordinary-interface button slice by migrating dice tray
buttons onto the shared ordinary button family as a participant-accent subtype.

## Goal

After this pass:

- dice tray buttons no longer use local button clones;
- they use the shared ordinary button family path;
- dice-specific participant coloring is expressed as a subtype layer rather than
  a separate family;
- the slice remains narrow and does not widen into media buttons, subsystem
  shells, or broader visual tuning.

## Constraints

Must not change:

- dice tray behavior
- dice publish behavior
- dice tray shell behavior
- board/object interaction behavior

Out of scope:

- media button migration
- button visual reconciliation pass
- dice tray shell migration
- callouts, rows, swatches, or pills
- floating controls

Additional constraints:

- structural migration first, visual tuning later
- dice buttons should be treated as shared `secondary` button subtypes with
  participant-accent tone override
- do not invent a separate dice-button family

## Relevant context

The ordinary button family already exists in runtime code.

The currently accepted design-system direction is:

- ordinary button family:
  - `primary`
  - `secondary`
  - `danger`
- scale:
  - `default`
  - `small`
- subtype dimensions now include:
  - `participantAccent`
  - `toggle`

Current accepted dice direction:

- dice buttons = shared `secondary` button + participant-accent subtype

Relevant docs:

- `docs/design-system-canonical.md`
- `docs/design-system-migration-map.md`
- `docs/task-brief-design-system-button-family-first-slice.md`

## Files to inspect first

- `docs/design-system-canonical.md`
- `docs/design-system-migration-map.md`
- `src/ui/system/families/button.ts`
- `src/ui/system/tokens.css`
- `src/dice/DiceSpikeOverlay.tsx`

## Deliverables

Return:

- Summary
- Files changed
- What changed
- Validation
- Risks / notes
- Suggested next step

Implementation deliverables:

1. The minimal button-family extension needed for participant-accent subtype use
2. Migrated dice tray buttons
3. No widening into media buttons or shell migration

## Required subtype rule

Dice tray buttons should:

- inherit the shared ordinary `secondary` button recipe structure
- preserve shared geometry and typography
- preserve shared focus and disabled behavior structure
- override only the tone layer through participant accent

Working rule:

- do not create a separate dice-button family
- do not create dice-only geometry

## Validation

Required:

- `npm run build`

Manual QA if practical:

- dice tray buttons still trigger the same dice actions
- disabled/publishing state still behaves correctly
- participant-accent reading is preserved

If manual QA is not actually run, say so explicitly.

## Stop conditions

Stop and report instead of widening if:

- dice buttons need a deeper custom architecture than a participant-accent
  subtype
- the work starts pulling in media buttons
- the work starts migrating the dice tray shell itself
- the pass turns into a visual tuning chapter instead of a structural migration
