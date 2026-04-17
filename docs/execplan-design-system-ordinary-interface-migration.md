# ExecPlan: Design System Ordinary Interface Migration

## 1. Goal

Migrate the project's ordinary interface layer onto the emerging design-system
 model in a narrow, staged, low-risk way.

The goal is **not** a broad visual rewrite.

The goal is to:

- establish a real reusable design-system implementation substrate;
- migrate the highest-confidence ordinary interface families first;
- keep board-object, interaction-layer, and presence-layer systems out of the
  first migration wave;
- preserve product behavior while reducing style drift and local duplication.

## 2. Why now

The design-system chapter has now passed the inventory and canonical-model
 stages far enough that rollout can be reasoned about honestly.

What now exists:

- primitive token draft
- semantic foundation layer
- semantic UI typography layer
- control scale layer
- ordinary control-family model
- ordinary control-state model
- ordinary interface migration map

What does **not** yet exist:

- actual shared runtime family recipes in code
- a narrow rollout plan
- a real migration boundary between ordinary interface work and board-sensitive
  systems

This plan exists to create that boundary before implementation starts.

## 3. Roadmap link

This plan supports the `ROADMAP.md` P2 design-system chapter, specifically:

- dependency map
- canonical model
- narrow rollout plan

It does **not** promote the design-system chapter above the current hosted-core
 validation phase.

It should be treated as planning/backlog preparation work that makes later UI
 cleanup safer when the project decides to spend effort there.

## 4. In scope

This plan covers the ordinary interface layer only.

Included systems:

- entry flow in `src/App.tsx`
- board-adjacent ordinary control surfaces:
  - `src/board/components/ParticipantSessionPanel.tsx`
  - `src/board/components/BoardToolbar.tsx`
- ops ordinary controls in `src/ops/RoomsOpsPage.tsx`
- media internal ordinary controls in `src/media/LiveKitMediaDock.tsx`
- dice internal ordinary controls in `src/dice/DiceSpikeOverlay.tsx`

Included families:

- shared app-surface language
- field family
- ordinary button family
- boxed callout family
- selection controls starting from checkbox rows
- swatch / pill family only where they behave like ordinary interface controls
- row family only after early family rollout proves stable

Included design-system implementation work:

- minimal token-consumption runtime substrate
- minimal shared family recipe layer
- narrow inspectability/support surface if needed for systemic validation

## 5. Out of scope

Not part of this migration plan:

- board-object shells
- board-object controls
- interaction-layer chrome
- `RemoteInteractionIndicator` rollout
- transformer chrome
- object-adjacent Konva controls
- note editing textarea overlay
- cursor / presence controls
- media dock shell as a generic overlay shell
- dice tray shell as a generic overlay shell
- broad row/list unification before earlier slices are stable
- a broad `BoardStage` rewrite

These are valid later design-system chapters, but they should be treated as
 second- or third-pass work, not as part of the first ordinary interface
 migration wave.

## 6. Current mechanism

The current interface layer already has a recognizable visual language, but it
 mostly exists as parallel local implementations.

Current runtime realities:

- `src/App.tsx` contains a large entry/UI shell with many inline recipes
- `src/ops/RoomsOpsPage.tsx` contains the strongest local family clustering:
  panel, field, button, row, muted/error text
- `ParticipantSessionPanel`, `BoardToolbar`, `LiveKitMediaDock`, and
  `DiceSpikeOverlay` reuse similar language but mostly through file-local style
  definitions
- ordinary control states are shallow in code:
  - `default` and `disabled` exist
  - `hover`, `focus`, `active` are mostly absent as explicit system states
- many controls look shared because their wrappers are shared, but they are not
  yet implemented as shared base families

Architectural implication:

- the biggest migration risk is not visual inconsistency by itself
- it is structural drift between:
  - canonical design-system model
  - local file-owned runtime recipes

## 7. Target mechanism

The intended target mechanism is:

1. canonical primitives and semantic tokens remain documented in the draft
2. code gains a minimal real design-system layer for ordinary interface work
3. product files consume family-level recipes rather than rebuilding local
   inline-control classes
4. runtime migration proceeds family-by-family, not file-by-file and not token-
   by-token

The practical target dependency chain should be:

- primitive tokens
- semantic foundations
- semantic typography
- control-scale rules
- family recipes
- system-level consumers

The migration should move product code toward:

- field recipes
- button recipes
- callout recipes
- surface recipes

not toward direct primitive usage in every implementation file.

## 8. Critical vulnerabilities and problem areas

### 8.1. `BoardStage` boundary risk

`src/components/BoardStage.tsx` remains the single largest migration hazard.

Why:

- it mixes board runtime, board-adjacent UI, interaction chrome, dev surfaces,
  overlays, file upload wiring, object editing, and several local style
  systems
- a careless design-system pass could easily drag board-object and interaction
  concerns into an ordinary interface migration

Rule:

- use `BoardStage.tsx` only for boundary-aware narrow extractions
- do not let the design-system rollout become a disguised `BoardStage`
  reorganization

### 8.2. Shared wrapper vs shared family confusion

Risk:

- `ParticipantSessionPanel`, `BoardToolbar`, and some other shared wrappers make
  local controls appear more mature than they are

Why it matters:

- migration could incorrectly treat one wrapper's local style as a settled
  global family

Rule:

- unify by family evidence across files, not by the mere existence of a shared
  wrapper

### 8.3. State-language gap

Risk:

- ordinary runtime controls do not yet have strong explicit `hover`, `focus`,
  and `active` behavior

Why it matters:

- migration is not just normalization
- part of it introduces missing canonical state behavior

Rule:

- do not pretend rollout is purely cosmetic
- treat state rollout as deliberate behavior-hardening work, especially for
  focus

### 8.4. Subsystem shell leakage

Risk:

- media and dice internal ordinary controls are good migration candidates
- their outer shells are not

Why it matters:

- shell-level migration would pull the chapter into overlay/subsystem semantics
  too early

Rule:

- migrate internal ordinary controls
- leave subsystem shells as explicit later work

### 8.5. Row-family ambiguity

Risk:

- rows already repeat, but their semantic boundaries are less settled than
  fields/buttons/callouts

Why it matters:

- premature row unification could blur:
  - selectable rows
  - inspection rows
  - key/value rows
  - board-adjacent inspection/debug rows

Rule:

- rows should not be in the first rollout slice

### 8.6. Mixed migration granularity

Risk:

- replacing local values directly with tokens across many files will create a
  half-system:
  tokens exist, but family ownership remains local and inconsistent

Rule:

- migrate through family abstractions and recipes
- do not do a repo-wide raw token replacement pass

## 9. Required pre-work before implementation starts

Some preparatory work is still required.

### 9.1. Choose the runtime design-system substrate

This is the most important missing prerequisite.

Before migration starts, the project should choose where ordinary interface
 family recipes will live in code.

At minimum, decide:

- folder/location for the runtime design-system layer
- whether family recipes are expressed through:
  - TS style objects/helpers
  - CSS classes plus variables
  - a hybrid
- how semantic token references are represented in code

Without this decision, migration will drift into one-off local helpers.

### 9.2. Define the first implementation slice explicitly

Before coding starts, choose exactly one first slice.

Recommended first slice:

- field family

Why:

- strongest de facto cluster
- lowest semantic ambiguity
- cleanest boundary from board/object-sensitive systems

### 9.3. Decide the validation mechanism for systemic UI change

Because this migration is mostly structural and recipe-level, successful builds
 are not enough.

Before rollout starts, choose a minimal validation path, such as:

- a tiny internal preview/dev surface for the migrated family
- or a very explicit manual QA checklist tied to the touched runtime consumers

This does not need to be a big Storybook-like system.
It just needs to prevent invisible systemic regressions from being judged only
 by “the app still builds”.

### 9.4. Freeze the first-wave exclusions

Before coding starts, explicitly keep these out:

- board-object controls
- interaction-layer chrome
- note editing overlay
- cursor / presence controls
- subsystem shells

This must be treated as a hard migration boundary, not a soft preference.

## 10. Migration plan

### Phase 0. Pre-rollout setup

Purpose:

- establish the runtime design-system substrate
- choose the first slice
- make rollout inspectable

Likely touched files:

- new design-system runtime files under a new ordinary-interface-specific
  location
- maybe a narrow dev/inspect surface if needed
- docs only if the implementation substrate changes the chapter assumptions

Output:

- one agreed runtime location for ordinary design-system recipes
- one explicit first slice
- one explicit exclusion list carried into implementation

### Phase 1. Shared app-surface + field family

Purpose:

- migrate the safest high-confidence family cluster first

Scope:

- entry room input
- entry player input
- ops unlock field
- entry/ops surrounding ordinary dark panel language only where necessary to
  support the field family cleanly
- entry debug select only if it can cleanly fit the small field recipe in the
  same pass

Must not change:

- room entry semantics
- join flow behavior
- ops auth behavior
- `BoardStage` interaction behavior

Success signal:

- entry and ops fields consume one shared ordinary field family path
- no new local field recipes are introduced in those files

### Phase 2. Ordinary button family

Purpose:

- migrate the strongest repeated action-control cluster after the field slice
  proves the substrate works

Scope:

- ops buttons
- board toolbar ordinary actions
- media internal ordinary actions
- dice internal ordinary actions

Must not change:

- object-adjacent image controls
- transparent text actions
- subsystem shells

Open design decision to resolve before or during this phase:

- whether toolbar/media/dice stay one button family with variants or become
  narrower subfamilies on top of shared button tokens

Current accepted direction:

- participant-colored dice-style actions should be treated first as shared
  `secondary` button subtypes, not as a separate family
- participant-colored title/hero actions should be treated first as shared
  `primary` button subtypes, not as a separate family
- media buttons should be treated first as shared `secondary.small` button
  subtypes with toggle tone override, not as a separate family
- the fixed add-image trigger should be treated as the same shared button class
  as dice buttons in a different placement/context, not as a separate family

Current rollout checkpoint:

- the shared ordinary button chapter now already covers:
  - ops buttons
  - board toolbar buttons
  - dice tray buttons
  - media buttons
  - entry primary CTA
  - fixed add-image trigger
- the remaining later-return button-like exceptions are:
  - entry debug pills
  - participant-panel transparent text actions
  - participant-panel micro-actions
  - object-adjacent image controls

### Phase 3. Boxed callout family

Purpose:

- unify warning/danger message surfaces after fields and buttons prove stable

Scope:

- entry room-full / join-failure callouts
- media error callout
- dice error callout

Must not change:

- inline muted text
- inline error text
- section emphasis blocks

### Phase 4. Selection controls and swatch/pill family

Purpose:

- migrate checkbox rows and ordinary swatch/pill controls after the main field
  and button substrate exists

Scope:

- checkbox rows
- entry swatches
- participant panel swatches
- entry debug pills if still appropriate

Must not change:

- cursor/presence pills
- tiny accent dots
- object-specific circular controls

### Phase 5. Rows and deferred ordinary families

Purpose:

- revisit rows and any remaining ordinary interface families only after earlier
  migration slices are stable

Scope candidates:

- ops room rows
- ops slice rows
- maybe later disclosure/accordion

Conditional rule:

- if row-family semantics still feel ambiguous, split this phase further rather
  than forcing unification

### Phase 6. Later board/object design-system chapter

Purpose:

- handle the areas intentionally excluded from the ordinary interface rollout

Not current migration work:

- object shells
- board-object controls
- interaction chrome
- presence family
- note editing overlay
- board-adjacent inspection surfaces

This should be treated as a later separate design-system chapter, not as the
 tail end of the first migration wave.

## 11. Validation

For each implementation phase:

- run `npm run build`
- perform narrow manual QA on the touched flows only
- explicitly note what was not touched

Recommended manual QA per early slice:

### Phase 1 QA

- entry room input and player input still behave identically
- join flow still works
- debug select still works if included
- ops unlock field still works

### Phase 2 QA

- toolbar ordinary actions still fire correctly
- ops buttons still preserve enabled/disabled/destructive behavior
- media internal buttons still preserve toggle/pending behavior
- dice tray buttons still work without shell/layout regressions

### Phase 3 QA

- warning/danger callouts still appear in the same runtime conditions
- multi-line callouts still grow naturally

## 12. Risks

- migration could accidentally widen into a general restyle rather than family
  extraction
- migration could accidentally drag board-sensitive logic into ordinary
  interface work through `BoardStage`
- rollout could create “shared helper” clutter without producing true family
  ownership
- introducing explicit interaction states may surface visual regressions that
  did not previously exist because those states were absent
- subsystem-local cases may resist early unification and need to stay local

## 13. Stop conditions

Stop and split the work if:

- a slice requires meaningful `BoardStage` reorganization
- a slice begins to pull interaction-layer or object-control semantics into the
  same change
- the runtime design-system substrate is not clear enough to prevent local
  helper drift
- one phase starts touching more than one major family at once
- visual review shows that a supposedly shared family is not actually one family
  after all

## 14. Documentation updates

If the migration actually starts landing in code, update as needed:

- `ROADMAP.md`
- `play-space-alpha_current-context.md`
- `play-space-alpha_case-study-log.md`
- `docs/design-system-canonical.md`
- `docs/design-system-migration-map.md`

For planning-only completion, doc updates are limited to the design-system
 chapter docs unless roadmap priorities explicitly change.
