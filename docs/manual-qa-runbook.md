# Manual QA Runbook

Этот runbook нужен для ручной проверки текущей stabilization phase.
Он основан на:

- `ROADMAP.md`
- `docs/stabilization-checklist.md`
- `docs/room-behavior-spec.md`

Рекомендуемый базовый сетап:

- Клиент A: обычное окно браузера
- Клиент B: второе окно / инкогнито / другой браузер
- Комната `alpha-qa-1` для основных shared checks
- Комната `alpha-qa-2` для room-switching checks

## Single-client checks

### 1. Empty-space panning

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
- Regression:
  - пустое пространство перестало панить;
  - начинает случайно таскаться объект;
  - panning меняет семантику после unrelated change.

### 2. Wheel zoom

- Setup:
  - открыть комнату `alpha-qa-1`.
- Exact actions:
  - покрутить колесо мыши над разными точками доски;
  - zoom in, потом zoom out.
- Expected result:
  - zoom anchored around pointer;
  - после zoom доска остаётся usable;
  - selection, overlays и panning не ломаются.
- Regression:
  - zoom прыгает или уводит доску неожиданно;
  - после zoom ломается управление;
  - pointer anchoring визуально пропадает.

### 3. Token local interactions

- Setup:
  - открыть комнату `alpha-qa-1`.
- Exact actions:
  - нажать `Add token`;
  - выбрать token;
  - перетащить token;
  - удалить token клавишей Delete/Backspace.
- Expected result:
  - token создаётся, двигается и удаляется без ошибок;
  - selection рамка ведёт себя стабильно.
- Regression:
  - token не создаётся;
  - drag работает нестабильно;
  - delete не работает при валидном selection.

### 4. Text-card local interactions

- Setup:
  - открыть комнату `alpha-qa-1`.
- Exact actions:
  - нажать `Add note`;
  - перетащить note за маленький handle в header;
  - кликнуть по body;
  - double-click по body;
  - изменить текст и сохранить.
- Expected result:
  - drag-handle в header остаётся основным способом drag;
  - body double-click открывает editing;
  - edit сохраняется без побочных эффектов.
- Regression:
  - handle больше не тянет card;
  - body double-click не открывает editing;
  - editing ломает selection или drag.

## Two-client / two-tab checks

### 5. Presence / cursors

- Setup:
  - открыть `alpha-qa-1` в клиентах A и B;
  - войти под разными именами/цветами.
- Exact actions:
  - подвигать курсором в клиенте A;
  - подвигать курсором в клиенте B;
  - закрыть клиент B.
- Expected result:
  - каждый клиент видит только удалённый курсор и label второго клиента;
  - локальный курсор не дублируется как remote;
  - после закрытия клиента B его presence исчезает.
- Regression:
  - курсоры не синхронизируются;
  - локальный курсор виден как remote;
  - presence зависает после ухода клиента.

### 6. Shared tokens

- Setup:
  - открыть `alpha-qa-1` в клиентах A и B.
- Exact actions:
  - в клиенте A создать token;
  - переместить его;
  - удалить его;
  - смотреть клиент B.
- Expected result:
  - create / move / delete отражаются в клиенте B.
- Regression:
  - token changes не доходят до второго клиента;
  - между клиентами расходится состояние token.

### 7. Shared text-cards

- Setup:
  - открыть `alpha-qa-1` в клиентах A и B.
- Exact actions:
  - в клиенте A создать note;
  - перетащить её;
  - отредактировать текст;
  - смотреть клиент B.
- Expected result:
  - create / move / edit отражаются в клиенте B;
  - header-handle drag остаётся рабочим и в shared flow.
- Regression:
  - move/edit не синхронизируются;
  - text-card drag-handle ведёт себя иначе после синка.

### 8. Shared images

- Setup:
  - открыть `alpha-qa-1` в клиентах A и B.
- Exact actions:
  - в клиенте A добавить image;
  - переместить image;
  - изменить размер image;
  - смотреть клиент B.
- Expected result:
  - committed image state приходит в клиент B;
  - drag/resize не ломают image.
- Regression:
  - image changes не синхронизируются;
  - resize ломает image state;
  - image interaction начинает влиять на unrelated flows.

## Room-switching checks

### 9. Switch room and back

- Setup:
  - открыть `alpha-qa-1`, создать там несколько объектов;
  - подготовить `alpha-qa-2` как отдельную комнату.
- Exact actions:
  - в клиенте A переключиться в `alpha-qa-2`;
  - затем вернуться в `alpha-qa-1`.
- Expected result:
  - URL и room id меняются сразу;
  - в новой комнате не протекают presence и shared objects из предыдущей;
  - при возврате показывается live state исходной комнаты.
- Regression:
  - объекты или presence “текут” между комнатами;
  - selection / transient state остаются привязанными к прошлой комнате.

### 10. Remote preview should not leak across rooms

- Setup:
  - открыть `alpha-qa-1` в клиентах A и B;
  - в клиенте B начать drag или transform image так, чтобы в A был виден remote preview.
- Exact actions:
  - пока preview активен, в клиенте A переключиться в `alpha-qa-2`.
- Expected result:
  - в новой комнате не остаётся старый remote image preview overlay;
  - новая комната не показывает transient image preview из прошлой комнаты.
- Regression:
  - после room switch виден ghost preview/image bounds из предыдущей комнаты.

## Refresh / rejoin checks

### 11. Refresh in active room

- Setup:
  - открыть `alpha-qa-1`;
  - создать/подвигать несколько объектов;
  - слегка изменить viewport.
- Exact actions:
  - сделать browser refresh.
- Expected result:
  - participant session для этой комнаты сохраняется в том же браузере;
  - viewport восстанавливается;
  - клиент снова подключается к current live room state;
  - refresh сам по себе не ломает shared behavior.
- Regression:
  - после refresh теряется participant session в той же комнате;
  - viewport не восстанавливается;
  - live room state ведёт себя явно хуже без причины.

### 12. Rejoin while room is still live

- Setup:
  - открыть `alpha-qa-1` в клиентах A и B;
  - оставить B в комнате, чтобы live state точно существовал.
- Exact actions:
  - в клиенте A закрыть вкладку или выйти из комнаты;
  - снова открыть `alpha-qa-1` в том же браузере.
- Expected result:
  - A должен снова увидеть текущее live state комнаты;
  - participant session может переиспользоваться для этой комнаты.
- Regression:
  - rejoin в живую комнату не показывает текущее live state;
  - participant session ведёт себя явно неконсистентно в той же комнате.

## Image draw-mode checks

### 13. Draw / Save / Clear in one client

- Setup:
  - открыть `alpha-qa-1`;
  - добавить image, если её ещё нет.
- Exact actions:
  - выбрать image;
  - нажать `Draw`;
  - нарисовать stroke;
  - нажать `Save`;
  - затем `Clear`.
- Expected result:
  - draw mode включается только явно;
  - stroke виден на image;
  - `Save` коммитит результат;
  - `Clear` очищает strokes только у этой image.
- Regression:
  - drawing запускается неявно;
  - `Save` не коммитит результат;
  - `Clear` ломает image или затрагивает другие объекты.

### 14. Awareness lock between two clients

- Setup:
  - открыть одну и ту же image в `alpha-qa-1` у клиентов A и B.
- Exact actions:
  - в клиенте A нажать `Draw`;
  - попробовать начать drawing в клиенте B на той же image;
  - затем завершить drawing в A и проверить B ещё раз.
- Expected result:
  - B не должен получать параллельный draw control над той же image, пока lock активен;
  - после завершения drawing mode в A lock снимается;
  - lock остаётся awareness-механизмом, а не persistence-механизмом.
- Regression:
  - оба клиента одновременно рисуют на одной image в draw mode;
  - lock не снимается после завершения;
  - draw UX перестаёт совпадать с `Draw / Save / Clear`.

## Highest-risk flows to test after any BoardStage-related change

- empty-space panning
- wheel zoom around pointer
- room switching with live shared objects
- remote image preview during room switch
- image drag / resize
- image draw mode: `Draw / Save / Clear`
- awareness lock on the same image in two clients
- text-card drag-handle in header
- text-card body double-click editing

## Known acceptable alpha limitations

- durable room persistence пока не гарантируется;
- после полного ухода всех участников состояние комнаты может не считаться durable contract;
- canonical room memory model ещё не определена;
- coexistence локального storage fallback и current live shared model пока допустим;
- refresh и rejoin проверяются только в рамках current alpha contract, а не как финальная persistence-гарантия.
