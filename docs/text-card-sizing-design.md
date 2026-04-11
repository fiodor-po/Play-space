# Text-Card Sizing Design

Status: canonical near-term text-card sizing source  
Scope: text-card resize behavior, auto-height behavior, readable note proportions

This document defines how note/text-card sizing should behave in the current
product stage.

It does not define:

- media association or attachment;
- rich text or document-editor behavior;
- a broad text-card object-system redesign;
- a full annotation platform.

## 1. Canonical sizing rule

Text-cards should remain **free board context cards**.

Canonical rule:

- text-card should resize like a normal text box;
- manual resize may change both width and height;
- text should reflow to the current box size;
- while typing, if text no longer fits vertically, the card should auto-grow in height;
- normal note text should not be clipped by default;
- text-cards should stay lightweight readable cards, not document-editor objects.

This is the core model going forward.

## 2. Product role reminder

Text-cards and tokens serve different jobs.

- token optimizes for spatial placement;
- text-card optimizes for readability.

That means text-card sizing should favor:

- readable line length;
- visible text without clipping;
- stable note-card proportions.

## 3. Manual resize rule

Manual resize should stay standard and predictable.

Near-term rule:

- text-card should resize from its box handles/corners like a normal board text box;
- manual resize may change width and height;
- text should wrap/reflow to the current box width;
- resize should not depend on internal scroll regions to make text readable.

This keeps resize behavior familiar without turning the note into a document editor.

## 4. Auto-height rule

Auto-height should be a readability safety behavior, not the whole sizing model.

Near-term rule:

- text-card keeps a sensible minimum card height for empty or short notes;
- while typing/editing, once text needs more vertical space, card height should auto-grow to fit it;
- normal note text should remain visible without an internal scroll region.

So the card should behave like:

- minimum height when content is short;
- normal text box resize by hand;
- extra vertical growth when live text input would otherwise overflow.

## 5. Before, during, and after editing

### 5.1. Before editing

If saved note text would overflow at the current width, the card should already
be large enough for that saved content.

### 5.2. During editing

As the participant types:

- wrapping should reflect the current card width;
- editable text area should grow with the note rather than hiding overflow;
- typing should not feel like writing into a clipped viewport.

### 5.3. After editing

After commit:

- card should preserve the edited readable result without clipping;
- normal note text should remain fully readable;
- manual box sizing should remain preserved except where extra height was needed to keep text visible.

## 6. Readable width and note proportions

Text-cards should avoid both extremes:

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

## 7. First implementation-oriented sizing model

The first useful implementation slice should follow this model:

1. text-card remains a normal free board object;
2. text-card box can be resized manually in a standard way;
3. text content reflows to the current width;
4. while typing, card height auto-grows if text would otherwise overflow vertically;
5. the same no-clipping rule applies in normal display and editing flow.

This is enough to improve note usability without broadening scope.

## 8. What is intentionally deferred

Deferred for later:

- rich text editing;
- internal scroll containers for normal note flow;
- note/media association;
- hard note attachment behavior;
- advanced manual height override rules;
- typography redesign;
- annotation/document-platform behavior.

## 9. Practical interpretation

If there is tension between fixed geometry and readable text, readability wins.

That means:

- do not require participants to accept clipped text just because the box is currently too small;
- do not let text-cards become hidden-overflow boxes by default;
- keep the object lightweight, but let the card behave like a readable note
  surface.
