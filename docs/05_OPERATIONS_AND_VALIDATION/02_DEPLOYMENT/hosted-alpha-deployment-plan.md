# Hosted Alpha Deployment Plan

## Status
Current status:

- first hosted alpha core environment is up;
- core hosted validation passed;
- video is still an optional hosted follow-up layer.

This is not a final production platform design.
It defines the narrowest practical hosted shape that can generate real product signal.

## 1. Goal

Get `play-space-alpha` into a first hosted environment that is good enough for:

- real multiplayer playable-session checks;
- remote device/browser validation;
- catching hosted-only bugs;
- reducing dependence on local-only workflows.

## 2. What this deployment is and is not

### It is
- a first hosted alpha / staging-like environment;
- a practical product-validation step;
- a minimal split runtime.

### It is not
- full production hardening;
- autoscaling infrastructure;
- enterprise-grade observability platform;
- long-term final hosting architecture.
- separate public/internal build system.

## 2.1 Public demo strategy for current alpha

For the current stage, public demos should be handled as fixed chosen snapshot deploys.

That means:

- continue normal project work on the main line;
- periodically select a stable checkpoint;
- deploy that checkpoint as the current public demo;
- do not introduce a separate public/internal build split yet.

## 3. Preferred topology

### Frontend
Host separately, ideally on Vercel.

Reason:
- easiest path to a stable HTTPS app URL;
- good fit for a React/Vite frontend.

### Realtime / API backend
Host separately as a long-running Node service on VPS / VM / similar host.

This service should own:

- Yjs / websocket realtime
- token/API/backend endpoints
- room snapshot routes
- other long-running server-side logic

Important currently verified hosted limitation:

- current hosted snapshot storage survives ordinary backend restart;
- current hosted snapshot storage does **not** survive redeploy;
- so the current Railway-hosted snapshot layer is not yet deploy-stable persistence.

### LiveKit
If built-in video remains enabled in hosted alpha, keep LiveKit as its own separate service / endpoint.

Do not try to collapse realtime/API and LiveKit into one magical box before the first hosted alpha proves useful.

### Narrow token-route fallback
If the hosted backend keeps failing to expose LiveKit credentials cleanly, a narrow fallback is acceptable:

- keep Railway for websocket/API/snapshots/core backend;
- keep LiveKit as its own service;
- move only LiveKit token minting to a Vercel Function;
- point the frontend token fetch at that Vercel endpoint.

### Recommended first-pass decision

For the cheapest practical hosted alpha:

- frontend: enabled
- realtime/API backend: enabled
- durable room snapshot route: enabled
- dice: enabled
- video: optional and explicitly toggled

If video increases deployment complexity disproportionately, disable the media dock in hosted alpha instead of forcing LiveKit into the very first environment.

### Chosen first-pass deployment shape

For the current repo, the narrowest practical deploy shape is:

- frontend: static Vite build on Vercel-style host
- realtime/API backend: single containerized Node service running `scripts/yjs-dev-server.mjs`
- video: disabled by default via `VITE_ENABLE_LIVEKIT_MEDIA=false`

This keeps first hosted alpha focused on core board/session validation.

## 4. Canonical URL shape

Suggested shape:

- `app.<domain>` -> frontend
- `api.<domain>` or `rt.<domain>` -> Node realtime/API backend
- `livekit.<domain>` -> LiveKit

The exact subdomain names can vary, but the layer split should stay explicit.

## 5. Pre-deploy prerequisites

Before deployment:

- run read-only technical audit;
- identify narrow stabilization tasks;
- make sure env/config assumptions are explicit;
- confirm what is required for alpha startup vs optional;
- decide whether video is in-scope for the first hosted alpha stack or temporarily disabled.

## 5.1 Required runtime configuration

Before first hosted alpha, make these runtime assumptions explicit:

### Frontend
- `VITE_Y_WEBSOCKET_URL`
- `VITE_API_BASE_URL`
- `VITE_LIVEKIT_URL` if video is enabled
- `VITE_LIVEKIT_TOKEN_URL` if using the Vercel token-route fallback
- `VITE_ENABLE_LIVEKIT_MEDIA`

### Realtime / API backend
- websocket host/bind configuration
- durable room snapshot store path or equivalent persistent storage path
- feedback store path or equivalent persistent storage path
- `PLAY_SPACE_OPS_KEY` for hosted ops routes
- `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` if token minting stays on this service

Important hosted persistence rule:

- do not assume `ROOM_SNAPSHOT_STORE_FILE` is truly deploy-persistent just because it survives restart;
- do not assume `FEEDBACK_STORE_FILE` is truly deploy-persistent just because it survives restart;
- current hosted reality has already shown restart persistence without redeploy persistence;
- this must be explicitly validated, not inferred.

### Vercel Function fallback
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

### Product/runtime decisions
- whether video is enabled by default in hosted alpha
- whether LiveKit is required for alpha startup or optional

Rule:

- do not rely on silent same-host fallback assumptions in hosted alpha unless that topology is explicitly intentional.
- keep websocket and HTTP API bases as separate runtime inputs even when they point to the same host today.

Suggested first hosted-alpha default:

- `VITE_ENABLE_LIVEKIT_MEDIA=false` until the base hosted board stack is confirmed healthy

## 6. Scope for first hosted alpha

### In scope
- one stable frontend URL;
- one stable realtime/API URL;
- optional stable LiveKit URL;
- working room entry and multiplayer board;
- basic shared-object flows;
- durable room snapshot route path if it is part of current alpha;
- smoke validation after deploy.

### Out of scope
- autoscaling;
- complex infra modularization;
- extensive monitoring platform;
- CI/CD sophistication;
- zero-downtime deploys;
- production-grade secrets platform.

## 7. Deployment sequence

### Phase 1 — Audit and stabilize
- complete read-only technical audit
- fix only real pre-deploy blockers

### Phase 2 — Backend host
- deploy long-running Node realtime/API service
- verify websocket path
- verify room snapshot API path
- verify `/api/health`
- verify env/config separation from local dev
- prefer the repo-provided `Dockerfile.realtime-api` as the first deployment artifact

### Phase 3 — Frontend host
- deploy frontend to stable HTTPS host
- wire frontend env vars to hosted backend URLs
- verify app boot and room entry
- prefer the repo-provided `vercel.json` for SPA route fallback

### Phase 4 — LiveKit host (if enabled)
- deploy LiveKit separately
- wire signaling URL
- set `VITE_ENABLE_LIVEKIT_MEDIA=true`
- set backend `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`
- verify join/leave/mic/cam basics

### Phase 5 — Hosted smoke pass
- room entry
- presence
- shared tokens / images / text-cards
- draw/save/clear
- room switch / refresh / rejoin basics
- durable recovery smoke if relevant
- dice public roll
- media dock smoke if enabled

## 8. Smoke checklist

After deploy, verify:

- hosted app loads over HTTPS
- frontend resolves the intended hosted realtime URL and the intended hosted API base URL
- realtime/API health endpoint responds
- room join works
- presence/cursors work
- shared objects sync between two remote clients
- panning/zoom still behave correctly
- draw/save/clear still work
- room switching still isolates state correctly
- refresh / rejoin behave plausibly
- recovery path is diagnosable in logs
- config failures are understandable from logs/UI
- dice public rolls remain consistent
- media join/toggles work if video is enabled

## 8.1 Minimal debugging signals to expect

Before hosted alpha, it should be possible to tell from logs:

- which realtime/API URL the client derived or used;
- which bootstrap/recovery branch won:
  - live
  - durable snapshot
  - local fallback
  - empty room
- whether durable snapshot load/save failed or conflicted;
- whether LiveKit token loading failed because of config vs connection;
- whether video is intentionally disabled vs misconfigured.

## 8.3 Narrow hosted video enable pass

When moving from hosted core to hosted video:

1. keep the existing frontend + realtime/API split unchanged;
2. enable `VITE_ENABLE_LIVEKIT_MEDIA=true` on the frontend;
3. configure `VITE_LIVEKIT_URL` to the hosted LiveKit endpoint;
4. either configure backend `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`, or set `VITE_LIVEKIT_TOKEN_URL` and configure those secrets on Vercel;
5. if using Railway token minting, redeploy or restart the hosted backend so the running process picks up the new env values;
6. verify the chosen token route returns a token in hosted mode;
7. if using Railway token minting, verify `/api/health` reports `liveKitStatus: "enabled"` and `liveKitCredentials.apiKeyPresent/apiSecretPresent`;
8. then run a minimal media join/leave smoke pass.

If this adds disproportionate infra complexity, stop and treat video as a separate narrow blocker rather than broadening the whole hosted stack.

## 8.2 Minimal first-pass hosted commands

Backend:

```bash
cp .env.hosted.example .env.hosted
PLAY_SPACE_ENV_FILE=.env.hosted node ./scripts/yjs-dev-server.mjs
```

Backend container build:

```bash
docker build -f Dockerfile.realtime-api -t play-space-alpha-realtime .
```

Backend container run:

```bash
docker run --rm -p 1234:1234 --env-file .env.hosted play-space-alpha-realtime
```

Frontend build:

```bash
npm run build
```

Frontend preview-style smoke:

```bash
npm run preview -- --host 0.0.0.0
```

Frontend hosted target:

- deploy `dist/` to Vercel or another static host
- keep SPA fallback enabled for room URLs

These commands are not a final production process model.
They are the narrowest hosted-like starting point for first alpha prep.

## 9. Open decision points

- Is video enabled in the very first hosted alpha, or added one step later?
- Is the backend a single Node service at first, or split further only later?
- What is the cheapest hosting stack with acceptable websocket reliability?
- What minimum logs/error surfacing are required before hosted testing becomes supportable?

## 10. Practical rule

If a proposed hosted-alpha setup adds a lot of infrastructure complexity but little product-validation value, reject it.

The first hosted alpha should optimize for:

- minimal complexity;
- reliable URLs;
- enough stability to run real sessions;
- fast learning.
