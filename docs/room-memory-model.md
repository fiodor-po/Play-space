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

Hosted-status caveat that is now explicitly known:

- в текущем hosted setup snapshot store переживает обычный process restart;
- но в текущем Railway-hosted path snapshot store **не переживает redeploy**;
- поэтому current hosted durability should be treated as restart-stable but not deploy-stable;
- until this is fixed, durable room snapshots remain operationally useful but not fully reliable as hosted deployment-persistent room memory.

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

## I. Server-controlled client reset policy

Для текущего alpha нужен ещё один **operational layer**, который не является ни room memory,
ни migration framework:

- backend-controlled client reset policy;
- он нужен для intentional invalidation stale browser-local room memory;
- он не является final persistence redesign;
- он не является broad migration engine.

Его purpose:

- после deploy/runtime cleanup intentionally сбросить stale local room memory;
- убрать harmful legacy browser-local state;
- дать ops-controlled путь к clean client bootstrap without relying on manual user cleanup.

Canonical first-pass rule:

- backend publishes explicit reset policy marker;
- client checks it early during boot;
- if policy changed, client wipes browser-local room-memory state before normal restore continues;
- browser participant identity stays preserved in the first slice.

Recommended first-pass policy shape:

```ts
type ClientResetPolicy = {
  policyId: string;
  issuedAt: string;
  reason?: string;
  scope: "all-browser-local-room-state";
  mode: "once-per-browser";
};
```

Client keeps a local acknowledgement marker for the last applied policy id.

First-slice wipe scope should include browser-local room-memory categories such as:

- active room restore markers;
- room-scoped participant sessions;
- room-scoped participant presence cache;
- room metadata;
- room viewport state;
- local per-room board/object caches;
- local per-room room snapshot caches.

First-slice preserve rule:

- browser participant id should remain preserved;
- this is room-memory invalidation, not browser-identity destruction.

## 4. Source-of-truth interpretation

Для текущего alpha source of truth нужно понимать так:

- для **живой активной комнаты** primary source of truth = current live shared room state;
- для **recovery after live state disappearance** next source = durable room snapshot;
- local snapshot = fallback-only layer;
- awareness = ephemeral collaboration layer;
- local UI / interaction state = client-local only.
- server-controlled client reset policy = operational invalidation layer for stale client-local room memory.

Room creator truth should be interpreted under the same rule:

- room creator identity must come from shared room-level truth;
- browser-local room metadata is non-authoritative for creator identity;
- local room metadata may cache or mirror creator information for convenience;
- local room metadata must not independently originate room creator identity per browser profile.

This distinction matters because room creator identity is currently used for:

- creator-facing room UI;
- creator-based room governance overrides.

Those behaviors should read from one shared room-level creator id, not from per-browser remembered metadata.

## 5. Bootstrap / recovery priority

Практический bootstrap order:

1. live shared room state
2. durable room snapshot
3. local personal room snapshot
4. empty room / zero state

Эта priority chain важнее старого упрощённого тезиса "durable memory ещё не существует".

Client reset boot-order rule:

1. client checks server-controlled reset policy
2. if policy changed, client wipes scoped local room-memory state and records local acknowledgement
3. only after that normal room/session restore may continue
4. then normal bootstrap priority applies: live -> durable -> local -> empty

This ordering is important.
Client reset must happen before stale local restore gets a chance to win.

## 6. Room lifecycle rules в текущей модели

### New room
- новая комната по product contract считается empty by default;
- shared objects не должны автоматически seed’иться только потому, что комната новая.

### Refresh
- refresh в той же комнате должен:
  - сохранять participant session для этой комнаты;

## 7. Narrow room creator fix direction

The first room creator fix should stay intentionally narrow:

- introduce one shared room-level creator id;
- use that shared creator id for creator UI and creator-based governance;
- stop treating browser-local room metadata as authoritative creator truth.

What local room metadata may still do:

- mirror the current known creator id;
- cache room-level hints for convenience;
- keep non-authoritative room bootstrap bookkeeping.

What local room metadata must not do:

- independently decide who the room creator is for a given room;
- overwrite shared creator truth based on local browser initialization.

This is not a full room ownership platform.
It is a narrow source-of-truth correction.
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

Additional narrow operational sequence now recommended:

5. add server-controlled client reset policy as a separate operational hygiene mechanism;
6. keep it explicit, global, and once-per-browser in the first slice;
7. do not let it grow into a migration framework prematurely.
