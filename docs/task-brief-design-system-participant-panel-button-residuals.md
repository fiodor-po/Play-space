## Task

Finish the remaining participant-panel button-like migration cases by handling:

- participant-panel text buttons such as `Leave room`
- participant-panel creator-only destructive button such as `Reset board`

This pass should migrate these cases onto shared button-system ownership where
appropriate, while keeping the participant panel itself structurally intact.

## Goal

After this pass:

- `Leave room` no longer remains a file-local transparent button clone
- the creator-only participant-panel `Reset board` no longer remains a fully
  local destructive button clone
- both cases are expressed through the shared button system using the narrowest
  appropriate subtype direction
- the participant panel does not get broadened into a larger shell/layout
  refactor

This is still structural migration first, visual tuning later.

## Constraints

Must not change:

- room leave semantics
- board reset semantics
- participant panel layout
- participant name editing behavior
- color picker behavior
- dev-tools toggle behavior

Out of scope:

- participant-panel swatches
- participant name edit trigger/input beyond what is necessary to keep local
  adjacency coherent
- object-adjacent image controls
- broader overlay-system work
- row/callout/swatch family work
- broad visual reconciliation

Additional constraints:

- keep the pass narrow
- do not rewrite the participant panel shell
- do not silently convert text-button cases into filled ordinary buttons
- prefer subtype/adjoining-family reuse over new family creation

## Relevant context

The main shared ordinary button chapter is already largely migrated:

- ops buttons
- board toolbar buttons
- dice tray buttons
- media buttons
- entry primary CTA
- fixed add-image trigger

The remaining participant-panel button-like cases were intentionally left out
because they do not fit the filled ordinary-button path cleanly.

Current accepted direction:

- participant-panel text buttons such as `Leave room` likely need a
  `text button` subtype or adjacent family decision
- the participant-panel creator-only `Reset board` should be treated as a local
  destructive compact button case unless a narrow shared destructive-small path
  fits cleanly

## Files to inspect first

- `docs/design-system-canonical.md`
- `docs/design-system-migration-map.md`
- `src/board/components/ParticipantSessionPanel.tsx`
- `src/ui/system/families/button.ts`
- `src/ui/system/tokens.css`

## Deliverables

Return:

- Summary
- Files changed
- What changed
- Validation
- Risks / notes
- Suggested next step

Implementation deliverables:

1. The minimal shared button-system extension needed for participant-panel text
   button handling and/or compact destructive reuse
2. Migrated `Leave room`
3. Migrated participant-panel creator-only `Reset board`
4. No widening into participant-panel shell/layout refactor

## Required direction

### 1. `Leave room`

Treat `Leave room` as:

- a text-button case
- not as a filled ordinary primary/secondary/danger button

Working rule:

- preserve its text-action nature
- migrate it onto shared ownership if a narrow text-button subtype or adjacent
  family path fits cleanly
- do not solve this by restyling it into a filled button

### 2. Participant-panel `Reset board`

Treat creator-only `Reset board` as:

- a compact destructive button case in participant-panel context

Working rule:

- prefer reuse of shared destructive button semantics if a narrow compact path
  fits
- keep the panel-local context-specific placement/layout local
- do not broaden this into a general panel-shell redesign

## Validation

Required:

- `npm run build`

Manual QA if practical:

- `Leave room` still returns to entry screen as before
- participant-panel `Reset board` still resets the board for the room creator
- participant panel layout still behaves the same
- no visible interaction regressions were introduced in the panel

If manual QA is not actually run, say so explicitly.

## Stop conditions

Stop and report instead of widening if:

- `Leave room` clearly needs a broader standalone text-action family chapter
  rather than a narrow subtype decision
- participant-panel `Reset board` starts requiring panel-shell redesign
- the pass begins to pull in participant swatches, name editing, or object-
  adjacent controls
- the work turns into visual tuning rather than structural migration
