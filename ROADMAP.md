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
- unified room entry / leave-room lifecycle;
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
- hosted alpha environment уже включает working core stack и working optional video layer;
- production-hardening отсутствует и не нужен прямо сейчас;
- room lifecycle уже отделяет draft room selection от active participation, но broader room UX ещё intentionally rough;
- `BoardStage` всё ещё остаётся тяжёлым integration surface;
- durable room memory остаётся best-effort, а не final collaborative durable platform.

### Что важно держать в голове

- проект остаётся **board-first shared play space**, а не heavy VTT;
- не делать broad rewrite `BoardStage.tsx`;
- не ломать manual empty-space panning;
- image interaction — чувствительная зона;
- не подменять реальные product/deployment цели бесконечной локальной polish-спиралью.

## 4. Текущий активный этап

## Phase B — First hosted checkpoint and hosted validation follow-up

**Статус:** active

### Цель
Зафиксировать, что hosted core и hosted video уже работают, сохранить узкий practical scope и перейти к real hosted validation без premature cleanup wave.

### Основная последовательность
1. narrow stabilization для реальных hosted рисков;
2. first hosted core deploy;
3. базовая hosted validation core flow;
4. narrow hosted video enablement;
5. затем дальнейшая hosted playable-session validation и только потом более длинный UI/UX polish cycle.

### Почему это теперь главный фокус
Core hosted signal уже получен.
Следующая наибольшая ценность — не новый capability spike и не broad cleanup, а аккуратно расширить hosted stack ровно на один следующий слой.

## 5. Что входит в текущий этап

- удержание core hosted stack в честном рабочем состоянии;
- удержание working hosted video path как optional layer без лишнего scope creep;
- narrow follow-up based on confirmed hosted checkpoint;
- продолжение hosted playable-session validation уже после этого;
- сбор product signal из реальной hosted-сессии без premature infra overbuild.

## 6. Что сознательно не является главным фокусом сейчас

- broad architecture cleanup ради красоты;
- новый большой capability spike;
- большой media/dice polish chapter;
- music / ambient audio implementation;
- heavy production infrastructure;
- scenes / permissions / history system.

## 7. Активный фокус

На текущий момент основной рабочий порядок такой:

1. удерживать successful first hosted core checkpoint как current baseline;
2. удерживать successful hosted video checkpoint как optional layer, а не новый broad media chapter;
3. продолжить hosted playable-session validation;
4. зафиксировать реальные rough edges;
5. только потом идти в следующий validation/polish cycle.

## 8. Backlog

## P0 — сейчас

- [x] провести read-only technical audit текущего alpha core
- [x] выделить 3–5 реальных pre-deploy technical risks
- [x] сделать narrow stabilization pass по blockers
- [x] собрать first hosted alpha deployment plan
- [x] определить hosted smoke checklist
- [x] задеплоить first hosted alpha core environment
- [x] подтвердить базовый hosted core flow
- [x] снять hosted video blocker и подтвердить working token path
- [x] сделать narrow hosted video enable pass
- [ ] продолжить hosted validation уже с working optional video layer

## P1 — сразу после первого hosted alpha

- [ ] продолжить playable-session validation в hosted environment
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
- [ ] separate public/internal build split, only if snapshot demos stop being sufficient

## 9. Open questions

- Какие rough edges проявятся только после hosted playable-session checks?
- Какие rough edges проявятся только после hosted use уже с working optional video layer?
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

## 2026-04-08

### Решено
- first hosted alpha core checkpoint достигнут;
- hosted frontend и hosted realtime/API backend подняты и базовый core flow подтверждён;
- video не входит в completed core checkpoint и остаётся следующим отдельным narrow step;
- следующий planned step = hosted video enable pass, а не broad cleanup wave.

### Update
- hosted video enable attempt был начат;
- Vercel token fallback path подтвердился как working hosted solution;
- hosted video now works without changing the hosted core split;
- важный workflow lesson: before live-debugging, confirm the relevant code is committed, pushed, and actually included in the deployed build.

### Update
- app moved from direct in-room room switching to explicit unified entry / leave-room lifecycle;
- room name is now editable before join;
- direct room URL now acts as entry-form prefill, not automatic join by itself;
- in-room `Change` action was replaced by `Leave room`;
- active room participation is now explicitly separated from draft room selection.

### Update
- for the current alpha stage, public demos should be handled as fixed chosen snapshot deploys;
- continue normal work on the main project, then periodically promote one stable checkpoint as the next public demo;
- separate public/internal build split is explicitly deferred for now.

### Update
- current app surface is now considered coherent enough to freeze as the first public demo snapshot;
- the first public demo should be treated as the first chosen snapshot in that same snapshot-based demo rhythm;
- future public demos can roll forward as later chosen checkpoints without introducing a separate build mode yet.

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
