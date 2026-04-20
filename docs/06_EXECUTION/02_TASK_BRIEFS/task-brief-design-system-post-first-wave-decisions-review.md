## Task

Run a read-only review of the design-system decisions after the first major
migration wave.

## Goal

After this pass:

- we understand what the first migration wave made clear about the design
  system;
- we have an explicit list of missing controls, tokens, subtypes, and chapter
  boundaries that were not obvious before implementation;
- we know which temporary bridges should remain temporary and which should now
  become canonical;
- we can choose the next real design-system chapter from a more informed
  position.

This is a read-only review chapter, not an implementation pass.

## Constraints

Do not implement code.

Do not reopen already accepted migration wins unless the first-wave results
clearly expose a real structural gap.

Do not widen into broad `BoardStage` cleanup or object-shell redesign.

## Relevant context

The first migration wave has already materially landed:

- ordinary-interface chapter
- first safe board-layer continuation
- first override-cleanup pass

That means the most useful next question is no longer just “what still looks
local?”

It is now:

- what did the first migration wave teach us about the design system itself?

This includes questions like:

- which controls or control variants are still missing
- which tokens are still missing
- which temporary runtime bridges should remain temporary
- which new subtypes or chapter boundaries are now clearly required

## Files to inspect first

- `docs/01_CURRENT_STATE/ROADMAP.md`
- `docs/00_AGENT_OS/CURRENT_CONTEXT.md`
- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/MIGRATION_MAP.md`
- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/02_CANON/CANONICAL.md`
- `src/ui/system/`
- `src/App.tsx`
- `src/board/components/ParticipantSessionPanel.tsx`
- `src/media/LiveKitMediaDock.tsx`
- `src/components/BoardStage.tsx`
- `src/dice/DiceSpikeOverlay.tsx`

## Deliverables

Return:

- Summary
- What the first migration wave clarified
- Missing controls / control variants
- Missing tokens / material rules
- Temporary bridges that should stay temporary
- Temporary bridges that now look canonical
- Suggested next chapter

## Required output structure

### 1. What the first migration wave clarified

Only include high-signal lessons that were not obvious before rollout.

### 2. Missing controls / control variants

Examples:

- compact ordinary button
- reserved board-interaction pill-like control class
- text-button adjacent family

### 3. Missing tokens / material rules

Examples:

- shell geometry inside material ownership
- board-adjacent shell material rules
- compact-control geometry rules

### 4. Temporary bridges that should stay temporary

Examples:

- `text button` inside `button.ts`
- canvas tone resolvers
- narrow board-surface helpers that are not yet mature enough to be treated as
  final chapter boundaries

### 5. Temporary bridges that now look canonical

Only include cases where the migration proved the structure is worth keeping.

### 6. Suggested next chapter

Choose one:

- dedicated design-system decisions / canon-alignment implementation pass
- object-adjacent controls chapter
- interaction-layer standardization chapter

## Working rule

Be strict and synthesis-oriented.

Do not just restate already-known migration history.

The point is to extract what the first migration wave taught us about the next
version of the design-system model.
