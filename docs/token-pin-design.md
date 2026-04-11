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

## 8. Canonical attachment model

The next token chapter is object attachment, with `image` as the first practical runtime user.

Canonical rule:

- attachment source of truth lives on the token object itself;
- token may be `free` or `attached`;
- first runtime attachment target is `image`;
- attachment stores normalized parent-local coordinates;
- attached token position is derived from current parent bounds;
- token remains viewport-stable in size even when attached.

This should be treated as canonical token semantics, not as a room/session feature and not as a temporary visual trick.

### 8.1. Attachment source of truth

Attachment should not live in room metadata or in a separate attachment registry.

It should live on the token object itself as token-local placement semantics.

This keeps attachment:

- shared with the token through the existing token sync path;
- local to token runtime/data ownership;
- compatible with both free and attached token behavior.

### 8.2. Canonical attachment data model

Recommended canonical model:

```ts
type TokenAttachment =
  | {
      mode: "free";
    }
  | {
      mode: "attached";
      parentObjectId: string;
      parentObjectKind: "image" | "text-card" | "token";
      coordinateSpace: "parent-normalized";
      anchor: {
        x: number;
        y: number;
      };
    };
```

Meaning:

- `mode: "free"` means the token anchor is interpreted directly in board space;
- `mode: "attached"` means the token anchor is interpreted relative to the parent object;
- `anchor.x` and `anchor.y` are normalized parent-local coordinates:
  - `0,0` = top-left of the parent bounds;
  - `1,1` = bottom-right of the parent bounds.

Normalized parent-local coordinates are the preferred first model because they make parent move and parent resize behavior simple and stable.

### 8.3. First image-first attachment rule

The first runtime user should be `image`.

In that first slice:

- token may be free or attached to one image;
- attached token render position should be derived from the image's current `x/y/width/height`;
- image is the first supported parent kind in runtime even if the data model is written more generally.

### 8.4. Parent move rule

When the parent image moves:

- attached token should move with it automatically;
- the token should preserve its normalized relative anchor point on that image.

Conceptually:

- `renderX = parent.x + parent.width * anchor.x`
- `renderY = parent.y + parent.height * anchor.y`

### 8.5. First resize/scale rule

The first resize/scale rule should stay simple:

- attached token position should update with the parent's current bounds;
- attached token should keep the same normalized point on the parent;
- token visual size should remain viewport-stable;
- token should not scale with the parent in the first slice.

This preserves the token-as-pin model even while allowing attachment.

### 8.6. What the first attachment slice should not solve

The first attachment slice should not solve:

- attachment gestures;
- broad detach/reattach UX;
- token drop-target heuristics;
- attached token scale-following parent;
- object ownership/permissions implications.

## 9. Attached dependents and effective bounds

Attachment introduces a **dependency hierarchy** for geometry and interaction follow.

Near-term meaning:

- board object remains the parent geometry source;
- attached pin, attached controls, and similar object-scoped attached surfaces are dependents of that parent object;
- those dependents should feel like part of the same live object scene during interaction.

Important boundary:

- this should not yet be treated as a full scene-graph or permissions tree;
- attachment creates geometry/interation dependency first;
- governance/policy inheritance, if ever needed later, should remain a separate explicit decision.

### 9.1. Product vision for attached dependents

In the intended product:

- attached pins should feel locked to the parent object;
- attached controls should feel anchored to the parent object;
- attached object-scoped surfaces should move/read as one visual unit with the parent during local interaction;
- during remote/shared interaction, they should remain truthful to the best available shared live state.

The user should perceive:

- this object, with its dependents, is moving or resizing right now

not:

- one object plus a separate layer catching up afterward.

### 9.2. Effective bounds model

Attached dependents should not each resolve parent geometry independently.

They should eventually read from one shared concept:

- `effectiveBounds(objectId, viewerContext)`

Resolution priority should be:

1. local live interaction bounds
   - the most immediate local node/ref-driven geometry while this client is actively dragging or transforming the object
2. shared live preview bounds
   - the best available room-visible live preview geometry
3. committed bounds
   - normal persisted/shared object geometry

This is the desired architectural direction for attached dependents.

### 9.3. What should eventually read from effective bounds

The future effective-bounds family should cover:

- attached pins/tokens;
- attached controls;
- attached preview-aligned chrome;
- occupied/interaction frames that need the live manipulated geometry;
- future object-scoped dependent affordances.

This does not require a broad scene-graph rewrite.
It means these surfaces should share one dependency-resolution model instead of each growing their own follow logic.

## 10. What remains deferred

Deferred for the first attachment chapter:

- support for non-image parent kinds in runtime;
- rotation-aware attachment math;
- auto-attach and drag-away detach semantics;
- richer detach/reattach controls;
- multiple attachment modes;
- parent-aware control surfaces;
- gameplay/grid/rules semantics.

## 11. What drag/selection questions are intentionally deferred

Deferred for later:

- exact token hit area vs visual radius;
- whether token drag should prefer board-plane or object-attachment drop targets;
- how token controls should appear when selected;
- whether token should have labels, badges, or participant initials;
- whether token should support multiple visual variants per participant.

These should remain open until the pin model and first attachment model are implemented cleanly.

## 12. Recommended first implementation slice

The first attachment implementation slice should be:

1. add token-local optional attachment metadata;
2. support `image` as the first runtime parent kind;
3. store attached position as normalized parent-local coordinates;
4. derive attached token render position from current image bounds;
5. keep token viewport-stable in size while attached;
6. leave free-token behavior unchanged when no attachment exists.

This is enough to prove the attachment model without broadening into attach UX or a larger object-system redesign.

## 13. Why this matters

This token reset changes future review questions from:

- is token a sufficiently flexible generic object?

to:

- does token behave like a clear participant map marker?
- does token remain readable over a board image/map?
- does token preserve the later path toward optional object attachment?
- does the attachment model stay honest to the token-as-pin rule?
- do attached dependents read from one coherent effective-bounds model rather than separate catch-up paths?
