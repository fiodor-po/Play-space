## Task

Implement the first `dice tray shell` design-system batch by migrating the dice
tray container/shell layer onto explicit shared board-adjacent surface/layout
ownership.

## Goal

After this pass:

- the dice tray no longer owns its shell as scattered local fixed-position
  styles;
- the project has a narrow shared board-adjacent shell path for the dice tray;
- the pass stays focused on tray shell/layout/surface ownership and does not
  widen back into dice controls, board interaction logic, or broader overlay
  redesign.

This is a board-adjacent shell batch, not a controls batch.

## Constraints

Must not change:

- dice publish behavior
- dice replay behavior
- dice container sizing semantics
- board interaction behavior
- empty-space panning semantics

Out of scope:

- dice button recipes
- dice error callout recipe
- 3D dice renderer configuration
- object-adjacent controls
- note editing overlay
- cursor/presence UI
- remote interaction indicators
- broad overlay-system redesign

Additional constraints:

- keep the pass narrow
- treat the tray as a subsystem shell, not an ordinary interface panel
- preserve current screen placement and interaction behavior
- keep pointer-events behavior coherent

## Relevant context

The current dice tray already has migrated internal controls:

- participant-accent dice buttons
- compact danger callout for local tray errors

What remains local is mostly the shell itself:

- fixed tray placement
- shell layout stack
- tray-local spacing
- tray-local shell/surface treatment that still lives inline in
  `DiceSpikeOverlay.tsx`

This makes the tray shell the next clean board-adjacent migration target.

## Files to inspect first

- `src/dice/DiceSpikeOverlay.tsx`
- `src/ui/system/boardSurfaces.ts`
- `src/ui/system/surfaces.ts`
- `docs/06_EXECUTION/02_TASK_BRIEFS/task-brief-design-system-dice-tray-shell-first-batch.md`
- `docs/00_AGENT_OS/CURRENT_CONTEXT.md`

## Deliverables

Return:

- Summary
- Files changed
- What changed
- Validation
- Risks / notes
- Suggested next step

Implementation deliverables:

1. A narrow shared board-adjacent tray/shell recipe or module
2. Migrated dice tray shell/container ownership
3. Reuse of existing shared controls inside the shell without changing their
   semantics
4. No widening into dice logic, object-adjacent controls, or overlay-platform
   redesign

## Required direction

Treat the dice tray as:

- a board-adjacent subsystem shell
- not an ordinary panel
- not an object-adjacent control family

The shared ownership should cover only what clearly belongs to the shell:

- fixed placement
- shell stack/layout
- shell-local spacing
- shell surface treatment where it fits

Keep local only what is still truly specific to the tray runtime context, such
as:

- container id / 3D renderer mounting
- tray-local shadow if it still does not fit shared shell ownership cleanly
- exact runtime conditions around local error visibility

## Validation

Required:

- `npm run build`

Manual QA if practical:

- dice tray still appears in the same place
- tray buttons still work exactly as before
- tray error still appears correctly
- dice preview still renders correctly
- board interaction behavior remains unchanged

If manual QA is not actually run, say so explicitly.

## Stop conditions

Stop and report instead of widening if:

- tray shell migration starts requiring redesign of the dice runtime itself
- the pass starts reopening button/callout work that is already migrated
- the work starts pulling in broader overlay-system architecture
- the pass turns into visual reconciliation instead of narrow shell ownership
