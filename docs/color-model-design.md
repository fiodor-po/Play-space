# Color Model Design — play-space-alpha

Статус: canonical semantic spec  
Область: participant color, object color semantics, live interaction color semantics  
Этот документ задаёт целевую семантику цвета в `play-space-alpha`.

## 1. Зачем нужен этот документ

В проекте цвет используется как важная часть multiplayer readability и visual identity участников.  
При этом цвет не должен случайно смешивать разные смыслы: кто это, кто создал объект, кто действует сейчас, и какой у объекта собственный стиль.

Этот документ фиксирует каноническую цветовую модель, чтобы implementation changes не расползались семантически.

## 2. Основные термины

### PlayerColor
Текущий живой identity color участника в комнате.

`PlayerColor` отвечает на вопрос:

> каким цветом система показывает этого участника прямо сейчас?

### Creator affiliation
Визуальная связь объекта с участником, который его создал.

Это **не ownership** в смысле прав.  
Это не означает private control, edit lock или особые permissions.

### Actor-colored interaction
Временная визуальная подсветка, показывающая, **кто действует сейчас**.

Примеры:
- drag outline
- resize outline / handles
- live manipulation highlight
- selection/manipulation feedback
- drawing interaction cues

### Neutral shared object
Общий объект пространства, который не должен выглядеть как “чей-то” в обычном UI.

## 3. Базовые правила

### Rule 1 — PlayerColor is live identity
У каждого участника есть текущий `PlayerColor`.

Он используется как live identity color для:
- cursor / presence
- participant labels
- live interaction hints
- active manipulation feedback

### Rule 2 — Цвет не означает права
Ни один цветовой сигнал сам по себе не означает:
- владение объектом в permission sense
- эксклюзивное право редактирования
- запрет на действия других участников

Проект остаётся shared space без owner-only semantics.

### Rule 3 — Нужно разделять creator-link и current actor
Нужно различать:
- с кем объект визуально аффилирован
- кто действует с ним прямо сейчас

Это разные слои.

### Rule 4 — Live action color always comes from the current actor
Если участник прямо сейчас совершает действие, временная визуальная обратная связь должна использовать цвет **текущего актора**, а не цвет создателя объекта.

### Rule 5 — Не все объекты обязаны быть creator-colored
Некоторые объекты визуально связаны с создателем.  
Некоторые остаются нейтральными shared objects.

### Rule 6 — Для creator-linked объектов используется live-linked color
Если объект относится к creator-linked категории, его creator-linked visual color должен определяться от **текущего `PlayerColor` создателя**, а не от исторического snapshot цвета на момент создания.

Это сознательно выбранная модель.

### Rule 7 — Persisted objects should not store historical creator color as canonical truth
Для creator-linked объектов persisted/shared object model не должен делать
исторический `authorColor` канонической частью semantic truth.

Правильная модель такая:

- объект хранит `creatorId` / `authorId`
- participant layer хранит текущее соответствие:
  - `participantId -> current PlayerColor`
- UI резолвит creator-linked color через текущий participant color этого id

Это значит:

- historical creator-color snapshot не должен считаться canonical object truth
- object rendering не должен зависеть от "цвета автора в момент создания" как от
  целевого steady state
- если в рантайме ещё существует `authorColor`, его нужно трактовать как
  transitional implementation residue, а не как каноническую semantic model

## 4. Категории объектов

## 4.1. Creator-linked objects

Сейчас к ним относятся:
- token
- text-card

### Token
Token — creator-linked object.

Семантика:
- токен визуально аффилирован с участником, который его создал
- основной creator-linked цвет токена определяется через текущий `PlayerColor` создателя
- если создатель меняет свой `PlayerColor`, creator-linked визуальный цвет токена тоже обновляется
- persisted token truth должна хранить `creatorId`, а не baked-in historical color

Current implementation gap that remains explicitly deferred:
- refresh/leave wrong-color behavior comes from fallback to token-local stored `fill` after live creator-color resolution disappears
- this fallback path exposes a real semantic/runtime gap rather than a cosmetic rendering issue
- the system still has no honest shared non-live current color source by `creatorId`
- this follow-up belongs to a later participant-marker / creator-color chapter
- analysis note: [creator-color-fallback-analysis-2026-04-14.md](./creator-color-fallback-analysis-2026-04-14.md)

### Text-card
Text-card — creator-linked object, но не fully color-themed object.

Семантика:
- карточка остаётся в основном нейтральной
- creator-linked color используется только как accent
- accent определяется через текущий `PlayerColor` создателя
- body карточки не должен автоматически становиться participant-colored
- persisted text-card truth должна хранить `creatorId`, а не historical creator color

Это значит:
- visual affiliation есть
- но card body не превращается в шумный personal color block

## 4.2. Neutral shared objects

Сейчас к ним относятся:
- image

### Image
Image — neutral shared object.

Семантика:
- картинка не должна в обычном rendering выглядеть как объект конкретного участника
- у картинки может существовать metadata о создателе
- но normal rendering не должен использовать creator color как базовый visual identity layer

## 5. Live interaction semantics

## 5.1. Cursor / presence
Для cursor / presence цвет всегда означает:
- кто это сейчас

Источник цвета:
- текущий `PlayerColor` участника

Это live-only identity layer.

## 5.2. Selection / drag / resize / manipulation
Для selection и active manipulation цвет всегда означает:
- кто действует сейчас

Источник цвета:
- текущий `PlayerColor` актора

Это actor-colored ephemeral feedback.

Примеры:
- я двигаю чужой токен → outline моего цвета
- я ресайжу чужую text-card → handles / outline моего цвета
- я взаимодействую с image → live feedback моего цвета

После завершения действия этот слой не должен оставаться как persistent object style.

## 5.3. Locks / live previews / realtime cues
Любые lock-like или preview-like interaction cues должны кодировать:
- текущего актора
- а не исторического создателя объекта

Если UI показывает текущее действие, он должен использовать actor color, а не creator-linked color.

## 6. Drawing semantics

Drawing нужно понимать отдельно от object body styling.

### Target direction
Рисование должно следовать общей live-linked participant model:
- stroke аффилирован с участником, который его создал
- stroke color ideally определяется через текущий `PlayerColor` этого участника
- при смене `PlayerColor` участника stroke color в идеальной модели тоже может обновляться

### Transitional note
Если полная live-linked model для strokes окажется дорогой или рискованной на ближайшем implementation pass, допустимо временно оставить historical stroke color behavior.

Но это считается переходным компромиссом, а не конечной semantic target model.

### Explicitly rejected direction
Neutral “ownerless” drawing color не является предпочтительной моделью, потому что:
- ослабляет social readability
- хуже совпадает с общей participant identity model проекта

## 7. Что цвет означает по слоям

### Layer A — Identity
Цвет показывает человека:
- cursor
- presence
- participant label

### Layer B — Creator affiliation
Цвет показывает, с кем объект визуально связан:
- token
- text-card accent
- potentially drawing in the target model

### Layer C — Current action
Цвет показывает, кто действует прямо сейчас:
- selection
- drag
- resize
- live manipulation
- previews
- locks

### Layer D — Object style
Собственный стиль объекта — это отдельный слой.

Он не должен автоматически сливаться с participant identity без явного решения.

## 8. Что запрещено трактовать неявно

Нельзя неявно считать, что:
- creator color = permission owner
- object color = current actor color
- historical author color snapshot = canonical creator semantics
- persisted `authorColor` field = canonical creator-color truth
- all object styling should derive from participant color
- neutral shared objects should become participant-coded by accident

## 9. Canonical per-entity summary

### Participant
- has current `PlayerColor`
- `PlayerColor` is live identity color

### Token
- creator-linked
- persist creator id, not creator color snapshot
- main creator-linked visual color resolves from creator's current `PlayerColor`

### Text-card
- creator-linked
- persist creator id, not creator color snapshot
- only accent resolves from creator's current `PlayerColor`
- card body remains neutral

### Image
- neutral shared object
- no creator color in normal rendering

### Selection / drag / resize
- actor-colored
- always use current actor color
- ephemeral only

### Drawing
- target semantic direction: creator-linked and live-colored by current participant identity
- temporary historical-color fallback is acceptable only as implementation transition

## 9.1 Explicit object-color source-of-truth rule

For creator-linked objects, the semantic source of truth should be:

1. persisted/shared `creatorId`
2. current participant-color resolution for that id

Not:

1. persisted/shared historical `authorColor`
2. ephemeral presence color as the canonical creator-color source

## 10. Change control

Этот документ считается каноническим semantic source для color model в `play-space-alpha`.

Если implementation reveals ambiguity:
1. сначала read-only analysis
2. затем update этого design doc при необходимости
3. только потом semantic code change

Изменять семантику цвета без явного обновления этого документа нельзя.
