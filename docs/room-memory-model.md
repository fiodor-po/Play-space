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

Current alpha room-data policy:

- room data on the alpha stage is disposable;
- semantic/runtime chapters may require room wipe after room-document shape or recovery truth changes;
- legacy room compatibility is optional unless a current demo or validation checkpoint explicitly depends on it;
- wipe decisions should be made explicitly per chapter instead of silently preserving stale rooms by default.

Текущая рабочая модель такая:

- у комнаты есть **durable room identity layer** для room-level identity facts;
- у комнаты есть **live shared state**;
- у комнаты должен быть **room-scoped last-known participant appearance layer** для creator-linked fallback semantics;
- у комнаты есть **durable room snapshot layer** для recoverable room state other than room identity facts;
- у клиента есть **локальный per-room convenience state**;
- есть **awareness-only signals** для ephemeral collaboration.

## 3. State categories

## A. Durable room identity state

Это долговременный room-level layer для identity facts комнаты.

Сюда должны относиться вещи вроде:

- `roomId`;
- `creatorId`;
- `createdAt`;
- later small room-level metadata if it is truly identity-level.

Правило:

- этот слой не должен зависеть от того, жива ли сейчас live room;
- этот слой не должен жить только в browser-local metadata;
- этот слой не должен смешиваться с board content snapshot.

Recommended first-pass shape:

```ts
type DurableRoomIdentity = {
  roomId: string;
  creatorId: string | null;
  createdAt: string;
};
```

Important first-pass rule:

- durable room identity should be its own backend store;
- not browser-local metadata;
- not embedded inside the durable content snapshot as a sidecar.

## B. Shared realtime room state

Это состояние комнаты, которое должно быть общим между активными участниками в live session.

Сейчас сюда относятся:

- shared tokens;
- shared images;
- shared text-cards;
- committed drawing result как часть image state.

Практический смысл:

- если два клиента одновременно находятся в одной комнате, они должны видеть один и тот же committed room content;
- для живой активной комнаты именно этот слой ближе всего к primary source of truth.

## C. Durable room snapshot state

Это best-effort room-level recovery layer, который переживает исчезновение live room state.

Сейчас по смыслу сюда относится snapshot комнаты с:

- `roomId`
- `revision`
- `savedAt`
- committed tokens / images / textCards
- room-scoped last-known participant appearance

Практический смысл:

- durable room snapshot отвечает на вопрос, какое recoverable durable состояние комнаты было сохранено кроме room identity facts;
- durable room snapshot не должен в одиночку определять, существовала ли комната как сущность.
- durable room snapshot should not be the long-term home of room creator identity.

Правило:

- durable snapshot используется для recovery;
- он не отменяет приоритет live shared room state;
- это alpha recovery base, а не final collaborative storage platform;
- snapshot layer должен оставаться recoverable room-state layer, а не room identity authority.
- creator-linked participant appearance fallback может жить в snapshot, если это room-scoped durable state и не претендует на room identity authority.

## D. Room-scoped last-known participant appearance

Это room-scoped слой последней известной creator appearance truth для этой комнаты.

Recommended target shape:

```ts
type RoomParticipantAppearance = {
  participantId: string;
  lastKnownName: string;
  lastKnownColor: string;
  lastSeenAt: number;
};
```

Purpose:

- дать честный non-live fallback для creator-linked rendering;
- сохранить last known name/color участника для этой комнаты;
- не заставлять creator-linked objects падать обратно в baked-in object color.

Important rules:

- это не room identity layer;
- это не authoritative participant roster;
- это не auth/member-management system;
- target owner for this layer is durable room snapshot, not browser-local-only convenience state.

This layer should answer:

- "какими были последние известные name/color этого `participantId` в этой комнате?"

and should not answer:

- "кто сейчас в комнате?"
- "кто вообще состоит в комнате как в membership system?"

Target rendering consequence:

- creator-linked color/name should resolve by:
  1. live participant state
  2. room-scoped last-known participant appearance
  3. only temporary legacy fallback after that

## E. Local convenience room state

Это локальный per-room convenience слой клиента.

Он может быть полезен для personal UX, но:

- он не считается главным room source of truth;
- он не должен побеждать durable room identity;
- он не должен побеждать более новый durable room snapshot;
- он не должен диктовать shared room truth после исчезновения live state.

## E.1. Alpha wipe policy

Для текущего alpha room wipe is an accepted operational tool.

Practical rule:

- if a chapter changes room-document shape, recovery semantics, or shared creator/color truth, existing rooms may be reset instead of preserved through compatibility code;
- chapter closeout should decide `wipe required` or `wipe not required`;
- room wipe may target durable room snapshots, local room replicas, and scoped browser-local room state for affected rooms;
- browser-local participant identity should stay intact unless the chapter explicitly changes that model.

Сейчас сюда относятся вещи вроде:

- remembered participant name/color;
- local room metadata for convenience;
- local viewport;
- local room restore markers;
- future recent-room history.

Important distinction:

- local room-member history may remain useful as remembered defaults / convenience;
- but it should not be treated as canonical shared creator fallback truth.

## F. Awareness-only state

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

## G. Shared transient sync state

Это состояние, которое синхронизируется между клиентами, но не считается долговременной памятью комнаты.

Сейчас сюда относятся:

- remote image drag / transform preview bounds;
- transient dice roll events;
- другие краткоживущие room-level overlays/signals.

Правило:

- такие данные могут жить рядом с realtime transport;
- но не считаются durable room content;
- при room switch или TTL expiry должны очищаться как transient state.

## H. Local UI state

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

## I. Local interaction state

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

## J. Seed / bootstrap state

`initialBoard` не является канонической room memory model.

Правило:

- новая shared room считается empty by default;
- initial seed не должен автоматически определять содержимое новой комнаты;
- starter content может существовать только как отдельный UX mechanism, не как hidden memory contract.

## K. Server-controlled client reset policy

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

- сначала определяется **durable room identity**:
  существует ли эта комната как долговременная сущность и какие у неё identity-level facts;
- для **живой активной комнаты** primary content source of truth = current live shared room state;
- для **recovery after live state disappearance** next content source = durable room snapshot;
- local room state = convenience-only layer;
- awareness = ephemeral collaboration layer;
- local UI / interaction state = client-local only.
- server-controlled client reset policy = operational invalidation layer for stale client-local room memory.

Room creator truth should be interpreted under the same rule:

- room creator identity must come from durable/shared room-level truth;
- browser-local room metadata is non-authoritative for creator identity;
- local room metadata may cache or mirror creator information for convenience;
- local room metadata must not independently originate room creator identity per browser profile.
- live room-state may mirror creator truth for active-room convenience, but should not own it.

This distinction matters because room creator identity is currently used for:

- creator-facing room UI;
- creator-based room governance overrides.

Those behaviors should read from one shared room-level creator id, not from per-browser remembered metadata.

## 5. Bootstrap / recovery model

Практический recovery path:

1. durable room identity определяет, новая это комната или уже существующая
2. active room использует live shared room state и приходит в `live-active`
3. empty-live reopen сначала открывает version-aware local replica
4. settled recovery сходится через replica convergence и per-slice durable catch-up
5. empty room / zero state остаётся fallback только когда usable local и durable content отсутствуют

Практический смысл этой модели:

- identity resolution идёт раньше content recovery;
- live shared state остаётся primary settled state для active room;
- browser-local state участвует как replica path;
- durable content догоняет settled state через freshness / revision semantics;
- empty fallback включается только при отсутствии usable recovery content.

Recommended durable creator resolution path:

1. durable room identity resolves `creatorId`
2. live room-state mirrors that creator while the room is active
3. UI and creator-based governance read the resolved creator from durable/shared identity truth
4. durable room snapshot no longer acts as creator authority

Client reset boot-order rule:

1. client checks server-controlled reset policy
2. if policy changed, client wipes scoped local room-memory state and records local acknowledgement
3. only after that normal room/session restore may continue
4. then normal recovery path applies: `live-active` when live state exists,
   otherwise local-first open plus settled replica convergence

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
