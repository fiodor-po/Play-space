import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { ensureDurableRoomIdentity } from "./durableRoomIdentity";
import { getRealtimeServerWsUrl } from "./runtimeConfig";
import {
  createRoomSettings,
  normalizeRoomBackgroundThemeId,
  type RoomSettings,
} from "./roomSettings";

const ROOM_CREATOR_DOC_PREFIX = "play-space-alpha-room-state";
const ROOM_CREATOR_KEY = "creatorId";
const ROOM_BACKGROUND_THEME_KEY = "backgroundThemeId";

export type RoomCreatorConnection = {
  destroy: () => void;
};

export type RoomState = {
  creatorId: string | null;
  settings: RoomSettings;
};

export type RoomStateConnection = {
  destroy: () => void;
  updateRoomSettings: (nextSettings: Partial<RoomSettings>) => Promise<void>;
};

export function createRoomStateConnection(params: {
  roomId: string;
  participantId: string;
  onStateChange: (state: RoomState) => void;
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
  let durableSettings = createRoomSettings();
  let hasResolvedDurableIdentity = false;
  let lastPublishedState: RoomState | null = null;

  const publishRoomState = () => {
    const nextState = {
      creatorId: readCreatorId(roomState) ?? durableCreatorId,
      settings: createRoomSettings({
        backgroundThemeId:
          readBackgroundThemeId(roomState) ?? durableSettings.backgroundThemeId,
      }),
    } satisfies RoomState;

    if (
      lastPublishedState?.creatorId === nextState.creatorId &&
      lastPublishedState?.settings.backgroundThemeId ===
        nextState.settings.backgroundThemeId
    ) {
      return;
    }

    lastPublishedState = nextState;
    params.onStateChange(nextState);
  };

  const mirrorDurableStateToLiveRoomState = () => {
    if (isDestroyed || !provider.synced || !hasResolvedDurableIdentity) {
      return;
    }

    const liveCreatorId = readCreatorId(roomState);
    const liveBackgroundThemeId = readBackgroundThemeId(roomState);

    if (
      liveCreatorId === durableCreatorId &&
      liveBackgroundThemeId === durableSettings.backgroundThemeId
    ) {
      return;
    }

    doc.transact(() => {
      if (durableCreatorId) {
        roomState.set(ROOM_CREATOR_KEY, durableCreatorId);
      }

      roomState.set(ROOM_BACKGROUND_THEME_KEY, durableSettings.backgroundThemeId);
    });
  };

  const handleRoomStateChange = () => {
    publishRoomState();
  };

  const promoteLiveSettingsToDurableState = () => {
    if (isDestroyed || !provider.synced || !hasResolvedDurableIdentity) {
      return false;
    }

    const liveBackgroundThemeId = readBackgroundThemeId(roomState);

    if (
      !liveBackgroundThemeId ||
      liveBackgroundThemeId === durableSettings.backgroundThemeId
    ) {
      return false;
    }

    durableSettings = createRoomSettings({
      backgroundThemeId: liveBackgroundThemeId,
    });
    publishRoomState();
    void ensureDurableRoomIdentity(params.roomId, {
      backgroundThemeId: liveBackgroundThemeId,
    }).then((identity) => {
      if (isDestroyed || !identity) {
        return;
      }

      durableCreatorId = identity.creatorId;
      durableSettings = createRoomSettings({
        backgroundThemeId: identity.backgroundThemeId,
      });
      publishRoomState();
    });
    return true;
  };

  const handleProviderSync = () => {
    if (promoteLiveSettingsToDurableState()) {
      return;
    }

    mirrorDurableStateToLiveRoomState();
    publishRoomState();
  };

  const resolveDurableIdentity = async () => {
    const identity = await ensureDurableRoomIdentity(params.roomId, {
      creatorId: params.participantId,
    });

    if (isDestroyed) {
      return;
    }

    durableCreatorId = identity?.creatorId ?? null;
    durableSettings = createRoomSettings({
      backgroundThemeId: identity?.backgroundThemeId,
    });
    hasResolvedDurableIdentity = true;
    publishRoomState();
    mirrorDurableStateToLiveRoomState();
  };

  const updateRoomSettings = async (nextSettings: Partial<RoomSettings>) => {
    const nextBackgroundThemeId = normalizeRoomBackgroundThemeId(
      nextSettings.backgroundThemeId ?? durableSettings.backgroundThemeId
    );

    durableSettings = createRoomSettings({
      backgroundThemeId: nextBackgroundThemeId,
    });

    doc.transact(() => {
      roomState.set(ROOM_BACKGROUND_THEME_KEY, nextBackgroundThemeId);
    });
    publishRoomState();

    const identity = await ensureDurableRoomIdentity(params.roomId, {
      backgroundThemeId: nextBackgroundThemeId,
    });

    if (isDestroyed || !identity) {
      return;
    }

    durableCreatorId = identity.creatorId;
    if (identity.backgroundThemeId !== nextBackgroundThemeId) {
      console.warn("[room-settings][durable-background-theme-mismatch]", {
        roomId: params.roomId,
        requestedBackgroundThemeId: nextBackgroundThemeId,
        durableBackgroundThemeId: identity.backgroundThemeId,
      });
      publishRoomState();
      mirrorDurableStateToLiveRoomState();
      return;
    }

    durableSettings = createRoomSettings({
      backgroundThemeId: identity.backgroundThemeId,
    });
    publishRoomState();
    mirrorDurableStateToLiveRoomState();
  };

  roomState.observe(handleRoomStateChange);
  provider.on("sync", handleProviderSync);

  if (readCreatorId(roomState) || readBackgroundThemeId(roomState)) {
    publishRoomState();
  }

  if (provider.synced) {
    mirrorDurableStateToLiveRoomState();
  }

  void resolveDurableIdentity();

  return {
    destroy: () => {
      if (isDestroyed) {
        return;
      }

      isDestroyed = true;
      roomState.unobserve(handleRoomStateChange);
      provider.off("sync", handleProviderSync);
      provider.destroy();
      doc.destroy();
    },
    updateRoomSettings,
  } satisfies RoomStateConnection;
}

export function createRoomCreatorConnection(params: {
  roomId: string;
  participantId: string;
  onCreatorIdChange: (creatorId: string | null) => void;
  serverUrl?: string;
}) {
  const connection = createRoomStateConnection({
    roomId: params.roomId,
    participantId: params.participantId,
    onStateChange: (nextState) => {
      params.onCreatorIdChange(nextState.creatorId);
    },
    serverUrl: params.serverUrl,
  });

  return {
    destroy: () => {
      connection.destroy();
    },
  } satisfies RoomCreatorConnection;
}

function readCreatorId(roomState: Y.Map<string | null>) {
  const creatorId = roomState.get(ROOM_CREATOR_KEY);

  return typeof creatorId === "string" && creatorId.trim().length > 0
    ? creatorId
    : null;
}

function readBackgroundThemeId(roomState: Y.Map<string | null>) {
  const backgroundThemeId = roomState.get(ROOM_BACKGROUND_THEME_KEY);

  return typeof backgroundThemeId === "string"
    ? normalizeRoomBackgroundThemeId(backgroundThemeId)
    : null;
}
