import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type { BoardObject } from "../types/board";
import { normalizeTokenObject } from "../board/objects/token/createTokenObject";
import { getRealtimeServerWsUrl } from "./runtimeConfig";

export type ActiveObjectMove = {
  objectId: string;
  objectKind: BoardObject["kind"];
  participantId: string;
  participantName: string;
  participantColor: string;
  startedAt: number;
};

export type ActiveObjectMoveMap = Record<string, ActiveObjectMove>;

export type RoomTokenConnection = {
  destroy: () => void;
  setActiveMove: (move: ActiveObjectMove | null) => void;
  replaceTokens: (tokens: BoardObject[]) => void;
  seedTokens: (tokens: BoardObject[]) => void;
};

export function createRoomTokenConnection(params: {
  roomId: string;
  onActiveMovesChange?: (moves: ActiveObjectMoveMap) => void;
  onTokensChange: (tokens: BoardObject[]) => void;
  onInitialSyncComplete?: () => void;
  serverUrl?: string;
}): RoomTokenConnection {
  const doc = new Y.Doc();
  const serverUrl = getRealtimeServerWsUrl(params.serverUrl);
  const provider = new WebsocketProvider(
    serverUrl,
    `play-space-alpha-tokens:${params.roomId}`,
    doc
  );
  const tokenMap = doc.getMap<string>("tokens");
  let hasInitialSync = false;
  let hasReportedInitialSync = false;
  let pendingSeedTokens: BoardObject[] | null = null;

  const publishTokens = () => {
    params.onTokensChange(getTokensFromMap(tokenMap));
  };

  const publishActiveMoves = () => {
    params.onActiveMovesChange?.(
      getActiveObjectMovesFromAwareness(provider.awareness.getStates())
    );
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

    if (!hasReportedInitialSync) {
      hasReportedInitialSync = true;
      params.onInitialSyncComplete?.();
    }
  };

  tokenMap.observe(publishTokens);
  provider.on("status", handleStatus);
  provider.on("sync", handleSync);
  provider.awareness.on("change", publishActiveMoves);
  publishTokens();
  publishActiveMoves();

  return {
    destroy: () => {
      provider.awareness.setLocalStateField("activeMove", null);
      tokenMap.unobserve(publishTokens);
      provider.off("status", handleStatus);
      provider.off("sync", handleSync);
      provider.awareness.off("change", publishActiveMoves);
      provider.destroy();
      doc.destroy();
    },
    setActiveMove: (move) => {
      const currentMove = provider.awareness.getLocalState()?.activeMove ?? null;

      if (areActiveObjectMovesEqual(currentMove, move)) {
        return;
      }

      provider.awareness.setLocalStateField("activeMove", move);
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
        tokens.push(normalizeTokenObject(token));
      }
    } catch {
      return;
    }
  });

  return tokens;
}

function getActiveObjectMovesFromAwareness(states: Map<number, Record<string, unknown>>) {
  const moves: ActiveObjectMoveMap = {};

  states.forEach((state) => {
    const activeMove = state.activeMove;

    if (!activeMove || typeof activeMove !== "object") {
      return;
    }

    const move = activeMove as Partial<ActiveObjectMove>;

    if (
      typeof move.objectId !== "string" ||
      move.objectId.length === 0 ||
      (move.objectKind !== "token" &&
        move.objectKind !== "image" &&
        move.objectKind !== "note-card") ||
      typeof move.participantId !== "string" ||
      move.participantId.length === 0 ||
      typeof move.participantName !== "string" ||
      move.participantName.length === 0 ||
      typeof move.participantColor !== "string" ||
      move.participantColor.length === 0 ||
      typeof move.startedAt !== "number"
    ) {
      return;
    }

    moves[move.objectId] = move as ActiveObjectMove;
  });

  return moves;
}

function areActiveObjectMovesEqual(
  current: ActiveObjectMove | null | undefined,
  next: ActiveObjectMove | null | undefined
) {
  if (!current && !next) {
    return true;
  }

  if (!current || !next) {
    return false;
  }

  return (
    current.objectId === next.objectId &&
    current.objectKind === next.objectKind &&
    current.participantId === next.participantId &&
    current.participantName === next.participantName &&
    current.participantColor === next.participantColor &&
    current.startedAt === next.startedAt
  );
}
