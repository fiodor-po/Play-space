# LiveKit Local Dev

This repo does not start a LiveKit server automatically.

For local development on macOS, the recommended path is **native LiveKit**, not Docker.

Reason:
- the current Dockerized LiveKit path is prone to local ICE/UDP connectivity failures on macOS
- signaling can succeed while media still fails
- for this spike, native local LiveKit is the narrowest reliable dev setup

For the current video spike, local self-hosted LiveKit is expected to match:

- `VITE_LIVEKIT_URL=ws://localhost:7880`
- `LIVEKIT_API_KEY=devkey`
- `LIVEKIT_API_SECRET=secret`

Mode-specific dev env files:

- localhost dev: `.env.localdev`
- LAN HTTPS dev: `.env.landev`

Root `.env` is not required for the standard dev workflows.

## Start locally

1. Install `livekit-server` locally if it is not already available.

2. Start LiveKit natively:

```bash
npm run livekit-server
```

This runs:

```bash
livekit-server --dev --bind 0.0.0.0
```

3. Start the existing app backend:

```bash
npm run presence-server
```

4. Start the frontend:

```bash
npm run dev
```

## Docker fallback

Docker is kept only as a fallback/experimental local path:

```bash
npm run livekit-server:docker
```

Stop Docker fallback:

```bash
npm run livekit-server:docker:down
```

The Docker path may still fail for local browser-to-browser media on macOS even when signaling works.

## Verify LiveKit is up

For the native path, verify the server is listening on:

- `localhost:7880` for signaling
- `localhost:7881` for TCP RTC fallback
- UDP `50000-50100` for WebRTC

Quick checks:

```bash
lsof -i :7880
lsof -i :7881
```

## Token routing in dev

Frontend token fetch does **not** go to the Vite dev server by default.

Current logic in `src/lib/livekit.ts`:

- if `VITE_Y_WEBSOCKET_URL` is set, token requests go to that host with `ws -> http`
- otherwise token requests go to `http://<hostname>:1234`

So in local dev, token requests are expected to hit the existing backend on port `1234`.

## LAN HTTPS testing

For testing from another device on the local network, plain HTTP is not enough for
browser media APIs. Use the repo-local Caddy reverse proxy and open the app over
HTTPS.

### LAN `.env.landev` values

Use:

```env
LAN_HOST=192.168.1.113
VITE_Y_WEBSOCKET_URL=wss://192.168.1.113:3444
VITE_LIVEKIT_URL=wss://192.168.1.113:3445
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

`LAN_HOST` is the single obvious config point for the LAN proxy URL.
When your LAN IP changes, update `.env.landev`.

### Startup sequence

1. Start Vite:

```bash
npm run dev
```

2. Start the existing backend:

```bash
npm run presence-server
```

3. Start LiveKit:

```bash
npm run livekit-server
```

4. Start the LAN HTTPS proxy:

```bash
npm run lan-proxy
```

### URL to open from another device

Open:

```text
https://<LAN_HOST>:3443
```

The proxy routes:

- `https://<LAN_HOST>:3443` -> Vite on `5173`
- `https://<LAN_HOST>:3444` / `wss://<LAN_HOST>:3444` -> presence-server on `1234`
- `https://<LAN_HOST>:3445` / `wss://<LAN_HOST>:3445` -> LiveKit on `7880`

### Certificate trust caveat

`tls internal` means Caddy issues a local development certificate.
The test device must trust Caddy's local CA, otherwise the browser will still treat
the origin as unsafe or show certificate errors.

For device/browser trust troubleshooting, see:

- `docs/lan-https-trust.md`

### Verification checklist

From the other device, open DevTools on:

```text
https://<LAN_HOST>:3443
```

Then verify:

```js
window.isSecureContext === true
```

and:

```js
!!navigator.mediaDevices === true
```
