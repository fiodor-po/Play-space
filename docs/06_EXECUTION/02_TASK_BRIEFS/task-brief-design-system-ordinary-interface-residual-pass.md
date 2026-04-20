## Task

Run a read-only residual pass over the ordinary-interface design-system
migration chapter and classify what remains after the current structural
migration work.

## Goal

After this pass:

- we have a clean residual map of what ordinary-interface pieces are still not
  fully settled
- the remaining items are grouped into practical buckets instead of staying as
  vague “later” work
- we can decide whether the ordinary-interface migration chapter is effectively
  ready to pause, or whether one more narrow cleanup batch is still clearly
  worth doing

This is a read-only classification pass, not a new migration implementation
pass.

## Constraints

Do not implement code.

Do not redesign the already-migrated families.

Do not reopen large family debates unless a real unresolved gap is discovered.

Do not widen this into board/object architecture work.

## Relevant context

The structural ordinary-interface migration chapter now already has shared
runtime ownership for:

- fields
- buttons
- selection controls
- swatches
- boxed callouts
- surfaces
- rows

There are still known residuals, but they now mostly look like:

- later cleanup items
- explicit local exceptions
- override-cleanup work
- small chapter-boundary clarifications

The purpose of this pass is to answer:

- what still truly needs migration
- what should stay local intentionally
- what should be treated as later cleanup rather than migration debt
- whether the chapter is close enough to “structurally landed”

## Files to inspect first

- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/02_CANON/CANONICAL.md`
- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/MIGRATION_MAP.md`
- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/01_AUDITS/CONTROL_INVENTORY.md`
- `docs/00_AGENT_OS/CURRENT_CONTEXT.md`
- `src/ui/system/`
- current ordinary-interface consumer files under:
  - `src/App.tsx`
  - `src/ops/RoomsOpsPage.tsx`
  - `src/media/LiveKitMediaDock.tsx`
  - `src/board/components/ParticipantSessionPanel.tsx`
  - `src/components/BoardStage.tsx`
  - `src/dice/DiceSpikeOverlay.tsx`

## Deliverables

Return:

- Summary
- Residual buckets
- Strongest must-migrate-soon items
- Intentional local exceptions
- Required later cleanup items
- Visual-reconciliation items
- Suggested chapter-closing decision

## Required output structure

Classify remaining items into these buckets:

### 1. Must migrate soon

Only include items that are still clearly ordinary-interface migration debt and
would materially improve the chapter if finished now.

### 2. Intentional local exceptions

Items that should remain local for now because they are object-adjacent,
special-case, or otherwise outside the ordinary shared family path.

### 3. Required later cleanup

Items that are structurally acceptable now but still need later cleanup, such
as:

- chapter-boundary cleanup
- helper/module placement cleanup
- override cleanup

### 4. Visual reconciliation items

Items where shared ownership is already landed, but later visual cleanup should
still happen before the design-system chapter is considered truly polished.

## Working rule

Be strict.

Do not inflate the residual list with things that are already “good enough for
this chapter.”

The point is to identify the few remaining things that really matter, not to
create another endless backlog.

## Stop conditions

Stop and report if:

- the pass starts turning into implementation
- the pass starts reopening already-settled family decisions without strong
  evidence
- the pass starts broadening into board/object architecture instead of ordinary
  interface residual classification
