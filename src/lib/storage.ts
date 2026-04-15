import type { BoardObject, ViewportState } from "../types/board";
import { normalizeTokenObject } from "../board/objects/token/createTokenObject";
import {
  isNoteCardObject,
  normalizeNoteCardObject,
} from "../board/objects/noteCard/sizing";
import { normalizeRoomId } from "./roomId";

export const BOARD_STORAGE_KEY = "play-space-alpha-board-v1";
export const VIEWPORT_STORAGE_KEY = "play-space-alpha-viewport-v1";
export const ROOM_TOKEN_STORAGE_KEY = "play-space-alpha-room-tokens-v1";
export const ROOM_IMAGE_STORAGE_KEY = "play-space-alpha-room-images-v1";
export const ROOM_TEXT_CARD_STORAGE_KEY = "play-space-alpha-room-text-cards-v1";
export const ROOM_SNAPSHOT_STORAGE_KEY = "play-space-alpha-room-snapshot-v1";
export const ROOM_DOCUMENT_REPLICA_STORAGE_KEY =
  "play-space-alpha-room-document-replica-v1";
const ROOM_DOCUMENT_REPLICA_INDEXED_DB_NAME =
  "play-space-alpha-browser-storage-v1";
const ROOM_DOCUMENT_REPLICA_INDEXED_DB_VERSION = 1;
const ROOM_DOCUMENT_REPLICA_INDEXED_DB_STORE_NAME = "room-document-replicas";

export type RoomSnapshot = {
  roomId: string;
  savedAt: number;
  tokens: BoardObject[];
  images: BoardObject[];
  textCards: BoardObject[];
};

export type RoomDocumentContent = {
  tokens: BoardObject[];
  images: BoardObject[];
  textCards: BoardObject[];
};

export type LocalRoomDocumentReplica = {
  roomId: string;
  revision: number | null;
  savedAt: number;
  content: RoomDocumentContent;
};

export type LocalRoomDocumentReplicaWriteOptions = {
  commitBoundary?:
    | "default"
    | "image-drag-end"
    | "image-transform-end"
    | "image-draw-commit"
    | "token-drop"
    | "note-drag-end"
    | "note-resize-end"
    | "note-text-save";
};

export type LocalRoomDocumentReplicaLoadResult = {
  replica: LocalRoomDocumentReplica | null;
  source: "indexeddb" | "legacy-localstorage" | "none";
};

export type LocalRoomDocumentBootstrapReadSource =
  | "indexeddb"
  | "legacy-localstorage"
  | "room-snapshot"
  | "none";

export type LocalRoomDocumentBootstrapState = {
  source: LocalRoomDocumentBootstrapReadSource;
  content: RoomDocumentContent | null;
  objectCount: number;
  savedAt: number | null;
  revision: number | null;
  isVersionAware: boolean;
};

let roomDocumentReplicaDatabasePromise: Promise<IDBDatabase> | null = null;

export function loadBoardObjects(roomId: string, fallback: BoardObject[]) {
  const raw = localStorage.getItem(getBoardStorageKey(roomId));

  if (!raw) {
    return fallback;
  }

  try {
    return normalizeBoardObjects(JSON.parse(raw) as BoardObject[]);
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
    textCards: objects.filter((object) => isNoteCardObject(object)),
  };

  try {
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
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RoomSnapshot>;

    if (parsed.roomId !== roomId) {
      return null;
    }

    return {
      roomId,
      savedAt:
        typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
      tokens: Array.isArray(parsed.tokens)
        ? normalizeTokenObjects(
            parsed.tokens.filter((object) => object?.kind === "token")
          )
        : [],
      images: Array.isArray(parsed.images)
        ? parsed.images.filter((object) => object?.kind === "image")
        : [],
      textCards: Array.isArray(parsed.textCards)
        ? normalizeTextCardObjects(
            parsed.textCards.filter((object) => object?.kind === "note-card")
          )
        : [],
    };
  } catch {
    return null;
  }
}

export async function saveLocalRoomDocumentReplica(
  roomId: string,
  objects: BoardObject[],
  options?: LocalRoomDocumentReplicaWriteOptions
) {
  const storageKey = getRoomDocumentReplicaStorageKey(roomId);

  try {
    if (import.meta.env.DEV) {
      console.info("[room-document-replica][local-write][attempt]", {
        commitBoundary: options?.commitBoundary ?? "default",
        roomId,
        storageKey,
      });
    }

    const replica = await putNextLocalRoomDocumentReplica(roomId, objects);
    const serializedReplica = JSON.stringify(replica);
    const payloadBytes = new TextEncoder().encode(serializedReplica).length;

    try {
      localStorage.removeItem(storageKey);
    } catch (cleanupError) {
      console.warn("[room-document-replica][legacy-cleanup][failed]", {
        roomId,
        storageKey,
        error: cleanupError,
      });
    }

    if (import.meta.env.DEV) {
      console.info("[room-document-replica][local-write][saved]", {
        commitBoundary: options?.commitBoundary ?? "default",
        roomId,
        storageKey,
        databaseName: ROOM_DOCUMENT_REPLICA_INDEXED_DB_NAME,
        storeName: ROOM_DOCUMENT_REPLICA_INDEXED_DB_STORE_NAME,
        payloadBytes,
        revision: replica.revision,
        savedAt: replica.savedAt,
        objectCount: getRoomDocumentReplicaObjectCount(replica),
      });
    }

    return replica;
  } catch (error) {
    console.error("[room-document-replica][local-write][failed]", {
      commitBoundary: options?.commitBoundary ?? "default",
      roomId,
      storageKey,
      error,
    });

    throw error;
  }
}

export async function loadLocalRoomDocumentReplica(
  roomId: string
): Promise<LocalRoomDocumentReplicaLoadResult> {
  try {
    const replica = await getLocalRoomDocumentReplicaFromIndexedDb(roomId);

    if (replica) {
      return {
        replica,
        source: "indexeddb",
      };
    }
  } catch (error) {
    console.error("[room-document-replica][local-read][failed]", {
      roomId,
      databaseName: ROOM_DOCUMENT_REPLICA_INDEXED_DB_NAME,
      storeName: ROOM_DOCUMENT_REPLICA_INDEXED_DB_STORE_NAME,
      error,
    });
  }

  const legacyReplica = loadLegacyLocalRoomDocumentReplica(roomId);

  if (legacyReplica) {
    void putLocalRoomDocumentReplica(legacyReplica)
      .then(() => {
        localStorage.removeItem(getRoomDocumentReplicaStorageKey(roomId));
      })
      .catch((error) => {
        console.warn("[room-document-replica][legacy-migration][failed]", {
          roomId,
          error,
        });
      });

    return {
      replica: legacyReplica,
      source: "legacy-localstorage",
    };
  }

  return {
    replica: null,
    source: "none",
  };
}

export async function loadLocalRoomDocumentBootstrapState(
  roomId: string
): Promise<LocalRoomDocumentBootstrapState> {
  const localReplicaResult = await loadLocalRoomDocumentReplica(roomId);
  const localReplica = localReplicaResult.replica;
  const localReplicaObjectCount = localReplica
    ? getRoomDocumentReplicaObjectCount(localReplica)
    : 0;
  const hasVersionAwareLocalReplica =
    typeof localReplica?.revision === "number";

  if (localReplica && (hasVersionAwareLocalReplica || localReplicaObjectCount > 0)) {
    return {
      source: localReplicaResult.source,
      content: localReplica.content,
      objectCount: localReplicaObjectCount,
      savedAt: localReplica.savedAt,
      revision: localReplica.revision,
      isVersionAware: hasVersionAwareLocalReplica,
    };
  }

  const legacyRoomSnapshot = loadRoomSnapshot(roomId);
  const legacyRoomSnapshotObjectCount = getRoomSnapshotObjectCount(
    legacyRoomSnapshot
  );

  if (legacyRoomSnapshot && legacyRoomSnapshotObjectCount > 0) {
    return {
      source: "room-snapshot",
      content: {
        tokens: legacyRoomSnapshot.tokens,
        images: legacyRoomSnapshot.images,
        textCards: legacyRoomSnapshot.textCards,
      },
      objectCount: legacyRoomSnapshotObjectCount,
      savedAt: legacyRoomSnapshot.savedAt,
      revision: null,
      isVersionAware: false,
    };
  }

  return {
    source: "none",
    content: null,
    objectCount: 0,
    savedAt: null,
    revision: null,
    isVersionAware: false,
  };
}

export function clearBoardStorage(roomId: string) {
  clearBoardContentStorage(roomId);
  localStorage.removeItem(getViewportStorageKey(roomId));
}

export function clearBoardContentStorage(roomId: string) {
  localStorage.removeItem(getBoardStorageKey(roomId));
  localStorage.removeItem(getRoomTokenStorageKey(roomId));
  localStorage.removeItem(getRoomImageStorageKey(roomId));
  localStorage.removeItem(getRoomTextCardStorageKey(roomId));
  localStorage.removeItem(getRoomSnapshotStorageKey(roomId));
  localStorage.removeItem(getRoomDocumentReplicaStorageKey(roomId));
  void deleteLocalRoomDocumentReplica(roomId);
}

export async function clearAllBrowserLocalRoomStorage() {
  const storagePrefixes = [
    BOARD_STORAGE_KEY,
    VIEWPORT_STORAGE_KEY,
    ROOM_TOKEN_STORAGE_KEY,
    ROOM_IMAGE_STORAGE_KEY,
    ROOM_TEXT_CARD_STORAGE_KEY,
    ROOM_SNAPSHOT_STORAGE_KEY,
    ROOM_DOCUMENT_REPLICA_STORAGE_KEY,
  ];

  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (
      key &&
      storagePrefixes.some((prefix) => key.startsWith(`${prefix}:`))
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
  await clearLocalRoomDocumentReplicaDatabase();
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
    return normalizeTokenObjects(
      (JSON.parse(raw) as BoardObject[]).filter(
        (object) => object.kind === "token"
      )
    );
  } catch {
    return fallback.filter((object) => object.kind === "token");
  }
}

function normalizeTokenObjects(objects: BoardObject[]) {
  return objects.map((object) =>
    object.kind === "token" ? normalizeTokenObject(object) : object
  );
}

function normalizeTextCardObjects(objects: BoardObject[]) {
  return objects.map((object) =>
    isNoteCardObject(object) ? normalizeNoteCardObject(object) : object
  );
}

function normalizeBoardObjects(objects: BoardObject[]) {
  return objects.map((object) => {
    if (object.kind === "token") {
      return normalizeTokenObject(object);
    }

    if (isNoteCardObject(object)) {
      return normalizeNoteCardObject(object);
    }

    return object;
  });
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
    return normalizeTextCardObjects(
      fallback.filter((object) => isNoteCardObject(object))
    );
  }

  try {
    return normalizeTextCardObjects(
      (JSON.parse(raw) as BoardObject[]).filter((object) => isNoteCardObject(object))
    );
  } catch {
    return normalizeTextCardObjects(
      fallback.filter((object) => isNoteCardObject(object))
    );
  }
}

export function saveRoomTextCardObjects(roomId: string, objects: BoardObject[]) {
  localStorage.setItem(
    getRoomTextCardStorageKey(roomId),
    JSON.stringify(objects.filter((object) => isNoteCardObject(object)))
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
  return `${BOARD_STORAGE_KEY}:${normalizeRoomId(roomId)}`;
}

function getViewportStorageKey(roomId: string) {
  return `${VIEWPORT_STORAGE_KEY}:${normalizeRoomId(roomId)}`;
}

function getRoomTokenStorageKey(roomId: string) {
  return `${ROOM_TOKEN_STORAGE_KEY}:${normalizeRoomId(roomId)}`;
}

function getRoomImageStorageKey(roomId: string) {
  return `${ROOM_IMAGE_STORAGE_KEY}:${normalizeRoomId(roomId)}`;
}

function getRoomTextCardStorageKey(roomId: string) {
  return `${ROOM_TEXT_CARD_STORAGE_KEY}:${normalizeRoomId(roomId)}`;
}

function getRoomSnapshotStorageKey(roomId: string) {
  return `${ROOM_SNAPSHOT_STORAGE_KEY}:${normalizeRoomId(roomId)}`;
}

function getRoomDocumentReplicaStorageKey(roomId: string) {
  return `${ROOM_DOCUMENT_REPLICA_STORAGE_KEY}:${normalizeRoomId(roomId)}`;
}

function getRoomSnapshotObjectCount(snapshot: RoomSnapshot | null) {
  return snapshot
    ? snapshot.tokens.length + snapshot.images.length + snapshot.textCards.length
    : 0;
}

function createLocalRoomDocumentReplica(
  roomId: string,
  objects: BoardObject[],
  previousReplica?: LocalRoomDocumentReplica | null
): LocalRoomDocumentReplica {
  return {
    roomId,
    revision: getNextLocalRoomDocumentReplicaRevision(previousReplica),
    savedAt: Date.now(),
    content: {
      tokens: normalizeTokenObjects(
        objects.filter((object) => object.kind === "token")
      ),
      images: objects.filter((object) => object.kind === "image"),
      textCards: normalizeTextCardObjects(
        objects.filter((object) => object.kind === "note-card")
      ),
    },
  };
}

function getNextLocalRoomDocumentReplicaRevision(
  previousReplica?: LocalRoomDocumentReplica | null
) {
  const previousRevision =
    typeof previousReplica?.revision === "number" ? previousReplica.revision : 0;

  return previousRevision + 1;
}

function getRoomDocumentReplicaObjectCount(replica: LocalRoomDocumentReplica) {
  return (
    replica.content.tokens.length +
    replica.content.images.length +
    replica.content.textCards.length
  );
}

function loadLegacyLocalRoomDocumentReplica(roomId: string) {
  const raw = localStorage.getItem(getRoomDocumentReplicaStorageKey(roomId));

  if (!raw) {
    return null;
  }

  return parseLocalRoomDocumentReplica(roomId, raw);
}

function parseLocalRoomDocumentReplica(roomId: string, raw: string) {
  try {
    const parsed = JSON.parse(raw) as Partial<LocalRoomDocumentReplica>;

    if (parsed.roomId !== roomId || !parsed.content) {
      return null;
    }

    return {
      roomId,
      revision:
        typeof parsed.revision === "number" ? parsed.revision : null,
      savedAt:
        typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
      content: {
        tokens: Array.isArray(parsed.content.tokens)
          ? normalizeTokenObjects(
              parsed.content.tokens.filter((object) => object?.kind === "token")
            )
          : [],
        images: Array.isArray(parsed.content.images)
          ? parsed.content.images.filter((object) => object?.kind === "image")
          : [],
        textCards: Array.isArray(parsed.content.textCards)
          ? normalizeTextCardObjects(
              parsed.content.textCards.filter(
                (object) => object?.kind === "note-card"
              )
            )
          : [],
      },
    };
  } catch {
    return null;
  }
}

function openRoomDocumentReplicaDatabase() {
  if (roomDocumentReplicaDatabasePromise) {
    return roomDocumentReplicaDatabasePromise;
  }

  roomDocumentReplicaDatabasePromise = new Promise<IDBDatabase>(
    (resolve, reject) => {
      if (
        typeof window === "undefined" ||
        typeof window.indexedDB === "undefined"
      ) {
        reject(new Error("indexeddb-unavailable"));
        return;
      }

      const request = window.indexedDB.open(
        ROOM_DOCUMENT_REPLICA_INDEXED_DB_NAME,
        ROOM_DOCUMENT_REPLICA_INDEXED_DB_VERSION
      );

      request.onerror = () => {
        reject(request.error ?? new Error("indexeddb-open-failed"));
      };

      request.onupgradeneeded = () => {
        const database = request.result;

        if (
          !database.objectStoreNames.contains(
            ROOM_DOCUMENT_REPLICA_INDEXED_DB_STORE_NAME
          )
        ) {
          database.createObjectStore(ROOM_DOCUMENT_REPLICA_INDEXED_DB_STORE_NAME, {
            keyPath: "roomId",
          });
        }
      };

      request.onsuccess = () => {
        const database = request.result;

        database.onversionchange = () => {
          database.close();
          roomDocumentReplicaDatabasePromise = null;
        };

        resolve(database);
      };
    }
  ).catch((error) => {
    roomDocumentReplicaDatabasePromise = null;
    throw error;
  });

  return roomDocumentReplicaDatabasePromise;
}

async function putLocalRoomDocumentReplica(replica: LocalRoomDocumentReplica) {
  const database = await openRoomDocumentReplicaDatabase();
  const transaction = database.transaction(
    ROOM_DOCUMENT_REPLICA_INDEXED_DB_STORE_NAME,
    "readwrite"
  );
  const store = transaction.objectStore(ROOM_DOCUMENT_REPLICA_INDEXED_DB_STORE_NAME);

  await waitForRequest(store.put(replica));
  await waitForTransaction(transaction);
}

async function putNextLocalRoomDocumentReplica(
  roomId: string,
  objects: BoardObject[]
) {
  const legacyReplica = loadLegacyLocalRoomDocumentReplica(roomId);
  const database = await openRoomDocumentReplicaDatabase();
  const transaction = database.transaction(
    ROOM_DOCUMENT_REPLICA_INDEXED_DB_STORE_NAME,
    "readwrite"
  );
  const store = transaction.objectStore(ROOM_DOCUMENT_REPLICA_INDEXED_DB_STORE_NAME);
  const rawReplica = await waitForRequest<LocalRoomDocumentReplica | undefined>(
    store.get(roomId)
  );
  const currentReplica = rawReplica
    ? parseLocalRoomDocumentReplica(roomId, JSON.stringify(rawReplica))
    : legacyReplica;
  const nextReplica = createLocalRoomDocumentReplica(
    roomId,
    objects,
    currentReplica
  );

  await waitForRequest(store.put(nextReplica));
  await waitForTransaction(transaction);

  return nextReplica;
}

async function getLocalRoomDocumentReplicaFromIndexedDb(roomId: string) {
  const database = await openRoomDocumentReplicaDatabase();
  const transaction = database.transaction(
    ROOM_DOCUMENT_REPLICA_INDEXED_DB_STORE_NAME,
    "readonly"
  );
  const store = transaction.objectStore(ROOM_DOCUMENT_REPLICA_INDEXED_DB_STORE_NAME);
  const rawReplica = await waitForRequest<LocalRoomDocumentReplica | undefined>(
    store.get(roomId)
  );

  await waitForTransaction(transaction);

  if (!rawReplica) {
    return null;
  }

  return parseLocalRoomDocumentReplica(roomId, JSON.stringify(rawReplica));
}

async function deleteLocalRoomDocumentReplica(roomId: string) {
  try {
    const database = await openRoomDocumentReplicaDatabase();
    const transaction = database.transaction(
      ROOM_DOCUMENT_REPLICA_INDEXED_DB_STORE_NAME,
      "readwrite"
    );
    const store = transaction.objectStore(
      ROOM_DOCUMENT_REPLICA_INDEXED_DB_STORE_NAME
    );

    await waitForRequest(store.delete(roomId));
    await waitForTransaction(transaction);
  } catch (error) {
    console.warn("[room-document-replica][clear-room][failed]", {
      roomId,
      error,
    });
  }
}

async function clearLocalRoomDocumentReplicaDatabase() {
  try {
    const database = await openRoomDocumentReplicaDatabase();
    const transaction = database.transaction(
      ROOM_DOCUMENT_REPLICA_INDEXED_DB_STORE_NAME,
      "readwrite"
    );
    const store = transaction.objectStore(
      ROOM_DOCUMENT_REPLICA_INDEXED_DB_STORE_NAME
    );

    await waitForRequest(store.clear());
    await waitForTransaction(transaction);
  } catch (error) {
    console.warn("[room-document-replica][clear-all][failed]", {
      error,
    });
  }
}

function waitForRequest<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error("indexeddb-request-failed"));
    };
  });
}

function waitForTransaction(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = () => {
      reject(transaction.error ?? new Error("indexeddb-transaction-failed"));
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error("indexeddb-transaction-aborted"));
    };
  });
}
