# Карта документации

`docs/` теперь разделён по роли документа.

Главная цель структуры:

- отделить current control docs от durable truth;
- отделить product docs от architecture docs;
- отделить agent-operating context от общей проектной документации;
- отделить execution artifacts от canonical docs;
- держать archive отдельно от живого слоя.

## Быстрый вход

Для живого входа в проект сначала открывать:

- [`../README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/README.md)
- [`../AGENTS.md`](/Users/fedorpodrezov/Developer/play-space-alpha/AGENTS.md)
- [`00_AGENT_OS/DOC_SYSTEM_RULES.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/00_AGENT_OS/DOC_SYSTEM_RULES.md)
- [`01_CURRENT_STATE/ROADMAP.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/01_CURRENT_STATE/ROADMAP.md)
- [`00_AGENT_OS/PLANS.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/00_AGENT_OS/PLANS.md)
- [`03_PRODUCT/00_OVERVIEW/PRODUCT_FOUNDATION.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/00_OVERVIEW/PRODUCT_FOUNDATION.md)
- [`00_AGENT_OS/CURRENT_CONTEXT.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/00_AGENT_OS/CURRENT_CONTEXT.md)

Потом открывать только нужный тематический кластер.

## Новая структура

- [`00_AGENT_OS/README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/00_AGENT_OS/README.md) — правила работы агентов, handoff context, doc-system rules
- [`01_CURRENT_STATE/README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/01_CURRENT_STATE/README.md) — roadmap, backlog, follow-ups и active chapters
- [`02_DECISIONS_LOG/README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/02_DECISIONS_LOG/README.md) — долговременная project memory
- [`03_PRODUCT/README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/README.md) — product overview, flows, semantics и interface-system cluster
- [`04_ARCHITECTURE/README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/README.md) — runtime, data/sync и governance architecture docs
- [`05_OPERATIONS_AND_VALIDATION/README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/05_OPERATIONS_AND_VALIDATION/README.md) — local-dev, deploy, QA и validation docs
- [`06_EXECUTION/README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/06_EXECUTION/README.md) — plans, execplans, task briefs и templates
- [`90_ARCHIVE/README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/90_ARCHIVE/README.md) — audits, baselines и closed chapter bundles

## Как пользоваться системой

Сначала определить роль документа:

1. это agent-operating or doc-system rule;
2. это live current-state control doc;
3. это product truth;
4. это architecture truth;
5. это operational runbook or validation doc;
6. это execution artifact;
7. это archive artifact.

Подробные правила зафиксированы в:

- [`00_AGENT_OS/DOC_SYSTEM_RULES.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/00_AGENT_OS/DOC_SYSTEM_RULES.md)
- [`01_CURRENT_STATE/ACTIVE_CHAPTERS/README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/README.md)

## Current canonical docs by role

### Agent / operating context

- [`../AGENTS.md`](/Users/fedorpodrezov/Developer/play-space-alpha/AGENTS.md)
- [`00_AGENT_OS/EXECUTOR_QUICKSTART.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/00_AGENT_OS/EXECUTOR_QUICKSTART.md)
- [`00_AGENT_OS/CURRENT_CONTEXT.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/00_AGENT_OS/CURRENT_CONTEXT.md)
- [`00_AGENT_OS/PLANS.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/00_AGENT_OS/PLANS.md)

### Current state / planning

- [`01_CURRENT_STATE/ROADMAP.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/01_CURRENT_STATE/ROADMAP.md)
- [`01_CURRENT_STATE/PRODUCT_BACKLOG.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/01_CURRENT_STATE/PRODUCT_BACKLOG.md)
- [`01_CURRENT_STATE/REVIEW_FOLLOWUPS.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/01_CURRENT_STATE/REVIEW_FOLLOWUPS.md)
- [`01_CURRENT_STATE/ACTIVE_CHAPTERS/README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/README.md)

### Product / semantics

- [`03_PRODUCT/00_OVERVIEW/PRODUCT_FOUNDATION.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/00_OVERVIEW/PRODUCT_FOUNDATION.md)
- [`03_PRODUCT/01_FLOWS/room-behavior-spec.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/01_FLOWS/room-behavior-spec.md)
- [`03_PRODUCT/01_FLOWS/participant-identity-design.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/01_FLOWS/participant-identity-design.md)
- [`03_PRODUCT/02_SEMANTICS/color-model-design.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/02_SEMANTICS/color-model-design.md)
- [`03_PRODUCT/02_SEMANTICS/object-semantics-design.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/02_SEMANTICS/object-semantics-design.md)
- [`03_PRODUCT/02_SEMANTICS/indication-design.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/02_SEMANTICS/indication-design.md)
- [`03_PRODUCT/03_INTERFACE_SYSTEM/README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/03_INTERFACE_SYSTEM/README.md)

### Architecture / system understanding

- [`04_ARCHITECTURE/00_OVERVIEW/ARCHITECTURE.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/00_OVERVIEW/ARCHITECTURE.md)
- [`04_ARCHITECTURE/00_OVERVIEW/architecture-layer-map.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/00_OVERVIEW/architecture-layer-map.md)
- [`04_ARCHITECTURE/00_OVERVIEW/architecture-summary.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/00_OVERVIEW/architecture-summary.md)
- [`04_ARCHITECTURE/02_DATA_AND_SYNC/room-memory-model.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-memory-model.md)
- [`04_ARCHITECTURE/01_RUNTIME/board-runtime-target-architecture.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/01_RUNTIME/board-runtime-target-architecture.md)
- [`04_ARCHITECTURE/01_RUNTIME/board-runtime-staged-roadmap.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/01_RUNTIME/board-runtime-staged-roadmap.md)
- [`04_ARCHITECTURE/02_DATA_AND_SYNC/room-document-persistence-target-memo.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-document-persistence-target-memo.md)
- [`04_ARCHITECTURE/02_DATA_AND_SYNC/room-document-replica-map.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-document-replica-map.md)
- [`04_ARCHITECTURE/02_DATA_AND_SYNC/room-document-replica-track-plan.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-document-replica-track-plan.md)

### Operations / validation

- [`05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/dev-workflows.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/dev-workflows.md)
- [`05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/livekit-local-dev.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/livekit-local-dev.md)
- [`05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/lan-https-trust.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/lan-https-trust.md)
- [`05_OPERATIONS_AND_VALIDATION/02_DEPLOYMENT/hosted-alpha-deployment-plan.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/05_OPERATIONS_AND_VALIDATION/02_DEPLOYMENT/hosted-alpha-deployment-plan.md)
- [`05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/playwright-smoke-harness.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/playwright-smoke-harness.md)
- [`05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/manual-qa-runbook.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/manual-qa-runbook.md)
- [`05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/stabilization-checklist.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/stabilization-checklist.md)

### Execution artifacts

- [`06_EXECUTION/03_TEMPLATES/task-brief-template.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/06_EXECUTION/03_TEMPLATES/task-brief-template.md)
- [`06_EXECUTION/03_TEMPLATES/executor-report-template.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/06_EXECUTION/03_TEMPLATES/executor-report-template.md)
- [`06_EXECUTION/02_TASK_BRIEFS/task-brief-indexeddb-local-replica-phase-1.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/06_EXECUTION/02_TASK_BRIEFS/task-brief-indexeddb-local-replica-phase-1.md)

### Historical baseline / long-running memory

- [`90_ARCHIVE/02_HISTORICAL_BASELINE/refactor-audit.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/90_ARCHIVE/02_HISTORICAL_BASELINE/refactor-audit.md)
- [`90_ARCHIVE/02_HISTORICAL_BASELINE/refactor-plan.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/90_ARCHIVE/02_HISTORICAL_BASELINE/refactor-plan.md)
- [`02_DECISIONS_LOG/CASE_STUDY_LOG.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/02_DECISIONS_LOG/CASE_STUDY_LOG.md)
- [`90_ARCHIVE/01_AUDITS/`](</Users/fedorpodrezov/Developer/play-space-alpha/docs/90_ARCHIVE/01_AUDITS>)

## Current active chapters

Current chapter control docs now live only in:

- [`01_CURRENT_STATE/ACTIVE_CHAPTERS/`](</Users/fedorpodrezov/Developer/play-space-alpha/docs/01_CURRENT_STATE/ACTIVE_CHAPTERS>)

Current chapter examples:

- [`01_CURRENT_STATE/ACTIVE_CHAPTERS/room-loading-progress-and-async-state/CHAPTER.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/room-loading-progress-and-async-state/CHAPTER.md)
- [`01_CURRENT_STATE/ACTIVE_CHAPTERS/board-navigation-and-secondary-click/CHAPTER.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/board-navigation-and-secondary-click/CHAPTER.md)

Closed chapter bundles live in:

- [`90_ARCHIVE/03_CLOSED_CHAPTERS/`](</Users/fedorpodrezov/Developer/play-space-alpha/docs/90_ARCHIVE/03_CLOSED_CHAPTERS>)
