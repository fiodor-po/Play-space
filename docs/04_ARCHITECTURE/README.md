# 04_ARCHITECTURE

Здесь живёт архитектурная карта проекта.

Целевой принцип:

- один overview для всей системы
- отдельное описание слоёв
- отдельные cross-cutting темы
- отдельные временные architecture chapters

Текущий canonical набор для этого раздела:

- [`docs/04_ARCHITECTURE/00_OVERVIEW/ARCHITECTURE.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/00_OVERVIEW/ARCHITECTURE.md)
- [`docs/04_ARCHITECTURE/00_OVERVIEW/architecture-layer-map.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/00_OVERVIEW/architecture-layer-map.md)
- [`docs/04_ARCHITECTURE/00_OVERVIEW/architecture-summary.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/00_OVERVIEW/architecture-summary.md)
- [`docs/04_ARCHITECTURE/01_RUNTIME/board-runtime-target-architecture.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/01_RUNTIME/board-runtime-target-architecture.md)
- [`docs/04_ARCHITECTURE/01_RUNTIME/board-runtime-staged-roadmap.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/01_RUNTIME/board-runtime-staged-roadmap.md)
- [`docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-memory-model.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-memory-model.md)
- [`docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-document-persistence-target-memo.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-document-persistence-target-memo.md)

Правило раздела:

- runtime boundaries, persistence, sync, state categories и governance хранить здесь;
- product semantics и user-facing flow truth хранить в `docs/03_PRODUCT/`;
- active chapter docs хранить в `docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/`;
- topic-scoped `design`, `memo`, `plan`, `audit` и `map` docs можно держать здесь как supporting architecture docs, пока они поддерживают живой architectural topic и не притворяются главным current source.
