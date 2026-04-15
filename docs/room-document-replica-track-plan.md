# План трека перехода к системе реплик комнаты

## Роль этого файла

Этот файл задаёт agent-facing control plan для трека
`room document replica model`.

Он отвечает на вопросы:

- что входит в трек;
- что уже закрыто;
- какой следующий допустимый шаг;
- какой validation агент может закрыть сам;
- где агент обязан вернуть ход человеку;
- когда трек считается завершённым.

## Канонические источники

Этот файл не заменяет канонические источники.

Он опирается на:

- `docs/room-document-persistence-target-memo.md` как technical target;
- `docs/room-document-replica-map.md` как human-facing control map;
- `ROADMAP.md` как общий live priority source;
- `play-space-alpha_current-context.md` как operational handoff state.

При конфликте:

1. `docs/room-document-persistence-target-memo.md`
2. `docs/room-document-replica-map.md`
3. `ROADMAP.md`
4. этот файл

## Scope трека

Этот трек покрывает только переход committed board content к replica model.

Внутри трека:

- commit-boundary persistence discipline;
- browser-local replica baseline;
- local replica semantics;
- durable write model;
- recovery convergence model;
- core semantic cutover from snapshot arbitration.

Вне трека:

- participant identity stabilization;
- participant-marker / creator-color;
- broad hosted validation as separate chapter;
- UI polish;
- delta-log / compaction до реального pressure;
- broad transport redesign;
- broad `BoardStage` rewrite.

## Текущий статус

Текущий статус:

- migration chain active;
- phase-1 `browser-local replica baseline` checkpoint complete;
- `Local replica semantics` complete after write-side and read-side local
  replica slices plus human gate;
- local browser smoke harness baseline exists and is accepted as a machine gate
  for current replica-track steps;
- current next required step: `Durable write model`;
- current nearest checkpoint: `Checkpoint 2`;
- human gate still required between major checkpoints.

## Граница с room identity layer

Трек не смешивает `room identity layer` и `room document`.

Это означает:

- `roomId`, `creatorId`, `createdAt` остаются отдельным слоем;
- replica migration не закрывается ценой смешения identity и committed board
  content;
- следующие шаги используют эту границу как invariant.

## Cross-cutting prerequisite

`Document revision / version semantics` — общий implementation spine для всех
remaining steps после уже закрытого phase-1 baseline.

Этот prerequisite должен направлять:

- local replica semantics;
- durable write model;
- recovery convergence model;
- final semantic cutover.

Он не оформлен как отдельный линейный step.
Он должен явно появляться в решениях и implementation briefs для remaining
steps.

## Порядок выполнения

Агент работает только до ближайшего checkpoint.

Агент не имеет права:

- перепрыгивать через шаги трека;
- смешивать соседний chapter в replica migration pass;
- считать cleanup progress по логам progress по треку;
- закрывать checkpoint без human validation там, где нужен живой браузерный
  сценарий.

## Migration chain

### Шаг 1. Parallel replacement

**Статус**

- принят

**Роль**

Новая replica model растёт рядом со старой snapshot-arbitration model.

**Практический результат**

- migration идёт узкими фазами;
- product corridor остаётся рабочим;
- cutover делается по шагам.

### Шаг 2. Commit-boundary persistence policy

**Статус**

- сделано

**Роль**

Committed room content становится persistence-eligible на commit boundary.

**Что это дало**

- persistence gate видит committed state;
- interaction noise исключён из persistence corridor;
- storage и durable passes опираются на один rule of eligibility.

### Шаг 3. Browser-local replica baseline

**Статус**

- сделано

**Роль**

Первый серьёзный browser-local recovery base.

**Что это дало**

- browser-local replica moved to `IndexedDB`;
- one full room-document replica per room;
- write on commit boundary;
- narrow same-browser recovery read bridge.

### Шаг 4. Local replica semantics

**Статус**

- сделано

**Роль**

Browser-local state становится version-aware local replica, а не fallback blob.

**In-scope**

- explicit document revision identity for local replica;
- version-aware local bootstrap state;
- removal of local snapshot-winner choice from bootstrap logic;
- local restore enters replica semantics rather than fallback semantics.

**Out-of-scope**

- broad durable redesign;
- participant identity;
- creator-color semantics;
- final convergence behavior for all replicas.

**Done criteria**

- local replica имеет явную document revision identity;
- browser-local restore больше не работает как ad hoc fallback snapshot choice;
- local bootstrap читает version-aware replica state;
- local bootstrap больше не принимает snapshot winner-picking решение за весь
  recovery corridor.

**Expected validation**

- `npm run build`;
- narrow local verification of same-browser bootstrap behavior;
- human browser validation still required before step closure.

**Stop conditions**

- step starts redefining durable write semantics broadly;
- step starts changing bootstrap winner logic beyond local-replica scope;
- step starts mixing participant identity or marker semantics.

**Closure result**

- local replica now has explicit monotonic local revision identity;
- covered committed image/token/note corridors write into IndexedDB local
  replica on commit boundary;
- bootstrap read path treats version-aware local replica as the local document
  source even when the local content is empty;
- legacy `room-snapshot` remains only as a compatibility fallback when no
  version-aware local replica is available.

### Шаг 5. Durable write model

**Статус**

- не начато

**Роль**

Durable persistence становится version-aware durable replica path.

**In-scope**

- update-aware durable write discipline;
- durable acknowledgement / revision handling;
- durable checkpoint/update contract usable for later convergence;
- exit from conflict-prone whole-room snapshot `PUT` corridor as primary durable
  write path.

**Out-of-scope**

- full local+live+durable convergence;
- broad transport rewrite;
- delta-log scaling work beyond what the step directly needs.

**Done criteria**

- durable write path больше не опирается на ad hoc whole-room snapshot timing;
- durable persistence использует version-aware update discipline;
- durable acknowledgement / revision handling стали явной частью corridor;
- обычные committed moves больше не зависят от snapshot `PUT` как основного
  durable write path;
- durable checkpoint/update contract может участвовать в later convergence.

**Expected validation**

- `npm run build`;
- narrow runtime verification for durable write acknowledgements;
- human validation still required before checkpoint closure.

**Stop conditions**

- step requires broad room transport redesign;
- step starts rewriting `BoardStage` broadly;
- step mixes participant identity or unrelated multiplayer semantics.

### Шаг 6. Recovery convergence model

**Статус**

- не начато

**Роль**

Комната открывает local replica сразу и сходится с live/durable updates до
freshest shared room document state.

**In-scope**

- render local replica first;
- attach live transport;
- fetch or receive durable / live updates;
- converge by document revision/update semantics.

**Out-of-scope**

- legacy cleanup as separate tail work;
- participant identity chapter;
- broad visual polish.

**Done criteria**

- комната может открыть local replica сразу;
- live и durable updates подтягивают room к freshest shared document state;
- convergence определяется document revision/update semantics;
- current `live-wins + local fallback` bridge перестаёт быть основной recovery
  моделью;
- snapshot winner-picking перестаёт быть главным recovery mechanism.

**Expected validation**

- `npm run build`;
- dedicated local browser validation;
- human gate required before final cutover.

**Stop conditions**

- step starts redefining product semantics outside recovery;
- step broadens into participant identity or transport redesign;
- hosted/manual validation becomes mandatory and unavailable.

### Шаг 7. Core semantic cutover from snapshot arbitration

**Статус**

- не начато

**Роль**

Replica convergence становится основной recovery model.

**In-scope**

- core recovery semantics stop using snapshot arbitration;
- local browser state stops acting as separate fallback truth;
- durable path stops acting as competing snapshot source.

**Out-of-scope**

- legacy cleanup tail work;
- optional storage scaling;
- unrelated runtime cleanup.

**Done criteria**

- recovery живёт через replica convergence как основную модель;
- browser-local state больше не рассматривается как отдельный fallback source;
- durable path живёт как replica path, а не как legacy competing snapshot;
- snapshot arbitration перестаёт быть core recovery logic;
- timestamp- or priority-based winner selection больше не участвует в core
  recovery behavior.

**Expected validation**

- `npm run build`;
- explicit pre-cutover and post-cutover human validation;
- hosted smoke pass if the environment is already available.

**Stop conditions**

- step starts mixing legacy cleanup into semantic cutover;
- step lacks proof that convergence is already stable;
- step depends on unrelated roadmap chapter completion.

## Control checkpoints

## Chapter closure review discipline

Перед закрытием internal step или checkpoint в replica-track:

- review open entries in `docs/review-followups-log.md`, которые затронуты этим
  step;
- decide whether each entry should:
  - close
  - stay deferred
  - become the next narrow step in the same chapter
  - become a new later chapter candidate
- if a new task or chapter is spawned, update `ROADMAP.md` and
  `play-space-alpha_current-context.md` in the same pass.

### Checkpoint 1. Validation after browser-local baseline

**Статус**

- сделано

**Что подтвердили**

- image move / resize / draw-save survive refresh;
- token move survives refresh;
- note-card move survives refresh;
- note-card text edit survives refresh;
- leave / re-enter in the same browser works;
- second-browser shared truth stays coherent.

**Что это значит**

- phase-1 baseline usable;
- replica-track still open.

### Checkpoint 2. Validation after local replica semantics and durable write model

**Статус**

- позже

**Что должен подтвердить**

- local and durable persistence layers are version-aware;
- local bootstrap no longer behaves like snapshot fallback arbitration;
- durable write path no longer depends on snapshot-timing corridor as its main
  model.

**Что это не означает**

- full recovery convergence is complete;
- semantic cutover already happened.

**Checkpoint closure rule**

Этот checkpoint требует review bridge-bound smoke assertions, которые текущий
step делает устаревшими.

### Checkpoint 3. Validation before final cutover

**Статус**

- позже

**Что должен подтвердить**

- recovery already behaves through convergence;
- legacy snapshot logic is no longer needed as the primary operational safety
  net;
- the system is ready for core semantic cutover.

**Checkpoint closure rule**

Этот checkpoint требует review bridge-bound smoke assertions перед semantic
cutover.

## Validation split

### Machine validation

Агент может закрывать:

- `npm run build`;
- `npm run smoke:e2e` for local board/runtime/recovery regression coverage;
- focused code inspection;
- docs alignment;
- narrow inspectability for invisible/runtime changes.

### Human validation

Человек закрывает:

- real browser scenario validation;
- same-browser reopen behavior;
- second-browser shared truth behavior;
- final judgement that a checkpoint is actually trustworthy.

Без human gate крупный checkpoint не закрывается.

## Текущий automation baseline для текущего local-replica шага

До следующего replica-step accepted local smoke baseline уже покрывает:

- shared note sync between two browser contexts;
- active-room refresh while live state stays available;
- image move/resize sync and refresh survival;
- image draw/save refresh survival;
- same-browser local-only recovery for image state through current
  `local-recovery` / IndexedDB corridor;
- versioned empty local replica keeps same-browser reopen on the empty local
  document instead of stale `room-snapshot` or baseline fallback;
- same-browser token move recovery through current
  `local-recovery` / IndexedDB corridor;
- same-browser note move recovery through current
  `local-recovery` / IndexedDB corridor;
- same-browser note resize recovery through current
  `local-recovery` / IndexedDB corridor;
- same-browser note text save recovery through current
  `local-recovery` / IndexedDB corridor;
- runtime failure policy for uncaught page errors and disallowed console
  warning/error events.

Этот automation baseline является machine gate для remaining replica-track
passes, которые трогают board/runtime/recovery behavior.

## Stable smoke invariants

Эти smoke expectations должны пережить remaining replica-track steps:

- committed object state survives refresh or reopen;
- shared state reaches a second browser context where that corridor is expected
  to stay shared;
- same-browser reopen preserves committed state for the corridor under test;
- runtime failure policy still fails the suite on disallowed page or console
  regressions.

## Bridge-bound smoke assertions

Эти assertions защищают текущий bridge checkpoint и подлежат review на следующих
steps:

- bootstrap branch names such as `live-wins` and `local-recovery`;
- exact local source strings such as `indexeddb` and `room-snapshot`;
- exact `Last read:` source strings;
- current covered same-browser image/token/note recovery corridors use
  IndexedDB;
- legacy `room-snapshot` fallback still exists as a compatibility path when no
  version-aware local replica is available;
- current warning allowlist assumptions around durable snapshot browser noise.

Bridge-bound assertions полезны сейчас.
Они не являются permanent target semantics.

## Mandatory smoke review points

### After `Local replica semantics`

Review:

- legacy `room-snapshot` assertions that become stale when a covered corridor
  moves to IndexedDB;
- exact `local source ...` assertions;
- exact `Last read: ...` assertions;
- `Bootstrap: local-recovery` expectations where the source contract changes.

### After `Durable write model`

Review:

- accepted durable warning allowlist;
- assumptions tied to current durable snapshot browser errors `404/409`;
- ops-side durable expectations that still assume snapshot-era timing.

### After `Recovery convergence model`

Review:

- `Bootstrap: live-wins` assertions;
- strict local-vs-live bootstrap branch expectations;
- current bridge-era local-vs-live source split assertions.

### After `Core semantic cutover`

Review:

- every bridge-era bootstrap/source assertion;
- every `room-snapshot` fallback assertion;
- every allowlist entry that only exists because snapshot-era behavior is still
  visible in the browser.

Keep:

- stable smoke invariants;
- runtime failure policy;
- convergence-era recovery assertions that match the new core semantics.

## Guardrails

Агент по умолчанию:

- не смешивает replica-track с participant identity;
- не меняет bootstrap arbitration широко без явного analysis-first scope;
- не делает broad transport redesign;
- не делает broad `BoardStage` rewrite;
- не считает console cleanup progress по migration chain;
- не вводит delta-log до реального pressure;
- не переписывает durable/local/live semantics в одном неограниченном pass.

## Decision rules

Если pass:

- только уменьшает log noise, это cleanup, а не progress по треку;
- меняет recovery semantics, сначала нужен analysis-first framing;
- трогает и durable, и local behavior сразу, нужен явный scope boundary;
- упирается в manual QA, hosted validation или product judgement, агент
  возвращает ход человеку.

## Как запускать unattended-pass в этом треке

Правильный режим:

1. выбрать ближайший step или checkpoint;
2. сделать узкий strategist -> executor brief;
3. выполнить implementation pass;
4. закрыть machine validation;
5. остановиться на human gate, если он нужен;
6. обновить `ROADMAP.md` и `play-space-alpha_current-context.md` после
   подтверждённого checkpoint.

Неправильный режим:

- "доделай весь replica-track";
- "закрой chapter до конца";
- "параллельно подчисти соседние semantics".

## Exit criteria для всего трека

Трек считается завершённым, когда:

- recovery живёт через replica convergence;
- local browser state больше не живёт как fallback truth;
- durable path больше не живёт как competing snapshot source;
- snapshot arbitration больше не является core recovery semantics;
- core semantic cutover подтверждён последним human gate.

## Что intentionally deferred

Не нужно для закрытия трека:

- `checkpoint + delta-log`;
- поздний storage scaling path;
- Figma-class local update-log engine;
- legacy cleanup tail work после core semantic cutover.

## Связанные шаблоны

Для каждого narrow pass в этом треке использовать:

- `docs/task-brief-template.md`
- `docs/executor-report-template.md`
