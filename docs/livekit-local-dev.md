# LiveKit Local Dev

Этот документ больше не является главным startup guide.
Канонический repo-level startup path описан в `docs/dev-workflows.md`.

Этот файл нужен для:

- объяснения, почему native LiveKit является preferred local-dev path;
- ручного deep debugging;
- понимания underlying token/network assumptions.

## 1. Current recommended local path

Для обычной разработки используй:

```bash
npm run dev:local
```

Или для multi-device secure-origin checks:

```bash
npm run dev:lan
```

Обе wrapper-команды поднимают LiveKit как часть общего dev workflow.

## 2. Why native LiveKit is preferred

Для local development на macOS preferred path остаётся **native LiveKit**, а не Docker.

Причины:

- Dockerized LiveKit path склонен к confusing ICE/UDP failures на macOS;
- signaling может работать, а media — нет;
- для текущего проекта native local path остаётся самым узким и надёжным dev default.

## 3. Manual LiveKit start

Если нужно запустить LiveKit отдельно вручную:

```bash
npm run livekit-server
```

This runs:

```bash
livekit-server --dev --bind 0.0.0.0
```

## 4. Manual component startup

Frontend:

```bash
npm run dev
```

Backend / Yjs / token endpoint:

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

Use this mode only for debugging underlying components.

## 5. Docker fallback

Docker kept only as fallback / experiment:

```bash
npm run livekit-server:docker
```

Stop:

```bash
npm run livekit-server:docker:down
```

Do not treat Docker as the default success path for local media validation.

## 6. Expected dev values

Current narrow local-dev expectation:

```env
VITE_LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

LAN mode uses `.env.landev` values instead.

## 7. Token routing in dev

Frontend token fetch does not go to Vite by default.

Current logic is expected to resolve token requests against the existing backend / Yjs host path.

Practical dev expectation:

- token requests go to the backend on port `1234`, directly or through the LAN proxy host mapping.

## 8. Verify LiveKit is up

For native path, verify the server is listening on:

- `localhost:7880` for signaling
- `localhost:7881` for TCP RTC fallback
- UDP `50000-50100` for WebRTC

Quick checks:

```bash
lsof -i :7880
lsof -i :7881
```

## 9. LAN HTTPS note

For other devices on the LAN, plain HTTP is not enough for browser media APIs.

Use:

```bash
npm run dev:lan
```

Then open:

```text
https://<LAN_HOST>:3443
```

If the device/browser does not trust the local Caddy CA, media APIs may stay unavailable.

See:

- `docs/lan-https-trust.md`

## 10. Practical interpretation

If localhost works but LAN media fails, assume this order first:

1. secure-origin / certificate trust issue
2. local network / proxy issue
3. LiveKit transport issue
4. app logic issue

Do not jump straight to product-level conclusions before checking trust and runtime plumbing.
