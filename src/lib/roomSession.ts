import { createClientId } from "./id";
import { normalizeRoomId } from "./roomId";

export type LocalParticipantSession = {
  id: string;
  name: string;
  color: string;
};

export type ParticipantPresence = {
  participantId: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
  lastActiveAt: number;
};

export type ParticipantPresenceMap = Record<string, ParticipantPresence>;

export type RoomOccupancy = {
  participantId: string;
  name: string;
  color: string;
};

export type RoomOccupancyMap = Record<string, RoomOccupancy>;

export type ActiveParticipantRoomSession = {
  participantId: string;
  roomId: string;
  startedAt: number;
  updatedAt: number;
};

export const PARTICIPANT_COLOR_OPTIONS = [
  "#0f766e",
  "#0891b2",
  "#2563eb",
  "#16a34a",
  "#ca8a04",
  "#ea580c",
  "#7c3aed",
  "#db2777",
];

export const ROOM_SESSION_STORAGE_PREFIX = "play-space-alpha-room-session-v1";
export const ACTIVE_ROOM_STORAGE_KEY = "play-space-alpha-active-room-v1";
export const ROOM_PRESENCE_STORAGE_PREFIX = "play-space-alpha-room-presence-v1";
export const BROWSER_PARTICIPANT_ID_STORAGE_KEY =
  "play-space-alpha-browser-participant-id-v1";
export const ACTIVE_PARTICIPANT_ROOM_SESSION_STORAGE_KEY =
  "play-space-alpha-active-room-session-v1";
const PARTICIPANT_PRESENCE_STALE_MS = 30000;

export function getRoomIdFromLocation(location: Location) {
  const searchRoomId = normalizeRoomId(
    new URLSearchParams(location.search).get("room")
  );

  if (searchRoomId) {
    return searchRoomId;
  }

  const pathSegments = location.pathname.split("/").filter(Boolean);

  if (pathSegments.length > 0) {
    return normalizeRoomId(decodeURIComponent(pathSegments[pathSegments.length - 1]));
  }

  return "alpha";
}

export function loadLocalParticipantSession(roomId: string) {
  const normalizedRoomId = normalizeRoomId(roomId);
  const raw =
    localStorage.getItem(getRoomSessionStorageKey(normalizedRoomId)) ??
    sessionStorage.getItem(getRoomSessionStorageKey(normalizedRoomId));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LocalParticipantSession>;

    if (!parsed.name || !parsed.color) {
      return null;
    }

    const participantId = getOrCreateBrowserParticipantId(parsed.id);

    return {
      id: participantId,
      name: parsed.name,
      color: parsed.color,
    };
  } catch {
    return null;
  }
}

export function saveLocalParticipantSession(
  roomId: string,
  session: LocalParticipantSession
) {
  const normalizedRoomId = normalizeRoomId(roomId);
  const participantId = getOrCreateBrowserParticipantId(session.id);

  sessionStorage.setItem(
    getRoomSessionStorageKey(normalizedRoomId),
    JSON.stringify({
      ...session,
      id: participantId,
    } satisfies LocalParticipantSession)
  );
  localStorage.setItem(
    getRoomSessionStorageKey(normalizedRoomId),
    JSON.stringify({
      ...session,
      id: participantId,
    } satisfies LocalParticipantSession)
  );
}

export function getOrCreateBrowserParticipantId(preferredId?: string | null) {
  const existingParticipantId = localStorage
    .getItem(BROWSER_PARTICIPANT_ID_STORAGE_KEY)
    ?.trim();

  if (existingParticipantId) {
    return existingParticipantId;
  }

  const nextParticipantId =
    typeof preferredId === "string" && preferredId.trim().length > 0
      ? preferredId.trim()
      : createClientId();

  localStorage.setItem(BROWSER_PARTICIPANT_ID_STORAGE_KEY, nextParticipantId);
  return nextParticipantId;
}

export function loadActiveRoomId() {
  const raw = normalizeRoomId(sessionStorage.getItem(ACTIVE_ROOM_STORAGE_KEY));

  return raw ? raw : null;
}

export function saveActiveRoomId(roomId: string) {
  sessionStorage.setItem(ACTIVE_ROOM_STORAGE_KEY, normalizeRoomId(roomId));
}

export function clearActiveRoomId() {
  sessionStorage.removeItem(ACTIVE_ROOM_STORAGE_KEY);
}

export function loadActiveParticipantRoomSession(
  participantId: string
): ActiveParticipantRoomSession | null {
  const raw = localStorage.getItem(ACTIVE_PARTICIPANT_ROOM_SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ActiveParticipantRoomSession>;

    if (
      parsed.participantId !== participantId ||
      typeof parsed.roomId !== "string" ||
      parsed.roomId.trim().length === 0 ||
      typeof parsed.startedAt !== "number" ||
      typeof parsed.updatedAt !== "number"
    ) {
      return null;
    }

    return {
      participantId: parsed.participantId,
      roomId: normalizeRoomId(parsed.roomId),
      startedAt: parsed.startedAt,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function saveActiveParticipantRoomSession(params: {
  participantId: string;
  roomId: string;
}) {
  const normalizedRoomId = normalizeRoomId(params.roomId);
  const existingSession = loadActiveParticipantRoomSession(params.participantId);
  const now = Date.now();

  localStorage.setItem(
    ACTIVE_PARTICIPANT_ROOM_SESSION_STORAGE_KEY,
    JSON.stringify({
      participantId: params.participantId,
      roomId: normalizedRoomId,
      startedAt: existingSession?.startedAt ?? now,
      updatedAt: now,
    } satisfies ActiveParticipantRoomSession)
  );
}

export function clearActiveParticipantRoomSession(participantId: string) {
  const existingSession = loadActiveParticipantRoomSession(participantId);

  if (!existingSession) {
    return;
  }

  localStorage.removeItem(ACTIVE_PARTICIPANT_ROOM_SESSION_STORAGE_KEY);
}

export function subscribeToActiveParticipantRoomSession(
  participantId: string,
  onChange: (session: ActiveParticipantRoomSession | null) => void
) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== ACTIVE_PARTICIPANT_ROOM_SESSION_STORAGE_KEY) {
      return;
    }

    onChange(loadActiveParticipantRoomSession(participantId));
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}

export function clearBrowserLocalRoomSessionState() {
  clearStorageKeysByPrefix(localStorage, ROOM_SESSION_STORAGE_PREFIX);
  clearStorageKeysByPrefix(localStorage, ROOM_PRESENCE_STORAGE_PREFIX);
  clearStorageKeysByPrefix(sessionStorage, ROOM_SESSION_STORAGE_PREFIX);
  clearStorageKeysByPrefix(sessionStorage, ROOM_PRESENCE_STORAGE_PREFIX);
  sessionStorage.removeItem(ACTIVE_ROOM_STORAGE_KEY);
  localStorage.removeItem(ACTIVE_PARTICIPANT_ROOM_SESSION_STORAGE_KEY);
}

export function createLocalParticipantPresence(
  session: LocalParticipantSession
): ParticipantPresence {
  return {
    participantId: session.id,
    name: session.name,
    color: session.color,
    cursor: null,
    lastActiveAt: Date.now(),
  };
}

export function createRoomOccupancy(
  session: LocalParticipantSession
): RoomOccupancy {
  return {
    participantId: session.id,
    name: session.name,
    color: session.color,
  };
}

export function createLocalParticipantPresenceMap(
  session: LocalParticipantSession
): ParticipantPresenceMap {
  const presence = createLocalParticipantPresence(session);

  return {
    [presence.participantId]: presence,
  };
}

export function updateParticipantPresenceMap(
  presences: ParticipantPresenceMap,
  participantId: string,
  updater: (presence: ParticipantPresence | null) => ParticipantPresence | null
): ParticipantPresenceMap {
  const currentPresence = presences[participantId] ?? null;
  const nextPresence = updater(currentPresence);

  if (!nextPresence) {
    return Object.fromEntries(
      Object.entries(presences).filter(([id]) => id !== participantId)
    ) as ParticipantPresenceMap;
  }

  return {
    ...presences,
    [participantId]: nextPresence,
  };
}

export function syncParticipantPresenceWithSession(
  presences: ParticipantPresenceMap,
  participantId: string,
  session: LocalParticipantSession
): ParticipantPresenceMap {
  return updateParticipantPresenceMap(presences, participantId, (presence) =>
    presence
      ? {
          ...presence,
          name: session.name,
          color: session.color,
        }
      : {
          ...createLocalParticipantPresence(session),
          participantId,
        }
  );
}

export function updateParticipantPresenceFromSession(
  presences: ParticipantPresenceMap,
  session: LocalParticipantSession,
  updater: (presence: ParticipantPresence) => ParticipantPresence | null
): ParticipantPresenceMap {
  const participantId = session.id;

  return updateParticipantPresenceMap(presences, participantId, (presence) =>
    updater(
      presence ?? {
        ...createLocalParticipantPresence(session),
        participantId,
      }
    )
  );
}

export function loadRoomParticipantPresences(roomId: string) {
  const raw = localStorage.getItem(getRoomPresenceStorageKey(roomId));

  if (!raw) {
    return {} satisfies ParticipantPresenceMap;
  }

  try {
    return pruneStaleParticipantPresences(
      JSON.parse(raw) as ParticipantPresenceMap
    );
  } catch {
    return {} satisfies ParticipantPresenceMap;
  }
}

export function saveRoomParticipantPresence(
  roomId: string,
  presence: ParticipantPresence
) {
  const currentPresences = loadRoomParticipantPresences(roomId);

  localStorage.setItem(
    getRoomPresenceStorageKey(roomId),
    JSON.stringify({
      ...currentPresences,
      [presence.participantId]: presence,
    })
  );
}

export function removeRoomParticipantPresence(roomId: string, participantId: string) {
  const currentPresences = loadRoomParticipantPresences(roomId);
  const rest = Object.fromEntries(
    Object.entries(currentPresences).filter(([id]) => id !== participantId)
  );

  localStorage.setItem(getRoomPresenceStorageKey(roomId), JSON.stringify(rest));
}

export function subscribeToRoomParticipantPresences(
  roomId: string,
  onChange: (presences: ParticipantPresenceMap) => void
) {
  const storageKey = getRoomPresenceStorageKey(roomId);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== storageKey) {
      return;
    }

    onChange(loadRoomParticipantPresences(roomId));
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}

function pruneStaleParticipantPresences(presences: ParticipantPresenceMap) {
  const now = Date.now();

  return Object.fromEntries(
    Object.entries(presences).filter(([, presence]) => {
      return now - presence.lastActiveAt <= PARTICIPANT_PRESENCE_STALE_MS;
    })
  ) as ParticipantPresenceMap;
}

function getRoomSessionStorageKey(roomId: string) {
  return `${ROOM_SESSION_STORAGE_PREFIX}:${normalizeRoomId(roomId)}`;
}

function getRoomPresenceStorageKey(roomId: string) {
  return `${ROOM_PRESENCE_STORAGE_PREFIX}:${normalizeRoomId(roomId)}`;
}

function clearStorageKeysByPrefix(storage: Storage, prefix: string) {
  const keysToRemove: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (key && key.startsWith(`${prefix}:`)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
}
