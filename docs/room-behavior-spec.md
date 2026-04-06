# Room Behavior Spec

Это короткая спецификация текущего room behavior для alpha.

## 1. Новая комната: пустая или seeded?

Для текущего alpha новая комната считается **empty by default**.

- Это соответствует текущему repo state: shared tokens / images / text-cards не seeded автоматически при первом открытии новой комнаты.
- `initialBoard` не должен считаться каноническим room-creation contract.

## 2. Когда применяется initial seed?

В текущем alpha initial seed **не является автоматическим contract для новой shared room**.

- Seeded content допустим как внутренний bootstrap/fallback механизм.
- Явное seeded заполнение комнаты сейчас должно считаться отдельным действием, а не неявным правилом room creation.
- Практически safe baseline сейчас такой: новая shared room не должна неожиданно наполняться seed-объектами сама по себе.

## 3. Что должно происходить после ухода всех участников?

На текущем этапе это **ещё не durable persistence contract**.

- Для alpha допустимо, что room работает как live shared room без гарантированной долговременной памяти.
- Поведение после ухода всех участников пока считается **временно допустимой, но не окончательно зафиксированной зоной**.
- Durable room persistence остаётся deferred.
- До persistence сначала должна быть определена canonical room memory model.

## 4. Что должно происходить на refresh?

Refresh в той же комнате должен:

- сохранять participant session в том же браузере для этой комнаты, если она уже была создана;
- заново подключать клиента к current live room state;
- восстанавливать локальный viewport этой комнаты;
- не создавать новую комнату заново и не менять room contract.

## 5. Что должно происходить на rejoin?

Rejoin должен трактоваться так:

- если live room state ещё существует, пользователь должен снова увидеть текущее состояние комнаты;
- в том же браузере participant session для комнаты может быть переиспользована;
- если durable room memory не определена и не реализована, нельзя обещать полноценное восстановление после полного исчезновения live room state.

## 6. Что сейчас считается intentional / temporary / bug

### Intentional for alpha

- board-first shared room без heavy VTT semantics;
- новая комната по умолчанию пустая;
- explicit image draw mode с `Draw / Save / Clear`;
- awareness-based lock во время drawing mode;
- отсутствие полноценной durable room persistence как допустимое состояние alpha.

### Temporary but acceptable

- отсутствие окончательной room memory model;
- отсутствие гарантий, что состояние комнаты переживёт полный уход всех участников;
- coexistence локального storage fallback и current live shared model;
- использование текущей live-room модели без зафиксированного persisted source of truth.

### Actual bugs

Нужно считать багом, если:

- room switching смешивает состояния разных комнат;
- refresh ломает current live room behavior;
- rejoin в ещё живую комнату не показывает её текущее live state;
- presence/cursors ведут себя некорректно;
- shared tokens / images / text-cards перестают синхронизироваться;
- `Draw / Save / Clear` или awareness lock перестают соответствовать текущему UX;
- ломается manual empty-space panning;
- ломается wheel zoom;
- image interaction regress’ит из-за несвязанных архитектурных изменений.

## 7. Что явно отложено

- durable room persistence implementation;
- окончательный persistence contract;
- shared drawing sync redesign beyond current committed UX;
- broad architectural changes ради решения room memory вопроса.

## 8. Следующий обязательный шаг перед persistence

Перед любым persistence implementation нужно отдельно определить:

- canonical room memory model;
- границу между persisted room state, awareness state, local UI state и local interaction state;
- правила create room / reopen room / empty room lifecycle.
