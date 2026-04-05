import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type { BoardObject } from "../types/board";

export type RoomTokenConnection = {
  destroy: () => void;
  replaceTokens: (tokens: BoardObject[]) => void;
  seedTokens: (tokens: BoardObject[]) => void;
};

export function createRoomTokenConnection(params: {
  roomId: string;
  onTokensChange: (tokens: BoardObject[]) => void;
  serverUrl?: string;
}): RoomTokenConnection {
  const doc = new Y.Doc();
  const serverUrl =
    params.serverUrl ??
    import.meta.env.VITE_Y_WEBSOCKET_URL ??
    getDefaultRealtimeWsUrl();
  const provider = new WebsocketProvider(
    serverUrl,
    `play-space-alpha-tokens:${params.roomId}`,
    doc
  );
  const tokenMap = doc.getMap<string>("tokens");
  let hasInitialSync = false;
  let pendingSeedTokens: BoardObject[] | null = null;

  const publishTokens = () => {
    params.onTokensChange(getTokensFromMap(tokenMap));
  };

  const handleStatus = (event: {
    status: "connected" | "connecting" | "disconnected";
  }) => {
    if (import.meta.env.DEV) {
      console.info("[tokens]", serverUrl, event.status);
    }
  };
  const handleSync = (isSynced: boolean) => {
    if (!isSynced) {
      return;
    }

    hasInitialSync = true;

    if (pendingSeedTokens && tokenMap.size === 0) {
      pendingSeedTokens.forEach((token) => {
        tokenMap.set(token.id, JSON.stringify(token));
      });
    }

    pendingSeedTokens = null;
    publishTokens();
  };

  tokenMap.observe(publishTokens);
  provider.on("status", handleStatus);
  provider.on("sync", handleSync);
  publishTokens();

  return {
    destroy: () => {
      tokenMap.unobserve(publishTokens);
      provider.off("status", handleStatus);
      provider.off("sync", handleSync);
      provider.destroy();
      doc.destroy();
    },
    replaceTokens: (tokens) => {
      const nextTokens = tokens.filter((token) => token.kind === "token");
      const nextTokenIds = new Set(nextTokens.map((token) => token.id));

      tokenMap.forEach((_, tokenId) => {
        if (!nextTokenIds.has(tokenId)) {
          tokenMap.delete(tokenId);
        }
      });

      nextTokens.forEach((token) => {
        tokenMap.set(token.id, JSON.stringify(token));
      });
    },
    seedTokens: (tokens) => {
      const nextSeedTokens = tokens.filter((token) => token.kind === "token");

      if (nextSeedTokens.length === 0) {
        return;
      }

      if (!hasInitialSync) {
        pendingSeedTokens = nextSeedTokens;
        return;
      }

      if (tokenMap.size > 0) {
        return;
      }

      nextSeedTokens.forEach((token) => {
          tokenMap.set(token.id, JSON.stringify(token));
      });
    },
  };
}

function getTokensFromMap(tokenMap: Y.Map<string>) {
  const tokens: BoardObject[] = [];

  tokenMap.forEach((value) => {
    try {
      const token = JSON.parse(value) as BoardObject;

      if (token.kind === "token") {
        tokens.push(token);
      }
    } catch {
      return;
    }
  });

  return tokens;
}

function getDefaultRealtimeWsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:1234`;
}
