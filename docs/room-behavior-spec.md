# Room Behavior Spec

Это короткая спецификация текущего room behavior для alpha.

## 0. Current entry / leave model

Текущий alpha room flow теперь такой:

- room selection happens through a unified entry screen;
- room id from URL acts as room-name prefill;
- room name remains editable before join;
- joining is explicit;
- in-room `Leave room` returns the user to the entry screen instead of directly switching to another room.

Важно:

- saved room-scoped participant session больше не означает automatic join by itself;
- active room participation теперь мыслится отдельно от draft room selection.

## 0.1. Current near-term participant identity model

Для текущего product stage:

- same browser profile = same participant;
- participant identity не определяется по имени;
- multiple tabs are allowed;
- multiple tabs не должны вести себя как multiple independent participants;
- only the foreground/visible tab should act as the live participant carrier;
- background tabs should be soft-suspended for active presence behavior.

Это не account/auth identity model.
Это browser-local participant identity model для текущего alpha.

## 1. Новая комната: пустая или seeded?

Для текущего alpha новая комната считается **empty by default**.

- Это соответствует текущей zero-state semantics.
- `initialBoard` не должен считаться каноническим room-creation contract.
- Starter/onboarding content, если когда-нибудь вернётся, должно быть отдельным UX layer, а не hidden room default.

## 2. Что считается текущим room content contract?

Для активной live room главным content layer остаётся **current live shared room state**.

Сейчас сюда входят:

- shared tokens;
- shared images;
- shared text-cards;
- committed drawing result внутри image state.

Dice не входят в durable room content.
Они остаются transient shared effect layer.

## 3. Что должно происходить после ухода всех участников?

Это уже не old "pure live-only room" framing.

Текущая alpha model такая:

- сначала комната должна резолвиться как durable room identity;
- если live shared room state ещё существует, именно оно главнее всего для current content;
- если live shared room state уже исчезло, система может восстанавливаться через **durable room snapshot**;
- local per-room state остаётся convenience-only layer;
- это best-effort alpha recovery, а не final persistence guarantee.

## 4. Bootstrap priority

Для room recovery при текущем alpha practical priority такая:

1. durable room identity
2. live shared room state
3. durable room snapshot
4. local personal room state
5. empty room / zero state

Именно так нужно мыслить текущий room bootstrap/recovery path.

## 5. Что должно происходить на refresh?

Refresh в той же комнате должен:

- сначала проверить server-controlled client reset policy, если такой policy exists;
- при changed policy сначала очистить scoped browser-local room memory;
- если пользователь был в active joined room, refresh может сохранить active in-room state;
- сохранять participant session в том же браузере для этой комнаты;
- восстанавливать локальный viewport этой комнаты;
- заново подключать клиента к current live room state;
- при необходимости использовать текущий bootstrap priority без ложного seed/reset behavior.

Важно:

- client reset check должен происходить **до** normal restore from local room memory;
- first reset slice should preserve browser participant identity;
- этот механизм нужен для stale local room-memory invalidation, а не для broad migration behavior.

## 6. Что должно происходить на rejoin?

Rejoin нужно трактовать так:

- room URL сам по себе больше не считается достаточным automatic join signal;
- если live room state ещё существует, пользователь должен снова увидеть его;
- если live room уже исчезла, alpha может попытаться восстановиться через durable snapshot;
- participant session / identity для той же комнаты в том же browser profile should be reusable.

## 6.1. Multi-tab behavior

- новый tab в том же browser profile должен считаться тем же participant, а не новым человеком;
- foreground tab should carry live participant presence;
- background tab should not keep publishing active participant presence as if it were a second participant.

## 6.2. Что должно происходить на explicit leave room?

`Leave room` должно:

- завершать active participation в текущей комнате;
- возвращать пользователя на unified entry screen;
- оставлять current room name доступным как editable draft;
- не удалять room content;
- не удалять room metadata.

## 7. Reset semantics

В текущем alpha важно:

- `reset board` = clear board content only;
- reset не должен неожиданно менять viewport/camera state;
- viewport semantics отделены от zero-state semantics.

Отдельно от этого теперь есть ещё один intended reset family:

- server-controlled client reset policy for stale browser-local room memory;
- это не room-content reset;
- это не board reset;
- это operational cleanup mechanism before normal restore.

## 7.1. Room creator semantics

Для текущего alpha room creator semantics должны пониматься узко и конкретно:

- room creator identity must come from durable/shared room-level truth;
- browser-local room metadata is not authoritative creator truth;
- local room metadata may mirror the current known creator id, but must not originate it independently per browser.

Practical consequence:

- two different browser-local contexts must not be able to independently declare themselves creator of the same room;
- creator-facing room UI should read from shared creator truth;
- creator-based room governance should read from the same shared creator truth.

Near-term fix direction:

- add one durable room identity anchor for creator truth;
- route creator UI and creator-based governance to that durable/shared value;
- live room-state may mirror creator for active-room convenience but must not own it;
- do not broaden this into a full ownership / account / role system in the first fix.

Recommended narrow durable-identity implementation shape:

- add a backend durable room identity store separate from durable content snapshots;
- keep first-pass identity shape very small:
  - `roomId`
  - `creatorId`
  - `createdAt`
- resolve room identity before content restore;
- treat durable snapshot as content-recovery only, not room identity authority.

## 8. Что сейчас считается intentional / temporary / bug

### Intentional for current alpha

- board-first shared room без heavy VTT semantics;
- новая комната empty by default;
- explicit image draw mode с `Draw / Save / Clear`;
- awareness-based per-image lock;
- current bootstrap priority: identity -> live -> durable -> local -> empty;
- best-effort durable room snapshot layer как часть alpha.

### Temporary but acceptable

- durable room memory ещё не merge-aware final platform;
- hosted-alpha-specific runtime issues ещё не все известны;
- media/video и dice polish остаются rough.

### Actual bugs

Нужно считать багом, если:

- `Leave room` не возвращает пользователя на entry screen;
- room draft и active room state снова неявно смешиваются;
- refresh ломает current live room behavior;
- rejoin в ещё живую комнату не показывает текущее live state;
- bootstrap incorrectly skips live state and restores older snapshot;
- durable snapshot path hangs or silently fails in normal alpha scenarios;
- presence/cursors ведут себя некорректно;
- shared tokens / images / text-cards перестают синхронизироваться;
- two separate browser contexts can both show `Creator: You` for the same room;
- `Draw / Save / Clear` или awareness lock перестают соответствовать текущему UX;
- ломается manual empty-space panning;
- ломается wheel zoom.

## 9. Что явно отложено

- final durable room platform with merge/reconciliation;
- scenes / permissions / history semantics;
- broad architecture changes ради room-memory elegance;
- превращение dice или media в durable room content.

## 10. Следующий обязательный шаг перед hosted alpha

Перед hosted alpha нужно отдельно проверить:

- lifecycle/order-dependent logic;
- bootstrap/recovery correctness;
- deployment-readiness assumptions;
- observability gaps;
- узкий список real pre-deploy risks.
