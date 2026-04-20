# Demo Requirements And Release Prep Chapter

Status: active chapter control doc  
Scope: demo scenario, release requirements, allowed fix scope on current architecture

Этот chapter фиксирует правила подготовки новой демки.

## 1. Chapter goal

Подготовить один ясный набор требований к демке и к её релизу:

- определить demo scenario;
- определить must-have flows;
- определить допустимые rough edges;
- определить release gates;
- определить, какие narrow fixes можно делать на текущей архитектуре до релиза.

## 2. In scope

- demo scenario и target audience;
- must-have room, board, media и dice flows для демки;
- release checklist и release gates;
- список rough edges, которые блокируют demo release;
- список safe pre-release fixes на текущей архитектуре;
- правило возврата к архитектурному migration track после demo release.

## 3. Explicitly out of scope

- `RoomRuntime` extraction;
- `RoomDocumentV1` implementation;
- asset-reference migration;
- broad runtime refactor;
- broad `BoardStage` rewrite;
- новый migration chapter до demo release;
- feature expansion, которая не нужна для demo scenario.

## 4. Canonical inputs

- `docs/03_PRODUCT/00_OVERVIEW/PRODUCT_FOUNDATION.md`
- `docs/01_CURRENT_STATE/ROADMAP.md`
- `docs/00_AGENT_OS/CURRENT_CONTEXT.md`
- `docs/04_ARCHITECTURE/01_RUNTIME/board-runtime-target-architecture.md`
- `docs/04_ARCHITECTURE/01_RUNTIME/board-runtime-staged-roadmap.md`
- current hosted/demo baseline in `main`

## 5. Expected outputs

- один canonical demo requirements brief;
- один список release gates;
- один bounded lane для pre-release fixes;
- одно явное правило, когда начинается post-demo architecture track.

## 6. Acceptance direction

Chapter finishes when these conditions are true:

- demo scenario and must-have flows are agreed;
- release gates are explicit;
- allowed pre-release fix scope is explicit;
- post-demo architecture track has a clear re-entry rule.

## 7. Working rule

Новая демка делается на текущей архитектуре.

До demo release разрешены только narrow fixes, которые прямо поддерживают demo
scenario, validation или release readiness.

Broad runtime migration starts only after the demo is ready and released.
