---
name: board-architecture-audit
description: Use when auditing or planning a refactor for a board/canvas/multiplayer UI repo. Produces a read-only architecture map, compares structure against proven whiteboard patterns, and proposes a phased migration plan.
---

Use this skill for architecture audit and refactor planning in play-space-alpha.

## Workflow

1. Read `ROADMAP.md` before the audit and note the active phase and active focus.
2. Read the repo structure and identify the current architecture boundaries.
3. Align recommendations with the active roadmap phase and active focus.
4. If you identify useful work outside the current focus, label it as backlog/deferred rather than promoting it into the current phase.
5. Inventory board object types and their current code ownership.
6. Inventory UI shell, overlays, floating controls, toolbars, and other non-object UI.
7. Inventory interaction logic: selection, drag, resize, transform, drawing mode, keyboard, pointer handling.
8. Inventory room/session/presence/sync/persistence.
9. Classify each concern as one of:
   - persisted room state
   - shared realtime state
   - local transient UI state
   - local interaction state
   - awareness-only ephemeral state
10. Find files where multiple concern types are mixed.
11. Produce:
   - docs/refactor-audit.md
   - docs/refactor-plan.md

## Reference heuristics

Apply these patterns when evaluating the repo:

### Object model
Each board object type should eventually have its own module boundary.
At minimum, each object type should own:
- type definitions
- selectors / helpers
- render component
- interaction helpers specific to that object
- serialization / sync mapping if needed

### Tools and interactions
Do not bury all interaction logic inside object renderers.
Selection, dragging, transforming, drawing mode, and other cross-object behaviors should move toward dedicated interaction/tool modules.

### UI shell
Toolbar, floating controls, panels, overlays, inspector-like UI, and mode controls should not be the same layer as board objects.
UI should orchestrate board actions, not define board object internals.

### State separation
Prefer an explicit split between:
- board scene/object state
- app/ui state
- local interaction state
- awareness/presence state
- persistence/sync transport state

### Awareness
Awareness is for ephemeral collaboration signals:
- cursor
- name
- color
- lightweight activity / locks
It should not become the persistence layer.

## Rules

- Stay read-only unless explicitly told to implement.
- Do not propose one huge refactor.
- Prefer extractions that preserve behavior.
- Align recommendations with the current roadmap phase unless the prompt explicitly asks for longer-range planning.
- If a recommendation mainly supports later work, mark it as backlog/deferred.
- Preserve empty-space panning and current image interaction behavior.
- Account for existing Yjs room/presence/object slices.
- Do not let “best practices” override product constraints.

## Required contents of docs/refactor-audit.md

- current architecture map
- top coupling hotspots
- what is already in a good direction
- what is risky to change now
- recommended target module boundaries
- recommended folder tree
- explicit note about which `ROADMAP.md` phase / backlog item the recommendation supports

## Required contents of docs/refactor-plan.md

- migration phases
- purpose of each phase
- files likely touched
- validation for each phase
- rollback / stop conditions
- recommended phase 1 only
- explicit note about which `ROADMAP.md` phase / backlog item the recommendation supports
