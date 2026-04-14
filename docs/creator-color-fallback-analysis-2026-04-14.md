# Creator-Color Fallback Analysis — 2026-04-14

Статус: read-only analysis note  
Scope: participant-marker tokens, creator-colored token rendering, refresh/leave wrong-color behavior

## Summary

Текущее wrong-color behavior на refresh/leave имеет конкретный runtime path.

- token color сначала резолвится как live creator color по `creatorId`
- затем fallback идёт в `object.fill`
- `object.fill` записывается при создании token и позже может устареть после смены participant color
- при refresh/leave live creator-color source может исчезнуть
- после этого token показывает stale stored `fill`

Это semantic/runtime gap текущей creator-color model.
Это не incidental rendering noise.

## Current token color resolution path

1. `TokenRenderer` получает `fillColor` из `getTokenFillColor(object)`.
2. `getTokenFillColor` делает `getLiveCreatorColor(object) ?? object.fill`.
3. `getLiveCreatorColor` вызывает `resolveCurrentParticipantColor` по `object.creatorId`.
4. `resolveCurrentParticipantColor` идёт по порядку:
   - local participant session color
   - `roomOccupancies[participantId]?.color`
   - `participantPresences[participantId]?.color`
   - `null`

## What produces the wrong old color

Wrong old color produces `object.fill`.

- token `fill` записывается из текущего participant color в момент создания token
- later participant color changes обновляют live participant state
- token-local stored `fill` не становится honest current creator-color source
- when live lookup disappears, rendering falls back to stale token-local color

## What exists and what does not

В системе уже есть:

- `creatorId` on token objects
- live participant-color resolution by `creatorId`
- local room-member history with `assignedColor`

В системе пока нет:

- honest shared non-live current color source by `creatorId`

`room member history.assignedColor` не подходит как canonical fallback truth.
Current docs already define it as remembered default / room history, not as authoritative current creator color.

## Scope conclusion

Проблема шире одной marker instance.

- every token currently uses the same creator-color fallback shape
- wrong-color behavior therefore belongs to the creator-colored token model
- participant-marker tokens are the product-facing runtime surface where this gap is now visible

## Follow-up conclusion

Этот follow-up обязателен для later participant-marker / creator-color chapter.

- issue should stay recorded as unsolved
- issue should not be reframed as visual polish
- issue should not be treated as random refresh noise
- next step belongs to a later semantics/runtime decision about creator-color fallback when live creator color is unavailable
