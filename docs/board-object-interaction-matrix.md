# Board Object Interaction Matrix

Status: working chapter matrix  
Scope: current-alpha board-object interactions and state presentation

Этот документ фиксирует текущий инвентарь interaction types и state presentation
для board objects.

Цель документа:

- собрать current runtime truth в одну матрицу;
- разделить local view и remote-facing view;
- зафиксировать committed content vs live interaction;
- дать опору для chapter `Board object controls UI layer`.

Этот документ описывает текущее состояние слоя. Он не утверждает, что каждая
текущая деталь уже является финальной canonical form.

## 1. Canonical object families

Current alpha interaction layer опирается на три family:

- `image` — canonical box/media object
- `note-card` — canonical text-box object
- `token` — canonical pin exception

## 2. Matrix axes

Для каждой interaction/state entry матрица отвечает на четыре вопроса:

1. что делает локальный участник;
2. что видит локальный участник на своём объекте;
3. что видит удалённый участник;
4. какой current runtime corridor это рисует.

Основные категории:

- `committed` — обычное committed object content
- `local-live` — локальное живое действие текущего участника
- `remote-facing` — то, как это действие или его результат видит другой участник
- `gated` — interaction availability / occupied state

## 3. Object-family inventory

### 3.1. `image`

Current image interaction inventory:

- selection
- move / drag
- resize / transform
- drawing mode
- image-attached controls
- remote drag preview
- remote transform preview
- remote drawing lock

Current local view:

- selected image получает transformer
- local drag двигает image immediately
- local transform меняет effective bounds immediately
- local drawing mode удерживает image в special active mode
- object-attached controls anchorятся к effective bounds

Current remote-facing view:

- remote drag / transform виден как preview frame
- committed image content не маскируется под preview
- remote drawing lock виден как occupied frame
- attached token следует effective preview geometry image

Current canonical reading:

- `image` already has a full split between committed content, local active manipulation, and remote transient preview

### 3.2. `note-card`

Current note-card interaction inventory:

- selection
- move / drag
- resize / transform
- edit mode
- remote editing indication
- remote resize indication

Current local view:

- selected note-card получает transformer
- local drag двигает карточку live
- local resize меняет card bounds live
- local edit mode скрывает rendered text и поднимает textarea overlay
- saved text can expand committed note height by product sizing rule

Current remote-facing view:

- live note move виден как обычный live shared position
- отдельного preview frame для move сейчас нет
- remote edit виден как interaction frame вокруг card bounds
- remote resize виден как interaction frame вокруг live resize bounds

Current canonical reading:

- `note-card` keeps box-object manipulation semantics
- text editing stays its own active mode
- move currently propagates as live shared content, not as a separate preview family

### 3.3. `token`

Current token interaction inventory:

- selection
- move / drag
- occupied / blocked move state
- attached-to-image positioning

Current local view:

- selected token uses centered selection ring
- local drag moves token live
- attached token resolves from parent image effective bounds
- token body stays viewport-stable

Current remote-facing view:

- live token move currently appears as live shared movement
- occupied move state appears as circular interaction frame
- separate remote preview state for token move does not exist now

Current canonical reading:

- `token` is a pin exception
- it shares move/occupied semantics with the interaction layer
- it does not share transformer or box-preview semantics

## 4. State matrix

| Family | Interaction / state | Local view | Remote-facing view | Current runtime source |
| --- | --- | --- | --- | --- |
| `image` | committed idle | plain image content | same committed content | `BoardStageScene`, `KonvaImage` |
| `image` | selected | transformer + attached controls when relevant | no equivalent selected chrome by default | `BoardStageScene`, selected image inspectability VM |
| `image` | local drag | image moves live locally | preview frame on old viewer side, committed content stays distinct | `previewImagePosition`, `remoteImagePreviewPositions`, `RemoteInteractionIndicator` |
| `image` | local transform | image transforms live locally | preview frame on remote-facing side | `publishImageTransformPreview`, `resolveEffectiveImageBounds` |
| `image` | local drawing mode | drawing mode active, strokes append live | remote occupied lock, not local editing shell | drawing lock + `RemoteInteractionIndicator` |
| `image` | remote occupied | local action gated by drawing lock | same lock state from the other side | image drawing lock corridor |
| `image` | object-attached controls | `Draw / Save / Clear / Clear all` anchored to effective bounds | controls themselves are local, not mirrored as remote controls | selected image controls VM + board interaction button family |
| `note-card` | committed idle | text card content | same committed content | `NoteCardRenderer` |
| `note-card` | selected | transformer-selected text box | no special remote selected chrome by default | `NoteCardRenderer` + `BoardStageScene` |
| `note-card` | local drag | live local move | live shared move, no separate preview frame | `updateObjectPosition` shared path |
| `note-card` | local resize | live local resize bounds | remote resize frame around live bounds | `liveNoteCardResizePreview`, `remoteTextCardResizeStates`, `RemoteInteractionIndicator` |
| `note-card` | local edit | textarea overlay + hidden rendered text | remote editing frame, not text shell mirror | local edit overlay + `remoteTextCardEditingStates` |
| `note-card` | remote edit | local sees interaction frame around the card | remote editor sees local textarea and edit affordance | `RemoteInteractionIndicator` in `NoteCardRenderer` |
| `token` | committed idle | viewport-stable pin body | same committed body | `TokenRenderer` |
| `token` | selected | centered selection ring | no separate remote selected chrome by default | `TokenRenderer` |
| `token` | local drag | live local move | live shared move | `updateTokenAnchorPosition` shared path |
| `token` | occupied / blocked move | drag stops when another participant is the active mover | other participant sees occupied circle frame | `activeTokenMove`, `getBlockingActiveMove`, `RemoteInteractionIndicator` |
| `token` | attached positioning | anchor resolves against effective parent image bounds | same resolved position on remote-facing side | token attachment + effective image bounds |

## 5. Current classification by interaction model

### 5.1. Shared box-object model

Shared between `image` and `note-card`:

- transformer-based selection
- drag move
- transform/resize
- object-scoped interaction frame language

Current key difference:

- `image` uses explicit remote preview for move / transform
- `note-card` uses live shared movement for drag and frame-based indication for edit / resize

### 5.2. Text-box exception inside box-object model

`note-card` keeps these stronger text-specific rules:

- edit mode is a local active mode
- text readability wins over image-like visual transform
- committed height can grow on save
- textarea overlay is local-shell behavior, not shared object content

### 5.3. Pin exception model

`token` keeps these pin-specific rules:

- no transformer
- viewport-stable body
- centered selection ring
- drag-only manipulation
- occupied move frame uses circle shape
- image-attachment geometry is resolved from parent image bounds

## 6. Current local vs remote pattern families

### 6.1. Explicit remote preview family

Used now by:

- `image` move / transform

Presentation:

- committed content stays readable
- remote-facing side sees dashed preview frame

### 6.2. Live shared movement family

Used now by:

- `note-card` move
- `token` move

Presentation:

- remote-facing side sees the object itself moving live
- separate preview frame is absent

### 6.3. Occupied / interaction frame family

Used now by:

- image drawing lock
- note remote edit
- note remote resize
- token occupied move

Presentation:

- `RemoteInteractionIndicator`
- rect for box objects
- circle for pin objects

## 7. Current gaps and open questions

Current gaps this matrix already exposes:

- `image`, `note-card`, and `token` do not yet share one unified move-preview model
- `note-card` local edit uses local shell overlay while remote side only gets an interaction frame
- token has no object-adjacent controls yet
- note-card has no object-adjacent controls yet

Current open chapter questions:

1. Should `note-card` move stay in the live shared movement family, or should it later gain an explicit preview model?
2. Should `token` move stay in the live shared movement family permanently as part of the pin exception?
3. Which object-adjacent controls, if any, belong to `note-card` and `token` in current alpha scope?

## 8. Recommended next use of this matrix

Use this matrix in the current chapter flow like this:

1. review the current simulator and product corridors against the matrix
2. mark which entries are already canonical
3. mark which entries are accidental drift
4. use that result to define the first `now` chapter scope for object controls
