# play-space-alpha — current context / chat handoff

## 1. Current state summary

## 0. Working planning mode

Current-context distinguishes two working modes.

### Default mode

After chapter closure, the project returns to planning mode by default.

In planning mode:

- next work is tracked as `candidate`;
- current chapter truth stays canonical;
- the next chapter becomes `active` only after an explicit planning decision.

### Hard sprint mode

Hard sprint mode starts only by explicit decision.

Use it when the next execution chain is already chosen and the project is
intentionally entering a concrete implementation sprint.

In hard sprint mode:

- the selected chapter is recorded as `active`;
- the chosen slice order may be written as the working sprint sequence;
- other future work remains `candidate`, `backlog`, or `optional`.

Current branch reached its cleanup sprint checkpoint:

- branch: `sprint/cleanup-lint-boardstage-foundation`
- `main` stays the stable hosted/demo line
- room data on the alpha stage is now treated as disposable state rather than as compatibility-protected user data
- schema-changing semantic/runtime chapters may require room wipe
- legacy room compatibility is optional unless a current demo or validation checkpoint explicitly needs it
- `lint green baseline` is closed
- `BoardStage` structural reduction phases `1–4` are closed
- `participant-marker / creator-color` room-document fallback checkpoint is closed
- hosted validation after this cleanup checkpoint is closed
- note editor overlay and hosted debug gate hotfixes are verified on the exact preview deploy
- current live and the cleanup preview show the same staged hydration pattern, so the remaining room-open timing concern is a general hosted/runtime follow-up rather than a branch-specific blocker
- explicit `Leave room` now switches creator-colored participant-marker tokens to `room-document`, while abrupt tab close still leaves stale `live-occupancy`

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
- минимальный локальный Playwright smoke harness теперь покрывает shared note, image move/resize recovery, image draw/save recovery, token move recovery, note move/edit recovery, same-browser local-only recovery, active-room refresh flow и runtime failure policy с узким allowlist для принятого local smoke browser baseline;
- first hosted core deploy поднят;
- базовая hosted validation core flow подтверждена;
- hosted video now works as an optional layer via the Vercel token fallback path;
- unified room entry screen now exists and room name is editable before join;
- in-room lifecycle now uses `Leave room` instead of direct room switching;
- hosted core checkpoint remains valid and has now expanded into a practical hosted core + video checkpoint.
- `App` structural hotspot is closed for the current phase;
- narrow `BoardStage` cleanup chapter is checkpoint-closed;
- refreshed architecture/runtime audit is completed;
- current active architecture hotspot is now persistence/recovery correctness.
- `Durable write model` is now closed after human gate:
  - covered local token/image/note commits write durable updates through a narrow slice corridor;
  - commit-owned durable corridors now own ordinary runtime durable writes;
  - covered multi-client durable update corridors no longer rely on browser-visible `409` resource noise;
  - covered durable `PATCH` corridors now use per-slice revision discipline to avoid cross-slice stale-base conflicts.
- `Checkpoint 2` is now closed after local and durable persistence maturity.
- `Recovery convergence model` is now closed after human gate:
  - empty-live bootstrap now opens the version-aware local replica first;
  - empty-live settled recovery now converges per slice after provisional local-open;
  - durable slice now catches up only when its durable slice revision is ahead of the local handoff metadata;
  - bootstrap read path now uses version-aware local replica or `none` and no longer reads `room-snapshot`;
  - committed add/remove corridors now survive same-browser reopen through local replica coverage;
  - active-room `live-wins` behavior stays unchanged;
  - debug inspectability now separates `Initial open` from settled recovery outcome and shows slice-level settled sources.
- `Checkpoint 3` is now closed before final cutover.
- `Core semantic cutover from snapshot arbitration` is now closed after docs
  alignment and human gate:
  - visible debug/smoke contract now uses replica vocabulary;
  - settled recovery now reports through `Settled` state and settled slice
    sources;
  - replica-track is now complete.
- `browser-local participant identity stabilization` is now closed after
  human gate:
  - browser-local `participantId`, room-local saved session, foreground-tab
    live carrier, shared active room session, and remembered room defaults now
    read as one coherent browser-local identity model;
  - human checks confirmed same-browser repeat join, foreground/background tab
    behavior, cross-tab attach, leave propagation, and previous color
    preselect behavior;
  - local smoke now also covers same-browser second-tab attach in one browser
    profile.
- `participant-marker / creator-color` room-document fallback checkpoint is now closed.
- cleanup sprint checkpoint is now closed in branch `sprint/cleanup-lint-boardstage-foundation`.
- Dev tools inspectability surface now has a closed usability cleanup checkpoint:
  - the panel stays viewport-bounded on ordinary desktop viewports;
  - lower inspect blocks and controls stay reachable through internal scroll;
  - smoke-facing inspectability values and hooks stay unchanged.
- room ops now have one recorded durability ergonomics follow-up:
  - destructive snapshot delete leaves the room without durable recoverability until the next covered commit;
  - a separate `room-ops durability ergonomics` task is now recorded for reseed or leave-flush policy.
- legacy `room-snapshot` now has one optional hygiene follow-up:
  - recovery no longer reads it;
  - a separate `legacy room-snapshot write-cache cleanup` task is now recorded for the remaining write-only cache tail.
- internal recovery naming/log vocabulary now has one optional hygiene
  follow-up:
  - core runtime contract already uses settled recovery state;
  - a separate `internal recovery naming/log cleanup` task is now recorded for
    remaining `bootstrap-*` internal names and log tags.
Current workflow rule for hosted validation:

- hosted validation is no longer treated as a mandatory blocking linear phase
  before further meaningful product work;
- instead, it should be treated as a recurring checkpoint after large product
  steps and after new demo snapshots.

Current expected order from here:

1. keep `main` as the stable hosted/demo line;
2. treat this branch as a merge-ready cleanup checkpoint after closed hosted validation;
3. return to planning mode after the closed creator-color checkpoint;
4. carry forward staged hosted hydration waves and multi-context slowdown as a separate hosted/runtime follow-up;
5. carry forward stale `live-occupancy` after abrupt tab close as a separate room-liveness follow-up;
6. avoid reopening `BoardStage` cleanup micro-slices unless a new sprint is started explicitly.

Current agreed `BoardStage` target model for this cleanup sprint:

- `BoardStage` stays the orchestration shell and keeps runtime ownership.
- `BoardStageScene` is the next target render boundary for Konva scene composition.
- `BoardStageShellOverlays` owns shell chrome and scene-attached HTML overlays.
- `BoardStageDevToolsContent` owns debug and inspection UI.
- shared 3D dice stay the top app-owned visual layer above the board stack and overlays.

Canonical wording for this target now lives in `docs/ARCHITECTURE.md`.

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

Another explicit color-model clarification now applies:

- creator-linked object rendering should resolve creator color from the
  participant currently assigned to that creator id;
- creator-linked persisted/shared objects should not use historical
  `authorColor` snapshot fields as canonical truth;
- the intended long-term object truth is:
  - persist `creatorId`
  - resolve current creator-linked color separately

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

This participant-marker phase now reached a creator-color checkpoint:

- room-scoped `participantAppearance` now stores last-known participant color and name;
- creator color resolution now uses `live -> room-document -> legacy-fill`;
- creator-color inspectability now shows exact source labels;
- explicit `Leave room` now reaches `room-document` fallback.

Deferred runtime follow-up from this chapter:

- abrupt tab close still leaves stale `live-occupancy`;
- manual truth showed that unload cleanup and occupancy freshness hacks did not close this path;
- room-occupancy teardown after abrupt close now lives as a separate runtime follow-up.

### 3.18. Persistence/recovery track reached its first working checkpoint

`room document persistence / recovery architecture` reached a working
checkpoint.

Accepted direction:

- committed board content should be modeled as one logical room document;
- the room document should have:
  - local replica
  - live replica
  - durable server replica
- awareness stays separate from durable room content;
- persistence eligibility should be decided at commit boundary;
- the chosen migration strategy is `parallel replacement`:
  - keep the current product surface;
  - build the target room-document replica model beside the current snapshot-arbitration model;
  - cut over by phases.
- the accepted first browser-local replica storage baseline is `IndexedDB`;
- the accepted first browser-local replica shape is one full room-document
  replica per room;
- local delta-log / compaction design stays deferred until the IndexedDB
  baseline proves insufficient.

Practical blocker behind this decision:

- committed room content can still be lost or recovered incorrectly;
- at that checkpoint current model still arbitrated between local and durable snapshots as competing sources;
- confirmed bug corridors include quick leave / re-enter, refresh, and image commit boundaries.

Current implementation consequence:

- the uncommitted `Phase 1` runtime seam should be reused later as groundwork where useful;
- it should not be committed as-is, because it currently mixes useful runtime extraction with incomplete persistence semantics.

Completed implementation phase:

- `narrow commit-boundary persistence phase`

Important persistence result already established during this chapter:

- current `localStorage`-based room snapshot path can already hit browser quota in realistic room usage;
- once quota is hit, room snapshot writes fail with `setItem(...): exceeded the quota`;
- this should be treated as a meaningful architecture signal, not as incidental local noise;
- accepted consequence: the first serious local room-document replica baseline should move to IndexedDB rather than relying on `localStorage`.
- accepted current implementation target: IndexedDB-backed full room-document replica writes on commit boundary, followed by a narrow same-browser recovery read bridge.
- analysis note: [docs/creator-color-fallback-analysis-2026-04-14.md](docs/creator-color-fallback-analysis-2026-04-14.md)

Checkpoint result now confirmed manually:

- same-browser refresh recovers committed image, token, and note-card state;
- same-browser leave / re-enter works;
- second-browser shared truth stays coherent;
- the current remaining durable `409 conflict` entries are occasional commit-time
  conflicts and the room flow stays intact.

Track status now reads like this:

- the first `IndexedDB` local-replica checkpoint is closed;
- `Local replica semantics` is now closed as the next internal replica-track step;
- the broader replica migration chain remains open;
- later required replica-track steps now include durable write model,
  recovery convergence, and final cutover from snapshot arbitration.

Next separate chapter candidate:

- `participant-marker / creator-color`

Separate observed watch item:

- entry availability readiness may still race on the entry screen;
- observed symptom: occupied colors can appear with visible delay after opening the room entry screen, leaving a brief window where a blocked color looks free;
- current handling decision: keep this as a deferred narrow hotfix unless the repro becomes stable enough to block the current runtime/object chapter.

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

### 3.20. Board-material tokenization now has an explicit canvas-resolution rule
Во время first board-material design-system slice был выявлен важный runtime distinction:

- CSS custom properties can act as the semantic source of truth for board materials;
- DOM surfaces may consume those values directly as `var(--...)`;
- Konva/canvas surfaces must not rely on raw `var(--...)` strings as if they were ordinary CSS backgrounds.

Практический итог:

- board backdrop may keep using the semantic CSS-token path directly in DOM styles;
- board surface inside Konva must receive a resolved color string, not an unresolved CSS variable reference;
- current board-material layer therefore now needs a small runtime resolution step for canvas consumers.

Why this matters:

- a narrow tokenization pass can look semantically correct while still producing a visual regression if a canvas consumer stops receiving a real color;
- in the observed regression, the board surface became effectively black/darker while the surrounding backdrop stayed correct, which made the board/backdrop relationship look inverted.

Current intended rule:

- keep one semantic source of truth for board materials;
- resolve that source separately for canvas/Konva when needed;
- do not fork the board palette into unrelated CSS-only and canvas-only canons unless a later design pass explicitly requires it.
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
- backend room knownness for ops should also ultimately anchor to an explicit room-level registration path rather than incidental live-doc presence or later snapshot creation.

Current preferred clean fix:

- introduce a separate backend durable room identity store;
- keep its first-pass shape narrow:
  - `roomId`
  - `creatorId`
  - `createdAt`
- bootstrap creator from durable identity, not from snapshot;
- let live room-state mirror creator while the room is active;
- keep durable snapshot as recoverable room-state layer, but not as room identity authority.

Additional near-term consequence now identified:

- `/ops/rooms` currently lists backend-known rooms only;
- backend-knownness is currently inferred from live docs, durable identities, and durable snapshots;
- this creates a room-lifecycle gap:
  - a real room may disappear from ops if it never became durably known;
  - a draft room may appear temporarily via entry/live presence side effects;
- this should be treated as a postponed room-lifecycle/room-knownness decision point, not as an ops-only rendering bug;
- preferred future direction is a narrow explicit registration step tied to real join/activation, likely through the durable room identity path rather than a new broad catalog system.

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

### 3.29. Executor-side manual QA should be treated as limited

For current AI-assisted implementation work, manual QA should not be framed as
something the executor can always perform directly.

Current practical constraint:

- executor-side validation is reliable for:
  - build success
  - static code review
  - narrow runtime/code-path reasoning
  - inspect/debug surfaces that already exist and are easy to exercise
- executor-side manual QA is not automatically reliable for:
  - visual acceptance
  - subtle UI regressions
  - gesture-heavy browser behavior
  - multi-client real-session checks
  - flows that require explicit live browser observation

Working rule:

- future implementation briefs should phrase manual QA as:
  - "if practical"
  - or "report whether it was actually run"
- the executor should not claim manual QA unless there is a real path to run it
- if a change needs true visual or interaction acceptance, that should either:
  - be verified by the user
  - or be postponed to a dedicated verification pass with a real runnable UI
    path

This is especially important for design-system migration work, where
structural passes may land before visual tuning and where successful builds do
not prove that the UI has been visually accepted.

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

- не новый capability spike;
- не broad architecture cleanup;
- не hosted validation как обязательная линейная фаза;
- и не немедленное продолжение design-system visual polishing;
- а analysis-first structural pass по `src/App.tsx` после current
  design-system checkpoint.

## 8.1. Design-system migration follow-up rule

The current design-system migration chapter is still running in
`structural migration first, visual tuning later` mode.

Because of that, one explicit follow-up rule now applies:

- once the main ordinary-interface migration chapter is sufficiently landed,
  run a dedicated cleanup pass for lingering local visual overrides that still
  sit on top of shared family recipes;
- do not treat those overrides as the final intended steady state just because
  shared family ownership already exists;
- do not try to normalize every such override opportunistically during
  structural migration unless there is a clear usability or correctness reason.

## 8.2. Ordinary-interface design-system chapter is now paused as structurally landed

The ordinary-interface design-system migration chapter has now reached a good
enough structural checkpoint to pause.

What is already structurally landed:

- fields
- buttons
- selection controls
- swatches
- boxed callouts
- surfaces
- rows
- ops inline helper/error text

What this means:

- the remaining ordinary-interface work is now mostly later cleanup,
  visual reconciliation, and explicit local exceptions rather than major shared
  family migration debt;
- the ordinary-interface chapter does not need to keep expanding before other
  higher-signal work resumes;
- the next safe design-system direction beyond this pause is the board-layer
  chapter, starting with board material tokenization and its canvas-resolution
  rule.

## 8.3. Board-object shells are explicitly outside the current design-system rollout

Another boundary is now explicit:

- board-object shells such as note-card body rendering and token body rendering
  should not currently be treated as direct design-system migration targets;
- they belong to a separate future object-shell management layer;
- current design-system work may still touch board-level controls, board-level
  surfaces, and board-adjacent utility UI;
- but the shell of the object itself is intentionally held out of the current
  rollout.

## 8.4. Image-attached drawing controls need later polish and may become their own compact class

Another narrow board-controls conclusion is now explicit:

- the image-attached `Draw` / `Save` / `Clear` / `Clear all` controls can use
  shared button ownership structurally;
- but they should still be treated as custom board-adjacent controls that need
  later polish and special attention;
- they may later want a dedicated compact / pill-like board-control class
  rather than staying a plain long-term projection of ordinary button recipes.

## 8.5. The first safe board-layer continuation is now landed enough to pause

The first board-layer follow-up after the ordinary-interface chapter is now also
at a reasonable structural checkpoint.

What is already landed:

- board material tokenization
- explicit CSS-vs-canvas resolution rule for board materials
- object-semantics tooltip shell
- dice tray shell ownership
- image-attached drawing-management controls mapped through shared button
  ownership

What this means:

- the remaining work is no longer a continuation of the same easy board-surface
  / board-control chapter;
- the post-first-wave review already clarified the main residual
  design-system gaps and exception boundaries;
- the next two design-system chapters are now explicitly split into:
  - missing families and variants
  - design-system visual polishing
- the first chapter is now landed enough to pause:
  - `compact button` is accepted
  - `text button` is clarified as a button-derived path
  - `interactionButton.pill` / `interactionButton.circle` are accepted
  - `interactionButton.pill` already has a first live runtime consumer
- the second chapter should:
  - align current look and feel through token and family changes
  - avoid creating new local overrides as the main solution
- the next larger boundary should be chosen after those two chapters rather
  than assumed in advance;
- object shells still remain intentionally out of scope for the current
  design-system rollout.

Open design-system review questions to keep explicit:

- whether image-attached drawing controls should later become a dedicated
  compact / pill-like board-control class
- which board-adjacent shells and controls need their own explicit subchapter
  rather than more ad hoc extensions

Standalone exceptions to keep explicit in design-system docs:

- participant-name inline edit/display behavior
- tooltip-local row grid and placement math for object-semantics tooltip
- Konva-attached geometry and anchoring math for image-attached drawing controls
- fixed placement and sizing for pinned board panels and subsystem docks
- dice tray shell placement / pointer-events shell behavior
- media tile internal video framing / overflow structure

Accepted override / boundary decisions already made:

- participant panel placement and size are acceptable local context, but blur
  should not remain a free local override because it belongs to the material
  layer
- for shared floating board shells, material ownership now includes shell
  geometry such as border radius rather than only color/shadow treatment
- media dock shell and participant tile should move toward standard shared
  material first; more detailed cleanup can wait until a dedicated media pass
- the fixed add-image trigger should read as the same standard user-accent
  button class as the dice buttons, only pinned to the top-right board corner
- image-attached drawing-management controls should later be reviewed together
  with compact / pill-like board controls as a likely reserved attached-control
  style
- round / pill-like buttons should be reserved for board-object interaction so
  that classic interface controls and board-object interaction controls stay
  visually separated
- `compact button` is now accepted as a real ordinary button-family branch with
  dense geometry, while remaining a button-local branch rather than a new
  system-wide compact scale
- `text button` is now accepted as a button-derived text-action path inside the
  button system rather than a separate adjacent family
- a shared neutral-primary button tone path is now also accepted for
  user/session-facing controls that should not default to the system blue
  accent
- the participant color palette should avoid a red slot that reads too close to
  destructive semantics; the current 8-seat palette now uses a non-red
  replacement set instead
- the reserved board-interaction control branch is now accepted as:
  - `interactionButton.pill`
  - `interactionButton.circle`
- the first live runtime consumer of `interactionButton.pill` is now the
  image-attached drawing-management control set:
  - `Draw`
  - `Save`

## 8.6. Design-system work is now paused after a good checkpoint

The current design-system wave should now be treated as paused at a good
checkpoint rather than as the immediate next active chapter.

What is already true:

- ordinary-interface migration is structurally landed enough to pause
- the first safe board-layer continuation is landed enough to pause
- the missing families and variants chapter is landed enough to pause
- the shared system is now coherent enough that further work would move from
  structural migration into visual polishing rather than core family discovery

What this means:

- current design-system work should not keep expanding automatically just
  because the next chapter already exists on paper
- the next design-system chapter remains:
  - design-system visual polishing
- but it is intentionally not the immediate active focus anymore

## 8.7. Repo/runtime health work closed the current `App` chapter

After the hygiene passes, repeated project-health audits, and the recent
successful `App.tsx` slices, the repo now reads more clearly:

- `App.tsx` really was the right next structural target;
- `BoardStage.tsx` still remains the other major hotspot and is still riskier;
- the narrow `App` split track produced real structural progress.

What has already landed in `App`:

- render ownership split;
- direct room URL bootstrap priority fix;
- entry-only availability/color extraction;
- joined-room awareness transport extraction.

One additional attempted slice was intentionally **not** accepted:

- extracting local room-record bookkeeping into a dedicated hook looked viable
  in read-only analysis, but was reverted after real runtime regressions
  appeared;
- symptoms included broken leave behavior and heavy churn/heat during runtime;
- this is now treated as evidence that the narrow split track has reached its
  real safe boundary earlier than that attempted pass.

This changed the meaning of the remaining `App` debt.

It is no longer best described as generic split cleanup.

The remaining cluster now reads more honestly as:

- boot / restore ownership
- join / leave / collapse transitions
- participant session + room-record + creator synchronization
- cross-tab active-room ownership
- foreground presence-carrier coordination

What landed after that framing:

- joined-room activation / restore now goes through one explicit activation path;
- live participant color change now republishes joined-room presence immediately;
- top-level route shell split landed;
- `App.tsx` no longer appears in current lint output.

So the current framing is now:

- the current `App.tsx` chapter is closed as a structural hotspot;
- the narrow `BoardStage.tsx` cleanup chapter has now also reached a real checkpoint;
- one hard structural knot still remains around participant marker ownership, but it no longer reads as another safe micro-fix inside the same chapter;
- design-system visual polishing remains paused, not abandoned.

Working order from here:

1. treat `App.tsx` as closed for the current phase
2. treat the current narrow `BoardStage.tsx` cleanup chapter as checkpoint-closed
3. carry forward the required deferred participant-marker / creator-color follow-up as a separate later chapter, not as one more micro-fix here
4. treat the refreshed architecture/runtime audit as completed
5. treat `next runtime/object chapter` as paused by persistence/recovery correctness
6. open `room document persistence / recovery architecture` as the active chapter
7. treat `narrow commit-boundary persistence phase` as the completed first implementation checkpoint
8. treat `Local replica semantics` as the completed next internal replica-track step
9. treat `Durable write model` as the completed next internal replica-track step
10. treat `Checkpoint 2` as closed after local and durable persistence maturity
11. treat `Recovery convergence model` as the completed current internal replica-track step
12. treat `Checkpoint 3` as closed before final cutover
13. treat `Core semantic cutover from snapshot arbitration` as the closed final internal replica-track step
14. treat `room document persistence / recovery architecture` as the closed migration track
15. treat `browser-local participant identity stabilization` as a closed chapter
16. treat `debug-tools usability cleanup` as a closed separate inspectability/usability pass
17. keep `room-ops durability ergonomics` as a later follow-up task outside the closed replica-track chapter
18. keep `legacy room-snapshot write-cache cleanup` as an optional hygiene follow-up outside the core recovery semantics
19. keep `internal recovery naming/log cleanup` as an optional hygiene follow-up outside the core runtime contract
20. keep `same-browser leave propagation warning cleanup` as a later runtime-hygiene follow-up outside the closed participant identity chapter
21. treat the creator-color room-document fallback checkpoint as closed and keep abrupt tab-close room-occupancy liveness as a separate later runtime follow-up

Accepted cleanup decisions already made:

- remove the remaining visual overrides from the entry main panel
- remove the remaining visual overrides from the entry debug inset
- for the participant panel shell:
  - keep placement and size local
  - move blur/material treatment under the accepted shared-material direction
- remove the remaining shell/material overrides from the media dock shell
- do not clean up participant video tile overrides in this pass
- remove the remaining local mini-card overrides inside the governance inset
- remove the remaining local shadow tuning on dice buttons
- remove the remaining local visual overrides from the fixed add-image trigger
  except for its placement
- align the fixed add-image trigger look-and-feel with the dice-button class
- remove the remaining local background/material override from the governance
  inset itself

## 8.6. Historical design-system framing

This section is historical context from an earlier phase.
It is no longer the active big step.

- ordinary-interface migration being paused does not mean the whole project has
  already migrated onto the new design system;
- the current active big step is now persistence/recovery architecture;
- after the next large migration checkpoints, a series of read-only audits
  should follow:
  - project audit
  - process/workflow audit
  - architecture audit where useful
- the completion criterion for the migration is not internal agent confidence;
- the migration should count as complete only when the user explicitly decides
  that the project now counts as having moved onto the new design system.

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
