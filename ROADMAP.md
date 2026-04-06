# play-space-alpha — roadmap and backlog

## 1. Зачем нужен этот документ

Этот документ — главный управляющий план разработки проекта.

Он отвечает на 4 вопроса:
- где проект находится сейчас;
- что делаем следующим;
- что сознательно откладываем;
- какие решения уже приняты и не нужно каждый раз обсуждать заново.

Это **не** документ для детального исполнения одного большого рефактора.
Для этого остаются `PLANS.md` и отдельные ExecPlan-документы.

## 2. Как этот документ соотносится с другими

- `AGENTS.md` — правила для Codex/агентов и рабочие ограничения по репозиторию.
- `PLANS.md` — шаблон для больших execution plan / refactor plan.
- `docs/refactor-audit.md` — архитектурный аудит текущего состояния.
- `docs/refactor-plan.md` — поэтапный план архитектурной реорганизации.
- `ROADMAP.md` — единый живой документ про этапы разработки, приоритеты, backlog, открытые вопросы и принятые решения.

## 3. Текущий снимок состояния

### Что уже реально работает
- shared room presence / cursors;
- room switching;
- shared tokens;
- shared images;
- shared text-cards;
- explicit image draw mode с `Draw / Save / Clear`;
- awareness-based per-image lock во время drawing mode.
- safe Phase 1A / 1B extraction вокруг `BoardStage` уже materially сделаны:
  - board constants / viewport helpers;
  - leaf UI components;
  - token/text-card footholds.

### Что ещё не доведено до отдельного законченного слоя
- image drawing как полноценная shared drawing model;
- durable persistence комнаты;
- единая participant/color system;
- полноценный stabilization pass после серии realtime-миграций;
- постепенное уменьшение ответственности `BoardStage.tsx`.

### Что важно держать в голове
- проект остаётся **board-first shared play space**, а не heavy VTT;
- не делать broad rewrite `BoardStage.tsx`;
- не ломать manual empty-space panning;
- image interaction — чувствительная зона;
- migration и реорганизацию делать slice-by-slice.

## 4. Главные продуктовые и архитектурные ориентиры

1. Доска — главный объект продукта.
2. Все участники могут менять всё.
3. Совместность — часть ядра, а не надстройка.
4. UI должен оставаться лёгким и drag-and-drop-first.
5. Архитектура должна расходиться на:
   - app/ui shell;
   - board domain;
   - board objects by type;
   - interactions/tools;
   - sync/presence/persistence.

## 5. Этапы разработки

## Phase 1 — Stabilization + safe architecture hygiene

**Статус:** active

### Цель
Стабилизировать уже работающий shared board alpha и сделать самые безопасные архитектурные выносы без изменения поведения.

### Входит
- regression pass по room switching / reconnect / refresh;
- проверка edge cases для presence и shared objects;
- safe Phase 1A / 1B extraction вокруг `BoardStage`;
- документирование проблемных interaction flows;
- фиксация expected behavior для пустой комнаты и повторного входа.

### Не входит
- broad rewrite board architecture;
- большой type-model rewrite;
- room persistence implementation;
- live collaborative text typing;
- heavy drawing rework.

### Критерий завершения
- текущие shared slices стабильны;
- `BoardStage` стал немного более coordinator-like без регрессий;
- чувствительные interaction flows описаны и проверяются по чеклисту.

## Phase 2 — Define canonical room state

**Статус:** planned

### Цель
Зафиксировать, что именно считается памятью комнаты, а что не считается.

### Нужно определить
- что входит в persisted room state;
- что живёт только в awareness;
- что остаётся локальным client state;
- когда применяется initial seed;
- что происходит, если из комнаты вышли все участники;
- какая модель канонического room document нужна проекту.

### Ожидаемый результат
Появляется короткая спецификация room memory model.
Без неё не делать полноценную persistence-реализацию.

## Phase 3 — Shared drawing result sync

**Статус:** planned

### Цель
Довести image drawing до осмысленной shared-модели без попытки сразу делать сложное live collaborative drawing.

### Базовый приоритет
Сначала нужна надёжная модель **final result sync / committed result sync**, а не идеальный live co-editing.

### Входит
- определить shape drawing data в составе image/board state;
- решить, что синхронизируется во время drawing mode, а что только на commit;
- сохранить совместимость с current draw UX (`Draw / Save / Clear`).

## Phase 4 — Durable room memory

**Статус:** planned / deferred

### Цель
Добавить настоящую память комнаты, которая переживает уход всех участников.

### Входит
- выбор canonical persisted room source of truth;
- стратегия storage/backend для room state;
- восстановление комнаты после rejoin;
- правило первого создания комнаты vs повторного открытия существующей комнаты.

### Важно
До этого этапа допустимо, что проект работает как live shared room без полноценной долговременной памяти.

## Phase 5 — Participant / color system unification

**Статус:** planned

### Цель
Сделать единый понятный слой participant identity и color ownership.

### Нужно довести
- participant model;
- color ownership;
- traces / previews / selection / object creation;
- связи между participant color и визуальными следами действий.

## Phase 6 — Usable v1 polish

**Статус:** later

### Цель
Превратить alpha в версию, на которой уже реально хочется проводить сессию.

### Темы
- UX polish;
- cleaner selection behavior;
- clearer object actions;
- stronger multiplayer stability;
- аккуратная room lifecycle model;
- подготовка к dice/video integration spikes.

## 6. Активный фокус

На текущий момент основной фокус такой:

1. стабилизация уже migrated realtime slices;
2. фиксация expected behavior для room switching / refresh / rejoin / empty room;
3. фиксация room memory model;
4. только после этого — drawing sync и следующий architecture slice;
5. durable room persistence остаётся отдельным отложенным слоем.

## 7. Backlog

## P0 — текущие важные задачи
- [x] закончить safe Phase 1A extraction вокруг `BoardStage`
- [x] закончить safe Phase 1B extraction для token/text-card footholds
- [ ] сделать stabilization checklist и реально прогонять её после заметных изменений
- [ ] зафиксировать expected behavior для empty room / rejoin / refresh
- [ ] определить: пустая доска после ухода всех участников — это временно допустимое поведение или баг по product contract

## P1 — ближайшие архитектурные / платформенные задачи
- [x] описать canonical room state
- [ ] описать разделение: shared state / awareness / local UI state / local interaction state
- [ ] выбрать подход к durable persistence комнаты
- [x] определить target model для shared drawing result sync
- [ ] сузить ответственность `applyBoardObjectsUpdate` через будущий sync adapter layer

## P2 — следующие улучшения
- [ ] unified participant/color system
- [ ] более явная selection system
- [ ] улучшение room/session UX
- [ ] image interaction cleanup после стабилизации
- [ ] type model tightening по объектам

## Parked / later
- [ ] 3D dice integration spike
- [ ] video integration path
- [ ] scenes / scene management
- [ ] permissions / roles, только если shared model окажется слишком хаотичной
- [ ] history / undo across sessions

## 8. Open questions

- Должна ли новая комната создаваться пустой или seeded by default?
- Должна ли empty room сохранять последнее состояние автоматически?
- Должно ли drawing жить как часть image object или как отдельный board object layer?
- Нужен ли потом live collaborative drawing или хватит committed shared drawing?
- Где должна проходить граница между board sync и local persistence?

## 9. Decision log

## 2026-04-05

### Решено
- broad refactor `BoardStage` не делаем;
- архитектурную реорганизацию ведём маленькими фазами;
- image interaction считается чувствительной зоной;
- room persistence можно отложить как отдельный платформенный слой;
- текущая live shared room модель допустима для alpha даже без полноценной durable room memory;
- `ROADMAP.md` становится местом, куда складываются такие решения, backlog и этапы.

### Нужно вернуться позже
- точная room memory model;
- room persistence contract;
- shared drawing sync model;
- unified participant/color system.

## 2026-04-06

### Решено
- safe Phase 1A / 1B extraction больше не считаются главным ближайшим незавершённым направлением;
- следующий практический фокус смещается на stabilization checklist и room behavior spec;
- durable room persistence остаётся deferred;
- room memory model должна быть определена до persistence implementation.
- оформлена рабочая `docs/room-memory-model.md` как planning boundary для current alpha, без запуска persistence implementation.
- оформлен `docs/shared-drawing-result-sync.md` с приоритетом committed result sync поверх live collaborative drawing.

## 10. Правила обновления документа

Обновляй этот документ, когда:
- появился новый крупный вывод по архитектуре;
- принято решение что-то отложить или, наоборот, поднять в приоритет;
- закрыт этап или заметная задача;
- изменился product contract для комнаты, drawing, presence или board objects.

Принцип обновления:
- не превращать документ в длинный дневник;
- хранить здесь только живые этапы, backlog, open questions и решения;
- большие технические планы держать отдельно в `PLANS.md` / ExecPlan;
- после закрытия крупного этапа переносить краткий итог в `Decision log`.
