# Object Semantics Design — play-space-alpha

Статус: canonical semantic spec  
Область: persisted creator semantics, transient actor/interacting semantics  
Этот документ фиксирует объектную semantic baseline для `play-space-alpha`.

## 1. Зачем нужен этот документ

Проект приближается к будущей governance work, но следующий полезный фундамент — не permissions matrix, а нормализованная объектная семантика.

Нужно явно различать два вопроса:

1. кто создал объект;
2. кто действует на объект прямо сейчас.

Это разные слои.

Этот документ не определяет:

- permissions;
- authority policy;
- owner-only actions;
- destructive vs non-destructive access rules.

Он определяет только semantic model, чтобы новые object types и cleanup passes не принимали эти решения случайно.

## 2. Основные термины

### Creator semantics

Persisted semantic answer to:

> кто создал этот объект?

Это identity-level metadata, а не permission layer.

### Actor / interacting semantics

Transient shared answer to:

> кто действует на этот объект прямо сейчас?

Это runtime/realtime layer для in-progress interaction, previews, locks, editing cues и других live collaboration signals.

### Deliberate absence

Для некоторых object types один из этих semantic layers может быть не нужен.

Но отсутствие должно быть:

- осознанным;
- documented;
- justified by object behavior.

Оно не должно быть accidental omission.

## 3. Canonical creator semantics rule

### Rule C1 — Every persisted board object must explicitly decide creator semantics

Для каждого persisted/shared board object type нужно явно решить одно из двух:

- object has creator semantics;
- object intentionally has no creator semantics.

### Rule C2 — If creator semantics exist, canonical identity field is `creatorId`

Если объект имеет persisted creator semantics, canonical field is:

- `creatorId`

Этот field отвечает только на identity question:

> кто создал объект?

Он не означает:

- ownership in permission sense;
- exclusive edit rights;
- governance authority.

### Rule C3 — Creator semantics are persisted object semantics

Если `creatorId` существует, он должен жить в persisted/shared object state, а не только в transient awareness/runtime hints.

### Rule C4 — Visual neutrality and creator semantics are compatible

Object may:

- have creator semantics;
- but remain visually neutral in normal rendering.

То есть:

- creator semantics != mandatory creator-colored rendering

Особенно это важно для neutral shared objects like images.

## 4. Canonical actor/interacting semantics rule

### Rule A1 — Any shared in-progress interaction must explicitly decide actor semantics

Если object type поддерживает shared live interaction cues, нужно явно решить:

- actor/interacting semantics exist here;
- or they intentionally do not exist here.

### Rule A2 — Actor/interacting semantics are transient/shared runtime state

Actor semantics не должны silently записываться в persisted object body как normal canonical object state.

Их место:

- awareness;
- transient realtime payloads;
- ephemeral preview/lock/editing state;
- short-lived shared event state.

### Rule A3 — Canonical transient actor payload uses participant fields

If actor/interacting semantics exist, canonical field names are:

- `participantId`
- `participantName`
- `participantColor`

Это означает:

- who is acting now;
- how to label that actor;
- how to render current live interaction cues.

### Rule A4 — Actor semantics describe current action, not historical creator affiliation

Transient actor/interacting semantics should answer:

- who is dragging;
- who is editing;
- who is drawing;
- who is holding a lock;
- who produced the current shared transient event.

Они не должны masquerade as creator semantics.

## 5. Current repo-aligned interpretation

Текущая repo reality already points in this direction:

- tokens and text-cards already use `creatorId`;
- image strokes already use `creatorId`;
- text-card editing presence already uses participant actor fields;
- image drawing locks and preview cues already use participant actor fields;
- dice shared events already use actor identity fields.

Текущая main inconsistency:

- `image` still lacks normalized `creatorId`;
- `authorColor` still carries mixed historical/fallback meaning.

## 6. Required checklist for new object types

Before adding a new persisted/shared object type, answer all of these explicitly:

### 6.1 Creator semantics

1. Does this object have creator semantics?
2. If yes, where is `creatorId` stored?
3. If no, why is creator semantics intentionally absent?
4. If the object is visually neutral, is creator identity still persisted anyway?

### 6.2 Actor/interacting semantics

1. Does this object support shared in-progress interaction?
2. If yes, what transient actor payload exists?
3. Does it use:
   - `participantId`
   - `participantName`
   - `participantColor`
4. Where does that payload live:
   - awareness
   - transient shared state
   - ephemeral shared event
5. If no actor semantics exist, is that intentional and acceptable for this object type?

### 6.3 Persistence boundary

1. Which semantics are persisted?
2. Which semantics are transient only?
3. Are we accidentally using visual fallback fields as identity fields?

## 7. Transitional note about `authorColor`

`authorColor` currently exists in parts of the repo, but it should be treated
as transitional implementation residue rather than as canonical object
semantics.

Important rules:

- `authorColor` must not silently stand in for canonical creator identity
- `authorColor` must not silently stand in for canonical creator-color truth

Canonical semantic model:

- persisted/shared object truth should store `creatorId`
- current creator-linked color should resolve from the participant currently
  assigned to that id

Allowed transitional role:

- temporary migration residue while old object fields still exist in runtime

Disallowed semantic shortcuts:

- treating `authorColor` as if it answers “who created this object?”
- treating `authorColor` as if it answers “what color should this creator-linked
  object canonically be right now?”

Those answers belong to:

- `creatorId`
- current participant-color resolution for that id

## 8. What this document does not decide

This document does not decide:

- who is allowed to move what;
- whether creators get special rights;
- whether some objects should become protected;
- governance policy by object type;
- moderation/admin layers.

Those are later policy questions.

This document only fixes the semantic vocabulary those future layers will depend on.

## 9. Canonical summary

### Persisted creator semantics

- explicit per object type;
- canonical field: `creatorId`;
- may exist even for visually neutral objects;
- not equal to permission ownership.

### Transient actor/interacting semantics

- explicit per interaction-capable object type;
- canonical fields:
  - `participantId`
  - `participantName`
  - `participantColor`
- belongs in transient shared runtime state;
- not in canonical persisted object body unless the object itself is an event-type artifact.

### Explicit absence

If creator or actor semantics are absent for an object type, that absence must be deliberate and documented.

## 10. Recommended first implementation slice after docs

The safest first cleanup slice after this document is:

- normalize `image` creator semantics by adding explicit `creatorId`

while preserving:

- neutral image rendering in normal UI;
- existing transient actor semantics for image drawing/preview flows.

That is the narrowest next move because it closes the biggest current semantic gap without drifting into permissions or governance policy.
