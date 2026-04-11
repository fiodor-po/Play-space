import { getApiServerBaseUrl } from "./runtimeConfig";

export type DurableRoomIdentity = {
  roomId: string;
  creatorId: string | null;
  createdAt: string;
};

export async function loadDurableRoomIdentity(
  roomId: string
): Promise<DurableRoomIdentity | null> {
  const identityUrl = getDurableRoomIdentityUrl(roomId);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, 1500);

  try {
    const response = await fetch(identityUrl, {
      signal: controller.signal,
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to load durable room identity: ${response.status}`);
    }

    const parsed = (await response.json()) as {
      identity?: Partial<DurableRoomIdentity> | null;
    };

    return normalizeDurableRoomIdentity(roomId, parsed.identity ?? null);
  } catch (error) {
    console.warn("[room-identity][load-failed]", {
      roomId,
      identityUrl,
      reason: error instanceof DOMException ? error.name : "request-failed",
    });
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function ensureDurableRoomIdentity(
  roomId: string,
  options?: {
    creatorId?: string | null;
  }
): Promise<DurableRoomIdentity | null> {
  const identityUrl = getDurableRoomIdentityUrl(roomId);

  try {
    const response = await fetch(identityUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creatorId: options?.creatorId ?? null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to ensure durable room identity: ${response.status}`);
    }

    const parsed = (await response.json()) as {
      identity?: Partial<DurableRoomIdentity> | null;
    };

    return normalizeDurableRoomIdentity(roomId, parsed.identity ?? null);
  } catch (error) {
    console.warn("[room-identity][ensure-failed]", {
      roomId,
      identityUrl,
      reason: error instanceof Error ? error.message : "request-failed",
    });
    return null;
  }
}

function normalizeDurableRoomIdentity(
  roomId: string,
  identity: Partial<DurableRoomIdentity> | null
): DurableRoomIdentity | null {
  if (!identity || identity.roomId !== roomId) {
    return null;
  }

  return {
    roomId,
    creatorId:
      typeof identity.creatorId === "string" && identity.creatorId.trim().length > 0
        ? identity.creatorId
        : null,
    createdAt:
      typeof identity.createdAt === "string"
        ? identity.createdAt
        : new Date(0).toISOString(),
  };
}

function getDurableRoomIdentityUrl(roomId: string) {
  return new URL(
    `/api/room-identities/${encodeURIComponent(roomId)}`,
    getApiServerBaseUrl()
  ).toString();
}
