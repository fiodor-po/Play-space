# Documentation Index

This is the fastest index for the repo's working docs.

## Onboarding

- `../README.md` — top-level project overview, install, startup, validation
- `../AGENTS.md` — repo guardrails and strategist/executor workflow
- `EXECUTOR_QUICKSTART.md` — quick entry path for a fresh implementation thread
- `ARCHITECTURE.md` — concise runtime/system overview

## Architecture / System Understanding

- `ARCHITECTURE.md` — runtime pieces and deployment shape
- `room-behavior-spec.md` — current room lifecycle semantics
- `room-memory-model.md` — state categories and memory boundaries
- `indication-design.md` — canonical behavior indication model
- `color-model-design.md` — participant/color semantics
- `board-object-controls-ui-layer.md` — active chapter control doc for the board-object control layer
- `board-object-interaction-model.md` — high-level model for board-object geometry, interaction space, and viewport behavior
- `board-object-interaction-matrix.md` — working matrix of board-object interactions, local view, and remote-facing view
- `property-lww-sync-experiment-plan.md` — accepted migration track for Figma-like property-level sync
- `design-system-control-state-matrix.md` — current control-family state matrix and current-track rollout scope
- `participant-color-tokenization-draft.md` — current draft model for participant-color tokenization inside the active `UI controls polish` chapter
- `dice-spike-design.md` — accepted dice-layer direction
- `governance-runtime-design.md` and `governance-model-design.md` — governance direction

## Local Development / Operations

- `dev-workflows.md` — canonical local startup guide
- `livekit-local-dev.md` — LiveKit-specific local debugging and expectations
- `lan-https-trust.md` — LAN HTTPS certificate/trust setup
- `hosted-alpha-deployment-plan.md` — current hosted deployment shape and smoke expectations

## Planning / Roadmap / Context

- `../ROADMAP.md` — live project priorities and backlog
- `../PRODUCT-BACKLOG.md` — live product backlog with tags, rough edges, and later tasks
- `../PLANS.md` — ExecPlan rules for larger work
- `../play-space-project-foundation.md` — stable product/architecture frame
- `../play-space-alpha_current-context.md` — current handoff/operational context
- `review-followups-log.md` — concrete review findings and deferred follow-up actions
- `room-document-persistence-target-memo.md` — canonical technical target for the room-document replica migration track
- `room-document-replica-map.md` — canonical human-facing control map for the room-document replica migration track
- `room-document-replica-track-plan.md` — canonical agent-facing execution/control plan for the room-document replica migration track
- `task-brief-template.md` — strategist to executor brief template
- `task-brief-indexeddb-local-replica-phase-1.md` — narrow implementation brief for the current local-replica storage phase
- `executor-report-template.md` — executor return format

## QA / Validation

- `playwright-smoke-harness.md` — local browser smoke harness, commands, current coverage, and accepted runtime allowlist
- `manual-qa-runbook.md` — detailed manual QA scenarios
- `stabilization-checklist.md` — short regression/pre-deploy checklist

## Historical / Narrative Documents

- `refactor-audit.md` — historical architecture baseline
- `refactor-plan.md` — supporting architecture migration companion, not the primary current control doc
- `../play-space-alpha_case-study-log.md` — decisions, milestones, bugs, workflow lessons
- `project-health-audit-2026-04-13.md` — repo health snapshot
- `project-health-audit-2026-04-13-agent-readiness-followup.md` — follow-up findings for onboarding/agent readiness

## Design-System Migration Cluster

Open only when the task is actually in that migration chapter:

- `design-system-working-principles.md`
- `design-system-migration-map.md`
- `design-system-audit-synthesis.md`
- `design-system-canonical.md`
- the related `task-brief-design-system-*.md` files
