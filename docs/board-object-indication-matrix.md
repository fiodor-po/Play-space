# Board Object Indication Matrix

Status: working normalization doc
Scope: visual indication matrix for abstract board objects and current object families

Этот документ фиксирует нормализованную visual indication matrix для
board-object interaction layer.

Его задача:

- дать одну общую indication vocabulary для абстрактного board object;
- разделить base object rendering, interaction artifacts и local shell modes;
- зафиксировать, как разные object families используют одни и те же indication
  families;
- удержать `image`, `note-card`, `token` внутри одной модели без ложного
  требования делить один и тот же move corridor.

Этот документ задаёт indication normal form.
`board-object-interaction-model.md` задаёт high-level model, а
`board-object-interaction-matrix.md` фиксирует текущую runtime truth.

## 1. Core axes

### 1.1. Geometry class

Каждый board object читается через geometry class:

- `box`
- `pin`

Current mapping:

- `image` → `box`
- `note-card` → `box`
- `token` → `pin`

### 1.2. Interaction ownership

Каждый object-scoped interaction state должен читаться через ownership:

- `none`
- `local-active`
- `remote-active`
- `gated`

Current ownership rule:

- `remote-active` is an information state about another participant's current
  interaction target or active use;
- `gated` is an availability state for the local participant;
- these states must stay separate even when they are rendered through the same
  occupied indication family.

### 1.3. Presentation mode

Каждое interaction presentation должно читать один из режимов:

- `committed`
- `live-local`
- `remote-preview`
- `live-shared`

### 1.4. Artifact family

Каждое visual indication должно принадлежать одной из artifact families:

- `selection`
- `preview`
- `occupied`
- `controls`
- `edit-shell`

## 2. Canonical indication families

### 2.1. `selection`

Meaning:

- объект является текущей локальной interaction target

Rules:

- lives in interaction space
- anchored to object geometry or footprint
- does not claim remote ownership by itself

Current system rule:

- only one object is locally selected at a time in the current runtime;
- selection may expose object-specific local controls;
- selection chrome, resize handles, and object-adjacent controls are
  object-anchored and viewport-stable rather than board-scaled.

Current shapes:

- transformer for `box`
- centered ring for `pin`

Current family mapping:

- `image` selection = frame + resize handles + image-attached controls
- `note-card` selection = frame + resize handles
- `token` selection = selection indicator only

Current remote-selection rule:

- remote selection uses the same viewport-stable object-anchored family;
- if several remote participants select the same object at once, current
  aggregation reads as `last-selector-wins`.

### 2.2. `preview`

Meaning:

- viewer sees a transient interaction result, not committed truth

Rules:

- must not masquerade as committed content
- should stay visibly distinct from the object body
- should usually be frame-like, not full object replacement

Current canonical user:

- `image` remote drag/transform preview

### 2.3. `occupied`

Meaning:

- another participant is currently using or blocking the object

Rules:

- lives in interaction space
- should answer `can I act on this object right now?`
- may also carry blocked/gated meaning without inventing a separate family

Current default rule:

- the repo should avoid blocking whenever a truthful concurrent corridor is
  possible;
- blocking is an exception tool, not the default multiplayer model.

Current canonical source:

- `RemoteInteractionIndicator`

Current blocked-side reading:

- the participant who owns the blocking corridor does not need extra treatment;
- the blocked participant should see a light blocked treatment on the object;
- current accepted blocked treatment for `image while drawing` is:
  - slight object dim
  - blocked cursor
  - top-left viewport-stable pill with the blocking participant name and active
    verb, for example `Annie is drawing...`

### 2.4. `controls`

Meaning:

- local object-adjacent actions are available

Rules:

- local only
- anchored to object geometry or effective bounds
- viewport-stable in readability
- not mirrored as remote controls by default

Current canonical user:

- selected image controls

### 2.5. `edit-shell`

Meaning:

- local active mode raises a dedicated local shell or overlay

Rules:

- local only
- does not need to mirror itself remotely
- remote side should usually get `occupied` or frame feedback instead

Current canonical user:

- `note-card` textarea edit overlay

## 3. Abstract object-state matrix

| State | Local reading | Remote reading | Canonical family |
| --- | --- | --- | --- |
| `committed idle` | ordinary object body | same committed object | base object |
| `selected` | object is selected locally | no remote selected chrome by default | `selection` |
| `remote selected` | local user sees remote selection or remote target state | remote user sees their own active target state | `selection` |
| `local move` | object moves under local ownership | either preview or live shared state | `preview` or `live-shared` |
| `local resize/transform` | geometry changes live locally | either preview or live shared state | `preview` or `live-shared` |
| `local active mode` | object enters a special local mode | remote sees activity cue, not local shell | `occupied` plus local `edit-shell` when needed |
| `remote active` | local user sees remote use | remote owner sees local mode | `occupied` |
| `gated` | local action is denied or stopped | remote owner keeps acting | `occupied` |
| `controls available` | local object actions are visible | controls not mirrored | `controls` |
| `controls suppressed` | controls are intentionally hidden | remote sees only object/activity state | none or `occupied` |

## 4. Normalized vocabulary

| Semantic class | Visual reading |
| --- | --- |
| `selected` | selection chrome |
| `remote-selected` | remote selection chrome using the same family with remote ownership semantics |
| `transient-preview` | preview frame / preview treatment |
| `remote-occupied` | occupied frame / occupied ring |
| `blocked` | occupied family with local action denial |
| `blocked-object-surface` | slight dim on the blocked object |
| `blocked-activity-pill` | top-left object-anchored viewport-stable activity label |
| `local-actionable` | object-adjacent controls |
| `local-shell-mode` | local overlay or shell |
| `live-shared-motion` | object body itself moves live without separate preview frame |

## 5. Current family mappings

### 5.1. `image`

| State | Local reading | Remote reading | Canonical family |
| --- | --- | --- | --- |
| `idle` | committed image content | same committed image | base object |
| `selected` | transformer + local controls | remote-selected frame by current owner if applicable | `selection` + `controls` |
| `drag` | image moves live locally | remote preview frame | `preview` |
| `transform` | bounds change live locally | remote preview frame | `preview` |
| `drawing mode` | local drawing session | remote occupied lock | `occupied` |
| `remote drawing lock` | move is gated, image is slightly dimmed, cursor is blocked, activity pill is visible | owner continues drawing with no extra blocked treatment | `occupied` / `gated` |
| `controls available` | `Draw / Save / Clear / Clear all` | not mirrored | `controls` |
| `controls during drag` | controls stay hidden | none | controls suppression rule |

Current reading:

- `image` is the canonical `box` object with explicit preview-family movement;
- `image while drawing` is the accepted gated exception corridor;
- image is also the current accepted full-object blocking exception;
- if drawing lock appears during drag, drag must stop and must not commit.
- this blocking corridor is temporary;
- the repo is expected to need concurrent drawing later, so the current
  full-object block and its blocked treatment will need a future redesign.

### 5.2. `note-card`

| State | Local reading | Remote reading | Canonical family |
| --- | --- | --- | --- |
| `idle` | committed card body | same committed card | base object |
| `selected` | transformer-selected card | remote-selected frame by current owner if applicable | `selection` |
| `drag` | live local move | live shared move | `live-shared` |
| `resize` | live local resize | remote frame around live bounds | `occupied` / resize frame |
| `edit mode` | textarea overlay | remote edit frame | local `edit-shell` + remote `occupied` |
| `saved text growth` | committed height updates by sizing rule | same committed geometry | committed property truth |

Current reading:

- `note-card` is the canonical text-box object;
- move reads as `live-shared`, not preview;
- edit mode reads as local shell plus remote occupied frame.

### 5.3. `token`

| State | Local reading | Remote reading | Canonical family |
| --- | --- | --- | --- |
| `idle` | committed pin body | same committed pin body | base object |
| `selected` | centered selection ring | remote-selected indicator by current owner if applicable | `selection` |
| `drag` | live local move | live shared move | `live-shared` |
| `occupied move` | move is blocked by another active move | remote sees occupied token state | `occupied` |
| `attached` | token follows parent geometry | same committed attachment truth | committed property truth + pin presentation |

Current reading:

- `token` is the canonical pin exception;
- token move stays in `live-shared`;
- occupied token state stays inside the same shared occupied family, not a
  separate token-only indication system.

## 6. Normalized family map

| Family | Geometry | Move model | Resize model | Active mode model | Occupied model | Controls model |
| --- | --- | --- | --- | --- | --- | --- |
| `image` | `box` | `preview` | `preview` | `drawing-mode` | `drawing-lock` | object-adjacent |
| `note-card` | `box/text-box` | `live-shared` | frame-based remote indication | `edit-shell` | edit/resize frame | none yet |
| `token` | `pin` | `live-shared` | n/a | none | occupied ring | none |

## 7. Current canonical rules

The repo can now treat these as current canonical rules:

1. `selection`, `preview`, and `occupied` are the main indication families for
   board-object interaction.
2. `controls` and `edit-shell` are separate interaction artifacts, not part of
   ordinary committed object rendering.
3. Different object families do not need to share one move model:
   - `image` may remain preview-family
   - `note-card` and `token` may remain live-shared families
4. `gated` is not a separate geometry system; it reads through the occupied
   family.
5. `remote-selected` and `blocked` are different state classes even when they
   share the same visual family.
6. blocking should be avoided unless the corridor cannot stay truthful under
   concurrent interaction.
7. `image while drawing` remains the current accepted gated and blocking
   exception.
8. remote selection currently aggregates as `last-selector-wins`.
9. blocked treatment should stay minimal and explanatory:
   - no extra treatment for the blocker
   - light object dim, blocked cursor, and top-left activity pill for the
     blocked viewer.
10. the current `image while drawing` blocking model is temporary and should be
    revisited when concurrent drawing becomes part of the product.

## 8. Relationship to other docs

Use this doc when the question is:

- which indication family should this state belong to
- how should abstract object state map to visual artifact families
- which current family behavior is canonical and which is an exception

Use these docs next:

- `indication-design.md` for cross-product indication principles
- `board-object-interaction-model.md` for the high-level object model
- `board-object-interaction-matrix.md` for runtime truth
- `board-object-controls-ui-layer.md` for chapter scope and implementation order
