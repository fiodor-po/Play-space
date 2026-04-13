## Task

Implement the first `note-card shell` design-system batch by migrating the note
card visual shell onto explicit shared board-object shell ownership.

## Goal

After this pass:

- the note card no longer owns its shell treatment as scattered local Konva
  literals;
- the project has a narrow shared board-object shell path for note cards;
- the pass stays focused on note-card shell ownership and does not widen into
  text editing, resize logic, selection logic, or token/object-adjacent work.

This is an object-shell batch, not an interaction-layer or editing batch.

## Constraints

Must not change:

- note-card creation semantics
- note-card drag/resize behavior
- note-card text editing behavior
- object selection behavior
- remote interaction indication behavior

Out of scope:

- note editing textarea overlay
- token shell
- object-adjacent image controls
- tooltip/info surfaces
- cursor/presence UI
- broad `BoardStage` cleanup

Additional constraints:

- keep the pass narrow
- treat the note card as a board-object shell, not as an ordinary interface
  surface
- preserve current geometry and interaction behavior
- keep text layout constants and editing flow intact

## Relevant context

The board-layer work has already landed:

- board material
- object-semantics tooltip shell
- dice tray shell

The next clean board-object candidate is the note card shell, because its
rendered shell is isolated in `NoteCardRenderer.tsx` and currently still owns:

- shell fill
- shell stroke
- corner radius
- shell shadow

This makes it a safer first object-shell batch than token rendering or
object-adjacent controls.

## Files to inspect first

- `src/board/objects/noteCard/NoteCardRenderer.tsx`
- `src/board/objects/noteCard/createNoteCardObject.ts`
- `src/board/objects/noteCard/sizing.ts`
- `src/ui/system/boardSurfaces.ts`
- `docs/task-brief-design-system-note-card-shell-first-batch.md`

## Deliverables

Return:

- Summary
- Files changed
- What changed
- Validation
- Risks / notes
- Suggested next step

Implementation deliverables:

1. A narrow shared board-object shell recipe/module for note cards
2. Migrated note-card shell ownership
3. No widening into text editing, token shells, or object-adjacent controls

## Required direction

Treat the note card as:

- a board-object shell
- not an ordinary panel
- not an interaction indicator

The shared ownership should cover only what clearly belongs to the note-card
shell:

- fill
- stroke
- corner radius
- shell shadow

Keep local what is still truly runtime-specific or content-specific, such as:

- text layout constants
- editing-vs-non-editing rendering behavior
- remote interaction indicators
- drag/resize/select handlers

## Validation

Required:

- `npm run build`

Manual QA if practical:

- note cards still render the same
- dragging and resizing still work
- double-click editing still works
- remote resize/edit indicators still render correctly
- no board interaction behavior changed

If manual QA is not actually run, say so explicitly.

## Stop conditions

Stop and report instead of widening if:

- note-card shell migration starts requiring note editing redesign
- the pass begins to pull in token shell work
- the pass starts changing selection or remote indication behavior
- the work turns into a broader object-system cleanup instead of narrow shell
  ownership
