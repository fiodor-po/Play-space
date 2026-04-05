import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type { BoardObject } from "../types/board";

export type RoomImageConnection = {
  destroy: () => void;
  replaceImages: (images: BoardObject[]) => void;
  upsertImages: (images: BoardObject[]) => void;
  removeImages: (imageIds: string[]) => void;
  seedImages: (images: BoardObject[]) => void;
};

export function createRoomImageConnection(params: {
  roomId: string;
  onImagesChange: (images: BoardObject[]) => void;
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
  let hasInitialSync = false;
  let pendingSeedImages: BoardObject[] | null = null;

  const publishImages = () => {
    params.onImagesChange(getImagesFromMap(imageMap));
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
  provider.on("status", handleStatus);
  provider.on("sync", handleSync);
  publishImages();

  return {
    destroy: () => {
      imageMap.unobserve(publishImages);
      provider.off("status", handleStatus);
      provider.off("sync", handleSync);
      provider.destroy();
      doc.destroy();
    },
    replaceImages: (images) => {
      const nextImages = images.filter((image) => image.kind === "image");
      const nextImageIds = new Set(nextImages.map((image) => image.id));

      imageMap.forEach((_, imageId) => {
        if (!nextImageIds.has(imageId)) {
          imageMap.delete(imageId);
        }
      });

      nextImages.forEach((image) => {
        imageMap.set(image.id, JSON.stringify(toSharedImage(image)));
      });
    },
    upsertImages: (images) => {
      images
        .filter((image) => image.kind === "image")
        .forEach((image) => {
          imageMap.set(image.id, JSON.stringify(toSharedImage(image)));
        });
    },
    removeImages: (imageIds) => {
      imageIds.forEach((imageId) => {
        imageMap.delete(imageId);
      });
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

function toSharedImage(image: BoardObject): BoardObject {
  const { imageStrokes, ...sharedImage } = image;
  return sharedImage;
}

function getDefaultRealtimeWsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:1234`;
}
