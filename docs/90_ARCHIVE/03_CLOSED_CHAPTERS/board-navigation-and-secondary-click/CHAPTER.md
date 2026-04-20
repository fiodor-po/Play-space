# Board Navigation And Secondary-Click Chapter

Status: archived closed chapter bundle  
Closure: accepted working checkpoint, archived on 2026-04-20  
Scope: board navigation, wheel behavior, explicit desktop pan gestures, and placeholder secondary-click behavior

Этот bundle хранит финальную рабочую рамку chapter `board navigation and
secondary-click behavior`.

## 1. Chapter goal

Довести desktop navigation до понятной и предсказуемой модели, потом отдельно
принять mobile navigation model, и только после этого расширять
secondary-click actions.

## 2. In scope

### 2.1. Desktop navigation

- board pan через `Space + drag`
- board pan через `middle mouse drag`
- обычный `wheel` двигает viewport по доске
- `Ctrl + wheel` делает zoom
- временный recovery shortcut `Shift + 1` центрирует доску и ставит current max zoom-out

### 2.2. Secondary click

- secondary click открывает placeholder context menu
- первый placeholder action: `Inspect`

### 2.3. Mobile inside this chapter

Mobile входит в chapter второй частью, но не в первый implementation slice.

Сначала нужен короткий research pass по touch navigation contract.

## 3. Explicitly out of scope

- полноценная система context actions
- object-specific context actions beyond the placeholder
- mobile implementation before touch research
- broad `BoardStage` cleanup
- media chapter
- broad board-object controls rework
- broad runtime migration or persistence changes

## 4. Current agreed interaction truth

### 4.1. Desktop target model

- обычный `wheel` = pan viewport
- `Ctrl + wheel` = zoom
- `Space + drag` = pan viewport
- `middle mouse drag` = pan viewport
- `Shift + 1` = centered board at `MIN_SCALE`
- secondary click = placeholder context menu

### 4.2. Mobile target model

Current mobile truth is not yet implementation-ready.

What is already agreed:

- current mobile navigation should not be redefined casually inside the desktop
  slices
- one-finger pan on touch is not accepted by default because it conflicts with
  select / object interaction
- current likely direction is closer to scroll / two-finger navigation plus
  pinch zoom
- exact mobile navigation model needs a narrow research pass first

## 5. Planned slice order

### Slice 1. Desktop wheel behavior

Goal:

- ordinary `wheel` pans the board
- `Ctrl + wheel` zooms the board

This slice must not change:

- `Space + drag`
- `middle mouse drag`
- mobile gestures
- secondary-click behavior
- object drag / resize / draw semantics

### Slice 2. Explicit desktop pan gestures

- `Space + drag`
- `middle mouse drag`

### Slice 3. Secondary-click placeholder

- minimal context menu
- `Inspect`

### Slice 4. Mobile navigation research

- inspect current touch behavior
- describe selection conflicts
- choose a safe gesture model

### Slice 5. Mobile navigation implementation

- implement only after the research decision is fixed

## 6. Acceptance direction for the chapter

The chapter should end with:

- predictable desktop board navigation
- placeholder secondary-click affordance in place
- mobile navigation model explicitly chosen
- mobile implementation either landed or split into a clearly bounded follow-up

## 7. First-slice acceptance criteria

For `Slice 1. Desktop wheel behavior`:

- ordinary `wheel` no longer zooms
- ordinary `wheel` pans the viewport
- `Ctrl + wheel` zooms
- current object interaction corridors still behave as before
- empty-space board navigation remains stable
