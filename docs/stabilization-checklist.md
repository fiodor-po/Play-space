# Stabilization Checklist

Этот документ нужен как короткий regression checklist для текущего shared alpha.

## Room switching

- Проверка:
  - перейти из одной комнаты в другую;
  - вернуться обратно;
  - проверить это в двух клиентах.
- Expected behavior:
  - URL и room id в UI меняются сразу;
  - presence предыдущей комнаты не протекает в новую;
  - shared objects показываются только для активной комнаты;
  - локальные interaction state не должны оставаться привязанными к прошлой комнате.

## Refresh

- Проверка:
  - сделать refresh в уже открытой комнате.
- Expected behavior:
  - в том же браузере сохраняется локальная participant session для этой комнаты;
  - клиент заново подключается к current live room state;
  - viewport восстанавливается из локального состояния комнаты;
  - refresh не должен сам по себе ломать shared objects или presence.

## Rejoin

- Проверка:
  - выйти из комнаты и зайти снова тем же браузером;
  - повторить с другим клиентом, если возможно.
- Expected behavior:
  - rejoin в активную live room должен снова показывать текущее live room state;
  - participant session в том же браузере может переиспользоваться для этой комнаты;
  - durable memory после полного ухода всех участников пока не считается гарантированной.

## Presence / cursors

- Проверка:
  - открыть два клиента;
  - подвигать курсоры;
  - подождать и проверить cleanup после ухода клиента.
- Expected behavior:
  - удалённые курсоры и имена появляются только у других участников;
  - локальный курсор не дублируется как remote;
  - после ухода участника его presence исчезает.

## Shared tokens

- Проверка:
  - создать token;
  - подвигать его;
  - удалить его;
  - проверить второй клиент.
- Expected behavior:
  - token creation / move / delete видны всем участникам комнаты;
  - room switching не переносит token в другую комнату.

## Shared images

- Проверка:
  - добавить image;
  - переместить image;
  - изменить размер image;
  - проверить второй клиент.
- Expected behavior:
  - committed image state синхронизируется между участниками;
  - resize и drag не ломают существующие image strokes;
  - image interaction не должна влиять на empty-space panning вне объекта.

## Shared text-cards

- Проверка:
  - создать text-card;
  - перетащить её;
  - отредактировать текст;
  - проверить второй клиент.
- Expected behavior:
  - create / move / edit видны всем участникам комнаты;
  - drag-handle в header продолжает работать как основной способ drag;
  - body double-click продолжает открывать editing.

## Image Draw / Save / Clear

- Проверка:
  - выбрать image;
  - войти в `Draw`;
  - нарисовать stroke;
  - нажать `Save`;
  - затем `Clear`.
- Expected behavior:
  - draw mode включается только явно;
  - stroke появляется на выбранной image;
  - `Save` коммитит результат;
  - `Clear` удаляет strokes у текущей image без побочных эффектов для других объектов.

## Awareness lock

- Проверка:
  - открыть одну и ту же image в двух клиентах;
  - включить draw mode в одном клиенте.
- Expected behavior:
  - второй клиент не должен получать параллельный draw control над той же image;
  - lock должен сниматься после завершения drawing mode или ухода клиента;
  - lock не должен превращаться в persistence-механизм.

## Empty-space panning

- Проверка:
  - drag по пустому месту доски;
  - повторить после selection / deselection;
  - повторить после image interaction.
- Expected behavior:
  - empty-space panning работает вручную и без регрессий;
  - drag по пустому пространству не должен случайно таскать объект;
  - это чувствительный no-go flow: любое отклонение считать регрессией.

## Wheel zoom

- Проверка:
  - zoom in / out колесом мыши;
  - повторить в разных областях доски.
- Expected behavior:
  - zoom остаётся anchored around pointer;
  - zoom не должен ломать selection, panning или overlay editing;
  - после zoom board остаётся usable без скачков и потери control.
