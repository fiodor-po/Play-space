export type RoomBaselineId = "empty" | "public-demo-v1";

export type RoomBaselineDescriptor = {
  baselineId: RoomBaselineId;
};

export type RoomRecord = {
  id: string;
  creatorId: string | null;
  initializedBaselineId: RoomBaselineId | null;
};

const ROOM_METADATA_STORAGE_KEY = "play-space-alpha-room-metadata-v1";

type StoredRoomRecord = {
  roomId: string;
  creatorId?: string | null;
  initializedBaselineId?: RoomBaselineId | null;
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
  });

  if (
    existingRecord &&
    existingRecord.creatorId === nextRecord.creatorId &&
    existingRecord.initializedBaselineId === nextRecord.initializedBaselineId
  ) {
    return existingRecord;
  }

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
