# Governance Scaffold Design — play-space-alpha

Статус: canonical architecture scaffold  
Область: lightweight governance grammar for rooms and objects  
Этот документ фиксирует минимальный governance scaffold, который архитектура `play-space-alpha` должна уметь нести.

## 1. Зачем нужен этот документ

Проекту нужен governance-capable architecture layer, но ещё не нужен full permission system.

Следующий полезный шаг — зафиксировать компактную общую grammar для governed entities:

- entity
- action
- required access level
- effective participant access level

Этот документ не определяет:

- полный permissions matrix;
- action-by-action policy;
- ownership transfer;
- broad role system;
- final room governance UX.

Он фиксирует только минимальный scaffold, чтобы будущие governance passes не начинались каждый раз с новой semantic model.

## 2. Core governance grammar

### Rule G1 — Governance starts from entities, not roles

Governance baseline в `play-space-alpha` должна строиться вокруг:

- governed entity;
- action on that entity;
- required access level for that action;
- effective access level of a participant relative to that entity.

Не from:

- large role catalog;
- broad permission table;
- implicit owner-only model.

### Rule G2 — Room and object entities use the same grammar

Комната и board objects должны мыслиться через одну и ту же governance grammar.

That means:

- room is a governed entity;
- each persisted board object is a governed entity;
- the same access vocabulary applies to both.

## 3. Canonical governance scaffold

### Governed entity

Every governed entity has:

- creator
- actions

Minimal entity shape:

```ts
type GovernedEntityKind = "room" | "board-object";

type GovernedEntityRef = {
  kind: GovernedEntityKind;
  entityType: string;
  entityId: string;
  creatorId?: string | null;
};
```

Notes:

- `creatorId` remains `creator`, not `owner`
- `creatorId` answers creation identity only
- room may also have `creatorId`

### Governed action

Every action has:

- `requiredAccessLevel`

Minimal action shape:

```ts
type GovernedAction = {
  actionKey: string;
  requiredAccessLevel: AccessLevel;
};
```

This document does not define the full action inventory.

### Effective access

Every participant has:

- `effectiveAccessLevel` relative to the entity

Minimal shape:

```ts
type EffectiveAccess = {
  participantId: string;
  accessLevel: AccessLevel;
};
```

This is entity-relative, not global.

## 4. Separation of creator vs effective access

### Rule G3 — Creator and effective access are separate concepts

`creatorId` and `effectiveAccessLevel` must not collapse into one concept.

They answer different questions:

- `creatorId`
  - who created this entity?
- `effectiveAccessLevel`
  - what can this participant do to this entity right now?

### Rule G4 — Creator does not automatically mean full access in the scaffold

The scaffold must not hardcode:

- creator == permanent full access

That may become true for some early policy defaults.
But that is later policy, not scaffold.

## 5. Canonical access-level model

Access levels are intentionally compact:

```ts
type AccessLevel = "none" | "non_destructive" | "full";
```

### `none`

- participant cannot perform governed actions on the entity

### `non_destructive`

- participant can perform safe/non-destructive entity actions
- exact meaning is intentionally deferred to later policy passes

### `full`

- participant can perform all governed actions defined for that entity

## 6. How the same grammar applies to room and object entities

## 6.1 Room entity

Room should be treated as a first-class governed entity.

Examples of later room actions may include:

- rename room
- change room-level settings
- reset room content

But this document does not assign access levels to them yet.

What matters now:

- room has creator semantics;
- room actions are described through `requiredAccessLevel`;
- participants have `effectiveAccessLevel` relative to the room.

## 6.2 Board object entity

Persisted board objects should use the same governance grammar.

Examples of later object actions may include:

- move
- edit
- resize
- delete

Again, this document does not assign policy yet.

What matters now:

- object may have creator semantics via `creatorId`;
- object actions are described through `requiredAccessLevel`;
- participants have `effectiveAccessLevel` relative to that object.

## 7. Relationship to current object semantics baseline

This scaffold sits on top of:

- `docs/03_PRODUCT/02_SEMANTICS/object-semantics-design.md`

Important relationship:

- object semantics doc defines creator semantics and actor/interacting semantics
- this governance scaffold defines how access should later be evaluated relative to governed entities

These are complementary layers:

- creator semantics != access
- actor/interacting semantics != access
- effective access is a separate governance layer

## 8. What explicitly waits for later policy passes

This document intentionally does not decide:

- which specific room actions require which access level
- which specific object actions count as `non_destructive`
- whether creator gets default `full`
- whether room-level access propagates to object-level access
- invite, moderator, admin, or role models
- governance UX
- override rules
- exceptions by object type

Those are later policy/design passes.

## 9. Canonical summary

### Minimal scaffold

Every governed entity has:

- creator
- actions

Every action has:

- `requiredAccessLevel`

Every participant has:

- `effectiveAccessLevel` relative to that entity

### Canonical access levels

- `none`
- `non_destructive`
- `full`

### Canonical separation

- `creatorId` = creation identity
- `effectiveAccessLevel` = current governance capability

These must remain separate concepts.

## 10. Recommended first implementation slice after docs

The narrowest first implementation slice after this document is:

1. introduce shared governance types only
   - `AccessLevel`
   - `GovernedEntityRef`
   - `GovernedAction`
   - `EffectiveAccess`
2. add room-level metadata shape that can carry `creatorId`
3. add one narrow helper contract for computing:
   - effective access level for a participant relative to an entity

Do not yet:

- enforce broad policy;
- wire a large action matrix;
- change current shared-board behavior.
