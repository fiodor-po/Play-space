# Interface-Only Control State / Geometry Audit

## Summary

This redo stays strictly in the ordinary interface control layer: entry, board-adjacent interface panels, ops, media, dice, and standard HTML controls. The main result is that the interface layer already clusters around a few real geometries, but its state language is still shallow outside disabled/selected/pending/destructive cases.

## Files changed

- None.
- This was a read-only audit pass.

## What changed

- Re-ran the audit as an interface-only pass.
- Excluded board-object interaction behavior from the findings:
  - no transformer chrome
  - no object selection/preview/occupancy frames
  - no object-adjacent Konva controls
  - no note editing overlay
  - no cursor/presence controls in the main inventory
- Used `src/components/BoardStage.tsx` only as a boundary check for exclusions.

## Standard interface control states inventory

| State family | Where it appears | How it is expressed | Standardized vs local |
| --- | --- | --- | --- |
| `default` | entry inputs/buttons, ops buttons/inputs, media buttons, dice buttons, session-panel controls | base background, subtle border, strong foreground text | clustered, still local |
| `disabled` | entry submit, entry swatches, media join/action buttons, dice buttons, some ops actions | `disabled`, `cursor: not-allowed`, reduced `opacity` | strongest current standard cluster |
| `selected` | entry color swatches, participant color swatches | stronger border/ring, stronger contrast | coherent within swatch family |
| `occupied` | entry color swatches | dashed border, lower opacity, disabled interaction | local but readable |
| `pending` | entry join flow, media join, dice publish | disabled state plus lower opacity and label change | coherent local pattern |
| `destructive` | ops delete, session reset board, error callouts | red-tinted background/border/text | strong semantic cluster |
| `warning` | entry room-full / join-failure blocks | amber or warm-tinted border/background/text | local but consistent enough |
| `toggled-on / toggled-off` | media mic/camera buttons | label change plus tonal fill/border change | local subtype |
| `expanded / collapsed` | entry debug section | native `<details>/<summary>` open state | native/local |
| `checked / unchecked` | participant panel debug toggles, board dev checkbox rows | native checkbox + label row | minimal but consistent |
| `focused` | ordinary interface controls | no explicit custom focus treatment found | absent |
| `hover / pressed` | ordinary interface controls | almost no explicit styling beyond pointer cursor | absent |

## Horizontal padding inventory

| Family | Current values | Where found | Notes |
| --- | --- | --- | --- |
| Standard fields | `12px 14px` | entry inputs, ops password/input field | clearest field default |
| Standard primary button | `12px 16px` | entry submit | larger CTA subtype |
| Default compact button | `10px 14px` | board toolbar, ops primary/danger, dice buttons | strongest ordinary button cluster |
| Small compact button | `8px 12px` | ops secondary | likely small subtype |
| Small compact button alt | `9px 12px` | media action buttons | near-cluster, mild drift |
| Compact/select-like field | `8px 10px` | entry debug select | likely compact field/select subtype |
| Medium callout | `10px 12px` | entry warnings, debug panel blocks | strong callout cluster |
| Small callout | `8px 10px` | media error, dice error | strong compact callout cluster |
| Debug/action pill | `7px 10px` | entry debug quick pills | pill subtype |
| Destructive compact button | `6px 10px` | session-panel reset action | exception/subtype, not a shared default |
| Zero-padding controls | `0` | swatch buttons, transparent text actions, inline triggers | explicit exceptions, not standard control geometry |

Likely current clusters:

- `default field`: `12 x 14`
- `default button`: `10 x 14`
- `large primary button`: `12 x 16`
- `small button`: `8/9 x 12`
- `compact field/select`: `8 x 10`
- `callout`: `8 x 10` and `10 x 12`

## Internal alignment inventory

| Control shape | Current alignment pattern | Where found | Notes |
| --- | --- | --- | --- |
| Text-only buttons | box-model centering, usually no flex | toolbar, ops buttons, dice buttons, entry submit | dominant pattern |
| Icon + text controls | `display: flex`, `alignItems: center`, `gap: 6` or `8` | media tile/header actions, some inline action rows | strongest mixed-content cluster |
| Checkbox rows | `display: flex`, `alignItems: center`, `gap: 8` | participant panel, board dev controls | very consistent |
| Disclosure trigger | native summary layout | entry debug section | native behavior, not custom-aligned |
| Interface rows | left-aligned text, often grid/flex wrapper | ops room rows, ops slice rows | row family, not button-default geometry |
| Swatch groups | flex row / wrap with `gap: 8` or `10` | entry color selector, participant palette | clear family behavior |
| Transparent text actions | inline text/button treatment, `padding: 0` | participant panel | explicit exception |
| Inline rename input | borderless/transparent inline field | participant panel | explicit exception |

Gap clusters:

- `gap: 8` is the clearest ordinary interface alignment rhythm
- `gap: 10` appears in swatch groups and some panel/action clusters
- `gap: 6` appears in tighter mixed-content controls

## Strongest current interface clusters

- Dark field shell
  - `padding: 12px 14px`
  - `borderRadius: 12`
  - dark background + subtle border
- Default compact button
  - `padding: 10px 14px`
  - `borderRadius: 10-12`
  - bold label
- Small compact button
  - `padding: 8/9px 12px`
  - `borderRadius: 10-12`
- Checkbox row alignment
  - flex row
  - `alignItems: center`
  - `gap: 8`
- Swatch group layout
  - wrap/flex
  - `gap: 8-10`
- Callout geometry
  - compact `8x10`
  - medium `10x12`

## Clear interface drift / inconsistency zones

- Compact button geometry drifts across:
  - `8x12`
  - `9x12`
  - `10x14`
  - `12x16`
- Standard controls have very weak explicit state coverage outside:
  - disabled
  - selected
  - pending
  - destructive
- Focus styling is effectively absent
- Hover/pressed styling is effectively absent
- Row-like controls and button-like controls are visually close in some places, but not clearly separated yet
- Session-panel transparent text actions and destructive reset action do not follow the main button geometry cluster

## Standard-family candidates vs interface exceptions

### Likely standard family behavior

- dark text fields
- default compact buttons
- small compact buttons
- callouts/messages
- checkbox rows
- swatch selectors
- disclosure block behavior via native details/summary

### Likely subtype behavior

- large primary entry CTA
- media toggle buttons
- ops row buttons / selectable rows
- debug pills
- compact select-like field

### Explicit interface exceptions

- participant inline rename input
- transparent text actions in session panel
- session-panel reset/destructive micro-action
- subsystem shells such as media dock and dice tray
- presence controls and board-object interaction controls are excluded from this pass

### Unresolved

- whether `10x14` or `8/9x12` should be the main small-button baseline
- whether selectable rows should borrow button geometry or stay clearly separate

## Validation

- Read-only only
- No code changes
- No build run

## Risks / notes

- The main missing piece for the standard control model is state language, not raw geometry.
- The strongest factual anchors are:
  - `12x14` fields
  - `10x14` default compact buttons
  - `8/9x12` small buttons
  - `gap: 8` for mixed-content alignment
- I intentionally kept interaction-layer and board-object state systems out of the main findings so this stays usable for ordinary interface control modeling.

## Suggested next step

The next clean pass is a narrow decision pass for the ordinary interface control layer only:

- draft the standard interface state vocabulary
- choose the default vs small padding pair
- lock the internal alignment rule for text-only controls, mixed-content controls, and checkbox rows

## Recommended next pass only

A focused interface-control decision pass that turns this factual audit into proposed draft rules for:

- standard interface states
- default/small control geometry
- internal alignment conventions
