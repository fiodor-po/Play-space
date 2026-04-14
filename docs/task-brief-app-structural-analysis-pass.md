# Task
Run a read-only structural analysis pass for `src/App.tsx`.

## Goal
After this pass:

- we have a clear map of what `App.tsx` currently owns;
- we understand which current lint findings reflect real structural mixing vs
  harmless local patterns;
- we know the smallest safe next step to improve `App.tsx` without widening
  into `BoardStage.tsx` or product-scope changes.

## Constraints

- do not implement code
- do not broaden into repo-wide cleanup
- do not change room lifecycle semantics during analysis
- do not combine this pass with `BoardStage.tsx` refactor planning unless the
  relationship is directly necessary to explain `App.tsx`

## Relevant context

The repo recently completed a hygiene/documentation stabilization pass and a
repeat health audit.

Current validation truth:

- `npm run typecheck` passes
- `npm run lint` is still red only because of structural findings in:
  - `src/App.tsx`
  - `src/components/BoardStage.tsx`

At this point the highest-signal next target is `src/App.tsx`, because it is a
safer structural hotspot than `BoardStage.tsx` and improving it should make the
validation baseline more trustworthy before the next design-system chapter or a
more fragile board/runtime cleanup pass.

## Files to inspect first

- `ROADMAP.md`
- `AGENTS.md`
- `play-space-alpha_current-context.md`
- `docs/ARCHITECTURE.md`
- `docs/EXECUTOR_QUICKSTART.md`
- `src/App.tsx`
- optionally the current lint output for `src/App.tsx`

## Deliverables

Return:

- Summary
- Current ownership map of `App.tsx`
- Highest-risk mixed concerns
- Which lint findings indicate real structural debt
- Suggested smallest safe implementation pass
- Risks / stop conditions

## Validation

Read-only pass.

If commands are used, keep them to inspection and current-baseline verification
only.

## Stop conditions

Stop and report instead of over-framing if:

- the analysis starts turning into a full app-shell redesign
- the work depends on redefining room lifecycle semantics first
- the next safe step clearly belongs in `BoardStage.tsx` instead of `App.tsx`
