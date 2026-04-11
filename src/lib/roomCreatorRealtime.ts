import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { ensureDurableRoomIdentity } from "./durableRoomIdentity";
import { getRealtimeServerWsUrl } from "./runtimeConfig";

const ROOM_CREATOR_DOC_PREFIX = "play-space-alpha-room-state";
const ROOM_CREATOR_KEY = "creatorId";

export type RoomCreatorConnection = {
  destroy: () => void;
};

export function createRoomCreatorConnection(params: {
  roomId: string;
  participantId: string;
  onCreatorIdChange: (creatorId: string | null) => void;
  serverUrl?: string;
}) {
  const doc = new Y.Doc();
  const serverUrl = getRealtimeServerWsUrl(params.serverUrl);
  const provider = new WebsocketProvider(
    serverUrl,
    `${ROOM_CREATOR_DOC_PREFIX}:${params.roomId}`,
    doc
  );
  const roomState = doc.getMap<string | null>("room-state");
  let isDestroyed = false;
  let durableCreatorId: string | null = null;
  let hasResolvedDurableIdentity = false;
  let lastPublishedCreatorId: string | null | undefined;
  const handleRoomStateChange = () => {
    publishCreatorId();
  };
  const handleProviderSync = () => {
    mirrorDurableCreatorToLiveRoomState();
    publishCreatorId();
  };

  const publishCreatorId = () => {
    const nextCreatorId = readCreatorId(roomState) ?? durableCreatorId;

    if (lastPublishedCreatorId === nextCreatorId) {
      return;
    }

    lastPublishedCreatorId = nextCreatorId;
    params.onCreatorIdChange(nextCreatorId);
  };

  const mirrorDurableCreatorToLiveRoomState = () => {
    if (
      isDestroyed ||
      !provider.synced ||
      !hasResolvedDurableIdentity ||
      !durableCreatorId
    ) {
      return;
    }

    const liveCreatorId = readCreatorId(roomState);
    if (liveCreatorId === durableCreatorId) {
      return;
    }

    doc.transact(() => {
      roomState.set(ROOM_CREATOR_KEY, durableCreatorId);
    });
  };

  const resolveDurableIdentity = async () => {
    const identity = await ensureDurableRoomIdentity(params.roomId, {
      creatorId: params.participantId,
    });

    if (isDestroyed) {
      return;
    }

    durableCreatorId = identity?.creatorId ?? null;
    hasResolvedDurableIdentity = true;
    publishCreatorId();
    mirrorDurableCreatorToLiveRoomState();
  };

  roomState.observe(handleRoomStateChange);
  provider.on("sync", handleProviderSync);

  if (readCreatorId(roomState)) {
    publishCreatorId();
  }

  if (provider.synced) {
    mirrorDurableCreatorToLiveRoomState();
  }

  void resolveDurableIdentity();

  return {
    destroy: () => {
      isDestroyed = true;
      roomState.unobserve(handleRoomStateChange);
      provider.off("sync", handleProviderSync);
      provider.destroy();
      doc.destroy();
    },
  } satisfies RoomCreatorConnection;
}

function readCreatorId(roomState: Y.Map<string | null>) {
  const creatorId = roomState.get(ROOM_CREATOR_KEY);

  return typeof creatorId === "string" && creatorId.trim().length > 0
    ? creatorId
    : null;
}
