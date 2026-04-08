# play-space-alpha — case study log

Ниже — черновой накопительный журнал проекта.

Важно:
- это рабочая реконструкция, собранная по памяти и по сохранённому контексту чатов;
- даты и отдельные commit-границы позже можно уточнить;
- цель журнала сейчас — не идеальная архивная точность, а сохранение narrative, решений, уроков и самой формы AI-assisted работы над проектом.

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
