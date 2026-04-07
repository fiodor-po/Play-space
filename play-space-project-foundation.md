# Play Space / "FigJam for entertainment" — project foundation

Этот файл — основная рамка проекта.

Его задача:

- хранить стабильное описание продукта;
- фиксировать продуктовые принципы и архитектурный курс;
- задавать рабочие правила для ChatGPT / Codex;
- описывать систему проектной документации;
- задавать ритуал рефлексии, который позже поможет собрать case study.

Этот файл обновляется редко.
Оперативное состояние проекта живёт отдельно в current-context файле.
История решений, багов, milestones и AI-workflow живёт отдельно в case-study log.

---

## 1. Что это за проект

Проект — это **лёгкая совместная виртуальная среда для онлайн-развлечений**, в первую очередь для ролевых и игровых сессий в духе D&D.

Рабочая формулировка:

> **"FigJam for entertainment"** — лёгкая онлайн-платформа для совместных игровых и ролевых сессий, построенная вокруг большой общей доски, на которой участники могут размещать изображения, двигать токены, рисовать, использовать 3D-кубики и при необходимости общаться через встроенный media layer, с фокусом на простоту, мгновенный вход в сессию, минимальный интерфейс и естественное взаимодействие через drag-and-drop.

Ключевая идея:

- это **не тяжёлый VTT**;
- это **не rules engine**;
- это **shared play space** с визуальным, совместным, быстрым входом.

---

## 2. Продуктовые принципы

Основные принципы проекта:

1. **Board-first**
   - главный объект продукта — общая большая доска;
   - не сцены как основная метафора, не панели, не правила, а пространство взаимодействия.

2. **Drag-and-drop first**
   - почти все основные действия происходят прямо на доске;
   - минимум вспомогательных панелей и скрытых настроек.

3. **Сверхлёгкий вход**
   - пользователь должен зайти и начать пользоваться без отдельного онбординга.

4. **Multiplayer-first**
   - совместность — часть сути продукта, а не надстройка "когда-нибудь потом".

5. **Визуальная идентичность участников**
   - у каждого участника есть цвет;
   - этот цвет маркирует человека и его действия.

6. **Не VTT-heavy**
   - продукт не должен превращаться в тяжёлую tabletop-систему с глубокой автоматизацией правил.

7. **Practical playable-session bias**
   - если есть выбор между абстрактно красивой архитектурой и более быстрым выходом к реальной playable session, предпочтение отдаётся более практичному пути при сохранении безопасности изменений.

---

## 3. Зафиксированные продуктовые решения

### 3.1. Доска
- В первой серьёзной версии доска не обязана быть математически бесконечной.
- Достаточно очень большой доски, которой хватает для игровой сессии.

### 3.2. Модель взаимодействия
- Все участники могут двигать всё.
- На старте нет ролей, permissions и owner-only редактирования.
- Это shared space, а не master-controlled tabletop.

### 3.3. Базовые сущности продукта
На старте зафиксирован такой список сущностей:

- `room`
- `participant`
- `board`
- `image`
- `token`
- `drawing`
- `text`
- `dice`

### 3.4. Цвет участника
Цвет относится и к человеку, и к его объектам/действиям.

На старте один цвет участника маркирует:

- курсор;
- selection/manipulation cues;
- рисунки;
- creator-linked объекты;
- другие визуальные следы действий.

### 3.5. Кубики
- 3D-кубики считаются важной частью продукта;
- authoritative shared 3D dice уже приняты как часть alpha core;
- кубики должны оставаться narrow layer, а не превращаться в rules platform.

### 3.6. Видео
- видеосвязь важна, но в alpha допустима как узкая встроенная интеграция, а не отдельная media platform;
- narrow LiveKit-based layer уже подтверждён как технически жизнеспособный;
- polished conferencing UX не является обязательным условием первого hosted alpha.

### 3.7. Критерий успеха продукта
Продукт считается действительно полезным, когда:

- на нём можно провести полную игровую сессию;
- автор проекта предпочитает его текущим кастомным обходным решениям;
- hosted alpha даёт реальный product signal, а не только local-dev comfort.

---

## 4. Текущая стадия проекта

Проект находится на стадии **`play-space-alpha`**.

Важно:

- exploratory single-user MVP уже был сделан раньше в репозитории `dnd-board-mvp`;
- он остаётся reference prototype;
- основной рабочий трек сейчас — отдельный alpha-проект рядом, а не продолжение старого MVP.

`play-space-alpha` теперь лучше описывать не просто как multiplayer-first board foundation, а как **board-first multiplayer alpha with core session layers assembled**.

Детальный оперативный статус не хранится в этом файле.
Для него используется отдельный current-context файл.

---

## 5. Release framing

### 5.1. First hosted alpha

В первом hosted alpha целимся в:

- одну или несколько комнат по ссылке;
- имя и цвет участника;
- большую общую доску;
- несколько участников одновременно;
- курсоры участников;
- изображения;
- токены;
- text-cards;
- рисование;
- realtime-синхронизацию;
- best-effort durable room recovery;
- authoritative shared 3D dice;
- optional built-in video layer, если он включён в конкретный alpha stack.

Это не production release.
Это первый hosted environment для реальной проверки продукта.

### 5.2. Что не обязано быть готово к first hosted alpha

- polished conferencing UX;
- advanced dice features;
- music / ambient audio;
- scenes;
- permissions / roles;
- heavy history / undo;
- production-grade infra hardening;
- fine-grained observability platform;
- broad architecture cleanup.

### 5.3. Следующий слой после first hosted alpha
После первого hosted alpha главными кандидатами становятся:

- hosted-session validation;
- UI/UX polish;
- coherence cleanup;
- more trustworthy support / debug ergonomics;
- выбор, какие capability layers действительно оправдано углублять дальше.

---

## 6. Архитектурное направление

### 6.1. Архитектурная цель
Строить board-first multiplayer architecture, которая остаётся достаточно лёгкой для быстрых продуктовых итераций.

### 6.2. Основные слои

#### A. Room / session layer
Отвечает за:

- комнату;
- вход по ссылке;
- участника;
- цвет участника;
- присутствие.

#### B. Board domain layer
Отвечает за:

- общую доску;
- объекты на доске;
- операции с объектами.

#### C. Viewport / navigation layer
Отвечает за:

- pan;
- zoom;
- координатную систему;
- selection / interaction model.

#### D. Rendering layer
Планируемый стек:

- `Konva`
- `react-konva`

#### E. Sync / realtime layer
Основной курс:

- `Yjs`
- `y-websocket`

#### F. Persistence layer
Общая room persistence мыслится как **room-level state**, а не как персональный local cache клиента.

Важно:

- durable room snapshot layer уже существует как best-effort alpha base;
- local snapshots остаются fallback/resilience layer;
- финальная collaborative durable model пока сознательно не overbuild’ится.

#### G. Integrations layer
Слой интеграций уже частично реален:

- built-in video;
- 3D dice;
- later media/audio.

---

## 7. Почему выбран React + Konva, а не tldraw

Были рассмотрены два серьёзных направления.

### Вариант 1. SDK-путь / tldraw
Плюсы:

- быстрее получить shared board alpha;
- быстрее дойти до multiplayer wow-effect;
- уже есть готовая infinite-canvas модель.

Минусы:

- выше зависимость от чужой board-модели;
- больше риск подгонять продукт под SDK;
- тяжелее строить именно свой gameplay-oriented UX.

### Вариант 2. React + Konva
Плюсы:

- больше контроль над объектной моделью и UX;
- лучше подходит под долгосрочную собственную архитектуру;
- лучше совпадает с идеей board-first play space.

Минусы:

- дольше путь до первой multiplayer-магии;
- нужно самому собирать selection, viewport, room state и realtime-модель.

### Принятое решение
Выбран **React + Konva** как основной курс для `play-space-alpha`.

---

## 8. Технологический стек и инструменты

### Основа
- React
- TypeScript
- Vite

### Доска / рендеринг
- `konva`
- `react-konva`

### Синхронизация / realtime
- `Yjs`
- `y-websocket`

### Интеграции
- LiveKit
- `@3d-dice/dice-box-threejs`

### Разработка и инфраструктура
- Git
- GitHub
- VS Code
- Node.js LTS
- npm
- Vercel для frontend-hosting candidates
- long-running host / VPS for realtime/API candidates

### AI workflow
- ChatGPT / strategist chat — для product/architecture решений, framing, анализа, prompt design и logging
- Codex / executor chat — для engineering execution, targeted audits, instrumentation, build/test loops и code changes

---

## 9. Рабочая модель strategist / executor

### 9.1. Разделение ролей

**Strategist chat** используется для:

- product thinking;
- декомпозиции задач;
- выбора безопасного следующего шага;
- формулирования промптов для executor chat;
- read-only анализа и framing;
- фиксации решений и журналирования.

**Executor chat** используется для:

- точечных code changes;
- instrumentation;
- targeted debugging;
- build/test runs;
- narrow implementation passes.

### 9.2. Предпочтительный паттерн работы

Если задача затрагивает interaction model, product semantics, deployment topology или неясную архитектурную развилку, сначала делается:

1. read-only analysis;
2. описание текущего механизма;
3. формулировка целевой модели;
4. только потом implementation prompt.

Если задача уже ясна и рамка определена, допустим сразу implementation pass.

### 9.3. Чего избегать

- broad rewrites без чёткой рамки;
- "перепиши всё" вместо phased changes;
- смешивания product questions и code surgery в одном слишком широком промпте;
- потери истории решений между чатами;
- магической надежды на общую память чатов вместо дисциплины документации и handoff.

---

## 10. Система проектной документации

В проекте используются несколько типов markdown-файлов с разными ролями.

### 10.1. Foundation file
Содержит:

- стабильную рамку проекта;
- продуктовые принципы;
- архитектурный курс;
- постоянные рабочие правила.

Обновляется редко.

### 10.2. Current context file
Используется для переноса контекста из чата в чат.

Содержит:

- summary текущего состояния;
- summary последней сессии;
- следующий рабочий шаг;
- последние 3 сообщения в почти чистом виде.

### 10.3. Case study log
Используется как накопительный журнал:

- решений;
- milestones;
- багов и расследований;
- product/engineering lessons;
- workflow lessons о работе человека и AI.

### 10.4. Roadmap
`ROADMAP.md` хранит:

- текущий активный этап;
- приоритеты;
- backlog;
- open questions;
- decision log.

Это главный живой управляющий план проекта.

### 10.5. Focused docs
Документы в `docs/` делятся на:

- canonical focused docs — по текущим смысловым слоям и workflow;
- runbooks / checklists — для execution и QA;
- historical baseline docs — для архива решений и старых planning frames.

---

## 11. Ritual of reflection / case study protocol

Чтобы later собрать полноценный case study, работа над проектом должна сопровождаться не только кодом и коммитами, но и короткой регулярной рефлексией по ключевым решениям, ошибкам и сдвигам в понимании продукта.

Это не документация ради документации, а рабочий ритуал, который помогает:

- не терять логику принятых решений;
- видеть, как меняется продуктовая модель;
- фиксировать реальные инженерные уроки;
- сохранять материал для будущего case study без необходимости потом восстанавливать всё по памяти.

### 11.1. Когда делать запись
Короткая запись должна появляться после любого заметного шага, например:

- после нового продуктового решения;
- после архитектурного выбора;
- после завершения milestone;
- после сложного бага и его расследования;
- после неудачной гипотезы или отката;
- после integration spike;
- после изменения interaction model;
- после важного изменения в AI workflow.

### 11.2. Что именно фиксировать
Каждая запись должна отвечать не только на вопрос "что сделали", но и на вопросы:

- что мы пытались получить;
- какой риск или проблема возникли;
- какие варианты рассматривались;
- что было выбрано;
- почему это решение показалось правильным на тот момент;
- что это изменило в продукте или архитектуре;
- какие ограничения остались открытыми.

### 11.3. Особое правило для этого проекта
Case study log должен фиксировать не только продуктовые и инженерные изменения, но и сам процесс работы человека с AI:

- как распределялись роли между strategist и executor;
- как формулировались задачи;
- какие форматы взаимодействия оказывались удачными или неудачными;
- какие workflow-решения улучшали скорость, качество и управляемость проекта.

---

## 12. Logging heuristic

Шаг должен попадать в case study log, если он включает хотя бы одно из следующего:

- новое продуктовое решение;
- архитектурный выбор;
- milestone;
- серьёзный баг и его расследование;
- неудачную гипотезу или rollback;
- integration spike;
- изменение interaction model;
- важный вывод о границах текущей архитектуры;
- важное изменение в AI workflow.

### Output discipline
- Foundation file: почти статичный.
- Current context file: короткий и утилитарный.
- Case study log: накопительный, хронологический, пригодный для будущего narrative.
- Roadmap: живой план и priority map.

---

## 13. Самый короткий resume-блок

```md
У меня есть проект "FigJam for entertainment" — лёгкая multiplayer-доска для онлайн-развлечений и ролевых сессий. Это не heavy VTT, а shared play space с большой общей доской, drag-and-drop-first UX, минимальным интерфейсом и визуальной идентичностью участников через цвет.

Сейчас основной проект — `play-space-alpha`: board-first multiplayer alpha на React + TypeScript + Vite + Konva/react-konva, с best-effort durable room recovery, accepted shared 3D dice layer и technically validated built-in video path. ChatGPT / strategist chat используется для product/architecture решений, framing, анализа и prompt design; Codex / executor chat — для инженерной реализации, targeted audits и code changes.

В проекте используются:
- foundation file — стабильная рамка проекта;
- roadmap — живой план и backlog;
- current context file — handoff между чатами;
- case study log — накопительный журнал решений, багов, milestones и AI workflow lessons.

Если задача затрагивает interaction model, deployment topology или неясную продуктовую семантику, сначала нужен read-only analysis pass, а не сразу implementation.
```
