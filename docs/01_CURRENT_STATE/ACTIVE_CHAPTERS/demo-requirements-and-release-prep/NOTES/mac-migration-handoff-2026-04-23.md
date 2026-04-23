# Mac Migration Handoff — 2026-04-23

Status: working handoff note  
Scope: short restart point for continuing Demo 2 release prep on a new Mac

## 1. Current checkpoint

Current branch:

- `codex/demo-2`

Current code checkpoint:

- commit `e9ca251`
- message: `Prepare demo 2 feedback and release checkpoint`

This checkpoint already includes:

- Demo 2 dice log surface and related board UI polish;
- media bubbles polish and current demo-facing media controls;
- in-room feedback form;
- enriched feedback payload with room/media/runtime diagnostics;
- client-session recent error buffer;
- ops read route `GET /api/ops/feedback`;
- stable record cursor for feedback paging;
- draft release gate for the feedback stack.

## 2. Current blocker

The main blocker is operational, not product-side.

Hosted frontend already points to the intended Railway backend, but the deployed
Railway runtime is still behind the current server code.

Observed hosted state:

- `GET https://play-space-production.up.railway.app/api/health` -> `200`
- `GET /api/rooms` with hosted ops key -> `200`
- `POST /api/feedback` -> `404`
- `GET /api/ops/feedback` -> `404`

Meaning:

- frontend wiring is already pointed at the right backend;
- hosted backend is alive;
- current hosted backend does not yet include the feedback routes from
  `e9ca251`.

## 3. Product-side status

Feedback stack on the product side is ready enough for hosted verification.

Closed product-side pieces:

- `Report bug` UI exists in room card;
- feedback payload includes:
  - `id`
  - `schemaVersion`
  - `receivedAt`
  - `appVersionLabel`
  - `buildId`
  - `clientDiagnostics`
- feedback read path exists:
  - `GET /api/ops/feedback`
- cursor contract is stable and record-based;
- invalid cursor returns `400 INVALID_FEEDBACK_CURSOR`.

Open product-side caveat:

- exact hosted deploy identification still depends on hosted env wiring for
  `VITE_APP_BUILD_ID`;
- fallback stays honest, but does not distinguish two hosted deploys of the
  same release line.

## 4. Hosted config follow-up already prepared

One additional local prep pass was done after the checkpoint:

- `.env.hosted.example` now includes:
  - `FEEDBACK_STORE_FILE`
  - `PLAY_SPACE_OPS_KEY`
- hosted deployment docs now explicitly mention:
  - feedback store path
  - ops key requirement
  - feedback persistence must be validated after redeploy

These changes are currently uncommitted in the worktree and should be reviewed
and committed on the new Mac if still wanted.

Files:

- [/.env.hosted.example](/Users/fedorpodrezov/Developer/play-space-alpha/.env.hosted.example)
- [hosted-alpha-deployment-plan.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/05_OPERATIONS_AND_VALIDATION/02_DEPLOYMENT/hosted-alpha-deployment-plan.md)
- [ARCHITECTURE.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/04_ARCHITECTURE/00_OVERVIEW/ARCHITECTURE.md)

## 5. Canonical docs to reopen first

On the new Mac, reopen these docs first:

- [CURRENT_CONTEXT.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/00_AGENT_OS/CURRENT_CONTEXT.md)
- [CHAPTER.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/demo-requirements-and-release-prep/CHAPTER.md)
- [DEMO_REQUIREMENTS.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/demo-requirements-and-release-prep/DEMO_REQUIREMENTS.md)
- [EXECUTION_ORDER.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/demo-requirements-and-release-prep/EXECUTION_ORDER.md)
- [feedback-capture-flow.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/01_FLOWS/feedback-capture-flow.md)
- [feedback-stack-release-gate-draft.md](/Users/fedorpodrezov/Developer/play-space-alpha/docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/demo-requirements-and-release-prep/NOTES/feedback-stack-release-gate-draft.md)
- this note

## 6. First recommended step on the new Mac

Do this first:

1. restore the repo and switch to `codex/demo-2`;
2. confirm the working tree state;
3. if the three hosted-template/doc edits are still desired, commit them;
4. set up the wider permissions and deploy tooling;
5. continue with Railway redeploy and hosted feedback verification.

## 7. Next task after migration

Next concrete task:

- redeploy the Railway backend on commit `e9ca251` or newer equivalent;
- then run hosted feedback verification:
  - `/api/health`
  - `POST /api/feedback`
  - `GET /api/ops/feedback`
  - stored record shape
  - `nextCursor`
  - invalid cursor
  - persistence after restart/redeploy
