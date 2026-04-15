import { useCallback, useEffect, useRef, useState } from "react";
import { EMPTY_BOARD_STATE } from "../../data/emptyBoard";
import {
  removeBoardObjectById,
  updateBoardObjectById,
} from "../../lib/boardObjects";
import type {
  ImageDrawingLock,
  RoomImageConnection,
} from "../../lib/roomImagesRealtime";
import type {
  TextCardEditingPresence,
  TextCardResizePresence,
  RoomTextCardConnection,
} from "../../lib/roomTextCardsRealtime";
import type {
  ActiveObjectMove,
  RoomTokenConnection,
} from "../../lib/roomTokensRealtime";
import { loadBoardObjects } from "../../lib/storage";
import type { BoardObject } from "../../types/board";
import { isNoteCardObject } from "../objects/noteCard/sizing";
import {
  getAddBoardObjectSyncOptions,
  getRemoveBoardObjectSyncOptions,
  syncBoardObjects,
  type BoardObjectSyncConnections,
  type BoardObjectSyncOptions,
} from "../sync/boardObjectSync";

type UseBoardObjectRuntimeParams = {
  onLocalObjectsChange?: (
    nextObjects: BoardObject[],
    options?: LocalObjectsChangeOptions
  ) => void;
  roomId: string;
};

type BoardObjectSyncOptionsResolver =
  | BoardObjectSyncOptions
  | ((
      currentObjects: BoardObject[],
      nextObjects: BoardObject[]
    ) => BoardObjectSyncOptions | undefined);

export type LocalObjectsChangeOptions = {
  commitBoundary?: "default" | "image-drag-end" | "image-transform-end" | "image-draw-commit";
};

type LocalObjectsChangeOptionsResolver =
  | LocalObjectsChangeOptions
  | ((
      currentObjects: BoardObject[],
      nextObjects: BoardObject[]
    ) => LocalObjectsChangeOptions | undefined);

type SharedImageMergeResolver = (
  sharedImage: BoardObject,
  localImage: BoardObject | null
) => BoardObject;

export function getRoomScopedBoardObjects(roomId: string) {
  const localObjects = loadBoardObjects(roomId, EMPTY_BOARD_STATE);

  return localObjects.filter(
    (object) =>
      object.kind !== "token" &&
      object.kind !== "image" &&
      !isNoteCardObject(object)
  );
}

export function useBoardObjectRuntime({
  onLocalObjectsChange,
  roomId,
}: UseBoardObjectRuntimeParams) {
  const [objects, setObjects] = useState<BoardObject[]>(() =>
    getRoomScopedBoardObjects(roomId)
  );
  const [pendingMutationFlushVersion, setPendingMutationFlushVersion] =
    useState(0);
  const onLocalObjectsChangeRef = useRef(onLocalObjectsChange);
  const pendingMutationQueueRef = useRef<
    Array<{
      nextObjects: BoardObject[];
      options?: BoardObjectSyncOptions;
      localOptions?: LocalObjectsChangeOptions;
    }>
  >([]);
  const mutationSequenceRef = useRef(0);
  const roomTokenConnectionRef = useRef<RoomTokenConnection | null>(null);
  const roomImageConnectionRef = useRef<RoomImageConnection | null>(null);
  const roomTextCardConnectionRef = useRef<RoomTextCardConnection | null>(null);

  useEffect(() => {
    onLocalObjectsChangeRef.current = onLocalObjectsChange;
  }, [onLocalObjectsChange]);

  const getSyncConnections = useCallback(
    (): BoardObjectSyncConnections => ({
      roomTokenConnection: roomTokenConnectionRef.current,
      roomImageConnection: roomImageConnectionRef.current,
      roomTextCardConnection: roomTextCardConnectionRef.current,
    }),
    []
  );

  const syncObjects = useCallback(
    (nextObjects: BoardObject[], options?: BoardObjectSyncOptions) => {
      syncBoardObjects(getSyncConnections(), nextObjects, options);
    },
    [getSyncConnections]
  );

  useEffect(() => {
    if (pendingMutationQueueRef.current.length === 0) {
      return;
    }

    const pendingMutations = pendingMutationQueueRef.current;
    pendingMutationQueueRef.current = [];

    pendingMutations.forEach((mutation) => {
      onLocalObjectsChangeRef.current?.(
        mutation.nextObjects,
        mutation.localOptions
      );
      syncObjects(mutation.nextObjects, mutation.options);
    });
  }, [pendingMutationFlushVersion, syncObjects]);

  const applyBoardObjectsUpdate = useCallback(
    (
      updater: (currentObjects: BoardObject[]) => BoardObject[],
      options?: BoardObjectSyncOptionsResolver,
      localOptions?: LocalObjectsChangeOptionsResolver
    ) => {
      const mutationId = mutationSequenceRef.current + 1;
      mutationSequenceRef.current = mutationId;

      setObjects((currentObjects) => {
        const nextObjects = updater(currentObjects);
        const resolvedOptions =
          typeof options === "function"
            ? options(currentObjects, nextObjects)
            : options;
        const resolvedLocalOptions =
          typeof localOptions === "function"
            ? localOptions(currentObjects, nextObjects)
            : localOptions;

        pendingMutationQueueRef.current.push({
          nextObjects,
          options: resolvedOptions,
          localOptions: resolvedLocalOptions,
        });

        return nextObjects;
      });

      setPendingMutationFlushVersion(mutationId);
    },
    []
  );

  const replaceBoardObjects = useCallback(
    (nextObjects: BoardObject[], options?: BoardObjectSyncOptions) => {
      setObjects(nextObjects);
      syncObjects(nextObjects, options);
    },
    [syncObjects]
  );

  const addBoardObject = useCallback(
    (object: BoardObject) => {
      applyBoardObjectsUpdate(
        (currentObjects) => [...currentObjects, object],
        getAddBoardObjectSyncOptions(object)
      );
    },
    [applyBoardObjectsUpdate]
  );

  const updateBoardObject = useCallback(
    (
      id: string,
      updater: (object: BoardObject) => BoardObject,
      localOptions?: LocalObjectsChangeOptions
    ) => {
      applyBoardObjectsUpdate(
        (currentObjects) => updateBoardObjectById(currentObjects, id, updater),
        undefined,
        localOptions
      );
    },
    [applyBoardObjectsUpdate]
  );

  const removeBoardObject = useCallback(
    (id: string) => {
      applyBoardObjectsUpdate(
        (currentObjects) => removeBoardObjectById(currentObjects, id),
        (currentObjects) => getRemoveBoardObjectSyncOptions(currentObjects, id)
      );
    },
    [applyBoardObjectsUpdate]
  );

  const receiveSharedTokens = useCallback((sharedTokens: BoardObject[]) => {
    setObjects((currentObjects) => [
      ...currentObjects.filter((object) => object.kind !== "token"),
      ...sharedTokens,
    ]);
  }, []);

  const receiveSharedImages = useCallback(
    (
      sharedImages: BoardObject[],
      resolveSharedImage?: SharedImageMergeResolver
    ) => {
      setObjects((currentObjects) => {
        const localImages = currentObjects.filter(
          (object) => object.kind === "image"
        );

        return [
          ...currentObjects.filter((object) => object.kind !== "image"),
          ...sharedImages.map((sharedImage) => {
            const localImage =
              localImages.find((object) => object.id === sharedImage.id) ?? null;

            return resolveSharedImage
              ? resolveSharedImage(sharedImage, localImage)
              : sharedImage;
          }),
        ];
      });
    },
    []
  );

  const receiveSharedTextCards = useCallback((sharedTextCards: BoardObject[]) => {
    setObjects((currentObjects) => [
      ...currentObjects.filter((object) => !isNoteCardObject(object)),
      ...sharedTextCards,
    ]);
  }, []);

  const attachTokenConnection = useCallback((connection: RoomTokenConnection) => {
    roomTokenConnectionRef.current = connection;
  }, []);

  const detachTokenConnection = useCallback((connection: RoomTokenConnection) => {
    if (roomTokenConnectionRef.current === connection) {
      roomTokenConnectionRef.current = null;
    }
  }, []);

  const attachImageConnection = useCallback((connection: RoomImageConnection) => {
    roomImageConnectionRef.current = connection;
  }, []);

  const detachImageConnection = useCallback((connection: RoomImageConnection) => {
    if (roomImageConnectionRef.current === connection) {
      roomImageConnectionRef.current = null;
    }
  }, []);

  const attachTextCardConnection = useCallback(
    (connection: RoomTextCardConnection) => {
      roomTextCardConnectionRef.current = connection;
    },
    []
  );

  const detachTextCardConnection = useCallback(
    (connection: RoomTextCardConnection) => {
      if (roomTextCardConnectionRef.current === connection) {
        roomTextCardConnectionRef.current = null;
      }
    },
    []
  );

  const syncCurrentImage = useCallback((imageId: string) => {
    setObjects((currentObjects) => {
      const image = currentObjects.find(
        (object) => object.id === imageId && object.kind === "image"
      );

      if (image) {
        roomImageConnectionRef.current?.upsertImages([image]);
      }

      return currentObjects;
    });
  }, []);

  const setActiveTokenMove = useCallback((move: ActiveObjectMove | null) => {
    roomTokenConnectionRef.current?.setActiveMove(move);
  }, []);

  const setActiveImageDrawingLock = useCallback(
    (lock: ImageDrawingLock | null) => {
      roomImageConnectionRef.current?.setActiveDrawingImage(lock);
    },
    []
  );

  const updateImagePositionPreview = useCallback(
    (
      imageId: string,
      x: number,
      y: number,
      participantColor?: string
    ) => {
      roomImageConnectionRef.current?.updateImagePosition(
        imageId,
        x,
        y,
        participantColor
      );
    },
    []
  );

  const updateImagePreviewBounds = useCallback(
    (
      imageId: string,
      bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
        participantColor?: string;
      }
    ) => {
      roomImageConnectionRef.current?.updateImagePreviewBounds(imageId, bounds);
    },
    []
  );

  const setActiveTextCardEditingState = useCallback(
    (editingPresence: TextCardEditingPresence | null) => {
      roomTextCardConnectionRef.current?.setActiveEditingTextCard(editingPresence);
    },
    []
  );

  const setActiveTextCardResizeState = useCallback(
    (resizePresence: TextCardResizePresence | null) => {
      roomTextCardConnectionRef.current?.setActiveResizingTextCard(
        resizePresence
      );
    },
    []
  );

  return {
    objects,
    commands: {
      addBoardObject,
      applyBoardObjectsUpdate,
      removeBoardObject,
      replaceBoardObjects,
      updateBoardObject,
    },
    sync: {
      attachImageConnection,
      attachTextCardConnection,
      attachTokenConnection,
      detachImageConnection,
      detachTextCardConnection,
      detachTokenConnection,
      receiveSharedImages,
      receiveSharedTextCards,
      receiveSharedTokens,
      setActiveImageDrawingLock,
      setActiveTextCardEditingState,
      setActiveTextCardResizeState,
      setActiveTokenMove,
      syncCurrentImage,
      updateImagePositionPreview,
      updateImagePreviewBounds,
    },
  };
}
