# Stabilization Checklist

Этот документ — короткий regression / pre-deploy checklist для текущего alpha core.

Используй его как fast-pass.
Если нужен подробный сценарий, открывай `docs/manual-qa-runbook.md`.

## Build

- [ ] `npm run build`
- [ ] `npm run smoke:e2e`

## Local browser smoke

- [ ] shared note всё ещё доходит до второго browser context
- [ ] refresh в active room всё ещё восстанавливает joined state и current live board state

## Hosted smoke minimum

- [ ] deployed frontend HTML points to the expected current asset
- [ ] deployed backend `/api/health` matches the expected runtime/env state
- [ ] if token/media path changed, the intended token endpoint responds directly
- [ ] room entry still works in hosted mode
- [ ] one second-client smoke still passes for presence and one shared object flow

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
- [ ] bootstrap / recovery branch is visible in logs

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
- [ ] effective realtime/API/LiveKit URLs are visible in diagnostics
- [ ] logs/errors remain understandable enough for hosted debugging
- [ ] config failures are understandable enough to debug quickly
- [ ] no change silently widened scope into architecture rewrite
