import type { BoardObject, ViewportState } from "../types/board";

export const BOARD_STORAGE_KEY = "play-space-alpha-board-v1";
export const VIEWPORT_STORAGE_KEY = "play-space-alpha-viewport-v1";

export function loadBoardObjects(fallback: BoardObject[]) {
  const raw = localStorage.getItem(BOARD_STORAGE_KEY);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as BoardObject[];
  } catch {
    return fallback;
  }
}

export function saveBoardObjects(objects: BoardObject[]) {
  localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(objects));
}

export function loadViewportState(): ViewportState {
  const raw = localStorage.getItem(VIEWPORT_STORAGE_KEY);

  if (!raw) {
    return { x: 120, y: 80, scale: 1 };
  }

  try {
    const parsed = JSON.parse(raw) as ViewportState;

    return {
      x: parsed.x ?? 120,
      y: parsed.y ?? 80,
      scale: parsed.scale ?? 1,
    };
  } catch {
    return { x: 120, y: 80, scale: 1 };
  }
}

export function saveViewportState(viewport: ViewportState) {
  localStorage.setItem(VIEWPORT_STORAGE_KEY, JSON.stringify(viewport));
}

export function clearBoardStorage() {
  localStorage.removeItem(BOARD_STORAGE_KEY);
  localStorage.removeItem(VIEWPORT_STORAGE_KEY);
}