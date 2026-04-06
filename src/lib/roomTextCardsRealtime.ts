import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type { BoardObject } from "../types/board";

export type RoomTextCardConnection = {
  destroy: () => void;
  replaceTextCards: (textCards: BoardObject[]) => void;
  upsertTextCards: (textCards: BoardObject[]) => void;
  removeTextCards: (textCardIds: string[]) => void;
  seedTextCards: (textCards: BoardObject[]) => void;
};

export function createRoomTextCardConnection(params: {
  roomId: string;
  onTextCardsChange: (textCards: BoardObject[]) => void;
  onInitialSyncComplete?: () => void;
  serverUrl?: string;
}): RoomTextCardConnection {
  const doc = new Y.Doc();
  const serverUrl =
    params.serverUrl ??
    import.meta.env.VITE_Y_WEBSOCKET_URL ??
    getDefaultRealtimeWsUrl();
  const provider = new WebsocketProvider(
    serverUrl,
    `play-space-alpha-text-cards:${params.roomId}`,
    doc
  );
  const textCardMap = doc.getMap<string>("text-cards");
  let hasInitialSync = false;
  let hasReportedInitialSync = false;
  let pendingSeedTextCards: BoardObject[] | null = null;

  const publishTextCards = () => {
    params.onTextCardsChange(getTextCardsFromMap(textCardMap));
  };

  const handleStatus = (event: {
    status: "connected" | "connecting" | "disconnected";
  }) => {
    if (import.meta.env.DEV) {
      console.info("[text-cards]", serverUrl, event.status);
    }
  };

  const handleSync = (isSynced: boolean) => {
    if (!isSynced) {
      return;
    }

    hasInitialSync = true;

    if (pendingSeedTextCards && textCardMap.size === 0) {
      pendingSeedTextCards.forEach((textCard) => {
        textCardMap.set(textCard.id, JSON.stringify(textCard));
      });
    }

    pendingSeedTextCards = null;
    publishTextCards();

    if (!hasReportedInitialSync) {
      hasReportedInitialSync = true;
      params.onInitialSyncComplete?.();
    }
  };

  textCardMap.observe(publishTextCards);
  provider.on("status", handleStatus);
  provider.on("sync", handleSync);
  publishTextCards();

  return {
    destroy: () => {
      textCardMap.unobserve(publishTextCards);
      provider.off("status", handleStatus);
      provider.off("sync", handleSync);
      provider.destroy();
      doc.destroy();
    },
    replaceTextCards: (textCards) => {
      const nextTextCards = textCards.filter(
        (textCard) => textCard.kind === "text-card"
      );
      const nextTextCardIds = new Set(nextTextCards.map((textCard) => textCard.id));

      textCardMap.forEach((_, textCardId) => {
        if (!nextTextCardIds.has(textCardId)) {
          textCardMap.delete(textCardId);
        }
      });

      nextTextCards.forEach((textCard) => {
        textCardMap.set(textCard.id, JSON.stringify(textCard));
      });
    },
    upsertTextCards: (textCards) => {
      textCards
        .filter((textCard) => textCard.kind === "text-card")
        .forEach((textCard) => {
          textCardMap.set(textCard.id, JSON.stringify(textCard));
        });
    },
    removeTextCards: (textCardIds) => {
      textCardIds.forEach((textCardId) => {
        textCardMap.delete(textCardId);
      });
    },
    seedTextCards: (textCards) => {
      const nextSeedTextCards = textCards.filter(
        (textCard) => textCard.kind === "text-card"
      );

      if (nextSeedTextCards.length === 0) {
        return;
      }

      if (!hasInitialSync) {
        pendingSeedTextCards = nextSeedTextCards;
        return;
      }

      if (textCardMap.size > 0) {
        return;
      }

      nextSeedTextCards.forEach((textCard) => {
        textCardMap.set(textCard.id, JSON.stringify(textCard));
      });
    },
  };
}

function getTextCardsFromMap(textCardMap: Y.Map<string>) {
  const textCards: BoardObject[] = [];

  textCardMap.forEach((value) => {
    try {
      const textCard = JSON.parse(value) as BoardObject;

      if (textCard.kind === "text-card") {
        textCards.push(textCard);
      }
    } catch {
      return;
    }
  });

  return textCards;
}

function getDefaultRealtimeWsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:1234`;
}
