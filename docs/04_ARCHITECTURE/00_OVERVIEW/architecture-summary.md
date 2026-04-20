# Architecture Summary

Status: human-readable architecture summary  
Date: 2026-04-20

## 1. Что это за система сейчас

`play-space-alpha` сейчас — board-first multiplayer alpha на `React + Konva +
Yjs`.

Практически система выглядит так:

- `App` держит room entry, join/leave, participant session и часть top-level
  shell logic;
- `BoardStage` остаётся главным runtime hotspot;
- realtime физически разрезан по slice-модулям для tokens, images, text-cards и
  presence;
- local replica и durable snapshot уже работают как recovery spine;
- governance существует как отдельный runtime layer;
- dice и media уже стали реальными optional layers поверх core board/runtime.

Главная текущая особенность:

- система уже работает как playable alpha;
- система ещё не разложена на финальные room/runtime/document boundaries.

## 2. Куда идём

Целевой слой выглядит так:

- `App` остаётся app shell;
- появляется `RoomRuntime` как room-scoped orchestrator;
- появляется `RoomDocumentV1` как typed shared-content contract;
- transport и persistence становятся adapter layers;
- interaction logic позже уходит в tool engine;
- `BoardStage` становится thin composition shell;
- image binary уходит из room document в asset references.

Главный принцип перехода:

- не делать rewrite;
- делать narrow bridge phases;
- держать текущий продукт стабильным.

## 3. Что считать current truth

Current truth находится здесь:

- `docs/04_ARCHITECTURE/00_OVERVIEW/ARCHITECTURE.md`
- `docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-memory-model.md`
- `docs/04_ARCHITECTURE/03_GOVERNANCE/*`
- `docs/01_CURRENT_STATE/ROADMAP.md`
- `docs/00_AGENT_OS/CURRENT_CONTEXT.md`

Если вопрос про то, как система работает сегодня, побеждает current truth.

## 4. Что считать target truth

Target truth находится здесь:

- `docs/04_ARCHITECTURE/00_OVERVIEW/architecture-layer-map.md`
- `docs/04_ARCHITECTURE/01_RUNTIME/board-runtime-target-architecture.md`
- `docs/04_ARCHITECTURE/01_RUNTIME/board-runtime-staged-roadmap.md`
- `docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-document-persistence-target-memo.md`

Если вопрос про то, к какой архитектуре идём, побеждает target truth.

## 5. Что нельзя перепутать

- current transport split и target logical room document;
- current `BoardStage` hotspot и target `BoardStage` composition shell;
- current recovery bridge и future mature document platform;
- optional media/dice layers и core room/runtime/document spine.

## 6. Как быстро инспектировать архитектуру

Если нужен короткий overview:

1. этот файл;
2. `architecture-layer-map.md`.

Если нужен current runtime:

1. `ARCHITECTURE.md`;
2. `room-memory-model.md`;
3. focused runtime/data/governance doc.

Если нужен target migration path:

1. `architecture-layer-map.md`;
2. `board-runtime-target-architecture.md`;
3. `board-runtime-staged-roadmap.md`.
