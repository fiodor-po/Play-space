## Task

Run the next active design-system chapter as a read-only `override review +
open questions` pass.

## Goal

After this pass:

- the project has an explicit inventory of the most important local visual
  overrides still sitting on top of shared family recipes;
- those overrides are classified into:
  - acceptable local context
  - cleanup debt
  - unresolved design-system boundary questions
- the current open design-system questions are sharpened enough that the next
  migration step can be chosen deliberately rather than by drift.

This is a read-only design-system maturity chapter, not a new implementation
slice.

## Constraints

Do not implement code.

Do not reopen already-settled family migrations unless a concrete unresolved
boundary is discovered.

Do not widen into broad `BoardStage` cleanup or object-shell redesign.

## Relevant context

The current design-system migration has already structurally landed:

- ordinary-interface chapter
- first safe board-layer continuation

What is still not mature enough to ignore:

- significant local overrides on top of shared families
- unresolved family-boundary questions
- uncertainty about how far the migration should continue before
  object-adjacent controls or interaction-layer standardization becomes the
  better next chapter

Already accepted decisions to respect in this pass:

- participant panel placement and size are acceptable local context, but blur
  should be judged as part of shared material ownership rather than a free
  local override
- media dock shell and participant tiles should first be reviewed against
  standard shared material, with deeper media-specific cleanup deferred
- the fixed add-image trigger should be treated as the same standard
  user-accent button class as the dice buttons, only pinned to the top-right
  board corner
- image-attached drawing-management controls should be treated as likely
  candidates for a future reserved compact / pill-like attached-control style
- participant-name inline edit/display behavior remains an acceptable special
  inline-editing exception for now

This pass exists to make those residual questions explicit.

## Files to inspect first

- `ROADMAP.md`
- `play-space-alpha_current-context.md`
- `docs/design-system-migration-map.md`
- `src/App.tsx`
- `src/board/components/ParticipantSessionPanel.tsx`
- `src/media/LiveKitMediaDock.tsx`
- `src/components/BoardStage.tsx`
- `src/dice/DiceSpikeOverlay.tsx`

## Deliverables

Return:

- Summary
- Override inventory
- Acceptable local-context overrides
- Cleanup-debt overrides
- Open design-system questions
- Suggested next chapter

## Required output structure

### 1. Highest-signal override inventory

Only include overrides that materially affect chapter maturity or boundary
clarity.

### 2. Acceptable local-context overrides

Overrides that should remain local for now.

### 3. Cleanup-debt overrides

Overrides that should likely be cleaned up before calling the migration mature.

### 4. Open design-system questions

Explicit unresolved questions that should guide the next migration choice.

### 5. Suggested next chapter

Choose one:

- continue design-system migration into object-adjacent controls
- move into interaction-layer standardization
- run a dedicated override-cleanup implementation pass first

## Working rule

Be strict and high-signal.

Do not produce a giant laundry list of tiny style differences.

The point is to identify the few overrides and open questions that actually
matter for whether the migration is becoming mature.
