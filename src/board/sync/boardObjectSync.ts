import type { BoardObject } from "../../types/board";
import type { RoomImageConnection } from "../../lib/roomImagesRealtime";
import type { RoomTextCardConnection } from "../../lib/roomTextCardsRealtime";
import type { RoomTokenConnection } from "../../lib/roomTokensRealtime";
import { isNoteCardObjectKind } from "../objects/noteCard/sizing";

export type BoardObjectSyncOptions = {
  syncSharedTokens?: boolean;
  syncSharedImages?: boolean;
  syncSharedImageIds?: string[];
  removeSharedImageIds?: string[];
  syncSharedTextCards?: boolean;
};

type BoardObjectSyncConnections = {
  roomTokenConnection: RoomTokenConnection | null;
  roomImageConnection: RoomImageConnection | null;
  roomTextCardConnection: RoomTextCardConnection | null;
};

export function syncBoardObjects(
  connections: BoardObjectSyncConnections,
  nextObjects: BoardObject[],
  options?: BoardObjectSyncOptions
) {
  if (options?.syncSharedTokens) {
    connections.roomTokenConnection?.replaceTokens(nextObjects);
  }

  if (options?.syncSharedImages) {
    connections.roomImageConnection?.replaceImages(nextObjects);
  }

  if (options?.syncSharedImageIds) {
    connections.roomImageConnection?.upsertImages(
      nextObjects.filter(
        (object) =>
          object.kind === "image" && options.syncSharedImageIds?.includes(object.id)
      )
    );
  }

  if (options?.removeSharedImageIds) {
    connections.roomImageConnection?.removeImages(options.removeSharedImageIds);
  }

  if (options?.syncSharedTextCards) {
    connections.roomTextCardConnection?.replaceTextCards(nextObjects);
  }
}

export function getAddBoardObjectSyncOptions(
  object: BoardObject
): BoardObjectSyncOptions {
  return {
    syncSharedTokens: object.kind === "token",
    syncSharedImageIds: object.kind === "image" ? [object.id] : undefined,
    syncSharedTextCards: isNoteCardObjectKind(object.kind),
  };
}

export function getUpdateBoardObjectSyncOptions(
  objects: BoardObject[],
  id: string
): BoardObjectSyncOptions {
  const object = objects.find((candidate) => candidate.id === id);

  return {
    syncSharedTokens: object?.kind === "token",
    syncSharedImageIds: object?.kind === "image" ? [id] : undefined,
    syncSharedTextCards: object ? isNoteCardObjectKind(object.kind) : false,
  };
}

export function getRemoveBoardObjectSyncOptions(
  objects: BoardObject[],
  id: string
): BoardObjectSyncOptions {
  const object = objects.find((candidate) => candidate.id === id);

  return {
    syncSharedTokens: object?.kind === "token",
    removeSharedImageIds: object?.kind === "image" ? [id] : undefined,
    syncSharedTextCards: object ? isNoteCardObjectKind(object.kind) : false,
  };
}
