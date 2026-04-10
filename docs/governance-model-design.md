# Governance Model Design — play-space-alpha

Статус: canonical governance logic/model source  
Область: governance vocabulary, entities, actions, access model, policy structure  
Этот документ фиксирует governance model `play-space-alpha` как relatively stable logic/policy layer.

Техническая реализация, current runtime state, helper wiring и inspectability details живут отдельно в:

- `docs/governance-runtime-design.md`

## 1. Purpose and scope of governance

Governance в `play-space-alpha` отвечает за один конкретный вопрос:

> как определить, может ли participant выполнить действие над room или persisted board object?

Этот документ задаёт:

- governance vocabulary;
- governed entities;
- action model;
- access levels;
- effective access logic;
- room/object policy structure;
- canonical place for future policy matrices.

Этот документ не задаёт:

- broad role system;
- ownership transfer;
- moderation/admin chapter;
- final governance UX;
- implementation wiring details;
- current runtime rollout details.

## 2. Canonical terms

### Governance

System for evaluating whether a participant is allowed to perform an action on a governed entity.

### Governed entity

Entity against which governance is evaluated.

Current governed entity families:

- room
- persisted/shared board object

### Action

Named governed operation on an entity.

### Required access level

Minimum access level required for a governed action.

### Effective access level

Current access level of a participant relative to a specific governed entity.

### Policy

Rules that determine:

- which governed actions exist;
- which access level each action requires;
- how participant effective access is resolved for each entity.

## 3. Governed entities

Governance starts from entities, not roles.

Canonical entity shape:

```ts
type GovernedEntityRef = {
  kind: "room" | "board-object";
  entityType: "room" | BoardObjectKind;
  entityId: string;
  creatorId?: string | null;
};
```

### Room entity

Room is a first-class governed entity.

Room policy is evaluated relative to the room itself.

Room already has:

- creator semantics
- room initialization/baseline semantics

But those concerns are not themselves governance policy.

### Board object entity

Each persisted/shared board object is a governed entity.

Object governance depends on the object semantic baseline from:

- `docs/object-semantics-design.md`

If creator semantics exist, canonical identity field remains:

- `creatorId`

## 4. Action model

Every governed action has:

- stable action key
- governed entity
- required access level

Canonical action shape:

```ts
type GovernedAction = {
  actionKey: string;
  requiredAccessLevel: AccessLevel;
};
```

This document defines the model of governed actions.

The current runtime-covered action inventory lives in:

- `docs/governance-runtime-design.md`

Future policy work should extend the canonical action inventory here once governance policy becomes less provisional.

## 5. Access levels

Canonical access vocabulary remains intentionally compact:

```ts
type AccessLevel = "none" | "non_destructive" | "full";
```

### `none`

- no governed access to the entity

### `non_destructive`

- enough access for safe/non-destructive actions

### `full`

- enough access for all governed actions defined for that entity

Important:

- these levels are stable model concepts;
- exact action-to-level assignments may tighten over time;
- later policy passes may refine what counts as `non_destructive`.

## 6. Effective access logic

Effective access is entity-relative, not global.

Canonical logical shape:

```ts
type EffectiveAccess = {
  participantId: string;
  accessLevel: AccessLevel;
};
```

Logical governance evaluation has this shape:

1. identify governed entity
2. identify governed action
3. determine required access level for that action
4. resolve effective access level for the participant relative to that entity
5. compare required access vs effective access
6. produce allow/deny result

### Creator vs effective access

Creator identity and effective access stay separate.

- `creatorId` answers: who created the entity?
- `effectiveAccessLevel` answers: what can this participant do right now?

The model must not collapse them into one concept.

Creator information may later influence policy defaults, but:

- creator semantics are not access semantics;
- creator does not automatically mean permanent `full` by definition of the model.

## 7. Policy matrices

This document is the canonical future home for governance policy matrices.

Policy matrices should eventually describe:

- governed action inventory
- required access by action
- whether creator status matters
- whether room-level access propagates to object-level access
- exceptions by entity type

Preferred structure:

### Room policy matrix

| Action | Required access | Notes |
| --- | --- | --- |

### Object policy matrix

| Entity type | Action | Required access | Notes |
| --- | --- | --- | --- |

Current runtime classification matrix remains documented in:

- `docs/governance-runtime-design.md`

That runtime matrix should move here only when policy decisions become canonical rather than provisional/permissive rollout details.

### First real policy now fixed

The first restrictive governance policy now fixed in the project is:

#### Object delete policy

| Entity type | Action | Required access | Notes |
| --- | --- | --- | --- |
| any current board object | `board-object.delete` | `full` | object creator may delete own object; room creator may delete any room object; other participants may not delete another participant's object |

## 8. Room/object policy structure

Governance policy in this project should be structured in this order:

1. define governed entity
2. define governed action
3. define required access level for that action
4. define how participant effective access is resolved relative to that entity
5. evaluate allow/deny

Not in this order:

1. invent broad role catalog first
2. attach rules loosely to UI surfaces
3. infer access from creator semantics alone

### Room policy

Room policy should describe:

- room-scoped actions
- room-level effective access resolution
- possible propagation rules to room-owned concerns later

### Object policy

Object policy should describe:

- object-scoped actions
- object-level effective access resolution
- whether object creator semantics matter in policy

Current real policy direction already includes one explicit parent-to-child creator rule in the currently real scope:

- room creator may receive `full` delete access for room objects

This is not yet a general nested-entity inheritance system.
It is a narrow current rule for:

- room -> room objects

## 9. Rules for adding new governed actions

When adding a new governed action:

1. decide which entity it belongs to
2. add a stable action key
3. decide which access level it should require
4. place or update its policy entry in the canonical matrix structure
5. update runtime implementation separately

Implementation wiring details belong in:

- `docs/governance-runtime-design.md`

Do not:

- add governance behavior without a governed action key if it belongs to the governance model
- hide governance decisions only inside ad hoc UI checks
- let runtime implementation become the only source of truth for policy structure

## 10. Open questions / deferred items

This document intentionally defers:

- first restrictive policy pass
- creator-vs-non-creator default policy
- room-to-object inheritance rules
- role model decisions
- moderation/admin model
- final governance UX
- exceptions by future object types

These are future policy/design passes.

Important nuance:

- the first restrictive delete policy now exists
- but broad room/object policy is still intentionally incomplete

## 11. Relationship to other docs

This document should be read together with:

- `docs/governance-scaffold-design.md`
- `docs/object-semantics-design.md`
- `docs/governance-runtime-design.md`

Relationship:

- `docs/governance-scaffold-design.md`
  fixes the minimal governance grammar
- `docs/object-semantics-design.md`
  fixes creator/actor semantics for board objects
- `docs/governance-runtime-design.md`
  describes helper shapes, runtime wiring, current rollout state, and inspectability
- this document
  is the canonical logic/model source and the future home for policy matrices

## 12. Canonical summary

The governance model of `play-space-alpha` is:

- entity-based
- action-based
- access-level-based
- creator-aware but not creator-collapsed
- structured for future room/object policy matrices

This is the stable governance logic layer.
