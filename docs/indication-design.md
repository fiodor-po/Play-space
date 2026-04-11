# Indication Design

Status: canonical behavior indication source  
Scope: board/UI behavior signals, multiplayer readability, room/system indication hierarchy

## Purpose

This document is the canonical source for the project's behavior indication model.

Its job is to prevent room states, events, and actions from growing into unrelated local indicators.

It defines:

- what deserves explicit indication;
- what each signal should communicate;
- how signals should be encoded;
- who should see them;
- how long they should live;
- how loud they should feel in the product hierarchy.

This is not:

- a broad design-system document;
- a general branding/style guide;
- an object-by-object implementation checklist;
- governance policy itself.

## Core rule

Indicate only what affects:

- coordination;
- actionability;
- room trust.

Do not indicate everything that is technically knowable.

The project should prefer:

- fewer signals;
- clearer meaning;
- stronger hierarchy;
- lower noise.

## 1. What deserves explicit indication

These states/events/actions deserve explicit indication by default:

- another participant is actively acting on an object and that affects local readability or local actionability;
- an object is occupied or temporarily blocked;
- a remote preview materially changes spatial understanding;
- a room/session state changes what the local participant can do right now;
- a destructive or consequential action is available, blocked, or has just completed;
- a runtime/system state materially changes trust in what the participant is seeing.

These do not deserve explicit indication by default:

- every background process;
- every stored room/member/history fact;
- every implementation detail;
- every local draft state;
- every governance rule at all times;
- every inspect/debug fact for normal users.

## 2. What each indication should communicate

Each indication should answer one primary question:

- `Who is acting?`
- `What is happening right now?`
- `Can I act here?`
- `Is this temporary or persistent?`
- `How much should I care right now?`

If an indication does not answer one of those clearly, it should usually not exist yet.

## 3. Signal families

The project should think in signal families rather than one-off indicators.

### A. Object interaction signals

Use when another participant is actively interacting with an object or when the object is currently unavailable because of that interaction.

Examples:

- remote text-card editing;
- occupied image during remote drawing lock;
- blocked interaction on the currently selected object.

Primary meaning:

- who is acting now;
- whether the object is occupied/blocked;
- whether the state lasts only during the action.

### B. Object preview signals

Use when another participant is previewing a possible committed result, but that result is not yet committed room content.

Examples:

- remote image drag preview;
- remote image transform preview.

Primary meaning:

- this is transient;
- this is spatially relevant;
- this is not committed room state yet.

### C. Room/session status signals

Use when a room-level or session-level condition changes the participant's next available action or the meaning of the current room state.

Examples:

- room full;
- joining pending;
- join claim lost;
- leave-room transition;
- room tools available;
- debug tools enabled.

Primary meaning:

- what the room/session currently allows;
- whether the state is blocking, temporary, or persistent.

### D. Consequence signals

Use when an action has meaningful consequence and the participant needs lightweight confirmation or warning.

Examples:

- reset board completed;
- blocked destructive action;
- join failed because a color became unavailable.

Primary meaning:

- something consequential just happened;
- the participant may need to adjust the next action.

### E. Dev/runtime inspection signals

Use for development-only or debugging-only observability.

Examples:

- governance inspection entries;
- runtime resolution summaries;
- internal diagnostics blocks.

Primary meaning:

- make internal/system behavior inspectable;
- do not treat inspectability as default end-user indication.

## 4. Encoding vocabulary

The same semantic family should reuse the same encoding language where practical.

### Color

Use color to communicate:

- actor identity;
- participant affiliation of live multiplayer signals;
- system vs participant distinction.

Rules:

- participant color should encode actor identity for multiplayer interaction signals;
- neutral/system color should encode room or system status when the signal is not about a specific participant;
- do not rely on color alone for high-stakes meaning.

### Outline / frame

Primary encoding for:

- object-scoped live interaction;
- occupied/blocked object state;
- remote preview bounds.

This is the default board-first multiplayer indication surface.

### Fill / highlight

Use sparingly.

Best for:

- local emphasis;
- limited selection/focus treatment.

Avoid using large fills as the default multiplayer-state language.

### Label / text

Use only when the state is ambiguous without words.

Text should be:

- short;
- specific;
- secondary to the main visual signal.

Many object-scoped signals should remain frame-first rather than label-heavy.

### Icon

Best for:

- room/session/tool status;
- compact panel/header signals;
- non-spatial states.

Icons should not become the primary board-object multiplayer language by default.

### Motion / animation

Use only for:

- urgency;
- transition;
- temporal emphasis.

Animation should remain subtle and rare.

Persistent states should not depend on constant motion to be legible.

### Temporary overlay

Use for:

- previews;
- short confirmations;
- transient warnings;
- momentary room/session state transitions.

These should expire quickly.

### System message

Use for consequential states that are:

- not naturally tied to one object;
- important enough to deserve explicit acknowledgment;
- too important to hide inside dev-only surfaces.

Examples:

- room full;
- join failed;
- reset completed;
- degraded runtime trust condition.

## 5. Audience model

Every indication should have an explicit audience.

### Local only

Examples:

- local draft guidance;
- hover affordances;
- pending local action state;
- local validation.

### All participants

Examples:

- active participant presence/cursors;
- remote interaction frames;
- occupied object cues;
- remote previews;
- room-wide consequential state after it happens.

### Involved participants only

Examples:

- local join claim race failure;
- local blocked retry guidance;
- participant-specific action denial detail.

### Host only

Examples:

- room tools availability;
- future host-only room actions.

### Dev-only

Examples:

- governance inspection;
- runtime/internal diagnostics;
- debug-only resolution detail.

Rule:

- dev-only inspectability must not silently become default end-user indication.

## 6. Lifetime model

Every indication should have an intended lifetime.

### Instant

Examples:

- tiny acknowledgments;
- one-shot confirmations;
- short validation flashes.

### During action

Examples:

- editing;
- drawing;
- dragging;
- previewing;
- occupied state while the condition lasts.

### Short afterglow

Examples:

- claim lost;
- reset completed;
- save applied;
- recently blocked consequential action.

### Persistent state

Examples:

- room full;
- debug tools enabled;
- room tools available;
- current room/session mode.

Persistent indication should be used only when the state meaningfully persists.

## 7. Signal hierarchy / loudness model

The project should use four loudness levels.

### 1. Ambient

Low-noise, always-available context.

Examples:

- participant color chip;
- room creator line;
- debug toggle presence.

Should not compete with board work.

### 2. Contextual

Visible when relevant to the current object, action, or nearby room context.

Examples:

- remote interaction frame;
- occupied object cue;
- remote preview frame.

This should be the default multiplayer indication layer.

### 3. Blocking

Use when the indication changes the participant's next action directly.

Examples:

- occupied color swatch;
- blocked action;
- room full;
- cannot edit because another participant is active.

Blocking signals should be clear, but still compact.

### 4. System-critical

Use rarely.

Examples:

- runtime trust problem;
- destructive room-wide effect confirmation;
- serious connection/system error.

These should usually use room/system surfaces rather than object chrome.

## 8. Object-scoped vs room-scoped vs dev-only signals

### Object-scoped

Object-scoped indication should answer:

- who is acting on this object;
- whether this object is occupied;
- whether this object is showing a transient preview.

Default encoding:

- frame/outline first;
- participant color when actor identity matters;
- text only when needed.

### Room-scoped

Room-scoped indication should answer:

- what the room/session currently allows;
- whether a room-level state is blocking;
- whether a consequential room-level event occurred.

Default encoding:

- panel/header status;
- compact system text;
- occasional system message for consequential events.

Room-scoped signals should not usually be rendered as board-object chrome.

### Dev-only

Dev-only indication should answer:

- how the runtime is behaving internally;
- how governance/runtime resolution is being computed;
- what internal debug state needs inspection.

Default encoding:

- dedicated debug/dev surfaces;
- never assume these are product-facing by default.

## 9. Current canonical visual precedents

The project already has useful visual precedents that should remain aligned with this behavior model.

### Remote interaction frame

Current reference precedent:

- `src/board/objects/textCard/TextCardRenderer.tsx`

Current shared implementation source:

- `src/board/components/RemoteInteractionIndicator.tsx`

Current geometry/stroke tokens:

- `REMOTE_INTERACTION_FRAME_OUTSET`
- `REMOTE_INTERACTION_FRAME_STROKE_WIDTH`

Known uses:

- remote text-card editing indication;
- occupied-image indication;
- remote preview indication through the preview variant.

Design intent:

- same semantic family should not drift into one-off local variants.

## 10. Cross-user action visibility

This section defines how one participant's actions should become visible and understandable to other participants.

The goal is multiplayer readability, not narration.

### 10.1. Which participant actions should be visible to others by default

These participant actions should be visible to others by default:

- active manipulation of shared objects;
- active editing/drawing on shared objects;
- transient previews of soon-to-be-committed shared actions;
- occupied/blocked conditions caused by another participant's current action;
- consequential room-level actions when they change what others can do or trust.

These should not become visible by default just because they happen:

- every hover;
- every tentative local draft;
- every internal tool toggle;
- every blocked attempt that never affects shared understanding;
- every implementation-level transition.

### 10.2. When only the result is enough vs when the live process should be visible

Only the result is enough when:

- the process does not affect coordination while it is happening;
- other participants do not need to react during the action;
- the committed state is the only meaningful thing.

Examples:

- completed rename after commit;
- completed content edit once saved;
- finished room-level change if no live intervention mattered.

The live process should be visible when:

- others need to understand what is happening right now;
- the action temporarily changes availability or spatial understanding;
- hiding the process would make the room feel confusing or misleading.

Examples:

- remote dragging/resizing preview;
- another participant currently editing a text card;
- another participant currently drawing on an image;
- an object currently occupied/blocked by someone else.

### 10.3. What another participant should understand from a cross-user action signal

A cross-user action signal should communicate, in the smallest useful form:

- who is acting;
- with what;
- what they are doing;
- whether it is happening now or just happened.

In practice:

- participant identity usually comes from participant color and, when needed, a short participant label;
- the affected object or room surface should be legible from placement/context;
- the action type should be clear from the signal family or short text;
- the lifetime/weight should distinguish live action from completed consequence.

### 10.4. Live visibility vs post-action visibility

Live visibility:

- is for actions currently in progress;
- should be spatial and attached to the thing being affected when possible;
- should answer "what is happening right now?"

Post-action visibility:

- is for consequential completed actions;
- should be short-lived unless the resulting state itself persists;
- should answer "what just changed?"

Recommended rule:

- prefer live visibility for coordination-sensitive actions;
- prefer result-only visibility for low-coordination actions;
- use post-action cues only when the consequence matters and is not obvious enough from the new state alone.

### 10.5. Audience model for cross-user action cues

Cross-user action visibility should still obey the broader audience model in this document.

Typical mapping:

- `all participants`
  - active object interaction
  - previews
  - occupied states
  - room-wide consequential actions
- `involved participants only`
  - claim-race loss
  - blocked retries
  - participant-specific action failure detail
- `local only`
  - local pending action detail before it becomes shared truth
- `dev-only`
  - governance/runtime reasoning behind what happened

### 10.6. Truthfulness requirements

If another participant sees a signal as room truth, it must come from actual shared/live state, not local guesswork.

#### Shared-state truth

Committed results must reflect real shared room state.

Post-action visibility must not imply a committed result that did not actually land.

#### Temporary live state

Live action visibility may use ephemeral realtime signals, but it must still represent a real current action.

Previews, locks, occupied states, and similar cues should come from actual live coordination state.

#### Local guess / speculative UI

Local speculation is acceptable only for clearly local pre-commit guidance.

It is not acceptable when shown to others as if it were shared truth.

Especially unacceptable as speculative cross-user truth:

- occupancy;
- action blocking;
- active room availability;
- claimed/held resources;
- completed-action claims.

### 10.7. What should explicitly not become cross-user-visible by default

Do not make these cross-user-visible by default:

- every local intention before it matters;
- every intermediate draft with no coordination impact;
- every internal retry/failure;
- every governance/internal runtime detail;
- every background tab/process detail;
- every action history event as a feed.

The room should feel readable, not narrated.

## 11. What should explicitly not become an indication by default

Do not indicate by default:

- every governance rule continuously;
- every remote participant fact on every object;
- every local mode in multiple places at once;
- every room-memory detail;
- every background runtime transition;
- every inspect/debug fact for normal users.

The project should not become a "signal everything" interface.

## 12. Rules for future indication work

When adding or changing an indication:

1. decide whether it belongs to an existing signal family;
2. define its audience before choosing its rendering;
3. define its lifetime before choosing its weight;
4. choose the quietest encoding that still communicates the needed state;
5. prefer ambient/contextual over blocking/system-critical unless the product meaning truly requires more;
6. keep dev-only inspectability separate from normal end-user indication.

Do not treat:

- "we can technically surface this"

as equivalent to:

- "this deserves a product indication."

## 13. What is intentionally left for later

Left for later:

- a fuller room/session status catalog;
- exact copy/text standards for system messages;
- a complete icon vocabulary;
- object-by-object cleanup passes;
- broader shared implementation extraction beyond the current remote interaction family.

This document should guide those later passes.
