import type { BoardObject } from "../types/board";

export type DurableRoomSnapshot = {
  roomId: string;
  revision: number;
  savedAt: string;
  tokens: BoardObject[];
  images: BoardObject[];
  textCards: BoardObject[];
};

type DurableRoomSnapshotWritePayload = {
  baseRevision: number | null;
  tokens: BoardObject[];
  images: BoardObject[];
  textCards: BoardObject[];
};

export type DurableRoomSnapshotSaveResult =
  | { status: "saved"; snapshot: DurableRoomSnapshot }
  | { status: "conflict"; currentRevision: number | null }
  | { status: "unavailable" };

export async function loadDurableRoomSnapshot(
  roomId: string
): Promise<DurableRoomSnapshot | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, 1500);

  try {
    const response = await fetch(getDurableRoomSnapshotUrl(roomId), {
      signal: controller.signal,
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to load durable room snapshot: ${response.status}`);
    }

    const parsed = (await response.json()) as {
      snapshot?: Partial<DurableRoomSnapshot> | null;
    };
    const snapshot = normalizeDurableRoomSnapshot(roomId, parsed.snapshot ?? null);

    if (!snapshot) {
      console.warn("[room-recovery][durable-snapshot][load-invalid]", {
        roomId,
      });
    }

    return snapshot;
  } catch (error) {
    console.warn("[room-recovery][durable-snapshot][load-failed]", {
      roomId,
      reason: error instanceof DOMException ? error.name : "request-failed",
    });
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function saveDurableRoomSnapshot(
  roomId: string,
  objects: BoardObject[],
  baseRevision: number | null
): Promise<DurableRoomSnapshotSaveResult> {
  const payload: DurableRoomSnapshotWritePayload = {
    baseRevision,
    tokens: objects.filter((object) => object.kind === "token"),
    images: objects.filter((object) => object.kind === "image"),
    textCards: objects.filter((object) => object.kind === "text-card"),
  };

  try {
    const response = await fetch(getDurableRoomSnapshotUrl(roomId), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 409) {
      const parsed = (await response.json()) as {
        currentRevision?: number | null;
      };

      console.warn("[room-recovery][durable-snapshot][save-conflict]", {
        roomId,
        baseRevision,
        currentRevision:
          typeof parsed.currentRevision === "number"
            ? parsed.currentRevision
            : null,
      });

      return {
        status: "conflict",
        currentRevision:
          typeof parsed.currentRevision === "number"
            ? parsed.currentRevision
            : null,
      };
    }

    if (!response.ok) {
      throw new Error(`Failed to save durable room snapshot: ${response.status}`);
    }

    const parsed = (await response.json()) as {
      snapshot?: Partial<DurableRoomSnapshot> | null;
    };
    const snapshot = normalizeDurableRoomSnapshot(roomId, parsed.snapshot ?? null);

    if (!snapshot) {
      console.warn("[room-recovery][durable-snapshot][save-invalid]", {
        roomId,
        baseRevision,
      });
      return { status: "unavailable" };
    }

    return { status: "saved", snapshot };
  } catch (error) {
    console.warn("[room-recovery][durable-snapshot][save-failed]", {
      roomId,
      baseRevision,
      reason: error instanceof DOMException ? error.name : "request-failed",
    });
    return { status: "unavailable" };
  }
}

function normalizeDurableRoomSnapshot(
  roomId: string,
  snapshot: Partial<DurableRoomSnapshot> | null
): DurableRoomSnapshot | null {
  if (!snapshot || snapshot.roomId !== roomId) {
    return null;
  }

  return {
    roomId,
    revision: typeof snapshot.revision === "number" ? snapshot.revision : 0,
    savedAt:
      typeof snapshot.savedAt === "string"
        ? snapshot.savedAt
        : new Date(0).toISOString(),
    tokens: Array.isArray(snapshot.tokens)
      ? snapshot.tokens.filter((object) => object?.kind === "token")
      : [],
    images: Array.isArray(snapshot.images)
      ? snapshot.images.filter((object) => object?.kind === "image")
      : [],
    textCards: Array.isArray(snapshot.textCards)
      ? snapshot.textCards.filter((object) => object?.kind === "text-card")
      : [],
  };
}

function getDurableRoomSnapshotUrl(roomId: string) {
  return new URL(
    `/api/room-snapshots/${encodeURIComponent(roomId)}`,
    getDurableRoomSnapshotServerUrl()
  ).toString();
}

function getDurableRoomSnapshotServerUrl() {
  const realtimeServerUrl = import.meta.env.VITE_Y_WEBSOCKET_URL;

  if (typeof realtimeServerUrl === "string" && realtimeServerUrl.length > 0) {
    return realtimeServerUrl.replace(/^ws/i, "http");
  }

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";

  return `${protocol}//${window.location.hostname}:1234`;
}
