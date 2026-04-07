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
- minimal capability checklist в основном собран, но hosted alpha ещё не поднят.

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

## 4. Current preferred next step

Следующий правильный шаг после doc cleanup:

- сделать read-only pre-deploy technical audit текущего alpha core;
- использовать старые refactor docs как historical baseline;
- проверить architecture health, lifecycle/order-dependent logic, deployment-readiness, observability gaps и реальные pre-deploy risks;
- после этого собрать narrow stabilization backlog;
- затем перейти к first hosted alpha deployment plan и реализации.

## 5. Current deployment direction

Предпочтительная first hosted alpha shape:

- frontend отдельно;
- long-running Node realtime/API отдельно;
- LiveKit отдельно, если видео остаётся в hosted alpha stack.

Это первый hosted alpha / staging-like environment, а не final production platform.

## 6. Important open questions

- Достаточно ли current architecture здорова для hosted alpha после small stabilization pass?
- Какие 3–5 технических риска реально мешают первому deploy?
- Входит ли video в первый hosted alpha по умолчанию или остаётся optional/toggled layer?
- Какие rough edges проявятся только после hosted playable-session checks?
- Нужен ли deeper architecture cleanup до deploy, или current state good enough after narrow stabilization?

## 7. Relevant recent checkpoints

Из известных checkpoint'ов и milestones:

- `8616f6d Checkpoint multiplayer alpha milestone`
- `1e84e7b Add durable room snapshot persistence`
- color chapter reached checkpoint-ready state
- LiveKit chapter reached technical-validation state
- dice chapter reached accepted alpha-core state

Новый hosted-alpha checkpoint пока отсутствует.

## 8. Safe intended framing for the next pass

- не новый большой capability spike;
- не broad architecture cleanup;
- не immediate long polish cycle;
- а pre-deploy technical audit и hosted-alpha preparation.

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
