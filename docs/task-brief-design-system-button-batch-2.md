# Task Brief: Design System Button Batch 2

## Task

Finish the next ordinary/shared button migration batch by extending the shared
runtime button family to cover:

- media buttons
- entry primary CTA
- fixed add-image trigger

This pass should treat all of them as members of the shared ordinary button
family with subtype dimensions where needed, not as new button families.

## Goal

After this pass:

- media buttons use the shared button family through the accepted compact/toggle
  subtype direction;
- the entry primary CTA uses the shared button family through the accepted
  participant-accent primary direction;
- the fixed add-image trigger uses the shared button family rather than a local
  ad hoc clone;
- the button chapter moves forward in meaningful batches instead of one button
  at a time.

This is still structural migration first, not the final visual tuning pass.

## Constraints

Must not change:

- entry/join flow semantics
- media behavior
- board/object interaction behavior
- dice behavior
- `BoardStage` interaction logic

Out of scope:

- object-adjacent image controls
- transparent participant-panel text actions
- participant-panel micro-actions if they need their own local logic
- callout family
- row family
- swatch / pill family
- broad visual reconciliation

Additional constraints:

- structural migration first, visual tuning later
- do not invent new button families
- use subtype dimensions on top of the shared ordinary button family
- keep the pass narrow and do not let it widen into shell or overlay-system
  redesign

## Relevant context

The current shared ordinary button family already exists in runtime code.

Current accepted design-system direction:

- ordinary button family:
  - `primary`
  - `secondary`
  - `danger`
- scale:
  - `default`
  - `small`
- allowed subtype dimensions:
  - `participantAccent`
  - `toggle`

Accepted subtype mappings:

- dice buttons = `secondary` + participant-accent subtype
- title/hero participant-accent action = `primary` + selected-participant
  accent subtype
- media buttons should follow `secondary.small + toggle subtype`
- fixed add-image trigger should be treated as the same shared button class as
  dice buttons in a different placement/context, not as a separate family

Relevant docs:

- `docs/design-system-canonical-draft.md`
- `docs/design-system-migration-map.md`
- `docs/execplan-design-system-ordinary-interface-migration.md`
- `docs/task-brief-design-system-button-family-first-slice.md`
- `docs/task-brief-design-system-dice-button-subtype-slice.md`

## Files to inspect first

- `docs/design-system-canonical-draft.md`
- `docs/design-system-migration-map.md`
- `docs/task-brief-design-system-button-batch-2.md`
- `src/ui/system/families/button.ts`
- `src/ui/system/tokens.css`
- `src/App.tsx`
- `src/media/LiveKitMediaDock.tsx`
- `src/components/BoardStage.tsx`

## Deliverables

Return:

- Summary
- Files changed
- What changed
- Validation
- Risks / notes
- Suggested next step

Implementation deliverables:

1. The minimal shared button-family extensions needed for:
   - toggle subtype
   - participant-accent primary usage
   - fixed add-image trigger migration
2. Migrated media buttons
3. Migrated entry primary CTA
4. Migrated fixed add-image trigger
5. No widening into object-adjacent controls or unrelated control families

## Required subtype rules

### 1. Media buttons

Treat media buttons as:

- shared `secondary.small`
- plus toggle subtype

Working rule:

- keep shared button geometry
- keep shared button focus/disabled structure
- toggle should override the tone layer only
- do not invent a separate media-button family

### 2. Entry primary CTA

Treat the entry primary CTA as:

- shared `primary`
- plus selected-participant accent subtype

Working rule:

- this remains part of the ordinary button family
- accent should override the tone layer
- do not invent a separate CTA family

### 3. Fixed add-image trigger

Treat the fixed add-image trigger as:

- shared button family member
- same class of button as dice buttons
- different placement/context only

Working rule:

- do not treat its floating/fixed placement as proof of a separate button
  family
- only the button recipe should migrate here, not a broader overlay-system
  redesign

## Validation

Required:

- `npm run build`

Manual QA if practical:

- entry primary CTA still joins normally
- media buttons still perform the same actions
- media toggle buttons still read clearly as toggled on/off
- fixed add-image trigger still works
- focus treatment remains visible where reachable
- disabled/toggle behavior still works where exercised

If manual QA is not actually run, say so explicitly.

## Stop conditions

Stop and report instead of widening if:

- media buttons require a deeper custom family rather than a toggle subtype
- the fixed add-image trigger starts pulling in broader overlay-system redesign
- entry CTA needs a deeper custom family rather than `primary + participantAccent`
- the pass starts touching object-adjacent image controls
- the pass turns into a visual-tuning/reconciliation chapter
