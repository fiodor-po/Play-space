# Карта новой системы реплик комнаты

## Зачем нужен этот файл

Этот файл даёт короткую карту трека `room document replica model`.

Он отвечает на четыре вопроса:

- как называть новую систему;
- из каких блоков она состоит;
- зачем нужен каждый блок;
- какой порядок обязательных migration-шагов уже пройден и какой идёт дальше.

Техническая архитектурная опора лежит в
`docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-document-persistence-target-memo.md`.
Этот файл держит человеко-понятную карту.

## Граница этого плана

Этот файл держит только **трек перехода к системе реплик комнаты**.

В него входят только шаги, без которых система не доезжает до target memo.

В него не входят:

- participant identity stabilization;
- participant-marker / creator-color;
- обычные hosted validation checkpoint'ы;
- UI polish;
- optional storage scaling work до появления реальной необходимости.

## Текущий статус трека

Текущий статус:

- migration chain active;
- phase-1 `browser-local replica baseline` checkpoint complete;
- checkpoint 2 after local and durable replica maturity is complete;
- checkpoint 3 before final cutover is complete;
- `Core semantic cutover from snapshot arbitration` is complete;
- replica-track is complete;
- next separate chapter is `browser-local participant identity stabilization`.

## Как это называть

Рабочее название:

- **система реплик комнаты**

Точное название:

- **room document replica model**

Короткая разговорная форма:

- **новая система реплик**

## Mature replica model

### Блок 1. Room identity layer

**Смысл**

У комнаты есть отдельный маленький identity layer.

**Что внутри**

- `roomId`
- `creatorId`
- `createdAt`

**Зачем нужен**

Держит identity отдельно от committed board content.

### Блок 2. Логический документ комнаты

**Смысл**

Комната хранится как один логический документ.

**Что внутри**

- tokens
- images
- text cards
- committed drawing result
- позже: room-scoped last-known participant appearance

**Зачем нужен**

Даёт один понятный carrier для committed room content.

### Блок 3. Live replica

**Смысл**

Текущее общее состояние активной комнаты.

**Зачем нужен**

Даёт active-session truth во время живой совместной работы.

### Блок 4. Durable replica

**Смысл**

Серверная recoverable копия того же room document.

**Зачем нужен**

Даёт shared non-live truth вне активной live-сессии.

### Блок 5. Local browser replica

**Смысл**

Локальная копия того же room document в браузере.

**Зачем нужен**

Даёт same-browser recovery после refresh, leave / re-enter и коротких
провалов сети.

### Блок 6. Awareness layer

**Смысл**

Временный слой live-presence и interaction cues.

**Что внутри**

- cursors
- presence
- previews
- locks
- activity indicators

**Зачем нужен**

Держит быстрые временные сигналы отдельно от durable content.

### Блок 7. Document revision / version semantics

**Смысл**

Реплики должны сходиться по версии документа, а не по ad hoc snapshot
priority.

**Зачем нужен**

Даёт путь от competing snapshots к replica convergence.

## Migration order

### Обязательная boundary condition для всего migration order

Этот трек не должен смешивать `room identity layer` и `room document`.

Это означает:

- `roomId`, `creatorId`, `createdAt` остаются отдельным слоем;
- migration chain не закрывается ценой смешения identity и committed room
  content;
- replica migration сохраняет эту границу на каждом следующем шаге.

### Cross-cutting prerequisite for remaining steps

`Document revision / version semantics` — общий implementation spine для всех
remaining steps после уже закрытого phase-1 baseline.

Он нужен для:

- local replica semantics;
- durable write model;
- recovery convergence model;
- final cutover from snapshot arbitration.

### Шаг 1. Parallel replacement

**Смысл**

Новая replica-модель растёт рядом со старой snapshot-моделью.

**Зачем нужен**

Даёт узкий безопасный переезд без большого cutover.

**Статус**

- принят

### Шаг 2. Commit-boundary persistence policy

**Смысл**

Committed room content становится persistence-eligible точно на commit boundary.

**Что внутри**

- persistence gate sees committed state only;
- interaction noise stays outside persistence;
- commit corridors are stabilized before deeper storage work.

**Зачем нужен**

Убирает зависимость от broad late-effect windows и подготавливает реплики к
правильной write discipline.

**Статус**

- сделано

### Шаг 3. Browser-local replica baseline

**Смысл**

Первый серьёзный browser-local recovery base.

**Что внутри**

- storage moved from `localStorage` to `IndexedDB`
- one full room-document replica per room
- write on commit boundary
- narrow same-browser recovery read bridge

**Зачем нужен**

- это первая storage implementation формы commit-boundary persistence policy;
- `IndexedDB` выдерживает реалистичный room payload лучше
- full replica проще и безопаснее первого delta-log шага
- commit-boundary writes не спамят storage на каждый pointer move

**Статус**

- сделано

## Control checkpoints

### Checkpoint 1. Validation after browser-local baseline

**Смысл**

Checkpoint закрывается по реальному поведению продукта.

**Что подтвердили**

- image move / resize / draw-save survive refresh
- token move survives refresh
- note-card move survives refresh
- note-card text edit survives refresh
- leave / re-enter in the same browser works
- second-browser shared truth stays coherent

**Зачем нужен**

Подтверждает, что новая система уже usable как product corridor.
Это checkpoint для phase-1 baseline, а не завершение всей migration chain.

**Статус**

- сделано

### Шаг 4. Local replica semantics

**Смысл**

Browser-local state должен окончательно перестать быть fallback snapshot и
стать настоящей local replica room document.

**Что внутри**

- room document получает явную revision / version identity;
- local replica получает явную document revision identity;
- client layer начинает видеть local replica как versioned room document, а не
  как удобный fallback blob;
- bootstrap read path перестаёт выбирать snapshot-победителя;
- browser-local bootstrap начинает отдавать дальше version-aware local state
  вместо legacy snapshot winner choice.

**Зачем нужен**

Это первый обязательный шаг после local baseline, который делает модель именно
replica model, а не просто improved recovery.

**Статус**

- сделано

**Шаг считается завершённым, когда**

- local replica имеет явную document revision identity;
- browser-local restore больше не работает как ad hoc fallback snapshot choice;
- local bootstrap читает version-aware replica state;
- local bootstrap больше не принимает snapshot winner-picking решение за весь
  recovery corridor.

### Шаг 5. Durable write model

**Смысл**

Durable persistence должна уйти от ad hoc whole-room snapshot timing к
update-aware durable model.

**Что внутри**

- update-driven persistence;
- checkpointed durable recovery;
- cleaner durable acknowledgement / revision handling;
- уход от conflict-prone whole-room snapshot `PUT` corridor как основного durable
  write path;
- durable checkpoint/update contract становится usable для later recovery
  convergence.

**Зачем нужен**

Снимает текущий structural gap между usable local replica и still-conflict-prone
durable path.
Убирает ad hoc save timing и переводит durable replica к version-aware write
discipline.

**Статус**

- сделано

**Шаг считается завершённым, когда**

- durable write path больше не опирается на ad hoc whole-room snapshot timing;
- durable persistence использует version-aware update discipline;
- durable acknowledgement / revision handling становится явной частью corridor;
- обычные committed moves больше не зависят от conflict-prone snapshot `PUT` как
  главного durable write path;
- durable checkpoint/update contract может участвовать в version-aware
  convergence.

### Checkpoint 2. Validation after local replica semantics and durable write model

**Смысл**

Checkpoint подтверждает, что local и durable replicas уже вышли из
snapshot-timing corridor и стали version-aware persistence layers.

**Зачем нужен**

Даёт право переходить к full recovery convergence только после того, как обе
стороны persistence spine стали достаточно зрелыми.

**Статус**

- сделано

### Шаг 6. Recovery convergence model

**Смысл**

Комната должна открывать local replica сразу, потом сходиться с live/durable
updates до freshest shared document state.

**Что внутри**

- render local replica first;
- attach live transport;
- receive durable / live updates;
- converge by document revision/update semantics.

**Зачем нужен**

Это убирает большую часть старой snapshot arbitration logic.
Текущий `live-wins + local fallback` corridor остаётся только phase-1 bridge
state.
Этот шаг заменяет bridge behavior зрелой convergence model поверх уже
подготовленных local и durable replicas.

**Статус**

- сделано

**Шаг считается завершённым, когда**

- комната может открыть local replica сразу;
- после этого live и durable updates подтягивают room к freshest shared
  document state;
- convergence определяется document revision / update semantics;
- current `live-wins + local fallback` bridge перестаёт быть основной recovery
  моделью;
- snapshot winner-picking перестаёт быть главным recovery mechanism.

**Closure result**

- empty-live bootstrap now opens version-aware local replica first;
- empty-live settled recovery now converges per slice after provisional
  local-open;
- bootstrap read path no longer uses `room-snapshot` as a recovery source;
- committed add/remove corridors now survive same-browser reopen through local
  replica coverage;
- active-room `live-wins` behavior stays unchanged.

### Checkpoint 3. Validation before final cutover

**Смысл**

Checkpoint подтверждает, что recovery уже реально живёт через convergence, а
legacy snapshot logic больше не нужна как основной operational safety net.

**Зачем нужен**

Даёт право делать final cutover только после честного подтверждения mature
recovery behavior.

**Статус**

- сделано

### Шаг 7. Core semantic cutover from snapshot arbitration

**Смысл**

Legacy snapshot winner-picking logic перестаёт быть главной recovery model.

**Что внутри**

- replica convergence becomes the primary model;
- old fallback corridors are reduced or removed where safe;
- snapshot language stops driving core recovery semantics.

**Зачем нужен**

Именно здесь трек перехода к системе реплик считается действительно завершённым.

**Статус**

- сделано

**Что уже landed**

- visible debug/smoke contract now uses replica vocabulary:
  - `live-active`
  - `replica-converged`
  - `checkpoint`
- settled recovery inspectability now uses:
  - `Settled: ...`
  - `Settled slices: ...`
- settled runtime contract no longer stores bootstrap branch/source/local
  source as the primary recovery shape.

**Closure result**

- replica convergence is now the primary recovery model;
- source-centric settled runtime contract is removed from the core recovery
  shape;
- human gate confirmed the settled recovery contract in live, local, durable,
  and stale-snapshot-ignore corridors.

**Шаг считается завершённым, когда**

- recovery живёт через replica convergence как основную модель;
- browser-local state больше не рассматривается как отдельный fallback source;
- durable path живёт как replica path, а не как legacy competing snapshot;
- старая snapshot arbitration logic перестаёт быть core recovery logic;
- local browser snapshot as separate fallback truth больше не участвует в core
  recovery behavior;
- durable snapshot as competing source больше не участвует в core recovery
  behavior;
- ad hoc timestamp- or priority-based winner selection больше не участвует в
  core recovery behavior;

### Legacy cleanup boundary after cutover

**Смысл**

После core semantic cutover могут остаться узкие compatibility remnants.

**Что сюда относится**

- удаление больше не нужных legacy helper corridors;
- вычищение старого snapshot vocabulary из runtime paths;
- удаление оставшихся compatibility-only surfaces, когда это уже безопасно.

**Почему это вынесено отдельно**

Core semantic cutover должен быть достижим без бесконечной добивки всех
исторических хвостов.
Legacy cleanup делается после того, как новая replica model уже стала главной
recovery semantics.

## Что уже закрыто в этом треке

### Первый checkpoint новой системы реплик

`narrow commit-boundary persistence phase` дошла до
checkpoint-complete состояния.

Это означает:

- `IndexedDB` local replica работает;
- same-browser recovery работает;
- shared truth не ломается;
- migration chain ещё не завершена.

## Что intentionally deferred внутри самого replica-track

### Не нужно для закрытия migration chain

- `checkpoint + delta-log`
- поздний storage scaling path
- Figma-class local update-log engine

### Migration chain now closed through

- local replica semantics
- durable write model
- recovery convergence model
- final cutover from snapshot arbitration

## Что не входит в этот трек

### Browser-local participant identity stabilization

Это следующий runtime/product chapter.

Он важен для продукта, но не является обязательным шагом migration chain к
target memo.

### Participant-marker / creator-color follow-up

Это отдельный semantic chapter после participant identity stabilization.

Он использует результаты replica migration, но не является обязательной ступенью
самого перехода к replica model.

### Checkpoint + delta-log, если это потребуется

**Смысл**

Поздний storage upgrade поверх стабильного `IndexedDB` baseline.

**Что внутри**

- checkpoint
- append-only delta log
- compaction

**Зачем нужен**

Нужен только если full replica baseline станет слишком тяжёлой.

**Статус**

- отложено

## Короткая карта в одну строку

Приняли replica-модель, ввели commit-boundary discipline, перевели
browser-local replica в `IndexedDB`, закрыли первый recovery checkpoint, а
дальше должны пройти local replica semantics, durable write model, recovery
convergence и final cutover from snapshot arbitration.
