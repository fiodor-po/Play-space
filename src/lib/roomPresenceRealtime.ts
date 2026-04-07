import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type { ParticipantPresence, ParticipantPresenceMap } from "./roomSession";
import { getRealtimeServerWsUrl } from "./runtimeConfig";

type AwarenessState = {
  presence?: ParticipantPresence | null;
};

export type RoomPresenceConnection = {
  destroy: () => void;
  setLocalPresence: (presence: ParticipantPresence | null) => void;
};

export function createRoomPresenceConnection(params: {
  onPresencesChange: (presences: ParticipantPresenceMap) => void;
  roomId: string;
  serverUrl?: string;
}): RoomPresenceConnection {
  const doc = new Y.Doc();
  const serverUrl = getRealtimeServerWsUrl(params.serverUrl);
  const provider = new WebsocketProvider(
    serverUrl,
    `play-space-alpha-presence:${params.roomId}`,
    doc
  );

  const publishPresences = () => {
    params.onPresencesChange(
      getParticipantPresencesFromAwareness(provider.awareness.getStates())
    );
  };

  provider.awareness.on("change", publishPresences);
  const handleStatus = (event: {
    status: "connected" | "connecting" | "disconnected";
  }) => {
    if (import.meta.env.DEV) {
      console.info("[presence]", serverUrl, event.status);
    }
  };
  provider.on("status", handleStatus);
  publishPresences();

  return {
    destroy: () => {
      provider.awareness.off("change", publishPresences);
      provider.off("status", handleStatus);
      provider.destroy();
      doc.destroy();
    },
    setLocalPresence: (presence) => {
      provider.awareness.setLocalStateField("presence", presence);
      publishPresences();
    },
  };
}

function getParticipantPresencesFromAwareness(
  states: Map<number, AwarenessState>
): ParticipantPresenceMap {
  const presences: ParticipantPresenceMap = {};

  states.forEach((state) => {
    const presence = state.presence;

    if (
      !presence ||
      !presence.participantId ||
      !presence.name ||
      !presence.color
    ) {
      return;
    }

    presences[presence.participantId] = presence;
  });

  return presences;
}
