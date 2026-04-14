# Task Brief — App Lifecycle / Ownership Analysis

## Task
Run a read-only analysis pass for the remaining app-shell lifecycle /
ownership core inside `src/App.tsx`.

## Goal
After this pass:

- we have a clear map of what lifecycle / ownership logic still remains inside
  `BootstrappedApp`;
- we know which remaining responsibilities are true lifecycle truths versus
  convenience/mirroring layers;
- we know whether there is still one honest narrow implementation slice left or
  whether the next work must be treated as an explicit lifecycle chapter.

This is an analysis-first chapter, not an implementation pass.

## Constraints
- do not implement code
- do not widen into room-semantics redesign
- do not touch `BoardStage.tsx`
- do not revisit already-landed narrow extractions
- do not mix this pass with design-system work

Treat this as app-shell lifecycle / ownership analysis only.

## Relevant context
The earlier narrow `App` split track has already landed these checkpoints:

- render ownership split
- direct room URL bootstrap priority fix
- entry-only availability/color extraction
- joined-room awareness transport extraction

Those passes improved structure, but they also clarified the remaining
boundary:

- restore/bootstrap gate
- join / leave / collapse transitions
- participant session persistence and synchronization
- room-record / creator mirroring
- cross-tab active-room ownership
- foreground presence-carrier coordination

The current question is no longer “can we extract another helper?”

It is now:

- what still belongs to the app-shell lifecycle core,
- what could still be separated safely,
- and where the explicit lifecycle / ownership chapter truly begins.

## Files to inspect first
- `src/App.tsx`
- `src/app/useEntryAvailabilityState.ts`
- `src/app/useJoinedRoomPresenceTransport.ts`
- `AGENTS.md`
- `ROADMAP.md`
- `play-space-alpha_current-context.md`
- `docs/room-behavior-spec.md`
- `docs/room-memory-model.md`

## Deliverables
Return:

- Summary
- Remaining lifecycle / ownership map
- Which responsibilities are true lifecycle truths
- Which responsibilities are convenience/mirroring only
- Whether one more honest narrow slice still exists
- If yes: the best smallest safe next implementation slice
- If no: the clearest framing for the explicit lifecycle / ownership chapter
- Risks / stop conditions

## Validation
Read-only pass only.

If commands are used, keep them to inspection only.

## Stop conditions
Stop and report instead of widening if:

- the next step would require redefining room behavior semantics rather than
  clarifying ownership;
- the next step would require touching `BoardStage.tsx`;
- the next step would require redesigning participant identity or presence
  policy rather than app-shell ownership;
- there is no honest small safe slice left and the remaining work is clearly a
  deeper lifecycle chapter.
