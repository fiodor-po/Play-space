# Task Brief

## Task
Починить state/variant architecture для standard DOM controls так, чтобы
ordinary button-like controls реально подчинялись shared design-system state
layer.

## Goal
Сделать правильный DOM-based state path для standard controls:

- consumer only passes variant and state flags;
- family layer only maps family branches to token branches;
- token layer owns the visual truth for standard states and variants;
- ordinary DOM buttons, toggles, triggers, fields, and swatches visibly react
  to their states through the shared system.

После этого ordinary controls должны работать так, как это принято в крупных
design systems:

- base visual state is shared;
- `hover`, `active`, `focus-visible`, `disabled` are driven by the shared state
  layer;
- semantic/value states such as `selected`, `open`, `loading`, `error`,
  `occupied` are expressed through the same system instead of consumer-local
  styling.

## Constraints
- Scope only standard controls.
- Do not redesign media surfaces, shell/material systems, or board-object
  interaction exceptions.
- Do not open checkbox/radio/tabs rollout.
- Do not open textarea family rollout.
- Do not fix visuals consumer-by-consumer if the issue belongs to standard
  control state architecture.
- Do not introduce a second hidden token registry inside family files.
- Keep `default` as the canonical base state.
- Prefer CSS variable / token-driven state expression for DOM controls.
- Consumers may keep only runtime data inputs or geometry-local values that do
  not belong to standard state semantics.
- Docs do not need updates in this pass.

## Relevant context
- Current chapter: `design-system usage pass`
- Usage audit is complete.
- Consumer cleanup is complete.
- State rollout is complete.
- Token-first cleanup is complete enough to expose the next issue clearly.
- New sandbox route `/dev/design-system` made the bug obvious:
  ordinary DOM button `hover` and `active` do not visually work through the
  shared system.

Current root cause:

- standard button base visuals are still pinned too strongly inside the family
  layer;
- CSS state selectors try to modify the same properties later;
- for ordinary DOM controls, this prevents the shared pointer-state layer from
  behaving as the real visual source of truth.

Meaning:

- state API exists;
- token branches partly exist;
- but the standard DOM control state architecture is not yet functionally
  correct.

Reference expectation from mainstream design systems:

- ordinary controls are DOM controls;
- component code passes semantics and state;
- design-system tokens + CSS/state attributes own the visual result;
- family layer stays a wiring layer, not a competing paint system.

## Files to inspect first
- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/CONTROL_STATE_MATRIX.md`
- `src/ui/system/tokens.css`
- `src/ui/system/families/button.ts`
- `src/ui/system/families/field.ts`
- `src/ui/system/families/swatchPill.ts`
- `src/ui/system/DesignSystemSandboxPage.tsx`

## Deliverables
- working token-driven state architecture for standard DOM controls
- concise executor report with:
  - changed files
  - what visual truth moved into the token/CSS state layer
  - what still remains family-local and why
  - which standard control families are now functionally correct on the sandbox

## Validation
- `npm run lint`
- `npm run build`
- `npm run smoke:e2e`
- manual verification on `/dev/design-system`

Manual verification must confirm:

- ordinary button `hover` works
- ordinary button `active` works
- `focus-visible` still works
- `selected` is visibly distinct from `default`
- `open` is visibly distinct from `default`
- `loading` reads as busy instead of dead/disabled
- field `error` is visible
- swatch `selected` and `occupied` are visible

## Stop conditions
- Stop if the pass starts broadening into media redesign, panel/material
  redesign, or board-object interaction redesign.
- Stop if the pass requires a new family-discovery chapter.
- Stop if the implementation starts repainting individual consumers instead of
  fixing the standard control state architecture.
- Stop if a target state still cannot be expressed without introducing another
  hidden source of visual truth outside the token/state layer.
