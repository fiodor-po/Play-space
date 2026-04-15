# play-space-alpha — roadmap and backlog

## 1. Зачем нужен этот документ

Этот документ — главный живой план проекта.

Он отвечает на четыре вопроса:

- где проект находится сейчас;
- что делаем следующим;
- что сознательно откладываем;
- какие решения уже приняты и не нужно каждый раз переобсуждать.

Это не подробный implementation plan одного рефактора.
Для крупных многошаговых задач используются `PLANS.md` и отдельные ExecPlan-документы.

## 2. Как этот документ соотносится с другими

- `AGENTS.md` — общие рабочие правила для Codex / агентов.
- `PLANS.md` — шаблон и требования к ExecPlan.
- `play-space-project-foundation.md` — стабильная продуктовая и архитектурная рамка.
- `play-space-alpha_current-context.md` — handoff и текущий рабочий контекст между чатами.
- `play-space-alpha_case-study-log.md` — накопительный журнал решений, багов, milestones и workflow lessons.
- `docs/refactor-audit.md` и `docs/refactor-plan.md` — historical architecture baseline.
- `ROADMAP.md` — живая карта этапов, приоритетов, backlog и open questions.

## 2.1. Режимы roadmap

Roadmap использует два режима.

### Planning mode

Planning mode действует по умолчанию после closure chapter или checkpoint.

В этом режиме roadmap фиксирует:

- current truth;
- closed milestones;
- active chapter, если он уже отдельно выбран;
- candidate next chapters или candidate next slices;
- backlog и optional follow-ups.

Правило planning mode:

- будущие шаги считаются planning candidates;
- candidate не считается канонически утверждённым execution path;
- candidate становится `active` только после отдельного planning decision.

### Hard sprint / execution mode

Hard sprint / execution mode запускается явно.

Этот режим используется, когда выбран конкретный execution chain:

- chapter already selected;
- order of slices is already chosen;
- constraints and stop conditions are already agreed.

В этом режиме roadmap может фиксировать:

- active chapter;
- next execution slices;
- concrete ordered sequence for the current sprint.

Правило execution mode:

- sequence written for the sprint is the current working truth;
- later chapters and later cleanup stay `candidate`, `backlog`, or `optional`
  until they are also explicitly promoted.

### Status vocabulary

Use these statuses in roadmap notes when useful:

- `active`
- `candidate`
- `backlog`
- `optional`
- `closed`

## 3. Текущий снимок состояния

### Что уже собрано достаточно убедительно

- shared room presence / cursors;
- unified room entry / leave-room lifecycle;
- shared tokens;
- shared images;
- shared text-cards;
- explicit image draw mode с `Draw / Save / Clear`;
- awareness-based per-image lock во время drawing mode;
- durable room snapshot layer как best-effort room recovery base;
- canonical zero state и separation of board content vs viewport semantics;
- coherent participant/color semantics;
- narrow LiveKit integration как technical validation;
- authoritative shared 3D dice как accepted alpha-core layer;
- repeatable local dev workflows (`dev:local`, `dev:lan`);
- foundation / current-context / case-study documentation workflow.

### Что остаётся незавершённым или intentionally rough

- media dock UX остаётся spike-level;
- dice tray / residual dice polish остаются слегка rough;
- hosted alpha environment уже включает working core stack и working optional video layer;
- production-hardening отсутствует и не нужен прямо сейчас;
- room lifecycle уже отделяет draft room selection от active participation, но broader room UX ещё intentionally rough;
- browser-local participant identity stabilization is now closed after human gate;
- `BoardStage` всё ещё остаётся тяжёлым integration surface;
- durable room memory остаётся best-effort, а не final collaborative durable platform;
- current hosted snapshot persistence is now known to survive restart but not redeploy, so hosted room durability is not yet deploy-stable.

### Что важно держать в голове

- проект остаётся **board-first shared play space**, а не heavy VTT;
- не делать broad rewrite `BoardStage.tsx`;
- не ломать manual empty-space panning;
- image interaction — чувствительная зона;
- current alpha interaction gravity is increasingly media-centered:
  - the board behaves as staging space;
  - media-backed surfaces such as images are becoming the main anchors of play;
  - tokens, notes, drawing, and attached interaction increasingly organize themselves around those media surfaces;
  - this is a current product direction, not yet a commitment to a broad media-platform rewrite;
- не подменять реальные product/deployment цели бесконечной локальной polish-спиралью.

## 4. Текущий активный этап

## Phase C — Room document persistence / recovery architecture

**Статус:** persistence/recovery complete, participant identity stabilization closed, hard sprint active in branch `sprint/cleanup-lint-boardstage-foundation`

### Цель
Принять `room document replicas` как architecture chapter, перевести
persistence/recovery от snapshot arbitration к replica model.

Первый узкий `commit-boundary persistence` checkpoint уже закрыт.
Сам replica-track остаётся активным до full cutover from snapshot arbitration.

### Основная последовательность
1. удерживать hosted core + optional video checkpoint как baseline;
2. считать `App.tsx` chapter closed;
3. считать narrow `BoardStage.tsx` cleanup checkpoint closed;
4. считать refreshed architecture/runtime audit completed;
5. считать `next runtime/object chapter` временно blocked by persistence/recovery correctness;
6. открыть новый active chapter: `room document persistence / recovery architecture`;
7. принять `parallel replacement` как strategy:
   - current product surface stays;
   - new room-document replica model grows beside current snapshot-arbitration model;
   - cutover happens by phases;
8. завершить первую implementation phase: `narrow commit-boundary persistence phase`;
   completed first slice:
   - browser-local room-document replica storage moved to `IndexedDB`;
   - one full local room-document replica per room accepted as the first baseline;
   - narrow same-browser recovery read bridge added;
   - local delta-log / compaction design remains deferred;
9. закрыть `Local replica semantics` как следующий internal replica-track step:
   - local replica now has monotonic local revision identity;
   - covered committed image/token/note corridors now write into IndexedDB local replica;
   - bootstrap now treats version-aware local replica as the local document source even when local content is empty;
   - legacy `room-snapshot` still remained as a temporary compatibility fallback and moved forward to later recovery work;
10. зафиксировать, что первый `IndexedDB`-baseline checkpoint закрыт, но сам
   replica-track ещё не завершён;
11. взять `Durable write model` как следующий internal replica-track step;
   - step is now closed:
     - covered local token/image/note commits own durable writes through a narrow update corridor;
     - ordinary runtime durable writes now belong to commit-owned corridors instead of broad snapshot timing;
     - durable ack/revision handling is explicit and inspectable;
     - covered multi-client durable corridors no longer rely on browser-visible `409` resource noise;
     - covered durable `PATCH` corridors use per-slice revision discipline and avoid cross-slice stale-base conflicts;
12. закрыть `Recovery convergence model` как текущий internal replica-track step;
   - step is now closed:
     - empty-live bootstrap opens the version-aware local replica first;
     - empty-live settled recovery converges per slice after provisional local-open;
     - durable slice catches up only when its durable slice revision is ahead of the local handoff metadata;
     - bootstrap read path now uses version-aware local replica or `none` and no longer reads `room-snapshot`;
     - committed add/remove corridors now survive same-browser reopen through local replica coverage;
     - active-room `live-wins` behavior stays unchanged;
13. закрыть `Checkpoint 3` before final cutover;
14. закрыть `Core semantic cutover from snapshot arbitration` как финальный internal replica-track step:
   - visible debug/smoke contract now uses replica vocabulary;
   - settled runtime contract now uses state-first settled recovery shape;
   - human gate confirms `live-active`, `replica-converged`, durable-ahead reopen, and stale `room-snapshot` ignore behavior;
15. закрыть `browser-local participant identity stabilization` как следующий
    отдельный chapter после replica-track:
   - browser-local `participantId`, room-local saved session, foreground-tab
     live carrier, shared active room session, and remembered room defaults now
     behave as one coherent browser-local identity model;
   - human gate confirmed same-browser repeat join, foreground/background tab
     behavior, cross-tab attach, leave propagation, and previous color
     preselect behavior;
   - smoke now includes a same-browser second-tab attach corridor in one browser
     profile;
16. держать `participant-marker / creator-color` как next candidate chapter
    after participant identity stabilization;
17. возвращаться к hosted validation как recurring checkpoint после крупных
    шагов и новых demo snapshots.

### Что это теперь значит
Persistence/recovery spine уже дошёл до финального semantic cutover.
Browser-local participant identity stabilization теперь тоже закрыт.
Следующий большой semantic/runtime candidate теперь лежит в participant-marker /
creator-color:

- creator-linked rendering still needs truthful non-live fallback semantics;
- creator color fallback still mixes current live state and stale object-local
  values;
- participant-marker / creator-color chapter already has its own analysis note
  and separate design scope.

Current planning-mode candidate for the next strategist step:

- analysis-first pass for `participant-marker / creator-color`

Это делает participant-marker / creator-color следующим candidate architecture concern.

Current hard sprint in this branch:

1. keep `main` as the stable hosted/demo line;
2. use this branch for cleanup-only work;
3. first active slice: `lint green baseline`;
4. second slice after that: `BoardStage structural reduction phase 1`;
5. keep `participant-marker / creator-color` outside this sprint as the next
   product/runtime candidate chapter.

## 5. Что вошло в этот checkpoint

- удержание core hosted stack в честном рабочем состоянии;
- удержание working hosted video path как optional layer без лишнего scope creep;
- удержание design-system migration на pause after the current checkpoint;
- `App.tsx` checkpoint closure after lifecycle / ownership completion;
- `BoardStage.tsx` cleanup chapter checkpoint closure;
- refreshed architecture/runtime audit completion;
- active migration track: `room document persistence / recovery architecture`;
- completed implementation checkpoint: `narrow commit-boundary persistence phase`;
- completed internal replica-track step: `Local replica semantics`;
- completed internal replica-track step: `Durable write model`;
- completed internal replica-track step: `Recovery convergence model`;
- completed internal replica-track step: `Core semantic cutover from snapshot arbitration`;
- completed checkpoint: `Checkpoint 3`;
- completed migration track: `room document persistence / recovery architecture`;
- completed chapter: `browser-local participant identity stabilization`;
- completed narrow follow-up: `debug-tools usability cleanup`;
- later follow-up task: `room-ops durability ergonomics`;
- optional follow-up task: `legacy room-snapshot write-cache cleanup`;
- optional follow-up task: `internal recovery naming/log cleanup`;
- hard sprint branch: `sprint/cleanup-lint-boardstage-foundation`;
- first active cleanup slice: `lint green baseline`;
- second cleanup slice: `BoardStage structural reduction phase 1`;
- next candidate chapter: `participant-marker / creator-color`;
- hosted validation как повторяемая проверка после крупных шагов, выкатываний и
  новых demo snapshots.

## 6. Что сознательно не является главным фокусом сейчас

- broad architecture cleanup ради красоты;
- новый большой capability spike;
- большой media/dice polish chapter;
- music / ambient audio implementation;
- heavy production infrastructure;
- scenes / permissions / history system.

## 7. Активный фокус

На текущий момент основной рабочий порядок такой:

1. удерживать successful first hosted core checkpoint как current baseline;
2. удерживать successful hosted video checkpoint как optional layer, а не новый broad media chapter;
3. держать design-system work на pause after the current checkpoint;
4. считать `App.tsx` chapter structurally closed;
5. считать current `BoardStage.tsx` cleanup chapter checkpoint-closed;
6. считать refreshed architecture/runtime audit completed;
7. считать `room document persistence / recovery architecture` закрытым migration track;
8. считать `narrow commit-boundary persistence phase` checkpoint-complete;
9. считать `Local replica semantics` закрытым internal replica-track step;
10. считать `Durable write model` закрытым internal replica-track step;
11. считать `Checkpoint 2` закрытым после local и durable maturity;
12. считать `Recovery convergence model` закрытым internal replica-track step;
13. считать `Checkpoint 3` закрытым перед final cutover;
14. считать `Core semantic cutover from snapshot arbitration` закрытым финальным internal replica-track step;
15. считать `room document persistence / recovery architecture` закрытым migration track;
16. считать `browser-local participant identity stabilization` закрытым chapter;
17. считать `debug-tools usability cleanup` закрытым узким inspectability/usability pass;
18. держать `room-ops durability ergonomics` как later follow-up task after the closed replica-track chapter;
19. держать `legacy room-snapshot write-cache cleanup` как optional hygiene follow-up outside the core recovery semantics;
20. держать `internal recovery naming/log cleanup` как optional hygiene follow-up outside the core runtime contract;
21. держать `main` как стабильную hosted/demo линию;
22. вести cleanup-only work в branch `sprint/cleanup-lint-boardstage-foundation`;
23. взять `lint green baseline` как первый active cleanup slice;
24. взять `BoardStage structural reduction phase 1` как следующий cleanup slice после lint;
25. держать `participant-marker / creator-color` как следующий candidate chapter после participant identity stabilization;
26. возвращаться к hosted validation как checkpoint после больших шагов и новых
   demo snapshots.

## 8. Backlog

## P0 — сейчас

- [x] провести read-only technical audit текущего alpha core
- [x] выделить 3–5 реальных pre-deploy technical risks
- [x] сделать narrow stabilization pass по blockers
- [x] собрать first hosted alpha deployment plan
- [x] определить hosted smoke checklist
- [x] задеплоить first hosted alpha core environment
- [x] подтвердить базовый hosted core flow
- [x] снять hosted video blocker и подтвердить working token path
- [x] сделать narrow hosted video enable pass
- [x] довести current design-system migration checkpoint до good pause state
- [x] провести analysis-first structural pass по `src/App.tsx`
- [x] довести narrow `App` split track до good checkpoint pause
- [x] verify the real boundary of the narrow `App` split track by attempting one
  more bookkeeping slice and reverting it after runtime regressions
- [x] открыть analysis-first `App lifecycle / ownership` chapter
- [x] закрыть `App.tsx` lifecycle / ownership checkpoint narrow implementation passes
- [x] открыть analysis-first `BoardStage.tsx` chapter
- [x] довести текущий narrow `BoardStage.tsx` cleanup chapter до honest checkpoint
- [x] сделать refreshed architecture/runtime audit after the current `BoardStage` checkpoint
- [x] выбрать следующий chapter как `next runtime/object chapter`
- [x] принять `room document replicas` как новый persistence/recovery target model
- [x] принять `parallel replacement` как strategy для migration к room-document replica model
- [x] зафиксировать `participant-marker / creator-color` как следующий отдельный follow-up chapter
- [x] открыть `room document persistence / recovery architecture` как новый active chapter
- [x] сделать `narrow commit-boundary persistence phase` как первый implementation phase
  - completed first concrete slice:
    - browser-local room-document replica storage moved from `localStorage` to `IndexedDB`
    - full room-document replica writes stay on commit boundary
    - same-browser IndexedDB recovery read bridge added
    - active-room `live-wins` behavior and durable shared truth semantics preserved
  - validation checkpoint completed:
    - image move / resize / draw-save survive refresh
    - token move survives refresh
    - note-card move and text edit survive refresh
    - leave / re-enter in the same browser works
    - second-browser shared truth remains coherent
- [x] close `Local replica semantics` as the next internal replica-track step
  - local replica now has monotonic local revision identity
  - covered committed image/token/note corridors now write into IndexedDB local replica
  - version-aware empty local replica now keeps same-browser reopen on the empty local document instead of stale `room-snapshot` or baseline fallback
- [x] close `Durable write model` as the next internal replica-track step
  - covered local token/image/note commits now use a commit-owned durable update corridor
  - commit-owned durable corridors now own ordinary runtime durable writes
  - durable checkpoint/bootstrap read path keeps the current behavior
  - covered multi-client durable update corridors now finish without accepted `409` resource-error baseline noise
  - covered durable `PATCH` corridors now use per-slice revision discipline to avoid cross-slice stale-base conflicts
- [x] close `Checkpoint 2` after local replica semantics and durable write model
- [x] close `debug-tools usability cleanup` as a narrow inspectability/usability pass
  - Dev tools panel now stays viewport-bounded in ordinary desktop viewports
  - lower inspect blocks and controls stay reachable through internal scroll
  - current smoke-facing `data-testid` hooks and inspectability strings stay stable
- [x] close `Recovery convergence model` as the current internal replica-track step
  - empty-live bootstrap now opens the version-aware local replica first
  - empty-live settled recovery now converges per slice after provisional local-open
  - durable slice now catches up only when its durable slice revision is ahead of the local handoff metadata
  - bootstrap read path now uses version-aware local replica or `none` and no longer reads `room-snapshot`
  - committed add/remove corridors now survive same-browser reopen through local replica coverage
  - active-room `live-wins` behavior stays unchanged
- [x] close `Checkpoint 3` before final cutover
- [x] close `Core semantic cutover from snapshot arbitration` as the final internal replica-track step
  - visible debug/smoke contract now uses replica vocabulary
  - settled runtime contract now uses state-first settled recovery and settled slice sources
  - human gate confirms `live-active`, `replica-converged`, durable-ahead reopen, and stale `room-snapshot` ignore behavior
- [ ] использовать hosted validation как recurring checkpoint после крупных
  продуктовых шагов и новых demo snapshots

## P1 — сразу после первого hosted alpha

- [ ] прогонять hosted playable-session validation после крупных шагов и новых
  demo snapshots
- [ ] фиксировать реальные rough edges после таких hosted checkpoint'ов
- [x] close browser-local participant identity stabilization
  - browser-local `participantId` is now the intended participant carrier
  - room-local saved session layers `name/color` on top of that identity
  - foreground tab carries live presence
  - shared active room session attaches a same-browser second tab to the live room
  - human gate confirmed same-browser repeat join, leave propagation, and previous color preselect behavior
  - local smoke now covers same-browser second-tab attach in one browser profile
- [ ] entry availability readiness hotfix if repro is confirmed again:
  - observed risk: entry-room occupancies / join claims can arrive late enough that occupied colors appear 1-2 seconds after the entry screen opens
  - resulting risk: user can briefly choose a color that is actually occupied before room availability state settles
  - preferred fix shape: gate final join on initial entry availability readiness instead of treating early empty awareness state as final truth
  - keep this as a narrow hotfix outside the current runtime/object chapter unless the repro becomes a stable blocker
- [ ] resolve creator-color fallback gap for participant-marker tokens and creator-colored token rendering:
  - refresh/leave wrong-color behavior currently comes from fallback to stale token-local `fill` after live creator color disappears
  - accepted target: use snapshot-backed room-scoped last-known participant appearance as the non-live fallback by `creatorId`
  - `creatorId` stays in durable room identity; participant appearance fallback belongs to durable room snapshot
  - treat this as required participant-marker / creator-color chapter work, not polish
  - analysis note: [docs/creator-color-fallback-analysis-2026-04-14.md](docs/creator-color-fallback-analysis-2026-04-14.md)
- [ ] minimal hosted-alpha room operations panel:
  - list existing rooms on the server
  - inspect room contents / snapshot state
  - reset / delete / repair problematic rooms
- [ ] decide room-ops durability ergonomics after destructive snapshot delete:
  - choose between immediate durable reseed, explicit leave-time flush, or clearer destructive semantics for the ops path
  - keep this out of `Recovery convergence model` unless the decision starts changing recovery semantics
- [ ] add server-controlled client reset policy for stale browser-local room memory:
  - backend-published reset marker
  - early boot check before local restore
  - wipe scoped browser-local room-memory state
  - preserve browser participant id in phase 1
- [ ] correct room creator truth so it comes from shared room-level state rather than browser-local room metadata:
  - one shared room-level creator id
  - creator UI reads from shared truth
  - creator-based governance reads from shared truth
  - local room metadata becomes non-authoritative for creator identity
- [ ] add a durable room identity layer separate from room content snapshot:
  - room identity stores room-level facts such as `roomId`, `creatorId`, `createdAt`
  - room identity is resolved before live/shared content restore
  - durable room snapshot may hold broader recoverable room state such as room-scoped participant appearance fallback, but not room identity authority
  - local room state remains convenience-only and does not define room existence or creator truth
  - first implementation can use a second backend JSON store in the same pragmatic style as current alpha
- [ ] make room knownness explicit for backend/ops discovery:
  - explicit join should make the room backend-known
  - `/ops/rooms` should not depend on incidental side effects of live docs or later snapshot saves
  - draft/entry presence should not be the main path by which a room temporarily appears in ops
  - first slice should stay narrow and likely reuse the existing durable room identity path rather than introducing a new room-catalog system
- [ ] determine and fix why hosted durable room snapshots survive restart but do not survive redeploy
- [ ] decide whether to clean up the `yjs` warning during same-browser cross-tab leave propagation:
  - current behavior is acceptable for chapter closure
  - attempted automation exposed `Tried to remove event handler that doesn't exist.`
  - keep this as narrow runtime hygiene, not as a reopened identity chapter
- [ ] evaluate whether the IndexedDB local-replica baseline should later evolve into checkpoint + delta-log storage:
  - current accepted first baseline is one full local room-document replica per room
  - promote delta-log / compaction only if the IndexedDB full-replica baseline proves too heavy
  - do not introduce a Figma-class local update-log engine before the simpler IndexedDB baseline is stable
- [ ] media dock simplification / stabilization pass
- [ ] dice tray / dice UX cleanup pass
- [ ] board shell coherence pass
- [ ] серия read-only audits после следующего крупного migration checkpoint:
  - project audit
  - process/workflow audit
  - architecture audit where needed

## P2 — последующие улучшения

- [ ] постепенное уменьшение ответственности `BoardStage`
- [ ] targeted architecture hygiene slices
- [ ] stronger room lifecycle clarity
- [ ] better observability / support ergonomics
- [ ] design system chapter:
  - first do a whole-project token audit using three layers:
    - primitive
    - semantic
    - component
  - then do a base component audit:
    - where component families already exist
    - where the same patterns repeat ad hoc
    - what variants already exist in runtime
  - then do a system-layer audit:
    - interaction layer
    - control layer
    - room shell / entry flow
    - ops surface
    - other meaningful UI systems
  - then do an explicit audit-synthesis / decision pass:
    - decide what is candidate canon
    - decide what is drift
    - decide what is intentional exception
    - decide what should change first
    - decide what should stay untouched for now
  - then build an explicit dependency map:
    - primitive tokens -> semantic tokens -> component tokens
    - components -> systems
    - identify mixed / skipped / ad hoc dependency edges
  - only after that define the canonical design-system model
  - and only then do a narrow rollout plan
  - ordinary-interface migration chapter is now structurally landed enough to
    pause
  - remaining ordinary-interface work is now mostly later cleanup, visual
    reconciliation, and explicit local exceptions
  - the next safe design-system direction is board-layer work, starting with
    board material tokenization and its canvas-resolution rule
  - the first safe board-layer continuation is now also landed enough to pause:
    - board material
    - object-semantics tooltip shell
    - dice tray shell
    - board drawing-management control ownership
  - the post-first-wave review already clarified the main residual
    design-system gaps and exception boundaries
  - the next two design-system chapters should now be split explicitly:
    - missing families and variants
    - design-system visual polishing
  - the first of those chapters is now landed enough to pause:
    - missing families and variants
  - that chapter established:
    - `compact button` as an accepted ordinary button-family branch
    - `text button` as an accepted button-derived path inside the button system
    - `interactionButton.pill` / `interactionButton.circle` as the accepted
      reserved board-interaction control branch
    - the first live runtime consumer of `interactionButton.pill` in the
      image-attached drawing-management controls
  - the second of those chapters should explicitly include:
    - align look and feel across the current shared system through token and
      family changes rather than new local overrides
    - make visual corrections by improving the system itself instead of
      layering more ad hoc consumer overrides
  - explicit questions to carry forward after the first chapter:
    - whether image-attached drawing controls should later become a dedicated
      compact / pill-like board-control class
    - whether `pill` survives as a real long-term family branch or collapses
      into `compact` button paths plus a reserved board-interaction class
    - which board-adjacent shells and controls need their own explicit
      subchapter rather than more ad hoc extensions
  - accepted direction already established for the first chapter:
    - the reserved board-interaction control branch is now accepted as:
      - `interactionButton.pill`
      - `interactionButton.circle`
    - `compact button` is now an accepted ordinary button-family branch rather
      than an open question
    - `text button` is now accepted as a button-derived path inside the button
      system rather than an adjacent family question
  - accepted decisions already established inside that chapter:
    - participant panel placement and size are acceptable local context, but
      blur should move under shared material ownership rather than remain a free
      local override
    - for shared floating board shells, material ownership now includes shell
      geometry such as border radius rather than only color/shadow treatment
    - media dock shell and participant tiles should first converge on standard
      shared material, with deeper cleanup deferred to a dedicated media pass
    - the fixed add-image trigger should read as the same standard
      user-accented button class as dice buttons, only pinned to the top-right
      board corner
    - the first live runtime consumer of `interactionButton.pill` is now the
      image-attached drawing-management control set:
      - `Draw`
      - `Save`
      - `Clear`
      - `Clear all`
    - those controls now inherit their visual shell from the shared
      interaction-button branch rather than from local canvas-only literals
    - round / pill-like buttons should be reserved for board-object
      interaction so that classic interface controls and board-object
      interaction controls stay visually separated
    - participant-name inline edit/display behavior remains an acceptable local
      special-case exception for now
  - accepted cleanup decisions already established inside that chapter:
    - remove the remaining visual overrides from the entry main panel
    - remove the remaining visual overrides from the entry debug inset
    - for the participant panel shell, keep placement/size local but move
      blur/material treatment under shared material ownership
    - remove the remaining shell/material overrides from the media dock shell
    - defer participant video tile override cleanup to a later dedicated media
      pass
    - remove the remaining local mini-card overrides inside the governance
      inset
    - remove the remaining local shadow tuning on dice buttons
    - remove the remaining local visual overrides from the fixed add-image
      trigger except for placement
    - align the fixed add-image trigger look-and-feel with the dice-button
      class
    - remove the remaining local background/material override from the
      governance inset itself
  - the next large boundary beyond that point should be chosen after this
    review, not assumed in advance
  - final completion criterion for the migration is not "enough structural
    progress" by itself
  - the migration should be considered complete only when the user explicitly
    decides that the project now counts as having moved onto the new design
    system
- [ ] object interaction UI standardization chapter:
  - first explicitly separate the app into:
    - object layer
    - interaction layer
    - control layer
    - presence layer
    - special interaction systems
  - use already implemented object families as reference
  - make visual language / rules / interaction logic explicit
  - unify expectations for selection, resize, occupied / blocked indication, and preview / active-manipulation states
  - use the canonical current-alpha interaction matrix:
    - image = canonical box/media interaction object
    - note-card = canonical text-box interaction object
    - token = canonical pin exception
- [ ] reduce local drag inertia for image-attached dependents:
  - attached tokens and image-attached controls should stay visually glued to
    the image during local drag
  - current visible catch-up after parent bounds recompute should be reduced to
    near-zero
  - keep this as a narrow local interaction-loop / dependent-follow task, not
    as a scene-graph rewrite
- [ ] hosted deploy hardening only if product validation justifies it
- [ ] behavior indication model chapter
- [ ] cross-user action visibility model chapter
- [ ] object-by-object review chapter
- [x] reusable movable-object `activeMove` occupancy as phase 1 of live object-interaction unification
- [x] object-attached pin / token attachment chapter (image first)
- [ ] video / media layer review chapter
- [ ] video presentation / frame composition chapter

## Parked / later

- [ ] add an alternative persistent room-creation / access flow with email:
  - keep the current lightweight room entry flow as a demo path
  - remove room-creator semantics and beyond-local-memory persistence expectations from that demo path
  - add a separate email-based persistent path for durable session/account-like continuity
  - future persistent path may later carry room invites / guest access / stronger long-lived room ownership semantics
- [ ] shared music / ambient audio chapter
- [ ] scenes / scene management
- [ ] permissions / roles
- [ ] history / undo across sessions
- [ ] broad type-model redesign
- [ ] deeper board sync adapter work, если оно не становится blocker до hosted alpha
- [ ] separate public/internal build split, only if snapshot demos stop being sufficient

## 8.1. Next structured review chapters

После текущего hosted-first validation цикла и связанных narrow stabilization passes
следующий большой backlog now groups into three families:

- **Design system**
  - whole-project token audit
  - base component audit
  - system-layer audit
  - audit-synthesis / decision pass
  - dependency map
  - canonical design-system model
  - narrow rollout plan
- **System models**
  - behavior indication model
  - cross-user action visibility model
- **Object layer**
  - object-by-object review
- **Video layer**
  - video / media layer review
  - video presentation / frame composition

Рекомендуемый порядок сейчас такой:

1. design system migration continuation
2. project / process audit series
3. behavior indication model
4. cross-user action visibility model
5. object-by-object review
6. video / media layer review
7. video presentation / frame composition

Смысл этого порядка:

- сначала явно собрать token/component/system vocabulary for the whole project;
- сначала собрать coherent signaling/readability system for the room;
- потом проходить object layer уже against that clearer system model;
- video layer разбирать после этого как отдельный room layer, а не как ещё один object family.

Дополнительная заметка к будущему `object-by-object review`:

- current object layer is structurally asymmetric in code;
- `token` и `text-card` already exist as clearer object modules;
- `image` is a first-class object family product-wise, but still remains more dispersed across `BoardStage`, `boardImage` helpers, and realtime image sync paths;
- `drawing` currently behaves more like an image capability than a separate object family;
- `dice` и `video/media` should be reviewed separately as non-object layers rather than forced into the same object-family bucket.

Дополнительная заметка к текущему token / movable-object direction:

- token chapter now already moved from generic placeholder object toward participant marker / pin semantics;
- reusable movable-object `activeMove` occupancy now exists as the first runtime conflict/occupancy slice for tokens;
- token attachment semantics now exist as a first working image-first runtime slice;
- attachment source of truth should live on the token object itself, not in room metadata;
- first attachment model should use normalized parent-local coordinates and derive render position from current parent bounds;
- token should remain viewport-stable in size even when attached in the first slice;
- attachment should later grow into an effective-bounds model for attached dependents;
- first shared image effective-bounds extraction now exists for attached tokens and image-backed controls;
- this is dependency hierarchy for geometry/interaction follow, not yet a full scene-graph or permissions tree;
- later polish target: attached dependents should ideally follow local parent interaction with near-zero visible catch-up, likely requiring a deeper local interaction-loop / dependent-follow pass beyond the current effective-bounds extraction;
- this should be implemented as phase 1 of live object-interaction unification:
  - token first for `activeMove`
  - reusable semantics
  - no token-only conflict model
  - no broad transport consolidation yet.

Дополнительная заметка к текущему text-card direction:

- text-cards should remain free board context cards rather than becoming token-like pins;
- current immediate text-card need is sizing, not attachment;
- canonical sizing rule should be:
  - text-card should resize like a normal text box;
  - manual resize may change width and height;
  - text should reflow to the current box;
  - while typing, card height should auto-grow if text no longer fits vertically;
  - normal note text should not clip in ordinary note flow;
- first implementation slice should focus on standard text-box resize plus no-clipping auto-grow behavior, not on document-editor behavior.

Дополнительная заметка к текущему note replacement direction:

- current `text-card` should now be treated as a legacy object;
- future note work should move to a new `note-card` object rather than continue polishing legacy `text-card`;
- legacy `text-card` and new `note-card` should coexist for now;
- first replacement slice should not migrate existing objects;
- future note creation flow should later target `note-card`;
- media association, attachment, and document-editor behavior remain out of scope for the first replacement slice.

Дополнительная заметка к будущему object interaction standardization chapter:

- first the product should be explicitly separated into:
  - object layer
  - interaction layer
  - control layer
  - presence layer
  - special interaction systems
- interaction standardization should then focus primarily on the interaction layer, not on flattening all layers into one system;
- interaction-layer elements should be treated as object-anchored but viewport-stable by default;
- `dice` should continue to be treated as a special interaction system rather than forced into ordinary object or control semantics by default.

Дополнительная заметка к current browser-local room-memory direction:

- browser-local room memory now needs an explicit server-controlled invalidation path;
- this should be a narrow operational reset policy, not a migration framework;
- backend should publish an explicit reset marker;

Дополнительная заметка к current room creator direction:

- room creator identity should now be treated as shared room-level truth, not browser-local metadata truth;
- current browser-local `roomRecord.creatorId` behavior is a bug-prone temporary path, not the intended model;
- the first fix should stay narrow:
  - one shared room-level creator id
  - creator UI and creator-based governance read from it
  - no broad ownership / roles / auth system
- client should check it before normal room/session restore;
- if the marker changed, scoped browser-local room-memory state should be wiped before restore continues;
- browser participant identity should remain preserved in the first slice.

## 9. Open questions

- Какие rough edges проявятся после следующего крупного шага или следующего demo
  snapshot в hosted environment?
- Какие rough edges проявятся только после очередного hosted checkpoint уже с
  текущим optional video layer?
- Когда именно hosted-alpha feedback оправдает более глубокий polish или infrastructure hardening?

## 10. Decision log

## 2026-04-05

### Решено
- broad rewrite `BoardStage` не делаем;
- архитектурную реорганизацию ведём маленькими фазами;
- image interaction считается чувствительной зоной;
- phased work safer than reformist cleanup.

## 2026-04-06

### Решено
- durable room snapshot persistence стал реальным best-effort layer для room recovery;
- local snapshot больше не считается достаточным source of truth;
- color semantics вынесены в canonical design doc;
- zero state отделён от viewport semantics;
- narrow LiveKit-first spike признан технически жизнеспособным;
- local dev workflows переведены на explicit `dev:local` / `dev:lan`.

## 2026-04-07

### Решено
- authoritative shared 3D dice стали accepted alpha-core layer;
- minimal capability checklist для alpha в основном собран;
- следующий правильный порядок больше не `polish first`, а:
  - technical audit
  - stabilization
  - first hosted alpha
  - hosted validation
  - slower polish afterwards
- first hosted alpha должен мыслиться как split environment:
  - frontend отдельно
  - long-running Node realtime/API отдельно
  - separate LiveKit service if video remains enabled
- old refactor docs остаются полезным historical baseline, но больше не задают главный active direction проекта.

## 2026-04-08

### Решено
- first hosted alpha core checkpoint достигнут;
- hosted frontend и hosted realtime/API backend подняты и базовый core flow подтверждён;
- video не входит в completed core checkpoint и остаётся следующим отдельным narrow step;
- следующий planned step = hosted video enable pass, а не broad cleanup wave.

### Update
- hosted video enable attempt был начат;
- Vercel token fallback path подтвердился как working hosted solution;
- hosted video now works without changing the hosted core split;
- важный workflow lesson: before live-debugging, confirm the relevant code is committed, pushed, and actually included in the deployed build.

### Update
- app moved from direct in-room room switching to explicit unified entry / leave-room lifecycle;
- room name is now editable before join;
- direct room URL now acts as entry-form prefill, not automatic join by itself;
- in-room `Change` action was replaced by `Leave room`;
- active room participation is now explicitly separated from draft room selection.

### Update
- participant identity direction is now explicitly browser-local for the current product stage:
  - same browser profile = same participant
  - multiple tabs are allowed
  - only the foreground/visible tab should carry live participant presence
  - background tabs should be soft-suspended as active participant carriers

### Update
- for the current alpha stage, public demos should be handled as fixed chosen snapshot deploys;
- continue normal work on the main project, then periodically promote one stable checkpoint as the next public demo;
- separate public/internal build split is explicitly deferred for now.

### Update
- current app surface is now considered coherent enough to freeze as the first public demo snapshot;
- the first public demo should be treated as the first chosen snapshot in that same snapshot-based demo rhythm;
- future public demos can roll forward as later chosen checkpoints without introducing a separate build mode yet.

### Update
- zero-state remains genuinely empty;
- room baseline content now exists as explicit room-initialization layer;
- first named baseline payload `public-demo-v1` now works;
- old bootstrap-hack framing for demo baseline content is superseded by the room-initialization model.

### Update
- room color/member direction was corrected away from offline color reservation and permanent room-color ownership;
- current intended model is now:
  - exactly 8 allowed participant colors
  - at most 8 simultaneous active participants per room
  - only active participants block colors
  - offline members do not reserve colors
  - repeat join should preselect previous room color if free, not lock it permanently
- room members may still remain as room history / remembered defaults, but that is no longer the same as authoritative color ownership.

## 11. Правила обновления документа

Обновляй этот документ, когда:

- появился новый крупный вывод по архитектуре, deployment или product direction;
- принято решение что-то отложить или поднять в приоритет;
- закрыт заметный этап;
- изменился порядок следующих шагов;
- hosted-alpha findings изменили backlog.

Принцип обновления:

- не превращать документ в длинный дневник;
- хранить здесь только живые этапы, backlog, open questions и решения;
- большие планы держать отдельно в `PLANS.md` / ExecPlan;
- historical detail хранить в case-study log, а не здесь.
