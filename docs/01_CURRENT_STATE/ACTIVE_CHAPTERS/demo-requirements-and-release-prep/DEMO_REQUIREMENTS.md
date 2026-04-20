# Demo 2 Requirements

Status: current demo requirements brief  
Scope: must-have product requirements for the next demo on the current architecture

## 1. Product goal

Новая демка должна показать более цельную игровую сессию на текущем board-first
alpha stack.

Демка должна сильнее опираться на:

- публичные кубики;
- рисование поверх изображений;
- встроенное видео;
- более живую token/play surface.

## 2. Must-have requirements

### 2.1. Dice experience

Цель:

- переработать dice experience так, чтобы он ощущался ближе к `D&D Beyond` по
  ясности и удовольствию от броска.

Обязательное первое условие:

- сначала проверить, как current dice layer ведёт себя при одновременных
  бросках несколькими игроками;
- только после этого принимать новый demo-facing pass по dice UX.

Что должно получиться для демки:

- multiplayer-visible public roll ritual остаётся главным поведением;
- одновременные броски сохраняют читаемость и доверие к visible outcome;
- tray/control surface feels tighter and clearer than the current rough state.

### 2.2. Drawing tools

Для demo scope нужны три улучшения drawing:

- ластик;
- частичное стирание кусков линий;
- прямые линии при зажатом `Shift`.

Demo meaning:

- drawing должен ощущаться как полезный быстрый инструмент поверх изображений.

### 2.3. Video

Video входит в новую демку как default-facing layer.

Demo requirements:

- улучшить текущее video UX;
- сделать video default-facing path для демки;
- добавить понятный fallback, когда video недоступно, выключено или не
  конфигурировано;
- сделать video preview draggable;
- сделать video preview resizable.

Demo meaning:

- media layer должен оставаться usable even when real video path is unavailable;
- fallback path должен сохранять demo feel цельным и понятным.

### 2.4. Token creation / dock decision

Для демки нужен более рабочий token-creation path.

Пока это зафиксировано как product choice with one required outcome:

- протестировать идею dock/tray for token creation;
- или сделать более простую явную кнопку создания токенов;
- в любом случае демка должна получить способ быстро создать больше одного
  token during play.

Current requirement:

- choice between `dock/tray` and `button` stays open;
- multi-token creation capability is mandatory.

## 3. Recommended decision order

1. Проверить simultaneous multi-player dice rolls на current layer.
2. Выбрать token-creation UX: `dock/tray` или `button`.
3. Зафиксировать video fallback and default-facing behavior.
4. После этого планировать implementation order для dice, drawing и video
   polish.

## 4. Release gates for this requirement set

Demo 2 is ready only when these statements are true:

- simultaneous dice-roll behavior has been checked and judged acceptable;
- drawing has eraser, partial stroke erase, and `Shift` straight-line support;
- video is demo-default, has a clear fallback state, and preview can move and
  resize;
- token creation supports more than one token during play.

## 5. Explicit non-goals

- post-demo runtime migration;
- `RoomRuntime` extraction;
- `RoomDocumentV1`;
- broad persistence rewrite;
- heavy media platform expansion;
- dice rules engine or roll-history platform.
