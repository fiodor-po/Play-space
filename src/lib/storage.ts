import type { BoardObject, ViewportState } from "../types/board";

export const BOARD_STORAGE_KEY = "play-space-alpha-board-v1";
export const VIEWPORT_STORAGE_KEY = "play-space-alpha-viewport-v1";

export function loadBoardObjects(roomId: string, fallback: BoardObject[]) {
  const raw = localStorage.getItem(getBoardStorageKey(roomId));

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as BoardObject[];
  } catch {
    return fallback;
  }
}

export function saveBoardObjects(roomId: string, objects: BoardObject[]) {
  try {
    localStorage.setItem(getBoardStorageKey(roomId), JSON.stringify(objects));
  } catch (error) {
    console.error("Failed to save board objects", error);
  }
}

export function loadViewportState(roomId: string): ViewportState {
  const raw = localStorage.getItem(getViewportStorageKey(roomId));

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

export function saveViewportState(roomId: string, viewport: ViewportState) {
  localStorage.setItem(getViewportStorageKey(roomId), JSON.stringify(viewport));
}

export function clearBoardStorage(roomId: string) {
  localStorage.removeItem(getBoardStorageKey(roomId));
  localStorage.removeItem(getViewportStorageKey(roomId));
}

function getBoardStorageKey(roomId: string) {
  return `${BOARD_STORAGE_KEY}:${roomId}`;
}

function getViewportStorageKey(roomId: string) {
  return `${VIEWPORT_STORAGE_KEY}:${roomId}`;
}
