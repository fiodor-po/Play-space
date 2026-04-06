# Shared Drawing Result Sync

Этот документ описывает целевую модель для shared drawing result sync в текущем alpha.

Это **не** drawing redesign implementation.
Это **не** live collaborative drawing spec.
Это короткая planning/spec boundary для следующего этапа после stabilization и room memory model.

## 1. Зачем нужен этот документ

Нужно зафиксировать:

- что именно считается drawing result;
- что должно синхронизироваться между участниками;
- что должно оставаться временным и локальным во время drawing mode;
- как сохранить текущий UX `Draw / Save / Clear` без преждевременного перехода к сложному live co-editing.

## 2. Базовый принцип

Для текущего направления проекта приоритет такой:

- сначала **committed result sync**;
- потом, если когда-нибудь понадобится, обсуждать более сложный live collaborative drawing.

Это значит:

- draw session не обязана быть fully collaborative in-progress;
- главным shared contract считается результат после `Save`;
- текущее поведение во время рисования может оставаться проще, чем финальная модель совместного редактирования.

## 3. Что считается drawing result

Drawing result — это committed visual result, привязанный к конкретной image.

В текущем alpha practical target такой:

- drawing живёт **как часть image object state**, а не как отдельный глобальный board layer;
- `Clear` очищает drawing только у выбранной image;
- `Save` фиксирует текущий drawing result для этой image как shared committed state.

Это не запрещает когда-нибудь позже пересмотреть модель, но для ближайшего этапа это самый безопасный и согласованный вариант.

## 4. Что синхронизируется

## A. Committed shared result

После `Save` между участниками должен синхронизироваться:

- набор drawing strokes, принадлежащих конкретной image;
- их визуальный результат в составе image state;
- clearing результата после явного `Clear`.

Это и есть основной target sync layer для drawing.

## B. In-progress drawing session

Во время активного drawing mode не обязательно синхронизировать каждый промежуточный штрих как идеальный co-editing stream.

Ближайший безопасный contract:

- один участник получает control через awareness lock;
- его local in-progress drawing может быть временным рабочим состоянием;
- shared committed state обновляется на `Save`.

## C. Awareness signals

Awareness в drawing flow нужна для coordination, а не для memory.

Сейчас и дальше по смыслу awareness отвечает за:

- lock на конкретной image;
- indication того, что image сейчас в draw mode у другого участника.

Awareness не должна:

- становиться drawing persistence;
- становиться каноническим storage для drawing result.

## 5. UX contract, который нужно сохранить

Ближайшая target model не должна ломать текущий UX:

- `Draw` явно включает drawing mode;
- `Save` завершает drawing session и коммитит result;
- `Clear` явно удаляет drawing result для текущей image;
- lock остаётся per-image и awareness-based;
- image interaction вне drawing mode не должна менять семантику.

## 6. Что считается in scope для будущего drawing sync этапа

- уточнить точный shape drawing data внутри image state;
- уточнить, какая часть drawing state локальная до commit;
- зафиксировать committed-result contract;
- сохранить совместимость с current draw UX;
- не ломать image drag / resize / preview behavior.

## 7. Что считается out of scope

Для ближайшего этапа вне scope:

- live collaborative co-editing одной image двумя участниками одновременно;
- общий drawing layer, независимый от image object;
- history/undo across sessions;
- durable persistence drawing result как отдельный проектный слой;
- большой image interaction rewrite.

## 8. Риски

Главные риски здесь:

- случайно смешать drawing sync redesign с image interaction cleanup;
- превратить awareness в persistence-механизм;
- начать проектировать live co-editing раньше, чем это реально нужно;
- задеть resize / drag / preview flows, которые уже являются чувствительной зоной.

## 9. Рекомендуемая последовательность после этого документа

1. использовать этот документ как target contract для planning;
2. при необходимости сделать отдельный ExecPlan только для small shared drawing sync step;
3. держать durable persistence отдельно;
4. не совмещать drawing sync work с broad `BoardStage` cleanup.
