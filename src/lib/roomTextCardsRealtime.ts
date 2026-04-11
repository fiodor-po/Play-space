import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type { BoardObject } from "../types/board";
import { getRealtimeServerWsUrl } from "./runtimeConfig";
import { normalizeTextCardObject } from "../board/objects/textCard/sizing";

export type TextCardEditingPresence = {
  textCardId: string;
  participantId: string;
  participantName: string;
  participantColor: string;
};

export type TextCardResizePresence = {
  textCardId: string;
  participantId: string;
  participantName: string;
  participantColor: string;
};

export type RoomTextCardConnection = {
  destroy: () => void;
  replaceTextCards: (textCards: BoardObject[]) => void;
  upsertTextCards: (textCards: BoardObject[]) => void;
  setActiveEditingTextCard: (editingPresence: TextCardEditingPresence | null) => void;
  setActiveResizingTextCard: (resizePresence: TextCardResizePresence | null) => void;
  removeTextCards: (textCardIds: string[]) => void;
  seedTextCards: (textCards: BoardObject[]) => void;
};

export function createRoomTextCardConnection(params: {
  roomId: string;
  onTextCardsChange: (textCards: BoardObject[]) => void;
  onInitialSyncComplete?: () => void;
  onTextCardEditingStatesChange?: (
    editingStates: Record<string, TextCardEditingPresence>
  ) => void;
  onTextCardResizeStatesChange?: (
    resizeStates: Record<string, TextCardResizePresence>
  ) => void;
  serverUrl?: string;
}): RoomTextCardConnection {
  const doc = new Y.Doc();
  const serverUrl = getRealtimeServerWsUrl(params.serverUrl);
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

  const publishTextCardEditingStates = () => {
    params.onTextCardEditingStatesChange?.(
      getTextCardEditingStatesFromAwareness(provider.awareness.getStates())
    );
  };

  const publishTextCardResizeStates = () => {
    params.onTextCardResizeStatesChange?.(
      getTextCardResizeStatesFromAwareness(provider.awareness.getStates())
    );
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
  provider.awareness.on("change", publishTextCardEditingStates);
  provider.awareness.on("change", publishTextCardResizeStates);
  publishTextCards();
  publishTextCardEditingStates();
  publishTextCardResizeStates();

  return {
    destroy: () => {
      provider.awareness.setLocalStateField("textCardEditing", null);
      provider.awareness.setLocalStateField("textCardResize", null);
      textCardMap.unobserve(publishTextCards);
      provider.off("status", handleStatus);
      provider.off("sync", handleSync);
      provider.awareness.off("change", publishTextCardEditingStates);
      provider.awareness.off("change", publishTextCardResizeStates);
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
    setActiveEditingTextCard: (editingPresence) => {
      provider.awareness.setLocalStateField("textCardEditing", editingPresence);
      publishTextCardEditingStates();
    },
    setActiveResizingTextCard: (resizePresence) => {
      provider.awareness.setLocalStateField("textCardResize", resizePresence);
      publishTextCardResizeStates();
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
        textCards.push(normalizeTextCardObject(textCard));
      }
    } catch {
      return;
    }
  });

  return textCards;
}

function getTextCardEditingStatesFromAwareness(
  states: Map<
    number,
    {
      textCardEditing?: TextCardEditingPresence | null;
      textCardResize?: TextCardResizePresence | null;
    }
  >
) {
  const editingStates: Record<string, TextCardEditingPresence> = {};

  states.forEach((state) => {
    const editingState = state.textCardEditing;

    if (
      !editingState ||
      !editingState.textCardId ||
      !editingState.participantId ||
      !editingState.participantName ||
      !editingState.participantColor
    ) {
      return;
    }

    editingStates[editingState.textCardId] = editingState;
  });

  return editingStates;
}

function getTextCardResizeStatesFromAwareness(
  states: Map<
    number,
    {
      textCardEditing?: TextCardEditingPresence | null;
      textCardResize?: TextCardResizePresence | null;
    }
  >
) {
  const resizeStates: Record<string, TextCardResizePresence> = {};

  states.forEach((state) => {
    const resizeState = state.textCardResize;

    if (
      !resizeState ||
      !resizeState.textCardId ||
      !resizeState.participantId ||
      !resizeState.participantName ||
      !resizeState.participantColor
    ) {
      return;
    }

    resizeStates[resizeState.textCardId] = resizeState;
  });

  return resizeStates;
}
