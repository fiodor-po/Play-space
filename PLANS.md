# Execution Plans for play-space-alpha

Use an ExecPlan for any significant refactor or architecture change.

An ExecPlan must be concrete enough that a new engineer could execute it with only the repo and this file.

## Required sections

### 1. Goal
What changes and why.

### 2. In scope
Exact files, modules, and behaviors in scope.

### 3. Out of scope
What will not be changed in this phase.

### 4. Current architecture summary
How the current flow works today.

### 5. Target architecture
What the new boundaries / modules / ownership will be.

### 6. Migration plan
Ordered steps with the smallest safe increments.
Each phase must leave the repo buildable.

### 7. Validation
Commands to run and manual QA to perform.

### 8. Risks
Likely regressions, tricky areas, rollback points.

### 9. Stop conditions
Signals that the change is too broad and must be split.

## Refactor rules
- Phase 1 should prefer extraction / relocation with no behavior change.
- Do not combine architecture reorg with new product behavior unless explicitly asked.
- BoardStage is a sensitive integration surface: prefer leaf extraction, adapters, helpers, and per-object modules over a rewrite.
- Preserve empty-space panning, image interaction, and current shared-object behavior.

## Roadmap integration
- Every significant ExecPlan must say which `ROADMAP.md` phase it supports.
- Every significant ExecPlan should reference the backlog item(s) it advances when applicable.
- If the work resolves an open question, changes priority, or changes the recommended sequence of work, the plan must say whether `ROADMAP.md` also needs an update.
- After a major phase lands, update `ROADMAP.md` backlog/decision log if needed.
