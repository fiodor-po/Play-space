## Task

Implement the next narrow board-controls residual batch by migrating the
image-attached drawing-management controls onto the shared button/control path
where that fits cleanly.

## Goal

After this pass:

- the remaining board drawing-management controls no longer remain as fully
  local button-like controls;
- the image-attached `Draw` / `Save` / `Clear` / `Clear all` actions use shared
  button/control ownership where that fits cleanly;
- the pass stays focused on board drawing-management controls and does not widen
  into object shells, note editing, or broad object-adjacent redesign.

This is a board controls residual batch, not an object-shell batch.

## Constraints

Must not change:

- image drawing behavior
- image drawing lock behavior
- clear-own vs clear-all semantics
- selection behavior
- object manipulation behavior
- board interaction behavior

Out of scope:

- note-card shell
- token shell
- note editing overlay
- image object shell
- broader object-adjacent control redesign
- cursor/presence work

Additional constraints:

- keep the pass narrow
- judge these controls as board tool/action controls, not as ordinary panel UI
- preserve their attachment, placement, and interaction behavior
- do not redesign their anchoring math

## Relevant context

The ordinary board toolbar is already migrated:

- `Add image`
- `Add note`
- `Reset board`

The remaining board-level action controls that still look like migration
targets are the image-attached drawing-management controls rendered through
`SmallFloatingActionButton`:

- `Draw` / `Save`
- `Clear`
- `Clear all`

These are still local button-like controls even though their semantics already
map cleanly to shared button roles.

## Files to inspect first

- `src/components/BoardStage.tsx`
- `src/components/SmallFloatingActionButton.tsx`
- `src/ui/system/families/button.ts`
- `docs/task-brief-design-system-board-drawing-controls-residual-batch.md`
- `play-space-alpha_current-context.md`

## Deliverables

Return:

- Summary
- Files changed
- What changed
- Validation
- Risks / notes
- Suggested next step

Implementation deliverables:

1. Shared button/control ownership for image-attached drawing-management
   controls where it fits cleanly
2. Migrated `Draw` / `Save` / `Clear` / `Clear all` controls
3. No widening into image-object shell redesign or other object-adjacent
   control families

## Required direction

Treat these controls as:

- board drawing-management actions
- semantically mappable to shared button roles
- still locally placed/anchored in object-adjacent space

Working rule:

- migrate their button ownership if that fits cleanly
- keep local only what is genuinely placement/anchoring-specific
- do not redesign the floating action container geometry unless required by the
  narrow migration

Expected semantic mapping:

- `Draw` = secondary or primary depending on active state
- `Save` = primary active-state case
- `Clear` = danger
- `Clear all` = danger

## Validation

Required:

- `npm run build`

Manual QA if practical:

- selecting an image still shows the correct controls
- `Draw` still enters drawing mode
- `Save` still finishes drawing mode
- `Clear` still clears own strokes only
- `Clear all` still clears all strokes when allowed
- control placement/attachment still behaves the same

If manual QA is not actually run, say so explicitly.

## Stop conditions

Stop and report instead of widening if:

- these controls are too tightly coupled to `SmallFloatingActionButton`
  geometry to migrate narrowly
- the pass starts requiring broader object-adjacent control-family design
- the work starts changing drawing semantics instead of control ownership
- the pass turns into a broad object-control redesign instead of a narrow
  migration
