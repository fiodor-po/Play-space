import type {
  LocalParticipantSession,
  ParticipantPresenceMap,
  RoomOccupancyMap,
} from "./roomSession";

export type RoomParticipantAppearance = {
  participantId: string;
  lastKnownName: string;
  lastKnownColor: string;
  lastSeenAt: number;
};

export type RoomParticipantAppearanceMap = Record<
  string,
  RoomParticipantAppearance
>;

type ResolveParticipantColorParams = {
  participantId: string | null | undefined;
  localParticipantSession: LocalParticipantSession;
  participantPresences: ParticipantPresenceMap;
  roomOccupancies: RoomOccupancyMap;
};

export type CurrentParticipantColorSource =
  | "local-session"
  | "live-occupancy"
  | "live-presence"
  | "unresolved";

export type CurrentParticipantColorResolution = {
  color: string | null;
  source: CurrentParticipantColorSource;
};

export function resolveCurrentParticipantColorResolution({
  participantId,
  localParticipantSession,
  participantPresences,
  roomOccupancies,
}: ResolveParticipantColorParams): CurrentParticipantColorResolution {
  if (!participantId) {
    return {
      color: null,
      source: "unresolved",
    };
  }

  if (participantId === localParticipantSession.id) {
    return {
      color: localParticipantSession.color,
      source: "local-session",
    };
  }

  const occupancyColor = roomOccupancies[participantId]?.color;

  if (occupancyColor !== null && occupancyColor !== undefined) {
    return {
      color: occupancyColor,
      source: "live-occupancy",
    };
  }

  const presenceColor = participantPresences[participantId]?.color;

  if (presenceColor !== null && presenceColor !== undefined) {
    return {
      color: presenceColor,
      source: "live-presence",
    };
  }

  return {
    color: null,
    source: "unresolved",
  };
}

export function resolveCurrentParticipantColor({
  participantId,
  localParticipantSession,
  participantPresences,
  roomOccupancies,
}: ResolveParticipantColorParams) {
  return resolveCurrentParticipantColorResolution({
    participantId,
    localParticipantSession,
    participantPresences,
    roomOccupancies,
  }).color;
}

export function createRoomParticipantAppearance(params: {
  participantId: string;
  name: string;
  color: string;
  lastSeenAt?: number;
}): RoomParticipantAppearance | null {
  const participantId = normalizeParticipantAppearanceString(params.participantId);
  const lastKnownName = normalizeParticipantAppearanceString(params.name);
  const lastKnownColor = normalizeParticipantAppearanceString(params.color);

  if (!participantId || !lastKnownName || !lastKnownColor) {
    return null;
  }

  return {
    participantId,
    lastKnownName,
    lastKnownColor,
    lastSeenAt:
      typeof params.lastSeenAt === "number" ? params.lastSeenAt : Date.now(),
  };
}

export function normalizeRoomParticipantAppearanceMap(
  participantAppearance: unknown
): RoomParticipantAppearanceMap {
  if (!participantAppearance || typeof participantAppearance !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(participantAppearance)
      .map(([participantId, appearance]) => {
        if (!appearance || typeof appearance !== "object") {
          return null;
        }

        const normalizedAppearance = createRoomParticipantAppearance({
          participantId,
          name:
            "lastKnownName" in appearance
              ? (appearance.lastKnownName as string)
              : "",
          color:
            "lastKnownColor" in appearance
              ? (appearance.lastKnownColor as string)
              : "",
          lastSeenAt:
            "lastSeenAt" in appearance
              ? (appearance.lastSeenAt as number)
              : undefined,
        });

        if (!normalizedAppearance) {
          return null;
        }

        return [participantId, normalizedAppearance] as const;
      })
      .filter(
        (
          entry
        ): entry is readonly [string, RoomParticipantAppearance] => entry !== null
      )
  );
}

export function upsertRoomParticipantAppearance(
  participantAppearance: RoomParticipantAppearanceMap,
  nextAppearance: RoomParticipantAppearance
) {
  const currentAppearance = participantAppearance[nextAppearance.participantId];

  if (
    currentAppearance &&
    currentAppearance.lastKnownName === nextAppearance.lastKnownName &&
    currentAppearance.lastKnownColor === nextAppearance.lastKnownColor
  ) {
    return participantAppearance;
  }

  return {
    ...participantAppearance,
    [nextAppearance.participantId]: nextAppearance,
  };
}

function normalizeParticipantAppearanceString(value: string) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}
