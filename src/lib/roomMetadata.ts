export type RoomBaselineId = "empty" | "public-demo-v1";

export type RoomBaselineDescriptor = {
  baselineId: RoomBaselineId;
};

export type RoomMemberRecord = {
  participantId: string;
  displayName: string;
  assignedColor: string;
  joinedAt: number;
  lastSeenAt: number;
  isRoomCreator: boolean;
};

export type RoomMemberRegistry = Record<string, RoomMemberRecord>;

export type RoomRecord = {
  id: string;
  creatorId: string | null;
  initializedBaselineId: RoomBaselineId | null;
  appliedBaselineId: RoomBaselineId | null;
  members: RoomMemberRegistry;
};

const ROOM_METADATA_STORAGE_KEY = "play-space-alpha-room-metadata-v1";

type StoredRoomMemberRecord = {
  participantId?: string;
  displayName?: string;
  assignedColor?: string;
  joinedAt?: number;
  lastSeenAt?: number;
  isRoomCreator?: boolean;
};

type StoredRoomRecord = {
  roomId: string;
  creatorId?: string | null;
  initializedBaselineId?: RoomBaselineId | null;
  appliedBaselineId?: RoomBaselineId | null;
  members?: Record<string, StoredRoomMemberRecord> | null;
};

export function createRoomBaselineDescriptor(params?: {
  baselineId?: RoomBaselineId | null;
}): RoomBaselineDescriptor {
  return {
    baselineId:
      params?.baselineId === "public-demo-v1" ? "public-demo-v1" : "empty",
  };
}

export function createRoomRecord(params: {
  roomId: string;
  creatorId?: string | null;
  initializedBaselineId?: RoomBaselineId | null;
  appliedBaselineId?: RoomBaselineId | null;
  members?: RoomMemberRegistry | Record<string, StoredRoomMemberRecord> | null;
}): RoomRecord {
  return {
    id: params.roomId,
    creatorId:
      typeof params.creatorId === "string" && params.creatorId.length > 0
        ? params.creatorId
        : null,
    initializedBaselineId:
      params.initializedBaselineId === "empty" ||
      params.initializedBaselineId === "public-demo-v1"
        ? params.initializedBaselineId
        : null,
    appliedBaselineId:
      params.appliedBaselineId === "empty" ||
      params.appliedBaselineId === "public-demo-v1"
        ? params.appliedBaselineId
        : null,
    members: createRoomMemberRegistry(params.members),
  };
}

export function createRoomMemberRecord(params: {
  participantId: string;
  displayName: string;
  assignedColor: string;
  joinedAt: number;
  lastSeenAt: number;
  isRoomCreator?: boolean;
}): RoomMemberRecord {
  return {
    participantId: params.participantId,
    displayName: params.displayName,
    assignedColor: params.assignedColor,
    joinedAt: Number.isFinite(params.joinedAt) ? params.joinedAt : Date.now(),
    lastSeenAt: Number.isFinite(params.lastSeenAt)
      ? params.lastSeenAt
      : Date.now(),
    isRoomCreator: params.isRoomCreator === true,
  };
}

export function createRoomMemberRegistry(
  members?: RoomMemberRegistry | Record<string, StoredRoomMemberRecord> | null
): RoomMemberRegistry {
  if (!members) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(members)
      .map(([participantId, member]) => {
        if (
          !member ||
          typeof member !== "object" ||
          typeof member.participantId !== "string" ||
          member.participantId.length === 0 ||
          member.participantId !== participantId ||
          typeof member.displayName !== "string" ||
          member.displayName.length === 0 ||
          typeof member.assignedColor !== "string" ||
          member.assignedColor.length === 0
        ) {
          return null;
        }

        return [
          participantId,
          createRoomMemberRecord({
            participantId: member.participantId,
            displayName: member.displayName,
            assignedColor: member.assignedColor,
            joinedAt:
              typeof member.joinedAt === "number"
                ? member.joinedAt
                : Date.now(),
            lastSeenAt:
              typeof member.lastSeenAt === "number"
                ? member.lastSeenAt
                : typeof member.joinedAt === "number"
                  ? member.joinedAt
                  : Date.now(),
            isRoomCreator: member.isRoomCreator === true,
          }),
        ] as const;
      })
      .filter((entry): entry is readonly [string, RoomMemberRecord] => entry !== null)
  );
}

export function getRoomMemberRecord(
  room: RoomRecord,
  participantId: string
): RoomMemberRecord | null {
  return room.members[participantId] ?? null;
}

export function upsertRoomMemberRecord(params: {
  roomId: string;
  member: RoomMemberRecord;
}): RoomRecord | null {
  const existingRecord = loadRoomRecord(params.roomId);

  if (!existingRecord) {
    return null;
  }

  const nextRecord = createRoomRecord({
    roomId: existingRecord.id,
    creatorId: existingRecord.creatorId,
    initializedBaselineId: existingRecord.initializedBaselineId,
    appliedBaselineId: existingRecord.appliedBaselineId,
    members: {
      ...existingRecord.members,
      [params.member.participantId]: params.member,
    },
  });

  if (areRoomMemberRegistriesEqual(existingRecord.members, nextRecord.members)) {
    return existingRecord;
  }

  saveRoomRecord(nextRecord);
  return nextRecord;
}

export function ensureRoomMemberRegistered(params: {
  roomId: string;
  participantId: string;
  displayName: string;
  assignedColor: string;
}): RoomRecord | null {
  const existingRecord = loadRoomRecord(params.roomId);

  if (!existingRecord) {
    return null;
  }

  const existingMember = getRoomMemberRecord(
    existingRecord,
    params.participantId
  );
  const nextMember = createRoomMemberRecord({
    participantId: params.participantId,
    displayName: params.displayName,
    assignedColor: params.assignedColor,
    joinedAt: existingMember?.joinedAt ?? Date.now(),
    lastSeenAt: Date.now(),
    isRoomCreator: existingRecord.creatorId === params.participantId,
  });

  return upsertRoomMemberRecord({
    roomId: params.roomId,
    member: nextMember,
  });
}

export function resolveRoomMemberRegistration(params: {
  roomId: string;
  participantId: string;
  displayName: string;
  preferredColor: string;
  palette: string[];
  allowExistingMemberColorChange?: boolean;
}): { roomRecord: RoomRecord; member: RoomMemberRecord } | null {
  const existingRecord = loadRoomRecord(params.roomId);

  if (!existingRecord) {
    return null;
  }

  const existingMember = getRoomMemberRecord(
    existingRecord,
    params.participantId
  );
  const shouldResolveNextAssignedColor =
    (!existingMember || params.allowExistingMemberColorChange === true) &&
    params.preferredColor !== existingMember?.assignedColor;
  const assignedColor =
    shouldResolveNextAssignedColor
      ? allocateRoomMemberColor({
          participantId: params.participantId,
          preferredColor: params.preferredColor,
          palette: params.palette,
          room: existingRecord,
        })
      : existingMember?.assignedColor ?? params.preferredColor;
  const nextMember = createRoomMemberRecord({
    participantId: params.participantId,
    displayName: params.displayName,
    assignedColor,
    joinedAt: existingMember?.joinedAt ?? Date.now(),
    lastSeenAt: Date.now(),
    isRoomCreator: existingRecord.creatorId === params.participantId,
  });
  const nextRoomRecord =
    upsertRoomMemberRecord({
      roomId: params.roomId,
      member: nextMember,
    }) ?? existingRecord;

  return {
    roomRecord: nextRoomRecord,
    member: nextMember,
  };
}

export function loadRoomRecord(roomId: string): RoomRecord | null {
  const raw = localStorage.getItem(getRoomMetadataStorageKey(roomId));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredRoomRecord>;

    if (parsed.roomId !== roomId) {
      return null;
    }

    return createRoomRecord({
      roomId,
      creatorId: parsed.creatorId,
      initializedBaselineId: parsed.initializedBaselineId,
      appliedBaselineId: parsed.appliedBaselineId,
      members: parsed.members,
    });
  } catch {
    return null;
  }
}

export function saveRoomRecord(room: RoomRecord) {
  localStorage.setItem(
    getRoomMetadataStorageKey(room.id),
    JSON.stringify({
      roomId: room.id,
      creatorId: room.creatorId ?? null,
      initializedBaselineId: room.initializedBaselineId ?? null,
      appliedBaselineId: room.appliedBaselineId ?? null,
      members: room.members,
    })
  );
}

export function ensureRoomRecordInitialized(params: {
  roomId: string;
  creatorId: string;
  baseline: RoomBaselineDescriptor;
}): RoomRecord {
  const existingRecord = loadRoomRecord(params.roomId);
  const nextRecord = createRoomRecord({
    roomId: params.roomId,
    creatorId: existingRecord?.creatorId ?? params.creatorId,
    initializedBaselineId:
      existingRecord?.initializedBaselineId ?? params.baseline.baselineId,
    appliedBaselineId:
      existingRecord?.appliedBaselineId ??
      (params.baseline.baselineId === "empty" ? "empty" : null),
    members: existingRecord?.members,
  });

  if (
    existingRecord &&
    existingRecord.creatorId === nextRecord.creatorId &&
    existingRecord.initializedBaselineId === nextRecord.initializedBaselineId &&
    existingRecord.appliedBaselineId === nextRecord.appliedBaselineId &&
    areRoomMemberRegistriesEqual(existingRecord.members, nextRecord.members)
  ) {
    return existingRecord;
  }

  saveRoomRecord(nextRecord);
  return nextRecord;
}

export function markRoomBaselineApplied(params: {
  roomId: string;
  baselineId: RoomBaselineId;
}): RoomRecord | null {
  const existingRecord = loadRoomRecord(params.roomId);

  if (!existingRecord) {
    return null;
  }

  if (existingRecord.appliedBaselineId === params.baselineId) {
    return existingRecord;
  }

  const nextRecord = createRoomRecord({
    roomId: existingRecord.id,
    creatorId: existingRecord.creatorId,
    initializedBaselineId: existingRecord.initializedBaselineId,
    appliedBaselineId: params.baselineId,
    members: existingRecord.members,
  });

  saveRoomRecord(nextRecord);
  return nextRecord;
}

export function ensureRoomRecord(roomId: string, creatorId: string): RoomRecord {
  return ensureRoomRecordInitialized({
    roomId,
    creatorId,
    baseline: createRoomBaselineDescriptor({ baselineId: "empty" }),
  });
}

export type RoomMetadata = RoomRecord;

export const loadRoomMetadata = loadRoomRecord;
export const saveRoomMetadata = saveRoomRecord;
export const ensureRoomMetadata = ensureRoomRecord;

function getRoomMetadataStorageKey(roomId: string) {
  return `${ROOM_METADATA_STORAGE_KEY}:${roomId}`;
}

function areRoomMemberRegistriesEqual(
  current: RoomMemberRegistry,
  next: RoomMemberRegistry
) {
  const currentEntries = Object.entries(current);
  const nextEntries = Object.entries(next);

  if (currentEntries.length !== nextEntries.length) {
    return false;
  }

  return currentEntries.every(([participantId, member]) => {
    const nextMember = next[participantId];

    return (
      !!nextMember &&
      member.participantId === nextMember.participantId &&
      member.displayName === nextMember.displayName &&
      member.assignedColor === nextMember.assignedColor &&
      member.joinedAt === nextMember.joinedAt &&
      member.lastSeenAt === nextMember.lastSeenAt &&
      member.isRoomCreator === nextMember.isRoomCreator
    );
  });
}

function allocateRoomMemberColor(params: {
  participantId: string;
  preferredColor: string;
  palette: string[];
  room: RoomRecord;
}) {
  const usedColors = new Set(
    Object.values(params.room.members)
      .filter((member) => member.participantId !== params.participantId)
      .map((member) => member.assignedColor)
  );

  if (params.preferredColor && !usedColors.has(params.preferredColor)) {
    return params.preferredColor;
  }

  const firstFreePaletteColor = params.palette.find(
    (color) => !usedColors.has(color)
  );

  if (firstFreePaletteColor) {
    return firstFreePaletteColor;
  }

  return createDeterministicOverflowRoomColor(
    params.participantId,
    usedColors
  );
}

function createDeterministicOverflowRoomColor(
  participantId: string,
  usedColors: Set<string>
) {
  const baseHue = hashString(participantId) % 360;

  for (let attempt = 0; attempt < 360; attempt += 1) {
    const hue = (baseHue + attempt * 37) % 360;
    const color = `hsl(${hue} 68% 52%)`;

    if (!usedColors.has(color)) {
      return color;
    }
  }

  return `hsl(${baseHue} 68% 52%)`;
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}
