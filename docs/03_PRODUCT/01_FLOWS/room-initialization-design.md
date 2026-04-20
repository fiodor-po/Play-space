# Room Initialization Design

Этот документ фиксирует каноническую связь между:

- zero-state;
- baseline / starter / demo content;
- room initialization policy.

Цель документа:

- не дать starter/demo content превратиться в bootstrap hack;
- отделить room creation policy от room recovery;
- создать чистую основу для versioned demo content в будущем.

Это не implementation plan и не final persistence-platform design.
Это narrow semantic and architectural contract.

## 1. Canonical definition of zero-state

`zero-state` в проекте означает:

- отсутствие persisted/shared board content;
- отсутствие starter objects;
- отсутствие hidden onboarding payload;
- отсутствие demo-only content;
- viewport semantics живут отдельно.

Практический смысл:

- zero-state описывает **пустую комнату**;
- zero-state не должен silently превращаться в starter content;
- empty room и demo room — не одно и то же.

Следствие:

- `EMPTY_BOARD_STATE` должен оставаться genuinely empty state, а не carrier для demo content.

## 2. Canonical definition of baseline content

`baseline content` означает:

- intentional initial content payload для комнаты;
- starter/demo/onboarding/template-like content;
- продуктовый выбор, а не memory fallback.

Baseline content:

- не является zero-state;
- не является recovery layer;
- не должен появляться как hidden side effect room bootstrap logic;
- может отличаться между demo snapshots, versions или future room templates.

Практический смысл:

- baseline content — это explicit content preset;
- не "что делать, если room somehow пустая",
- а "какой initial content policy выбрана для этой комнаты".

## 3. Canonical definition of room initialization policy

`room initialization policy` означает:

- явное правило, по которому новая комната получает initial content contract.

Эта policy должна отвечать на вопросы:

- новая комната должна стартовать empty или seeded?
- если seeded, то каким baseline?
- baseline должен быть applied один раз или нет?
- как зафиксировать, что room initialization уже произошло?

Room initialization policy:

- живёт отдельно от zero-state;
- живёт отдельно от recovery/bootstrap priority;
- должна выполняться один раз при room initialization;
- не должна повторно применяться на refresh/rejoin/recovery.

## 4. Zero-state vs baseline vs recovery

Эти слои должны оставаться разделёнными:

### A. Zero-state

- empty room
- no shared content
- no baseline content

### B. Baseline content

- optional initial content preset
- demo/starter/template payload
- may be versioned

### C. Recovery / persistence

- live shared room state
- durable room snapshot
- local fallback room snapshot

Ключевое правило:

- recovery не invents baseline content;
- baseline content не masquerades as recovery;
- zero-state не должен secretly carry baseline payload.

## 5. Should baseline content be versioned?

Да, если проект хочет:

- разные public demo snapshots;
- разные starter/demo payloads;
- future template-like room starts;
- controlled change of visible room baseline over time.

Минимальный practical rule:

- baseline content should have its own identity, например:
  - `baselineId`
  - `baselineVersion`
  - `demoSnapshotId`

Это не требует heavy migration system.
Но это требует явного признания, что baseline content — named/versioned payload, а не timeless hardcoded default.

## 6. When baseline should be applied

Baseline content должен применяться:

- только при room initialization;
- до того, как комната считается "existing room with content history";
- один раз;
- через explicit initialization decision.

Baseline content не должен применяться:

- в обычном board render path;
- в repeated bootstrap branches;
- как побочный эффект recovery fallback;
- как ad hoc patch inside `BoardStage`.

## 7. How baseline should interact with recovery, persistence, and shared slices

### A. Empty rooms

Empty room может:

- остаться empty by default;
- или быть initialized from explicit baseline policy.

Но это решение должно происходить один раз и явно.

### B. Persisted rooms

Если комната уже имеет content history:

- persisted/shared content wins;
- baseline content не re-applies.

### C. Recovered rooms

Если recovery нашёл content:

- live state wins first;
- затем durable snapshot;
- затем local fallback snapshot;
- baseline не должен конкурировать с recovered content.

### D. Shared realtime slices

Если baseline policy выбрана, baseline content должен попадать в те же shared content layers, что и normal room content.

То есть:

- tokens -> shared token slice
- images -> shared image slice
- text-cards -> shared text-card slice

Но это должно происходить через single room initialization step, а не через ad hoc local replace + extra seed patches в bootstrap loop.

## 8. Call on the current injection path

Текущий demo-card path следует считать **rejected as architecture**.

Почему:

- он смешивает baseline content с bootstrap/recovery logic;
- он помещает demo policy в sensitive `BoardStage` integration surface;
- он конфликтует с уже зафиксированным тезисом "new room is empty by default";
- он уже потребовал multiple compensating patches:
  - baseline object path
  - empty-room bootstrap insert
  - text-card seeding
  - placement fixes

Это acceptable debugging/probing path для понимания проблемы,
но не acceptable long-term model.

## 9. Minimal target model

Следующий правильный architecture model должен быть таким:

1. zero-state remains empty;
2. room initialization chooses a content policy;
3. that policy is either:
   - `empty`
   - or named baseline payload;
4. initialization records enough room-level metadata to know that it already happened;
5. baseline content, if chosen, is written once into normal shared room content;
6. after that, room bootstrap/recovery works exactly against normal room memory layers.

## 10. Recommended first narrow implementation slice after docs

Первый implementation slice после этого doc должен быть narrow:

1. introduce a small room-baseline descriptor
   - for example:
     - `empty`
     - `public-demo-v1`

2. add one room-level initialization decision point
   - outside generic `BoardStage` bootstrap loops

3. persist one small room-level initialization fact
   - enough to know:
     - whether initialization already happened
     - which baseline, if any, was used

4. apply baseline once into shared room content
   - through the normal room content model

5. keep current recovery priority unchanged
   - live
   - durable
   - local
   - empty

This is the smallest implementation path that is:

- compatible with current docs;
- compatible with future versioned demo snapshots;
- cleaner than continuing the current injection patches.
