## Task

Implement the first safe board-layer design-system batch by extracting shared
board material / board surface tokens and migrating the current board backdrop
and board-background material onto that shared path.

## Goal

After this pass:

- the board no longer owns its main material/background styling as scattered
  local literals
- the project has an explicit shared board-material layer for the main board
  surface
- the pass stays safely outside object behavior, object-adjacent controls,
  cursor/presence, and broader `BoardStage` refactoring

This is the first deliberate step beyond the ordinary-interface chapter into
the previously excluded board/object-adjacent zone.

## Constraints

Must not change:

- empty-space panning semantics
- board selection semantics
- object interaction behavior
- room/bootstrap/recovery behavior
- board geometry and hit-target behavior

Out of scope:

- object-adjacent image controls
- note-card shell
- token shell
- note editing overlay
- cursor/presence UI
- remote interaction indicators
- dice tray shell
- object semantics tooltip
- broader `BoardStage` cleanup

Additional constraints:

- treat this as a board material/surface tokenization pass, not a board
  interaction pass
- keep geometry and event behavior unchanged
- prefer extraction into a shared board-material layer over broad restyling
- do not mix this with object-shell or overlay-family work

## Relevant context

The ordinary-interface migration chapter is now structurally landed enough to
pause.

The next safe board-adjacent candidate is the board material itself, because it
is:

- not an object-specific shell
- not an object-adjacent control
- not an interaction indicator
- not a subsystem shell
- a broad board-surface concern that can benefit from explicit shared tokens

Current visible/local board material ownership includes:

- the outer board-area backdrop in `BoardStage`
- the main Konva board background rect fill
- the board background corner radius

These should be judged as board-surface/material concerns rather than as object
or interaction concerns.

## Files to inspect first

- `docs/design-system-canonical.md`
- `docs/design-system-migration-map.md`
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

1. A minimal shared board-material layer under `src/ui/system/` or another
   clearly appropriate shared location
2. Shared ownership for the outer board backdrop color
3. Shared ownership for the main board-background rect fill
4. Shared ownership for the board-background corner radius if it cleanly fits
5. No widening into object shells, object controls, or broader `BoardStage`
   cleanup

## Required direction

Treat this batch as explicit board-surface tokenization.

The shared layer should cover concepts such as:

- board backdrop
- board main material/surface
- board surface radius

Working rule:

- keep these as board-layer tokens/recipes, not ordinary interface surfaces
- do not force the board material into the ordinary panel/inset surface chapter
- keep the implementation simple and explicit

## Validation

Required:

- `npm run build`

Manual QA if practical:

- board still renders normally
- empty-space clicking/panning still behaves the same
- board background still visually behaves as one coherent surface

If manual QA is not actually run, say so explicitly.

## Stop conditions

Stop and report instead of widening if:

- tokenizing board material starts requiring broader `BoardStage` architecture
  work
- the pass begins to pull in object shells or object-adjacent controls
- it becomes necessary to redesign board geometry rather than just move shared
  material ownership
- the work turns into a broad visual redesign instead of a narrow board-material
  migration
