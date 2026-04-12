# play-space-alpha — current context / chat handoff

## 1. Current state summary

Проект остаётся в стадии `play-space-alpha`.

Основной продуктовый курс не изменился:
лёгкий board-first multiplayer play space, а не heavy VTT.

Но current alpha interaction gravity now reads more clearly as media-centered:

- board acts as staging space;
- media-backed surfaces, currently images first, are becoming the main anchors of play;
- tokens, notes, drawing, and other attached interaction increasingly organize themselves around those media surfaces;
- this is a current product direction for the alpha stage, not yet a broad media-platform redesign.

Текущая собранная база:

- React + TypeScript + Vite + Konva/react-konva;
- realtime: Yjs / y-websocket;
- durable room snapshot layer уже существует как best-effort room recovery base;
- color chapter доведён до coherent checkpoint;
- canonical zero state и separation of board content vs viewport semantics зафиксированы;
- narrow LiveKit-first spike технически подтверждён;
- authoritative shared 3D dice path подтверждён и принят как alpha-core layer;
- documentation workflow разделён на foundation file, roadmap, current-context file и case-study log;
- work model с AI теперь сознательно формализуется как strategist + executor;
- minimal capability checklist собран достаточно для first hosted alpha core checkpoint;
- first hosted core deploy поднят;
- базовая hosted validation core flow подтверждена;
- hosted video now works as an optional layer via the Vercel token fallback path;
- unified room entry screen now exists and room name is editable before join;
- in-room lifecycle now uses `Leave room` instead of direct room switching;
- hosted core checkpoint remains valid and has now expanded into a practical hosted core + video checkpoint.

## 1.1. Future room-flow split to remember

This is not current implementation work, but it is now an explicit future product direction:

- the current lightweight room-entry flow should remain as a demo-oriented path;
- that demo path should eventually stop carrying strong room-creator semantics and should not imply durable persistence beyond browser-local memory;
- a separate future persistent path should be introduced for rooms that require stronger continuity;
- that persistent path is expected to require email and later support durable session continuity, invites, and guest access.

## 2. What was completed before this chat

### 2.1. Durable room snapshot base was implemented
Ранее проект ушёл от local-only room fallback к room-level durable snapshot layer с best-effort semantics.

### 2.2. Color model was canonicalized
Цвет получил отдельный semantic source of truth.
Creator-linked и actor-colored semantics были разведены.

### 2.3. Zero-state semantics were cleaned up
Пустая доска была отделена от starter content и от viewport/camera semantics.

### 2.4. LiveKit narrow spike was technically validated
Built-in video больше не speculative idea only.
Техническая жизнеспособность подтверждена, хотя UX media dock остаётся rough.

### 2.5. Authoritative shared 3D dice were accepted
Первый `dice-box` path был отвергнут как incorrect for authoritative visible outcomes.
Принят dddice-like architecture и working renderer path на `@3d-dice/dice-box-threejs`.

## 3. What was established in this chat

### 3.1. The next priority is not immediate polish
Был сознательно отвергнут порядок "сначала большой polish, потом deploy".

Зафиксирован более правильный порядок:

1. technical audit;
2. narrow stabilization;
3. first hosted alpha deployment;
4. slower UI/UX polish afterwards.

### 3.2. Old refactor docs should be reused as historical baseline
Старые `refactor-audit.md` и `refactor-plan.md` полезны не как current truth, а как historical baseline и карта чувствительных зон.

### 3.3. Workflow is being formalized around strategist + executor
Появилась явная рабочая модель:

- strategist chat обсуждает high-level direction, architecture, product framing и пишет чистые task briefs;
- executor chat делает узкие implementation passes и возвращает concise engineering reports.

### 3.4. Documentation cleanup became part of the work
Стало ясно, что часть документов отстаёт от реального состояния проекта:

- foundation/release framing;
- roadmap priorities;
- dice design doc;
- room behavior / room memory docs;
- LiveKit dev docs;
- manual QA / stabilization docs.

Это признано отдельной полезной задачей, а не "вторичной бюрократией".

### 3.5. First hosted alpha hosted checkpoint was reached
Hosted work больше не находится на стадии только preparation.

Уже подтверждено:

- hosted frontend работает;
- hosted realtime/API backend поднят;
- backend health и recovery diagnostics работают;
- room entry и базовый hosted core flow проходят успешно;
- hosted video now works;
- Vercel token fallback path оказался рабочим practical unblock;
- это не выглядит как core app logic failure.

### 3.6. A workflow lesson was made explicit
Важный operational lesson:

- before debugging live deploy behavior, first confirm the relevant code is committed;
- then confirm it is pushed;
- then confirm the deployed build actually includes that code.

Часть wasted debugging time пришла из сравнения live behavior не с тем code state.

### 3.7. Room lifecycle was made more explicit
Текущий room flow больше не считает direct room URL automatic joined state by itself.

Теперь:

- room id from URL acts as entry-form prefill;
- room name remains editable before join;
- active room participation is separated from draft room selection;
- in-room `Change` was replaced by `Leave room`.

### 3.8. Public demo strategy stays snapshot-based for now
На текущем этапе проект не вводит separate public/internal build split.

Предпочтённый operational model:

- обычная работа продолжается в main project flow;
- когда появляется достаточно стабильный checkpoint, именно он выбирается как next public demo;
- public demo сейчас мыслится как fixed chosen snapshot deploy, а не как отдельный build mode.

### 3.9. The first public demo snapshot is now chosen
Текущий app surface признан достаточно coherent для first public demo snapshot.

Это значит:

- snapshot-based public demo strategy больше не только abstract process choice;
- выбран первый реальный public demo checkpoint;
- следующие public demos могут выходить как новые consciously chosen snapshots без separate build split.

### 3.10. The first real room baseline rollout now exists
Room initialization model теперь не только design-only.

Уже реализовано:

- zero-state remains genuinely empty;
- baseline content now exists as explicit room-initialization layer;
- first named baseline payload `public-demo-v1` now works;
- baseline applies once through room initialization, not through generic bootstrap hacks.

### 3.11. Governance now has a real runtime path and first enforced restrictive rules
Governance в проекте теперь уже не только conceptual scaffold и не только permissive runtime shell.

Уже реализовано:

- room and board-object actions now go through a real governance access path;
- governance action classification and unified access resolution now exist in runtime code;
- ordinary shared room/object actions now intentionally use `none`;
- real restrictive governance rules now exist for:
  - `board-object.delete`
  - `board-object.clear-own-drawing`
  - `board-object.clear-all-drawing`
- most ordinary shared board actions still remain open/shared;
- the project now has the machinery needed for later policy tightening without first inventing a new runtime layer.

### 3.12. Governance runtime is now inspectable in Dev tools
Governance runtime path теперь не только exists, но и minimally observable during development.

Уже реализовано:

- a small `Governance` block now exists inside Dev tools;
- current room/object governance resolution can be inspected there in runtime;
- current inspect surface now reflects real allow/deny behavior for the first enforced restrictive actions, not only permissive runtime wiring.

### 3.13. Another workflow lesson was made explicit
Для invisible/systemic changes зафиксирован ещё один practical workflow lesson:

- when a change is mostly architectural or runtime-internal, ship a small inspectability mechanism when practical;
- do not rely only on successful builds and “nothing looks broken” as the main validation story.

### 3.14. Room color direction was corrected toward an 8-seat active-room model
Room color chapter больше не должен мыслиться как permanent room-color ownership system.

Текущий intended direction теперь такой:

- room uses exactly 8 allowed participant colors;
- room supports at most 8 simultaneous active participants;
- only currently active participants block colors;
- offline participants do not reserve colors;
- returning participants should get their previous room color preselected if it is free, not hard-restored as locked ownership;
- room members are now better framed as room history / remembered defaults, not authoritative color owners.

### 3.15. Participant identity direction is now explicitly browser-local, not tab-local
Participant identity chapter теперь должен мыслиться не как name-based label и не как tab-scoped accident.

Текущий chosen near-term direction теперь такой:

- same browser profile should count as the same participant;
- participant identity is not name-based;
- multiple tabs are allowed;
- multiple tabs should not behave like multiple independent participants;
- only the foreground/visible tab should act as the live participant carrier;
- background tabs should be soft-suspended for active presence behavior.

Это всё ещё не auth/account identity model.
Это browser-local participant identity model for the current product stage.

### 3.16. Token direction is now being reset toward a pin model
Token chapter больше не должен мыслиться как generic placeholder board object.

Текущий intended direction теперь такой:

- token is a participant map marker;
- token is anchored by its center point to a board position;
- token size should remain viewport-stable across zoom;
- only its position should move with board/camera transforms;
- later, token may attach to images/maps and move with them;
- the first useful implementation should still stay simple before attachment mechanics.

### 3.17. Token already moved into a first participant-marker phase
Token chapter теперь уже не только design-only.

Уже реализовано:

- token behaves as a viewport-stable pin rather than a normal scaling object;
- each participant now gets a simple marker automatically;
- marker no longer behaves like a normal selectable/deletable board object;
- current token flow is now much closer to a product-facing participant marker than to a debug-only generic token.

Но attachment semantics deliberately remain later.

### 3.18. Reusable movable-object `activeMove` was added for tokens first
Token chapter теперь уже получил первый runtime conflict/occupancy layer.

Уже реализовано:

- reusable movable-object `activeMove` occupancy semantics;
- tokens are the first wired runtime user;
- token drag now publishes temporary move occupancy;
- competing token drags are blocked while that occupancy is live;
- occupied state reuses the shared frame-based indication language rather than token-only UI.

При этом intentionally unchanged:

- image drag preview;
- image drawing lock;
- text-card editing presence;
- broader transport consolidation.

То есть phase 1 of live object-interaction unification уже началась, но only for token move occupancy so far.

### 3.19. Token attachment and effective bounds reached a first coherent checkpoint
После pin behavior, participant-marker flow, and first `activeMove` occupancy slice
token chapter went through its next larger image-first attachment phase.

Уже реализовано:

- object-attached pin model, image first;
- attachment source of truth lives on the token object itself;
- token may be `free` or `attached`;
- attached position uses normalized parent-local coordinates;
- attached token repositions from current parent bounds while remaining viewport-stable in size;

### 3.20. Interaction layer should now be treated as an explicit canonical layer

The project has now reached a point where the interaction layer should be named
explicitly rather than inferred only from local implementation patches.

Current canonical framing:

- interaction layer = object-adjacent live manipulation/readability layer;
- distinct from object semantics;
- distinct from fixed control surfaces;
- distinct from presence layer;
- distinct from dice/special systems.
- interaction-layer elements should be object-anchored but viewport-stable by default rather than scaling like ordinary board content.

Current reference object families for this chapter:

- image = canonical box/media interaction object;
- note-card = canonical text-box interaction object;
- token = canonical pin interaction exception.

Current canonical interaction-state matrix should now include:

- selection;
- local move/drag;
- local resize/transform;
- local active mode;
- remote preview;
- remote occupied/blocked state;
- object-adjacent live controls;
- interaction gating.

Legacy `text-card` should not define the future interaction model.
- local token follow during image move/resize now uses the best available local live geometry path;
- remote attached-dependent behavior is now intentionally consistent with remote image preview semantics.

This is now a real runtime checkpoint, not only a design direction.

### 3.20. Attachment now points toward dependency hierarchy and effective bounds
Attachment chapter now also has a clearer higher-level target beyond the first working image-first slice.

It should be understood as:

- dependency hierarchy for geometry and interaction follow;
- not yet a full scene-graph or permissions tree;
- parent object provides the geometry source;
- attached pins, controls, and similar attached surfaces are dependents of that object.

The desired architecture concept is:

- `effective bounds`

with resolution priority:

1. local live interaction state
2. shared live preview state
3. committed object state

This should eventually let attached dependents feel like one live scene with the parent object rather than separate layers catching up independently.

Important backlog note:

- current effective-bounds extraction is a good intermediate step;
- ideal local feel still points toward near-zero visible catch-up between parent object and attached dependents during local interaction;
- that later polish likely needs a deeper local interaction-loop / dependent-follow pass, not just more helper tweaks.

### 3.21. Text-card sizing direction is now explicit
Text-card chapter now has a clearer near-term sizing rule as well.

Current intended direction:

- text-cards remain free board context cards;
- text-card should resize like a normal text box;
- manual resize may change width and height;
- text should reflow to the current box;
- while typing, card height should auto-grow if text no longer fits vertically;
- normal note text should auto-fit rather than clip in the ordinary note flow;
- text-cards should stay lightweight readable cards, not document-editor objects.

This is a design checkpoint for later implementation, not a runtime slice yet.

### 3.22. Legacy text-card -> new note-card replacement direction is now explicit
The current text-card chapter has now reached a clearer replacement decision as well.

Current intended direction:

- current `text-card` should be treated as a legacy object;
- a new `note-card` should become the canonical future note surface;
- legacy `text-card` and new `note-card` should coexist for now;
- first replacement slice should not migrate existing content;
- future note creation flow should later target `note-card`;
- new `note-card` should be built from correct text-box semantics from the start.

This is a replacement-direction checkpoint, not an immediate migration plan.

### 3.23. A minimal hosted-alpha room ops surface is now an explicit near-term need
Hosted alpha now has another practical operational need:

- we need a minimal place to see which rooms exist on the server;
- inspect what is currently stored in them;
- and reset / delete / repair problematic rooms when necessary.

This should be framed as:
- a narrow hosted-alpha room operations surface;
not as:
- a broad admin product.

### 3.24. Hosted durable snapshot persistence is now known to be restart-stable but not redeploy-stable
A practical hosted persistence fact is now verified:

- current hosted durable room snapshots survive ordinary backend restart;
- current hosted durable room snapshots do not survive redeploy.

So the current hosted snapshot layer should be treated as:
- operationally useful recovery between restarts;
but not yet:
- trustworthy deploy-persistent room durability.

### 3.25. Object interaction UI standardization is now a separate future chapter
After image, token, legacy text-card, and new note-card passes, another future consistency need is now explicit:

- before standardizing interaction UI, the app should be explicitly separated into layers:
  - object layer
  - interaction layer
  - control layer
  - presence layer
  - special interaction systems
- interaction standardization should then focus primarily on the interaction layer;
- this should be grounded in already implemented object families rather than abstract system design;
- the chapter should explicitly define the visual language / rules / interaction logic for:
  - selection;
  - resize;
  - occupied / blocked indication;
  - preview / active-manipulation states.

This is a future consistency/readability chapter, not an immediate broad rewrite.

Layer framing currently intended:

- object layer = images, note-cards, legacy text-cards, tokens, and future board objects;
- interaction layer = object-scoped interaction chrome and mechanics such as selection, resize, occupied/blocked indication, preview, and attached controls;
- control layer = fixed app/room command surfaces and panels;
- presence layer = cursors and other participant-awareness signals;
- special interaction systems = systems like dice that currently should not be forced into ordinary object/control semantics.

### 3.26. Server-controlled client reset is now the intended stale-local-memory cleanup path
Another operational need is now explicit:

- browser-local room memory is useful, but stale local state can survive product and deploy changes;
- backend should publish an explicit client reset policy marker;
- client should check that marker early during boot;
- if the policy changed, client should wipe scoped browser-local room-memory state before normal restore continues;
- browser participant identity should remain preserved in the first slice.

This is intentionally:

- a narrow operational invalidation mechanism;
- not a migration engine;
- not a broad persistence redesign;
- not an auth/admin-system chapter by itself.

### 3.27. Room creator truth is now intended as shared room-level truth, not browser-local metadata
A read-only audit clarified the current creator bug and the intended correction.

Current bug:

- room creator label and creator-based room governance are currently sourced from browser-local `roomRecord.creatorId`;
- separate browser contexts can therefore each initialize the same room with themselves as creator;
- this is why normal browser and incognito can both show `Creator: You` for the same room.

Intended direction:

- room creator identity must come from one shared room-level source of truth;
- browser-local room metadata becomes non-authoritative for creator identity;
- local room metadata may cache or mirror creator information, but must not originate it independently per browser;
- first fix should stay narrow:
  - one shared room-level creator id
  - creator UI reads from it
- creator-based governance reads from it
- no broad ownership / roles / account system

### 3.28. Room identity should now be treated separately from room content and local convenience memory
Another room-semantics clarification is now explicit.

It is no longer enough to think only in terms of:

- live shared room state
- durable room snapshot
- local room memory

The intended priority is now:

1. durable room identity
2. live shared room state
3. durable room snapshot
4. local convenience state
5. empty room

This means:

- durable room identity answers whether the room already exists as a durable room and what its room-level identity facts are;
- live shared room state answers what active participants are currently seeing;
- durable room snapshot answers what last saved board content can be recovered if live state is gone;
- local browser state is convenience-only and must not define room existence, creator truth, or canonical room content.

Practical consequence:

- room creator truth should ultimately anchor to durable room identity, not only to a live room-state doc;
- room history / recent-room UX should later be treated as local convenience state, not as room truth.

Current preferred clean fix:

- introduce a separate backend durable room identity store;
- keep its first-pass shape narrow:
  - `roomId`
  - `creatorId`
  - `createdAt`
- bootstrap creator from durable identity, not from snapshot;
- let live room-state mirror creator while the room is active;
- keep durable snapshot as content-recovery layer only.

### 3.28. Pushes should now prefer coherent checkpoints plus explicit post-push verification
Another workflow preference is now explicit:

- do not default to pushing every micro-fix separately;
- prefer pushing coherent checkpoints that represent one clear chapter or one tightly related cluster of fixes;
- each such push should carry an explicit verification surface:
  - what to verify locally;
  - what to verify on hosted/deployed surfaces.

This should help reduce drift between:
- what changed;
- what was actually validated;
- and what still needs post-push checking.

## 4. Current preferred next step

Следующие правильные шаги сейчас split into two tracks:

- continue hosted playable-session validation without broad cleanup;
- in the object/runtime layer, token attachment and first effective-bounds extraction now form a coherent checkpoint; later work can move either into a deeper local interaction-loop polish pass or into the next object/media-centered chapter.

## 5. Current deployment direction

Текущая hosted alpha shape:

- frontend отдельно;
- long-running Node realtime/API отдельно;
- video включён и остаётся optional alpha layer;
- LiveKit отдельно.

Это уже поднятый first hosted alpha core environment, а не final production platform.

## 6. Important open questions

- Какие rough edges проявятся только после hosted playable-session checks?
- Какие rough edges станут видны только после hosted use with working video enabled?
- насколько unified entry / leave-room flow feels right in real playable-session use without broader room UX work?

## 6.1. Current post-push verification preference

For the next larger checkpoints, verification should be recorded in two compact groups:

- local checks
- hosted/deploy checks

This should live in current context as a short next-verification list, while confirmed findings should move into the case-study log.

## 7. Relevant recent checkpoints

Из известных checkpoint'ов и milestones:

- `8616f6d Checkpoint multiplayer alpha milestone`
- `1e84e7b Add durable room snapshot persistence`
- color chapter reached checkpoint-ready state
- LiveKit chapter reached technical-validation state
- dice chapter reached accepted alpha-core state
- first hosted alpha core checkpoint reached
- hosted video milestone reached
- unified entry / leave-room lifecycle pass completed
- snapshot-based public demo strategy chosen
- first public demo snapshot chosen
- first real room baseline rollout (`public-demo-v1`) implemented
- governance runtime path implemented with first enforced restrictive rules
- governance runtime inspectability added in Dev tools
- room color/member direction corrected toward an 8-color / 8-active-user model

## 8. Safe intended framing for the next pass

- не новый большой capability spike;
- не broad architecture cleanup;
- не immediate long polish cycle;
- а continued hosted validation from a now-working practical hosted stack.

## 9. Last 3 messages (raw-ish)

### Message 1
User:
> давай я тебе дам все текущие файлы, скажи мне какие тебе нужны, ты сделешь мне их обновленные версии, потом ты мне расскажешь как все настроить и куда положить какие файлы, а какие дополнительно созадть

### Message 2
Assistant:
> нужны top-level operating docs, roadmap/config/package info и focused docs; часть старых документов противоречит текущему состоянию проекта и требует cleanup

### Message 3
User:
> возражений нет, вот файлы
