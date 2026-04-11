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
- participant identity still needs a narrow browser-local stabilization pass so same-browser repeat join and multi-tab behavior become explicit instead of accidental;
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

## Phase B — First hosted checkpoint and hosted validation follow-up

**Статус:** active

### Цель
Зафиксировать, что hosted core и hosted video уже работают, сохранить узкий practical scope и перейти к real hosted validation без premature cleanup wave.

### Основная последовательность
1. narrow stabilization для реальных hosted рисков;
2. first hosted core deploy;
3. базовая hosted validation core flow;
4. narrow hosted video enablement;
5. затем дальнейшая hosted playable-session validation и только потом более длинный UI/UX polish cycle.

### Почему это теперь главный фокус
Core hosted signal уже получен.
Следующая наибольшая ценность — не новый capability spike и не broad cleanup, а аккуратно расширить hosted stack ровно на один следующий слой.

## 5. Что входит в текущий этап

- удержание core hosted stack в честном рабочем состоянии;
- удержание working hosted video path как optional layer без лишнего scope creep;
- narrow follow-up based on confirmed hosted checkpoint;
- продолжение hosted playable-session validation уже после этого;
- сбор product signal из реальной hosted-сессии без premature infra overbuild.

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
3. продолжить hosted playable-session validation;
4. зафиксировать реальные rough edges;
5. только потом идти в следующий validation/polish cycle.

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
- [ ] продолжить hosted validation уже с working optional video layer

## P1 — сразу после первого hosted alpha

- [ ] продолжить playable-session validation в hosted environment
- [ ] зафиксировать реальные rough edges после hosted use
- [ ] implement browser-local participant identity pass with foreground-tab-only active presence behavior
- [ ] minimal hosted-alpha room operations panel:
  - list existing rooms on the server
  - inspect room contents / snapshot state
  - reset / delete / repair problematic rooms
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
- [ ] determine and fix why hosted durable room snapshots survive restart but do not survive redeploy
- [ ] media dock simplification / stabilization pass
- [ ] dice tray / dice UX cleanup pass
- [ ] board shell coherence pass

## P2 — последующие улучшения

- [ ] постепенное уменьшение ответственности `BoardStage`
- [ ] targeted architecture hygiene slices
- [ ] stronger room lifecycle clarity
- [ ] better observability / support ergonomics
- [ ] object interaction UI standardization chapter:
  - use already implemented object families as reference
  - make visual language / rules / interaction logic explicit
  - unify expectations for selection, resize, occupied / blocked indication, and preview / active-manipulation states
- [ ] hosted deploy hardening only if product validation justifies it
- [ ] behavior indication model chapter
- [ ] cross-user action visibility model chapter
- [ ] object-by-object review chapter
- [x] reusable movable-object `activeMove` occupancy as phase 1 of live object-interaction unification
- [x] object-attached pin / token attachment chapter (image first)
- [ ] video / media layer review chapter
- [ ] video presentation / frame composition chapter

## Parked / later

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

- **System models**
  - behavior indication model
  - cross-user action visibility model
- **Object layer**
  - object-by-object review
- **Video layer**
  - video / media layer review
  - video presentation / frame composition

Рекомендуемый порядок сейчас такой:

1. behavior indication model
2. cross-user action visibility model
3. object-by-object review
4. video / media layer review
5. video presentation / frame composition

Смысл этого порядка:

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

- Какие rough edges проявятся только после hosted playable-session checks?
- Какие rough edges проявятся только после hosted use уже с working optional video layer?
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
