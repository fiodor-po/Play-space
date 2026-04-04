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
  const raw = localStorage.getItem(getRoomSessionStorageKey(roomId));

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
  localStorage.setItem(getRoomSessionStorageKey(roomId), JSON.stringify(session));
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

function getRoomSessionStorageKey(roomId: string) {
  return `${ROOM_SESSION_STORAGE_PREFIX}:${roomId}`;
}
