# Design System Working Principles

Status: working chapter rules  
Scope: how to audit, model, and roll out a project-wide design system in `play-space-alpha`

This document exists to keep future design-system work narrow, structured, and
honest.

It is not the design system itself yet.

Its purpose is to define **how we work on the design-system chapter** so that
future passes do not drift into ad hoc UI cleanup or broad speculative rewrites.

## 1. Chapter goal

The project should eventually gain a design system for the whole UI surface, not
only for one local area such as the interaction layer.

That design system should be built through:

1. audit
2. model
3. narrow rollout

Not through:

- isolated visual cleanup passes;
- local token invention without a wider inventory;
- broad rewrite-first behavior.

This chapter should be treated as a **foundational pass**, not as a recurring
from-scratch exercise.

The intended result is:

- after this chapter, the project should have a working design-system base;
- later UI work should primarily **use that base**;
- future passes should extend or refine the design system where needed, not
  restart its structure from zero each time.

## 2. Token framing

The project should reason about tokens through three layers:

### 2.1. Primitive tokens

Raw reusable values such as:

- colors
- spacing steps
- radii
- stroke widths
- opacities
- typography scales
- shadows
- z-index tiers
- motion values where relevant

### 2.2. Semantic tokens

Meaningful role-based values such as:

- interaction frame stroke
- panel background
- muted text
- blocked state color
- preview state treatment
- selection emphasis

### 2.3. Component tokens

Component- or family-specific resolved values such as:

- image attached-controls gap
- token selection ring width
- note-card frame radius
- panel padding
- ops card spacing

The design-system chapter should keep these layers separate rather than letting
raw values and semantic meaning collapse into one layer.

## 3. Required chapter order

The design-system chapter should proceed in this order:

### Phase 1. Whole-project token audit

Audit the current project for:

- primitive-like values already in use
- semantic-like values already implied in runtime
- component-local magic numbers

This phase is inventory-only.

### Phase 2. Base component audit

Identify:

- which component families already exist
- where the same pattern repeats ad hoc
- what runtime variants already exist

This phase is still read-only.

### Phase 3. System-layer audit

Identify the major UI systems/surfaces, such as:

- interaction layer
- control layer
- room shell / entry flow
- ops surface
- other meaningful UI systems

This phase defines boundaries and usage contexts.

### Phase 4. Audit synthesis / decision pass

Before defining the canonical model, the project should explicitly interpret the
audit results.

This phase should answer:

- what discovered values/components are candidates for canon
- what is likely drift rather than design intent
- what should remain intentional exception
- what should be left untouched for now
- what the highest-value early change targets are

This phase exists so the chapter does not jump straight from inventory to model
without making its judgments explicit.

This phase should also be treated as a **user-involved alignment phase**, not
as an autonomous agent-only conclusion.

That means:

- the findings should be reviewed in detail with the user;
- proposed canon/drift/exception judgments should be discussed explicitly;
- the chapter should not proceed to the canonical model until it is clear that
  the proposed direction matches what the user actually wants from the product.

### Phase 5. Dependency map

Map:

- primitive tokens -> semantic tokens -> component tokens
- components -> systems

And explicitly identify:

- skipped layers
- mixed responsibilities
- local ad hoc dependency edges

### Phase 6. Canonical model

Only after the audits and dependency map should the project define:

- the canonical token layers
- the canonical component-token strategy
- the canonical system-dependency rules

### Phase 7. Narrow rollout plan

Only after the canonical model exists should the project choose one narrow
implementation slice.

Rollout should happen system-by-system or family-by-family, not as a broad
rewrite wave.

At that stage, it becomes reasonable to add a small internal design-system
preview/sandbox surface for inspection and validation.

That support surface may later show:

- token values and swatches
- spacing/radius/stroke samples
- component-family variants
- interaction-layer chrome examples

It should be treated as a rollout aid, not as a substitute for the audit/model
phases.

## 4. Read-only-first rule

Design-system work should default to read-only first.

Implementation-first is only acceptable when:

- the canonical model for the touched area is already explicit;
- the rollout slice is narrow;
- the risk surface is known;
- the pass is not inventing new system structure on the fly.

## 5. No-go behaviors

The design-system chapter should not become:

- a broad visual rewrite for its own sake;
- a generic design-system exercise detached from the actual runtime;
- an excuse to refactor large integration surfaces casually;
- a cleanup wave that hides product or interaction semantics changes.

Specifically:

- do not broad-rewrite `BoardStage` under the banner of design-system work;
- do not mix design-system rollout with unrelated product behavior changes;
- do not treat current accidental runtime values as automatically canonical;
- do not let one local subsystem define the whole system prematurely.

## 6. Relationship to existing layer model

The design-system chapter should respect the existing layer framing:

- object layer
- interaction layer
- control layer
- presence layer
- special interaction systems

But it must also go beyond that framing by defining:

- which tokens exist across the project
- which components exist across the project
- which systems consume which components and token layers

In other words:

- the layer model is a system map
- the design-system chapter must connect that map to token and component structure

## 7. Interaction layer special note

The interaction layer already has stronger explicit foundations than the rest of
the project:

- canonical interaction-layer definition
- canonical interaction-state matrix
- canonical object-anchored / viewport-stable rule
- working sizing audit

That makes it a strong future rollout candidate.

But it should still be rolled out as part of the broader design-system chapter,
not mistaken for the whole design system by itself.

## 8. Chapter principle

The governing rule for this chapter is:

**Audit first, then model, then rollout.**

If a future pass tries to skip that order, it should stop and reframe itself.

Once the chapter has reached a stable base, the governing follow-up rule becomes:

**Use the design system first; extend it when necessary; do not restart it from scratch.**
