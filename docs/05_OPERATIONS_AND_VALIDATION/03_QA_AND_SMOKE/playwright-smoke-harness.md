# Playwright Smoke Harness

## Роль этого файла

Этот файл описывает локальный browser smoke harness для `play-space-alpha`.

Он нужен для agent-facing workflow вокруг board/runtime/recovery validation.

Он отвечает на вопросы:

- как запускать smoke harness;
- когда агент обязан его запускать;
- что уже покрыто;
- какие runtime warnings сейчас допустимы;
- что harness ещё не заменяет.

## Команды

Установка зависимостей:

```bash
npm install
```

One-time browser install на новой машине:

```bash
npm run smoke:e2e:install
```

Обычный headless smoke run:

```bash
npm run smoke:e2e
```

Headed run для живого просмотра:

```bash
npm run smoke:e2e:headed
```

## Когда запускать harness

Для board/runtime/recovery/persistence changes локальный smoke harness является
обязательным machine gate.

Базовое правило:

- `npm run build`
- `npm run smoke:e2e`

Это правило относится к pass'ам, которые трогают:

- `BoardStage`
- room bootstrap / recovery
- browser-local replica behavior
- durable snapshot / durable recovery behavior
- object commit corridors
- narrow inspectability, которая нужна для проверки этих коридоров

## Что harness покрывает сейчас

Текущий accepted local smoke baseline покрывает:

- shared note sync between two browser contexts;
- active-room refresh while live state stays available;
- same-browser second-tab attach to the active room session inside one browser
  profile;
- committed image move/resize sync to a second browser context;
- committed image move/resize refresh survival while room stays live;
- committed image draw/save refresh survival while room stays live;
- same-browser local-only recovery for image state through current
  `replica-converged` / IndexedDB settled corridor;
- same-browser token move recovery through current
  `replica-converged` / IndexedDB settled corridor;
- versioned empty local replica keeps same-browser reopen on the empty local
  document instead of stale `room-snapshot` or baseline fallback;
- same-browser note move recovery through current
  `replica-converged` / IndexedDB settled corridor;
- same-browser note resize recovery through current
  `replica-converged` / IndexedDB settled corridor;
- same-browser note text save recovery through current
  `replica-converged` / IndexedDB settled corridor;
- same-browser note create-only reopen through current
  `replica-converged` / IndexedDB settled corridor;
- same-browser note delete-only reopen through current
  `replica-converged` / IndexedDB settled corridor;
- same-browser durable-ahead reopen now verifies per-slice durable catch-up for
  the `textCards` slice after provisional local-open;
- stale `room-snapshot` no longer changes same-browser reopen when no local
  replica exists;
- same-browser local recovery corridors now expose the provisional
  `Initial open` inspectability contract before settled bootstrap;
- runtime failure policy for uncaught page errors and disallowed console
  events.

## Stable smoke invariants

Эти expectations остаются valid across replica-track transitions:

- committed state survives refresh or reopen for the corridor under test;
- shared state reaches a second browser context where that corridor should stay
  shared;
- same-browser reopen preserves committed state for the current test corridor;
- suite fails on disallowed runtime regressions.

## Assertions for the current smoke/debug contract

Эти assertions фиксируют текущий smoke/debug contract:

- settled recovery state names such as `live-active` and `replica-converged`;
- initial-open status/source strings for local-first recovery inspection;
- exact local source strings such as `indexeddb` and `none`;
- exact `Last read:` source strings;
- current covered same-browser image/token/note recovery corridors use
  IndexedDB;
- current same-browser second-tab attach corridor uses one browser profile and
  should keep the second tab in `live-active` joined state without a fresh join
  flow;
- stale `room-snapshot` is now ignored by recovery and survives only as an
  optional legacy write-side tail outside the current recovery semantics.

Эти assertions подлежат review после следующих replica-track steps.
Они не задают mature target semantics сами по себе.

## Runtime failure policy

Smoke suite now fails when:

- Playwright sees `pageerror`;
- browser console emits warning/error outside the explicit allowlist.

Current accepted allowlist stays narrow and covers only:

- durable snapshot browser resource errors `404`
- transient local `y-websocket` close-before-established warnings
- Chromium headless `ReadPixels` WebGL warning

Если новый warning становится допустимым baseline, его нужно добавить явно.
Blanket ignore недопустим.

## Что harness не заменяет

Smoke harness не заменяет:

- human product judgement;
- hosted validation;
- pointer-level UX assessment;
- full media / LiveKit automation;
- every possible board corridor.

Он даёт machine gate для текущих локальных board/runtime/recovery рисков.

## Как читать результат

Если `npm run smoke:e2e` зелёный, это означает:

- локальный stack поднимается автоматически;
- covered room corridors проходят без ручных шагов;
- suite не видит disallowed runtime failures в этих сценариях.

Если suite падает, это означает одно из двух:

- реальный regression в covered corridor;
- новый runtime warning/error outside allowlist.

Обе причины требуют явного разбора.

## Когда harness нужно пересматривать

Harness review обязателен после:

- `Local replica semantics`
- `Durable write model`
- `Recovery convergence model`
- `Core semantic cutover from snapshot arbitration`

## Что пересматривать на этих переходах

После `Local replica semantics`:

- legacy `room-snapshot` assertions that become stale when a covered corridor
  moves to IndexedDB;
- exact local source strings;
- exact `Last read:` strings;
- exact `Settled: replica-converged` expectations where the settled contract
  changes.

After `Durable write model`:

- durable warning allowlist;
- browser resource error expectations tied to current durable snapshot timing;
- helper logic that assumes snapshot-era durable behavior;
- current single-writer covered corridors should finish without accepted durable
  `save-conflict` warning noise;
- covered multi-client durable update corridors should finish without accepted
  `409` resource-error noise;
- covered cross-slice durable happy paths should finish without logical
  conflict/retry on the acting writer.

After `Recovery convergence model`:

- stale `room-snapshot` assertions that no longer belong to recovery semantics;
- provisional initial-open assertions;
- `live-active` assertions;
- exact `Settled: replica-converged` expectations;
- source-centric settled assertions.

After `Core semantic cutover`:

- source-centric settled assertions no longer belong to the current contract;
- stable invariants and convergence-era assertions remain the main smoke surface.

## Где искать связанные правила

- `AGENTS.md`
- `docs/00_AGENT_OS/EXECUTOR_QUICKSTART.md`
- `docs/05_OPERATIONS_AND_VALIDATION/03_QA_AND_SMOKE/stabilization-checklist.md`
- `docs/04_ARCHITECTURE/02_DATA_AND_SYNC/room-document-replica-track-plan.md`

## Что делать, если smoke касается replica-track

Для replica-track harness — это machine gate, а не human gate.

Workflow:

1. сделать узкий implementation pass;
2. запустить `npm run build`;
3. запустить `npm run smoke:e2e`;
4. если step ещё требует живой browser judgement, вернуть ход человеку;
5. только потом двигаться к следующему step или checkpoint.
