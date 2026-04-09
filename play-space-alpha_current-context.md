# play-space-alpha — current context / chat handoff

## 1. Current state summary

Проект остаётся в стадии `play-space-alpha`.

Основной продуктовый курс не изменился:
лёгкий board-first multiplayer play space, а не heavy VTT.

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

## 4. Current preferred next step

Следующий правильный шаг:

- сохранить working hosted core + video stack без broad cleanup;
- продолжить hosted playable-session validation;
- собирать реальные rough edges уже из рабочего hosted environment;
- только после этого решать, что действительно заслуживает следующего polish/stabilization pass.

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
