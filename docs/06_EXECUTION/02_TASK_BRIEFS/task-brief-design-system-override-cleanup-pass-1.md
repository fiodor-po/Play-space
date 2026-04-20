## Task

Implement the first dedicated design-system override-cleanup pass using the
already accepted cleanup decisions.

## Goal

After this pass:

- the highest-signal remaining visual overrides on top of shared family recipes
  are reduced;
- the current design-system migration reads more clearly as intentional shared
  ownership rather than shared ownership plus heavy local visual noise;
- the pass stays narrow and does not widen into object-shell work, interaction
  redesign, or broad subsystem cleanup.

This is an implementation cleanup pass, not a new family-migration chapter.

## Constraints

Must not change:

- room join / leave behavior
- media behavior
- dice behavior
- board interaction behavior
- governance behavior
- attachment / tooltip placement behavior

Out of scope:

- participant video tile override cleanup
- image-attached drawing-control geometry
- object shells
- object-adjacent control-family redesign
- interaction-layer standardization
- broad `BoardStage` cleanup

Additional constraints:

- implement only the already accepted cleanup decisions
- do not reopen the underlying design questions in this pass
- preserve local placement/geometry where that was explicitly accepted

## Relevant context

The project is now past the “do we have shared ownership?” stage and into the
“are the remaining overrides intentional?” stage.

The accepted cleanup decisions for this pass are:

- remove the remaining visual overrides from the entry main panel
- remove the remaining visual overrides from the entry debug inset
- for the participant panel shell:
  - keep placement/size local
  - move blur/material treatment under shared material ownership
- remove the remaining shell/material overrides from the media dock shell
- defer participant video tile override cleanup
- remove the remaining local mini-card overrides inside the governance inset
- remove the remaining local shadow tuning on dice buttons
- remove the remaining local visual overrides from the fixed add-image trigger
  except for placement
- align the fixed add-image trigger look-and-feel with the dice-button class
- remove the remaining local background/material override from the governance
  inset itself

## Files to inspect first

- `src/App.tsx`
- `src/board/components/ParticipantSessionPanel.tsx`
- `src/media/LiveKitMediaDock.tsx`
- `src/dice/DiceSpikeOverlay.tsx`
- `src/components/BoardStage.tsx`
- `docs/06_EXECUTION/02_TASK_BRIEFS/task-brief-design-system-override-cleanup-pass-1.md`
- `docs/00_AGENT_OS/CURRENT_CONTEXT.md`

## Deliverables

Return:

- Summary
- Files changed
- What changed
- Validation
- Risks / notes
- Suggested next step

Implementation deliverables:

1. Entry panel / inset override cleanup
2. Participant panel material cleanup per accepted rule
3. Media dock shell material cleanup
4. Governance inset and governance mini-card cleanup
5. Dice button shadow cleanup
6. Fixed add-image trigger cleanup and alignment with dice-button look-and-feel
7. No widening beyond this cleanup pass

## Validation

Required:

- `npm run build`

Manual QA if practical:

- entry screen still reads correctly
- participant panel still behaves the same
- media dock still behaves the same
- governance dev tools still behave the same
- dice tray still behaves the same
- fixed add-image trigger still works

If manual QA is not actually run, say so explicitly.

## Stop conditions

Stop and report instead of widening if:

- cleanup starts requiring a new surface/button subtype decision rather than
  straightforward override removal
- participant video tile cleanup becomes entangled in this pass
- the work starts reopening interaction-layer or object-adjacent-family design
- the pass turns into broad visual retuning instead of the accepted cleanup
  decisions
