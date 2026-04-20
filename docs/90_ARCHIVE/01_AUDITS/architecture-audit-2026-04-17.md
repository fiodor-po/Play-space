# Architecture Audit Report

- Type: architectural audit
- Mode: read-only analysis
- Date: 2026-04-17
- Scope: `play-space-alpha` runtime architecture, module boundaries, changeability, operational fit

## 1. Executive summary

Общее впечатление:

- Архитектура уже поддерживает текущую alpha-фазу и hosted validation.
- Макрограницы системы честные и практичные.
- Главная цена сидит в orchestration hotspots, а не в неверной общей форме системы.

Главные сильные стороны:

- Честный split `frontend / realtime-api / optional LiveKit`.
- Реальная state-модель `live / durable / local replica / awareness`.
- Сильная inspectability для recovery и runtime.
- Частично проведённые extraction boundaries вокруг board runtime и render shell.
- Тестовый контур совпадает с настоящими room/runtime рисками.

Главные архитектурные риски:

- `src/components/BoardStage.tsx` остаётся главным god module и держит слишком много слоёв сразу.
- `src/App.tsx` остаётся вторым lifecycle/controller hotspot.
- `scripts/yjs-dev-server.mjs` совмещает websocket runtime, REST API, durable stores, ops и token routing в одном файле.
- В browser-local persistence одновременно живут текущая replica-модель и legacy `room-snapshot` tail.
- Shared contracts между client, server и tests mostly implicit и partly duplicated.

Общий вывод:

- `mostly fit with constraints`

Уровень уверенности:

- Высокий по system shape, hotspots и module boundaries.
- Средний по edge-cases image/drawing и hosted runtime tails, потому что аудит шёл в режиме read-only analysis без запуска runtime.

## 2. System shape

Основные части системы:

- Frontend app: `src/`
- Realtime/API backend: `scripts/yjs-dev-server.mjs`
- Optional hosted token fallback: `api/livekit/token.ts`
- Optional media layer: `src/media/LiveKitMediaDock.tsx`
- Shared dice layer: `src/dice/DiceSpikeOverlay.tsx`
- Browser-local persistence and room/session state: `src/lib/storage.ts`, `src/lib/roomSession.ts`, `src/lib/roomMetadata.ts`
- Durable snapshot and identity client adapters: `src/lib/durableRoomSnapshot.ts`, `src/lib/durableRoomIdentity.ts`
- E2E smoke harness: `tests/e2e/room-corridors.spec.ts`, `tests/e2e/helpers/roomSmoke.ts`

Ключевые точки входа:

- Frontend bootstrap: `src/main.tsx`
- App routing and room lifecycle shell: `src/App.tsx`
- Board runtime orchestrator: `src/components/BoardStage.tsx`
- Room ops/admin surface: `src/ops/RoomsOpsPage.tsx`
- Realtime/API HTTP entry: `scripts/yjs-dev-server.mjs`
- Hosted SPA + function config: `vercel.json`
- Containerized backend entry: `Dockerfile.realtime-api`

Как части системы связаны:

- `src/App.tsx` определяет route shell, boot gating, room draft/active room model, browser-local participant identity, entry availability, joined-room presence transport и creator sync.
- `src/components/BoardStage.tsx` получает room/session inputs от `App`, поднимает board runtime, wires realtime slices, делает bootstrap/recovery, управляет local replica и durable writes, потом передаёт render в `BoardStageScene`, `BoardStageShellOverlays` и `BoardStageDevToolsContent`.
- `src/board/runtime/useBoardObjectRuntime.ts` даёт mutation corridor для board objects и подключение realtime connections.
- `src/lib/roomTokensRealtime.ts`, `src/lib/roomImagesRealtime.ts`, `src/lib/roomTextCardsRealtime.ts`, `src/lib/roomPresenceRealtime.ts`, `src/lib/roomDiceRealtime.ts` дают per-slice realtime transports поверх Yjs/y-websocket.
- `src/lib/durableRoomSnapshot.ts` и `src/lib/durableRoomIdentity.ts` общаются с backend REST endpoints для durable recovery и room identity.
- `scripts/yjs-dev-server.mjs` держит Yjs docs в памяти, file-backed durable stores и REST endpoints для health, room identity, snapshots, ops, reset policy и LiveKit token minting.

Поток данных и событий:

1. `App` собирает browser-local identity, room draft, active room и boot policy.
2. Joined state передаётся в `BoardStage`.
3. `BoardStage` поднимает realtime slice connections.
4. Shared content приходит через Yjs docs по slice-модулям.
5. `BoardStage` делает local-first / durable-aware bootstrap и вычисляет settled recovery result.
6. Локальные object mutations идут через `useBoardObjectRuntime`.
7. Mutation corridor синхронно обновляет local objects, потом запускает realtime sync и persistence side-effects.
8. Render уходит в отдельные scene/overlay/devtools компоненты.

Граница между клиентом, сервером, realtime, persistence и внешними интеграциями:

- Клиент: `src/App.tsx`, `src/components/BoardStage.tsx`, `src/board/*`, `src/ui/*`
- Realtime transport: `src/lib/room*Realtime.ts`, `src/lib/roomDiceRealtime.ts`
- Persistence adapters: `src/lib/storage.ts`, `src/lib/durableRoomSnapshot.ts`, `src/lib/durableRoomIdentity.ts`
- Сервер: `scripts/yjs-dev-server.mjs`
- External integration: `src/lib/livekit.ts`, `src/media/LiveKitMediaDock.tsx`, `api/livekit/token.ts`
- Deploy/infra: `vercel.json`, `Dockerfile.realtime-api`, `docker-compose.livekit.yml`, wrapper scripts in `scripts/`

## 3. Architectural strengths

### 3.1. Макро-архитектура честная и practical

Что именно хорошо:

- Проект не пытается скрыть topology behind one universal app server.
- Frontend, realtime/API backend и optional LiveKit живут как отдельные runtime surfaces.

Почему это полезно:

- Hosted debugging проще.
- Deploy assumptions проще проверять.
- Hosted alpha shape совпадает с тем, как repo мыслит систему.

На что опираюсь:

- `docs/04_ARCHITECTURE/00_OVERVIEW/ARCHITECTURE.md`
- `docs/05_OPERATIONS_AND_VALIDATION/02_DEPLOYMENT/hosted-alpha-deployment-plan.md`
- `scripts/yjs-dev-server.mjs`
- `vercel.json`
- `Dockerfile.realtime-api`

### 3.2. State taxonomy проведена через код, а не только через docs

Что именно хорошо:

- Live shared state, awareness, durable identity, durable snapshot и browser-local convenience state разведены и названы явно.

Почему это полезно:

- Recovery и room lifecycle обсуждаются на конкретных слоях.
- Creator-color fallback и participant appearance имеют понятное место в модели.

На что опираюсь:

- `docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-memory-model.md`
- `docs/03_PRODUCT/01_FLOWS/room-behavior-spec.md`
- `src/lib/roomPresenceRealtime.ts`
- `src/lib/durableRoomSnapshot.ts`
- `src/lib/durableRoomIdentity.ts`
- `src/lib/storage.ts`

### 3.3. Вокруг `BoardStage` уже появились полезные extraction boundaries

Что именно хорошо:

- Render layer частично вынесен в `src/board/components/BoardStageScene.tsx`
- HTML overlays вынесены в `src/board/components/BoardStageShellOverlays.tsx`
- Dev/debug UI вынесен в `src/board/components/BoardStageDevToolsContent.tsx`
- View-model shaping вынесен в `src/board/viewModels/boardStageInspectability.ts`
- Object mutation/runtime corridor вынесен в `src/board/runtime/useBoardObjectRuntime.ts`

Почему это полезно:

- Render/UI cleanup можно делать без немедленного переписывания всего orchestrator.
- Структура уже движется в сторону orchestration shell + render surfaces.

На что опираюсь:

- `src/components/BoardStage.tsx`
- `src/board/components/BoardStageScene.tsx`
- `src/board/components/BoardStageShellOverlays.tsx`
- `src/board/components/BoardStageDevToolsContent.tsx`
- `src/board/runtime/useBoardObjectRuntime.ts`

### 3.4. Inspectability здесь сильнее среднего для alpha-проекта

Что именно хорошо:

- Recovery/debug contract виден в board devtools.
- Backend даёт ops summary/detail по rooms.
- Client runtime config логируется явно.

Почему это полезно:

- Архитектурные и runtime-level изменения можно проверять не только глазами.
- Hosted/runtime debugging идёт быстрее.

На что опираюсь:

- `src/board/components/BoardStageDevToolsContent.tsx`
- `src/ops/RoomsOpsPage.tsx`
- `src/lib/roomOpsApi.ts`
- `scripts/yjs-dev-server.mjs`
- `src/lib/runtimeConfig.ts`

### 3.5. Smoke strategy совпадает с реальным risk surface

Что именно хорошо:

- Repo делает ставку на corridor-level room/runtime/recovery checks вместо декоративного набора unit tests.

Почему это полезно:

- Для board-first multiplayer alpha это даёт больше сигнала, чем поверхностное покрытие без runtime truth.

На что опираюсь:

- `docs/05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/playwright-smoke-harness.md`
- `tests/e2e/room-corridors.spec.ts`
- `tests/e2e/helpers/roomSmoke.ts`

## 4. Architectural risks

### 4.1. `BoardStage` остаётся главным god module

Проблема:

- `BoardStage` одновременно держит viewport, selection, pan/zoom, draw/edit flows, bootstrap/recovery, participant appearance persistence, local replica writes, durable writes, realtime slice wiring, governance summaries и render handoff.

Где проявляется:

- `src/components/BoardStage.tsx`
- размер файла: 4513 строк
- bootstrap/recovery corridor: `src/components/BoardStage.tsx`
- persistence corridor: `src/components/BoardStage.tsx`
- final render handoff: `src/components/BoardStage.tsx`

Практическая цена:

- Любой нетривиальный pass по lifecycle, persistence или image behavior имеет большой blast radius.
- Регрессии в pan/zoom, image draw/resize и recovery harder to isolate.

Urgency:

- `high`

### 4.2. `App` остаётся lifecycle/controller hotspot

Проблема:

- `App` держит route shell, reset-policy boot, room draft vs joined state, browser-local participant identity, entry availability, presence carrier policy, creator sync и local-storage subscriptions.

Где проявляется:

- `src/App.tsx`
- размер файла: 1241 строка

Практическая цена:

- Room-flow changes затрагивают сразу несколько semantic corridors.
- Join/leave/rejoin behavior harder to evolve narrow slices.

Urgency:

- `medium-high`

### 4.3. Backend слишком концентрирован и не покрыт TypeScript build

Проблема:

- `scripts/yjs-dev-server.mjs` совмещает websocket runtime, REST router, durable snapshot store, durable identity store, ops endpoints, reset policy и LiveKit token route.
- Этот главный backend файл не входит в `tsconfig.node.json`.

Где проявляется:

- `scripts/yjs-dev-server.mjs`
- `tsconfig.node.json`

Практическая цена:

- Backend changes менее защищены статической проверкой.
- Ops/API/runtime bugs harder to localize and refactor safely.

Urgency:

- `medium`

### 4.4. Browser-local persistence содержит active model + legacy tail

Проблема:

- `src/lib/storage.ts` держит и текущую IndexedDB replica-модель, и legacy `room-snapshot`, и старые helper branches.
- `BoardStage` всё ещё пишет в legacy `room-snapshot`.

Где проявляется:

- `src/lib/storage.ts`
- `src/components/BoardStage.tsx`

Практическая цена:

- Persistence mental model сложнее, чем текущая runtime truth.
- Есть шанс держать устаревшие side effects дольше, чем нужно.

Urgency:

- `medium-high`

### 4.5. Shared contracts между client, server и tests mostly implicit

Проблема:

- Room ID normalization, Yjs doc prefixes, storage keys и часть recovery/debug vocabulary дублируются между слоями.

Где проявляется:

- `src/lib/roomId.ts`
- `scripts/yjs-dev-server.mjs`
- `tests/e2e/helpers/roomSmoke.ts`

Практическая цена:

- Drift bugs могут проявляться только на smoke/manual stage.
- Rename или cleanup runtime vocabulary опасно делать локально в одном месте.

Urgency:

- `medium`

## 5. Coupling and boundaries

Разделение ответственности:

- Макрограницы читаются хорошо.
- Локальные boundaries лучше всего оформлены в небольших `src/lib/*` и object modules.
- Большая часть высокой связности собрана в нескольких integration surfaces.

Cohesion:

- Хорошая cohesion в:
  - `src/lib/governance.ts`
  - `src/lib/governancePolicy.ts`
  - `src/lib/participantColors.ts`
  - `src/lib/roomOpsApi.ts`
  - `src/board/objects/token/*`
  - `src/board/objects/noteCard/*`

Высокая coupling concentration:

- `src/components/BoardStage.tsx`
- `src/App.tsx`
- `scripts/yjs-dev-server.mjs`
- `src/lib/storage.ts`

God modules:

- Да, есть:
  - `BoardStage`
  - `App`
  - `yjs-dev-server.mjs`
  - `storage.ts`

Понятность границ между слоями:

- Между frontend и backend граница понятна.
- Между board runtime и render shell граница уже намечена, но runtime остаётся перегруженным.
- Между local replica, durable snapshot и legacy storage граница формально есть, но кодовая поверхность ещё шире, чем нужно.

Неявные зависимости и кросс-срезные эффекты:

- Recovery labels и inspectability contract связаны со smoke suite.
- Storage key conventions partly shared by convention, not by imported contract.
- Room lifecycle semantics завязаны на browser-local storage, presence transport, creator sync и room metadata одновременно.

## 6. Changeability

Насколько легко делать новые фичи:

- Новые narrow UI passes делать умеренно легко.
- Новые session/runtime semantics делать заметно дороже.
- New shared object kind сейчас будет дорогим изменением.

Какие типы изменений будут простыми:

- UI shell changes
- Devtools/ops UI changes
- Narrow participant/governance/color cleanup
- Deploy/config toggles
- Token/note render-level refinements

Какие типы изменений будут опасными или дорогими:

- Room bootstrap/recovery changes
- Join/leave/rejoin model changes
- Image draw/resize/preview behavior
- Empty-space panning and wheel zoom
- Anything that touches `local replica + durable snapshot + Yjs slices` together

Какие участки сильнее всего тормозят дальнейшее развитие:

- `src/components/BoardStage.tsx`
- `src/App.tsx`
- image-centric behavior split across:
  - `src/lib/boardImage.ts`
  - `src/lib/roomImagesRealtime.ts`
  - `src/board/components/BoardStageScene.tsx`
  - `src/components/BoardStage.tsx`

Вывод по changeability:

- Архитектура уже хорошо поддерживает stabilization, hosted validation и honest alpha iteration.
- Архитектура хуже поддерживает broad capability expansion without focused cleanup.

## 7. Operational reality

Локальный запуск:

- Сильная сторона.
- `docs/05_OPERATIONS_AND_VALIDATION/01_LOCAL_DEV/dev-workflows.md`, `scripts/dev-local.sh` и `scripts/dev-lan.sh` дают честный operational entry path.

Dev workflow:

- Repo думает о workflow серьёзно.
- Wrapper scripts, docs и validation baseline совпадают.

Debugging:

- Сильная сторона.
- Есть client runtime logging, board devtools, room ops page и backend health/ops endpoints.

Config/env handling:

- Practical and mostly clear.
- Derived runtime URL fallbacks в `src/lib/runtimeConfig.ts` ускоряют local/dev path.
- Эти fallback assumptions могут скрывать misconfig until runtime.

Testing:

- Local machine gate aligned with product risk.
- Main coverage идёт через Playwright smoke corridors.
- Wide automated safety net beyond those corridors ограничен.

Build/deploy shape:

- Простая и уместная для alpha.
- Vercel-style static frontend + long-running Node backend + optional separate LiveKit остаётся честной формой.

Observability:

- Для alpha достаточна.
- Для deeper backend diagnosis ограничена logs/ops/debug surfaces.
- Richer server-side metrics/tracing я не увидел.

Operational fit verdict:

- Архитектура дружит с реальной разработкой лучше, чем со строгой layered purity.
- Для текущей стадии это хороший trade-off.

## 8. Priority recommendations

### Do now

#### 1. Убрать или изолировать legacy `room-snapshot` write tail

- Что сделать: вынести `saveRoomSnapshot` и его вызовы из активного runtime path или пометить как isolated legacy cleanup target.
- Зачем: current recovery semantics уже не читают этот слой как главный source.
- Ожидаемый эффект: меньше accidental complexity в persistence story.
- Тип: `simplification`

#### 2. Централизовать shared cross-layer contracts

- Что сделать: собрать в один shared contract module room-id normalization, storage key builders, Yjs doc prefixes и main runtime labels.
- Зачем: снизить drift между client, server и tests.
- Ожидаемый эффект: safer cleanup and rename passes.
- Тип: `boundary clarification`

### Do next

#### 3. Вынести из `BoardStage` один runtime-only helper без изменения поведения

- Что сделать: лучше всего вынести bootstrap/recovery coordination или durable write scheduling.
- Зачем: разгрузить главный orchestration hotspot.
- Ожидаемый эффект: меньший blast radius для следующих passes.
- Тип: `cleanup`

#### 4. Разбить `scripts/yjs-dev-server.mjs` на route/store helpers при сохранении одного процесса

- Что сделать: выделить route handlers и durable store adapters.
- Зачем: текущая backend shape уже подходит фазе, но файл слишком концентрирован.
- Ожидаемый эффект: проще backend debugging и narrow API changes.
- Тип: `boundary clarification`

### Later / only if needed

#### 5. Довести image ownership до уровня token/note modules

- Что сделать: ввести более явную image-domain boundary только перед следующим image-heavy chapter.
- Зачем: image behavior сейчас сильнее всего размазан.
- Ожидаемый эффект: дешевле будущие image feature passes.
- Тип: `structural change`

#### 6. Менять file-backed durable store только при реальной потребности в deploy-stable durability

- Что сделать: не трогать infra layer раньше product signal.
- Зачем: current store соответствует честной alpha reality.
- Ожидаемый эффект: меньше premature infra work.
- Тип: `structural change`

## 9. Suggested next step

Лучший следующий шаг:

- закрыть `legacy room-snapshot write-cache cleanup` как отдельный узкий pass в:
  - `src/lib/storage.ts`
  - `src/components/BoardStage.tsx`
  - связанных smoke/docs references

Почему это лучший следующий шаг:

- шаг узкий;
- шаг безопасный;
- шаг даёт высокий signal-to-effort ratio;
- шаг упрощает persistence story без большого рефакторинга;
- шаг убирает уже устаревший architectural tail, а не открывает новую широкую migration wave.
