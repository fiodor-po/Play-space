## Task

Implement a temporary UI hover debug inspector that identifies already-migrated
design-system controls under the cursor.

## Goal

After this pass:

- migrated controls can expose lightweight design-system ownership metadata
- when the debug inspector is enabled, hovering a migrated control shows a small
  marker near the cursor describing that control
- the mechanism applies only to already-migrated controls and future migrated
  controls
- the mechanism is easy to disable later

This is a debug/inspectability mechanism, not a new product control family.

## Constraints

Must not change:

- product interaction behavior
- control semantics
- room/bootstrap/recovery behavior
- `BoardStage` interaction behavior

Out of scope:

- broad debug-tools redesign
- visual redesign of controls
- migration of unmigrated local controls
- permanent product UI additions

Additional constraints:

- only migrated controls should participate
- the mechanism should be lightweight and easy to remove or switch off
- do not require wiring every old local control into the system
- prefer one shared mechanism over per-family ad hoc debug code

## Relevant context

The project now has a growing runtime design-system substrate and multiple
migrated control families:

- fields
- buttons
- selection controls

What is needed now is a cheap way to inspect migration coverage and identify
which control family/variant/subtype is under the cursor while testing UI
changes.

This should be treated as a debug-layer inspectability affordance, not as a new
design-system family.

## Files to inspect first

- `src/ui/system/`
- `src/App.tsx`
- `src/index.css`
- migrated family modules under `src/ui/system/families/`

## Deliverables

Return:

- Summary
- Files changed
- What changed
- Validation
- Risks / notes
- Suggested next step

Implementation deliverables:

1. A lightweight shared mechanism for tagging migrated controls with debug
   metadata
2. A lightweight hover inspector overlay or marker that activates only when the
   debug mode is enabled
3. Integration for already-migrated control families only
4. An easy on/off switch for the whole mechanism

## Required direction

Preferred implementation direction:

- migrated controls expose lightweight data attributes or equivalent metadata
- one shared debug inspector reads that metadata
- the inspector shows a small label near the cursor or hover target

The displayed info should be something like:

- family
- variant
- size
- subtype if present

Examples:

- `button / secondary / small / toggle`
- `field / default`
- `selection / checkbox / small`

Working rule:

- keep the mechanism cheap
- keep it dev/debug-oriented
- do not turn this into a large instrumentation system

## Enable / disable model

The mechanism must be easy to switch off later.

Acceptable options include:

- a single global debug flag
- a dev-only query param
- a narrow existing debug toggle if one already fits cleanly

Prefer the smallest solution that does not create broad coupling.

## Validation

Required:

- `npm run build`

Manual QA if practical:

- when the debug mechanism is off, normal UI behavior is unchanged
- when it is on, hovering migrated controls shows the expected marker
- unmigrated controls do not pretend to be migrated controls

If manual QA is not actually run, say so explicitly.

## Stop conditions

Stop and report instead of widening if:

- the mechanism starts requiring broad instrumentation across unmigrated UI
- it starts entangling itself with BoardStage interaction logic
- it starts turning into a general-purpose debug platform
- it requires redesigning the migrated family APIs instead of adding a narrow
  metadata path
