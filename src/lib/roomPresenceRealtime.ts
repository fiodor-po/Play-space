import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type {
  ParticipantPresence,
  ParticipantPresenceMap,
  RoomOccupancy,
  RoomOccupancyMap,
} from "./roomSession";
import { getRealtimeServerWsUrl } from "./runtimeConfig";

export type JoinClaim = {
  participantId: string;
  roomId: string;
  color: string;
  requestedAt: number;
  expiresAt: number;
};

export type JoinClaimMap = Record<string, JoinClaim>;

type AwarenessState = {
  occupancy?: RoomOccupancy | null;
  presence?: ParticipantPresence | null;
  joinClaim?: JoinClaim | null;
};

export type RoomPresenceConnection = {
  destroy: () => void;
  setLocalOccupancy: (occupancy: RoomOccupancy | null) => void;
  setLocalPresence: (presence: ParticipantPresence | null) => void;
  setLocalJoinClaim: (claim: JoinClaim | null) => void;
};

export function createRoomPresenceConnection(params: {
  onOccupanciesChange?: (occupancies: RoomOccupancyMap) => void;
  onPresencesChange: (presences: ParticipantPresenceMap) => void;
  onJoinClaimsChange?: (claims: JoinClaimMap) => void;
  roomId: string;
  serverUrl?: string;
}): RoomPresenceConnection {
  const doc = new Y.Doc();
  const serverUrl = getRealtimeServerWsUrl(params.serverUrl);
  const provider = new WebsocketProvider(
    serverUrl,
    `play-space-alpha-presence:${params.roomId}`,
    doc
  );

  const publishPresences = () => {
    const states = provider.awareness.getStates();

    params.onOccupanciesChange?.(getRoomOccupanciesFromAwareness(states));
    params.onPresencesChange(getParticipantPresencesFromAwareness(states));
    params.onJoinClaimsChange?.(getJoinClaimsFromAwareness(states, params.roomId));
  };

  provider.awareness.on("change", publishPresences);
  const handleStatus = (event: {
    status: "connected" | "connecting" | "disconnected";
  }) => {
    if (import.meta.env.DEV) {
      console.info("[presence]", serverUrl, event.status);
    }
  };
  provider.on("status", handleStatus);
  publishPresences();

  return {
    destroy: () => {
      provider.awareness.off("change", publishPresences);
      provider.off("status", handleStatus);
      provider.destroy();
      doc.destroy();
    },
    setLocalOccupancy: (occupancy) => {
      const currentOccupancy = provider.awareness.getLocalState()?.occupancy ?? null;

      if (areRoomOccupanciesEqual(currentOccupancy, occupancy)) {
        return;
      }

      provider.awareness.setLocalStateField("occupancy", occupancy);
    },
    setLocalPresence: (presence) => {
      const currentPresence = provider.awareness.getLocalState()?.presence ?? null;

      if (areParticipantPresencesEqual(currentPresence, presence)) {
        return;
      }

      provider.awareness.setLocalStateField("presence", presence);
    },
    setLocalJoinClaim: (claim) => {
      const currentClaim = provider.awareness.getLocalState()?.joinClaim ?? null;

      if (areJoinClaimsEqual(currentClaim, claim)) {
        return;
      }

      provider.awareness.setLocalStateField("joinClaim", claim);
    },
  };
}

function getRoomOccupanciesFromAwareness(
  states: Map<number, AwarenessState>
): RoomOccupancyMap {
  const occupancies: RoomOccupancyMap = {};

  states.forEach((state) => {
    const occupancy = state.occupancy;

    if (
      !occupancy ||
      !occupancy.participantId ||
      !occupancy.name ||
      !occupancy.color
    ) {
      return;
    }

    occupancies[occupancy.participantId] = occupancy;
  });

  return occupancies;
}

function getParticipantPresencesFromAwareness(
  states: Map<number, AwarenessState>
): ParticipantPresenceMap {
  const presences: ParticipantPresenceMap = {};

  states.forEach((state) => {
    const presence = state.presence;

    if (
      !presence ||
      !presence.participantId ||
      !presence.name ||
      !presence.color
    ) {
      return;
    }

    presences[presence.participantId] = presence;
  });

  return presences;
}

function getJoinClaimsFromAwareness(
  states: Map<number, AwarenessState>,
  roomId: string
): JoinClaimMap {
  const now = Date.now();
  const claims: JoinClaimMap = {};

  states.forEach((state) => {
    const claim = state.joinClaim;

    if (
      !claim ||
      claim.roomId !== roomId ||
      typeof claim.participantId !== "string" ||
      claim.participantId.length === 0 ||
      typeof claim.color !== "string" ||
      claim.color.length === 0 ||
      typeof claim.requestedAt !== "number" ||
      typeof claim.expiresAt !== "number" ||
      claim.expiresAt <= now
    ) {
      return;
    }

    claims[claim.participantId] = claim;
  });

  return claims;
}

function areRoomOccupanciesEqual(
  current: RoomOccupancy | null | undefined,
  next: RoomOccupancy | null | undefined
) {
  if (!current && !next) {
    return true;
  }

  if (!current || !next) {
    return false;
  }

  return (
    current.participantId === next.participantId &&
    current.name === next.name &&
    current.color === next.color &&
    current.avatarFaceId === next.avatarFaceId
  );
}

function areParticipantPresencesEqual(
  current: ParticipantPresence | null | undefined,
  next: ParticipantPresence | null | undefined
) {
  if (!current && !next) {
    return true;
  }

  if (!current || !next) {
    return false;
  }

  return (
    current.participantId === next.participantId &&
    current.name === next.name &&
    current.color === next.color &&
    current.avatarFaceId === next.avatarFaceId &&
    current.lastActiveAt === next.lastActiveAt &&
    ((current.selectedObject === null && next.selectedObject === null) ||
      (current.selectedObject !== null &&
        next.selectedObject !== null &&
        current.selectedObject.objectId === next.selectedObject.objectId &&
        current.selectedObject.objectKind === next.selectedObject.objectKind &&
        current.selectedObject.selectedAt === next.selectedObject.selectedAt)) &&
    ((current.cursor === null && next.cursor === null) ||
      (current.cursor !== null &&
        next.cursor !== null &&
        current.cursor.x === next.cursor.x &&
        current.cursor.y === next.cursor.y))
  );
}

function areJoinClaimsEqual(
  current: JoinClaim | null | undefined,
  next: JoinClaim | null | undefined
) {
  if (!current && !next) {
    return true;
  }

  if (!current || !next) {
    return false;
  }

  return (
    current.participantId === next.participantId &&
    current.roomId === next.roomId &&
    current.color === next.color &&
    current.requestedAt === next.requestedAt &&
    current.expiresAt === next.expiresAt
  );
}
