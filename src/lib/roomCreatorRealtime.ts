import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { loadDurableRoomSnapshot } from "./durableRoomSnapshot";
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
  let hasAttemptedInitialization = false;

  const publishCreatorId = () => {
    params.onCreatorIdChange(readCreatorId(roomState));
  };

  const initializeCreatorIfMissing = async () => {
    if (hasAttemptedInitialization || isDestroyed) {
      return;
    }

    hasAttemptedInitialization = true;

    if (readCreatorId(roomState)) {
      return;
    }

    const snapshot = await loadDurableRoomSnapshot(params.roomId);
    const initialCreatorId =
      snapshot?.roomCreatorId ?? params.participantId ?? null;

    if (!initialCreatorId || isDestroyed || readCreatorId(roomState)) {
      return;
    }

    doc.transact(() => {
      if (!readCreatorId(roomState)) {
        roomState.set(ROOM_CREATOR_KEY, initialCreatorId);
      }
    });
  };

  roomState.observe(publishCreatorId);
  provider.on("sync", initializeCreatorIfMissing);
  publishCreatorId();

  if (provider.synced) {
    void initializeCreatorIfMissing();
  }

  return {
    destroy: () => {
      isDestroyed = true;
      roomState.unobserve(publishCreatorId);
      provider.off("sync", initializeCreatorIfMissing);
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
