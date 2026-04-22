import type {
  LocalParticipantSession,
  ParticipantPresenceMap,
  RoomOccupancyMap,
} from "./roomSession";
import {
  isParticipantAvatarFaceId,
  pickUnusedParticipantAvatarFaceId,
  type ParticipantAvatarFaceId,
} from "./participantAvatarFaces";

export type RoomParticipantAppearance = {
  participantId: string;
  lastKnownName: string;
  lastKnownColor: string;
  lastSeenAt: number;
  avatarFaceId?: ParticipantAvatarFaceId;
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
  avatarFaceId?: unknown;
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
    avatarFaceId: isParticipantAvatarFaceId(params.avatarFaceId)
      ? params.avatarFaceId
      : undefined,
    lastSeenAt:
      typeof params.lastSeenAt === "number" ? params.lastSeenAt : Date.now(),
  };
}

export function createRoomParticipantAppearanceWithAssignedAvatar(params: {
  participantId: string;
  name: string;
  color: string;
  lastSeenAt?: number;
  avatarFaceId?: unknown;
  existingAppearanceMap: RoomParticipantAppearanceMap;
}): RoomParticipantAppearance | null {
  const existingAppearance = params.existingAppearanceMap[params.participantId];
  const normalizedAppearance = createRoomParticipantAppearance({
    participantId: params.participantId,
    name: params.name,
    color: params.color,
    lastSeenAt: params.lastSeenAt,
    avatarFaceId: params.avatarFaceId,
  });

  if (!normalizedAppearance) {
    return null;
  }

  return {
    ...normalizedAppearance,
    avatarFaceId:
      normalizedAppearance.avatarFaceId ??
      existingAppearance?.avatarFaceId ??
      pickUnusedParticipantAvatarFaceId(
        params.existingAppearanceMap,
        normalizedAppearance.participantId
      ),
  };
}

export function normalizeRoomParticipantAppearanceMap(
  participantAppearance: unknown
): RoomParticipantAppearanceMap {
  if (!participantAppearance || typeof participantAppearance !== "object") {
    return {};
  }

  return Object.entries(participantAppearance).reduce<RoomParticipantAppearanceMap>(
    (appearanceMap, [participantId, appearance]) => {
      if (!appearance || typeof appearance !== "object") {
        return appearanceMap;
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
        avatarFaceId:
          "avatarFaceId" in appearance ? appearance.avatarFaceId : undefined,
      });

      if (!normalizedAppearance) {
        return appearanceMap;
      }

      appearanceMap[participantId] = normalizedAppearance;
      return appearanceMap;
    },
    {}
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
    currentAppearance.lastKnownColor === nextAppearance.lastKnownColor &&
    currentAppearance.avatarFaceId === nextAppearance.avatarFaceId
  ) {
    return participantAppearance;
  }

  return {
    ...participantAppearance,
    [nextAppearance.participantId]: {
      ...nextAppearance,
      avatarFaceId:
        currentAppearance?.avatarFaceId ?? nextAppearance.avatarFaceId,
    },
  };
}

function normalizeParticipantAppearanceString(value: string) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}
