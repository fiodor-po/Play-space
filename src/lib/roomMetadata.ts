export type RoomRecord = {
  id: string;
  creatorId: string | null;
};

const ROOM_METADATA_STORAGE_KEY = "play-space-alpha-room-metadata-v1";

type StoredRoomRecord = {
  roomId: string;
  creatorId?: string | null;
};

export function createRoomRecord(params: {
  roomId: string;
  creatorId?: string | null;
}): RoomRecord {
  return {
    id: params.roomId,
    creatorId:
      typeof params.creatorId === "string" && params.creatorId.length > 0
        ? params.creatorId
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
    })
  );
}

export function ensureRoomRecord(roomId: string, creatorId: string): RoomRecord {
  const existingRecord = loadRoomRecord(roomId);

  if (existingRecord?.creatorId) {
    return existingRecord;
  }

  const nextRecord = createRoomRecord({ roomId, creatorId });

  saveRoomRecord(nextRecord);
  return nextRecord;
}

export type RoomMetadata = RoomRecord;

export const loadRoomMetadata = loadRoomRecord;
export const saveRoomMetadata = saveRoomRecord;
export const ensureRoomMetadata = ensureRoomRecord;

function getRoomMetadataStorageKey(roomId: string) {
  return `${ROOM_METADATA_STORAGE_KEY}:${roomId}`;
}
