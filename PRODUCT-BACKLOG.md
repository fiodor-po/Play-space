# play-space-alpha — product backlog

## 1. Роль документа

`PRODUCT-BACKLOG.md` хранит живой список задач, rough edges, идей и follow-up work.

Этот документ подходит для capture новых задач в момент их появления.
Он не задаёт execution order и не заменяет `ROADMAP.md`.

Использование:

- добавлять сюда новые задачи сразу, когда они появляются;
- держать здесь и срочные, и отложенные задачи;
- переносить отсюда задачи в `ROADMAP.md`, когда по ним уже выбран checkpoint, chapter или sprint.

## 2. Как читать backlog

Каждый пункт может иметь:

- краткое название;
- короткое пояснение;
- теги;
- optional note про текущее состояние.

Рекомендуемые time tags:

- `#now`
- `#soon`
- `#later`
- `#someday`

## 3. Now

- `Board navigation and secondary-click behavior`
  Переделать навигацию по доске и поведение primary / secondary click и связанных pointer interactions.
  Tags: `#now`

- `Mobile experience`
  Сделать рабочий и целостный mobile experience для входа в комнату, доски, controls и media surfaces.
  Tags: `#now`

- `Room loading progress and async-state polish`
  Добавить честные loading / settling states и цельный прогресс открытия комнаты на entry, room open, recovery, media и других async поверхностях.
  Tags: `#now`

- `Room entry empty-name default without URL room`
  Если room не задана в URL, поле имени комнаты на entry должно стартовать пустым, а не со значением `alpha`.
  Tags: `#now`

## 4. Soon

- `Legacy room-snapshot write-cache cleanup`
  Убрать или изолировать legacy `room-snapshot` write tail, чтобы упростить persistence story без нового широкого migration pass.
  Tags: `#soon`

## 5. Later

- `Tab-close room-occupancy liveness`
  После обычного закрытия вкладки stale `live-occupancy` может висеть дольше, чем нужно. `Leave room` уже ведёт себя правильно.
  Tags: `#later`

- `Large-image add benchmark`
  Снять baseline для добавления тяжёлых изображений, включая около `40 MB`, и отдельно замерить visible start, usable preview, full ready и отзывчивость доски.
  Tags: `#later`

- `Large-image add optimization`
  После benchmark решить, нужен ли узкий optimization pass вокруг preview generation, decoding, sequencing, compression-resize или loading affordances.
  Tags: `#later`

- `Hydration rough-edge polish after closed checkpoint`
  `scene-usable` checkpoint закрыт, staged room-open waves больше не блокируют chapter. Позже можно отдельно вернуться к polish loading states и delayed surfaces.
  Tags: `#later`

- `Shared cross-layer contracts cleanup`
  Централизовать room-id normalization, storage key builders, Yjs doc prefixes и main runtime labels. Source: [docs/architecture-audit-2026-04-17.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/architecture-audit-2026-04-17.md)
  Tags: `#later`

- `BoardStage runtime helper extraction`
  Вынести из `BoardStage` один runtime-only helper без изменения поведения, лучше всего вокруг bootstrap/recovery coordination или durable write scheduling. Source: [docs/architecture-audit-2026-04-17.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/architecture-audit-2026-04-17.md)
  Tags: `#later`

- `yjs-dev-server route/store helper split`
  Разбить `scripts/yjs-dev-server.mjs` на route/store helpers при сохранении одного процесса. Source: [docs/architecture-audit-2026-04-17.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/architecture-audit-2026-04-17.md)
  Tags: `#later`

- `Image ownership boundary cleanup before next image-heavy chapter`
  Довести image ownership до более явной domain boundary перед следующим image-heavy chapter. Source: [docs/architecture-audit-2026-04-17.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/architecture-audit-2026-04-17.md)
  Tags: `#later`

- `Deploy-stable durable store only on product signal`
  Вернуться к durable infra layer только при реальной потребности в deploy-stable durability. Source: [docs/architecture-audit-2026-04-17.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/architecture-audit-2026-04-17.md)
  Tags: `#later`

- `Follow-up по комментариям Виталика`
  Зафиксировать отдельный follow-up block из двух связанных частей:
  1. настроить security agent для проекта как отдельный operational lane;
  2. разложить проект на архитектурные слои и описать работу слоёв диаграммами.
  Tags: `#later`

- `Alpha 2 product requirements`
  Сформулировать продуктовые требования для alpha 2.
  Tags: `#later`

- `Image drawing rework`
  Переделать рисование на картинках.
  Tags: `#later`

- `Additional media types`
  Добавить дополнительные типы медиа.
  Tags: `#later`

- `Dice experience`
  Довести кубики до цельного и удобного experience на уровне interaction, presentation и session use.
  Tags: `#later`

- `Media dock concept test`
  Протестировать product idea с dock и понять, даёт ли она хороший session flow.
  Tags: `#later`

- `Observer role for clean session recording and broadcast`
  Добавить observer role для чистой записи и трансляции сессий без обычного participant presence и interaction footprint.
  Tags: `#later`

- `Room themes and settings`
  Добавить темы и настройки комнаты как отдельный product layer.
  Tags: `#later`

- `Video layer polish`
  Довести video layer до хорошего состояния: управление размером и позицией preview, polishing внешнего вида.
  Tags: `#later`

## 6. Someday

- `Media-centered session polish`
  Уточнить поведение доски как staging space вокруг media-backed surfaces без открытия broad media-platform rewrite.
  Tags: `#someday`

- `Dice tray and residual dice polish`
  Вернуться к небольшим UX улучшениям dice layer после более важных runtime и session-flow задач.
  Tags: `#someday`

- `Media dock UX polish`
  Media dock остаётся spike-level. Позже можно привести её к более цельному session UX.
  Tags: `#someday`

## 7. Open follow-ups

- `Hosted room durability across redeploy`
  Current hosted snapshot persistence survives restart but not redeploy. Это known limitation текущего hosted alpha.
  Tags: `#later`

- `Hosted playable-session rough edges`
  Держать живой список rough edges, которые проявляются только на реальном hosted stack и не требуют немедленного runtime chapter.
  Tags: `#later`
