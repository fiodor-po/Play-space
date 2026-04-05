import type { BoardObject, ViewportState } from "../types/board";

export const BOARD_STORAGE_KEY = "play-space-alpha-board-v1";
export const VIEWPORT_STORAGE_KEY = "play-space-alpha-viewport-v1";
export const ROOM_TOKEN_STORAGE_KEY = "play-space-alpha-room-tokens-v1";
export const ROOM_IMAGE_STORAGE_KEY = "play-space-alpha-room-images-v1";

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
  localStorage.removeItem(getRoomTokenStorageKey(roomId));
  localStorage.removeItem(getRoomImageStorageKey(roomId));
}

export function loadRoomTokenObjects(
  roomId: string,
  fallback: BoardObject[] = []
) {
  const raw = localStorage.getItem(getRoomTokenStorageKey(roomId));

  if (!raw) {
    return fallback.filter((object) => object.kind === "token");
  }

  try {
    return (JSON.parse(raw) as BoardObject[]).filter(
      (object) => object.kind === "token"
    );
  } catch {
    return fallback.filter((object) => object.kind === "token");
  }
}

export function saveRoomTokenObjects(roomId: string, objects: BoardObject[]) {
  localStorage.setItem(
    getRoomTokenStorageKey(roomId),
    JSON.stringify(objects.filter((object) => object.kind === "token"))
  );
}

export function subscribeToRoomTokenObjects(
  roomId: string,
  onChange: (objects: BoardObject[]) => void
) {
  const storageKey = getRoomTokenStorageKey(roomId);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== storageKey) {
      return;
    }

    onChange(loadRoomTokenObjects(roomId));
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}

export function loadRoomImageObjects(
  roomId: string,
  fallback: BoardObject[] = []
) {
  const raw = localStorage.getItem(getRoomImageStorageKey(roomId));

  if (!raw) {
    return fallback.filter((object) => object.kind === "image");
  }

  try {
    return (JSON.parse(raw) as BoardObject[]).filter(
      (object) => object.kind === "image"
    );
  } catch {
    return fallback.filter((object) => object.kind === "image");
  }
}

export function saveRoomImageObjects(roomId: string, objects: BoardObject[]) {
  localStorage.setItem(
    getRoomImageStorageKey(roomId),
    JSON.stringify(
      objects
        .filter((object) => object.kind === "image")
        .map((object) => {
          const { imageStrokes: _imageStrokes, ...sharedImage } = object;
          return sharedImage;
        })
    )
  );
}

export function subscribeToRoomImageObjects(
  roomId: string,
  onChange: (objects: BoardObject[]) => void
) {
  const storageKey = getRoomImageStorageKey(roomId);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== storageKey) {
      return;
    }

    onChange(loadRoomImageObjects(roomId));
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}

function getBoardStorageKey(roomId: string) {
  return `${BOARD_STORAGE_KEY}:${roomId}`;
}

function getViewportStorageKey(roomId: string) {
  return `${VIEWPORT_STORAGE_KEY}:${roomId}`;
}

function getRoomTokenStorageKey(roomId: string) {
  return `${ROOM_TOKEN_STORAGE_KEY}:${roomId}`;
}

function getRoomImageStorageKey(roomId: string) {
  return `${ROOM_IMAGE_STORAGE_KEY}:${roomId}`;
}
