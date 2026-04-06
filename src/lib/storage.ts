import type { BoardObject, ViewportState } from "../types/board";

export const BOARD_STORAGE_KEY = "play-space-alpha-board-v1";
export const VIEWPORT_STORAGE_KEY = "play-space-alpha-viewport-v1";
export const ROOM_TOKEN_STORAGE_KEY = "play-space-alpha-room-tokens-v1";
export const ROOM_IMAGE_STORAGE_KEY = "play-space-alpha-room-images-v1";
export const ROOM_TEXT_CARD_STORAGE_KEY = "play-space-alpha-room-text-cards-v1";
export const ROOM_SNAPSHOT_STORAGE_KEY = "play-space-alpha-room-snapshot-v1";

export type RoomSnapshot = {
  roomId: string;
  savedAt: number;
  tokens: BoardObject[];
  images: BoardObject[];
  textCards: BoardObject[];
};

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

export function saveRoomSnapshot(roomId: string, objects: BoardObject[]) {
  const snapshot: RoomSnapshot = {
    roomId,
    savedAt: Date.now(),
    tokens: objects.filter((object) => object.kind === "token"),
    images: objects.filter((object) => object.kind === "image"),
    textCards: objects.filter((object) => object.kind === "text-card"),
  };

  try {
    console.info("[room-recovery][local-snapshot][save]", {
      roomId,
      tokenCount: snapshot.tokens.length,
      imageCount: snapshot.images.length,
      textCardCount: snapshot.textCards.length,
    });
    localStorage.setItem(
      getRoomSnapshotStorageKey(roomId),
      JSON.stringify(snapshot)
    );
  } catch (error) {
    console.error("Failed to save room snapshot", error);
  }
}

export function loadRoomSnapshot(roomId: string): RoomSnapshot | null {
  const raw = localStorage.getItem(getRoomSnapshotStorageKey(roomId));

  if (!raw) {
    console.info("[room-recovery][local-snapshot][load]", {
      roomId,
      exists: false,
      tokenCount: 0,
      imageCount: 0,
      textCardCount: 0,
    });
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RoomSnapshot>;

    if (parsed.roomId !== roomId) {
      console.info("[room-recovery][local-snapshot][load]", {
        roomId,
        exists: true,
        usable: false,
        reason: "room-id-mismatch",
      });
      return null;
    }

    const snapshot = {
      roomId,
      savedAt:
        typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
      tokens: Array.isArray(parsed.tokens)
        ? parsed.tokens.filter((object) => object?.kind === "token")
        : [],
      images: Array.isArray(parsed.images)
        ? parsed.images.filter((object) => object?.kind === "image")
        : [],
      textCards: Array.isArray(parsed.textCards)
        ? parsed.textCards.filter((object) => object?.kind === "text-card")
        : [],
    };

    console.info("[room-recovery][local-snapshot][load]", {
      roomId,
      exists: true,
      usable: true,
      tokenCount: snapshot.tokens.length,
      imageCount: snapshot.images.length,
      textCardCount: snapshot.textCards.length,
    });

    return snapshot;
  } catch {
    console.info("[room-recovery][local-snapshot][load]", {
      roomId,
      exists: true,
      usable: false,
      reason: "parse-error",
    });
    return null;
  }
}

export function clearBoardStorage(roomId: string) {
  localStorage.removeItem(getBoardStorageKey(roomId));
  localStorage.removeItem(getViewportStorageKey(roomId));
  localStorage.removeItem(getRoomTokenStorageKey(roomId));
  localStorage.removeItem(getRoomImageStorageKey(roomId));
  localStorage.removeItem(getRoomTextCardStorageKey(roomId));
  localStorage.removeItem(getRoomSnapshotStorageKey(roomId));
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
    JSON.stringify(objects.filter((object) => object.kind === "image"))
  );
}

export function saveRoomImageObject(roomId: string, image: BoardObject) {
  const currentImages = loadRoomImageObjects(roomId);

  localStorage.setItem(
    getRoomImageStorageKey(roomId),
    JSON.stringify([
      ...currentImages.filter((currentImage) => currentImage.id !== image.id),
      image,
    ])
  );
}

export function removeRoomImageObject(roomId: string, imageId: string) {
  const currentImages = loadRoomImageObjects(roomId);

  localStorage.setItem(
    getRoomImageStorageKey(roomId),
    JSON.stringify(
      currentImages.filter((currentImage) => currentImage.id !== imageId)
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

export function loadRoomTextCardObjects(
  roomId: string,
  fallback: BoardObject[] = []
) {
  const raw = localStorage.getItem(getRoomTextCardStorageKey(roomId));

  if (!raw) {
    return fallback.filter((object) => object.kind === "text-card");
  }

  try {
    return (JSON.parse(raw) as BoardObject[]).filter(
      (object) => object.kind === "text-card"
    );
  } catch {
    return fallback.filter((object) => object.kind === "text-card");
  }
}

export function saveRoomTextCardObjects(roomId: string, objects: BoardObject[]) {
  localStorage.setItem(
    getRoomTextCardStorageKey(roomId),
    JSON.stringify(objects.filter((object) => object.kind === "text-card"))
  );
}

export function subscribeToRoomTextCardObjects(
  roomId: string,
  onChange: (objects: BoardObject[]) => void
) {
  const storageKey = getRoomTextCardStorageKey(roomId);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== storageKey) {
      return;
    }

    onChange(loadRoomTextCardObjects(roomId));
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

function getRoomTextCardStorageKey(roomId: string) {
  return `${ROOM_TEXT_CARD_STORAGE_KEY}:${roomId}`;
}

function getRoomSnapshotStorageKey(roomId: string) {
  return `${ROOM_SNAPSHOT_STORAGE_KEY}:${roomId}`;
}
