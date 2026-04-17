# Participant-Color Tokenization Draft

Статус: draft for discussion inside the active `UI controls polish` chapter.

Этот документ фиксирует текущую рабочую модель для `participant-color tokenization`.
Модель ещё требует обсуждения и может меняться до implementation pass.

## 1. Цель

Собрать participant colors в честный token layer и перестать держать их как
raw palette плюс частные accent overrides в control recipes.

Ожидаемый результат:

- participant colors становятся каноническими palette slots;
- local-user controls читают один shared tokenized path;
- visual polish дальше идёт поверх этой базы, а не поверх ad hoc accent
  overrides.

## 2. Текущий problem statement

Сейчас participant colors читаются так:

- есть raw palette of 8 participant colors;
- current participant-accent controls используют special override path;
- swatch readability и participant-accent control polish упираются в то, что
  participant color layer ещё не собран как системный token model.

Это делает visual polish слишком зависимым от частных control paths.

## 3. Current proposed model

### 3.1. Palette slots, not hue names

Участники не должны жить в token model как `teal`, `blue`, `orange` и так
далее.

Текущая предложенная модель использует palette slots:

- `participant-color-1`
- `participant-color-2`
- `participant-color-3`
- `participant-color-4`
- `participant-color-5`
- `participant-color-6`
- `participant-color-7`
- `participant-color-8`

Причина:

- slot names stable;
- semantic model не зависит от конкретного hue name;
- later palette tuning не ломает token naming.

### 3.2. One active local-user control set

Controls не должны читать 8 parallel button families.

Текущая предложенная модель:

- есть 8 participant palette slots;
- есть один active `local-user` control token set;
- current participant selection simply points that `local-user` set at one of
  the 8 palette slots.

То есть controls читают не:

- `button-participant-color-1`
- `button-participant-color-2`
- `button-participant-color-3`

как отдельные recipe families,

а один shared branch:

- `button-local-user-*`

который в текущем runtime связан с выбранным `participant-color-N`.

## 4. Proposed token structure

### 4.1. Palette layer

Participant-color layer должен начинаться с базового accent set на каждый
palette slot, а не с полного control-state matrix.

Текущий proposed set для каждого `participant-color-N`:

- `--ui-participant-color-1-surface-default`
- `--ui-participant-color-1-surface-hover`
- `--ui-participant-color-1-surface-active`
- `--ui-participant-color-1-border-default`
- `--ui-participant-color-1-text-default`

Та же структура затем повторяется для:

- `participant-color-2`
- `participant-color-3`
- `participant-color-4`
- `participant-color-5`
- `participant-color-6`
- `participant-color-7`
- `participant-color-8`

То есть palette layer сейчас proposed как набор из 5 токенов на слот:

- 3 surface tokens
- 1 border token
- 1 text token

### 4.2. Active local-user control layer

Этот слой читает current chosen participant-color slot и уже выше него
собирает полный control behavior.

Черновой naming direction:

- `--ui-button-local-user-surface-default`
- `--ui-button-local-user-surface-hover`
- `--ui-button-local-user-surface-active`
- `--ui-button-local-user-surface-selected`
- `--ui-button-local-user-surface-selected-hover`
- `--ui-button-local-user-surface-selected-active`
- `--ui-button-local-user-surface-open`
- `--ui-button-local-user-surface-open-hover`
- `--ui-button-local-user-surface-open-active`

и соответствующие branches для:

- `border`
- `text`

Этот слой:

- не invents new colors;
- ссылается на current chosen participant-color slot;
- owns full control-state behavior above the 5-token participant-color base
  set.

## 5. Current state coverage proposal

Текущий proposed coverage now splits into two layers.

### Participant-color base set

На palette layer каждый slot currently needs only:

- `default`
- `hover`
- `active`

for `surface`,

plus:

- `default`

for `border` and `text`.

### Control-level state behavior

Full state behavior sits above that base set on the local-user control layer.

Current proposed control-level coverage:

- `default`
- `hover`
- `active`
- `selected`
- `selected-hover`
- `selected-active`
- `open`
- `open-hover`
- `open-active`

### Shared treatment states

Current proposed policy:

- `disabled`
- `loading`

не живут как отдельные participant-derived palette branches.

Они должны оставаться shared system treatments.

Current loading rule for this draft:

- `loading` should not switch the control into a separate color identity;
- `loading` should reuse the pressed/active color path for the control;
- `loading` text may later tune toward `disabled`, but the current draft keeps
  it on the `default` text path until a later visual tuning decision.

Это пока draft policy, но сейчас она выглядит самым чистым направлением.

## 6. Current implementation target

Первый implementation target не должен строить general model for every possible
future control.

Текущий recommended scope:

- только current control patterns, которые уже реально существуют;
- current local-user `primary fill` path;
- current local-user `secondary border` path.

Это удерживает slice narrow и implementation-safe.

## 7. Current chapter order

Текущий agreed order внутри `UI controls polish`:

1. docs/model slice
2. short audit against current real consumers
3. foundation/token implementation
4. migration of current participant-accent control path
5. gap pass for what the model did not cover
6. then visual polish slices:
   - participant-accent control polish
   - swatch readability
   - token/state tuning

## 8. Questions still open

Эти вопросы пока не закрыты:

1. Is `local-user` the right final name for the active control layer?
2. Should the active local-user token set exist only for `button`, or should
   the draft already reserve room for other local-user control families?
3. Which inspectability surface should expose the current mapping:
   - sandbox only
   - sandbox plus Dev tools
   - sandbox first, Dev tools later?

## 9. Non-goals for this slice

Этот docs/model slice не должен:

- retune the current palette by hand;
- solve swatch readability directly;
- solve broad participant-accent control polish directly;
- redesign the whole color model for the room;
- broaden into themes/settings work.

## 10. Current recommendation

Текущая recommended direction:

- accept palette slots `participant-color-1..8`;
- accept a 5-token base accent set per participant-color slot:
  - `surface.default`
  - `surface.hover`
  - `surface.active`
  - `border.default`
  - `text.default`
- accept one active `local-user` control token set;
- keep full `selected/open/...` behavior on the control layer, not on the
  palette layer;
- document the model first;
- run a short audit after the model is written;
- only then land the token foundation and migrate current control paths.
