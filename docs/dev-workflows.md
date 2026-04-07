# Dev Workflows

Этот документ — канонический entry point для локального запуска проекта.

Используй его как основной source of truth для dev-startup.
`docs/livekit-local-dev.md` остаётся дополнительным deep-dive note про underlying LiveKit setup и troubleshooting.

## 1. Required local tools

### Always required
- Node.js LTS
- npm

### Required for built-in video workflows
- `livekit-server`

### Required for LAN HTTPS mode
- `caddy`

## 2. Environment files

Используются mode-specific env files:

- localhost mode: `.env.localdev`
- LAN HTTPS mode: `.env.landev`
- hosted-like prep: `.env.hosted.example` -> `.env.hosted`

Root `.env` не нужен для стандартных repo-local workflows.

`VITE_ENABLE_LIVEKIT_MEDIA` can disable the media dock for the cheapest first hosted-alpha shape.
For the hosted video enable pass, set `VITE_ENABLE_LIVEKIT_MEDIA=true` and provide valid `VITE_LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`.

## 3. Main workflows

## A. Localhost dev

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

Use this mode when:

- you are working alone on the same machine;
- you want the fastest normal local loop;
- you do not need secure-origin testing on another device.

## B. LAN HTTPS dev

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

Use this mode when:

- you want multi-device media testing;
- you need `navigator.mediaDevices` on another device;
- you want a more realistic local LAN smoke path.

This mode expects valid values in `.env.landev` and trusted local Caddy CA on the test device.

See:

- `docs/lan-https-trust.md`

## 4. Manual component mode

For debugging or if wrapper scripts are not enough, components can still be started separately.

Frontend only:

```bash
npm run dev
```

Yjs / API backend:

```bash
npm run presence-server
```

LiveKit:

```bash
npm run livekit-server
```

LAN proxy:

```bash
npm run lan-proxy
```

Этот режим нужен для deep debugging, а не как основной happy-path workflow.

## 5. Docker fallback for LiveKit

Experimental fallback only:

```bash
npm run livekit-server:docker
```

Stop:

```bash
npm run livekit-server:docker:down
```

Docker path не считается preferred local-dev default, особенно на macOS.

## 6. Shutdown

Both wrapper workflows keep running until interrupted.

To stop everything:

- press `Ctrl+C` in the terminal where the workflow is running

The wrapper scripts should stop child services too.

## 7. Caveats

- `npm run dev:local` requires local `livekit-server`
- `npm run dev:lan` requires both `livekit-server` and `caddy`
- localhost mode reads from `.env.localdev`
- LAN mode reads from `.env.landev`
- when your LAN IP changes, update `.env.landev`:
  - `LAN_HOST`
  - `VITE_Y_WEBSOCKET_URL`
  - `VITE_LIVEKIT_URL`

## 8. Recommended sanity checks

After startup, confirm:

- app opens
- board loads
- presence works in second tab if relevant
- if testing video, media join works
- if testing LAN mode, browser is in secure context and `navigator.mediaDevices` exists

## 9. Related docs

- `docs/livekit-local-dev.md`
- `docs/lan-https-trust.md`
- `docs/manual-qa-runbook.md`
- `docs/hosted-alpha-deployment-plan.md`
