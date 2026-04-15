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
- [ ] shared image move/resize commit всё ещё доходит до второго browser context
- [ ] committed image bounds всё ещё переживают refresh, пока room остаётся live
- [ ] committed image draw/save всё ещё переживает refresh, пока room остаётся live
- [ ] same-browser reopen без второго live client всё ещё восстанавливает committed room state через `converged-recovery` settled corridor
- [ ] version-aware empty local replica при same-browser reopen всё ещё удерживает empty local document вместо stale `room-snapshot` или baseline fallback
- [ ] same-browser reopen без второго live client всё ещё восстанавливает committed image draw/save через `converged-recovery` settled corridor
- [ ] same-browser reopen без второго live client всё ещё восстанавливает committed token move через `converged-recovery` / IndexedDB settled corridor
- [ ] same-browser reopen без второго live client всё ещё восстанавливает committed note move, committed note resize и saved note text через `converged-recovery` / IndexedDB settled corridor
- [ ] same-browser reopen без второго live client всё ещё восстанавливает committed note create через `converged-recovery` / IndexedDB settled corridor
- [ ] same-browser reopen без второго live client всё ещё восстанавливает committed note delete через `converged-recovery` / IndexedDB settled corridor
- [ ] same-browser reopen с stale local replica и preserved durable snapshot всё ещё дотягивает durable-ahead `textCards` slice до settled state после provisional local-open
- [ ] stale `room-snapshot` больше не меняет same-browser reopen, когда local replica отсутствует
- [ ] covered two-browser cross-slice durable corridor finishes with durable `saved` and without retry/conflict on the acting writer
- [ ] smoke harness валит suite на uncaught page errors и на console warning/error вне явного allowlist
- [ ] accepted runtime allowlist остаётся узким и сейчас покрывает только durable snapshot `404` resource errors, transient local `y-websocket` close-before-established и Chromium `ReadPixels` warning

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

- [ ] participant marker move still syncs correctly
- [ ] shared text-cards: create / move / edit
- [ ] shared images: add / move / resize
- [ ] image draw mode: `Draw / Save / Clear`

## Collaboration signals

- [ ] presence / cursors still sync correctly
- [ ] awareness lock still prevents parallel drawing on the same image
- [ ] remote preview does not leak across room switch

## Room lifecycle

- [ ] `Leave room` returns to entry and joining another room stays clean
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
