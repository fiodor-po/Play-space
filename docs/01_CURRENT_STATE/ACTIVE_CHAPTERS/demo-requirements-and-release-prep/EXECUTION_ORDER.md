# Demo 2 Execution Order

Status: current execution-order brief  
Scope: recommended slice order for Demo 2 on the current architecture

## 1. Decision

Demo 2 идёт в таком порядке:

1. dice concurrency validation;
2. token-creation UX decision;
3. media bubbles default/fallback contract;
4. token-creation implementation;
5. media bubbles implementation;
6. drawing tools implementation;
7. dice UX tightening;
8. demo integration QA and release prep.

## 2. Why this order

Порядок держит три цели:

- сначала закрыть product decisions и risk probes;
- потом собрать demo-critical capabilities на текущей архитектуре;
- потом довести dice feel и пройти integration QA.

## 3. Slice order

### Slice 1 — Dice concurrency validation

Задача:

- проверить simultaneous multi-player rolls на current dice layer.

Нужный результат:

- понять, держит ли current layer читаемость и доверие к visible outcome;
- зафиксировать acceptance verdict для concurrent public rolls;
- вернуть список exact problems, если baseline не проходит.

Почему первым:

- это самый явный dice risk;
- без этого нельзя честно идти в `D&D Beyond`-like dice polish.

### Slice 2 — Token-creation UX decision

Задача:

- выбрать `dock/tray` versus `button` для multi-token creation path.

Нужный результат:

- один выбранный UX path;
- короткое product justification;
- bounded implementation scope без лишнего subsystem growth.

Правило выбора:

- если `dock/tray` быстро даёт ясный creation flow, берём его;
- если `dock/tray` раздувает scope, берём явную кнопку как demo-safe path.

### Slice 3 — Media bubbles default/fallback contract

Задача:

- зафиксировать, как video/audio ведёт себя в demo-default path и fallback path.

Нужный результат:

- agreed media bubbles behavior;
- один понятный fallback state;
- auto-connect rule;
- room-card status/error rule;
- local bubble rearrange rule;
- clear rule, как demo reads when real video is unavailable.

Current target doc:

- `docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/demo-requirements-and-release-prep/MEDIA_BUBBLES_TARGET.md`

### Slice 4 — Token-creation implementation

Задача:

- довести выбранный token-creation path до рабочего demo state.

Нужный результат:

- во время play можно быстро создать больше одного token;
- current single-token baseline больше не ограничивает demo scenario.

### Slice 5 — Media bubbles implementation

Задача:

- реализовать agreed media bubbles default/fallback path.

Нужный результат:

- each room participant has a bubble;
- bubbles show video track or avatar / placeholder;
- participant color frames the bubble;
- local participant bubble is slightly larger;
- media connects automatically on room entry;
- fallback path is clear;
- local bubble rearrange works;
- room card shows media error/status;
- camera/microphone controls live near bubbles.

### Slice 6 — Drawing tools implementation

Задача:

- добавить eraser, partial stroke erase и `Shift` straight lines.

Нужный результат:

- drawing feels like a practical demo tool on top of images;
- current image interaction does not regress.

### Slice 7 — Dice UX tightening

Задача:

- после concurrency verdict довести dice feel ближе к `D&D Beyond`.

Нужный результат:

- tighter tray/control surface;
- stronger public-roll feel;
- no regression in authoritative visible outcome.

### Slice 8 — Demo integration QA and release prep

Задача:

- прогнать end-to-end demo flow и собрать release readiness verdict.

Нужный результат:

- all Demo 2 release gates checked;
- rough edges are classified into:
  - must-fix before release;
  - accepted for demo;
  - post-demo follow-up.

## 4. Stop conditions

- если dice concurrency baseline already fails at the semantics level, не
  начинать dice UX polish до corrective fix;
- если token `dock/tray` начинает выглядеть как отдельный subsystem chapter,
  сразу выбрать button path;
- если media bubbles default path ломает baseline stability, fallback clarity получает
  приоритет над media polish;
- если drawing implementation начинает задевать broad board interaction
  semantics, остановиться и резать slice.

## 5. Working rule

Execution order is canonical until a new planning decision changes it.
