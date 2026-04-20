# Text-Card / Note-Card Design

Status: canonical note replacement and near-term sizing source  
Scope: legacy text-card status, new note-card direction, note sizing behavior

This document defines the current replacement direction for notes in the
product and the intended sizing behavior for the future note surface.

It does not define:

- media association or attachment;
- rich text or document-editor behavior;
- a broad board/object redesign;
- a full annotation platform.

## 1. Canonical replacement direction

The current `text-card` should now be treated as a **legacy object**.

The canonical future note surface should be a new `note-card` object.

Replacement rule:

- keep legacy `text-card` working for existing rooms and snapshots;
- future note implementation should move to `note-card`;
- first replacement slice should introduce `note-card` alongside legacy `text-card`;
- no migration should happen in the first replacement slice;
- future note creation flow should target `note-card`, not legacy `text-card`.

This is the core direction going forward.

## 2. Product role reminder

Notes and tokens serve different jobs.

- token optimizes for spatial placement;
- note-card optimizes for readability.

That means the future note surface should favor:

- readable line length;
- visible text without clipping;
- stable note-card proportions.

## 3. Canonical new note-card semantics

The new `note-card` should be built from correct text-box semantics from the
start.

Canonical rule:

- `note-card` remains a free board context card;
- `note-card` resizes like a normal text box;
- manual resize may change width and height;
- text should wrap/reflow to the current box width;
- while typing, if text no longer fits vertically, the card should auto-grow in height;
- normal note text should not be clipped by default;
- no internal scroll region should appear in normal note flow;
- the object should stay lightweight and readable, not become a document editor.

## 4. Coexistence rule

Legacy `text-card` and new `note-card` should coexist for now.

Near-term coexistence rule:

- existing `text-card` remains supported and readable;
- existing `text-card` remains editable enough for continuity;
- new note creation should later target `note-card`;
- legacy `text-card` should stop receiving broad polish except for critical bugs;
- automatic migration is intentionally deferred.

This keeps the replacement path safe and incremental.

## 5. Manual resize rule for the new note-card

Manual resize should stay standard and predictable.

Near-term rule:

- `note-card` should resize from its box handles/corners like a normal board text box;
- manual resize may change width and height;
- text should wrap/reflow to the current box width;
- resize should not depend on internal scroll regions to make text readable.

This keeps resize behavior familiar without turning the note into a document editor.

## 6. Auto-height rule for the new note-card

Auto-height should be a readability safety behavior, not the whole sizing model.

Near-term rule:

- `note-card` keeps a sensible minimum card height for empty or short notes;
- while typing/editing, once text needs more vertical space, card height should auto-grow to fit it;
- normal note text should remain visible without an internal scroll region.

So the card should behave like:

- minimum height when content is short;
- normal text box resize by hand;
- extra vertical growth when live text input would otherwise overflow.

## 7. Before, during, and after editing

### 7.1. Before editing

If saved note text would overflow at the current width, the card should already
be large enough for that saved content.

### 7.2. During editing

As the participant types:

- wrapping should reflect the current card width;
- editable text area should grow with the note rather than hiding overflow;
- typing should not feel like writing into a clipped viewport.

### 7.3. After editing

After commit:

- card should preserve the edited readable result without clipping;
- normal note text should remain fully readable;
- manual box sizing should remain preserved except where extra height was needed to keep text visible.

## 8. Readable width and note proportions

Notes should avoid both extremes:

- too narrow: tall unreadable text column;
- too wide: hard-to-scan paragraph slab.

Near-term readable-size rule:

- keep a minimum readable width;
- use a moderate default width;
- allow wider notes when intentionally chosen;
- let text reflow naturally as the box changes;
- let auto-height respond when live input would otherwise overflow vertically.

Practical result:

- narrower note becomes taller;
- wider note becomes shorter;
- user may still shape the box manually in both axes like a normal text box;
- note should still read like a note card, not a text strip and not a document
  page.

## 9. First implementation-oriented replacement slice

The first useful implementation slice should follow this model:

1. introduce `note-card` as a new object kind;
2. keep legacy `text-card` working without migration;
3. switch later note creation flow to `note-card`;
4. build `note-card` from correct text-box resize semantics from the start;
5. keep the same no-clipping rule in normal display and editing flow.

This is enough to prove the replacement path without broadening scope.

## 10. What is intentionally deferred

Deferred for later:

- automatic migration from `text-card` to `note-card`;
- rich text editing;
- internal scroll containers for normal note flow;
- note/media association;
- hard note attachment behavior;
- advanced manual height override rules;
- typography redesign;
- annotation/document-platform behavior.

## 11. Practical interpretation

If there is tension between fixed geometry and readable text, readability wins.

That means:

- do not keep polishing legacy `text-card` into a final note object if the
  interaction base is wrong;
- do not require participants to accept clipped text just because the box is
  currently too small;
- do not let the future `note-card` become a hidden-overflow box by default;
- keep the future note surface lightweight, but let it behave like a readable
  note surface.
