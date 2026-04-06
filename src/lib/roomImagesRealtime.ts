import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type { BoardObject } from "../types/board";

export type ImageDrawingLock = {
  imageId: string;
  participantId: string;
  participantName: string;
  participantColor: string;
};

export type RoomImageConnection = {
  destroy: () => void;
  replaceImages: (images: BoardObject[]) => void;
  upsertImages: (images: BoardObject[]) => void;
  updateImagePosition: (imageId: string, x: number, y: number) => void;
  updateImagePreviewBounds: (
    imageId: string,
    bounds: { x: number; y: number; width: number; height: number }
  ) => void;
  setActiveDrawingImage: (lock: ImageDrawingLock | null) => void;
  removeImages: (imageIds: string[]) => void;
  seedImages: (images: BoardObject[]) => void;
};

export function createRoomImageConnection(params: {
  roomId: string;
  onImagesChange: (images: BoardObject[]) => void;
  onImagePreviewPositionsChange?: (
    previewPositions: Record<
      string,
      { x: number; y: number; width?: number; height?: number }
    >
  ) => void;
  onImageDrawingLocksChange?: (
    drawingLocks: Record<string, ImageDrawingLock>
  ) => void;
  serverUrl?: string;
}): RoomImageConnection {
  const doc = new Y.Doc();
  const serverUrl =
    params.serverUrl ??
    import.meta.env.VITE_Y_WEBSOCKET_URL ??
    getDefaultRealtimeWsUrl();
  const provider = new WebsocketProvider(
    serverUrl,
    `play-space-alpha-images:${params.roomId}`,
    doc
  );
  const imageMap = doc.getMap<string>("images");
  const imagePositionMap = doc.getMap<string>("image-positions");
  let hasInitialSync = false;
  let pendingSeedImages: BoardObject[] | null = null;
  let pendingFrameId: number | null = null;
  const queuedUpserts = new Map<string, BoardObject>();
  const queuedRemovals = new Set<string>();
  const queuedPositionUpdates = new Map<
    string,
    { x: number; y: number; width?: number; height?: number }
  >();

  const publishImages = () => {
    params.onImagesChange(getImagesFromMap(imageMap));
  };

  const publishImagePreviewPositions = () => {
    params.onImagePreviewPositionsChange?.(
      getImagePreviewPositionsFromMap(imagePositionMap)
    );
  };

  const publishImageDrawingLocks = () => {
    params.onImageDrawingLocksChange?.(
      getImageDrawingLocksFromAwareness(provider.awareness.getStates())
    );
  };

  const flushQueuedUpdates = () => {
    pendingFrameId = null;

    queuedRemovals.forEach((imageId) => {
      imageMap.delete(imageId);
    });
    queuedRemovals.clear();

    queuedUpserts.forEach((image, imageId) => {
      imageMap.set(imageId, JSON.stringify(toSharedImage(image)));
      imagePositionMap.delete(imageId);
    });
    queuedUpserts.clear();

    queuedPositionUpdates.forEach((position, imageId) => {
      imagePositionMap.set(imageId, JSON.stringify(position));
    });
    queuedPositionUpdates.clear();
  };

  const scheduleFlush = () => {
    if (pendingFrameId !== null) {
      return;
    }

    pendingFrameId = window.requestAnimationFrame(flushQueuedUpdates);
  };

  const handleStatus = (event: {
    status: "connected" | "connecting" | "disconnected";
  }) => {
    if (import.meta.env.DEV) {
      console.info("[images]", serverUrl, event.status);
    }
  };

  const handleSync = (isSynced: boolean) => {
    if (!isSynced) {
      return;
    }

    hasInitialSync = true;

    if (pendingSeedImages && imageMap.size === 0) {
      pendingSeedImages.forEach((image) => {
        imageMap.set(image.id, JSON.stringify(toSharedImage(image)));
      });
    }

    pendingSeedImages = null;
    publishImages();
  };

  imageMap.observe(publishImages);
  imagePositionMap.observe(publishImagePreviewPositions);
  provider.on("status", handleStatus);
  provider.on("sync", handleSync);
  provider.awareness.on("change", publishImageDrawingLocks);
  publishImages();
  publishImagePreviewPositions();
  publishImageDrawingLocks();

  return {
    destroy: () => {
      provider.awareness.setLocalStateField("imageDrawing", null);

      if (pendingFrameId !== null) {
        window.cancelAnimationFrame(pendingFrameId);
        flushQueuedUpdates();
      }

      imageMap.unobserve(publishImages);
      imagePositionMap.unobserve(publishImagePreviewPositions);
      provider.off("status", handleStatus);
      provider.off("sync", handleSync);
      provider.awareness.off("change", publishImageDrawingLocks);
      provider.destroy();
      doc.destroy();
    },
    replaceImages: (images) => {
      const nextImages = images.filter((image) => image.kind === "image");
      const nextImageIds = new Set(nextImages.map((image) => image.id));

      imageMap.forEach((_, imageId) => {
        if (!nextImageIds.has(imageId)) {
          queuedUpserts.delete(imageId);
          queuedPositionUpdates.delete(imageId);
          queuedRemovals.add(imageId);
        }
      });

      nextImages.forEach((image) => {
        queuedRemovals.delete(image.id);
        queuedPositionUpdates.delete(image.id);
        queuedUpserts.set(image.id, image);
      });
      scheduleFlush();
    },
    upsertImages: (images) => {
      images
        .filter((image) => image.kind === "image")
        .forEach((image) => {
          queuedRemovals.delete(image.id);
          queuedPositionUpdates.delete(image.id);
          queuedUpserts.set(image.id, image);
        });
      scheduleFlush();
    },
    updateImagePosition: (imageId, x, y) => {
      queuedRemovals.delete(imageId);
      queuedPositionUpdates.set(imageId, { x, y });
      scheduleFlush();
    },
    updateImagePreviewBounds: (imageId, bounds) => {
      queuedRemovals.delete(imageId);
      queuedPositionUpdates.set(imageId, bounds);
      scheduleFlush();
    },
    setActiveDrawingImage: (lock) => {
      provider.awareness.setLocalStateField("imageDrawing", lock);
    },
    removeImages: (imageIds) => {
      imageIds.forEach((imageId) => {
        queuedUpserts.delete(imageId);
        queuedPositionUpdates.delete(imageId);
        queuedRemovals.add(imageId);
      });
      scheduleFlush();
    },
    seedImages: (images) => {
      const nextSeedImages = images.filter((image) => image.kind === "image");

      if (nextSeedImages.length === 0) {
        return;
      }

      if (!hasInitialSync) {
        pendingSeedImages = nextSeedImages;
        return;
      }

      if (imageMap.size > 0) {
        return;
      }

      nextSeedImages.forEach((image) => {
        imageMap.set(image.id, JSON.stringify(toSharedImage(image)));
      });
    },
  };
}

function getImagesFromMap(imageMap: Y.Map<string>) {
  const images: BoardObject[] = [];

  imageMap.forEach((value) => {
    try {
      const image = JSON.parse(value) as BoardObject;

      if (image.kind === "image") {
        images.push(image);
      }
    } catch {
      return;
    }
  });

  return images;
}

function getImagePreviewPositionsFromMap(imagePositionMap: Y.Map<string>) {
  const previewPositions: Record<
    string,
    { x: number; y: number; width?: number; height?: number }
  > = {};

  imagePositionMap.forEach((value, imageId) => {
    try {
      const position = JSON.parse(value) as {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      };

      previewPositions[imageId] = {
        x: position.x ?? 0,
        y: position.y ?? 0,
        width: position.width,
        height: position.height,
      };
    } catch {
      return;
    }
  });

  return previewPositions;
}

function getImageDrawingLocksFromAwareness(
  awarenessStates: Map<number, Record<string, unknown>>
) {
  const drawingLocks: Record<string, ImageDrawingLock> = {};

  awarenessStates.forEach((state) => {
    const imageDrawing = state.imageDrawing;

    if (!imageDrawing || typeof imageDrawing !== "object") {
      return;
    }

    const lock = imageDrawing as Partial<ImageDrawingLock>;

    if (
      !lock.imageId ||
      !lock.participantId ||
      !lock.participantName ||
      !lock.participantColor
    ) {
      return;
    }

    drawingLocks[lock.imageId] = {
      imageId: lock.imageId,
      participantId: lock.participantId,
      participantName: lock.participantName,
      participantColor: lock.participantColor,
    };
  });

  return drawingLocks;
}

function toSharedImage(image: BoardObject): BoardObject {
  return image;
}

function getDefaultRealtimeWsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:1234`;
}
