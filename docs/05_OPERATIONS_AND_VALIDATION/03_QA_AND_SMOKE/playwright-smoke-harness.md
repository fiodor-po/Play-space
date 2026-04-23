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

Обычный headless demo smoke gate:

```bash
npm run smoke:e2e
```

Headed demo smoke run для живого просмотра:

```bash
npm run smoke:e2e:headed
```

Отдельные расширенные suites:

```bash
npm run test:e2e:runtime
npm run test:e2e:media
npm run test:e2e:design-system
npm run test:e2e:all
```

## Когда запускать harness

Для demo-release readiness локальный short smoke gate остаётся обязательным
machine gate.

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

Для runtime/recovery/media changes short gate сам по себе не заменяет полный
suite review.

Добавляй:

- `npm run test:e2e:runtime` для room/recovery corridors;
- `npm run test:e2e:media` для media/audio-meter checks;
- `npm run test:e2e:design-system` для DOM state-delta sandbox;
- `npm run test:e2e:all` только когда нужен полный локальный прогон.

## Что harness покрывает сейчас

Текущий accepted local demo smoke baseline покрывает:

- shared note sync between two browser contexts;
- active-room refresh while live state stays available;
- same-browser second-tab attach to the active room session inside one browser
  profile;
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
- runtime failure policy for uncaught page errors and disallowed console
  events.

Расширенные suites отдельно покрывают:

- image move/resize sync and refresh survival;
- image draw/save refresh survival;
- same-browser image recovery corridors;
- token recovery corridors;
- stale `room-snapshot` reopen corridor;
- media audio-meter diagnostics and LiveKit browser-media checks;
- design-system DOM state-delta checks.

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
- runtime/recovery suites outside the short gate;
- full media / LiveKit automation;
- design-system sandbox coverage;
- every possible board corridor.

Он даёт machine gate для текущих локальных board/runtime/recovery рисков.

## Как читать результат

Если `npm run smoke:e2e` зелёный, это означает:

- локальный stack поднимается автоматически;
- covered short-gate corridors проходят без ручных шагов;
- suite не видит disallowed runtime failures в этих сценариях.

Это не означает, что `test:e2e:runtime`, `test:e2e:media` или
`test:e2e:design-system` тоже зелёные.

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
