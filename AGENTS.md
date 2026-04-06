# play-space-alpha — agent guide

## Product frame
- This repo is a board-first shared play space for game / roleplay sessions.
- It is not a heavy VTT.
- The board is the primary interaction surface.
- UX should stay drag-and-drop first and multiplayer-first.

## Current stack
- React
- TypeScript
- Vite
- Konva / react-konva
- Yjs / y-websocket for current realtime slices

## Refactor objective
Reorganize the codebase toward clearer architectural boundaries without destabilizing current working behavior.

The target direction is:
- separate board domain from app UI
- separate board objects by type
- separate interaction / tool logic from object renderers
- separate room/session, sync, presence, persistence
- preserve incremental migration strategy

## Hard constraints
- Do not broad-refactor BoardStage.tsx in one pass.
- Do not break manual empty-space panning.
- Do not regress image drag / resize / draw-mode behavior.
- Do not mix architecture reorg with unrelated product-scope changes.
- Do not turn this repo into a heavy-VTT architecture.
- Prefer extraction and relocation over rewrites.

## Current reality to preserve
- room switching works
- presence / cursors work
- tokens are shared
- images are shared
- text-cards are shared
- current image interaction is sensitive and easy to regress

## Roadmap usage
- Before planning or implementing non-trivial work, read:
  - `ROADMAP.md`
  - `AGENTS.md`
  - `PLANS.md`
  - and any directly relevant architecture/context docs
- Treat `ROADMAP.md` as the live source of truth for:
  - current phase
  - active focus
  - backlog priorities
  - open questions
  - decision log
- Do not use `ROADMAP.md` as a detailed execution plan.
- For major refactors or multi-step changes, still create/use an ExecPlan via `PLANS.md`.
- If a task closes a major backlog item, changes phase priority, or resolves an open question, update `ROADMAP.md` in the same change set when appropriate.
- Keep project summary and context pack documents as reference/context docs, not as the main live backlog.

## Rules for architecture work
When asked to reorganize the project:
1. Start with read-only analysis.
2. Map current module responsibilities and hotspots.
3. Classify state as one of:
   - persisted/shared room state
   - shared realtime state
   - local transient UI state
   - local interaction state
   - awareness-only ephemeral state
4. Identify where these concerns are mixed in the same files.
5. Produce a phased migration plan before editing production code.
6. Implement only one safe phase at a time.

## Required outputs for architecture tasks
- docs/refactor-audit.md
- docs/refactor-plan.md

Each must include:
- current architecture map
- coupling hotspots
- proposed target boundaries
- proposed folder tree
- migration phases
- validation steps
- no-go zones

## ExecPlan rule
For any significant refactor, create an ExecPlan that follows PLANS.md before changing production code.

## Validation
After any implementation phase:
- run npm run build
- explain what behavior might have regressed
- list manual QA steps for the touched flow
