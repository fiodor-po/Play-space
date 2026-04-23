# Feedback Stack Release Gate Draft

Status: working draft  
Scope: release gate for the deployed feedback stack that Demo 2 needs before
post-release report triage can move to backend and agent workflows only

## 1. Purpose

Этот draft фиксирует минимальный release gate для feedback stack.

Цель простая:

- игрок может отправить report из deployed room;
- report сохраняется после redeploy;
- agent может прочитать reports через ops route;
- post-release triage можно настраивать позже без новых изменений в product UI.

## 2. Release gate

Feedback stack ready for release only when these statements are true:

1. `Report bug` виден в room card и успешно сабмитится из deployed product.
2. Hosted frontend шлёт feedback в intended API backend, и request проходит
   через реальный cross-origin path этого deploy без случайного origin fallback.
3. Hosted backend принимает `POST /api/feedback`.
4. Hosted backend хранит feedback в persistent storage, который переживает
   redeploy и restart.
5. Hosted backend отдаёт `GET /api/ops/feedback`.
6. `PLAY_SPACE_OPS_KEY` задан в hosted runtime, и ops read path остаётся
   закрытым без него.
7. Agent или ops user могут прочитать `GET /api/ops/feedback` с ключом.
8. Новый feedback entry содержит минимум:
   - `id`
   - `schemaVersion`
   - `receivedAt`
   - `appVersionLabel`
   - `buildId`
   - `clientDiagnostics`
9. Build marker strategy разделяет:
   - release line через `appVersionLabel`
   - exact deploy marker через `buildId`
10. Hosted release gate требует явный `VITE_APP_BUILD_ID` или другой
    deploy-injected equivalent, если triage должен различать два deploy одной
    и той же release version.
11. `nextCursor` у `GET /api/ops/feedback` работает на hosted так же, как
    локально.
12. Невалидный `cursor` честно возвращает `400 INVALID_FEEDBACK_CURSOR`.
13. Ошибка записи feedback не ломает room UI и показывает нормальный failure
    state.
14. Документация фиксирует:
    - куда пишется feedback;
    - как читается ops route;
    - какие env обязательны для hosted.

## 3. One-time hosted checks

Перед релизом один раз пройти такой hosted check:

1. Отправить тестовый report из hosted room.
2. Прочитать его через `GET /api/ops/feedback`.
3. Сделать redeploy.
4. Убедиться, что запись не исчезла.
5. Проверить `nextCursor` на hosted хотя бы на двух страницах.
6. Проверить failure state формы, если API временно недоступен.

## 4. Deliberate exclusions

Этот release gate пока не требует:

- triage statuses;
- automatic deduplication;
- GitHub / Linear routing;
- human-facing admin UI;
- scheduled agent polling.

Эти слои можно добавить позже, если capture, storage и ops read path уже
честно работают в deployed stack.
