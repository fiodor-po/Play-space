# Room Behavior Spec

Это короткая спецификация текущего room behavior для alpha.

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

- если live shared room state ещё существует, именно оно главнее всего;
- если live shared room state уже исчезло, система может восстанавливаться через **durable room snapshot**;
- local per-room snapshot остаётся fallback-only layer;
- это best-effort alpha recovery, а не final persistence guarantee.

## 4. Bootstrap priority

Для room recovery при текущем alpha practical priority такая:

1. live shared room state
2. durable room snapshot
3. local personal room snapshot
4. empty room / zero state

Именно так нужно мыслить текущий room bootstrap/recovery path.

## 5. Что должно происходить на refresh?

Refresh в той же комнате должен:

- сохранять participant session в том же браузере для этой комнаты;
- восстанавливать локальный viewport этой комнаты;
- заново подключать клиента к current live room state;
- при необходимости использовать текущий bootstrap priority без ложного seed/reset behavior.

## 6. Что должно происходить на rejoin?

Rejoin нужно трактовать так:

- если live room state ещё существует, пользователь должен снова увидеть его;
- если live room уже исчезла, alpha может попытаться восстановиться через durable snapshot;
- participant session для той же комнаты в том же браузере может переиспользоваться.

## 7. Reset semantics

В текущем alpha важно:

- `reset board` = clear board content only;
- reset не должен неожиданно менять viewport/camera state;
- viewport semantics отделены от zero-state semantics.

## 8. Что сейчас считается intentional / temporary / bug

### Intentional for current alpha

- board-first shared room без heavy VTT semantics;
- новая комната empty by default;
- explicit image draw mode с `Draw / Save / Clear`;
- awareness-based per-image lock;
- current bootstrap priority: live -> durable -> local -> empty;
- best-effort durable room snapshot layer как часть alpha.

### Temporary but acceptable

- durable room memory ещё не merge-aware final platform;
- hosted-alpha-specific runtime issues ещё не все известны;
- media/video и dice polish остаются rough.

### Actual bugs

Нужно считать багом, если:

- room switching смешивает состояния разных комнат;
- refresh ломает current live room behavior;
- rejoin в ещё живую комнату не показывает текущее live state;
- bootstrap incorrectly skips live state and restores older snapshot;
- durable snapshot path hangs or silently fails in normal alpha scenarios;
- presence/cursors ведут себя некорректно;
- shared tokens / images / text-cards перестают синхронизироваться;
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
