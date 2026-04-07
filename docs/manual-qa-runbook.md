# Manual QA Runbook

Этот runbook нужен для ручной проверки текущего alpha core и для pre-deploy / post-change smoke testing.

Он опирается на:

- `ROADMAP.md`
- `docs/stabilization-checklist.md`
- `docs/room-behavior-spec.md`
- `docs/dev-workflows.md`

## Recommended baseline setup

Минимальный useful setup:

- клиент A: обычное окно браузера
- клиент B: второе окно / инкогнито / другой браузер
- комната `alpha-qa-1` для основных shared checks
- комната `alpha-qa-2` для room-switching checks

Когда видео важно проверить честно, лучше использовать:
- localhost two-tab path для fast smoke
- LAN HTTPS path для multi-device media smoke

---

## 1. Single-client board checks

### 1.1. Empty-space panning

- Setup:
  - открыть комнату `alpha-qa-1`;
  - убедиться, что на доске есть хотя бы один объект.
- Exact actions:
  - кликнуть по пустому месту доски;
  - потянуть пустое пространство мышью;
  - повторить после выбора объекта и после снятия выбора.
- Expected result:
  - двигается viewport, а не объект;
  - selection не ломает panning;
  - panning остаётся ручным и предсказуемым.

### 1.2. Wheel zoom

- Setup:
  - открыть комнату `alpha-qa-1`.
- Exact actions:
  - покрутить колесо мыши над разными точками доски;
  - zoom in, потом zoom out.
- Expected result:
  - zoom anchored around pointer;
  - после zoom доска остаётся usable;
  - selection, overlays и panning не ломаются.

### 1.3. Token local interactions

- Exact actions:
  - нажать `Add token`;
  - выбрать token;
  - перетащить token;
  - удалить token клавишей Delete/Backspace.
- Expected result:
  - token создаётся, двигается и удаляется без ошибок;
  - selection рамка ведёт себя стабильно.

### 1.4. Text-card local interactions

- Exact actions:
  - нажать `Add note`;
  - перетащить note за handle в header;
  - кликнуть по body;
  - double-click по body;
  - изменить текст и сохранить.
- Expected result:
  - header handle остаётся основным способом drag;
  - body double-click открывает editing;
  - edit сохраняется без побочных эффектов.

### 1.5. Image interactions

- Exact actions:
  - добавить image;
  - переместить её;
  - изменить размер;
  - выбрать её;
  - при необходимости проверить draw mode отдельно.
- Expected result:
  - drag/resize ведут себя стабильно;
  - image interaction не ломает unrelated board control.

---

## 2. Two-client shared board checks

### 2.1. Presence / cursors

- Setup:
  - открыть `alpha-qa-1` в клиентах A и B;
  - войти под разными именами/цветами.
- Exact actions:
  - подвигать курсором в A;
  - подвигать курсором в B;
  - закрыть B.
- Expected result:
  - каждый клиент видит удалённый курсор и label второго клиента;
  - локальный курсор не дублируется как remote;
  - после закрытия B его presence исчезает.

### 2.2. Shared tokens

- Exact actions:
  - в клиенте A создать token;
  - переместить его;
  - удалить его;
  - смотреть клиент B.
- Expected result:
  - create / move / delete отражаются в клиенте B.

### 2.3. Shared text-cards

- Exact actions:
  - в A создать note;
  - перетащить её;
  - отредактировать текст;
  - смотреть B.
- Expected result:
  - create / move / edit отражаются в B;
  - header drag-handle остаётся рабочим.

### 2.4. Shared images

- Exact actions:
  - в A добавить image;
  - переместить image;
  - изменить размер image;
  - смотреть B.
- Expected result:
  - committed image state приходит в B;
  - drag/resize не ломают image state.

---

## 3. Room lifecycle and recovery checks

### 3.1. Switch room and back

- Setup:
  - открыть `alpha-qa-1`, создать там несколько объектов;
  - подготовить `alpha-qa-2` как отдельную комнату.
- Exact actions:
  - в A переключиться в `alpha-qa-2`;
  - затем вернуться в `alpha-qa-1`.
- Expected result:
  - URL и room id меняются сразу;
  - presence и shared objects не протекают между комнатами;
  - при возврате показывается live state исходной комнаты.

### 3.2. Remote preview should not leak across rooms

- Setup:
  - открыть `alpha-qa-1` в A и B;
  - в B начать drag или transform image так, чтобы в A был виден remote preview.
- Exact actions:
  - пока preview активен, в A переключиться в `alpha-qa-2`.
- Expected result:
  - в новой комнате не остаётся ghost preview из предыдущей комнаты.

### 3.3. Refresh in active room

- Setup:
  - открыть `alpha-qa-1`;
  - создать/подвигать несколько объектов;
  - слегка изменить viewport.
- Exact actions:
  - сделать browser refresh.
- Expected result:
  - participant session для этой комнаты сохраняется в том же браузере;
  - viewport восстанавливается;
  - клиент снова подключается к current live room state.

### 3.4. Rejoin while room is still live

- Setup:
  - открыть `alpha-qa-1` в A и B;
  - оставить B в комнате.
- Exact actions:
  - в A закрыть вкладку или выйти;
  - снова открыть `alpha-qa-1` в том же браузере.
- Expected result:
  - A снова видит текущее live state комнаты.

### 3.5. Durable snapshot smoke

- Setup:
  - в `alpha-qa-1` создать несколько объектов;
  - убедиться, что room state уже был сохранён обычным рабочим циклом.
- Exact actions:
  - убрать live room state scenario настолько, насколько это возможно в текущем dev flow;
  - снова зайти в комнату.
- Expected result:
  - если live room уже отсутствует, alpha пытается восстановиться через durable room snapshot;
  - это best-effort alpha behavior, а не final persistence guarantee.
- Also verify:
  - в console/logs видно, какой bootstrap branch реально сработал;
  - если recovery не удался, ошибка выглядит диагностируемой, а не silent.
- Note:
  - если этот сценарий ведёт себя странно, это уже не "известная нормальность по контракту", а повод перепроверить current durable path.

### 3.6. Config failure visibility smoke

- Setup:
  - использовать environment с намеренно отсутствующим или неправильным hosted config only if это безопасно для локальной smoke-проверки;
  - не менять product semantics, проверять только diagnostics.
- Exact actions:
  - открыть приложение;
  - посмотреть console / backend logs;
  - если видео включено, попробовать `Join media` при misconfigured LiveKit path.
- Expected result:
  - видно, какие runtime URLs реально используются;
  - fallback assumptions не остаются полностью silent;
  - media/token failure не схлопывается в полностью безликую ошибку.

---

## 4. Image draw-mode checks

### 4.1. Draw / Save / Clear in one client

- Exact actions:
  - выбрать image;
  - нажать `Draw`;
  - нарисовать stroke;
  - нажать `Save`;
  - затем `Clear`.
- Expected result:
  - draw mode включается только явно;
  - `Save` коммитит результат;
  - `Clear` очищает strokes только у этой image.

### 4.2. Awareness lock between two clients

- Setup:
  - открыть одну и ту же image у A и B.
- Exact actions:
  - в A нажать `Draw`;
  - попробовать начать drawing в B на той же image;
  - затем завершить drawing в A и проверить B ещё раз.
- Expected result:
  - B не получает параллельный draw control над той же image, пока lock активен;
  - после завершения drawing mode в A lock снимается.

---

## 5. Dice smoke checks

### 5.1. Local dice tray

- Exact actions:
  - проверить, что tray доступен;
  - сделать броски `d4 / d6 / d8 / d10 / d12 / d20 / d100`.
- Expected result:
  - броски запускаются без визуального развала overlay;
  - результат выглядит осмысленно;
  - tray остаётся usable и не ломает board interaction.

### 5.2. Shared public roll

- Setup:
  - открыть комнату в A и B.
- Exact actions:
  - в A бросить несколько dice;
  - проверить B.
- Expected result:
  - оба клиента видят один и тот же public roll moment;
  - финальный visible result совпадает;
  - цвет dice совпадает с color rolling participant.

### 5.3. Sequential actor-color check

- Setup:
  - A и B под разными цветами.
- Exact actions:
  - сначала роллит A;
  - затем роллит B.
- Expected result:
  - actor color корректно меняется от ролля к роллю;
  - нет viewer-local color substitution.

---

## 6. Media dock smoke checks

### 6.1. Localhost media join

- Recommended setup:
  - `npm run dev:local`
- Exact actions:
  - открыть room;
  - зайти в media dock;
  - включить/выключить mic/cam;
  - выйти.
- Expected result:
  - join / leave работают;
  - intentional leave не выглядит как error;
  - stale banners не остаются после successful recovery.

### 6.2. Two-tab basic media smoke

- Setup:
  - localhost two-tab or two-browser.
- Exact actions:
  - зайти в room в двух клиентах;
  - проверить local/remote tile appearance;
  - toggles mic/cam.
- Expected result:
  - базовый local/remote AV path работает;
  - media dock не ломает board shell.

### 6.3. LAN secure-origin smoke

- Recommended setup:
  - `npm run dev:lan`
- Exact actions:
  - открыть app с другого устройства;
  - проверить secure context и media availability.
- Expected result:
  - URL открывается по HTTPS;
  - `window.isSecureContext === true`;
  - `navigator.mediaDevices` доступен;
  - basic join works if trust is correctly configured.

---

## 7. Highest-risk flows after any BoardStage-related change

- empty-space panning
- wheel zoom around pointer
- room switching with live shared objects
- remote image preview during room switch
- image drag / resize
- image draw mode: `Draw / Save / Clear`
- awareness lock on the same image in two clients
- text-card drag-handle in header
- text-card body double-click editing

## 8. Highest-risk flows before hosted alpha

- room entry / rejoin / refresh semantics
- durable snapshot smoke
- dice public roll consistency
- media join/leave/toggle state handling
- env/runtime assumptions in `dev:local` and `dev:lan`

## 9. Known current alpha limitations

- durable room memory остаётся best-effort, а не final collaborative durable platform;
- media dock UX остаётся spike-level;
- local CA trust ergonomics для LAN media testing остаются rough;
- dice layer usable, но всё ещё имеет residual polish debt;
- hosted alpha environment ещё не собран, поэтому некоторые проблемы могут проявиться только после deploy.
