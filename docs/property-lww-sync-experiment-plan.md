# Property LWW Sync Track Plan

Status: active experimental branch plan  
Branch: `property-lww-sync-experiment`  
Scope: migrate board-object sync toward a Figma-like property-level model

Этот документ фиксирует active track для перехода к Figma-like
property-level sync model.

## 1. External reference model

В качестве внешнего ориентира берём публично описанную Figma multiplayer model.

Primary source:

- Figma Blog — [How Figma’s multiplayer technology works](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)

Что Figma публично утверждает:

- документ синхронизируется как object/property structure;
- конфликт возникает только когда два клиента меняют одно и то же свойство
  одного и того же объекта;
- если меняются разные свойства одного объекта, оба изменения выживают;
- если меняется одно и то же свойство одного объекта, выигрывает последнее
  значение, дошедшее до сервера;
- create/delete — отдельные explicit actions;
- parent-child relationship хранится как property на child, а не как удаление и
  recreate с новым id.

Current branch assumption:

- FigJam с высокой вероятностью живёт на той же базовой multiplayer philosophy,
  что и Figma design documents.
- Это inference от публичной Figma engineering model, не отдельное публичное
  подтверждение FigJam internals.

## 2. Current play-space-alpha model

Current board-object sync у нас уже разделён по object families, но не по
properties.

### 2.1. Current runtime shape

Current local runtime:

- `useBoardObjectRuntime` держит локальный массив `BoardObject[]`
- mutations применяются как whole-object updates на клиенте
- после этого sync layer раскладывает объекты по family-specific realtime
  connections

Current sync split:

- tokens → `roomTokensRealtime`
- images → `roomImagesRealtime`
- note-cards → `roomTextCardsRealtime`

### 2.2. Current shared write granularity

Current shared write granularity:

- один shared entry = один объект
- payload = сериализованный whole object JSON

Current evidence:

- `roomTokensRealtime.ts` writes `tokenMap.set(token.id, JSON.stringify(token))`
- `roomTextCardsRealtime.ts` writes `textCardMap.set(textCard.id, JSON.stringify(textCard))`
- `roomImagesRealtime.ts` writes `imageMap.set(image.id, JSON.stringify(toSharedImage(image)))`

Current practical consequence:

- unrelated properties of the same object do not merge independently
- the later whole-object write replaces the earlier whole-object state

### 2.3. Current special realtime corridors

We already have separate special corridors for some live interaction states:

- image preview position / preview bounds live in `imagePositionMap`
- image drawing lock lives in awareness
- note-card editing / resize presence live in awareness
- token active move lives in awareness

Current practical consequence:

- some transient interaction state is already separated from committed object
  content
- committed object content is still synced as whole-object JSON

## 3. Main gap against the Figma-like model

The main gap is not “we use multiplayer and Figma uses multiplayer”.

The main gap is:

- Figma-like target model = per-object per-property conflict boundary
- current model = per-object whole-value conflict boundary

That changes conflict behavior materially.

### 3.1. Example: same object, different properties

Target model:

- A changes `x`
- B changes `width`
- result keeps both `x` and `width`

Current model:

- A sends whole object with new `x`
- B sends whole object with new `width`
- whichever whole object lands last can overwrite the other property too

### 3.2. Example: same object, same property

Target model:

- A changes `x`
- B changes `x`
- result keeps last-to-server `x`

Current model:

- same visible effect may happen
- but conflict boundary is whole object, not one property

## 4. Important architectural constraint

Exact Figma semantics are not free on our current transport.

### 4.1. Why

Figma’s public model is:

- client/server
- server-authoritative ordering
- last-to-server wins for the same property

Current repo transport is:

- Yjs docs over `y-websocket`
- decentralized CRDT-style merge behavior
- no explicit server-authoritative property-order layer for board-object content

### 4.2. What this means

We can move toward a Figma-like model in two different strengths:

#### A. Figma-like property boundary

We keep current Yjs transport for the experiment, but:

- split object state into per-property shared entries
- get independent merge for unrelated properties
- accept Yjs conflict semantics for same-property writes

This gives us:

- the same conflict boundary as Figma
- different conflict ordering semantics

#### B. Figma-equivalent server ordering

We introduce a server-authoritative mutation/order layer for board-object
properties.

This gives us:

- per-property conflict boundary
- last-to-server semantics
- explicit ack/order model

This is the real Figma-equivalent path.

## 5. Decision for this branch

This branch already accepts per-property sync as the target direction.

Branch goal:

- move board-object sync to per-property conflict boundaries
- make the hosted branch testable with two real clients
- approach the Figma model as closely as the current transport allows

Current open technical question:

- whether the current transport is enough
- or whether later work needs a stricter server-authoritative ordering layer

Current branch verdict after first hosted testing:

- the general per-property model reads as the right direction for board objects;
- `token` and `note-card` fit the model well enough to continue the migration;
- `image` geometry also fits the model in general;
- `image` while drawing remains a deliberate exception corridor for now.

Current branch verdict after the critical image-corridor hosted regression pass on
`210765f`:

- the critical hosted image corridor now passes with two real clients;
- fresh room baseline now includes the sample image needed for image-corridor
  checks;
- local image drag hides drawing affordance as intended;
- if one participant is already dragging an image and another participant starts
  drawing on that same image, the in-flight drag now stops and does not commit;
- post-lock recovery returns the image to ordinary movable behavior after
  drawing mode ends.

## 6. Current object-family suitability

### 6.1. First migration candidates

These fit a property-level experiment well:

- `token`
- `note-card` geometry
- `image` geometry

Candidate property set:

- `x`
- `y`
- `width`
- `height`
- `tokenAttachment`
- simple scalar metadata if needed

### 6.2. Deliberate exceptions in the first pass

These should stay out of the first property-LWW experiment:

- `imageStrokes`
- `note-card.label` as true simultaneous text editing
- drawing mode internals
- selection
- cursors
- occupancy / active move / edit / resize presence

Reason:

- these are either awareness state
- or they need a richer merge model than plain property overwrite

Current accepted exception rule:

- while an image is in drawing mode, other participants should not move it;
- image drawing lock should remain the gating mechanism for that rule;
- the branch should prefer temporary blocking over trying to make `image +
  drawing + remote move` behave like an ordinary property-synced object.
- this gated image corridor is now hosted-validated for the current critical
  drag-vs-drawing race.

## 7. Proposed migration track

### Phase 0 — hosted experiment frame

Goal:

- test on a real hosted branch with two real clients

Deliver:

- experimental hosted route or experimental hosted behavior on this branch
- inspectability for current object state
- easy repeatable sample room

### Phase 1 — property schema

Goal:

- define which board-object properties belong to the experiment

Deliver:

- explicit property list for:
  - `image`
  - `note-card`
  - `token`
- explicit exception list

Output of this phase:

- one document saying “these fields are property-synced”
- one document saying “these fields stay out”

### Phase 2 — property-backed truth on narrow scope

Goal:

- let the experimental branch actually use the property-level shared state for a
  narrow object/property subset

Scope:

- `token`
- `note-card` geometry
- `image` geometry

Non-goals:

- no text co-edit
- no strokes migration
- no broad board rewrite

### Phase 3 — hosted conflict scenarios

Goal:

- test real multiplayer behavior from two computers

Mandatory scenarios:

1. A changes `x`, B changes `y`
2. A changes `width`, B changes `height`
3. A changes `x`, B changes `x`
4. A moves token, B moves token
5. A moves note-card, B resizes note-card

Expected result:

- clear picture of where the current transport already behaves close enough to the
  Figma target
- clear picture of where exact server-authoritative semantics are still missing

### Phase 4 — deeper property coverage

Goal:

- extend property sync deeper once the first narrow slice is stable

Candidate later additions:

- note content
- image metadata
- attachment refinement
- other object families if chapter scope expands

### Phase 5 — ordering decision

At the end of the hosted test track, decide:

1. current transport semantics are sufficient for this product
2. current transport semantics are sufficient for some properties but not all
3. the repo should later pursue exact server-authoritative property ordering

## 8. What “success” means for this branch

This branch succeeds if it delivers:

1. real per-property sync for a narrow board-object slice
2. hosted two-client testing on that slice
3. a clear exception list
4. a clear decision on whether current transport semantics are enough

Current mid-track acceptance:

- the branch already has a usable migration basis;
- the model should continue forward where it stays simple and stable;
- image drawing interaction may stay hybrid until the product needs a deeper
  object-dependent rule.

## 9. Recommended next implementation slice

The first real implementation slice should be:

1. define the property schema and exception list
2. introduce property-backed shared storage for a narrow object slice
3. add inspectability for property-level updates
4. build a narrow hosted experiment surface for two-client testing

This is the smallest slice that can start the migration honestly.
