## Task

Finish the last obvious ordinary-interface residual by cleaning up shared inline
helper/error text usage in the ops screen.

## Goal

After this pass:

- the repeated ops inline muted/helper text no longer remains a purely file-
  local micro-style
- the repeated ops inline error text no longer remains a purely file-local
  micro-style
- the pass stays narrow and does not reopen broader surface/row/callout
  chapters

This is a narrow cleanup pass intended to help close the ordinary-interface
migration chapter.

## Constraints

Must not change:

- ops behavior
- room selection behavior
- room detail behavior
- snapshot deletion behavior

Out of scope:

- broader ops layout refactor
- row family redesign
- panel-shell changes
- broader typography rewrite
- visual reconciliation beyond what is minimally needed for coherent shared
  ownership

Additional constraints:

- keep the pass very narrow
- do not overbuild a new general text system if existing shared text/foundation
  layers already fit
- only touch `preStyle` if it cleanly fits the same cleanup; otherwise leave it
  local

## Relevant context

The residual pass identified the clearest remaining ordinary-interface debt as:

- repeated ops inline muted/helper text
- repeated ops inline error text

These currently still live as file-local micro-style helpers in
`src/ops/RoomsOpsPage.tsx`.

This is the best candidate for one final narrow cleanup batch before pausing the
ordinary-interface migration chapter.

## Files to inspect first

- `docs/task-brief-design-system-ordinary-interface-residual-pass.md`
- `src/ops/RoomsOpsPage.tsx`
- `src/ui/system/typography.ts`
- `src/ui/system/foundations.ts`
- any already-established shared text helper location if one fits cleanly

## Deliverables

Return:

- Summary
- Files changed
- What changed
- Validation
- Risks / notes
- Suggested next step

Implementation deliverables:

1. Shared ownership for repeated ops muted/helper text
2. Shared ownership for repeated ops inline error text
3. Keep `preStyle` local unless it very cleanly fits the same pass
4. No widening beyond this narrow text cleanup

## Required direction

Prefer the narrowest shared solution that fits the existing runtime substrate.

That may be:

- a tiny shared inline-text helper module
- or a narrow addition to an already relevant shared layer

Working rule:

- do not overbuild a large text-status family for this
- do not silently convert boxed callout rules into inline text rules
- keep inline helper/error text clearly separate from boxed callouts

## Validation

Required:

- `npm run build`

Manual QA if practical:

- ops page still behaves the same
- inline muted/helper text still appears where expected
- inline error text still appears where expected

If manual QA is not actually run, say so explicitly.

## Stop conditions

Stop and report instead of widening if:

- the pass starts reopening broader typography chapter decisions
- the pass starts turning into a general inline-status system
- the work begins to pull in panel/row/callout redesign instead of staying on
  this narrow text cleanup
