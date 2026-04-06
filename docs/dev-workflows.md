# Dev Workflows

## Localhost dev

Mode-specific env file:

- `.env.localdev`

Root `.env` is not required for this workflow.

Run:

```bash
npm run dev:local
```

This starts:

- Vite dev server
- `presence-server`
- native `livekit-server`

App URL:

```text
http://localhost:5173
```

## LAN HTTPS dev

Mode-specific env file:

- `.env.landev`

Root `.env` is not required for this workflow.

Run:

```bash
npm run dev:lan
```

This starts:

- Vite dev server
- `presence-server`
- native `livekit-server`
- Caddy LAN HTTPS proxy

App URL:

```text
https://<LAN_HOST>:3443
```

This mode expects LAN HTTPS values in `.env.landev` and a trusted local Caddy
CA on the test device.

Troubleshooting:

- `docs/lan-https-trust.md`

## Shutdown

Both commands keep running until interrupted.

To stop everything:

- press `Ctrl+C` in the terminal where the dev workflow is running

The wrapper script traps shutdown and sends stop signals to all child services.

## Caveats

- `npm run dev:local` requires `livekit-server` to be installed locally
- `npm run dev:lan` requires both `livekit-server` and `caddy`
- localhost mode reads from `.env.localdev`
- LAN mode reads from `.env.landev`
- when your LAN IP changes, update only `.env.landev`:
  - `LAN_HOST`
  - `VITE_Y_WEBSOCKET_URL`
  - `VITE_LIVEKIT_URL`
