# Board Runtime Architecture Review Chapter

Status: active chapter control doc  
Scope: read-only runtime review, ownership boundaries, staged migration choice

Этот chapter фиксирует high-level architecture review перед следующим
implementation lane.

## 1. Chapter goal

Принять один рабочий runtime direction для следующих safe slices:

- сверить текущий repo state с target architecture;
- согласовать ownership boundaries для `RoomRuntime`, room-open diagnostics,
  `RoomDocumentV1`, tool ownership и asset path;
- выбрать первый safe implementation slice после review;
- держать current product/runtime behavior стабильным во время review.

## 2. In scope

- read-only audit текущего room/runtime ownership;
- review `BoardStage` как integration surface и composition shell target;
- review room-open diagnostics baseline как input, а не как active execution
  chain;
- alignment между roadmap, current-context и architecture docs;
- staged migration sequence и stop conditions для первого implementation pass.

## 3. Explicitly out of scope

- production code changes в room-open semantics;
- новый loading / recovery UI;
- mobile implementation;
- broad `BoardStage` rewrite;
- transport-vendor change;
- asset migration implementation;
- new persistence semantics.

## 4. Canonical inputs

- `docs/04_ARCHITECTURE/01_RUNTIME/board-runtime-target-architecture.md`
- `docs/04_ARCHITECTURE/01_RUNTIME/board-runtime-staged-roadmap.md`
- `docs/04_ARCHITECTURE/00_OVERVIEW/ARCHITECTURE.md`
- `docs/01_CURRENT_STATE/ROADMAP.md`
- `docs/00_AGENT_OS/CURRENT_CONTEXT.md`
- accepted room-open inspectability baseline in current code

## 5. Expected outputs

- one agreed runtime review verdict;
- one clear first implementation slice after review;
- explicit candidate list for later runtime phases;
- aligned planning docs without conflicting chapter truth.

## 6. Acceptance direction

Chapter finishes when these conditions are true:

- current runtime hotspots are mapped clearly enough for a narrow execution
  brief;
- target architecture docs and current-state docs tell one consistent story;
- the next implementation chapter or slice is chosen explicitly.

## 7. Working rule

This chapter stays read-only by default.

Implementation resumes only after this review selects a narrow next slice.
