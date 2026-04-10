# Governance Runtime Design — play-space-alpha

Статус: current runtime / implementation design source  
Область: helper shapes, runtime wiring, current rollout state, inspectability  
Этот документ фиксирует, как governance model сейчас реализован в runtime и где именно он проходит через app code.

Логика governance model и future policy matrices живут отдельно в:

- `docs/governance-model-design.md`

## 1. Purpose and scope

Этот документ нужен, чтобы не смешивать:

- governance logic/model

with

- current runtime implementation state

Он фиксирует:

- current helper shapes
- current runtime action inventory
- current runtime classification matrix
- current room/object wiring
- permissive rollout status
- Dev tools inspectability

Он не является canonical home для future policy matrices.

## 2. Current runtime shapes

Current runtime implementation in `src/lib/governance.ts` includes:

```ts
type AccessLevel = "none" | "non_destructive" | "full";
```

```ts
type GovernanceActionKey =
  | "room.add-token"
  | "room.add-image"
  | "room.add-note"
  | "room.reset-board"
  | "board-object.move"
  | "board-object.edit"
  | "board-object.delete"
  | "board-object.resize"
  | "board-object.draw";
```

```ts
type GovernedActionAccessResolution = {
  entity: GovernedEntityRef;
  action: GovernedAction;
  effectiveAccess: EffectiveAccess | null;
  isAllowed: boolean;
};
```

## 3. Current runtime helpers

Current runtime helper path:

- `createRoomGovernedEntityRef(...)`
- `createBoardObjectGovernedEntityRef(...)`
- `getEffectiveAccessLevel(...)`
- `classifyGovernedAction(...)`
- `resolveGovernedEntityAccess(...)`
- `hasRequiredAccessLevel(...)`
- `resolveGovernedActionAccess(...)`
- `resolveBoardObjectDeletePolicyAccess(...)`

### Current runtime resolution order

1. create room/object governed entity ref
2. classify current action
3. resolve effective access
4. compare effective access vs required access
5. return full action resolution object

## 4. Current runtime wiring

### Room-level wiring

`src/App.tsx` currently:

- constructs room governed entity refs
- resolves room effective access
- passes room governance context into `BoardStage`

### Board/runtime wiring

`src/components/BoardStage.tsx` currently routes current interaction surfaces through governance helpers for:

- `room.add-token`
- `room.add-image`
- `room.add-note`
- `room.reset-board`
- `board-object.move`
- `board-object.edit`
- `board-object.delete`
- `board-object.resize`
- `board-object.draw`

This means governance runtime is already exercised by real room/object actions rather than existing only as dead scaffold.

## 5. Current runtime classification matrix

Current runtime classification is:

| Action | Required access now |
| --- | --- |
| `room.add-token` | `none` |
| `room.add-image` | `none` |
| `room.add-note` | `none` |
| `room.reset-board` | `full` |
| `board-object.move` | `none` |
| `board-object.edit` | `none` |
| `board-object.delete` | `full` |
| `board-object.resize` | `none` |
| `board-object.draw` | `none` |

Important:

- this is the current runtime classification matrix;
- only `board-object.delete` is now backed by a real restrictive policy rule;
- ordinary shared board actions now intentionally use `none`;
- the rest is not yet the final restrictive policy matrix;
- canonical future policy matrices belong in `docs/governance-model-design.md`.

## 6. Current rollout state

Current runtime governance is real but intentionally permissive.

In practice:

- room access currently resolves through permissive defaults
- ordinary shared room/object actions now require no special governance access by classification
- `board-object.delete` is now the first real restrictive policy family
- visible product behavior remains intentionally unchanged except for object deletion policy

This is deliberate.

The project needed:

1. real runtime path
2. real inspectability
3. only later broader restrictive policy tightening

### Current enforced delete rule

Current runtime now enforces:

- object creator may delete their own object
- room creator may delete any board object in that room
- other participants may not delete someone else's board object

This is currently implemented in `src/lib/governancePolicy.ts` as a narrow room-to-object creator override, not as a general nested-entity inheritance engine.

## 7. Inspectability

Current governance runtime is inspectable in Dev tools.

The current `Governance` block in Dev tools exposes:

- room governance summary
- selected-object delete governance summary
- recent action resolution trace

This exists because governance runtime is otherwise mostly invisible while policy remains permissive.

That inspectability surface is:

- development-facing
- lightweight
- not end-user governance UI

## 8. Room metadata/runtime interaction

Room runtime governance currently interacts with room metadata through:

- `RoomRecord.creatorId`

Creator semantics are real runtime inputs, but current permissive runtime does not yet tighten access based on creator-specific policy.

Current exception:

- `board-object.delete` now uses object creator semantics plus a room-creator override

## 9. Rules for future implementation passes

When changing governance runtime:

1. keep `docs/governance-model-design.md` as the source of governance logic/policy structure
2. update this document when helper shapes, runtime wiring, inspectability, or rollout state changes materially
3. do not let provisional runtime wiring become the de facto policy source

If a pass changes actual canonical policy structure or future matrices:

- update `docs/governance-model-design.md`

If a pass changes runtime wiring or rollout shape:

- update this document

## 10. Relationship to other docs

Read together with:

- `docs/governance-scaffold-design.md`
- `docs/governance-model-design.md`
- `docs/object-semantics-design.md`

Relationship:

- scaffold doc = minimal grammar
- model doc = stable governance logic and future matrices
- runtime doc = current implementation state and mechanism details
- object semantics doc = creator/actor baseline for object-side governance inputs

## 11. Canonical summary

Current governance runtime in `play-space-alpha` is:

- real
- runtime-wired
- inspectable in Dev tools
- still permissive by default

It is the implementation layer for the governance model, not the canonical source of governance policy meaning.
