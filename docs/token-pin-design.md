# Token Pin Design

Status: canonical near-term token design source  
Scope: token role, token pin behavior, later attachment direction

This document defines the intended token model for the current product stage.

It replaces the older implicit direction where token was treated mainly as a normal generic board object variant.

This is not:

- a full map/grid/gameplay system;
- a creature/entity rules model;
- a full object-system redesign;
- an immediate image-attachment implementation plan.

## 1. Canonical token pin model

Token should now be understood as a **pin**.

Near-term meaning:

- token marks a participant's place or activity on the map;
- in current product use, the map is usually an image on the board;
- token is anchored to a board point;
- token anchor is its center point;
- token should read as a viewport-stable participant marker, not as a scaling board card/object.

This is the canonical direction going forward.

## 2. What is superseded

The following old token assumptions are now superseded:

- token as a generic placeholder board object;
- token as a normal scaling board object by default;
- token as a label-first object;
- token as just another freeform rectangular board item.

Tokens are now specialized map markers first.

## 3. Board-anchor rule

Token anchor should be:

- a single board-space point;
- specifically the token center point.

This means the primary stored token position should conceptually answer:

- where is this marker anchored on the board?

not:

- where is the token's top-left object box?

The board point moves with board/camera transforms naturally because it is still in board coordinates.

## 4. Viewport-stable size rule

Token size should remain visually stable relative to the viewport.

That means:

- zooming the board should not make the token behave like a normal scaling board object;
- only its anchored board position should move with camera/board transforms;
- token body, selection treatment, and controls should all stay viewport-stable in size.

Exception:

- token-related line thickness may still scale with the board/object if that preserves spatial readability better than a fully fixed stroke width.

This is the key distinction between token-as-pin and token-as-normal-object.

## 5. Layer rule

Token should render:

- above board content such as map/image surfaces;
- below fixed UI chrome such as panels, attached controls, and dice/media overlays.

So token belongs to the board interaction layer, but not to the topmost UI layer.

## 6. Drag rule

Near-term drag behavior should remain simple:

- dragging a token moves its anchor point on the board;
- participant can move the token freely between maps/images/areas;
- no attachment logic is required for the first slice.

This keeps token useful immediately without forcing the attachment chapter early.

Conflict rule for later system work:

- if another participant is currently moving a token, that state should be expressed through the project's standard occupied/blocked movable-object indication language;
- token should not invent a separate ad hoc conflict signal model;
- this should stay aligned with the broader movable-object interaction system so the same conflict semantics can later apply to other draggable objects too.

## 7. Selection and controls rule

Selection treatment and any future token controls should follow the same pin logic:

- selection should be centered on the token anchor;
- selection should remain viewport-stable in size;
- controls, if/when added, should be positioned relative to the token and remain viewport-stable.

Token should not inherit the selection/control language of a normal resizable board object.

## 8. Future attachment rule

Later, token should be able to attach to board objects, most importantly images.

Target direction for that later chapter:

- if placed onto an image/map, token may attach to it;
- attached token should move with the image;
- attached token may later scale with the image if that model proves useful.

But this belongs to a later token-attachment chapter.

The first token pin slice should not solve:

- attachment gestures;
- relative local coordinates on the image;
- attached token scale rules;
- detach/reattach UX;
- object ownership/permissions implications.

## 9. What drag/selection questions are intentionally deferred

Deferred for later:

- exact token hit area vs visual radius;
- whether token drag should prefer board-plane or object-attachment drop targets;
- how token controls should appear when selected;
- whether token should have labels, badges, or participant initials;
- whether token should support multiple visual variants per participant.

These should remain open until the pin model itself is implemented cleanly.

## 10. Recommended first implementation slice

The first implementation slice should be:

1. keep token board-placed and shared;
2. treat token position as center-anchor semantics;
3. render token at viewport-stable size;
4. render token selection at viewport-stable size;
5. keep token draggable without attachment behavior.

This is enough to make token clearly behave as a pin without broadening into the later attachment chapter.

## 11. Why this matters

This token reset changes future review questions from:

- is token a sufficiently flexible generic object?

to:

- does token behave like a clear participant map marker?
- does token remain readable over a board image/map?
- does token preserve the later path toward optional object attachment?
