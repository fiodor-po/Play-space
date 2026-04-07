# play-space-alpha — roadmap and backlog

## 1. Зачем нужен этот документ

Этот документ — главный живой план проекта.

Он отвечает на четыре вопроса:

- где проект находится сейчас;
- что делаем следующим;
- что сознательно откладываем;
- какие решения уже приняты и не нужно каждый раз переобсуждать.

Это не подробный implementation plan одного рефактора.
Для крупных многошаговых задач используются `PLANS.md` и отдельные ExecPlan-документы.

## 2. Как этот документ соотносится с другими

- `AGENTS.md` — общие рабочие правила для Codex / агентов.
- `PLANS.md` — шаблон и требования к ExecPlan.
- `play-space-project-foundation.md` — стабильная продуктовая и архитектурная рамка.
- `play-space-alpha_current-context.md` — handoff и текущий рабочий контекст между чатами.
- `play-space-alpha_case-study-log.md` — накопительный журнал решений, багов, milestones и workflow lessons.
- `docs/refactor-audit.md` и `docs/refactor-plan.md` — historical architecture baseline.
- `ROADMAP.md` — живая карта этапов, приоритетов, backlog и open questions.

## 3. Текущий снимок состояния

### Что уже собрано достаточно убедительно

- shared room presence / cursors;
- room switching;
- shared tokens;
- shared images;
- shared text-cards;
- explicit image draw mode с `Draw / Save / Clear`;
- awareness-based per-image lock во время drawing mode;
- durable room snapshot layer как best-effort room recovery base;
- canonical zero state и separation of board content vs viewport semantics;
- coherent participant/color semantics;
- narrow LiveKit integration как technical validation;
- authoritative shared 3D dice как accepted alpha-core layer;
- repeatable local dev workflows (`dev:local`, `dev:lan`);
- foundation / current-context / case-study documentation workflow.

### Что остаётся незавершённым или intentionally rough

- media dock UX остаётся spike-level;
- dice tray / residual dice polish остаются слегка rough;
- hosted alpha environment ещё не собран;
- production-hardening отсутствует и не нужен прямо сейчас;
- `BoardStage` всё ещё остаётся тяжёлым integration surface;
- durable room memory остаётся best-effort, а не final collaborative durable platform.

### Что важно держать в голове

- проект остаётся **board-first shared play space**, а не heavy VTT;
- не делать broad rewrite `BoardStage.tsx`;
- не ломать manual empty-space panning;
- image interaction — чувствительная зона;
- не подменять реальные product/deployment цели бесконечной локальной polish-спиралью.

## 4. Текущий активный этап

## Phase A — Alpha readiness and first hosted deployment prep

**Статус:** active

### Цель
Подтвердить, что текущий alpha core достаточно здоров для первого hosted alpha, убрать только реальные pre-deploy blockers и выйти на первый hosted environment.

### Основная последовательность
1. read-only technical audit текущего alpha core;
2. narrow stabilization pass по найденным техническим рискам;
3. first hosted alpha deployment;
4. playable-session validation в hosted environment;
5. более длинный UI/UX polish cycle уже после этого.

### Почему это теперь главный фокус
Capability checklist уже в основном собран.
Следующая наибольшая ценность — не новый большой spike и не бесконечный локальный polish, а реальный hosted alpha signal.

## 5. Что входит в текущий этап

- read-only audit архитектуры и code health перед hosted alpha;
- проверка deployment-readiness и local-dev-only assumptions;
- узкая стабилизация только реальных pre-deploy risks;
- планирование cheapest practical hosted-alpha topology;
- smoke-validation после первого hosted deploy;
- сбор product signal из реальной hosted-сессии.

## 6. Что сознательно не является главным фокусом сейчас

- broad architecture cleanup ради красоты;
- новый большой capability spike;
- большой media/dice polish chapter;
- music / ambient audio implementation;
- heavy production infrastructure;
- scenes / permissions / history system.

## 7. Активный фокус

На текущий момент основной рабочий порядок такой:

1. провести pre-deploy technical audit;
2. собрать короткий список narrow stabilization tasks;
3. зафиксировать first hosted alpha deployment plan;
4. задеплоить cheapest practical hosted alpha;
5. только потом идти в длинный polish/coherence цикл.

## 8. Backlog

## P0 — сейчас

- [ ] провести read-only technical audit текущего alpha core
- [ ] выделить 3–5 реальных pre-deploy technical risks
- [ ] сделать narrow stabilization pass по blockers
- [ ] собрать first hosted alpha deployment plan
- [ ] определить hosted smoke checklist
- [ ] задеплоить first hosted alpha environment

## P1 — сразу после первого hosted alpha

- [ ] playable-session validation в hosted environment
- [ ] зафиксировать реальные rough edges после hosted use
- [ ] media dock simplification / stabilization pass
- [ ] dice tray / dice UX cleanup pass
- [ ] board shell coherence pass

## P2 — последующие улучшения

- [ ] постепенное уменьшение ответственности `BoardStage`
- [ ] targeted architecture hygiene slices
- [ ] stronger room lifecycle clarity
- [ ] better observability / support ergonomics
- [ ] hosted deploy hardening only if product validation justifies it

## Parked / later

- [ ] shared music / ambient audio chapter
- [ ] scenes / scene management
- [ ] permissions / roles
- [ ] history / undo across sessions
- [ ] broad type-model redesign
- [ ] deeper board sync adapter work, если оно не становится blocker до hosted alpha

## 9. Open questions

- Какие реальные technical risks вскроет pre-deploy audit?
- Достаточно ли current architecture здорова для hosted alpha после small stabilization pass?
- Какой самый дешёвый practical hosted split лучше первым:
  - frontend on Vercel
  - Node realtime/API on VPS
  - separate LiveKit service if video remains enabled
- Входит ли video в первый hosted alpha by default, или его лучше оставить toggled / optional?
- Какие rough edges проявятся только после hosted playable-session checks?
- Когда именно hosted-alpha feedback оправдает более глубокий polish или infrastructure hardening?

## 10. Decision log

## 2026-04-05

### Решено
- broad rewrite `BoardStage` не делаем;
- архитектурную реорганизацию ведём маленькими фазами;
- image interaction считается чувствительной зоной;
- phased work safer than reformist cleanup.

## 2026-04-06

### Решено
- durable room snapshot persistence стал реальным best-effort layer для room recovery;
- local snapshot больше не считается достаточным source of truth;
- color semantics вынесены в canonical design doc;
- zero state отделён от viewport semantics;
- narrow LiveKit-first spike признан технически жизнеспособным;
- local dev workflows переведены на explicit `dev:local` / `dev:lan`.

## 2026-04-07

### Решено
- authoritative shared 3D dice стали accepted alpha-core layer;
- minimal capability checklist для alpha в основном собран;
- следующий правильный порядок больше не `polish first`, а:
  - technical audit
  - stabilization
  - first hosted alpha
  - hosted validation
  - slower polish afterwards
- first hosted alpha должен мыслиться как split environment:
  - frontend отдельно
  - long-running Node realtime/API отдельно
  - separate LiveKit service if video remains enabled
- old refactor docs остаются полезным historical baseline, но больше не задают главный active direction проекта.

## 11. Правила обновления документа

Обновляй этот документ, когда:

- появился новый крупный вывод по архитектуре, deployment или product direction;
- принято решение что-то отложить или поднять в приоритет;
- закрыт заметный этап;
- изменился порядок следующих шагов;
- hosted-alpha findings изменили backlog.

Принцип обновления:

- не превращать документ в длинный дневник;
- хранить здесь только живые этапы, backlog, open questions и решения;
- большие планы держать отдельно в `PLANS.md` / ExecPlan;
- historical detail хранить в case-study log, а не здесь.
