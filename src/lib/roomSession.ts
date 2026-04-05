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

export const PARTICIPANT_COLOR_OPTIONS = [
  "#0f766e",
  "#2563eb",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#db2777",
];

const ROOM_SESSION_STORAGE_PREFIX = "play-space-alpha-room-session-v1";
const ROOM_PRESENCE_STORAGE_PREFIX = "play-space-alpha-room-presence-v1";
const PARTICIPANT_PRESENCE_STALE_MS = 30000;

export function getRoomIdFromLocation(location: Location) {
  const searchRoomId = new URLSearchParams(location.search).get("room")?.trim();

  if (searchRoomId) {
    return searchRoomId;
  }

  const pathSegments = location.pathname.split("/").filter(Boolean);

  if (pathSegments.length > 0) {
    return decodeURIComponent(pathSegments[pathSegments.length - 1]);
  }

  return "alpha";
}

export function loadLocalParticipantSession(roomId: string) {
  const raw = sessionStorage.getItem(getRoomSessionStorageKey(roomId));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LocalParticipantSession>;

    if (!parsed.id || !parsed.name || !parsed.color) {
      return null;
    }

    return {
      id: parsed.id,
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
  sessionStorage.setItem(
    getRoomSessionStorageKey(roomId),
    JSON.stringify(session)
  );
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
    const { [participantId]: _removed, ...rest } = presences;
    return rest;
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
  const { [participantId]: _removed, ...rest } = currentPresences;

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
  return `${ROOM_SESSION_STORAGE_PREFIX}:${roomId}`;
}

function getRoomPresenceStorageKey(roomId: string) {
  return `${ROOM_PRESENCE_STORAGE_PREFIX}:${roomId}`;
}
