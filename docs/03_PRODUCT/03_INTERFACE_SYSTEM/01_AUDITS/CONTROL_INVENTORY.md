# Design System Control Inventory

Status: working pass / strict inventory artifact  
Scope: current control classes across the project runtime

This document records the current control inventory directly from the codebase.

It is intentionally stricter and more table-driven than earlier audit prose.

It is not the final shared component model yet.

Its purpose is:

- to map where recurring control types currently exist;
- to classify whether each implementation is truly shared or still local;
- to show where de facto control classes already exist;
- to support later component unification work with a concrete inventory base.

## Classification notes

### Shared feature/surface component vs shared base control

This inventory distinguishes between:

- **shared feature/surface components** such as `ParticipantSessionPanel`,
  `BoardToolbar`, or `CursorOverlay`;
- **shared base controls** such as a genuinely reusable button, input, swatch,
  row, or interaction indicator.

A shared feature/surface component does **not** automatically imply that the
controls inside it are shared base controls.

If a button, swatch, or input only exists inside one shared wrapper and its
implementation is still local to that file, it is classified as
`local-shared-within-file`, not `shared`.

### Primary classification rule

Each row is listed under its **primary** current control class.

If something also has secondary semantics, that is noted in the `Notes` column.

Examples:

- ops room rows are primarily treated as `Rows / List items`, even though they
  are implemented with `<button>`;
- tooltip rows are primarily treated as data/inspection rows, not generic list
  rows;
- subsystem shells are kept in overlays/cards only when that helps map a likely
  future surface family or intentional exception.

## Buttons

| Control class / variant | Where it appears | Primary files | Shared vs local | De facto class | Likely future target | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Entry primary submit button | Entry join CTA | [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Large primary CTA colored by selected participant color rather than fixed semantic theme. |
| Entry color swatch buttons | Entry color picker | [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Circular selectable swatches with selected, occupied, and pending states. |
| Entry debug swatch buttons | Entry debug section | [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx) | repeated-local | same-class | candidate-for-unification | Same broad swatch family as entry color picker but smaller and debug-only. |
| Entry debug pill buttons | `Room full`, `Clear debug overrides` | [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Small rounded pills; similar role to ops secondary buttons but not the same exact class. |
| Board add-image floating button | Fixed `+` trigger on board | [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) | repeated-local | same-family-different-class | needs-decision-later | Icon-only overlay action; likely related to floating controls rather than ordinary button family. |
| Board toolbar buttons | `Add image`, `Add note`, `Reset board` | [src/board/components/BoardToolbar.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/BoardToolbar.tsx) | local-shared-within-file | same-family-different-class | candidate-for-unification | `BoardToolbar` is a shared feature component, but its button classes are still local to that file. |
| Participant panel text buttons | `Leave room`, participant-name trigger | [src/board/components/ParticipantSessionPanel.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/ParticipantSessionPanel.tsx) | local-shared-within-file | same-family-different-class | needs-decision-later | Transparent text-action buttons inside a shared surface component; not a shared base button class yet. |
| Participant panel swatch buttons | Color trigger and palette options | [src/board/components/ParticipantSessionPanel.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/ParticipantSessionPanel.tsx) | local-shared-within-file | same-class | candidate-for-unification | Same broad swatch family as entry color controls, but implementation is local to the panel file. |
| Participant panel destructive action button | `Reset board` | [src/board/components/ParticipantSessionPanel.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/ParticipantSessionPanel.tsx) | local-shared-within-file | same-family-different-class | candidate-for-unification | Destructive button inside shared panel shell; still a local implementation. |
| Ops primary button | Unlock | [src/ops/RoomsOpsPage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/ops/RoomsOpsPage.tsx) | local-shared-within-file | same-class | candidate-for-unification | Explicit file-local `primaryButtonStyle`. |
| Ops secondary buttons | Lock, Refresh | [src/ops/RoomsOpsPage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/ops/RoomsOpsPage.tsx) | local-shared-within-file | same-class | candidate-for-unification | Explicit file-local `secondaryButtonStyle`. |
| Ops danger button | Delete durable snapshot | [src/ops/RoomsOpsPage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/ops/RoomsOpsPage.tsx) | local-shared-within-file | same-class | candidate-for-unification | Explicit file-local `dangerButtonStyle`. |
| Media dock action buttons | Join, Leave, Mute mic, Camera toggle | [src/media/LiveKitMediaDock.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/media/LiveKitMediaDock.tsx) | local-shared-within-file | same-class | candidate-for-unification | File-local `actionButtonStyle`; probably same broad family as ops compact buttons. |
| Dice tray buttons | d4-d20 tray actions | [src/dice/DiceSpikeOverlay.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/dice/DiceSpikeOverlay.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Compact high-contrast overlay buttons, but with participant-colored border. |
| Image floating action buttons | Object-adjacent image controls | [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) | local-shared-within-file | intentional-exception | keep-separate-for-now | Konva-based floating controls; likely related to overlay/object-adjacent control family rather than ordinary app buttons. |

## Inputs

| Control class / variant | Where it appears | Primary files | Shared vs local | De facto class | Likely future target | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Entry dark text input | Room and player inputs | [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx) | repeated-local | same-class | candidate-for-unification | Two visually identical inputs in the entry form. |
| Ops dark password input | Ops unlock key field | [src/ops/RoomsOpsPage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/ops/RoomsOpsPage.tsx) | local-shared-within-file | same-class | candidate-for-unification | Matches entry dark field family closely. |
| Entry dark select field | Entry debug claimed-color select | [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Reads like the same field shell family as dark text input. |
| Participant inline rename input | Participant name editing inside session panel | [src/board/components/ParticipantSessionPanel.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/ParticipantSessionPanel.tsx) | local-shared-within-file | intentional-exception | keep-separate-for-now | Transparent inline-edit field embedded in text row; panel is shared, but the input class is local to that surface. |
| Note editing textarea overlay | In-place note editing | [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) | repeated-local | intentional-exception | keep-separate-for-now | Absolute transparent editing surface anchored to object bounds. |
| Hidden file input | Image upload trigger | [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) | repeated-local | intentional-exception | keep-separate-for-now | Functional input only, not a visible control class. |

## Checkboxes

| Control class / variant | Where it appears | Primary files | Shared vs local | De facto class | Likely future target | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Native labeled checkbox | Participant panel `Debug tools` | [src/board/components/ParticipantSessionPanel.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/ParticipantSessionPanel.tsx) | local-shared-within-file | same-class | candidate-for-unification | Plain native checkbox plus label row; surface component is shared, checkbox class is not. |
| Native labeled checkbox | Board dev-tools `Inspect object semantics on hover` | [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) | repeated-local | same-class | candidate-for-unification | Same broad class as session-panel checkbox, but independently implemented. |

## Panels / Cards

| Control class / variant | Where it appears | Primary files | Shared vs local | De facto class | Likely future target | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Boot status card | App boot screen | [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Light elevated card, unlike the dominant dark panel family. |
| Entry form panel | Room entry shell | [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx) | repeated-local | same-class | candidate-for-unification | Strongest app-shell dark panel baseline. |
| Entry debug panel | `details` block inside entry form | [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Lower-emphasis inset panel within the entry surface. |
| Participant session panel | Floating room/session panel | [src/board/components/ParticipantSessionPanel.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/ParticipantSessionPanel.tsx) | shared | same-class | candidate-for-unification | Shared feature/surface component and strong candidate for a shared surface family. |
| Governance/dev inset panel | In-panel governance block | [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Subpanel nested within participant panel content. |
| Ops main panels | Room list and room detail shells | [src/ops/RoomsOpsPage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/ops/RoomsOpsPage.tsx) | local-shared-within-file | same-class | candidate-for-unification | File-local `panelStyle`; strong dark panel family match. |
| Ops info cards | Identity/live/connections/snapshot stats | [src/ops/RoomsOpsPage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/ops/RoomsOpsPage.tsx) | local-shared-within-file | same-family-different-class | candidate-for-unification | Compact sub-card variant inside ops panels. |
| Media dock shell | Fixed video controls surface | [src/media/LiveKitMediaDock.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/media/LiveKitMediaDock.tsx) | repeated-local | same-class | candidate-for-unification | Strong dark floating panel match. |
| Participant video tile card | Video participant tile | [src/media/LiveKitMediaDock.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/media/LiveKitMediaDock.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Media-specific card variant. |
| Dice tray shell | Dice overlay tray container | [src/dice/DiceSpikeOverlay.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/dice/DiceSpikeOverlay.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Overlay panel family, lighter structure than full app panels. |
| Object semantics tooltip panel | Hover inspection tooltip | [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Tooltip/info panel variant, fixed-position and non-interactive. |
| Note-card shell | Board note object surface | [src/board/objects/noteCard/NoteCardRenderer.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/objects/noteCard/NoteCardRenderer.tsx) | repeated-local | intentional-exception | keep-separate-for-now | Included only as an intentional exception boundary; this is an object shell, not a general control or surface-shell unification target. |

## Pills / Chips / Swatches

| Control class / variant | Where it appears | Primary files | Shared vs local | De facto class | Likely future target | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Entry color swatch | Participant color options | [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx) | repeated-local | same-class | candidate-for-unification | Large circular swatch with selected and occupied states. |
| Entry debug swatch | Simulated occupied colors | [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx) | repeated-local | same-class | candidate-for-unification | Smaller version of entry swatch family. |
| Participant color trigger dot | Current participant color button | [src/board/components/ParticipantSessionPanel.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/ParticipantSessionPanel.tsx) | local-shared-within-file | same-family-different-class | candidate-for-unification | Trigger form of same swatch family; local to the shared panel surface. |
| Participant color palette swatch | Session-panel color options | [src/board/components/ParticipantSessionPanel.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/ParticipantSessionPanel.tsx) | local-shared-within-file | same-class | candidate-for-unification | Same broad swatch class as entry picker, but not yet a shared swatch control. |
| Entry debug action pill | `Room full`, `Clear debug overrides` | [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx) | repeated-local | same-class | candidate-for-unification | Text action pills. |
| Media participant accent dot | Participant tile accent marker | [src/media/LiveKitMediaDock.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/media/LiveKitMediaDock.tsx) | repeated-local | same-family-different-class | needs-decision-later | Tiny non-interactive status dot; may remain separate from control swatches. |

## Presence markers / cursor labels

| Control class / variant | Where it appears | Primary files | Shared vs local | De facto class | Likely future target | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Cursor name pill | Cursor label chip | [src/board/components/CursorOverlay.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/CursorOverlay.tsx) | local-shared-within-file | intentional-exception | needs-decision-later | Presence-specific label control inside a shared presence surface; should not currently be treated as proof of a settled general chip/pill class. |
| Cursor dot marker | Cursor anchor marker | [src/board/components/CursorOverlay.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/CursorOverlay.tsx) | local-shared-within-file | intentional-exception | needs-decision-later | Presence-specific marker control; likely part of a future cursor/presence family rather than the general swatch family. |

## Rows / List items

| Control class / variant | Where it appears | Primary files | Shared vs local | De facto class | Likely future target | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Ops room row | Room list selectable item | [src/ops/RoomsOpsPage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/ops/RoomsOpsPage.tsx) | local-shared-within-file | same-class | candidate-for-unification | Primary classification is selectable row/list item. Implemented with `<button>`, but should not be treated as a normal button class. |
| Ops live-slice row | Live slice detail block | [src/ops/RoomsOpsPage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/ops/RoomsOpsPage.tsx) | local-shared-within-file | same-class | candidate-for-unification | Neutral data row variant. |
| Object semantics key-value row | Tooltip rows | [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Key/value inspection row rather than selectable item. |
| Governance inspection row | Dev-tools governance entries | [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Compact sub-row/card. |

## Status callouts / messages

| Control class / variant | Where it appears | Primary files | Shared vs local | De facto class | Likely future target | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Entry full-room warning callout | Entry form | [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Warning callout block. |
| Entry join-failure warning callout | Entry form | [src/App.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/App.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Warning/error hybrid callout block. |
| Ops auth/detail error text | Unlock and detail errors | [src/ops/RoomsOpsPage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/ops/RoomsOpsPage.tsx) | local-shared-within-file | same-class | candidate-for-unification | Inline error text, not boxed callout. |
| Ops muted empty/loading text | Empty/loading/status helper text | [src/ops/RoomsOpsPage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/ops/RoomsOpsPage.tsx) | local-shared-within-file | same-class | candidate-for-unification | File-local muted helper text class. |
| Media error callout | Media token/permission/connect error | [src/media/LiveKitMediaDock.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/media/LiveKitMediaDock.tsx) | repeated-local | same-class | candidate-for-unification | Strong destructive callout family match. |
| Dice error callout | Dice startup failure | [src/dice/DiceSpikeOverlay.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/dice/DiceSpikeOverlay.tsx) | repeated-local | same-class | candidate-for-unification | Strong destructive callout family match. |
| Participant creator tools emphasis | `Room tools` subsection emphasis | [src/board/components/ParticipantSessionPanel.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/ParticipantSessionPanel.tsx) | local-shared-within-file | unclear | keep-separate-for-now | Not a clean callout class today; better treated as section emphasis inside a shared surface component. |

## Overlays / object-adjacent controls

| Control class / variant | Where it appears | Primary files | Shared vs local | De facto class | Likely future target | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Cursor overlay | Presence cursors and labels | [src/board/components/CursorOverlay.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/CursorOverlay.tsx) | shared | intentional-exception | keep-separate-for-now | Presence-layer overlay, not ordinary control layer. |
| Remote interaction frame | Image, token, note-card interaction states | [src/board/components/RemoteInteractionIndicator.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/components/RemoteInteractionIndicator.tsx), [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx), [src/board/objects/noteCard/NoteCardRenderer.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/objects/noteCard/NoteCardRenderer.tsx), [src/board/objects/token/TokenRenderer.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/board/objects/token/TokenRenderer.tsx) | shared | intentional-exception | keep-separate-for-now | Canonical interaction-layer control, already genuinely shared. |
| Image floating action controls | Selected-image object controls | [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) | local-shared-within-file | intentional-exception | keep-separate-for-now | Konva object-adjacent controls anchored in board/interation space. |
| Fixed add-image floating trigger | Board overlay action | [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) | repeated-local | same-family-different-class | needs-decision-later | Overlay action, but not object-adjacent. |
| Note edit textarea overlay | Absolute HTML editing surface | [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) | repeated-local | intentional-exception | keep-separate-for-now | Editing surface, not a general overlay card. |
| Object semantics tooltip | Hover-inspection overlay | [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx) | repeated-local | same-family-different-class | candidate-for-unification | Likely related to shared overlay/info card family. |
| Media dock overlay shell | Fixed media subsystem shell | [src/media/LiveKitMediaDock.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/media/LiveKitMediaDock.tsx) | repeated-local | same-family-different-class | keep-separate-for-now | Primary classification is subsystem shell, not a generic overlay control. Keep in inventory because it may inform a shared surface family later. |
| Dice tray overlay shell | Fixed dice subsystem tray | [src/dice/DiceSpikeOverlay.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/dice/DiceSpikeOverlay.tsx) | repeated-local | same-family-different-class | keep-separate-for-now | Primary classification is subsystem shell/tray, not a generic overlay control. |

## Existing shared controls

### Shared base controls

- `RemoteInteractionIndicator`

### Shared feature/surface components

- `ParticipantSessionPanel`
- `BoardToolbar`
- `CursorOverlay`

### Explicit local shared controls within one file

- ops `InfoCard` and style helpers in [src/ops/RoomsOpsPage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/ops/RoomsOpsPage.tsx)
- `SmallFloatingActionButton` in [src/components/BoardStage.tsx](/Users/fedorpodrezov/Developer/play-space-alpha/src/components/BoardStage.tsx)

## Strongest duplication clusters

- dark elevated panel/surface shells across entry, session, ops, media, tooltip
- dark text-field shells across entry and ops
- compact action buttons across ops, media, toolbar, dice, overlays
- status/error callouts across entry, media, dice
- color swatch controls across entry and participant panel
- data/inspection rows across ops and board debug/inspection surfaces

## Open classification questions

- Should toolbar buttons, ops buttons, media buttons, and dice buttons become one shared button class or several subclasses?
- Should the board add-image floating trigger belong to the general button family or the overlay-control family?
- Should ops room rows and semantics rows be treated as one data-row family or as separate list-row vs key-value-row classes?
- Should cursor/presence controls become their own growing control family rather than being folded into broader chip/pill language?
- Should note editing textarea styling remain an intentional exception even if a shared text-edit surface appears later?

## Recommended next step

Proceed to the whole-project system-layer audit as the next read-only phase.

That pass should map:

- which control classes belong to the room shell / entry system;
- which belong to the control layer;
- which belong to the interaction layer;
- which belong to ops, media, presence, or special systems;
- and where the current dependency edges are mixed.
