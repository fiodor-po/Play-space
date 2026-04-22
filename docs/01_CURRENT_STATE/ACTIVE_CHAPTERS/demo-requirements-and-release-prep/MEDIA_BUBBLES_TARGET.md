# Demo 2 Media Bubbles Target

Status: current working target  
Scope: video/audio direction for Demo 2 on the current architecture

Этот документ фиксирует Demo 2 direction для media layer.

## 1. Product decision

Demo 2 media target: `media bubbles layer`.

Каждый участник комнаты получает круглый media bubble:

- все участники видят bubbles всех участников;
- bubble показывает live video, если camera track доступен;
- bubble показывает avatar / placeholder, если video нет;
- border bubble использует цвет участника;
- bubble текущего участника примерно на `10%` больше остальных;
- bubbles можно rearrange локально;
- default placement остаётся product detail для первого implementation slice.

## 2. Auto-connect behavior

Media подключается автоматически при входе в room.

Expected behavior:

- после join room app запускает media connection;
- app пытается включить camera и microphone;
- если permission или config недоступны, participant bubble остаётся в fallback
  state;
- media error/status показывается в room control card;
- media starts as the room-entry default path without a separate `Join media`
  action.

## 3. Current media layer shape

Demo 2 target surface is the media bubbles layer.

`useLiveKitMediaSession` owns media session logic.

Current ownership:

- `LiveKitMediaLayer` creates one shared media session for the room;
- `LiveKitMediaBubbles` owns video/fallback bubbles and local camera/mic controls;
- `LiveKitRemoteAudioHost` owns hidden remote audio attachment;
- room control card / participant session panel owns media status and errors.

## 4. Source of truth

Participant bubbles should be driven from room participants / presence first.

LiveKit participants and tracks attach media content to those bubbles.

This keeps bubbles visible for:

- participant with video;
- participant with camera off;
- participant with media unavailable;
- participant before LiveKit track arrival.

## 5. Layout decision for first pass

Recommended first pass:

- screen-space bubbles;
- local-only positions;
- bottom-right rail as initial default;
- local drag to rearrange;
- optional localStorage persistence only if cheap and safe.

Shared media-bubble positions are deferred.

Reason:

- Demo 2 needs reliable playable media presence;
- local arrangement is enough for current demo validation;
- shared layout sync can become a later product decision.

## 6. Implementation sequence

Recommended implementation slices:

1. Extract reusable media session logic into `useLiveKitMediaSession` while
   preserving current behavior.
2. Add auto-connect on room entry.
3. Render participant media bubbles from room participants plus LiveKit tracks.
4. Move media error/status into the room control card.
5. Add local bubble drag/rearrange.
6. Add camera/mic controls next to or attached to the local bubble.
7. Hide or remove old dock UI after the bubbles path is stable.

Current working-tree checkpoint:

- `useLiveKitMediaSession` owns the LiveKit connection, and
  `LiveKitMediaLayer` shares one media session between bubbles and remote audio.
- `LiveKitMediaBubbles` renders screen-space bubbles from the local session,
  room occupancies, and room presences, then attaches LiveKit camera tracks when
  available.
- `LiveKitRemoteAudioHost` attaches remote microphone tracks through hidden audio
  elements.
- the room control card shows media status and errors.
- the local bubble owns camera/mic controls.

## 7. Open product details

- initial bubble placement;
- exact bubble size, with local participant `+10%`;
- placeholder content: initials, avatar color, token glyph, or simple fallback;
- whether bubble positions persist per room;
- whether remote participant bubbles expose any controls in Demo 2.

## 8. Constraints

- keep the current architecture;
- reuse existing LiveKit integration where practical;
- keep media as board-adjacent session layer;
- keep controls small and demo-facing;
- defer broad media-platform work;
- defer shared bubble layout sync.
