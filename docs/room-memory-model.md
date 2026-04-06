# Room Memory Model

Этот документ фиксирует рабочую memory model для текущего alpha.

Это **не** durable persistence design и не реализация backend/storage.
Это короткая спецификация того, как сейчас нужно думать о состоянии комнаты и о границах между разными типами state.

## 1. Зачем нужен этот документ

Нужно явно разделить:

- что считается room state;
- что считается только live shared state;
- что считается awareness-only state;
- что остаётся локальным UI state;
- что остаётся локальным interaction state.

Без этого не нужно начинать durable persistence implementation.

## 2. Текущий статус модели

Для текущего alpha canonical durable room memory **ещё не существует**.

Текущая рабочая модель такая:

- у комнаты есть **live shared state**;
- у клиента есть **локальный per-room state**;
- есть **awareness-only signals** для collaboration;
- durable persistence остаётся deferred.

Это сознательно временная модель, но она достаточна для текущей stabilization phase.

## 3. State categories

## A. Shared realtime room state

Это состояние комнаты, которое должно быть общим между активными участниками в live session.

Сейчас сюда относятся:

- shared tokens;
- shared images;
- shared text-cards.

Практический смысл:

- если два клиента одновременно находятся в одной комнате, они должны видеть один и тот же committed room content;
- именно этот слой сейчас ближе всего к source of truth для live room session;
- это ещё не означает durable memory после исчезновения всех участников.

## B. Awareness-only state

Это collaboration signals, которые существуют только как ephemeral layer и не должны трактоваться как память комнаты.

Сейчас сюда относятся:

- participant presence;
- cursors;
- active image drawing lock.

Также сюда по смыслу относятся любые краткоживущие collaboration hints, которые нужны только пока участники активны.

Правило:

- awareness не становится persistence layer;
- awareness не считается room memory;
- исчезновение awareness state после disconnect — нормальное поведение.

## C. Shared transient sync state

Это состояние, которое может синхронизироваться между клиентами, но не должно считаться канонической долговременной памятью комнаты.

Сейчас сюда относятся:

- remote image drag / transform preview bounds.

Правило:

- такие данные могут жить рядом с realtime transport;
- но их нельзя считать частью долговременного room content;
- при room switch они должны очищаться как transient state.

## D. Local UI state

Это клиентское состояние, которое не является room content.

Сейчас сюда относятся:

- viewport текущей комнаты;
- draft values в UI;
- selection-related overlays;
- textarea positioning;
- локальные panel open/edit states;
- cached loaded images в клиенте.

Правило:

- local UI state может сохраняться локально per-room, если это не меняет product contract комнаты;
- local UI state не должен трактоваться как shared room memory.

## E. Local interaction state

Это локальное состояние текущего действия пользователя.

Сейчас сюда относятся:

- selected object id;
- drawing mode для текущего клиента;
- active stroke buffer;
- dragging / transforming flags;
- pan state;
- text-card editing state.

Правило:

- это состояние нужно для interaction flow;
- оно не считается room memory;
- оно должно сбрасываться при room switch и других boundary transitions, где это уместно.

## F. Seed / bootstrap state

`initialBoard` считается bootstrap/fallback data, а не канонической room memory model.

Правило:

- новая shared room по текущему contract считается empty by default;
- initial seed не должен автоматически определять содержимое новой комнаты;
- seeded content допустим как отдельное явное действие или внутренний fallback-механизм, но не как основное правило room creation.

## 4. Что сейчас ближе всего к source of truth

Для текущего alpha source of truth нужно понимать так:

- для **живой активной комнаты** source of truth — current live shared room state;
- для **awareness signals** source of truth — текущий ephemeral awareness layer;
- для **локального UX** source of truth — local per-room client state;
- для **долговременной памяти комнаты** source of truth пока не определён.

Это важное ограничение:

- current live room source of truth не равен durable room memory;
- durable room memory сначала нужно отдельно спроектировать.

## 5. Room lifecycle rules в текущей модели

## New room

- новая комната по product contract считается empty by default;
- shared objects не должны автоматически seed’иться только потому, что комната новая.

## Refresh

- refresh в той же комнате должен:
  - сохранять participant session в том же браузере для этой комнаты;
  - восстанавливать локальный viewport этой комнаты;
  - переподключать клиента к current live room state.

## Rejoin

- если live room state ещё существует, rejoin должен вернуть пользователя в текущее live state комнаты;
- если live room state уже исчез, durable recovery пока не гарантируется.

## After all participants leave

- это пока не durable persistence contract;
- текущее alpha-поведение допустимо как live-room model без гарантированной долговременной памяти.

## 6. Что не нужно делать на основе этой модели

Эта спецификация **не означает**, что уже пора:

- реализовывать durable persistence;
- фиксировать backend choice;
- вводить canonical persisted room document в код;
- redesign’ить drawing model;
- делать broad refactor ради “правильной архитектуры”.

## 7. Что из этого следует для следующих шагов

Сначала:

1. использовать эту модель как planning boundary;
2. отдельно определить target для shared drawing result sync;
3. только потом проектировать durable room persistence.

Иначе есть риск преждевременно закрепить временный alpha behavior как постоянный persistence contract.
