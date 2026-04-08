export type RoomMetadata = {
  roomId: string;
  creatorId?: string | null;
};

const ROOM_METADATA_STORAGE_KEY = "play-space-alpha-room-metadata-v1";

export function loadRoomMetadata(roomId: string): RoomMetadata | null {
  const raw = localStorage.getItem(getRoomMetadataStorageKey(roomId));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RoomMetadata>;

    if (parsed.roomId !== roomId) {
      return null;
    }

    return {
      roomId,
      creatorId:
        typeof parsed.creatorId === "string" && parsed.creatorId.length > 0
          ? parsed.creatorId
          : null,
    };
  } catch {
    return null;
  }
}

export function saveRoomMetadata(roomId: string, metadata: RoomMetadata) {
  localStorage.setItem(
    getRoomMetadataStorageKey(roomId),
    JSON.stringify({
      roomId,
      creatorId: metadata.creatorId ?? null,
    })
  );
}

export function ensureRoomMetadata(
  roomId: string,
  creatorId: string
): RoomMetadata {
  const existingMetadata = loadRoomMetadata(roomId);

  if (existingMetadata?.creatorId) {
    return existingMetadata;
  }

  const nextMetadata: RoomMetadata = {
    roomId,
    creatorId,
  };

  saveRoomMetadata(roomId, nextMetadata);
  return nextMetadata;
}

function getRoomMetadataStorageKey(roomId: string) {
  return `${ROOM_METADATA_STORAGE_KEY}:${roomId}`;
}
