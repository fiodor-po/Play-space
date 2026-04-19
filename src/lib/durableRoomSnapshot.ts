import type { BoardObject } from "../types/board";
import { normalizeTokenObject } from "../board/objects/token/createTokenObject";
import {
  isNoteCardObject,
  normalizeNoteCardObject,
} from "../board/objects/noteCard/sizing";
import {
  normalizeRoomParticipantAppearanceMap,
  type RoomParticipantAppearance,
  type RoomParticipantAppearanceMap,
} from "./participantColors";
import { getApiServerBaseUrl } from "./runtimeConfig";

export type DurableRoomSnapshot = {
  roomId: string;
  revision: number;
  savedAt: string;
  sliceRevisions: DurableRoomSnapshotSliceRevisions;
  tokens: BoardObject[];
  images: BoardObject[];
  textCards: BoardObject[];
  participantAppearance: RoomParticipantAppearanceMap;
};

export type DurableRoomSnapshotSlice = "tokens" | "images" | "textCards";

export type DurableRoomSnapshotSliceRevisions = Record<
  DurableRoomSnapshotSlice,
  number
>;

type DurableRoomSnapshotWritePayload = {
  baseRevision: number | null;
  tokens: BoardObject[];
  images: BoardObject[];
  textCards: BoardObject[];
  participantAppearance?: RoomParticipantAppearanceMap;
};

type DurableRoomSnapshotSliceWritePayload = {
  slice: DurableRoomSnapshotSlice;
  baseSliceRevision: number | null;
  payload: BoardObject[];
};

type DurableRoomParticipantAppearanceWritePayload = {
  baseRevision: number | null;
  participantAppearance: RoomParticipantAppearance;
};

type DurableRoomSnapshotSliceWriteResponse =
  | {
      status: "saved";
      ack?: Partial<DurableRoomSnapshotUpdateAck> | null;
    }
  | {
      status: "conflict";
      currentRevision?: number | null;
      currentSliceRevision?: number | null;
    };

type DurableRoomParticipantAppearanceWriteResponse =
  | {
      status: "saved";
      snapshot?: Partial<DurableRoomSnapshot> | null;
    }
  | {
      status: "conflict";
      currentRevision?: number | null;
    };

export type DurableRoomSnapshotUpdateAck = {
  roomId: string;
  slice: DurableRoomSnapshotSlice;
  snapshotRevision: number;
  sliceRevision: number;
  savedAt: string;
  objectCount: number;
};

export type DurableRoomSnapshotSaveResult =
  | { status: "saved"; snapshot: DurableRoomSnapshot }
  | { status: "conflict"; currentRevision: number | null }
  | { status: "unavailable" };

export type DurableRoomSnapshotSliceSaveResult =
  | { status: "saved"; ack: DurableRoomSnapshotUpdateAck }
  | {
      status: "conflict";
      currentRevision: number | null;
      currentSliceRevision: number | null;
    }
  | { status: "skipped-page-transition" }
  | { status: "unavailable" };

let pageTransitionInProgress = false;
let pageTransitionTrackingAttached = false;
const DURABLE_ROOM_SNAPSHOT_LOAD_TIMEOUT_MS = 5000;
const DURABLE_ROOM_SNAPSHOT_LOAD_FAILURE_DEDUPE_WINDOW_MS = 5000;
const recentDurableSnapshotLoadFailures = new Map<
  string,
  {
    loggedAt: number;
    suppressedCount: number;
  }
>();

function ensurePageTransitionTracking() {
  if (
    pageTransitionTrackingAttached ||
    typeof window === "undefined" ||
    typeof document === "undefined"
  ) {
    return;
  }

  pageTransitionTrackingAttached = true;

  const markPageTransition = () => {
    pageTransitionInProgress = true;
  };
  const clearPageTransition = () => {
    pageTransitionInProgress = false;
  };

  window.addEventListener("pagehide", markPageTransition, { capture: true });
  window.addEventListener("beforeunload", markPageTransition, { capture: true });
  window.addEventListener("pageshow", clearPageTransition, { capture: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      markPageTransition();
      return;
    }

    clearPageTransition();
  });
}

export async function loadDurableRoomSnapshot(
  roomId: string
): Promise<DurableRoomSnapshot | null> {
  const snapshotUrl = getDurableRoomSnapshotUrl(roomId);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, DURABLE_ROOM_SNAPSHOT_LOAD_TIMEOUT_MS);

  try {
    const response = await fetch(snapshotUrl, {
      signal: controller.signal,
    });

    if (response.status === 404) {
      console.info("[room-recovery][durable-snapshot][load-miss]", {
        roomId,
        snapshotUrl,
      });
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

    clearRecentDurableSnapshotLoadFailure(roomId, snapshotUrl);
    return snapshot;
  } catch (error) {
    const reason = error instanceof DOMException ? error.name : "request-failed";
    logDurableSnapshotLoadFailure({
      roomId,
      snapshotUrl,
      reason,
      timeoutMs: DURABLE_ROOM_SNAPSHOT_LOAD_TIMEOUT_MS,
    });
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function saveDurableRoomSnapshot(
  roomId: string,
  objects: BoardObject[],
  baseRevision: number | null,
  options?: {
    participantAppearance?: RoomParticipantAppearanceMap;
  }
): Promise<DurableRoomSnapshotSaveResult> {
  const snapshotUrl = getDurableRoomSnapshotUrl(roomId);
  const payload: DurableRoomSnapshotWritePayload = {
    baseRevision,
    tokens: objects.filter((object) => object.kind === "token"),
    images: objects.filter((object) => object.kind === "image"),
    textCards: objects.filter((object) => isNoteCardObject(object)),
    participantAppearance: options?.participantAppearance,
  };

  try {
    const response = await fetch(snapshotUrl, {
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
        snapshotUrl,
        baseRevision,
      });
      return { status: "unavailable" };
    }

    return { status: "saved", snapshot };
  } catch (error) {
    console.warn("[room-recovery][durable-snapshot][save-failed]", {
      roomId,
      snapshotUrl,
      baseRevision,
      reason: error instanceof DOMException ? error.name : "request-failed",
    });
    return { status: "unavailable" };
  }
}

export async function saveDurableRoomSnapshotSlice(
  roomId: string,
  slice: DurableRoomSnapshotSlice,
  payload: BoardObject[],
  baseSliceRevision: number | null
): Promise<DurableRoomSnapshotSliceSaveResult> {
  ensurePageTransitionTracking();
  const snapshotUrl = getDurableRoomSnapshotUrl(roomId);
  const writePayload: DurableRoomSnapshotSliceWritePayload = {
    slice,
    baseSliceRevision,
    payload: filterSnapshotSliceObjects(slice, payload),
  };

  try {
    const response = await fetch(snapshotUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(writePayload),
    });

    if (response.status === 409) {
      const parsed = (await response.json()) as {
        currentRevision?: number | null;
        currentSliceRevision?: number | null;
      };

      return {
        status: "conflict",
        currentRevision:
          typeof parsed.currentRevision === "number"
            ? parsed.currentRevision
            : null,
        currentSliceRevision:
          typeof parsed.currentSliceRevision === "number"
            ? parsed.currentSliceRevision
            : null,
      };
    }

    if (!response.ok) {
      throw new Error(
        `Failed to save durable room snapshot slice: ${response.status}`
      );
    }

    const parsed = (await response.json()) as DurableRoomSnapshotSliceWriteResponse;

    if (parsed.status === "conflict") {
      return {
        status: "conflict",
        currentRevision:
          typeof parsed.currentRevision === "number"
            ? parsed.currentRevision
            : null,
        currentSliceRevision:
          typeof parsed.currentSliceRevision === "number"
            ? parsed.currentSliceRevision
            : null,
      };
    }

    const ack = normalizeDurableRoomSnapshotUpdateAck(
      roomId,
      slice,
      parsed.ack ?? null
    );

    if (!ack) {
      console.warn("[room-recovery][durable-snapshot][slice-save-invalid]", {
        roomId,
        slice,
        snapshotUrl,
        baseSliceRevision,
      });
      return { status: "unavailable" };
    }

    return { status: "saved", ack };
  } catch (error) {
    if (isPageTransitionAbort(error)) {
      console.info("[room-recovery][durable-snapshot][slice-save-skipped]", {
        roomId,
        slice,
        snapshotUrl,
        baseSliceRevision,
        reason: error instanceof DOMException ? error.name : "page-transition",
      });
      return { status: "skipped-page-transition" };
    }

    console.warn("[room-recovery][durable-snapshot][slice-save-failed]", {
      roomId,
      slice,
      snapshotUrl,
      baseSliceRevision,
      reason: error instanceof DOMException ? error.name : "request-failed",
    });
    return { status: "unavailable" };
  }
}

function isPageTransitionAbort(error: unknown) {
  if (!pageTransitionInProgress) {
    return false;
  }

  if (error instanceof DOMException) {
    return error.name === "AbortError" || error.name === "NetworkError";
  }

  return error instanceof TypeError;
}

export async function saveDurableRoomParticipantAppearance(
  roomId: string,
  participantAppearance: RoomParticipantAppearance,
  baseRevision: number | null
): Promise<DurableRoomSnapshotSaveResult> {
  const snapshotUrl = getDurableRoomSnapshotUrl(roomId);
  const writePayload: DurableRoomParticipantAppearanceWritePayload = {
    baseRevision,
    participantAppearance,
  };

  try {
    const response = await fetch(snapshotUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(writePayload),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to save durable room participant appearance: ${response.status}`
      );
    }

    const parsed =
      (await response.json()) as DurableRoomParticipantAppearanceWriteResponse;

    if (parsed.status === "conflict") {
      return {
        status: "conflict",
        currentRevision:
          typeof parsed.currentRevision === "number"
            ? parsed.currentRevision
            : null,
      };
    }

    const snapshot = normalizeDurableRoomSnapshot(roomId, parsed.snapshot ?? null);

    if (!snapshot) {
      console.warn(
        "[room-recovery][durable-snapshot][participant-appearance-save-invalid]",
        {
          roomId,
          snapshotUrl,
          participantId: participantAppearance.participantId,
          baseRevision,
        }
      );
      return { status: "unavailable" };
    }

    return { status: "saved", snapshot };
  } catch (error) {
    console.warn(
      "[room-recovery][durable-snapshot][participant-appearance-save-failed]",
      {
        roomId,
        snapshotUrl,
        participantId: participantAppearance.participantId,
        baseRevision,
        reason: error instanceof DOMException ? error.name : "request-failed",
      }
    );
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
    sliceRevisions: normalizeDurableRoomSnapshotSliceRevisions(
      snapshot.sliceRevisions,
      typeof snapshot.revision === "number" ? snapshot.revision : 0
    ),
    tokens: Array.isArray(snapshot.tokens)
      ? snapshot.tokens
          .filter((object) => object?.kind === "token")
          .map((object) => normalizeTokenObject(object as BoardObject))
      : [],
    images: Array.isArray(snapshot.images)
      ? snapshot.images.filter((object) => object?.kind === "image")
      : [],
    textCards: Array.isArray(snapshot.textCards)
      ? snapshot.textCards
          .filter((object) => object?.kind === "note-card")
          .map((object) => normalizeNoteCardObject(object as BoardObject))
      : [],
    participantAppearance: normalizeRoomParticipantAppearanceMap(
      snapshot.participantAppearance
    ),
  };
}

function normalizeDurableRoomSnapshotUpdateAck(
  roomId: string,
  slice: DurableRoomSnapshotSlice,
  ack: Partial<DurableRoomSnapshotUpdateAck> | null
): DurableRoomSnapshotUpdateAck | null {
  if (!ack || ack.roomId !== roomId || ack.slice !== slice) {
    return null;
  }

  return {
    roomId,
    slice,
    snapshotRevision:
      typeof ack.snapshotRevision === "number" ? ack.snapshotRevision : 0,
    sliceRevision: typeof ack.sliceRevision === "number" ? ack.sliceRevision : 0,
    savedAt:
      typeof ack.savedAt === "string"
        ? ack.savedAt
        : new Date(0).toISOString(),
    objectCount: typeof ack.objectCount === "number" ? ack.objectCount : 0,
  };
}

function normalizeDurableRoomSnapshotSliceRevisions(
  sliceRevisions: Partial<DurableRoomSnapshotSliceRevisions> | null | undefined,
  fallbackRevision: number
): DurableRoomSnapshotSliceRevisions {
  return {
    tokens:
      typeof sliceRevisions?.tokens === "number"
        ? sliceRevisions.tokens
        : fallbackRevision,
    images:
      typeof sliceRevisions?.images === "number"
        ? sliceRevisions.images
        : fallbackRevision,
    textCards:
      typeof sliceRevisions?.textCards === "number"
        ? sliceRevisions.textCards
        : fallbackRevision,
  };
}

function filterSnapshotSliceObjects(
  slice: DurableRoomSnapshotSlice,
  objects: BoardObject[]
) {
  if (slice === "tokens") {
    return objects
      .filter((object) => object.kind === "token")
      .map((object) => normalizeTokenObject(object));
  }

  if (slice === "images") {
    return objects.filter((object) => object.kind === "image");
  }

  return objects
    .filter((object) => object.kind === "note-card")
    .map((object) => normalizeNoteCardObject(object));
}

function getDurableRoomSnapshotUrl(roomId: string) {
  return new URL(
    `/api/room-snapshots/${encodeURIComponent(roomId)}`,
    getDurableRoomSnapshotServerUrl()
  ).toString();
}

function getDurableRoomSnapshotServerUrl() {
  return getApiServerBaseUrl();
}

function logDurableSnapshotLoadFailure(details: {
  roomId: string;
  snapshotUrl: string;
  reason: string;
  timeoutMs: number;
}) {
  const dedupeKey = `${details.roomId}::${details.snapshotUrl}::${details.reason}`;
  const now = Date.now();
  const recentFailure = recentDurableSnapshotLoadFailures.get(dedupeKey);

  if (
    recentFailure &&
    now - recentFailure.loggedAt < DURABLE_ROOM_SNAPSHOT_LOAD_FAILURE_DEDUPE_WINDOW_MS
  ) {
    recentFailure.suppressedCount += 1;
    recentDurableSnapshotLoadFailures.set(dedupeKey, recentFailure);
    return;
  }

  const suppressedCount = recentFailure?.suppressedCount ?? 0;
  recentDurableSnapshotLoadFailures.set(dedupeKey, {
    loggedAt: now,
    suppressedCount: 0,
  });

  console.warn("[room-recovery][durable-snapshot][load-failed]", {
    roomId: details.roomId,
    snapshotUrl: details.snapshotUrl,
    reason: details.reason,
    timeoutMs: details.timeoutMs,
    suppressedDuplicateWarnings: suppressedCount,
    dedupeWindowMs: DURABLE_ROOM_SNAPSHOT_LOAD_FAILURE_DEDUPE_WINDOW_MS,
  });
}

function clearRecentDurableSnapshotLoadFailure(roomId: string, snapshotUrl: string) {
  const keyPrefix = `${roomId}::${snapshotUrl}::`;

  for (const key of recentDurableSnapshotLoadFailures.keys()) {
    if (!key.startsWith(keyPrefix)) {
      continue;
    }

    recentDurableSnapshotLoadFailures.delete(key);
  }
}
