# Room Loading Progress And Async-State Chapter

Этот chapter теперь решает более крупную задачу: сделать `room open`
наблюдаемым, диагностируемым и пригодным для робастной recovery-логики.

## Что решаем

`Room open` уже состоит из нескольких async corridor'ов:

- join / room activation;
- shared transport attach;
- shared initial sync;
- local replica read;
- durable snapshot read;
- bootstrap decision;
- `scene usable`;
- settled room state.

Сейчас эти corridor'ы существуют в runtime, но слабо читаются как единый
pipeline. Поэтому:

- delayed path выглядит как случайное поведение;
- broken path трудно быстро локализовать;
- user-facing status легко начинает врать, если строится на слабых внутренних
  сигналах.

## Что должно получиться

Нужен room-open pipeline с inspectability на уровне крупных фаз.

Для каждой фазы нужно уметь видеть:

- started;
- ready;
- missing / waiting;
- failed / unavailable;
- skipped, если это уже реально отражено текущей runtime semantics.

Первый safe результат chapter:

- compact phase model для room open;
- room-scoped debug / inspectability surface;
- phase-level reason strings или log tags для диагностики;
- без новой recovery semantics и без таймаутов как самостоятельного основания
  для room-open outcome.

User-facing loading / recovery messaging остаётся later layer поверх этой
inspectability model.

## Что не делаем первым шагом

- не начинаем chapter с loading text;
- не строим warning / degraded UI на transient error signals;
- не разрешаем timeout как основание для открытия комнаты;
- не делаем offline/local-recovery special handling до появления надёжной
  inspectability baseline;
- не меняем bootstrap / recovery semantics в первом slice.

## Рабочий порядок

1. собрать room-open phase model из уже существующих runtime signals;
2. вывести phase states в текущий debug / inspectability surface;
3. проверить, что broken corridor можно быстро локализовать по room-scoped
   состояниям и логам;
4. только потом решать, какой минимальный user-facing status можно безопасно
   строить поверх этой модели;
5. только после этого возвращаться к local-recovery visibility, degraded
   messaging и другим async-state polish slices.

## На что смотреть сначала

- `src/components/BoardStage.tsx`
- `src/board/viewModels/boardStageInspectability.ts`
- текущий debug / inspectability path в Dev tools
- `docs/ARCHITECTURE.md`
- `docs/manual-qa-runbook.md`
- `ROADMAP.md`
- `play-space-alpha_current-context.md`

## Что проверить после каждого заметного slice

- `npm run build`
- fresh room open
- broken transport или stopped backend path, если его можно безопасно
  воспроизвести
- room-scoped inspectability values для открывающейся комнаты
- отсутствие semantic drift в ordinary room-open behavior

## Later slices внутри chapter

- минимальный user-facing status для ordinary room open;
- local-recovery visibility при жёстком room-scoped основании;
- degraded / warning semantics только на terminal outcome;
- room-open polish для других delayed surfaces.

## Open follow-ups вне этого chapter

- `Safari first-open room recovery`
- `Mobile text-card editing`
- `Mobile drawing`
