## Task

Finish the next narrow `surface` residual batch by migrating the strongest
remaining ordinary-interface surface cases that still look like shared surface
language candidates.

## Goal

After this pass:

- the shared `surface` language covers the strongest remaining ordinary
  interface dark-panel cases
- media shell/card cases that fit cleanly no longer remain fully local clones
- the governance/dev inset case that is semantically ordinary enough no longer
  remains outside shared surface ownership
- the pass stays narrow and does not widen into subsystem-shell redesign,
  object-adjacent overlays, or broader `BoardStage` cleanup

This is still structural migration first, visual tuning later.

## Constraints

Must not change:

- media behavior
- room/bootstrap/recovery behavior
- governance behavior
- board/object interaction behavior

Out of scope:

- dice tray shell
- object semantics tooltip
- note-card shell
- token shell
- object-adjacent overlays
- cursor/presence surfaces
- broad visual reconciliation

Additional constraints:

- treat this as a surface residual pass only
- do not reopen the row chapter here
- do not widen into subsystem architecture cleanup
- judge candidates by semantics, not just by which file they live in

## Relevant context

The shared surface language already covers:

- entry main panel
- entry debug inset panel
- ops main panels
- ops info cards
- participant session panel shell language

The strongest remaining ordinary-interface surface candidates now appear to be:

- media dock shell
- participant video tile card
- governance/dev inset panel

These are still strong surface-language matches, even if some of them live in
files adjacent to broader subsystem or board-sensitive logic.

## Files to inspect first

- `docs/design-system-canonical.md`
- `docs/design-system-migration-map.md`
- `src/ui/system/surfaces.ts`
- `src/media/LiveKitMediaDock.tsx`
- `src/components/BoardStage.tsx`

## Deliverables

Return:

- Summary
- Files changed
- What changed
- Validation
- Risks / notes
- Suggested next step

Implementation deliverables:

1. Migrate the media dock shell if it fits cleanly
2. Migrate the participant video tile card if it fits cleanly
3. Migrate the governance/dev inset panel if it fits cleanly
4. No widening into dice tray shell, object tooltip, or broader `BoardStage`
   cleanup

## Required direction

Use the shared `surface` language already established under `src/ui/system/`.

Working rule:

- reuse existing surface roles where they fit
- only add a new surface variant if one of these residual cases clearly cannot
  fit the already established panel/inset/info-card roles
- do not create subsystem-specific surface families in this pass

## Required migration scope

Required if they fit cleanly:

- media dock shell
- participant video tile card
- governance/dev inset panel

Do not force in:

- dice tray shell
- object semantics tooltip
- note-card shell
- token shell
- object-adjacent overlays

## Validation

Required:

- `npm run build`

Manual QA if practical:

- media dock still behaves the same
- participant video tiles still render the same
- governance/dev inset still behaves the same
- no visible regressions are introduced in these surfaces

If manual QA is not actually run, say so explicitly.

## Stop conditions

Stop and report instead of widening if:

- media shell/card migration starts requiring subsystem redesign
- governance/dev inset migration starts requiring broader `BoardStage` cleanup
- any of these cases clearly need a different surface family rather than reuse
  of the current shared surface language
- the pass turns into visual reconciliation rather than structural migration
