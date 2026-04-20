# Board Runtime Target Architecture

Status: strategist architecture memo  
Date: 2026-04-20

Этот документ сохраняет текущий архитектурный вывод по `play-space-alpha`.
Он задаёт целевую форму runtime без немедленного broad rewrite.

## Зачем нужен этот документ

Проект уже перерос стадию, где достаточно держать архитектуру в голове.

Сейчас важно зафиксировать:

- что уже есть в runtime;
- где проходят реальные границы системы;
- какая целевая архитектура лучше всего подходит продукту;
- какие практики из whiteboard/multiplayer систем стоит перенять;
- какой порядок миграции остаётся безопасным для `play-space-alpha`.

## Текущий вывод

Лучшая архитектура для `play-space-alpha` — room-scoped document runtime на
текущем стеке `React + Konva + Yjs`, где:

- `App` становится shell слоем;
- `BoardStage` становится composition shell;
- room lifecycle и recovery живут в отдельном `RoomRuntime`;
- board data живёт в typed document store;
- tools/interactions живут отдельно от render tree;
- assets живут вне collaborative document;
- diagnostics являются first-class слоем, а не побочным логом.

Этот вывод поддерживает продуктовую рамку проекта:

- board-first;
- drag-and-drop-first;
- multiplayer readability;
- narrow practical progress без тяжёлого VTT с переусложнённой моделью.

## Что уже хорошо в текущем состоянии

- `App.tsx` уже отделяет join/session shell от `BoardStage`.
- `BoardStageScene`, `BoardStageShellOverlays` и
  `BoardStageDevToolsContent` уже задают правильное render/UI разделение.
- `useBoardObjectRuntime` уже выделяет часть board mutation/runtime слоя.
- room-open inspectability уже начата:
  - в `BoardStage` есть phase model;
  - в Dev tools уже есть `Room open phases`.
- realtime уже частично разделён по slice-модулям:
  - tokens
  - images
  - text-cards
  - presence
- project already uses durable snapshot and local replica как room-level recovery
  spine.

## Главные проблемы текущего состояния

### 1. `BoardStage` остаётся runtime-монолитом

`src/components/BoardStage.tsx` держит одновременно:

- room bootstrap;
- recovery;
- realtime wiring;
- persistence writes;
- board mutations;
- interaction state;
- Konva event handling;
- render composition;
- debug/inspectability wiring.

Это замедляет safe refactor и усложняет reasoning по room-scoped behavior.

### 2. Document model слишком слабый

`BoardObject` в `src/types/board.ts` остаётся broad union-shaped object:

- image-specific fields;
- token fields;
- note-card fields;
- attachment fields;
- creator metadata.

Эта форма удобна на старте, но плохо подходит для:

- schema evolution;
- validation;
- migrations;
- server/client compatibility;
- per-object ownership.

### 3. Mutation layer слишком близко к transport layer

Local board update сейчас часто сразу решает:

- какой shared slice синкать;
- какой durable slice писать;
- как соединить local mutation с transport side effects.

Такой слой работает, но мешает отдельно развивать:

- document commands;
- transport adapters;
- persistence adapters.

### 4. Asset path слишком тяжёлый для document layer

Image binary сейчас попадает в room object как `data:` URL.

Это ухудшает:

- sync payload size;
- local replica size;
- durable snapshot size;
- hosted durability story;
- future asset lifecycle.

### 5. Room open уже фазирован, но ещё не стал отдельным runtime owner

Фазы room open уже существуют, но сейчас они остаются частью `BoardStage`
effect graph.

Система уже умеет различать:

- room activation;
- shared transport attach;
- shared bootstrap sync;
- local replica read;
- durable snapshot read;
- bootstrap decision;
- scene usable;
- room settled.

Следующий зрелый шаг — вынести это в `RoomRuntime`, а не наращивать новые
условия прямо в `BoardStage`.

## Best practices, которые подходят проекту

### 1. Один authoritative room runtime на document

Практика из tldraw sync и Figma:

- room должен иметь один логический document runtime;
- backend ownership должен быть room-scoped;
- persisted snapshot должен принадлежать document schema;
- client и server должны говорить на одной схеме и на совместимых версиях.

### 2. Schema, validation, migrations

Практика из tldraw:

- collaborative data должен иметь typed schema;
- schema должен поддерживать migrations;
- server-side validation защищает от bad data;
- version drift между client и server должен быть видимым и управляемым.

### 3. Presence отдельно от persisted state

Практика из Yjs Awareness и Liveblocks:

- presence является ephemeral state;
- cursor, activity, temporary locks и lightweight session hints живут отдельно
  от persistent document;
- presence не should become room persistence layer.

### 4. Offline/local replica должен использовать тот же document contract

Практика из Yjs offline support:

- local offline replica полезен, когда он хранит тот же collaborative document
  contract;
- local persistence и network provider должны mesh together, а не выглядеть как
  два разных формата с неявной конвертацией.

### 5. Asset storage отдельно от document state

Практика из tldraw sync:

- большие binary assets живут в отдельном asset store;
- document хранит asset reference, metadata и geometry;
- sync engine работает быстрее и надёжнее, когда blobs не зашиты в основной
  collaborative state.

### 6. Tool engine отдельно от renderers

Практика из mature whiteboard systems:

- render layer рисует;
- tool/interactions layer решает selection, drag, transform, draw, edit;
- cross-object behaviors не живут внутри renderer branches.

### 7. Diagnostics first

Практика из production multiplayer systems:

- complex async corridor должен иметь explicit phase model;
- user-facing status строится поверх reliable runtime state;
- inspectability идёт раньше optimistic UI wording.

## Целевая архитектура

### A. App shell

Ответственность:

- route / room id;
- join / leave flow;
- participant session bootstrap;
- env/runtime gating;
- top-level feature gates.

Файлы уровня:

- `src/App.tsx`
- `src/app/*`

### B. Room runtime

Ответственность:

- room activation;
- transport lifecycle;
- local replica lifecycle;
- durable recovery lifecycle;
- room-open phase model;
- room health and diagnostics;
- room-scoped access to document runtime.

Это главный orchestrator for room lifecycle.

### C. Board document store

Ответственность:

- typed records;
- schema version;
- migrations;
- validation;
- document queries/selectors;
- document commands.

Это source of truth для persisted/shared board state.

### D. Transport adapters

Ответственность:

- realtime attach/detach;
- inbound remote changes;
- outbound local changes;
- presence updates;
- transport status and failure reasons.

Транспорт должен обслуживать document runtime, а не владеть продуктовой
семантикой.

### E. Persistence adapters

Ответственность:

- local replica read/write;
- durable snapshot read/write;
- revision handoff;
- snapshot import/export.

Local и durable persistence должны использовать один document contract.

### F. Tool engine

Ответственность:

- selection;
- pan / zoom;
- drag / drop;
- transform;
- image draw mode;
- note editing;
- keyboard shortcuts;
- scene-level interaction arbitration.

Tool engine должен говорить с document commands и awareness helpers.

### G. Awareness/presence layer

Ответственность:

- cursors;
- participant activity;
- temporary locks;
- temporary previews;
- lightweight remote interaction hints.

Этот слой остаётся ephemeral.

### H. Scene / UI composition

Ответственность:

- Konva scene render;
- HTML overlays;
- shell panels;
- Dev tools and inspectability UI.

`BoardStage` в target state остаётся thin composition layer.

## Целевая модель данных

### Document records

Минимальный target набор:

- `roomDocument`
- `imageObject`
- `tokenObject`
- `noteCardObject`
- `participantAppearance`
- later:
  - `binding`
  - `group`
  - `boardAssetRef`

### Awareness state

Отдельно от document:

- cursor
- current tool or activity hint
- temporary draw lock
- temporary drag/transform preview
- optional session-facing hints

### Local UI state

Отдельно от document:

- selected object
- open panel state
- note editor overlay state
- viewport gesture session
- temporary input state

### Local interaction state

Отдельно от document и UI shell:

- active drag
- active transform
- active drawing stroke
- interaction arbitration

## Целевая модель image assets

Image object должен хранить:

- `assetId`
- label
- geometry
- creator metadata
- draw stroke metadata
- resolved preview/source refs

Binary image data должен жить в отдельном asset store.

Это даёт:

- smaller sync payloads;
- smaller local replica;
- smaller durable snapshot;
- safer hosted/runtime behavior;
- cleaner future asset lifecycle.

## Целевая модель room open

Room open должен стать явным runtime pipeline.

Крупные фазы:

1. `room-activation`
2. `shared-transport-attach`
3. `shared-bootstrap-sync`
4. `local-replica-read`
5. `durable-snapshot-read`
6. `bootstrap-decision`
7. `scene-usable`
8. `room-settled`

Для каждой фазы target state:

- `idle`
- `started`
- `ready`
- `missing`
- `failed`
- `skipped`

Плюс room-scoped detail:

- detail string;
- started/updated timestamps;
- reason code where useful.

User-facing loading/recovery copy — later derivative layer.

## Целевая структура каталогов

```text
src/
  app/
    room-routing/
    join-flow/
    session-shell/
  room/
    runtime/
      RoomRuntime.ts
      roomOpenPhases.ts
      roomHealth.ts
    transport/
      roomRealtimeAdapter.ts
      roomPresenceAdapter.ts
    persistence/
      localReplicaAdapter.ts
      durableSnapshotAdapter.ts
    diagnostics/
      roomDiagnosticsViewModel.ts
  board/
    document/
      schema/
      migrations/
      records/
      selectors/
      commands/
    objects/
      image/
      token/
      noteCard/
    tools/
      selection/
      viewport/
      drag/
      transform/
      draw/
      noteEdit/
    awareness/
      cursorPresence/
      interactionLocks/
      remotePreviews/
    runtime/
      boardDocumentRuntime.ts
      boardCommandBus.ts
    viewModels/
    components/
      scene/
      overlays/
      devtools/
  assets/
    imageAssets/
```

Это target tree. Он задаёт ownership, а не immediate move-all-at-once plan.

## Что я не рекомендую

### 1. Немедленный переход на новый canvas stack

Текущий `Konva/react-konva` stack уже встроен глубоко в repo.
Смена canvas engine сейчас даст дорогую миграцию и слабый near-term product gain.

### 2. Немедленный переход на новый sync vendor

`Yjs` уже deeply integrated и соответствует collaborative whiteboard use case.
Правильнее улучшить ownership, schema и adapters поверх него.

### 3. Один большой rewrite `BoardStage`

Такой rewrite почти наверняка сломает:

- empty-space pan;
- image drag/resize/draw;
- room bootstrap/recovery;
- mixed hosted/local runtime behavior.

### 4. User-facing loading UI до inspectability baseline

Этот порядок уже показал риск.
Сначала room-open runtime должен стать diagnosable.

## Рекомендуемый порядок миграции

### Phase 1. Room-open diagnostics baseline

Сделать room-open phase model самостоятельным runtime concern.

### Phase 2. Room runtime extraction

Вынести room lifecycle, transport attach, recovery orchestration и diagnostics
из `BoardStage` в room-scoped coordinator.

### Phase 3. Document schema boundary

Ввести typed document record model и migration-friendly schema layer поверх
текущих board objects.

### Phase 4. Tool engine separation

Вынести selection / drag / transform / draw / note-edit из render orchestration
в отдельные tool modules.

### Phase 5. Asset store extraction

Увести image binary из room object в external asset pipeline.

### Phase 6. Transport topology cleanup

Переходить от hand-wired slice coupling к одному логическому room document
runtime с адаптерами для shared state и presence.

## Как это соотносится с текущим roadmap

Этот target поддерживает текущий active chapter:

- `room loading progress and async-state polish`

Через новый framing:

- room-open observability;
- phase-level diagnostics;
- inspectability before UI messaging.

Этот target не требует broad rewrite прямо сейчас.
Он задаёт направление для следующих safe slices.

## Внешние источники

- Figma engineering:
  - https://www.figma.com/blog/how-figmas-multiplayer-technology-works/
  - https://www.figma.com/blog/how-figma-draws-inspiration-from-the-gaming-world/
- tldraw:
  - https://tldraw.dev/docs/sync
  - https://tldraw.dev/reference/sync/useSync
  - https://tldraw.dev/reference/store/Store
- Yjs:
  - https://docs.yjs.dev/api/about-awareness
  - https://docs.yjs.dev/getting-started/allowing-offline-editing
- Liveblocks:
  - https://liveblocks.io/docs/ready-made-features/multiplayer/sync-engine/liveblocks-storage
  - https://liveblocks.io/docs/platform/data-storage

