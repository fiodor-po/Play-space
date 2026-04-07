# Room Memory Model

Этот документ фиксирует рабочую memory model для текущего alpha.

Это не final persistence platform design.
Это короткая спецификация того, как сейчас нужно думать о состоянии комнаты и о границах между разными типами state.

## 1. Зачем нужен этот документ

Нужно явно разделить:

- что считается room content;
- что считается live shared state;
- что считается durable recovery layer;
- что считается awareness-only state;
- что остаётся локальным UI state;
- что остаётся локальным interaction state.

## 2. Текущий статус модели

Для текущего alpha canonical durable room memory уже **частично существует** как best-effort room snapshot layer.

Но важно:

- это ещё не final collaborative durable platform;
- это не merge-aware room document;
- это не причина переусложнять persistence architecture раньше времени.

Текущая рабочая модель такая:

- у комнаты есть **live shared state**;
- у комнаты есть **durable room snapshot layer** для recovery;
- у клиента есть **локальный per-room fallback state**;
- есть **awareness-only signals** для ephemeral collaboration.

## 3. State categories

## A. Shared realtime room state

Это состояние комнаты, которое должно быть общим между активными участниками в live session.

Сейчас сюда относятся:

- shared tokens;
- shared images;
- shared text-cards;
- committed drawing result как часть image state.

Практический смысл:

- если два клиента одновременно находятся в одной комнате, они должны видеть один и тот же committed room content;
- для живой активной комнаты именно этот слой ближе всего к primary source of truth.

## B. Durable room snapshot state

Это best-effort room-level recovery layer, который переживает исчезновение live room state.

Сейчас по смыслу сюда относится snapshot комнаты с:

- `roomId`
- `revision`
- `savedAt`
- committed tokens / images / textCards

Правило:

- durable snapshot используется для recovery;
- он не отменяет приоритет live shared room state;
- это alpha recovery base, а не final collaborative storage platform.

## C. Local fallback room state

Это локальный per-room fallback слой клиента.

Он может быть полезен для resilience, но:

- он не считается главным room source of truth;
- он не должен побеждать более новый durable room snapshot;
- он не должен диктовать shared room truth после исчезновения live state.

## D. Awareness-only state

Это collaboration signals, которые существуют только как ephemeral layer и не должны трактоваться как память комнаты.

Сейчас сюда относятся:

- participant presence;
- cursors;
- active image drawing lock;
- другие короткоживущие coordination hints.

Правило:

- awareness не становится persistence layer;
- awareness не считается room memory;
- исчезновение awareness state после disconnect — нормальное поведение.

## E. Shared transient sync state

Это состояние, которое синхронизируется между клиентами, но не считается долговременной памятью комнаты.

Сейчас сюда относятся:

- remote image drag / transform preview bounds;
- transient dice roll events;
- другие краткоживущие room-level overlays/signals.

Правило:

- такие данные могут жить рядом с realtime transport;
- но не считаются durable room content;
- при room switch или TTL expiry должны очищаться как transient state.

## F. Local UI state

Это клиентское состояние, которое не является room content.

Сейчас сюда относятся:

- viewport текущей комнаты;
- panel open/edit states;
- draft values в UI;
- textarea positioning;
- selection-related overlays;
- cached loaded images в клиенте.

Правило:

- local UI state может сохраняться локально per-room, если это не меняет product contract комнаты;
- local UI state не должен трактоваться как shared room memory.

## G. Local interaction state

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
- оно должно сбрасываться на appropriate boundaries, например при room switch.

## H. Seed / bootstrap state

`initialBoard` не является канонической room memory model.

Правило:

- новая shared room считается empty by default;
- initial seed не должен автоматически определять содержимое новой комнаты;
- starter content может существовать только как отдельный UX mechanism, не как hidden memory contract.

## 4. Source-of-truth interpretation

Для текущего alpha source of truth нужно понимать так:

- для **живой активной комнаты** primary source of truth = current live shared room state;
- для **recovery after live state disappearance** next source = durable room snapshot;
- local snapshot = fallback-only layer;
- awareness = ephemeral collaboration layer;
- local UI / interaction state = client-local only.

## 5. Bootstrap / recovery priority

Практический bootstrap order:

1. live shared room state
2. durable room snapshot
3. local personal room snapshot
4. empty room / zero state

Эта priority chain важнее старого упрощённого тезиса "durable memory ещё не существует".

## 6. Room lifecycle rules в текущей модели

### New room
- новая комната по product contract считается empty by default;
- shared objects не должны автоматически seed’иться только потому, что комната новая.

### Refresh
- refresh в той же комнате должен:
  - сохранять participant session для этой комнаты;
  - восстанавливать local viewport;
  - переподключать клиента к current live room state.

### Rejoin
- если live room state ещё существует, rejoin должен вернуть пользователя в него;
- если live room state уже исчез, система может восстановиться через durable snapshot;
- local fallback остаётся последним слоем защиты, а не главным контрактом.

### After all participants leave
- это больше не purely undefined territory;
- best-effort recovery path уже существует;
- но final long-term room-memory guarantees всё ещё сознательно не обещаются как fully solved product contract.

## 7. Что из этого следует для следующих шагов

Сейчас полезная последовательность такая:

1. использовать эту модель как planning boundary;
2. проверить её технически через pre-deploy audit;
3. не overbuild persistence layer до реального hosted-alpha signal;
4. держать broad architecture cleanup отдельно от room-memory correctness.
