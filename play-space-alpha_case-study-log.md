# play-space-alpha — case study log

Ниже — черновой накопительный журнал проекта.

Важно:
- это рабочая реконструкция, собранная по памяти и по сохранённому контексту чатов;
- даты и отдельные commit-границы позже можно уточнить;
- цель журнала сейчас — не идеальная архивная точность, а сохранение narrative, решений, уроков и самой формы AI-assisted работы над проектом.

---

## Phase 0X — Browser-local participant identity stabilization closed

### Type
- milestone
- decision

### Context
После closure replica-track следующий вопрос уже не касался persistence or
recovery semantics. Нужно было проверить, действительно ли browser-local
participant identity уже живёт в runtime честно, или проект пока только
декларирует эту модель в docs.

### Goal or problem
Нужно было закрыть главу без новой большой реализации:

- подтвердить same-browser repeat join;
- подтвердить foreground/background tab behavior;
- подтвердить shared active room session across tabs;
- подтвердить remembered room defaults;
- добавить one real machine proof for same-browser second-tab attach.

### What happened
Chapter подтвердился как validation-first / runtime-honesty pass:

- browser-local `participantId` already worked as the participant carrier;
- room-local saved session already layered `name/color` on top of that
  identity;
- foreground tab already carried live presence;
- shared active room session already attached a same-browser second tab to the
  current room;
- remembered room defaults already preselected previous color when free;
- smoke gained one same-browser second-tab attach corridor inside one browser
  profile.

### Decision / change
`browser-local participant identity stabilization` closed after human gate and
one additional same-browser smoke corridor.

### Why
The intended model already existed in runtime.
The remaining work was proof, not a new foundational implementation.

### Result
The next candidate chapter is now `participant-marker / creator-color`.

The chapter no longer keeps a same-browser leave-propagation teardown tail.

---

## Phase 0X — Core semantic cutover closed and replica-track completed

### Type
- milestone
- decision

### Context
После closure `Recovery convergence model` проект уже жил через replica
convergence, но core cutover chapter ещё держал один обязательный вопрос:
перестала ли recovery semantics действительно зависеть от source-centric runtime
contract, или старый bootstrap-shaped contract всё ещё остаётся центральной
частью модели.

### Goal or problem
Нужно было закрыть chapter честно, без broad cleanup:

- перевести visible debug/smoke contract на replica vocabulary;
- перевести settled runtime contract на state-first settled recovery shape;
- подтвердить это human gate'ом;
- вынести remaining hygiene tails за пределы chapter closure.

### What happened
Chapter был доведён до closure-ready состояния:

- visible debug/smoke contract now uses `live-active`, `replica-converged`,
  and `checkpoint`;
- settled runtime contract now uses `Settled` state and `Settled slices`;
- source-centric settled fields were removed from the core runtime shape;
- docs and manual QA wording were aligned to the current recovery model;
- human gate confirmed `live-active`, `replica-converged`, durable-ahead
  reopen, and stale `room-snapshot` ignore behavior.

### Decision / change
`Core semantic cutover from snapshot arbitration` closed after docs alignment
and human gate.

This also closed the full replica-track migration chain for room document
persistence / recovery.

### Why
Core recovery semantics now already live through:

- version-aware local replica;
- settled replica convergence;
- slice-level durable catch-up;
- settled recovery outcome instead of winner-style source contract.

Remaining tails are now hygiene work rather than chapter blockers.

### Result
The next active chapter is now
`browser-local participant identity stabilization`.

Optional tails remain outside the closed chapter:

- legacy `room-snapshot` write-cache cleanup;
- internal recovery naming/log cleanup.

---

## Phase 0X — Recovery convergence model closed before semantic cutover

### Type
- milestone
- decision

### Context
После закрытия local replica semantics и durable write model проект уже умел
открывать local replica first и сходиться с durable state по slice freshness.
Legacy `room-snapshot` ещё оставался read-side fallback и держал recovery
chapter открытым.

### Goal or problem
Нужно было понять, закрывает ли текущий recovery chapter свою собственную
semantic задачу, или recovery всё ещё зависит от snapshot-era fallback.

### What happened
Recovery chapter был доведён до двух важных границ:

- empty-live bootstrap now opens the version-aware local replica first;
- empty-live settled recovery now converges per slice after provisional
  local-open;
- durable slice catches up only when its durable slice revision is ahead of the
  local handoff metadata;
- committed add/remove corridors now survive same-browser reopen through local
  replica coverage;
- bootstrap read path no longer uses `room-snapshot`.

### Decision / change
`Recovery convergence model` closed after human gate.

The next internal replica-track step is
`Core semantic cutover from snapshot arbitration`.

### Why
Recovery semantics already work through convergence.
The remaining `room-snapshot` tail is now a write-only cache and no longer
participates in bootstrap or settled recovery decisions.

### Result
The project moved from recovery-side convergence work to cutover readiness.

The remaining snapshot write-only cache is now tracked as an optional hygiene
follow-up rather than as a blocker for recovery chapter closure.

---

## Phase 0X — Board-material tokenization exposed a CSS-vs-canvas token boundary

### Type
- finding
- fix

### Context
Во время narrow design-system rollout для board material был сделан логически правильный на вид pass:

- board backdrop and board surface were moved from scattered literals toward a shared board-material source;
- semantic ownership became cleaner;
- visual hierarchy unexpectedly regressed in runtime.

### Goal or problem
Нужно было понять, почему после tokenization board/backdrop relationship визуально инвертировался:

- board itself looked almost black / too dark;
- surrounding backdrop read lighter by comparison;
- this contradicted the intended visual hierarchy.

### What happened
Root cause turned out to be a runtime boundary, not a semantic color-choice mistake.

- DOM/CSS consumers can use `var(--token)` directly.
- Konva canvas fills should not be assumed to consume raw CSS variable strings the same way.
- The board backdrop stayed correct because it was still a normal DOM background.
- The board surface regressed because the Konva `Rect fill` stopped receiving a normal resolved color string.

### Decision / change
The project now has an explicit rule for board materials:

- CSS custom properties may remain the semantic source of truth;
- DOM surfaces may consume them directly;
- canvas/Konva consumers must use a small runtime resolver that returns a real color string.

This keeps one semantic board-material source of truth without pretending that DOM and canvas consume tokens identically.

### Why
Without this rule, a “safe tokenization pass” can silently become a visual regression even when the chosen token values themselves are unchanged.

### Result
The board/backdrop hierarchy was restored through a narrow runtime fix rather than through a broader restyle.

The more durable lesson is now explicit:

- token semantics and token transport are different things;
- when design-system work touches Konva/canvas rendering, verify how values are actually consumed at runtime before assuming CSS-token mechanics carry over unchanged.

---

## Phase 0X — Snapshot-based public demo strategy

### Type
- decision

### Context
После hosted-core и hosted-video milestones стало ясно, что проекту уже нужен способ показывать публичные demo checkpoints, но отдельный public/internal build split пока создаст больше process and deployment complexity, чем пользы.

### Goal or problem
Нужно было зафиксировать, как именно делать public demos на текущей alpha stage, не вводя premature build-mode system.

### What happened
Был выбран простой operational approach:
- продолжать normal work on the main project;
- периодически выбирать stable checkpoint;
- деплоить именно этот checkpoint как next public demo.

### Decision / change
Public demos пока должны мыслиться как fixed snapshot deploys, а не как отдельный public build flavor.

### Why
Это дешевле, понятнее и безопаснее для текущей стадии проекта, чем преждевременно вводить separate public/internal build split.

### Result
Release rhythm для public demos стал explicit: chosen stable snapshot first, broader build split later only if реально понадобится.

---

## Phase 0X — First public demo snapshot chosen

### Type
- milestone

### Context
После нескольких маленьких public-surface cleanup passes стало важно не только иметь snapshot-based demo strategy, но и явно признать, что current app surface уже достаточно coherent для первого публичного checkpoint.

### Goal or problem
Нужно было зафиксировать, что первый public demo больше не hypothetical future idea, а реально выбранный snapshot.

### What happened
Текущий app surface был признан good enough for the first public demo snapshot.

### Decision / change
Первый public demo теперь мыслится как уже выбранный stable snapshot, а последующие demos могут выходить как новые chosen checkpoints.

### Why
Это даёт проекту честный demo baseline без premature public/internal build split и без ненужного release-process overbuild.

### Result
Snapshot-based public demo strategy перешла из process intent в реальный chosen-demo milestone.

---

## Phase 0X — Unified room entry and leave-room lifecycle

### Type
- milestone

### Context
Старый room flow смешивал:
- room id from URL;
- saved room-scoped participant session;
- active joined participation.

### Goal or problem
Нужно было сделать room entry explicit и перестать считать in-room room switching primary lifecycle model.

### What happened
В app был введён unified entry screen:
- room name теперь editable before join;
- direct room URL now acts as prefill, not automatic join by itself;
- in-room `Change` action был заменён на `Leave room`.

### Decision / change
Проект теперь мыслит room lifecycle через explicit split between:
- draft room selection;
- active joined room participation.

### Why
Это делает room lifecycle более честным и лучше готовит foundation для дальнейшей room/governance work без premature policy design.

### Result
Room entry и room leaving стали explicit lifecycle steps вместо старого direct switch flow.

---

## Phase 0X — Zero-state, baseline content, and room initialization were separated explicitly

### Type
- decision

### Context
Попытка добавить demo-card в room baseline быстро показала, что starter/demo content не имеет права quietly жить внутри sensitive bootstrap/recovery path.

### Goal or problem
Нужно было явно развести:
- genuinely empty zero-state;
- explicit baseline/demo content;
- one-time room initialization policy.

### What happened
Был добавлен canonical design doc:
- `docs/room-initialization-design.md`

В нём зафиксировано, что:
- zero-state остаётся genuinely empty;
- baseline/demo content — это отдельный explicit layer;
- room initialization policy — отдельная one-time decision point;
- текущий demo-card injection path rejected as architecture.

### Decision / change
Проект больше не должен решать demo/starter content через ad hoc `BoardStage` bootstrap patches.

### Why
Иначе baseline content начинает маскироваться под recovery logic и room initialization semantics становятся неустойчивыми.

### Result
У проекта появился чистый semantic foundation для future versioned demo baselines без превращения room bootstrap в hacky policy layer.

---

## Phase 0X — First real room baseline rollout landed

### Type
- milestone

### Context
После design pass и scaffold slice стало важно подтвердить, что baseline content может существовать как real room-initialization layer, а не только как abstract architecture rule.

### Goal or problem
Нужно было сделать первый named baseline payload real, не возвращаясь к old bootstrap-hack path.

### What happened
В проекте появился working `public-demo-v1` baseline:
- zero-state остался genuinely empty;
- baseline content начал применяться one-time through room initialization;
- baseline content пишет в normal shared room content layers.

### Decision / change
Starter/demo content теперь уже реально живёт как explicit room-initialization behavior, а не как ad hoc `BoardStage` injection.

### Why
Это подтвердило, что canonical room-initialization design можно не только описать, но и использовать без отката к hidden bootstrap hacks.

### Result
`public-demo-v1` стал первым working baseline rollout, а old demo-card bootstrap-hack framing был фактически superseded.

---

## Phase 0X — Canonical object semantics baseline before governance work

### Type
- decision

### Context
Перед будущей governance work стало ясно, что проекту сначала нужен не permissions chapter, а нормализованная semantic baseline для board objects.

### Goal or problem
Нужно было явно зафиксировать:
- creator semantics;
- actor/interacting semantics;
- и правило, что отсутствие одного из этих слоёв должно быть deliberate, а не accidental.

### What happened
Был добавлен canonical design doc:
- `docs/object-semantics-design.md`

В нём зафиксировано:
- `creatorId` как canonical persisted creator identity;
- `participantId` / `participantName` / `participantColor` как canonical transient actor payload;
- `authorColor` как fallback metadata, а не creator identity.

### Decision / change
Проект теперь сначала нормализует object semantics, а уже потом идёт в governance/policy work.

### Why
Без этого governance discussion слишком легко расползается, потому что object identity и current interaction semantics начинают смешиваться.

### Result
У проекта появился явный semantic rule для текущих и будущих object types без преждевременного ухода в permissions design.

---

## Phase 0X — Lightweight governance scaffold before policy work

### Type
- decision

### Context
После object-semantics baseline стало ясно, что перед любым governance implementation проекту нужен один компактный architecture scaffold, а не сразу permissions matrix.

### Goal or problem
Нужно было зафиксировать минимальную governance grammar, которая одинаково подходит и для rooms, и для board objects.

### What happened
Был добавлен canonical design doc:
- `docs/governance-scaffold-design.md`

В нём зафиксировано:
- governance starts from entity/action/access grammar;
- room и object governance используют одну и ту же conceptual model;
- `creatorId` и `effectiveAccessLevel` остаются разными понятиями;
- policy details сознательно отложены.

### Decision / change
Проект теперь сначала фиксирует lightweight governance scaffold, а уже потом идёт в narrow policy/implementation passes.

### Why
Без этого governance work слишком легко превращается либо в ad-hoc rules, либо в premature heavy permission system.

### Result
У проекта появился компактный governance-capable foundation layer без преждевременного ухода в full permissions design.

---

## Phase 0X — Minimal room ops panel became an explicit alpha need

### Type
- decision

### Context
После hosted alpha и накопления реальных server-side rooms стало ясно, что проекту уже нужен не только room runtime, но и минимальная operational surface для room hygiene и debugging.

### Goal or problem
Нужно было не потерять новый practical need:
- видеть, какие комнаты существуют на сервере;
- смотреть, что в них лежит;
- и уметь удалять / сбрасывать / чинить проблемные комнаты.

### What happened
Это было зафиксировано как отдельный near-term chapter:
- minimal hosted-alpha room operations panel.

### Decision / change
Новая задача должна мыслиться как narrow room operations surface, а не как broad admin product.

### Why
На текущей стадии проекту важнее practical operational control over rooms, чем heavy backoffice/admin system.

### Result
В roadmap и current-context теперь зафиксировано, что room ops panel — это отдельная ближайшая operational need.

---

## Phase 0X — Hosted durable snapshots were found to survive restart but not redeploy

### Type
- finding

### Context
После появления room ops panel стало возможно уже не только теоретически рассуждать о hosted snapshot persistence, а проверить её practically against real hosted behavior.

### Goal or problem
Нужно было понять, насколько current hosted durable room snapshots реально переживают operational events:
- обычный restart;
- redeploy.

### What happened
Практическая проверка показала:
- текущий hosted snapshot store переживает обычный restart backend process;
- но current hosted snapshot store не переживает redeploy.

### Decision / change
Этот факт теперь должен считаться explicit hosted limitation, а не предположением.

### Why
Иначе легко переоценить current hosted room durability и mistakenly treat snapshot persistence as deploy-stable when it is not.

### Result
Current hosted durability is now better understood as:
- restart-stable;
but not:
- redeploy-stable.

Это сохраняет честную operational framing для дальнейшего deploy/debug work и future persistence hardening.

---

## Phase 0X — Object interaction UI standardization was recognized as a future chapter

### Type
- decision

### Context
После нескольких object chapters стало видно, что interaction UI evolved case-by-case:
- images;
- tokens;
- legacy text-cards;
- new note-card.

### Goal or problem
Нужно было сохранить следующее направление:
- позже привести object interaction UI к одному более coherent standard;
- явно зафиксировать visual language, rules, and logic вместо продолжения purely local convergence.

### What happened
Было принято считать это отдельным future consistency chapter.

### Decision / change
Будущий chapter должен опираться на уже существующие object families и фиксировать общий interaction language для:
- selection;
- resize;
- occupied / blocked indication;
- preview / active-manipulation states.

### Why
Это повышает multiplayer readability и interaction consistency без необходимости немедленного broad rewrite.

### Result
Direction toward explicit object interaction standardization is now preserved in project docs instead of remaining only in chat context.

---

## Phase 0X — First governance scaffold code slice

### Type
- milestone

### Context
После governance scaffold design следующим правильным шагом было не policy rollout, а минимальный code-level foundation, который реально может нести эту grammar.

### Goal or problem
Нужно было перейти от design-only governance scaffold к реальной code structure без broad permission enforcement.

### What happened
В repo были добавлены:
- shared governance types;
- room metadata shape, способный хранить `creatorId`;
- helper для вычисления `effectiveAccessLevel`.

При этом current product behavior был сознательно оставлен без broad change.

### Decision / change
Governance в проекте теперь существует не только как design doc, но и как narrow architecture scaffold in code.

### Why
Это даёт проекту место для будущей governance implementation, не forcing premature role system, action matrix или ownership model.

### Result
У проекта появился первый real governance-capable code layer, но он всё ещё остаётся scaffold, а не policy system.

---

## Phase 0X — Room identity, room content, and local convenience state were explicitly separated

### Type
- decision

### Context
После fixes around room creator truth стало видно, что проблема не сводится только к browser-local metadata.

Даже shared live room-state оказалось недостаточно высоким уровнем истины для creator semantics, потому что live docs исчезают, когда комната перестаёт быть активной.

### Goal or problem
Нужно было явно развести:
- durable room identity;
- durable room content recovery;
- local browser convenience state.

### What happened
Был принят explicit room-memory priority order:

1. durable room identity
2. live shared room state
3. durable room snapshot
4. local convenience state
5. empty room

И отдельно зафиксировано, что local browser state нужен для UX convenience, а не для room truth.

### Decision / change
Комната теперь должна мыслиться не только как live room плюс snapshot, а как сущность с отдельным identity layer.

Это означает:
- room creator should ultimately anchor to durable room identity;
- durable snapshot remains content-recovery layer;
- local room metadata and future recent-room history remain convenience-only.

### Why
Без этого room creator, room history, и room recovery снова начинают смешиваться в один неустойчивый layer, где browser-local state и ephemeral live docs accidentally pretend to be canonical room truth.

### Result
Появилась более чистая architectural target model:
- room identity facts live separately;
- room content recovery remains snapshot-based;
- local browser memory explicitly demoted to convenience-only status.

Следующий clean architectural step из этой модели:

- room creator should move from live/snapshot-coupled truth to a separate durable room identity store;
- first-pass identity store should stay intentionally tiny:
  - `roomId`
  - `creatorId`
  - `createdAt`
- durable snapshot should remain content-only and stop carrying creator as identity authority.

---

## Phase 0X — Governance runtime path landed while policy stayed permissive

### Type
- milestone

### Context
После scaffold design и first code slice у проекта всё ещё не было настоящего runtime path, через который room/object actions consistently проходили бы governance resolution.

### Goal or problem
Нужно было сделать governance real in runtime, не превращая этот pass в restrictive permissions rollout.

### What happened
В проекте появились:
- action classification for current room and board-object actions;
- unified access resolution helpers;
- runtime wiring for current interaction paths.

При этом active policy осталась permissive, поэтому visible behavior сознательно не менялся.

### Decision / change
Governance в проекте теперь существует не только как scaffold types, но и как real runtime path that current actions already call.

### Why
Иначе later policy tightening пришлось бы начинать не с policy changes, а с изобретения whole runtime layer и переподключения interaction surfaces.

### Result
У проекта теперь есть working governance machinery, но restrictive permissions всё ещё не введены и остаются отдельным будущим pass.

---

## Phase 0X — Governance runtime became inspectable in Dev tools

### Type
- milestone

### Context
После permissive governance runtime pass стало ясно, что сам runtime path уже real, но почти invisible in practice.

### Goal or problem
Нужно было сделать governance runtime directly observable during development, не превращая это в end-user governance UI и не меняя policy behavior.

### What happened
В existing Dev tools появился небольшой `Governance` block, который показывает runtime governance resolution for current room/object actions.

При этом active policy осталась permissive и visible product behavior сознательно не менялся.

### Decision / change
Governance runtime теперь не только exists, но и inspectable from the current working UI.

### Why
Иначе проверка invisible systemic changes слишком сильно опирается на build success и на “ничего визуально не сломалось”.

### Result
У проекта появился минимальный inspectability surface для governance runtime без premature governance UI rollout.

---

## Phase 0X — Inspectability lesson for invisible systemic changes

### Type
- workflow

### Context
Governance runtime pass показал полезный общий pattern для проекта: некоторые архитектурные/systemic changes почти не видны наружу даже тогда, когда они реально работают.

### Goal or problem
Нужно было явно зафиксировать, как такие changes лучше validating in practice.

### What happened
Был сделан маленький inspectability pass в existing Dev tools вместо того, чтобы полагаться только на successful build и отсутствие obvious visible regressions.

### Decision / change
Для invisible/systemic changes проект теперь по возможности добавляет небольшой inspection mechanism рядом с implementation pass.

### Why
Это даёт более честную runtime feedback loop и снижает риск доверять только indirect signals.

### Result
У проекта появился ещё один practical workflow rule: invisible architecture/runtime changes should, when practical, ship with a small inspectability surface.

---

## Phase 0X — First tiny automated artifact guardrail

### Type
- workflow

### Context
После hosted video / deploy-discipline lesson стало ясно, что проекту полезен не большой testing chapter, а один very small automated guardrail против reasoning about the wrong built frontend artifact.

### Goal or problem
Нужно было добавить самый маленький repo-local check, который подтверждает, что built frontend bundle действительно содержит ожидаемый runtime-config / token-selection behavior.

### What happened
В repo был добавлен post-build artifact smoke check:
- `npm run smoke:artifact`
- `npm run build:smoke`

Он проверяет built main frontend asset на expected runtime markers вроде:
- `liveKitTokenUrl`
- `liveKitTokenUrlSource`
- `[runtime-config][client]`
- `/api/livekit/token`

### Decision / change
Это признано первым маленьким automated safety layer для repo, но не broad test infrastructure milestone.

### Why
Недавняя debugging pain шла в первую очередь от build/artifact provenance mismatch, а не от отсутствия большого UI/integration test suite.

### Result
У проекта появился дешёвый post-build sanity check, который помогает раньше заметить mismatch между expected frontend behavior и реально собранным artifact.

---

## Phase 0X — Hosted video milestone and deploy-discipline lesson

### Type
- milestone

### Context
После successful hosted core deploy следующий узкий шаг был про hosted video enablement без broad infrastructure rewrite.

### Goal or problem
Нужно было включить working video как optional alpha layer и понять, является ли remaining blocker app-side, provider-side или workflow-side.

### What happened
Hosted video в итоге заработало через narrow Vercel token fallback path поверх уже working hosted core stack.

Одновременно всплыл важный workflow lesson:
- часть debugging time была потрачена на сравнение live deploy behavior не с тем code state, потому что relevant frontend changes ещё не были committed/pushed.
- дополнительная задержка возникла из-за перехода из базового ChatGPT flow, где контекст был настроен под новичка и стандартные шаги проговаривались явно, в Codex executor-style flow, где по умолчанию предполагалось, что пользователь уже знает project workflow и сам делает стандартные commit/push/deploy steps.
- из-за этого ошибки сначала исправлялись локально без commit/push, а mismatch между local state и live deploy оставался неочевидным слишком долго.

### Decision / change
- hosted video milestone признан достигнутым;
- Vercel token fallback path признан практическим working hosted solution;
- commit/push/deploy verification before live-debugging теперь считается explicit workflow discipline.
- после этого в strategist thread была добавлена явная инструкция про форму общения с пользователем и про то, что правильные project practices / flow steps нужно проговаривать и постепенно закреплять, а не молча предполагать.

### Why
Это оказался не большой media-architecture chapter, а узкий operational unblock плюс важный engineering-process lesson.

### Result
Проект перешёл из `hosted core only` в `working hosted core + optional video`.

### Workflow notes
Перед live-debugging нужно сначала подтвердить:
- relevant code committed;
- pushed;
- actually present in the deployed build.

При переходе между chat modes и tool styles это нужно проговаривать явно, а не предполагать как already-known operator behavior.
Отдельно был скорректирован strategist-side guidance, чтобы дальше проверить, будет ли работа идти стабильнее, если expected workflow и user-facing communication style заданы явно.

### Remaining limitations / open questions
- hosted stack всё ещё alpha-stage, не production-ready;
- следующий сигнал должен приходить уже из continued hosted playable-session validation, а не из speculative cleanup.

---

## Phase 01 — Exploratory MVP proved the core board primitives

### Type
- milestone

### Context
До `play-space-alpha` был сделан отдельный исследовательский single-user MVP в репозитории `dnd-board-mvp`.

### Goal or problem
Нужно было быстро проверить, есть ли вообще живой интерес к board-first play space для игровых и ролевых сессий, не тратя время на финальную архитектуру.

### What happened
В MVP были собраны базовые примитивы:
- загрузка карты / изображения;
- токены;
- перемещение и удаление токенов;
- простые кубики;
- рисование;
- localStorage persistence;
- Vercel deploy.

### Decision / change
MVP не стал развиваться как основа финального multiplayer-продукта.

### Why
Он выполнил роль exploratory prototype, но не давал board-native multiplayer foundation.

### Result
Появился рабочий reference prototype и подтверждение, что board-first направление стоит продолжать.

### Workflow notes
На этом этапе важнее всего была скорость входа в практику, а не архитектурная чистота.

### Remaining limitations / open questions
- не было multiplayer;
- не было room/session model;
- не было presence и participant identity.

---

## Phase 02 — Decision to create `play-space-alpha` next to the MVP

### Type
- decision

### Context
После exploratory MVP стало ясно, что следующий шаг — не допиливать старый DOM/SVG prototype, а строить новую основу рядом.

### Goal or problem
Нужно было выбрать направление: расширять MVP, пойти в SDK-путь вроде tldraw или строить собственную board-native основу.

### What happened
Был выбран путь Б:
- `dnd-board-mvp` остаётся reference prototype;
- новый проект создаётся рядом как `play-space-alpha`;
- основной стек — React + TypeScript + Vite + Konva.

### Decision / change
Зафиксирован курс на **собственную board-first multiplayer foundation**.

### Why
Нужен был больший контроль над object model, room model и UX, чем мог бы дать чужой board SDK.

### Result
Проект получил отдельный alpha-трек, заточенный под будущий multiplayer product.

### Workflow notes
Здесь важную роль сыграло разделение ролей:
- ChatGPT использовался для product/architecture framing;
- Codex — как implementation layer.

### Remaining limitations / open questions
- больше engineering cost по сравнению с SDK-путём;
- selection, viewport, persistence и realtime нужно строить самостоятельно.

---

## Phase 03 — v1-alpha contract and board-first multiplayer framing

### Type
- decision

### Context
После выбора нового alpha-проекта нужно было зафиксировать продуктовую рамку, чтобы engineering не расползался.

### Goal or problem
Нужно было явно определить, что именно считается первой полезной multiplayer-версией.

### What happened
Был зафиксирован v1-alpha scope:
- одна комната;
- вход по ссылке;
- имя и цвет участника;
- общая большая доска;
- курсоры;
- изображения;
- токены;
- рисование;
- realtime.

Одновременно было зафиксировано, что не входит в alpha:
- видео;
- 3D dice;
- роли;
- permissions;
- сцены;
- polished UI.

### Decision / change
Продуктовая рамка alpha была сужена до board-first core loop.

### Why
Нужно было защитить проект от раннего расползания в heavy VTT или в интеграционный комбайн.

### Result
Появился чёткий продуктовый контракт для инженерной работы.

### Workflow notes
Здесь закрепился паттерн: сначала product contract, потом implementation prompts.

### Remaining limitations / open questions
- как именно будут устроены text objects;
- как дальше развивать participant color model;
- как позже проверять video/dice integration.

---

## Phase 04 — Early board interaction polish and image outline cleanup

### Type
- debug

### Context
По мере развития board interactions начали проявляться UX-шероховатости.

### Goal or problem
Нужно было убрать лишний custom outline у выбранного изображения и не дублировать стандартный transformer frame.

### What happened
Был найден и сформулирован точный небольшой фикс: полностью удалить manual selected-image outline и оставить только стандартный Konva Transformer frame/handles.

### Decision / change
Custom image selection outline был убран.

### Why
Лишняя рамка мешала взаимодействию и делала selection менее чистым.

### Result
Image selection стал визуально нормальнее и предсказуемее.

### Workflow notes
Это был хороший пример того, как лучше давать Codex не размытую UX-жалобу, а очень конкретный desired behavior.

### Remaining limitations / open questions
- broader image interaction model всё ещё требовал дальнейшей стабилизации.

---

## Phase 05 — Architecture audit workflow instead of broad refactor

### Type
- workflow

### Context
В какой-то момент стало ясно, что `BoardStage` стал ключевым integration surface, и соблазн "переписать всё красивее" был высок.

### Goal or problem
Нужно было получить архитектурный контроль без опасного broad rewrite.

### What happened
Был создан scaffolding для работы Codex в режиме архитектурного аудита и phased refactor:
- `AGENTS.md`
- `PLANS.md`
- `.codex/config.toml`
- `.codex/agents/board_refactor_auditor.toml`
- `.agents/skills/board-architecture-audit/SKILL.md`

Потом был проведён read-only audit, а рекомендованный Phase 1 был дополнительно сужен до safe leaf extraction.

### Decision / change
Вместо большого rewrite был выбран путь:
- сначала audit;
- потом narrow safe refactor;
- затем возврат к развитию продукта.

### Why
`BoardStage` был слишком чувствительным местом, чтобы рискованно "навести красоту" без product reason.

### Result
Проект получил более зрелый engineering workflow: осторожные phased changes вместо реформаторских рывков.

### Workflow notes
Это был важный переломный момент в AI workflow:
- стало ясно, что Codex лучше работает в narrow, explicit, safety-constrained passes;
- для архитектурных развилок полезнее сначала read-only audit, чем сразу implementation.

### Remaining limitations / open questions
- рефакторинг остался частично отложенным;
- основной фокус вернулся к board behavior и product stability.

---

## Phase 06 — First room snapshot model: local room persistence as fallback

### Type
- decision

### Context
Когда появились комнаты и shared state, возник вопрос: что происходит, если все клиенты уходят и live room state исчезает.

### Goal or problem
Нужно было дать комнате базовое восстановление после ухода всех клиентов, не вводя сразу полноценную backend persistence architecture.

### What happened
Появилась идея room snapshot как **структурированных данных комнаты**, а не screenshot.
Сначала был реализован write-only snapshot layer:
- snapshot хранит `roomId`, `savedAt`, committed `tokens`, `images`, `textCards`;
- не хранит transient state, awareness, cursors, selection и другой UI/runtime noise.

### Decision / change
Комнатное состояние стало периодически сохраняться локально как room snapshot.

### Why
Это был самый маленький безопасный шаг к room recovery без немедленного перехода к полноценной общей persistence.

### Result
Появилась база для дальнейшего controlled bootstrap/recovery.

### Workflow notes
Здесь было важно сначала прояснить продуктовую модель snapshot vs live, а уже потом кодить.

### Remaining limitations / open questions
- локальный snapshot был персональным, а не общим;
- не было гарантии, что он отражает самый новый room state среди всех клиентов.

---

## Phase 07 — Controlled snapshot bootstrap and distinction between "not loaded" and "empty"

### Type
- decision

### Context
Следующим шагом стало чтение snapshot при входе в комнату.

### Goal or problem
Нужно было избежать ложного восстановления из snapshot до того, как shared room state реально догрузился.

### What happened
Была зафиксирована и реализована логика:
- `not loaded yet` != `loaded and empty`;
- recovery допустим только после explicit initial sync;
- recovery включается только если shared room действительно пустая.

В `BoardStage` появился gated bootstrap flow и явный tracking initial sync по tokens/images/text-cards.

### Decision / change
Snapshot recovery стал controlled, а не наивным bootstrap seed.

### Why
Иначе система путала "комната ещё грузится" с "комната пустая" и могла восстановить snapshot поверх live state.

### Result
Модель recovery стала заметно безопаснее.

### Workflow notes
Это был пример хорошего этапного подхода: сначала write-only layer, потом read/bootstrap layer.

### Remaining limitations / open questions
- snapshot всё ещё мог быть затёрт в неправильный момент room switch / bootstrap.

---

## Phase 08 — Debugging snapshot overwrite during room bootstrap

### Type
- debug

### Context
После controlled bootstrap выяснилось, что реальный жизненный сценарий всё равно ломается: выйти из комнаты, потом вернуться — и увидеть пустоту.

### Goal or problem
Нужно было понять, почему room snapshot не восстанавливает комнату в реальном сценарии `room1 -> room2 -> room1`.

### What happened
Был найден конкретный logic bug:
- при room entry `BoardStage` делал reset через `getRoomScopedObjects(roomId)`;
- shared kinds временно фильтровались;
- persistence effect успевал записать пустой snapshot;
- старый хороший snapshot комнаты затирался;
- recovery потом читал уже пустой snapshot.

Дальше последовало несколько итераций исправлений:
- запрет snapshot write до завершения initial shared load;
- room-scoped sync state вместо простых boolean;
- explicit bootstrap resolution marker, чтобы write path не опережал recovery decision.

### Decision / change
Write path и bootstrap path были разведены более строго.

### Why
Нужно было защитить snapshot от затирания во время room bootstrap/reset.

### Result
Локальная room recovery стала работать заметно стабильнее.

### Workflow notes
Это был показательный случай, где сначала была неверная гипотеза о "model mismatch", но затем read-only diagnosis сузил проблему до конкретного ordering bug.

### Remaining limitations / open questions
- даже после этого local snapshots оставались fundamentally weak source of truth для общей комнаты.

---

## Phase 09 — Realization that local snapshots are not enough for room truth

### Type
- decision

### Context
На реальном многопользовательском сценарии проявилось фундаментальное ограничение local snapshot strategy.

### Goal or problem
Нужно было понять, почему сценарий `A=t1, B=t2, A returns first` всё равно может терять более новый room state.

### What happened
Был проговорён и признан продуктовый факт:
- если durable state живёт только в local snapshots разных клиентов,
- то первый вернувшийся клиент может восстановить старый state как новый live,
- а более новый snapshot другого клиента может быть потерян.

### Decision / change
Было принято решение: нужен **durable room-level state**, а local snapshot остаётся только fallback-only.

### Why
Персональный local cache не может быть source of truth для общей комнаты.

### Result
Проект перешёл от personal fallback model к идее общей room persistence.

### Workflow notes
Это была важная product/architecture clarification: проблема была не в одном баге, а в границе самой модели.

### Remaining limitations / open questions
- как реализовать room-level durability минимально и безопасно;
- как обойтись без premature merge/reconciliation complexity.

---

## Phase 10 — Durable room snapshot persistence

### Type
- milestone

### Context
После признания ограничений local-only model нужно было сделать первый практический durable room persistence layer.

### Goal or problem
Нужно было добавить room-level persistence без broad redesign realtime architecture.

### What happened
Был реализован первый минимальный durable room snapshot layer:
- server-backed API для room snapshots;
- file-backed store в dev server;
- room snapshot shape с `roomId`, `revision`, `savedAt`, `tokens`, `images`, `textCards`;
- compare-and-swap semantics через `baseRevision`.

Bootstrap priority был переопределён как:
1. live shared room state
2. durable room snapshot
3. local personal snapshot
4. empty room

### Decision / change
Durable room snapshot стал главным persistence source для room recovery.

### Why
Нужно было перестать зависеть от того, чей local snapshot оказался "первым".

### Result
Архитектура room recovery стала ближе к реальному room-level persistence.

### Workflow notes
Это был пример маленького, но product-meaningful architectural step: не full persistence platform, а минимальный durable layer с clear semantics.

### Remaining limitations / open questions
- conflict handling всё ещё требовал дальнейшей осторожной стабилизации;
- модель пока best-effort, а не merge-aware collaborative durable system.

---

## Phase 11 — Recovery regression debugging: hanging durable GET route

### Type
- debug

### Context
После добавления durable layer комната на первом тесте снова возвращалась пустой.

### Goal or problem
Нужно было понять, сломался ли recovery control flow, save path или сам durable API.

### What happened
Сначала было несколько гипотез о bootstrap logic.
Потом был применён более дисциплинированный подход:
- добавлена targeted instrumentation;
- восстановлен runtime branch trace;
- отдельно руками проверен durable API через browser и `curl`.

Выяснилось, что:
- `GET /api/room-snapshots/:roomId` зависал;
- `loadDurableRoomSnapshot(roomId)` ждал бесконечно;
- bootstrap не получал terminal outcome;
- local fallback не успевал отработать.

Root cause:
- async HTTP handler в dev server не имел надёжного top-level error response path;
- rejected/throwing async branch мог оставить request hanging.

Дополнительно был добавлен client-side fail-fast timeout для durable GET.

### Decision / change
Server route был исправлен так, чтобы всегда завершаться ответом, а клиентский durable load стал fail-fast.

### Why
Без этого durable layer фактически блокировал весь bootstrap pipeline.

### Result
Room recovery снова начал работать ожидаемо.

### Workflow notes
Это очень важный workflow lesson:
- speculative control-flow fixes не помогли;
- настоящий прогресс начался только после instrumentation + ручной проверки API через `curl`.

### Remaining limitations / open questions
- durable save path всё ещё требовал безопасной conflict-политики;
- нужно было не потерять эту debug story для будущего case study.

---

## Phase 12 — Conservative conflict handling for durable save

### Type
- decision

### Context
После запуска durable persistence оставался тонкий риск silent corruption на CAS conflict.

### Goal or problem
Нужно было убедиться, что stale client не сможет перезаписать более новый durable snapshot простой автоматической повторной записью.

### What happened
Был найден опасный паттерн:
- при conflict клиент обновлял revision;
- затем сразу повторял save тем же local payload.

Это было признано unsafe.

### Decision / change
Immediate stale retry был убран.
На conflict клиент теперь:
- обновляет знание о revision;
- не делает force-write тем же stale payload;
- ждёт следующего normal save cycle.

### Why
Иначе compare-and-swap защита теряла смысл и могла тихо откатывать более новый durable snapshot.

### Result
Conflict handling стал консервативным и безопасным для текущей стадии проекта.

### Workflow notes
Это хороший пример того, как безопасное поведение иногда важнее "агрессивной самопочинки".

### Remaining limitations / open questions
- durable persistence остаётся best-effort;
- полноценного merge/reconciliation по-прежнему нет и это нормально для текущей фазы.

---

## Phase 13 — Formalizing the AI-assisted workflow and documentation system

### Type
- workflow

### Context
По мере роста проекта стало ясно, что история решений и сам процесс работы между человеком, ChatGPT и Codex начинают быть не менее важны, чем код.

### Goal or problem
Нужно было перестать терять контекст между чатами и начать осознанно собирать материал для будущего case study.

### What happened
Было принято решение разделить документацию на три роли:
1. foundation file — стабильная рамка проекта;
2. current-context file — handoff между чатами;
3. case-study log — накопительный журнал решений, багов, milestones и workflow lessons.

Отдельно было зафиксировано, что case-study log должен хранить не только product/engineering history, но и сам AI workflow:
- разделение ролей ChatGPT и Codex;
- prompting patterns;
- analysis-first passes;
- instrumentation как способ отладки;
- правила handoff между чатами.

### Decision / change
Documentation system стала частью project workflow, а не внешним вторичным делом.

### Why
Без этого case study пришлось бы собирать задним числом по чатам и смутной памяти.

### Result
Проект получил структуру, которая позволяет:
- переносить контекст между чатами;
- накапливать историческую память;
- со временем собрать осмысленный product/engineering case study.

### Workflow notes
Это один из самых прямых примеров того, что в AI-assisted проекте сам способ совместной работы — часть продукта и часть истории.

### Remaining limitations / open questions
- дисциплину обновления журнала ещё нужно подтвердить практикой;
- в будущем может понадобиться finer-grained separation между decision log и broader narrative log.

---

## Current likely next chapter

### Type
- decision

### Context
После стабилизации durable persistence проект вернулся к вопросу: какой следующий продуктовый слой развивать.

### Goal or problem
Нужно не просто выбрать очередную фичу, а сначала прояснить interaction model для одного из ключевых слоёв продукта.

### What happened
Следующим сильным кандидатом была признана **color system**, потому что participant color — это важная часть multiplayer identity, presence и board readability.

Но было решено не давать сразу implementation task.
Сначала нужен read-only analysis pass с целью:
- описать текущий механизм цвета;
- понять, что цвет реально означает сейчас;
- найти несогласованности;
- предложить candidate interaction models;
- выбрать целевую модель до начала code changes.

Параллельно отдельно признаны важными будущими spikes:
- 3D dice integration
- video conference integration

### Decision / change
Следующий содержательный шаг — сначала сформулировать colour interaction vision, а не сразу кодить.

### Why
Для таких слоёв сначала нужна ясность модели, а не ранний implementation churn.

### Result
Следующий этап проекта был сужен до analysis-first pass по color system.

### Workflow notes
Это продолжает уже укрепившийся паттерн: unclear interaction model -> read-only audit -> recommendation -> only then implementation.

### Remaining limitations / open questions
- какая именно цветовая модель лучше подходит board-first multiplayer play space;
- как потом реализовать её без broad rewrite;
- как и когда запускать отдельные spikes по video и 3D dice.

---

## 2026-04-06 — Color model canonicalization and first live-linked implementation pass

### Type
- decision
- workflow
- milestone

### Context
После стабилизации durable room persistence проект переключился на следующий содержательный слой: color system как часть multiplayer identity, board readability и interaction semantics.

### Goal or problem
Нужно было перестать мыслить цвет как неясную смесь participant identity, object style, author trace и action cue, и вместо этого:
- зафиксировать каноническую semantic model;
- проверить текущую реализацию против этой модели;
- сделать узкие implementation passes без broad rewrite;
- при этом не переоценить локальные cosmetic changes как реальный multiplayer progress.

### What happened
Работа пошла в несколько этапов.

Сначала была сформулирована целевая color model:
- `PlayerColor` = живой identity color участника;
- цвет не означает permissions/ownership;
- `token` и `text-card` признаны creator-linked objects;
- `image` признан neutral shared object;
- live interaction cues должны кодировать current actor;
- creator-linked visuals должны резолвиться от текущего цвета создателя, а не от snapshot-цвета на момент создания.

Затем под эту модель были созданы operational docs:
- `docs/color-model-design.md` как canonical semantic spec;
- секция в `AGENTS.md`, закрепляющая этот design doc как source of truth.

После этого был проведён read-only gap analysis. Он показал, что:
- participant identity layer уже относительно здоров;
- главный semantic debt сидит в snapshot-based `authorColor` и перегруженном использовании color fields;
- images и live interaction cues местами всё ещё смешивают actor semantics, creator semantics и local viewer semantics.

Потом был сделан первый implementation pass по actor-colored selection/manipulation feedback. Формально он был корректен, но быстро выяснилось, что продуктовая ценность этого pass ограничена:
- локальный actor-colored selection почти ничего не даёт;
- настоящая ценность есть только там, где сигнал виден другим участникам.

Это привело к полезной переоценке критериев прогресса: semantically correct local polish не равен multiplayer-readable improvement.

Дальше был найден и исправлен важный correctness bug в image remote preview:
- remote preview для image drag показывал цвет viewer, а не actor;
- root cause оказался в том, что drag preview path не передавал `participantColor` через shared preview state;
- renderer фолбэчился к `currentUserColor`, тем самым выдавая ложный multiplayer signal;
- после фикса shared preview начал передавать actor color, а fallback стал neutral, а не viewer-local.

Затем был добавлен transient multiplayer-visible text-card editing indicator:
- другие участники теперь видят, какая карточка редактируется;
- видят имя и цвет актора;
- индикатор остаётся transient и не меняет persistent style карточки.

После этого приоритет был сознательно смещён от transient рамок к более важной вещи: live-linked creator color для creator-linked объектов.
Был реализован узкий pass:
- новые `token` и `text-card` начали сохранять `creatorId`;
- runtime rendering начал резолвить token main color и text-card accent от текущего `PlayerColor` создателя;
- старые объекты без `creatorId` оставлены на safe fallback через legacy color snapshots.

Финальная ручная проверка подтвердила, что:
- новые token меняют цвет у всех клиентов при смене цвета автора;
- новые text-card меняют creator accent у всех клиентов при смене цвета автора.

### Decision / change
Были приняты и частично реализованы следующие решения:
- color semantics должны жить в отдельном canonical design doc, а не только в обсуждении;
- progress нужно мерить не только semantic correctness, но и реальной multiplayer value;
- creator-linked objects должны опираться на creator identity, а не только на snapshot color;
- transient actor cues полезны только там, где они реально видны remote participants;
- images остаются neutral shared objects, а creator-linked migration туда пока не идёт;
- legacy snapshot-based objects допустимо временно поддерживать через fallback без немедленной полной миграции.

### Why
Этот путь оказался правильным, потому что:
- сначала снял семантическую неясность;
- затем позволил узко и безопасно править код;
- помог отфильтровать low-value local polish от high-value multiplayer improvements;
- дал реальный product gain без broad rewrite.

### Result
Проект получил:
- canonical color model;
- более зрелый workflow для semantic changes;
- исправленный image remote preview actor cue;
- working text-card editing presence cue;
- live-linked creator color для новых token и text-card;
- compatibility layer для старых snapshot-based объектов.

### Workflow notes
Это важный workflow lesson для всего проекта:
- сначала semantic contract,
- потом read-only gap analysis,
- потом narrow implementation,
- потом обязательная проверка реальной product value.

Отдельно подтвердилось ещё одно правило:
- нельзя считать локальный cosmetic alignment полноценным multiplayer progress;
- если сигнал не помогает другому участнику понять, кто и что делает, его ценность может быть низкой даже при semantic correctness.

Ещё один полезный lesson:
- viewer-local fallback для remote actor cues опасен;
- лучше neutral fallback или no signal, чем неверная attribution.

### Remaining limitations / open questions
- старые token / text-card без `creatorId` по-прежнему живут на legacy fallback;
- пока не ясно, нужен ли отдельный migration path для них;
- drawing color model остаётся transitional;
- не решено, какие transient indicators действительно нужны продукту, а какие добавляют визуальный шум;
- нужен отдельный UX review pass по локальной вкладке и interaction indicators;
- позже нужно отдельно решить судьбу video и 3D dice spikes, не смешивая их с color-layer work.


---

## 2026-04-06 — Canonical zero state and separation of board content from viewport semantics

### Type
- decision
- workflow
- milestone

### Context
После завершения основного color-cycle всплыл старый исторический хвост в lifecycle semantics доски: в проекте ещё жил placeholder starter board с одной заметкой, одним токеном и одной картинкой. При этом фактическое поведение новой комнаты уже тяготело к пустой доске, но это получалось не через явную модель zero state, а косвенно.

### Goal or problem
Нужно было отделить три разных сущности, которые начали смешиваться:
- пустое содержимое доски как domain state;
- starter / onboarding content;
- viewport / camera behavior.

Отдельно нужно было исправить reset semantics: reset board должен чистить контент, но не должен неожиданно менять zoom/pan.

### What happened
Сначала был сделан read-only analysis bootstrap/default-state модели. Он показал, что:
- исторический placeholder board всё ещё определён в `src/data/initialBoard.ts`;
- brand-new room фактически приходит к пустой доске только косвенно, через filter-out shared objects;
- `resetBoard()` по-прежнему восстанавливает placeholder board напрямую;
- явного canonical zero-state abstraction в коде нет.

После этого был сделан узкий implementation pass:
- введён canonical zero state как отдельная логическая единица board content;
- старый placeholder starter board убран из активной runtime-semantics;
- reset board переведён на zero state;
- reset board больше не меняет zoom/pan;
- initial room framing был отделён от zero state и оформлен как отдельная viewport/camera semantics для первого входа в комнату.

### Decision / change
Были зафиксированы следующие решения:
- **zero state** = пустое содержимое доски и только оно;
- starter/onboarding content не должно быть каноническим meaning of empty room;
- viewport/camera behavior не должно быть частью zero state;
- reset board = clear content only;
- first-entry framing = отдельная room-entry camera policy.

### Why
Это решение очистило модель room lifecycle:
- empty board перестал зависеть от исторического placeholder;
- reset перестал делать скрытый content+camera reset одновременно;
- появилась чистая архитектурная граница между board domain state и view/session state.

### Result
Проект получил:
- canonical zero state как first-class logical unit;
- removal of active placeholder starter-board semantics;
- cleaner reset behavior;
- separation between board content state and viewport/camera semantics;
- более правильную основу для будущего onboarding UX и possible room-specific viewport restore.

### Workflow notes
Это был хороший пример того, как полезно сначала сделать read-only semantic analysis, а уже потом менять код. Важный lesson: иногда правильный шаг — не просто заменить один default на другой, а сначала выделить missing abstraction как отдельную логическую сущность.

### Remaining limitations / open questions
- room-specific viewport restore при повторном входе в комнату ещё не оформлен как отдельный завершённый слой;
- onboarding/starter experience позже можно вернуть, но только как отдельный UX layer, а не как default board state;
- возможно later понадобится cleanup остаточного кода/имен, если historical `initialBoard` references ещё где-то остались вне runtime semantics.

---

## 2026-04-06 — Drawing switched to live-linked creator color and the color chapter reached checkpoint state

### Type
- decision
- milestone
- workflow

### Context
После token и text-card colour passes оставался открытым вопрос по drawing: должен ли рисунок сохранять historical color, использовать live-linked creator color или жить в гибридной модели. Дополнительно нужно было понять, готов ли весь color chapter к checkpoint/commit.

### Goal or problem
Нужно было решить drawing semantics без дорогой миграции и проверить, не осталось ли в проекте серьёзных color inconsistencies после серии узких passes.

### What happened
Сначала было принято условное решение: если drawing можно перевести на live-linked creator color без существенного technical risk/cost, делать это; если нет — остановиться и зафиксировать blocker.

Реальный implementation pass оказался узким и дешёвым:
- `ImageStroke` получил optional `creatorId`;
- новые strokes начали сохранять `creatorId: participantSession.id`;
- цвет stroke стал резолвиться в рантайме от текущего `PlayerColor` автора;
- для legacy strokes без `creatorId` сохранён safe fallback на stored historical `stroke.color`.

После этого был выполнен финальный read-only color consistency audit по ключевым зонам проекта:
- cursor/presence;
- token;
- text-card;
- image;
- drawing;
- transient interaction cues.

Аудит показал, что blocking semantic inconsistency больше не осталось:
- `PlayerColor` теперь стабильно работает как live identity;
- creator-linked objects live-linked там, где это задумано;
- neutral image rendering не притворяется creator-linked;
- viewer-local color больше не используется как ложный fallback для чужих cues;
- remaining debt — это legacy fallback и future UX cleanup, а не correctness bug.

### Decision / change
Были зафиксированы следующие решения:
- drawing joins the live-linked creator-color model for new strokes;
- legacy drawing data остаётся на safe fallback без обязательной миграции;
- color chapter считается семантически coherent enough for checkpoint/commit.

### Why
Это решение дало консистентность без тяжёлой цены:
- не потребовались миграции;
- не понадобился broad refactor draw mode или sync layer;
- общий color model стал почти полностью замкнутым вокруг live identity + creator-linked rendering + safe legacy fallback.

### Result
Проект получил:
- live-linked creator color для новых drawing strokes;
- backward compatibility для старых strokes;
- финальный consistency audit;
- готовность зафиксировать color chapter как отдельный checkpoint.

### Workflow notes
Здесь подтвердилось полезное правило: даже если объект кажется семантически спорным, решение не стоит принимать только по интуиции. Лучше сначала сформулировать целевую модель, потом дать implementation только при условии low-risk feasibility, а в конце обязательно пройти финальный coherence audit перед коммитом.

### Remaining limitations / open questions
- legacy objects и legacy strokes по-прежнему завязаны на snapshot color fallback, что допустимо, но остаётся mild model debt;
- часть local-only manipulation cues остаётся low-value multiplayer polish, а не обязательной product work;
- дальше нужно решить, считать ли color chapter полностью закрытым или ещё нужен later cleanup `authorColor` baggage.

---

## 2026-04-06 — Video exploration narrowed to OSS/self-hosted paths and shifted toward a disciplined LiveKit-first spike

### Type
- decision
- workflow

### Context
После стабилизации board/color слоя следующей крупной развилкой стали два будущих product spikes:
- встроенное видео;
- 3D dice.

Полишинг UI/UX был сознательно отложен. Приоритет сместился к проверке тех слоёв, которые могут приблизить проект к реальной playable session.

### Goal or problem
Нужно было определить, как тестировать video layer так, чтобы:
- не уйти в heavy SaaS dependence;
- не получить usage-based ceiling;
- сохранить минимум ~6 одновременных участников и potential headroom;
- не начать преждевременно строить собственную media platform.

### What happened
Сначала video directions были просмотрены широко, включая managed/embed candidates и VDO.Ninja. Затем ограничения были ужесточены:
- без платных SaaS;
- без лимитов по минутам / трафику;
- self-hosted / OSS path обязателен.

После этого shortlist сузился до двух реальных кандидатов:
- **Jitsi Meet self-hosted**;
- **LiveKit self-hosted**.

В ходе product/technology comparison была сформулирована новая развилка:
- **Jitsi** = safer pragmatic spike;
- **LiveKit** = better product-direction fit.

Дополнительно был сделан planning/research pass specifically про narrow LiveKit-first spike. Он показал, что LiveKit можно считать realistic next step, если держать scope brutally small:
- self-hosted LiveKit server;
- маленький token endpoint;
- `roomId` как media room name;
- `participantSession.id/name` как identity mapping;
- simple local/remote AV dock;
- join/leave + mic/cam toggles;
- no chat / recording / screenshare / moderation / media-platform overbuild.

### Decision / change
Текущий video direction был зафиксирован так:
- общий video exploration narrowed to **Jitsi self-hosted vs LiveKit self-hosted**;
- pragmatic fallback remains **Jitsi**;
- current preferred direction becomes **narrow LiveKit-first spike**;
- следующий правильный шаг — не кодить сразу, а сделать read-only implementation plan для узкого LiveKit integration path.

### Why
Это решение дало лучший компромисс между feasibility и product fit:
- Jitsi остаётся безопасной fallback-веткой, если bandwidth на infra/media plumbing окажется слишком мал;
- LiveKit лучше совпадает с board-first multiplayer логикой проекта и меньше похож на “meeting widget on top of the board”;
- при жёстком scope discipline LiveKit не обязан превращаться в преждевременную video-platform initiative.

### Result
Проект получил:
- более зрелую decision frame для video layer;
- ясную границу safe scope для первого LiveKit spike;
- explicit fallback path в виде Jitsi;
- следующий понятный research/implementation planning step.

### Workflow notes
Это ещё один сильный пример AI-assisted workflow:
- сначала broad landscape;
- потом constraints tightening;
- потом narrowing to 2 real candidates;
- потом отдельный feasibility/planning pass для preferred direction.

Полезный lesson: для integration-heavy решений полезно сначала отделять product-direction fit от pure easiest-path thinking. Самый быстрый вариант не всегда даёт правильный продуктовый сигнал.

### Remaining limitations / open questions
- ещё не построен read-only implementation plan для узкого LiveKit spike внутри текущей codebase;
- ещё не проверена фактическая локальная self-hosting ergonomics для команды;
- 3D dice spike по-прежнему остаётся важным следующим продуктовым направлением после video или параллельно позже;
- остаётся риск overbuilding, если implementation scope не будет жёстко удержан.

---

## 2026-04-06 — Narrow LiveKit-first spike moved from research framing to working technical validation

### Type
- milestone
- decision
- debug
- workflow

### Context
После narrowing video direction до `Jitsi self-hosted` vs `LiveKit self-hosted` и выбора LiveKit как preferred product-direction fit следующим шагом стал реальный узкий integration spike внутри `play-space-alpha`.

### Goal or problem
Нужно было проверить, можно ли встроить self-hosted LiveKit в текущую codebase как небольшой AV-layer рядом с board, не превратив проект в media-platform initiative.

### What happened
Работа прошла в несколько стадий.

Сначала был сделан первый implementation pass:
- narrow LiveKit integration layer;
- token endpoint на existing dev server;
- mapping `roomId` -> room, `participantSession.id/name` -> identity;
- simple media dock с join/leave, local/remote tiles, mic/camera toggles.

После этого основной объём усилий ушёл не в board/video architecture, а в debugging local-dev plumbing.
Были последовательно найдены и исправлены / обойдены следующие проблемы:
- token endpoint initially did not see credentials because `presence-server` env loading path was tied to root `.env`;
- frontend/backend token contract был несогласован по field names;
- Dockerized LiveKit path на macOS дал misleading local success surface, но в реальности упирался в ICE/connectivity pain;
- для local dev default path был сделан pivot на native `livekit-server`;
- LAN testing упёрся в browser secure-context requirements, потому что `http://<LAN-IP>` не давал `navigator.mediaDevices`;
- для multi-device test был добавлен local HTTPS/WSS LAN proxy path;
- dev workflow сначала оказался слишком ручным, затем был приведён к one-command scripts;
- потом localhost и LAN режимы были разведены в отдельные env files и root `.env` стал obsolete.

Отдельно после того как integration уже заработала, был сделан узкий stabilization pass по media dock:
- intentional leave перестал выглядеть как disconnect error;
- stale generic error banners стали очищаться после successful recovery / successful mic-camera toggle.

В результате были вручную подтверждены основные smoke paths:
- localhost;
- localhost two-tab;
- secure LAN path;
- хотя trust ergonomics для разных клиентов остались rough.

### Decision / change
Были фактически приняты следующие решения:
- narrow LiveKit-first spike подтверждён как технически жизнеспособный;
- native `livekit-server` — правильный local-dev default for macOS, а не Docker;
- LAN multi-device testing требует secure-origin setup и должен идти через HTTPS/WSS proxy;
- dev workflow должен иметь отдельные explicit modes (`dev:local`, `dev:lan`), а не ручное переписывание `.env`;
- root `.env` больше не нужен как основной источник truth для стандартного dev workflow.

### Why
Эта последовательность решений оказалась правильной, потому что:
- подтвердился product-shaped integration path without broad rewrites;
- стало ясно, что board/video boundary itself is not the main blocker;
- реальные проблемы лежали в env plumbing, local networking и browser secure-context rules;
- после их решения стало возможно честно оценивать сам video layer, а не бесконечно спорить с локальной инфраструктурой.

### Result
Проект получил:
- working narrow LiveKit spike;
- usable local and LAN dev workflows;
- explicit mode-specific env setup;
- removal of obsolete root `.env` from normal workflow;
- more truthful media dock state handling;
- technical confirmation that built-in video can be layered next to the board without immediate architectural collapse.

### Workflow notes
Этот chapter дал несколько сильных AI/workflow lessons:
- implementation-heavy integration spikes всё равно часто требуют multiple narrow debug passes, а не один “сделай всё” prompt;
- debugging order matters: token path -> env -> request contract -> runtime path -> network path -> browser secure-context;
- Docker may be a convenient first guess, but not always the right local-dev default on macOS for media stacks;
- once a spike works, the next useful pass is often not another feature pass, but a DX cleanup so the setup becomes repeatable;
- manual smoke testing on real devices gave higher-value signal than further abstract discussion.

### Remaining limitations / open questions
- local CA trust ergonomics for Windows/iPhone Safari remain rough;
- media dock UX is still spike-level, not polished conferencing UX;
- error handling remains intentionally basic;
- the next product question is no longer “can LiveKit be integrated at all?”, but “what should happen after technical feasibility has been confirmed?”



---

## 2026-04-07 — Authoritative shared 3D dice moved from exploratory renderer spike to accepted alpha core layer

### Type
- milestone
- decision
- debug
- workflow

### Context
После того как LiveKit chapter был признан технически подтверждённым, но не требующим немедленного продолжения, проект переключился на следующий большой product spike: встроенные 3D dice как часть playable session.

### Goal or problem
Нужно было добавить dice layer так, чтобы он:
- выглядел красиво и тактильно;
- был multiplayer-visible;
- использовал player color;
- показывал один и тот же authoritative visible result всем участникам;
- не превращался в rules engine или тяжёлую отдельную platform.

Главная скрытая развилка быстро оказалась не в UI tray и не в Yjs event propagation, а в том, поддерживает ли выбранный renderer **forced / authoritative visible outcome**.

### What happened
Работа пошла в несколько этапов.

Сначала был сделан design/spec pass:
- canonical dice design doc;
- implementation plan;
- фиксация viewport-fixed overlay как first-pass placement;
- фиксация event-sync вместо physics-stream sync;
- фиксация authoritative visible outcome как обязательного требования;
- actor-colored dice как обязательного multiplayer cue.

После этого был поднят первый renderer path на `@3d-dice/dice-box`.
Им удалось подтвердить несколько важных вещей:
- local tactile feel жизнеспособен;
- overlay path жизнеспособен;
- actor-colored dice жизнеспособны;
- shared transient roll events жизнеспособны.

Но дальше narrow correctness pass показал реальный blocker:
- authoritative numeric result уже передавался в shared event;
- однако renderer всё равно локально доигрывал собственный physics outcome;
- safe/public forced visible outcome API найден не был;
- deterministic seed replay тоже не выглядел надёжным.

Это было признано не wiring bug, а product-blocking renderer limitation.
Текущий `dice-box` path был отклонён.

После этого был сделан отдельный read-only decision pass по новым направлениям.
Были рассмотрены:
- forced-outcome renderers;
- dddice-like architecture;
- revisiting actual `dddice`.

В результате была зафиксирована правильная продуктовая модель:
- не live canvas/video broadcast;
- не shared physics;
- а **dddice-like architecture**:
  - authoritative roll event;
  - local 3D render on each client;
  - одинаковый visible final result у всех;
  - actor color;
  - overlay-first placement.

Primary next try стал `@3d-dice/dice-box-threejs`, потому что он выглядел самым близким к уже существующему spike path и при этом explicitly supported predetermined outcomes.
Fallback был зафиксирован как small custom controlled renderer on Three.js / React Three Fiber.
`dddice` был возвращён в shortlist как pragmatic hosted fallback.

Новый renderer spike на `@3d-dice/dice-box-threejs` оказался успешным.
В ходе нескольких узких implementation/polish passes были добавлены и подтверждены:
- shared public authoritative `d20`;
- correct remote actor color;
- full-screen viewport-fixed overlay;
- correction of render sizing/aspect issues;
- die size/framing tuning;
- render sharpness/material/light tuning;
- minimal usable dice tray;
- support for base set `d4 / d6 / d8 / d10 / d12 / d20`;
- percentile-style `d100` implemented and exposed as visible `d100` button.

К концу цикла dice path был признан достаточным для принятия:
- authoritative visible outcome работает;
- shared public roll работает;
- actor color работает;
- visual quality acceptable;
- tray usable;
- chapter commit/checkpoint-ready.

### Decision / change
Были фактически приняты следующие решения:
- authoritative visible result является обязательным product requirement для dice layer;
- renderer без safe/public forced outcome path unacceptable;
- `@3d-dice/dice-box` path rejected for this product requirement;
- accepted architecture = dddice-like authoritative event + local render on each client;
- accepted renderer path = `@3d-dice/dice-box-threejs`;
- fallback path = small custom controlled renderer;
- `dddice` remains a viable hosted fallback, but not the primary current path.

Дополнительно был принят важный статусный вывод:
- minimal feature checklist for alpha is now essentially assembled;
- дальше проект логичнее развивать через polish/coherence work, а не через поиск ещё одного missing mandatory system.

### Why
Эта последовательность оказалась правильной, потому что:
- проект не застрял в polishing incorrect renderer path;
- узкий correctness pass вовремя отделил renderer limitation от sync-model logic;
- decision layer был сделан до очередного broad implementation push;
- новый accepted path дал и красивый tactile feel, и authoritative visible result, и actor color без video-streaming workaround.

### Result
Проект получил:
- accepted authoritative shared 3D dice layer;
- usable dice tray with base set and `d100`;
- подтверждение, что dice теперь часть alpha core, а не просто speculative spike;
- новую продуктовую стадию: feature-complete enough for alpha, but not polish-complete.

### Workflow notes
Этот chapter дал несколько сильных workflow lessons:
- canonical design/spec docs перед renderer work сильно снизили риск расползания scope;
- narrow correctness passes полезнее, чем “дожать визуал”, когда есть риск неправильной модели;
- если renderer не поддерживает обязательную product semantic, его лучше отклонить рано, чем долго полировать;
- dddice-like architecture полезно мыслить отдельно от конкретного vendor/renderer;
- после сборки minimal feature checklist следующая правильная стадия — не автоматически новый spike, а polish prioritization.

### Remaining limitations / open questions
- dice visual quality уже acceptable, но всё ещё имеет небольшой residual polish debt;
- tray/UI ещё можно уплотнять и доводить;
- не решены roll history / labels / private rolls, но они сознательно deferred;
- future chapter про shared music / ambient audio зафиксирован, но пока сознательно отложен;
- следующий полезный слой работы — short rough-edges / polish audit по уже собранному alpha core.


---

## 2026-04-07 — Alpha readiness reframed around technical audit, first hosted alpha, and strategist/executor workflow

### Type
- decision
- workflow

### Context
После того как authoritative shared 3D dice были приняты как часть alpha core, проект подошёл к новой развилке. На поверхности казалось логичным сразу идти в большой polish cycle, потому что rough edges уже заметны. Но параллельно стало ясно, что local-only workflow начинает ограничивать реальную проверку продукта, а накопленная документация частично отстаёт от текущего состояния проекта.

### Goal or problem
Нужно было решить:
- что делать следующим после сборки основного capability checklist;
- как не утонуть в большом UI/UX polish ещё до первого hosted alpha;
- как формализовать работу через Codex так, чтобы один чат занимался strategy/framing, а второй — узкими implementation passes;
- как почистить документацию, чтобы старые planning docs не задавали ложный current direction.

### What happened
Сначала был сделан короткий rough-edges audit и стало ясно, что полиша действительно много. Но вместо перехода прямо в polish был выбран более жёсткий и практичный порядок:

1. read-only technical audit;
2. narrow stabilization;
3. first hosted alpha deployment;
4. только потом длинный UI/UX polish.

Отдельно был переосмыслен AI workflow:
- high-level обсуждение и постановка задачи остаются в strategist chat;
- implementation и debug loops идут в executor chat;
- handoff между ними должен идти не через надежду на общую память, а через `AGENTS.md`, `ROADMAP.md`, current-context и focused docs.

Потом был сделан documentation cleanup pass на уровне framing:
- `AGENTS.md` больше не должен быть refactor-only guide;
- `ROADMAP.md` должен отражать, что capability checklist в основном собран и проект движется к first hosted alpha;
- foundation/release framing нужно обновить, потому что video и dice уже нельзя описывать как просто будущие spikes;
- room/lifecycle/dev docs нужно выровнять с фактом существующего durable room snapshot base и новых dev workflows;
- старые refactor docs должны остаться как historical baseline, а не current live truth.

### Decision / change
Были приняты следующие решения:
- основной порядок следующего этапа = `audit -> stabilization -> deploy -> polish`;
- first hosted alpha стал ближней практической целью проекта;
- strategist/executor двухчатовая модель стала сознательным default workflow;
- documentation cleanup признан частью engineering/product work, а не вторичной бюрократией;
- old refactor docs сохраняются, но понижаются до historical baseline status.

### Why
Это решение оказалось правильным, потому что:
- capability checklist уже близок к достаточному минимуму;
- hosted alpha даст более ценный сигнал, чем ещё один длинный local-only polish loop;
- технический audit до deploy снижает риск, что hosted alpha превратится в замаскированную отладку хрупкой кодовой базы;
- формализация strategist/executor workflow лучше совпадает с тем, как работа уже реально ведётся.

### Result
Проект получил:
- новый приоритет следующего этапа;
- более зрелую workflow model для Codex;
- ясный повод обновить operating docs;
- более точное понимание, что теперь считается активной целью проекта.

### Workflow notes
Это важный lesson для всего проекта:
- после сборки capability checklist не обязательно сразу идти либо в новый spike, либо в endless polish;
- иногда наиболее ценный шаг — это выйти из local-only режима и проверить продукт в hosted environment;
- двухчатовая модель работает лучше всего, когда опирается на project docs, а не на неявную память чатов.

### Remaining limitations / open questions
- pre-deploy technical audit ещё не выполнен;
- hosted-alpha topology ещё не реализована;
- media dock и dice tray всё ещё имеют polish debt;
- остаётся вопрос, какие именно findings из hosted alpha станут настоящими product priorities после deploy.

---

## 2026-04-08 — First hosted alpha core checkpoint reached

### Type
- milestone

### Context
После capability assembly, technical audit, narrow stabilization и hosted prep проект дошёл до первого реального hosted core deploy.

### Goal or problem
Нужно было проверить, можно ли поднять board-first core stack в реальном hosted environment без обязательного video layer и без premature infra overbuild.

### What happened
Был поднят первый hosted alpha core environment:

- frontend работает в hosted environment;
- realtime/API backend поднят как отдельный long-running service;
- backend health и recovery signals работают;
- room entry и базовый hosted core flow были успешно подтверждены;
- video сознательно оставлен disabled/optional и не включён в этот checkpoint.

### Decision / change
Зафиксирован новый milestone:

- first hosted alpha core checkpoint достигнут;
- core deploy и базовая hosted validation считаются успешными;
- следующий planned step = narrow hosted video enable pass.

### Why
Это позволило честно зафиксировать, что проект уже вышел из purely local/dev stage, но при этом не переоценивать степень готовности и не притворяться, что video или production-hardening уже закрыты.

### Result
Проект получил:

- первый реальный hosted core signal;
- подтверждение, что board-first core stack работает за пределами local-only режима;
- более узкий и понятный следующий шаг вместо нового broad planning wave.

### Workflow notes
Этот checkpoint подтвердил полезность последовательности:

- narrow stabilization;
- cheapest practical hosted deploy;
- базовая hosted validation;
- только потом следующий маленький capability step.

### Remaining limitations / open questions
- video всё ещё не включён и остаётся отдельным следующим шагом;
- multiplayer/lifecycle validation beyond базового core flow всё ещё должна продолжаться;
- hosted alpha остаётся alpha, а не production-ready platform.

---

## 2026-04-08 — Hosted video enablement hit a narrow Railway runtime blocker

### Type
- blocker
- debug

### Context
После successful hosted core checkpoint следующим логичным шагом стала попытка включить current LiveKit path в hosted environment.

### Goal or problem
Нужно было проверить, можно ли включить video как optional hosted alpha layer без изменения core deploy shape и без broad media work.

### What happened
Под video path были сделаны узкие readiness/debug improvements, после чего hosted `/api/health` показал, что running Railway process всё ещё не видит:

- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

При этом:

- hosted core stack продолжает работать;
- backend URL и service path корректны;
- blocker локализован как Railway-side env/runtime propagation issue, а не как product/core architecture failure.

### Decision / change
Сделан narrow framing update:

- hosted core checkpoint остаётся действительным;
- hosted video не отклоняется как направление;
- immediate next step = снять Railway env/runtime blocker и только потом повторить hosted video enable pass.

### Why
Это позволяет не драматизировать проблему и не смешивать operational hosted blocker с выводом, будто core stack или LiveKit integration оказались неверными.

### Result
Проект получил:

- более честную интерпретацию текущего blocker'а;
- сохранённый hosted core milestone;
- узкий operational next step вместо broad replanning.

### Remaining limitations / open questions
- нужно подтвердить, одноразовый ли это Railway operational issue или recurring hosted constraint;
- hosted video smoke по-прежнему не считается завершённым;
- broader media polish по-прежнему не является текущим приоритетом.

---

## 2026-04-08 — Hosted video was unblocked without changing the hosted core split

### Type
- milestone
- workflow

### Context
После hosted core checkpoint video path уже был технически валиден локально, но hosted enablement упёрся в Railway env/runtime visibility issue.

### Goal or problem
Нужно было включить hosted video как optional alpha layer, не превращая это в broad replanning of the hosted architecture и не ломая working core split.

### What happened
Вместо попытки перестраивать весь hosted shape был найден узкий practical unblock:

- Vercel token fallback path подтвердился как working hosted solution;
- hosted video заработал;
- hosted core split при этом не пришлось менять.

### Decision / change
Был зафиксирован важный статусный вывод:

- hosted video now works;
- video остаётся optional alpha layer, а не новый broad media chapter;
- first hosted checkpoint теперь честно мыслится как working hosted core + optional video.

### Why
Это позволило сохранить narrow hosted scope и не подменять узкий operational unblock unnecessary architecture motion.

### Result
Проект получил:

- working hosted video path;
- подтверждение, что LiveKit integration не была architectural dead end;
- сильный workflow lesson про то, что перед live-debugging нужно сначала подтвердить commit / push / deploy state.

### Workflow notes
- hosted/debug work нельзя интерпретировать без уверенности, что нужный code state действительно попал в deploy;
- узкий fallback path sometimes beats broader infra redesign at alpha stage.

### Remaining limitations / open questions
- media dock UX остаётся rough;
- broader video/media product chapter по-прежнему deliberately deferred;
- hosted stack всё ещё alpha checkpoint, а не production platform.

---

## 2026-04-09 — Room color model was corrected away from offline reservation and fixed around an 8-seat active-room model

### Type
- decision
- milestone

### Context
После первых room-member/color passes проект начал дрейфовать в более тяжёлую модель:

- offline color reservation;
- authoritative permanent room-color ownership;
- entry truthfulness around fixed returning-member colors.

Это оказалось слишком тяжёлым и не совпадало с реальным product stage.

### Goal or problem
Нужно было вернуть color chapter к более лёгкой и честной multiplayer model:

- enough structure for stable readable colors;
- without durable offline reservation;
- without heavy member-management semantics.

### What happened
Сначала был сделан explicit re-alignment pass на уровне docs и planning.

После этого project direction был пересобран так:

- exactly 8 allowed participant colors;
- at most 8 simultaneous active participants;
- only active participants block colors;
- offline participants do not reserve colors;
- repeat join should prefer previous color if free, not hard-own it.

Потом runtime был скорректирован под эту модель:

- active color occupancy moved to live room presence;
- local mirror stopped being the authority for pre-join occupancy;
- entry flow and join validation now rely on real live room state;
- simple post-join silent recolor was explicitly rejected as the main fix.

### Decision / change
Color chapter больше не должен мыслиться как durable ownership system.
Он теперь основан на:

- active-room occupancy;
- lightweight pre-join coordination;
- soft remembered defaults;
- fixed 8-seat room model.

### Why
Эта модель намного лучше совпала с реальным product shape:

- small multiplayer rooms;
- board-first readability;
- no need for early heavy member/admin system;
- no fake permanence where project does not yet support it honestly.

### Result
Проект получил:

- более честную and narrower room-color model;
- clearer separation between room history and active occupancy;
- reduced semantic drift toward heavy membership semantics.

### Remaining limitations / open questions
- near-simultaneous same-color join race still needed a narrow dedicated fix;
- participant identity substrate was still weaker than the room-member/history meaning layered on top of it.

---

## 2026-04-10 — Pre-join color claims and presence stabilization closed the main active-color race

### Type
- milestone
- stabilization

### Context
После перехода на live room presence main stale-source bug ушёл, но два класса проблем всё ещё оставались:

- presence lifecycle churn and heat / unstable leave behavior;
- near-simultaneous duplicate-color race before join.

### Goal or problem
Нужно было:

- стабилизировать room presence lifecycle;
- убрать needless feedback loops;
- и закрыть simple duplicate-color race без silent post-join recoloring.

### What happened
Сначала был сделан narrow stabilization pass:

- убран main presence feedback loop in `App.tsx`;
- reduced duplicate local presence publishing;
- room presence teardown on `Leave room` became explicit;
- entry observer overlap with in-room connection was reduced.

После этого был добавлен temporary pre-join `joinClaim` mechanism:

- claim lives in the same live room coordination layer;
- active colors and short-lived claims both block selection;
- `Join room` now briefly claims the selected color before final room entry;
- claim clears on successful join or quickly expires on abandonment.

### Decision / change
Near-term duplicate-color prevention теперь строится на:

- real live room presence;
- temporary pre-join claims;
- no offline reservation;
- no silent post-join recolor as the main fix.

### Why
Это сохранило product honesty:

- user sees the room state before join;
- color conflict is resolved before room entry completes;
- no heavy durable reservation system was required.

### Result
Проект получил:

- stable enough room presence lifecycle for current alpha use;
- working `Leave room` again after the churn fixes;
- pre-join color blocking that now behaves plausibly even across two live clients.

### Workflow notes
- before fixing multiplayer race semantics, it was worth stabilizing the presence lifecycle itself;
- real source-of-truth fixes beat UI hint polishing when duplicate active state is the actual bug.

### Remaining limitations / open questions
- the claim layer remains lightweight, not mathematically perfect transactional locking;
- broader participant identity semantics still needed a dedicated chapter.

---

## 2026-04-11 — Participant identity was reframed as browser-local and then extended across tabs

### Type
- decision
- milestone

### Context
После room-color and join-claim stabilization стало ясно, что participant/member semantics уже стали богаче, чем identity substrate beneath them. Identity всё ещё жила как tab-session accident in `sessionStorage`.

### Goal or problem
Нужно было:

- explicitly define what “same participant” means now;
- stop treating same-browser repeat join as accidental;
- make multiple tabs of one browser profile stop behaving like multiple independent users.

### What happened
Сначала был сделан docs-first identity chapter:

- same browser profile = same participant;
- participant identity is browser-local, not name-based;
- only the foreground/visible tab should act as the live participant carrier;
- background tabs should be soft-suspended for active presence;
- room-member history should be treated as best-effort browser-local history/defaults, not person-level truth.

Потом identity runtime был tightened in small slices:

1. `participantId` moved from tab-scoped persistence to browser-local persistence;
2. only foreground/visible tab now publishes active presence;
3. a shared browser-local active-room-session record was introduced so:
   - one `participantId` owns one active room session across tabs;
   - a new tab can attach to that session instead of running a fresh join flow;
   - `Leave room` propagates across same-browser tabs.

### Decision / change
Current near-term identity model is now:

- browser-local, not auth/account-based;
- same browser profile = same participant;
- one active room session per participant across tabs;
- foreground tab carries live presence;
- background tabs do not act like equal active participant carriers.

### Why
Это был smallest coherent fix:

- much stronger than tab-scoped accidental identity;
- much lighter than auth/accounts;
- enough to stop duplicate self-joins, duplicate seat usage, and noisy same-browser presence behavior.

### Result
Проект получил:

- stronger repeat-join semantics in the same browser profile;
- cross-tab room-session coherence;
- leave propagation across tabs;
- more honest foundation for future room/member/history semantics.

### Workflow notes
- docs-first work turned out useful again: the project needed a clear product identity rule before touching runtime;
- participant identity, active room session, and live presence carrier are related but should still be implemented as separate narrow slices.

### Remaining limitations / open questions
- stale active-room-session cleanup is still a likely future narrow follow-up;
- cross-device identity remains explicitly out of scope;
- full cross-tab UI mirroring remains unnecessary and deferred.

---

## 2026-04-11 — Token was reset from placeholder object to participant marker pin

### Type
- decision
- milestone

### Context
После room/session/identity stabilization стало яснее, что current token больше не соответствует продуктовой роли.
Он всё ещё жил как generic draggable placeholder object, хотя фактическая нужная semantics уже была другой:

- participant marker on the map;
- readable over board/image content;
- useful in multiplayer without becoming another generic object family.

### Goal or problem
Нужно было:

- reset token semantics away from generic placeholder object;
- make token visually and behaviorally closer to a participant marker / pin;
- stop relying on debug-style token creation as the main token flow;
- add the first honest multiplayer conflict layer for token movement without inventing a token-only protocol.

### What happened
Сначала token direction была зафиксирована docs-first:

- token = participant marker / pin;
- token anchor = center point;
- token size should remain viewport-stable across zoom;
- later token may attach to board objects, image first;
- token conflict indication should reuse the standard occupied/blocked movable-object language.

Потом token chapter был собран маленькими runtime slices:

1. placeholder-like rectangular token was visually reset toward a circular participant marker;
2. token rendering and selection were moved to pin behavior:
   - center-anchor semantics;
   - viewport-stable size;
   - viewport-stable selection treatment;
3. participant-marker flow replaced debug-style generic token creation:
   - each participant now gets one marker automatically;
   - marker is recreated if missing;
   - marker no longer behaves like a normal selectable/deletable object;
4. concurrent token movement got the first reusable live occupancy slice:
   - lightweight `activeMove` awareness semantics;
   - tokens wired first;
   - competing drag start is blocked while another participant is moving that token;
   - occupied state reuses the shared frame indication language.

### Decision / change
Current near-term token model is now:

- token is not a generic board object first;
- token is a participant pin/marker first;
- token is board-anchored by center point and viewport-stable in size;
- each participant gets a simple marker automatically;
- token movement already participates in the broader live object-interaction family through reusable `activeMove` occupancy semantics.

### Why
Это дало project a much more honest token foundation:

- better match to board-first multiplayer play;
- cleaner path to map/image usage;
- less debug-tooling feel;
- first reusable conflict semantics instead of another one-off token behavior.

### Result
Проект получил:

- first real participant-marker token model;
- pin-like token behavior across zoom;
- automatic one-marker-per-participant flow;
- non-selectable / non-deletable marker behavior for the current stage;
- first reusable move-occupancy runtime slice for movable objects, wired through token first.

### Workflow notes
- this chapter benefited from alternating docs-first and narrow runtime slices;
- visual cleanup alone was not enough until token workflow and conflict semantics were reset too;
- it was useful to treat token conflict handling as phase 1 of a broader live object-interaction unification rather than as a token-only rule.

### Remaining limitations / open questions
- token attachment and first image-first dependent behavior later became the next larger chapter and are no longer just a future direction;
- current marker governance is intentionally simple: markers are movable by everyone for now;
- token occupied frame may still receive tiny visual polish later;
- broader image/text-card migration into the same interaction family remains later.

### Later continuation
That next token chapter was then carried further:

- token gained image-first attachment with token-local attachment metadata;
- attached token position began deriving from parent image bounds through normalized parent-local coordinates;
- attached token remained viewport-stable in size while attached;
- a first shared image `effective bounds` resolver was introduced for image-backed dependents;
- attached tokens and selected image controls became the first two runtime dependents using that family;
- remote resize/transform semantics for attached dependents were later aligned with remote move semantics so dependents no longer moved “ahead” of the visible parent image on remote clients.

This moved token work from “first participant marker” into a broader image-first attachment/effective-bounds checkpoint.

---

## 2026-04-11 — Current alpha direction became more explicitly media-centered

### Type
- decision

### Context
As token attachment, drawing, notes, and object-scoped interaction work kept progressing, a clearer product pattern emerged: practical session value was increasingly organizing itself around placed media surfaces rather than around the abstract board alone.

### Goal or problem
Нужно было зафиксировать текущую product truth without overreacting into a broad platform redefinition.

### What happened
Было explicitly recognized, что current alpha interaction gravity is becoming media-centered:

- the board acts as staging space;
- images are currently the first real anchor type;
- tokens, notes, drawing, and attached interaction increasingly happen on or around those media-backed surfaces;
- this may later expand to other anchor types such as PDFs.

### Decision / change
Near-term product framing is now:

- still board-first;
- but increasingly organized around media-backed play surfaces;
- image is the first practical anchor object, not necessarily the last.

### Why
Это лучше объясняет why current work is converging on:

- token attachment;
- attached dependents;
- effective bounds;
- image interaction quality;
- notes/drawing behavior relative to media surfaces.

### Result
The project now has a clearer current-direction lens:

- not “generic objects floating equally on a board”;
- but “board as shared staging space around media-centered play surfaces.”

### Workflow notes
- this was useful to record as a current-direction insight, not as a final platform doctrine;
- it supports continuing image-first attachment/runtime work without pretending the project has already become a generalized media platform.

---

## 2026-04-11 — Push workflow was tightened around coherent checkpoints and explicit verification

### Type
- workflow lesson

### Context
As more runtime, hosted, and object-layer work accumulated, it became increasingly costly either to push every micro-fix separately or to push larger changes without a clear verification plan.

### Goal or problem
Нужно было зафиксировать более disciplined push rhythm:
- changes should be grouped into coherent checkpoints;
- and each push should have a compact post-push verification surface.

### What happened
A new preferred workflow was made explicit:

- push in coherent chapter-sized or tightly related checkpoints;
- after each such push, keep a short verification list split into:
  - local checks;
  - hosted/deploy checks.

### Decision / change
Project workflow now prefers:
- fewer but more coherent pushes;
- plus explicit post-push verification expectations.

### Why
This reduces confusion between:
- what code changed;
- what was validated only locally;
- what still needs hosted/deploy confirmation.

### Result
The project now has a clearer expectation that a push is not only a code event but also a validation checkpoint with a named local/hosted verification surface.

---

## 2026-04-11 — Object interaction work was reframed around explicit UI layers

### Type
- decision

### Context
As interaction work accumulated across images, tokens, legacy text-cards, note-cards, cursors, controls, and dice, it became increasingly unclear what exactly should be standardized together versus what should remain intentionally separate.

### Goal or problem
Нужно было сначала разложить the app into interaction-relevant layers before attempting a broader object interaction standardization chapter.

### What happened
A clearer layer model was chosen:

- object layer
- interaction layer
- control layer
- presence layer
- special interaction systems

### Decision / change
Future standardization should focus primarily on the **interaction layer**:
- selection;
- resize;
- occupied / blocked indication;
- preview / active-manipulation states;
- object-scoped attached controls and similar interaction chrome.

At the same time:
- objects keep their own semantics in the object layer;
- fixed panels/buttons remain in the control layer;
- cursors and similar signals remain in the presence layer;
- dice remain a special interaction system rather than being forced into ordinary object/control rules by default.

### Why
This makes it easier to standardize the right things together without flattening the entire product into one generic interaction system.

### Result
The project now has a clearer conceptual boundary:
- first separate the layers;
- then standardize the interaction layer explicitly against that model.

One stronger normative rule was then accepted for future interaction work:

- interaction-layer elements should be object-anchored but viewport-stable;
- they should not scale like ordinary board content during zoom;
- if current runtime behavior diverges from that rule, it should be treated as
  drift to fix rather than as the source of truth for the rule itself.

Another workflow lesson also became explicit during the design-system migration
chapter:

- executor-side manual QA is limited and should not be assumed just because a
  task brief lists UI checks;
- for this project, the executor is reliable for builds, narrow code-path
  validation, and existing inspect/debug surfaces;
- but visual acceptance, browser-heavy interaction verification, and broader
  multi-client/session QA still need either:
  - a practical runnable verification path,
  - or explicit user-side confirmation.

This should affect future briefs:

- "manual QA" should usually be phrased as:
  - if practical,
  - or report whether it was actually run;
- executor output should state clearly when manual QA was not actually
  performed instead of implying that it happened automatically.

Another important checkpoint was also reached:

- the ordinary-interface design-system migration chapter is now good enough to
  pause as structurally landed;
- fields, buttons, selection controls, swatches, boxed callouts, surfaces,
  rows, and the remaining ops inline helper/error text now all have shared
  runtime ownership;
- the remaining ordinary-interface work is now mostly later cleanup,
  visual reconciliation, and explicit local exceptions rather than major shared
  family migration debt.

This changes the design-system framing going forward:

- the next useful design-system work should not keep stretching the ordinary
  interface chapter indefinitely;
- the safer next step is the board-layer chapter, beginning with board material
  tokenization and the now-explicit CSS-vs-canvas resolution rule.

---

## Phase 0X — Future split between demo room flow and persistent email-based room flow

### Type
- decision

### Context
As room identity, creator semantics, durable persistence, and room return behavior became more important, it became clear that one single room-entry model would likely force the product into awkward tradeoffs.

### Goal or problem
Нужно было не потерять будущую product direction:
- сохранить current lightweight room entry as a low-friction demo path;
- but avoid letting that same path silently grow into the full long-lived room/account model.

### What happened
A future split was explicitly accepted:

- the current lightweight room-entry flow should remain as a demo-oriented path;
- that demo path should eventually stop implying strong room-creator authority and should not promise durable persistence beyond browser-local memory;
- a separate future persistent path should later be added for stronger continuity;
- that persistent path is expected to require email and later support durable session continuity, invites, and guest access.

### Decision / change
The project should not force the same room flow to satisfy both:
- lightweight instant demo access;
- and durable long-lived persistent room semantics.

### Why
That separation keeps the current alpha path simple and honest while preserving room for a later stronger persistent product model without overloading the demo flow.

### Result
The future direction is now explicit:
- current room entry can stay lightweight and demo-friendly;
- a later email-based persistent room flow can carry the heavier long-lived semantics.

---

## Phase 0X — IndexedDB room-document replica checkpoint closure

### Type
- implementation checkpoint

### Context
The project opened `room document persistence / recovery architecture` as the
active chapter because snapshot arbitration was no longer reliable enough for
committed room content recovery.

The first chosen slice was intentionally narrow:

- move browser-local room-document replica storage from `localStorage` to
  `IndexedDB`;
- keep one full room-document replica per room as the first baseline;
- add a narrow same-browser recovery read bridge;
- preserve active-room `live-wins` and durable shared truth semantics.

### Goal or problem
The project needed a browser-local recovery layer that:

- survives realistic image-heavy room payloads;
- does not hit `localStorage` quota in ordinary use;
- restores committed state in the same browser after refresh and leave / re-enter;
- stays compatible with the current durable and live room corridors.

### What happened
The implementation phase landed together with several narrow stabilizing fixes:

- browser-local room-document replicas moved to `IndexedDB`;
- same-browser bootstrap can read the local replica as a narrow recovery bridge;
- local replica writes stay tied to commit boundaries;
- render-phase local persistence callback execution was moved out of React render;
- durable snapshot retry loop on `409 conflict` was bounded;
- token and note-card drag corridors stopped spamming durable persistence on each move;
- cursor presence flood was throttled enough to stop runtime depth failures.

Manual validation confirmed:

- image move / resize / draw-save survive refresh;
- token move survives refresh;
- note-card move and text edit survive refresh;
- leave / re-enter in the same browser works;
- second-browser shared truth stays coherent.

### Decision / change
The project can now treat the first `IndexedDB room-document replica` phase as
checkpoint-complete.

### Why
The core product corridor is now usable and materially safer:

- browser-local recovery works in realistic usage;
- the app no longer crashes in the previously opened persistence corridors;
- persistent console noise was reduced from continuous flood to occasional
  commit-time conflicts;
- the remaining durable `409 conflict` entries no longer block normal room use.

### Result
The persistence/recovery chapter reached a real checkpoint:

- `narrow commit-boundary persistence phase` is complete enough to close as the first replica-track checkpoint;
- the broader room-document replica migration track remains open;
- the next separate chapter can move to browser-local participant identity stabilization;
- durable snapshot conflict handling remains a later refinement, not a blocker.

---

## Phase 0Y — Local replica semantics closure

### Type
- internal replica-track step closure

### Context
After the IndexedDB baseline checkpoint, the next required internal step was
`Local replica semantics`.

The chapter still had two open gaps:

- write-side local replica coverage outside the image corridor;
- read-side bootstrap behavior still treated local state too much like a
  winner-picked fallback snapshot.

### What happened
The project closed this step through several narrow slices:

- local replica writes gained monotonic local revision identity;
- covered committed image/token/note corridors now write into IndexedDB local
  replica on commit boundary;
- same-browser reopen smoke for those covered corridors then read from the
  historical `local-recovery` / `indexeddb` label;
- bootstrap read path now treats version-aware local replica as the local
  document source even when that replica is empty;
- stale `room-snapshot` no longer resurrects content over a version-aware empty
  local replica.

### Decision / change
`Local replica semantics` is now complete as the next internal replica-track
step.

### Why
The browser-local path now behaves like a real local document carrier:

- local replica has explicit revision identity;
- covered committed corridors no longer depend on `room-snapshot` for same-browser reopen;
- bootstrap no longer overlays stale fallback content on top of a version-aware
  empty local replica;
- active-room `live-wins` and durable semantics stayed unchanged.

### Result
The next internal replica-track step is now `Durable write model`.

The remaining local follow-up was classified explicitly:

- legacy `room-snapshot` still stayed as a compatibility fallback at that
  point;
- its later fate should be reviewed during `Durable write model`, not reopened
  as another immediate local bootstrap chapter.

---

## Phase 0Y — Durable write model closure

### Type
- internal replica-track step closure

### Context
After `Local replica semantics`, the next required internal step was
`Durable write model`.

The chapter still had three open gaps:

- ordinary runtime durable writes still depended on broad snapshot timing;
- covered multi-client durable corridors still emitted browser-visible `409`
  noise;
- cross-slice durable writes could still hit stale-base logical conflict/retry
  because the write precondition used one global durable revision.

### What happened
The project closed this step through several narrow slices:

- covered committed token/image/note corridors took ownership of durable writes
  on commit boundary;
- server and client moved ordinary covered durable writes to a family-scoped
  update corridor;
- durable acknowledgement and revision handling became explicit and inspectable
  in runtime;
- covered multi-client durable conflicts stopped surfacing as browser-visible
  `409` resource noise;
- covered durable `PATCH` writes moved to per-slice revision discipline and
  stopped treating unrelated slice commits as stale-base conflicts.

### Decision / change
`Durable write model` is now complete as the next internal replica-track step.

### Why
The durable path now matches the chapter target closely:

- durable writes no longer depend on broad whole-room snapshot timing as the
  primary ordinary path;
- update-aware durable discipline is real for covered corridors;
- durable ack/revision handling is explicit in the runtime corridor;
- the durable checkpoint/update contract is now shaped for later convergence
  work.

### Result
`Checkpoint 2` is now closed after local and durable persistence maturity.

The next internal replica-track step is now `Recovery convergence model`.

The chapter closure also classified two later follow-ups explicitly:

- legacy `room-snapshot` compatibility fallback moves forward to
  `Recovery convergence model`;
- destructive ops delete now has a separate `room-ops durability ergonomics`
  follow-up instead of stretching `Durable write model`.

---

## Phase 0Z — BoardStage cleanup sprint checkpoint

### Type
- structural cleanup sprint checkpoint

### Context
After the persistence/recovery and participant-identity chapters closed, the
project opened `sprint/cleanup-lint-boardstage-foundation` as a hard cleanup
branch.

The sprint target was narrow:

- return lint to green;
- reduce `BoardStage` toward its target orchestration-shell shape;
- avoid mixing cleanup with the deferred `participant-marker / creator-color`
  semantics chapter.

### What happened
The sprint closed through a sequence of narrow structural slices:

- `lint green baseline` was restored;
- dev tools and inspection UI moved into `BoardStageDevToolsContent`;
- shell overlays moved into `BoardStageShellOverlays`;
- Konva scene composition moved into `BoardStageScene`;
- pure inspectability and control derivation moved into
  `boardStageInspectability`.

### Decision / change
`BoardStage` is now close enough to the agreed target shape for this sprint.

The accepted target model is now explicit:

- `BoardStage` acts as the orchestration shell and keeps runtime ownership;
- `BoardStageScene` is the scene render boundary;
- `BoardStageShellOverlays` owns shell chrome and scene-attached HTML overlays;
- `BoardStageDevToolsContent` owns debug and inspection UI;
- shared 3D dice stay the top app-owned visual layer.

### Why
The remaining weight in `BoardStage` is now mostly real orchestration work:

- persistence and recovery coordination;
- realtime slice wiring;
- stage pan/zoom and empty-space behavior;
- cursor presence scheduling;
- mutating runtime callbacks and ownership state.

Another cleanup micro-slice would have little structural payoff and would start
leaning into riskier runtime territory.

### Result
The cleanup sprint reached a good checkpoint pause.

Deferred follow-ups were classified more precisely:

- hosted validation is required after this cleanup checkpoint lands;
- `participant-marker / creator-color` stays the next candidate chapter;
- the unresolved creator-color fallback question stays a required deferred
  review item inside that later chapter rather than an automatic next
  implementation step.

---

## Phase 0Z — Hosted validation cleared the BoardStage cleanup checkpoint

### Type
- milestone
- validation
- decision

### Context
После cleanup sprint checkpoint проекту нужна была hosted truth по exact preview
deploy, а не по локальной ветке или по GitHub PR page.

Дополнительно всплыли два конкретных хвоста:

- note editor overlay потерял правильный верхний слой;
- hosted debug gate не открывался через `?uiDebugControls=1`.

### Goal or problem
Нужно было понять две вещи:

- есть ли у cleanup branch собственный hosted blocker перед merge;
- остаётся ли room-hydration concern branch-specific regression или это общий
  hosted/runtime паттерн.

### What happened
Checkpoint был доведён до hosted-ready truth:

- note editor overlay hotfix restored visible text during note edit;
- hosted debug gate now works through `?uiDebugControls=1` on preview;
- exact preview deploy was verified against current branch `HEAD`;
- preview and current live then went through repeated room-open comparison on
  fresh room ids;
- both hosted environments showed the same staged token/image/note arrival;
- both hosted environments showed the same slowdown shape when multiple room
  contexts stayed live;
- preview did not show a monotonic same-tab `1 -> 2 -> 3` degradation.

### Decision / change
`BoardStage` cleanup checkpoint is now accepted as merge-ready.

The hydration concern was reclassified:

- branch-specific cleanup regression is not confirmed;
- the remaining room-open timing issue belongs to a general hosted/runtime
  follow-up.

### Why
Hosted comparison removed the main suspicion:

- current live and the cleanup preview behave the same way on the tested room
  open matrix;
- the remaining signal points to bootstrap coordination and separate shared
  slice startup, not to the cleanup refactor itself.

### Result
The cleanup branch can merge without carrying a hosted regression blocker.

The remaining later follow-up is now:

- hosted room hydration and bootstrap coordination.
