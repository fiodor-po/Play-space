# Doc System Rules

Этот документ задаёт рабочие правила для структуры документации в `play-space-alpha`.

## 1. Главные входные точки

- root [`README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/README.md) остаётся входной точкой для людей;
- root [`AGENTS.md`](/Users/fedorpodrezov/Developer/play-space-alpha/AGENTS.md) остаётся входной точкой для tooling, repo guardrails и agent workflow;
- [`docs/README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/README.md) остаётся картой всего `docs/`;
- этот файл фиксирует правила слоёв, naming и chapter lifecycle.

## 2. Роли слоёв

### `docs/00_AGENT_OS/`

Здесь живут agent-operating docs:

- current handoff context;
- ExecPlan rules;
- executor quickstart;
- сама система документации.

Здесь не хранить:

- product truth;
- architecture truth;
- dated audits;
- task briefs и execplans.

### `docs/01_CURRENT_STATE/`

Здесь живут live control docs:

- roadmap;
- backlog;
- review follow-ups;
- active chapters.

Здесь хранить только текущий рабочий слой.
Historical checkpoints и закрытые chapter bundles сюда не класть.

### `docs/02_DECISIONS_LOG/`

Здесь живёт накопительная project memory:

- case-study;
- durable decision history;
- milestone and workflow memory.

Это слой долгой памяти, а не current planning control.

### `docs/03_PRODUCT/`

Здесь живёт продуктовая truth layer:

- product overview;
- user flows;
- semantic models;
- interface-system docs.

Если документ отвечает на вопрос "как должен вести себя продукт", он обычно
принадлежит сюда.

### `docs/04_ARCHITECTURE/`

Здесь живёт архитектурная truth layer:

- runtime map;
- layer map;
- persistence / sync;
- governance;
- contracts and data-flow understanding.

Если документ отвечает на вопрос "как система устроена и на какие слои
распадается", он обычно принадлежит сюда.

### `docs/05_OPERATIONS_AND_VALIDATION/`

Здесь живут operational docs:

- local-dev workflows;
- deploy docs;
- QA/smoke runbooks;
- validation procedures.

Этот слой отвечает на вопрос "как запускать, проверять и сопровождать".

### `docs/06_EXECUTION/`

Здесь живут execution artifacts:

- plans;
- execplans;
- task briefs;
- templates.

Это рабочие артефакты выполнения.
Они не заменяют canonical product или architecture docs.

### `docs/90_ARCHIVE/`

Здесь живёт исторический слой:

- dated audits;
- historical baselines;
- closed chapter bundles;
- superseded drafts.

Current truth здесь не хранить.

## 3. Правило canonical current doc

Один topic должен иметь один основной current doc.

Рабочая норма:

- product truth не дублировать в chapter doc;
- architecture truth не дублировать в roadmap;
- operational procedure не дублировать в product spec;
- dated audit не делать главным current source без отдельного решения.

Если topic уже имеет canonical doc, новый файл должен:

- либо расширять существующий doc;
- либо явно быть audit / memo / chapter / draft;
- либо заменить canonical doc вместе с обновлением ссылок.

## 4. Active chapter rules

`Active chapter` — это operational control layer.

Chapter doc отвечает на вопрос:

- что сейчас делаем;
- в каком порядке;
- что входит в scope;
- что не входит в scope;
- по каким acceptance rules двигаться.

Chapter doc не должен быть главным местом для:

- долгой product truth;
- долгой architecture truth;
- historical storage после closure.

Для active chapters использовать только:

- `docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/<chapter>/CHAPTER.md`
- `docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/<chapter>/AUDITS/`
- `docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/<chapter>/NOTES/`

## 5. Chapter lifecycle

### Когда открывать chapter folder

Создавать chapter folder, когда работа:

- идёт серией slices;
- имеет явный scope и stop conditions;
- требует отдельного operational control file для агентов;
- будет порождать связанные audits или notes.

### Что хранить в `CHAPTER.md`

`CHAPTER.md` хранит:

- chapter goal;
- scope;
- out-of-scope;
- current sequence;
- acceptance direction;
- references to canonical product / architecture docs.

### Что хранить в `AUDITS/`

В `AUDITS/` хранить только chapter-local dated analyses:

- checkpoint audits;
- comparative audits;
- read-only analysis notes, которые реально поддерживают текущий active chapter.

### Что хранить в `NOTES/`

В `NOTES/` хранить короткие рабочие заметки, если они действительно нужны
между slices.

### Когда chapter bundle переезжает в archive

После closure chapter:

- chapter folder больше не остаётся в `01_CURRENT_STATE/`;
- весь bundle переезжает в `docs/90_ARCHIVE/03_CLOSED_CHAPTERS/<chapter>/`;
- roadmap и current-context должны ссылаться уже на archived bundle или на новый
  active chapter.

Если dated audit не относится к живому active chapter, его сразу класть в
`docs/90_ARCHIVE/01_AUDITS/`.

## 6. Design-system / interface-system rule

Design-system cluster считается частью product/interface-system layer.

Для него использовать:

- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/00_RULES/`
- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/01_AUDITS/`
- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/02_CANON/`
- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/`

Этот cluster не считать отдельным top-level world и не смешивать с runtime
architecture docs без явной причины.

## 7. Naming rules

Использовать английские file names и folder names.

Правила:

- для canonical docs использовать short stable names;
- для dated checkpoints использовать `YYYY-MM-DD` в имени;
- `CHAPTER.md` использовать только внутри chapter folder;
- `README.md` использовать как index и rule file на уровне folder;
- не создавать новые top-level files в `docs/`, если документ уже имеет
  понятный bucket.

## 8. Когда использовать dated files

Dated file уместен, когда это:

- audit;
- checkpoint;
- review snapshot;
- one-off analysis note, который не является permanent canonical truth.

Dated file не нужен для:

- stable product spec;
- stable architecture doc;
- stable runbook;
- stable rules doc.

## 8.1. Лёгкое правило для `draft` / `audit` / `memo` / `plan`

Внутри `docs/03_PRODUCT/` и `docs/04_ARCHITECTURE/` такие документы можно
оставлять рядом с тематическим current cluster, если выполняются все условия:

- они поддерживают тот же topic;
- они реально используются как supporting material;
- по имени файла видно, что это не canonical truth;
- ближайший `README.md` не притворяется, что это главный current source.

Рабочее решение по умолчанию:

- `spec` и `design` могут жить в product/architecture layer как working source;
- `draft`, `memo`, `audit`, `plan`, `map` можно держать рядом как supporting
  docs;
- когда supporting doc перестаёт быть живым reference, его переносить в
  `docs/90_ARCHIVE/`.

## 9. Что обновлять после заметной doc migration

После заметной миграции или появления нового canonical doc обновлять:

- [`docs/README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/README.md)
- соответствующий bucket `README.md`
- root [`README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/README.md), если изменился human entry path
- root [`AGENTS.md`](/Users/fedorpodrezov/Developer/play-space-alpha/AGENTS.md), если изменился agent entry path
- active roadmap/current-context, если они ссылаются на moved file

## 10. Практическое решение по умолчанию

Если непонятно, куда класть новый документ, решать по такой последовательности:

1. это current control doc или chapter control doc;
2. это product truth;
3. это architecture truth;
4. это operational runbook or validation doc;
5. это execution artifact;
6. это historical or dated artifact.

Если ответ всё ещё неочевиден, сначала не создавать новый слой, а выбрать
существующий bucket и зафиксировать решение ссылкой из ближайшего `README.md`.
