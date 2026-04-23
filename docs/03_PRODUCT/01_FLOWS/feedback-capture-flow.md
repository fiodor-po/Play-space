# In-room feedback capture

## 1. Назначение

Demo 2 даёт игроку короткий путь для bug report или feedback прямо из room card.
Игрок остаётся в текущей комнате, а команда получает минимальный runtime context
для последующего разбора.

## 2. Capture payload

Frontend отправляет `POST /api/feedback` в текущий API runtime.

Payload содержит:

- `type`: `bug` или `feedback`;
- `message`;
- `roomId`;
- participant `id`, `name`, `color`;
- `appVersionLabel`;
- `buildId`;
- текущий path и query;
- browser user agent;
- client timestamp.
- `clientDiagnostics`:
  - `viewport`: `width`, `height`, `devicePixelRatio`;
  - `browser`: `language`, `platform`, `online`;
  - `room`: `roomId`, `participantId`, `participantName`, `participantColor`,
    `isRoomOwner`, `participantCount`, `objectCounts.tokens`,
    `objectCounts.images`, `objectCounts.textCards`;
  - `media`: `enabled`, `connectionState`, `micEnabled`, `cameraEnabled`;
  - `runtime`: already-available client runtime signals only;
  - `recentErrors`: in-memory ring buffer of the latest session-side
    `window error` and `unhandledrejection` entries, newest tail capped at `20`.

`appVersionLabel` identifies the release line.
Resolution order:

- `VITE_APP_VERSION_LABEL`
- package version fallback injected at build time

`buildId` identifies the exact build/deploy when hosted CI injects it.
Resolution order:

- `VITE_APP_BUILD_ID`
- local/dev fallback: `dev-local:<package-version>`
- hosted fallback without deploy wiring: `hosted-release-only:<package-version>`

The hosted fallback is deliberately weaker than an exact deploy id.
It identifies only the release line and explicitly signals missing deploy-level
build wiring.

Server добавляет `id`, `receivedAt` и `schemaVersion`.

## 3. Local storage

Local runtime server пишет append-only JSONL файл:

`/.runtime-data/feedback.jsonl`

`.runtime-data/` уже игнорируется Git. Этот файл считается operational state,
как локальные room snapshots и room identities.

## 4. Ops read path

Runtime server даёт ops-only read endpoint:

`GET /api/ops/feedback`

Доступ идёт через `x-play-space-ops-key`, тот же ключ, что и room ops routes.

Поддерживаемые query params:

- `limit`
- `cursor`
- `type=bug|feedback`
- `roomId`
- `participantId`
- `since`

Ответ идёт newest-first и возвращает `items`, `totalCount` и `nextCursor`.
Это канонический machine-readable путь для agent triage, автоматических summary
и дальнейшей маршрутизации в внешние системы.

`cursor` теперь record-based, а не offset-based.
Формат:

- `<receivedAt>|<id>`

Пример:

- `2026-04-23T11:03:18.506Z|fbk_094bf573-dfae-46b4-a068-937a09e07e01`

Ordering contract:

- primary sort: `receivedAt` descending;
- tie-breaker: `id` descending in the same `localeCompare` order that server
  already uses for `newest-first`.

`nextCursor` всегда ссылается на последнюю запись текущей page.
Следующий запрос с этим курсором возвращает только записи строго старее этой
cursor-point по этому ordering contract.

Невалидный `cursor` получает `400` с code `INVALID_FEEDBACK_CURSOR`.

Read path stays backward-compatible with older JSONL rows.
Legacy rows without `clientDiagnostics` or `buildId` still read successfully.

## 5. Scope

Текущая версия хранит feedback first-party в runtime server.
Внешняя маршрутизация в GitHub, Sentry, Linear, Discord или другой сервис
отложена до отдельного integration pass.

Hosted behavior зависит от того, есть ли у запущенного runtime server writable
filesystem и сохраняется ли он между redeploy. Для Demo 2 эта версия считается
local-compatible capture layer.
