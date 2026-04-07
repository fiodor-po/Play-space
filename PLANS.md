# Execution Plans for play-space-alpha

Use an ExecPlan for any significant change that is too large for a one-shot implementation prompt.

That includes:

- architecture / refactor work;
- stabilization work with multiple steps;
- feature or integration work that touches several layers;
- deployment-preparation work;
- hosted-alpha rollout planning.

An ExecPlan must be concrete enough that a new engineer could execute it with only the repo and this file.

## Required sections

### 1. Goal
What changes and why.

### 2. Why now
Why this work matters in the current project stage.

### 3. Roadmap link
Which `ROADMAP.md` phase / focus / backlog item this plan supports.

### 4. In scope
Exact files, modules, behaviors, and environments in scope.

### 5. Out of scope
What will not be changed in this phase.

### 6. Current mechanism
How the current flow works today.

### 7. Target mechanism
What the new boundaries / behavior / ownership / runtime shape should be.

### 8. Migration plan
Ordered steps with the smallest safe increments.
Each phase must leave the repo buildable.

### 9. Validation
Commands to run and manual QA to perform.

### 10. Risks
Likely regressions, tricky areas, rollback points.

### 11. Stop conditions
Signals that the change is too broad and must be split.

### 12. Documentation updates
Which docs must be updated if the plan lands:
- `ROADMAP.md`
- `play-space-alpha_current-context.md`
- `play-space-alpha_case-study-log.md`
- any focused design/spec/runbook docs

## Plan-type notes

### Architecture / refactor plans
Must preserve current behavior unless behavior change is explicitly in scope.
Prefer extraction / relocation / adapters over rewrites.

### Stabilization plans
Must focus on the smallest set of blockers or high-risk faults.
Do not smuggle polish or broad cleanup into the same plan.

### Feature / integration plans
Must define:
- the narrow product goal;
- the accepted non-goals;
- integration boundaries;
- whether the feature is part of durable room state or transient runtime state.

### Deployment plans
Must define:
- target topology;
- environment assumptions;
- required services;
- smoke-validation steps;
- what is intentionally *not* production-hardening yet.

## Core refactor rules

- Phase 1 should prefer extraction / relocation with no behavior change.
- Do not combine architecture reorg with new product behavior unless explicitly asked.
- `BoardStage` is a sensitive integration surface: prefer leaf extraction, adapters, helpers, and per-object modules over a rewrite.
- Preserve empty-space panning, image interaction, and current shared-object behavior unless the plan explicitly changes them.

## Roadmap integration

Every significant ExecPlan must:

- say which `ROADMAP.md` phase / focus it supports;
- reference the backlog item(s) it advances when applicable;
- say whether `ROADMAP.md` also needs an update;
- say whether the work should update `play-space-alpha_current-context.md` and/or `play-space-alpha_case-study-log.md`.

## When not to use an ExecPlan

You usually do **not** need an ExecPlan when:

- the desired behavior is already clear;
- the implementation is narrow;
- the risk surface is well understood;
- the task can be expressed in one bounded implementation brief.

If the task starts to require multiple caveats, rollback logic, or staged validation, it probably needs an ExecPlan.
