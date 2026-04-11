import { getApiServerBaseUrl } from "./runtimeConfig";

export type RoomOpsStatus =
  | "live-and-snapshot"
  | "live-only"
  | "snapshot-only"
  | "unknown";

export type RoomOpsSummary = {
  roomId: string;
  status: RoomOpsStatus;
  live: {
    isActive: boolean;
    activeConnectionCount: number;
    sliceCount: number;
  };
  snapshot: {
    exists: boolean;
    revision: number | null;
    savedAt: string | null;
    objectCounts: {
      tokens: number;
      images: number;
      textCards: number;
      total: number;
    };
  };
};

export type RoomOpsDetail = RoomOpsSummary & {
  live: RoomOpsSummary["live"] & {
    slices: Array<{
      kind: string;
      docName: string;
      connectionCount: number;
      sharedObjectCount: number;
      awarenessStateCount: number;
    }>;
  };
  snapshot: RoomOpsSummary["snapshot"] & {
    data: {
      roomId: string;
      revision: number;
      savedAt: string;
      tokens: unknown[];
      images: unknown[];
      textCards: unknown[];
    } | null;
  };
};

type FetchRoomOpsOptions = {
  opsKey: string;
};

export async function fetchRoomOpsSummaries(options: FetchRoomOpsOptions) {
  const response = await fetch(getRoomOpsUrl("/api/rooms"), {
    headers: createRoomOpsHeaders(options.opsKey),
  });

  if (response.status === 401) {
    throw new Error("unauthorized");
  }

  if (!response.ok) {
    throw new Error(`rooms-list-failed:${response.status}`);
  }

  const parsed = (await response.json()) as {
    rooms?: RoomOpsSummary[];
  };

  return Array.isArray(parsed.rooms) ? parsed.rooms : [];
}

export async function fetchRoomOpsDetail(
  roomId: string,
  options: FetchRoomOpsOptions
) {
  const response = await fetch(
    getRoomOpsUrl(`/api/rooms/${encodeURIComponent(roomId)}`),
    {
      headers: createRoomOpsHeaders(options.opsKey),
    }
  );

  if (response.status === 401) {
    throw new Error("unauthorized");
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`room-detail-failed:${response.status}`);
  }

  const parsed = (await response.json()) as {
    room?: RoomOpsDetail | null;
  };

  return parsed.room ?? null;
}

export async function deleteRoomOpsSnapshot(
  roomId: string,
  options: FetchRoomOpsOptions
) {
  const response = await fetch(
    getRoomOpsUrl(`/api/rooms/${encodeURIComponent(roomId)}/durable-snapshot`),
    {
      method: "DELETE",
      headers: createRoomOpsHeaders(options.opsKey),
    }
  );

  if (response.status === 401) {
    throw new Error("unauthorized");
  }

  if (!response.ok) {
    throw new Error(`delete-snapshot-failed:${response.status}`);
  }

  const parsed = (await response.json()) as {
    deleted?: boolean;
    room?: RoomOpsDetail | null;
  };

  return {
    deleted: parsed.deleted === true,
    room: parsed.room ?? null,
  };
}

function createRoomOpsHeaders(opsKey: string) {
  return {
    "X-Play-Space-Ops-Key": opsKey,
  };
}

function getRoomOpsUrl(pathname: string) {
  return new URL(pathname, getApiServerBaseUrl()).toString();
}
