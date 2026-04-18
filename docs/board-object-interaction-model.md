# Board Object Interaction Model

Status: working chapter model  
Scope: high-level interaction model for an abstract board object

Этот документ описывает high-level model board-object interaction layer.

Его задача:

- зафиксировать общую модель, применимую к абстрактному объекту доски;
- разделить board content, interaction chrome и viewport behavior;
- описать, как object geometry переводится в interaction presentation;
- дать общую рамку для matrix и дальнейших chapter decisions.

Этот документ задаёт модель.  
`board-object-interaction-matrix.md` фиксирует текущую runtime truth поверх этой модели.

## 1. Core entities

### 1.1. Board object

Board object — это persisted/shared object, который живёт в пространстве доски и
имеет:

- identity
- object family
- committed geometry
- committed content
- committed property state
- interaction affordances

Current canonical object families:

- `image`
- `note-card`
- `token`

Current committed-state rule:

- board objects should be read as shared property-bearing objects, not as opaque
  whole-object blobs;
- different committed properties of the same object may sync independently;
- local and remote interaction layers are presentations over that committed
  property state, not a separate object model.

### 1.2. Board space

Board space — это canonical coordinate system доски.

Board objects живут в board space.

Board space определяет:

- object position
- object size
- relative placement between objects
- attachment geometry

Board space масштабируется и панится вместе с доской.

### 1.3. Viewport

Viewport — это текущий видимый фрагмент доски на экране.

Viewport определяет:

- какой участок board space сейчас виден;
- как board-space geometry проецируется на экран;
- какая interaction presentation должна оставаться readable при zoom/pan.

### 1.4. Interaction space

Interaction space — это presentation layer для interaction chrome.

Interaction space:

- выводится из object geometry;
- позиционируется относительно board object;
- рендерится для стабильной читаемости в viewport.

Interaction space нужен для:

- selection chrome
- interaction frames
- object-adjacent controls
- other object-scoped interaction presentation

Current chapter rule:

- board content lives in board space
- interaction chrome lives in interaction space

## 2. Abstract board-object geometry

### 2.1. Committed geometry

Каждый board object имеет committed geometry.

Для box-like families committed geometry выражается через:

- `x`
- `y`
- `width`
- `height`

Для pin-like families объект имеет committed anchor в board space, а interaction
footprint выводится отдельно.

Current practical reading:

- `image` and `note-card` are box objects
- `token` is a point-anchored pin object with a viewport-stable rendered footprint

Current sync reading:

- committed geometry is now expected to survive as property-level shared state
  where the object corridor stays simple enough;
- current first-slice geometry path already treats `x`, `y`, `width`, `height`,
  and `tokenAttachment` as the preferred shared-property class;
- richer content such as `imageStrokes` or true simultaneous text editing may
  still remain special corridors.

### 2.2. Effective bounds

Effective bounds — это interaction-relevant bounds объекта в текущий момент.

Они могут совпадать с committed geometry, а могут описывать live state:

- local drag / transform preview
- remote preview
- attached dependent positioning
- object-adjacent control anchoring

Effective bounds нужны, когда interaction layer должен следовать не только за
committed content, но и за live geometry.

### 2.3. Interaction footprint

Interaction footprint — это shape, внутри которой interaction layer читает
объект как action target или interaction presentation target.

Current canonical classes:

- box footprint
- pin footprint

Current family mapping:

- `image` → box footprint
- `note-card` → box footprint
- `token` → pin footprint

## 3. Positioning model

### 3.1. Content positioning

Committed object content рендерится в board space.

Это правило applies to:

- image bitmap/content
- note-card body
- attached object relationships

When the board zooms:

- board content scales with the board

### 3.2. Interaction positioning

Interaction chrome anchorится к object geometry or effective bounds.

This includes:

- selection treatment
- remote interaction frames
- attached controls
- token selection/occupied treatment

Interaction chrome should remain viewport-stable unless the family has an
explicit exception.

That means:

- anchor source comes from board space
- final readability sizing is resolved in viewport terms

### 3.3. Attachment positioning

Attached relationships read parent geometry from board object bounds.

Current example:

- attached token reads anchor position from parent image effective bounds

Attachment rule:

- attachment source stays in board space
- attached object may still keep its own interaction presentation rules

Current implication:

- attached token follows parent image geometry
- token body still keeps pin-style viewport-stable presentation

## 4. Temporal state model

В любой момент board object должен читаться через слои состояния, а не через
одну плоскую визуальную форму.

### 4.1. Base committed state

Каждый объект имеет base committed state:

- committed geometry
- committed content
- committed property values
- committed family shape

Это baseline, от которого строится interaction presentation.

Current committed-state rule:

- the interaction layer should assume committed state is assembled from object
  properties;
- property-level shared truth is now the preferred default for ordinary board
  object state;
- exact same-property server ordering is still a separate transport question,
  not a reason to fall back to whole-object thinking in the interaction model.

### 4.2. Local active state

Объект может иметь local active state текущего участника.

Examples:

- local image drag
- local image transform
- local image drawing mode
- local note-card drag
- local note-card resize
- local note-card edit
- local token drag

Local active state может:

- менять effective bounds
- временно менять interaction chrome
- поднимать local-only shell behavior

### 4.3. Remote-facing state

Объект может одновременно иметь remote-facing interaction presentation для
другого участника.

Current forms:

- remote preview
- remote occupied / blocked state
- remote editing frame
- remote resize frame
- live shared movement

Remote-facing state отвечает на вопрос:

- что другой участник должен понять о состоянии этого объекта прямо сейчас

### 4.4. Gated state

Object interaction may be gated.

Gated state определяет:

- доступен ли object action локально;
- нужно ли показать occupied / blocked treatment;
- должен ли local interaction stop instead of continuing.

Current accepted practical rule:

- if a richer interaction corridor cannot yet be kept stable under the shared
  property model, the object may stay temporarily gated instead of pretending to
  support ordinary concurrent manipulation.

Current baseline example:

- `image` while drawing is a deliberate gated exception;
- drawing lock blocks concurrent move by other participants;
- if drag is already in flight when the drawing lock appears, the drag should
  stop and should not commit.

Current blocked-indication rule for that corridor:

- the participant who owns the drawing lock needs no extra blocked treatment;
- the blocked participant should get:
  - slight object dim
  - blocked cursor
  - object-anchored viewport-stable top-left activity pill with participant
    name and active verb.

Current temporary rule:

- this full-object blocking model is accepted only as the current checkpoint;
- the repo is expected to need concurrent drawing later;
- when concurrent drawing becomes in scope, this blocking corridor should be
  redesigned rather than treated as permanent.

Current default rule:

- the repo should avoid blocking by default;
- concurrent interaction is preferred whenever the corridor can stay truthful;
- blocking is currently accepted only as an object-specific exception.

### 4.5. State stacking rule

Object presentation should be read as stacked layers:

1. committed object
2. local active state if present
3. remote-facing interaction state if present
4. gating state if relevant

Current rule:

- live interaction presentation should not masquerade as committed content

## 5. Canonical family classes

### 5.1. Box object

Box object has:

- rectangular committed geometry in board space
- transformer-compatible selection/manipulation model
- box-shaped interaction footprint
- object-scoped remote frame language

Current users:

- `image`
- `note-card`

### 5.2. Text box

Text box is a box object with stronger readability rules.

Additional rules:

- text layout can change committed height
- local edit mode may raise local shell overlay
- readability wins over image-like transform behavior

Current user:

- `note-card`

### 5.3. Pin object

Pin object is a point-anchored interaction exception.

Rules:

- anchor lives in board space
- visible body remains viewport-stable
- selection is centered ring treatment
- drag is the main manipulation path
- occupied state uses circular frame language

Current user:

- `token`

## 6. Canonical interaction artifacts

### 6.1. Selection artifact

Selection shows:

- object is the current local interaction target

Selection artifact depends on family:

- transformer for box objects
- centered ring for pin objects

Current selection-system rule:

- only one object is locally selected at a time in the current runtime;
- selection may expose object-specific controls or resize handles;
- selection chrome stays object-anchored and viewport-stable rather than
  scaling like ordinary board content.

Current family mapping:

- `image` → frame + resize handles + image controls
- `note-card` → frame + resize handles
- `token` → selection indicator only

Current remote-selection rule:

- remote selection uses the same object-anchored viewport-stable family;
- if several remote participants select the same object at once, current
  aggregation reads as `last-selector-wins`.

### 6.2. Preview artifact

Preview shows:

- the viewer is seeing a transient interaction result, not committed content

Current explicit preview artifact:

- remote image drag/transform preview frame

Current modeling rule:

- preview is still allowed as a family-specific corridor even when committed
  object truth is property-synced;
- property sync does not require every family to render remote live movement as
  direct committed-looking content.

### 6.3. Occupied artifact

Occupied artifact shows:

- another participant is currently using or blocking the object

Current occupied artifact source:

- `RemoteInteractionIndicator`

### 6.4. Object-adjacent controls

Object-adjacent controls are interaction artifacts anchored to object geometry.

Rules:

- they belong to interaction space
- they derive placement from object geometry or effective bounds
- they remain readable in viewport terms

Current accepted user:

- selected image controls

## 7. Current model applied to the three canonical families

### 7.1. `image`

`image` is:

- box object
- media object
- current explicit remote-preview object
- current object-adjacent-controls reference

Current accepted exception:

- `image` while drawing may stay gated for other participants instead of behaving
  like an ordinary concurrently movable object
- drawing lock is the accepted gate for that corridor
- active drag must stop if that drawing lock appears mid-drag
- this is currently the accepted full-object blocking exception
- this exception is temporary and should be revisited when concurrent drawing is needed

### 7.2. `note-card`

`note-card` is:

- text box
- box-object manipulation user
- local edit-mode user
- frame-based remote editing/resize user

### 7.3. `token`

`token` is:

- pin object
- point-anchored board object
- viewport-stable visual body
- occupied-move indicator user

## 8. Current modeling questions for the chapter

This model makes the current chapter questions explicit:

1. Which object families need object-adjacent controls in current alpha?
2. Which interactions should read as explicit preview rather than live shared movement?
3. Which states belong to object interaction itself, and which belong to local shell behavior?
4. Which committed properties should stay in the ordinary property-sync path, and which should remain special corridors?
5. Which current runtime details are canonical and which are temporary drift?

## 9. Relationship to other docs

Use this document as the high-level model.

Use these docs next:

- `interaction-layer-design.md` for current alpha interaction rules
- `board-object-interaction-matrix.md` for the current state inventory
- `board-object-controls-ui-layer.md` for chapter scope and chapter order
