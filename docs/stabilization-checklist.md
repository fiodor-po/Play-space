# Stabilization Checklist

Этот документ — короткий regression / pre-deploy checklist для текущего alpha core.

Используй его как fast-pass.
Если нужен подробный сценарий, открывай `docs/manual-qa-runbook.md`.

## Build

- [ ] `npm run build`

## Core board control

- [ ] empty-space panning still works
- [ ] wheel zoom stays anchored around pointer
- [ ] selection / editing overlays still behave normally

## Shared board state

- [ ] shared tokens: create / move / delete
- [ ] shared text-cards: create / move / edit
- [ ] shared images: add / move / resize
- [ ] image draw mode: `Draw / Save / Clear`

## Collaboration signals

- [ ] presence / cursors still sync correctly
- [ ] awareness lock still prevents parallel drawing on the same image
- [ ] remote preview does not leak across room switch

## Room lifecycle

- [ ] switch room and back
- [ ] refresh in active room
- [ ] rejoin while room is still live
- [ ] durable snapshot smoke still behaves plausibly

## Dice

- [ ] local dice tray still works
- [ ] shared public roll still reaches second client
- [ ] final visible result remains consistent across clients
- [ ] actor color remains correct for remote rolls

## Media dock

- [ ] local media join/leave path still works if video is enabled
- [ ] mic/cam toggles recover cleanly
- [ ] intentional leave does not look like disconnect error

## Pre-deploy watch items

- [ ] no obvious local-dev-only assumption was introduced
- [ ] logs/errors remain understandable enough for hosted debugging
- [ ] no change silently widened scope into architecture rewrite
