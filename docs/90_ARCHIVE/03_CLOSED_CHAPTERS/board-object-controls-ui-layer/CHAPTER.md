# Board Object Controls UI Layer

Status: closed chapter checkpoint  
Scope: board-object control layer for the current alpha

Этот документ задаёт рабочую рамку chapter `Board object controls UI layer`.

Он фиксирует:

- текущий живой слой board-object controls;
- порядок работы внутри chapter;
- target design doc, который нужно собрать после review;
- split `now` / `later`;
- immediate implementation scope;
- chapter-close expectations.

Current status:

- the chapter checkpoint is closed;
- this doc now acts as the stable control-layer baseline for later board-object
  work;
- future chapters should reuse this baseline instead of reopening this chapter
  by default.

## 1. Порядок работы в chapter

Текущий agreed order такой:

1. review current live board-object control layer;
2. собрать target design doc для этого слоя;
3. разделить scope на `now` и `later`;
4. реализовать `now`;
5. закрыть chapter с рабочим alpha-layer expectation.

Этот порядок держит chapter узким и ставит product truth выше cleanup.

## 2. Current live starting point

На старт chapter уже есть реальный рабочий слой.

### 2.1. Accepted control family

Для board-object interaction уже принят отдельный derived family:

- `interactionButton.pill`
- `interactionButton.circle`

Current family rules already fixed in `docs/03_PRODUCT/03_INTERFACE_SYSTEM/02_CANON/CANONICAL.md`:

- branch stays derived from the ordinary button system;
- branch inherits ordinary interaction states;
- branch is reserved for board-object / object-adjacent interaction controls;
- branch keeps classic interface controls and board-object controls visually separated.

### 2.2. First live runtime consumer

Current first live runtime consumer is the image-attached drawing-management set:

- `Draw`
- `Save`
- `Clear`
- `Clear all`

Chapter стартует от реального alpha-layer и реального runtime consumer.

### 2.3. Current interaction-layer truth

Current interaction layer already says:

- control layer is object-adjacent;
- control layer is tied to board-object interaction rather than ordinary app chrome;
- interaction chrome should be object-anchored and viewport-stable;
- image is the current reference object family with attached live controls.

Current reference object families:

- `image` = active attached-control reference
- `note-card` = interaction family without attached controls yet
- `token` = interaction family without attached controls yet

### 2.4. Current board-object action grammar

The chapter already has a real action vocabulary through governance/runtime:

- `board-object.move`
- `board-object.edit`
- `board-object.delete`
- `board-object.clear-own-drawing`
- `board-object.clear-all-drawing`
- `board-object.resize`
- `board-object.draw`

This chapter should use that action grammar rather than inventing ad hoc control semantics.

### 2.5. Current technical debt shape

Current debt is already visible:

- image floating action controls are still recorded as `local-shared-within-file`;
- current image object controls still carry intentional-exception status in the inventory;
- the family is accepted, but the full board-object control layer is not yet unified as one coherent alpha chapter surface.

## 3. Review phase

The first phase of the chapter is a review of what already exists in runtime.

The review should answer:

- which current controls belong to the chapter right now;
- which controls are truly board-object controls and which are only board-adjacent overlays;
- which live object families already have stable enough control semantics;
- which current controls already map cleanly onto the accepted `interactionButton` branch;
- which current controls still depend on local placement/state exceptions;
- which differences are product-intentional and which are residual drift.

Review output should produce a short factual map:

- current control surfaces
- object families
- action mapping
- state mapping
- placement / anchoring rules
- exceptions worth keeping
- exceptions worth removing

Current chapter review matrix now lives in:

- `board-object-interaction-model.md`
- `board-object-indication-matrix.md`
- `board-object-interaction-matrix.md`

The model doc is the high-level frame for:

- abstract board object interaction semantics
- board space vs interaction space vs viewport
- object geometry vs effective bounds
- local state vs remote-facing state

The matrix doc is the working inventory of:

- object families
- interaction types
- local view
- remote-facing view
- current runtime presentation model

### 3.1. Current simulator review verdict

The chapter now has a board-interaction simulator in `/dev/design-system`.

Current simulator value:

- it already supports review of the current local image control layer;
- it already supports review of the current local image draw path;
- it already supports review of basic note-card move / resize / edit affordances;
- it already supports review of token occupancy and image-adjacent interaction indicators inside the current `BoardStageScene` corridor.

Current simulator contract should stay narrow for now:

- left pane = local interactive session
- right pane = shared-camera remote-facing preview

The simulator does not currently promise:

- a true second session
- an independent remote viewport
- a full remote note-edit shell path

Current accepted review findings for the simulator:

- cross-pane cursor behavior is currently dishonest and needs a narrow fix;
- image preview during drag / transform must keep attached-token behavior truthful;
- simulator glue should not depend on one hardcoded image id;
- note editing in the simulator currently covers local interaction and renderer truth, not the full product shell overlay path.

Current accepted non-follow-up for now:

- the right pane may continue to use the same viewport as the left pane in the current chapter pass;
- the simulator should be described honestly as a shared-camera remote preview until the project explicitly decides to build a true two-viewport or two-session harness.

Immediate simulator honesty pass for this chapter:

- fix cross-pane cursor visibility;
- fix image-preview truth for attached tokens;
- remove single-image glue assumptions;
- align block labeling and description with the current shared-camera contract.

## 4. Target design doc

After review, the chapter should produce one target design doc for the board-object control layer.

The current review matrix is the prerequisite input to that target design doc.

That doc should define:

- which controls belong to the board-object control layer;
- which object families are in the first real chapter scope;
- which control shapes are canonical:
  - `interactionButton.pill`
  - `interactionButton.circle`
- when `pill` is the default and when `circle` is the right shape;
- which states are required:
  - `default`
  - `hover`
  - `focus-visible`
  - `active`
  - `disabled`
  - optional semantic states such as `selected` or `open` only where real;
- how actions map to controls;
- how controls anchor to object geometry and interaction space;
- which controls remain object-attached and viewport-stable;
- which controls stay local exceptions for this alpha;
- which controls are intentionally outside this chapter.

The target design doc should also define one clear boundary:

- board-object controls chapter owns the control layer attached to objects;
- board navigation, mobile, media polish, dice polish, and broad shell redesign stay outside.

## 5. `Now` vs `Later`

The chapter should explicitly split work into `now` and `later`.

### 5.1. `Now`

`Now` should include only work that completes the current alpha control layer around existing board objects.

Current likely `now` scope:

- review the existing image-attached control set;
- review the current selected-image object controls;
- define the canonical board-object control layer for the current alpha;
- standardize the current live image/object control paths against that design;
- align action/state/placement rules where current drift is clearly accidental;
- keep the layer honest in runtime and docs.

### 5.2. `Later`

`Later` should hold anything that broadens the chapter beyond the current alpha object-control layer.

Current likely `later` scope:

- new object-family control systems for note-card and token if they need deeper interaction expansion;
- broader board navigation rewrite;
- mobile-specific control redesign;
- media and dice chapter work;
- broad shell/material redesign beyond the board-object control layer;
- deeper visual polish after the control model itself is coherent.

## 6. Immediate implementation scope

After review and target design alignment, the implementation phase should only land what the chapter chooses for `now`.

The immediate implementation target is:

- one coherent working alpha board-object control layer;
- current live object controls use the accepted family and accepted state model;
- action semantics follow the existing board-object action grammar;
- placement and anchoring rules are explicit and stable enough for current alpha use;
- the layer stays narrow and product-facing.

Current implementation should stay inside these boundaries:

- no broad `BoardStage` rewrite;
- no reopening ordinary design-system migration;
- no broad board navigation rewrite;
- no mobile chapter;
- no media chapter;
- no dice chapter.

## 7. Chapter-close expectations

At chapter end, the project should have a working alpha board-object control layer with the current base elements behaving as intended.

That means:

- board-object controls are described by one coherent chapter truth;
- the accepted `interactionButton` branch is used as the actual board-object control family baseline;
- the current image/object control layer reads as one coherent product surface;
- action semantics are explicit;
- state semantics are explicit;
- anchoring and interaction-space rules are explicit;
- residual exceptions are named and intentional;
- the chapter can close without pretending that note-card, token, mobile, media, or board navigation were solved inside it.

## 8. Inputs for this chapter

Current primary inputs:

- `docs/01_CURRENT_STATE/ROADMAP.md`
- `docs/00_AGENT_OS/CURRENT_CONTEXT.md`
- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/02_CANON/CANONICAL.md`
- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/01_AUDITS/CONTROL_INVENTORY.md`
- `docs/03_PRODUCT/03_INTERFACE_SYSTEM/03_ROLLOUT/CONTROL_STATE_MATRIX.md`
- `interaction-layer-design.md`
- `governance-runtime-design.md`

Review должен использовать эти документы как baseline truth до нового implementation pass.
