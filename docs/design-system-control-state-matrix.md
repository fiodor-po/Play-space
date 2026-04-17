# Design-System Control State Matrix

Status: working draft  
Scope: current full control-family state matrix plus current-track rollout scope

## 1. Роль документа

Этот документ фиксирует draft-матрицу для control states и variants по текущему
набору design-system families в `play-space-alpha`.

Он нужен для двух задач:

- держать один явный state vocabulary вместо локальных трактовок по consumers;
- отдельно показывать, что входит в текущий rollout track, а что остаётся на
  потом.

Этот документ не заменяет:

- [design-system-canonical-draft.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/design-system-canonical-draft.md)
- [design-system-migration-map.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/design-system-migration-map.md)

Он сжимает их state truth до practical matrix для implementation planning.

## 2. Reference baseline

Эта матрица опирается на:

- текущий repo draft:
  - [design-system-canonical-draft.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/design-system-canonical-draft.md)
  - [design-system-migration-map.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/design-system-migration-map.md)
  - [design-system-runtime-substrate-plan.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/design-system-runtime-substrate-plan.md)
- reference patterns из крупных design systems:
  - Fluent 2 button usage:
    https://fluent2.microsoft.design/components/web/react/core/button/usage
  - Carbon button style and usage:
    https://carbondesignsystem.com/components/button/style/
    https://carbondesignsystem.com/components/button/usage/
  - Carbon radio usage:
    https://carbondesignsystem.com/components/radio-button/usage/
  - Radix styling/state model:
    https://www.radix-ui.com/primitives/docs/guides/styling
    https://www.radix-ui.com/primitives/docs/components/tabs

Общий вывод по reference systems:

- ordinary controls almost always share one interaction baseline:
  - `default`
  - `hover`
  - `focus`
  - `active`
  - `disabled`
- semantic/value states живут отдельным слоем:
  - `selected`
  - `checked`
  - `open`
  - `error`
  - `warning`
  - `danger`
- not every family gets every semantic state
- state matrix should be explicit per family, not guessed per consumer

## 3. Canonical state model for this repo

### 3.1. Universal interaction states

These remain the shared baseline for ordinary interactive controls:

- `default`
- `hover`
- `focus-visible`
- `active`
- `disabled`

Working normalization note:

- repo docs currently use `focus`
- implementation planning should read that as `focus-visible` for visual state
  treatment
- keyboard-visible focus ring stays the intended surface contract

### 3.2. Semantic / value states

These apply only when the family actually needs them:

- `selected`
- `checked`
- `expanded`
- `open`
- `error`
- `warning`
- `danger`
- `loading`
- `occupied`
- `pending`
- `unavailable`
- `read-only`

Layering rule:

- final appearance = base recipe + interaction-state delta + semantic/value
  delta

## 4. Full control-family matrix

| Family | Main variants | Required interaction states | Semantic / value states | Notes |
| --- | --- | --- | --- | --- |
| Ordinary button | `primary`, `secondary`, `neutral`, `destructive`, `text`, `compact` | `default`, `hover`, `focus-visible`, `active`, `disabled` | `loading` | Base action family for ordinary shell and ops surfaces |
| Icon / floating button | icon-only, toolbar icon action, pinned action | `default`, `hover`, `focus-visible`, `active`, `disabled` | `selected`, `open`, `loading` where relevant | Includes floating board-adjacent triggers that are still ordinary controls rather than interaction exceptions |
| Board interaction button | `interactionButton.pill`, `interactionButton.circle` | `default`, `hover`, `focus-visible`, `active`, `disabled` | `selected`, `open` | Reserved board-interaction branch |
| Toggle button | ordinary toggle, icon toggle, media-panel toggle | `default`, `hover`, `focus-visible`, `active`, `disabled` | `selected`, `loading` where async is real | `selected` is required here; toggle keeps ordinary interaction states on top of selected |
| Menu / popover trigger | menu trigger, palette trigger, compact trigger | `default`, `hover`, `focus-visible`, `active`, `disabled` | `open` | Trigger stays an ordinary control; menu/popup surface is separate |
| Text field | ordinary field, compact field, password field | `default`, `hover`, `focus-visible`, `disabled` | `error`, `warning`, `read-only`, `loading` where relevant | Fields do not need a separate visual `active` state beyond caret/editing behavior |
| Textarea | ordinary multiline field, note-like admin textarea | `default`, `hover`, `focus-visible`, `disabled` | `error`, `warning`, `read-only` | Interaction-layer note edit overlay remains a special exception and is not normalized by this table |
| Checkbox | ordinary checkbox | `default`, `hover`, `focus-visible`, `active`, `disabled` | `checked`, `error`, `warning`, `read-only` | Relevant only once the repo introduces a real shared checkbox family |
| Radio | ordinary radio | `default`, `hover`, `focus-visible`, `active`, `disabled` | `checked`, `error`, `warning`, `read-only` | Same rollout note as checkbox |
| Swatch / color choice | participant color swatch, compact swatch later if needed | `default`, `hover`, `focus-visible`, `disabled` | `selected`, `occupied`, `pending`, `unavailable` | `occupied` stays explicit here because it is a real product state in room entry/session color choice |
| Tabs / segmented choice | tab trigger, segmented trigger | `default`, `hover`, `focus-visible`, `active`, `disabled` | `selected` or `active-tab` | Treat selected tab as semantic/value state on top of the ordinary trigger baseline |
| Callout / status surface | `info`, `warning`, `error`, `success` | none required at the container level | semantic variant only | Actions inside the callout use ordinary button states instead |
| Panel / shell | `panel`, `floating shell`, `inset`, `info card` | none required by default | `open` only if collapsible/toggleable | Shell families are variants and materials first, not ordinary hover/active controls |
| Data / inspection row | info row, debug row, semantics row | none required by default | `selected`, `error`, `warning` only if the row becomes stateful | Most current rows are static presentations, not interactive controls |

## 5. Family-specific implementation notes

### 5.1. Ordinary button

Keep one common interaction baseline across:

- entry CTA
- session actions
- ops actions
- compact action buttons
- text-button branch

`destructive` stays a variant, not a separate family.

### 5.2. Toggle button

Toggle is already needed by real product surfaces, especially media-panel
controls.

Required rule:

- `selected` is part of the family contract from the start
- selected toggles still support:
  - `hover`
  - `focus-visible`
  - `active`
  - `disabled`

### 5.3. Text field

Fields need a practical form-state subset:

- `default`
- `hover`
- `focus-visible`
- `disabled`
- `error`

`warning`, `read-only`, and `loading` remain real states in the full matrix, but
they are secondary rollout targets.

### 5.4. Swatch / color choice

This family needs product-specific semantic states from day one:

- `selected`
- `occupied`

Later states remain possible:

- `pending`
- `unavailable`

### 5.5. Checkbox / radio

These remain in the full matrix so the repo has one canonical state map.

They are not current rollout targets while the product still relies on native
system inputs instead of a real shared checkbox/radio family.

## 6. What this current track does

The current track is **not** the whole matrix rollout.

It covers only the families that already have immediate runtime consumers and
need explicit system rollout now:

- ordinary button
- icon / floating button
- board interaction button
- toggle button
- menu / popover trigger
- text field
- swatch / color choice

## 7. What this current track does not do

This track does not include:

- checkbox rollout
- radio rollout
- tabs / segmented rollout
- textarea family rollout
- callout/status-surface rollout
- shell/panel state rollout
- board-object interaction exceptions
- media chapter redesign

These families still stay in the full matrix so later work can reuse the same
state vocabulary.

## 8. Current rollout target by family

### 8.1. Ordinary button

Roll out now:

- `default`
- `hover`
- `focus-visible`
- `active`
- `disabled`
- `loading` only where async is real

### 8.2. Icon / floating button

Roll out now:

- `default`
- `hover`
- `focus-visible`
- `active`
- `disabled`

Optional in this track only if the consumer already needs it:

- `selected`
- `open`

### 8.3. Board interaction button

Roll out now:

- `default`
- `hover`
- `focus-visible`
- `active`
- `disabled`

Keep explicit for later consumer-driven rollout:

- `selected`
- `open`

### 8.4. Toggle button

Roll out now:

- `default`
- `hover`
- `focus-visible`
- `active`
- `disabled`
- `selected`

Optional in this track:

- `loading`

### 8.5. Menu / popover trigger

Roll out now:

- `default`
- `hover`
- `focus-visible`
- `active`
- `disabled`
- `open`

### 8.6. Text field

Roll out now:

- `default`
- `hover`
- `focus-visible`
- `disabled`
- `error`

Later if product signal appears:

- `warning`
- `read-only`
- `loading`

### 8.7. Swatch / color choice

Roll out now:

- `default`
- `hover`
- `focus-visible`
- `selected`
- `occupied`

Later only if the product needs it:

- `disabled`
- `pending`
- `unavailable`

## 9. Working rule for the next implementation pass

The next state/tokens pass should:

- use this matrix as the family-level source of truth;
- implement only the rollout subset listed in section 8;
- avoid inventing local state names in consumers;
- avoid expanding into unrelated family rollout because the matrix already names
  later families.
