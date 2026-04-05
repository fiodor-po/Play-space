import { useEffect, useMemo, useRef, useState } from "react";
import {
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import { initialObjects } from "../data/initialBoard";
import {
  appendImageStrokePointInObjects,
  clearImageStrokesInObjects,
  createImageObject,
  DEFAULT_IMAGE_STROKE_WIDTH,
  getImageStorageScale,
  getInitialImageDisplaySize,
} from "../lib/boardImage";
import {
  updateBoardObjectById,
  removeBoardObjectById,
  updateBoardObjectLabel,
  updateBoardObjectPosition,
} from "../lib/boardObjects";
import {
  clearBoardStorage,
  loadBoardObjects,
  loadRoomImageObjects,
  loadRoomTextCardObjects,
  loadRoomTokenObjects,
  loadViewportState,
  saveBoardObjects,
  saveRoomImageObject,
  saveRoomImageObjects,
  removeRoomImageObject,
  saveRoomTextCardObjects,
  saveRoomTokenObjects,
  saveViewportState,
  subscribeToRoomImageObjects,
  subscribeToRoomTextCardObjects,
  subscribeToRoomTokenObjects,
} from "../lib/storage";
import {
  PARTICIPANT_COLOR_OPTIONS,
  type LocalParticipantSession,
  type ParticipantPresence,
  type ParticipantPresenceMap,
} from "../lib/roomSession";
import type { BoardObject, BoardObjectKind } from "../types/board";

const BOARD_WIDTH = 4000;
const BOARD_HEIGHT = 3000;
const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;
const SCALE_BY = 1.05;
const TEXT_CARD_HEADER_HEIGHT = 36;
const NOTE_HANDLE_SIZE = 18;
const TEXT_CARD_BODY_INSET_X = 16;
const TEXT_CARD_BODY_INSET_Y = 16;
const TEXT_CARD_BODY_FONT_SIZE = 22;
const TEXT_CARD_BODY_LINE_HEIGHT = 1.2;
const TEXT_CARD_BODY_FONT_FAMILY = "Arial, sans-serif";
const MIN_IMAGE_SIZE = 80;
const MAX_UPLOADED_IMAGE_SOURCE_DIMENSION = 1600;
const MAX_INITIAL_IMAGE_DISPLAY_WIDTH = 360;
const MAX_INITIAL_IMAGE_DISPLAY_HEIGHT = 240;
const HTML_UI_FONT_FAMILY =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const objectLayerOrder: Record<BoardObjectKind, number> = {
  image: 0,
  "text-card": 1,
  token: 2,
};

function getDefaultViewport(width: number, height: number) {
  return {
    x: width / 2 - BOARD_WIDTH / 2,
    y: height / 2 - BOARD_HEIGHT / 2,
    scale: 1,
  };
}

type BoardStageProps = {
  participantSession: LocalParticipantSession;
  participantPresences: ParticipantPresenceMap;
  roomId: string;
  onUpdateParticipantSession: (
    updater: (session: LocalParticipantSession) => LocalParticipantSession
  ) => void;
  onUpdateLocalPresence: (
    updater: (presence: ParticipantPresence | null) => ParticipantPresence | null
  ) => void;
};

export default function BoardStage({
  participantSession,
  participantPresences,
  roomId,
  onUpdateParticipantSession,
  onUpdateLocalPresence,
}: BoardStageProps) {
  const mergeSharedImages = (sharedImages: BoardObject[]) => {
    return sharedImages;
  };

  const getRoomScopedObjects = (nextRoomId: string) => {
    const localObjects = loadBoardObjects(nextRoomId, initialObjects);
    const sharedTokens = loadRoomTokenObjects(nextRoomId, localObjects);
    const sharedImages = loadRoomImageObjects(nextRoomId, localObjects);
    const sharedTextCards = loadRoomTextCardObjects(nextRoomId, localObjects);

    return [
      ...localObjects.filter(
        (object) =>
          object.kind !== "token" &&
          object.kind !== "image" &&
          object.kind !== "text-card"
      ),
      ...mergeSharedImages(sharedImages),
      ...sharedTextCards,
      ...sharedTokens,
    ];
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const sessionPanelRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [stagePosition, setStagePosition] = useState(() => {
    const savedViewport = loadViewportState(roomId);
    const defaultViewport = getDefaultViewport(
      window.innerWidth,
      window.innerHeight
    );

    const hasSavedViewport =
      savedViewport.x !== 120 ||
      savedViewport.y !== 80 ||
      savedViewport.scale !== 1;

    if (!hasSavedViewport) {
      return { x: defaultViewport.x, y: defaultViewport.y };
    }

    return { x: savedViewport.x, y: savedViewport.y };
  });

  const [stageScale, setStageScale] = useState(() => {
    const savedViewport = loadViewportState(roomId);
    const defaultViewport = getDefaultViewport(
      window.innerWidth,
      window.innerHeight
    );

    const hasSavedViewport =
      savedViewport.x !== 120 ||
      savedViewport.y !== 80 ||
      savedViewport.scale !== 1;

    if (!hasSavedViewport) {
      return defaultViewport.scale;
    }

    return savedViewport.scale;
  });

  const [objects, setObjects] = useState<BoardObject[]>(() =>
    getRoomScopedObjects(roomId)
  );

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [editingTextCardId, setEditingTextCardId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [editingOriginal, setEditingOriginal] = useState("");
  const [transformingImageId, setTransformingImageId] = useState<string | null>(
    null
  );
  const [drawingImageId, setDrawingImageId] = useState<string | null>(null);
  const [isEditingParticipantName, setIsEditingParticipantName] = useState(false);
  const [participantNameDraft, setParticipantNameDraft] = useState(
    participantSession.name
  );
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const currentUserColor = participantSession.color;

  const textCardRefs = useRef<Record<string, Konva.Group | null>>({});
  const imageRefs = useRef<Record<string, Konva.Image | null>>({});
  const imageStrokeLayerRefs = useRef<Record<string, Konva.Group | null>>({});
  const imageTransformerRef = useRef<Konva.Transformer | null>(null);
  const boardBackgroundRef = useRef<Konva.Rect | null>(null);
  const panStateRef = useRef<{
    isPanning: boolean;
    startPointerX: number;
    startPointerY: number;
    startStageX: number;
    startStageY: number;
  } | null>(null);
  const ignoreNextBlurRef = useRef(false);
  const activeImageStrokeRef = useRef<{
    imageId: string;
    strokeIndex: number;
  } | null>(null);
  const transformingImageSnapshotRef = useRef<Record<string, BoardObject>>({});
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>(
    {}
  );

  const applyBoardObjectsUpdate = (
    updater: (currentObjects: BoardObject[]) => BoardObject[],
    options?: {
      syncSharedTokens?: boolean;
      syncSharedImages?: boolean;
      syncSharedImageIds?: string[];
      removeSharedImageIds?: string[];
      syncSharedTextCards?: boolean;
    }
  ) => {
    setObjects((currentObjects) => {
      const nextObjects = updater(currentObjects);

      if (options?.syncSharedTokens) {
        saveRoomTokenObjects(roomId, nextObjects);
      }

      if (options?.syncSharedImages) {
        saveRoomImageObjects(roomId, nextObjects);
      }

      options?.syncSharedImageIds?.forEach((imageId) => {
        const image = nextObjects.find(
          (object) => object.id === imageId && object.kind === "image"
        );

        if (image) {
          saveRoomImageObject(roomId, image);
        }
      });

      options?.removeSharedImageIds?.forEach((imageId) => {
        removeRoomImageObject(roomId, imageId);
      });

      if (options?.syncSharedTextCards) {
        saveRoomTextCardObjects(roomId, nextObjects);
      }

      return nextObjects;
    });
  };

  const replaceBoardObjects = (
    nextObjects: BoardObject[],
    options?: {
      syncSharedTokens?: boolean;
      syncSharedImages?: boolean;
      syncSharedTextCards?: boolean;
    }
  ) => {
    setObjects(nextObjects);

    if (options?.syncSharedTokens) {
      saveRoomTokenObjects(roomId, nextObjects);
    }

    if (options?.syncSharedImages) {
      saveRoomImageObjects(roomId, nextObjects);
    }

    if (options?.syncSharedTextCards) {
      saveRoomTextCardObjects(roomId, nextObjects);
    }
  };

  const addBoardObject = (object: BoardObject) => {
    applyBoardObjectsUpdate((currentObjects) => [...currentObjects, object], {
      syncSharedTokens: object.kind === "token",
      syncSharedImageIds: object.kind === "image" ? [object.id] : undefined,
      syncSharedTextCards: object.kind === "text-card",
    });
  };

  const updateBoardObject = (
    id: string,
    updater: (object: BoardObject) => BoardObject
  ) => {
    applyBoardObjectsUpdate((currentObjects) =>
      updateBoardObjectById(currentObjects, id, updater)
    );
  };

  const removeBoardObject = (id: string) => {
    applyBoardObjectsUpdate(
      (currentObjects) => removeBoardObjectById(currentObjects, id),
      {
        syncSharedTokens: objects.some(
          (object) => object.id === id && object.kind === "token"
        ),
        removeSharedImageIds: objects.some(
          (object) => object.id === id && object.kind === "image"
        )
          ? [id]
          : undefined,
        syncSharedTextCards: objects.some(
          (object) => object.id === id && object.kind === "text-card"
        ),
      }
    );
  };

  const clearImageDrawing = (id: string) => {
    applyBoardObjectsUpdate(
      (currentObjects) => clearImageStrokesInObjects(currentObjects, id),
      { syncSharedImageIds: [id] }
    );
  };

  const startImageStroke = (
    id: string,
    point: { x: number; y: number },
    color: string
  ) => {
    updateBoardObject(id, (object) => {
      if (object.kind !== "image") {
        return object;
      }

      const imageStrokes = object.imageStrokes ?? [];

      activeImageStrokeRef.current = {
        imageId: id,
        strokeIndex: imageStrokes.length,
      };

      return {
        ...object,
        imageStrokes: [
          ...imageStrokes,
          {
            color,
            points: [point.x, point.y],
            width: DEFAULT_IMAGE_STROKE_WIDTH,
          },
        ],
      };
    });
  };

  const resizeImageObject = (
    id: string,
    nextBounds: { x: number; y: number; width: number; height: number },
    scale: { x: number; y: number },
    strokeWidthScale: number
  ) => {
    applyBoardObjectsUpdate(
      (currentObjects) =>
        updateBoardObjectById(currentObjects, id, (object) => {
          if (object.kind !== "image") {
            return object;
          }

          return {
            ...object,
            x: nextBounds.x,
            y: nextBounds.y,
            width: nextBounds.width,
            height: nextBounds.height,
            imageStrokes: (object.imageStrokes ?? []).map((stroke) => ({
              ...stroke,
              points: stroke.points.map((point, index) =>
                index % 2 === 0 ? point * scale.x : point * scale.y
              ),
              width:
                (stroke.width ?? DEFAULT_IMAGE_STROKE_WIDTH) * strokeWidthScale,
            })),
          };
        }),
      { syncSharedImageIds: [id] }
    );
  };

  const publishImageTransformPreview = (node: Konva.Image, snapshot: BoardObject) => {
    if (snapshot.kind !== "image") {
      return;
    }

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const strokeWidthScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;

    saveRoomImageObject(roomId, {
      ...snapshot,
      x: node.x(),
      y: node.y(),
      width: Math.max(snapshot.width * scaleX, MIN_IMAGE_SIZE),
      height: Math.max(snapshot.height * scaleY, MIN_IMAGE_SIZE),
      imageStrokes: (snapshot.imageStrokes ?? []).map((stroke) => ({
        ...stroke,
        points: stroke.points.map((point, index) =>
          index % 2 === 0 ? point * scaleX : point * scaleY
        ),
        width:
          (stroke.width ?? DEFAULT_IMAGE_STROKE_WIDTH) * strokeWidthScale,
      })),
    });
  };

  useEffect(() => {
    const savedViewport = loadViewportState(roomId);
    const defaultViewport = getDefaultViewport(
      window.innerWidth,
      window.innerHeight
    );
    const hasSavedViewport =
      savedViewport.x !== 120 ||
      savedViewport.y !== 80 ||
      savedViewport.scale !== 1;

    replaceBoardObjects(getRoomScopedObjects(roomId));
    setStagePosition(
      hasSavedViewport
        ? { x: savedViewport.x, y: savedViewport.y }
        : { x: defaultViewport.x, y: defaultViewport.y }
    );
    setStageScale(hasSavedViewport ? savedViewport.scale : defaultViewport.scale);
    setSelectedObjectId(null);
    setEditingTextCardId(null);
    setEditingDraft("");
    setEditingOriginal("");
    setDrawingImageId(null);
    setTransformingImageId(null);
    panStateRef.current = null;
  }, [roomId]);

  useEffect(() => {
    setParticipantNameDraft(participantSession.name);
  }, [participantSession.name]);

  useEffect(() => {
    if (!isEditingParticipantName && !isColorPickerOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (sessionPanelRef.current?.contains(event.target as Node)) {
        return;
      }

      if (isEditingParticipantName) {
        const trimmedName = participantNameDraft.trim();

        if (trimmedName && trimmedName !== participantSession.name) {
          onUpdateParticipantSession((session) => ({
            ...session,
            name: trimmedName,
          }));
        }

        setParticipantNameDraft(trimmedName || participantSession.name);
        setIsEditingParticipantName(false);
      }

      if (isColorPickerOpen) {
        setIsColorPickerOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("touchstart", handlePointerDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("touchstart", handlePointerDown);
    };
  }, [
    isEditingParticipantName,
    isColorPickerOpen,
    onUpdateParticipantSession,
    participantNameDraft,
    participantSession.name,
  ]);

  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    saveBoardObjects(roomId, objects);
  }, [objects, roomId]);

  useEffect(() => {
    const unsubscribe = subscribeToRoomTokenObjects(roomId, (sharedTokens) => {
      setObjects((currentObjects) => [
        ...currentObjects.filter((object) => object.kind !== "token"),
        ...sharedTokens,
      ]);
    });

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    const unsubscribe = subscribeToRoomImageObjects(roomId, (sharedImages) => {
      setObjects((currentObjects) => [
        ...currentObjects.filter((object) => object.kind !== "image"),
        ...mergeSharedImages(sharedImages),
      ]);
    });

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    const unsubscribe = subscribeToRoomTextCardObjects(roomId, (sharedTextCards) => {
      setObjects((currentObjects) => [
        ...currentObjects.filter((object) => object.kind !== "text-card"),
        ...sharedTextCards,
      ]);
    });

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    objects.forEach((object) => {
      if (object.kind !== "image" || !object.src || loadedImages[object.src]) {
        return;
      }

      const image = new window.Image();

      image.onload = () => {
        setLoadedImages((current) => {
          if (current[object.src!]) {
            return current;
          }

          return { ...current, [object.src!]: image };
        });
      };

      image.src = object.src;
    });
  }, [loadedImages, objects]);

  useEffect(() => {
    saveViewportState(roomId, {
      x: stagePosition.x,
      y: stagePosition.y,
      scale: stageScale,
    });
  }, [roomId, stagePosition, stageScale]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditableTarget =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      const isEnterKey = event.key === "Enter";
      const isBackspaceKey = event.key === "Backspace";
      const isEscapeKey = event.key === "Escape";
      const isDeleteKey = event.key === "Backspace" || event.key === "Delete";

      if (isEnterKey && drawingImageId) {
        event.preventDefault();
        endImageStroke();
        setDrawingImageId(null);
        return;
      }

      if (isBackspaceKey && drawingImageId) {
        event.preventDefault();
        endImageStroke();
        clearImageDrawing(drawingImageId);
        return;
      }

      if (isEscapeKey && !editingTextCardId && selectedObjectId) {
        event.preventDefault();
        setSelectedObjectId(null);
        return;
      }

      if (
        !isDeleteKey ||
        !selectedObjectId ||
        editingTextCardId ||
        isEditableTarget
      ) {
        return;
      }

      event.preventDefault();

      removeBoardObject(selectedObjectId);
      setSelectedObjectId(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawingImageId, editingTextCardId, selectedObjectId]);

  const sortedObjects = useMemo(() => {
    return [...objects].sort(
      (a, b) => objectLayerOrder[a.kind] - objectLayerOrder[b.kind]
    );
  }, [objects]);

  const updateObjectPosition = (id: string, x: number, y: number) => {
    applyBoardObjectsUpdate(
      (currentObjects) => updateBoardObjectPosition(currentObjects, id, x, y),
      {
        syncSharedTokens: objects.some(
          (object) => object.id === id && object.kind === "token"
        ),
        syncSharedImageIds: objects.some(
          (object) => object.id === id && object.kind === "image"
        )
          ? [id]
          : undefined,
        syncSharedTextCards: objects.some(
          (object) => object.id === id && object.kind === "text-card"
        ),
      }
    );
  };

  const updateObjectLabel = (id: string, label: string) => {
    applyBoardObjectsUpdate(
      (currentObjects) => updateBoardObjectLabel(currentObjects, id, label),
      {
        syncSharedTextCards: objects.some(
          (object) => object.id === id && object.kind === "text-card"
        ),
      }
    );
  };

  const appendStrokePoint = (imageId: string, point: { x: number; y: number }) => {
    const activeStroke = activeImageStrokeRef.current;

    if (!activeStroke || activeStroke.imageId !== imageId) {
      return;
    }

    applyBoardObjectsUpdate((currentObjects) =>
      appendImageStrokePointInObjects(
        currentObjects,
        imageId,
        activeStroke.strokeIndex,
        point
      )
    );
  };

  const endImageStroke = () => {
    const activeStroke = activeImageStrokeRef.current;

    if (activeStroke) {
      setObjects((currentObjects) => {
        const image = currentObjects.find(
          (object) =>
            object.id === activeStroke.imageId && object.kind === "image"
        );

        if (image) {
          saveRoomImageObject(roomId, image);
        }

        return currentObjects;
      });
    }

    activeImageStrokeRef.current = null;
  };

  const syncImageStrokeLayerPosition = (id: string, x: number, y: number) => {
    const strokeLayer = imageStrokeLayerRefs.current[id];

    if (!strokeLayer) {
      return;
    }

    strokeLayer.position({ x, y });
    strokeLayer.getLayer()?.batchDraw();
  };

  const syncImageStrokeLayerTransform = (
    id: string,
    x: number,
    y: number,
    scaleX: number,
    scaleY: number
  ) => {
    const strokeLayer = imageStrokeLayerRefs.current[id];

    if (!strokeLayer) {
      return;
    }

    strokeLayer.position({ x, y });
    strokeLayer.scale({ x: scaleX, y: scaleY });
    strokeLayer.getLayer()?.batchDraw();
  };

  const getViewportCenterInBoardCoords = () => {
    const centerScreenX = stageSize.width / 2;
    const centerScreenY = stageSize.height / 2;

    return {
      x: (centerScreenX - stagePosition.x) / stageScale,
      y: (centerScreenY - stagePosition.y) / stageScale,
    };
  };

  const createToken = () => {
    const center = getViewportCenterInBoardCoords();

    const newToken: BoardObject = {
      id: `token-${crypto.randomUUID()}`,
      kind: "token",
      x: center.x - 70,
      y: center.y - 70,
      width: 140,
      height: 140,
      fill: currentUserColor,
      label: "New Token",
      authorColor: currentUserColor,
      textColor: "#f8fafc",
    };

    addBoardObject(newToken);
    setSelectedObjectId(newToken.id);
  };

  const createNote = () => {
    const center = getViewportCenterInBoardCoords();

    const newNote: BoardObject = {
      id: `note-${crypto.randomUUID()}`,
      kind: "text-card",
      x: center.x - 130,
      y: center.y - 90,
      width: 260,
      height: 180,
      fill: "#f8fafc",
      label: "New note",
      authorColor: currentUserColor,
      textColor: "#0f172a",
    };

    addBoardObject(newNote);
    setSelectedObjectId(newNote.id);
  };

  const createImageFromFile = (
    file: File,
    position?: { x: number; y: number }
  ) => {
    const reader = new FileReader();

    reader.onload = () => {
      const originalSrc = reader.result;

      if (typeof originalSrc !== "string") {
        return;
      }

      const image = new window.Image();

      image.onload = () => {
        const spawnPosition = position ?? getViewportCenterInBoardCoords();
        const { width, height } = getInitialImageDisplaySize(
          image.naturalWidth,
          image.naturalHeight,
          {
            maxWidth: MAX_INITIAL_IMAGE_DISPLAY_WIDTH,
            maxHeight: MAX_INITIAL_IMAGE_DISPLAY_HEIGHT,
            minSize: MIN_IMAGE_SIZE,
          }
        );
        const storageScale = getImageStorageScale(
          image.naturalWidth,
          image.naturalHeight,
          MAX_UPLOADED_IMAGE_SOURCE_DIMENSION
        );
        let src = originalSrc;

        if (storageScale < 1) {
          const canvas = document.createElement("canvas");

          canvas.width = Math.max(Math.round(image.naturalWidth * storageScale), 1);
          canvas.height = Math.max(Math.round(image.naturalHeight * storageScale), 1);

          const context = canvas.getContext("2d");

          if (context) {
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            src =
              file.type === "image/png"
                ? canvas.toDataURL("image/png")
                : canvas.toDataURL("image/jpeg", 0.9);
          }
        }

        setLoadedImages((current) => ({ ...current, [src]: image }));

        const newImage: BoardObject = createImageObject({
          id: `image-${crypto.randomUUID()}`,
          label: file.name,
          authorColor: currentUserColor,
          src,
          position: spawnPosition,
          size: { width, height },
        });

        addBoardObject(newImage);
        setSelectedObjectId(newImage.id);
      };

      image.src = originalSrc;
    };

    reader.readAsDataURL(file);
  };

  const resetBoard = () => {
    const defaultViewport = getDefaultViewport(
      window.innerWidth,
      window.innerHeight
    );

    replaceBoardObjects(initialObjects, {
      syncSharedTokens: true,
      syncSharedImages: true,
      syncSharedTextCards: true,
    });
    setStagePosition({ x: defaultViewport.x, y: defaultViewport.y });
    setStageScale(defaultViewport.scale);
    setSelectedObjectId(null);
    clearBoardStorage(roomId);
  };

  const startDraggingTextCard = (id: string) => {
    const node = textCardRefs.current[id];

    if (!node) return;

    node.startDrag();
  };

  const startEditingTextCard = (object: BoardObject) => {
    setSelectedObjectId(object.id);
    setEditingTextCardId(object.id);
    setEditingDraft(object.label);
    setEditingOriginal(object.label);
    ignoreNextBlurRef.current = false;
  };

  const stopEditingTextCard = () => {
    setEditingTextCardId(null);
    setEditingDraft("");
    setEditingOriginal("");
    ignoreNextBlurRef.current = false;
  };

  const saveEditingTextCard = () => {
    if (!editingTextCardId) {
      return;
    }

    updateObjectLabel(editingTextCardId, editingDraft);
    stopEditingTextCard();
  };

  const cancelEditingTextCard = () => {
    if (!editingTextCardId) {
      return;
    }

    setEditingDraft(editingOriginal);
    stopEditingTextCard();
  };

  useEffect(() => {
    if (!editingTextCardId) {
      return;
    }

    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, [editingTextCardId]);

  useEffect(() => {
    const transformer = imageTransformerRef.current;

    if (!transformer) {
      return;
    }

    const selectedImageNode =
      selectedObjectId && !editingTextCardId && drawingImageId !== selectedObjectId
        ? imageRefs.current[selectedObjectId] ?? null
        : null;

    if (selectedImageNode) {
      transformer.nodes([selectedImageNode]);
    } else {
      transformer.nodes([]);
    }

    transformer.getLayer()?.batchDraw();
  }, [drawingImageId, editingTextCardId, objects, selectedObjectId]);

  useEffect(() => {
    if (drawingImageId && drawingImageId !== selectedObjectId) {
      setDrawingImageId(null);
      activeImageStrokeRef.current = null;
    }
  }, [drawingImageId, selectedObjectId]);

  const editingTextCard = editingTextCardId
    ? objects.find((object) => object.id === editingTextCardId && object.kind === "text-card") ?? null
    : null;

  const editingTextareaStyle = useMemo(() => {
    if (!editingTextCard) {
      return null;
    }

    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!containerRect) {
      return null;
    }

    const left =
      stagePosition.x +
      (editingTextCard.x + TEXT_CARD_BODY_INSET_X) * stageScale -
      containerRect.left;
    const top =
      stagePosition.y +
      (editingTextCard.y + TEXT_CARD_HEADER_HEIGHT + TEXT_CARD_BODY_INSET_Y) *
        stageScale -
      containerRect.top;
    const width = Math.max(
      (editingTextCard.width - TEXT_CARD_BODY_INSET_X * 2) * stageScale,
      40
    );
    const height = Math.max(
      (
        editingTextCard.height -
        TEXT_CARD_HEADER_HEIGHT -
        TEXT_CARD_BODY_INSET_Y * 2
      ) * stageScale,
      32
    );

    return {
      left,
      top,
      width,
      height,
      fontSize: TEXT_CARD_BODY_FONT_SIZE * stageScale,
      lineHeight: TEXT_CARD_BODY_LINE_HEIGHT,
      fontFamily: TEXT_CARD_BODY_FONT_FAMILY,
      color: editingTextCard.textColor ?? "#0f172a",
    };
  }, [editingTextCard, stagePosition.x, stagePosition.y, stageScale]);

  const updateLocalCursorPresence = (clientX: number, clientY: number) => {
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!containerRect) {
      return;
    }

    const cursor = {
      x: (clientX - containerRect.left - stagePosition.x) / stageScale,
      y: (clientY - containerRect.top - stagePosition.y) / stageScale,
    };

    onUpdateLocalPresence((presence) =>
      presence
        ? {
            ...presence,
            cursor,
            lastActiveAt: Date.now(),
          }
        : null
    );
  };

  const participantCursorScreenPositions = useMemo(() => {
    return Object.values(participantPresences)
      .filter((presence) => presence.cursor)
      .map((presence) => ({
        participantId: presence.participantId,
        left: stagePosition.x + presence.cursor!.x * stageScale,
        top: stagePosition.y + presence.cursor!.y * stageScale,
        name: presence.name || "Participant",
        color: presence.color,
      }));
  }, [participantPresences, stagePosition.x, stagePosition.y, stageScale]);

  const cursorOverlayStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    transform: "translate(-6px, -6px)",
    pointerEvents: "none" as const,
    zIndex: 12,
  };

  const cursorLabelStyle = {
    maxWidth: 140,
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
    whiteSpace: "nowrap" as const,
    padding: "3px 8px",
    borderRadius: 999,
    background: "rgba(15, 23, 42, 0.92)",
    color: "#f8fafc",
    boxShadow: "0 8px 24px rgba(2, 6, 23, 0.28)",
    fontFamily: HTML_UI_FONT_FAMILY,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.2,
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        margin: 0,
        overflow: "hidden",
        background: "#081226",
      }}
      onMouseMove={(event) => {
        updateLocalCursorPresence(event.clientX, event.clientY);
      }}
      onMouseLeave={() => {
        onUpdateLocalPresence((presence) =>
          presence
            ? {
                ...presence,
                cursor: null,
                lastActiveAt: Date.now(),
              }
            : null
        );
      }}
      onTouchMove={(event) => {
        const touch = event.touches[0];

        if (!touch) {
          return;
        }

        updateLocalCursorPresence(touch.clientX, touch.clientY);
      }}
      onTouchEnd={() => {
        onUpdateLocalPresence((presence) =>
          presence
            ? {
                ...presence,
                cursor: null,
                lastActiveAt: Date.now(),
              }
            : null
        );
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();

        const file = Array.from(event.dataTransfer.files).find((candidate) =>
          candidate.type.startsWith("image/")
        );

        if (!file) {
          return;
        }

        const containerRect = containerRef.current?.getBoundingClientRect();

        if (!containerRect) {
          createImageFromFile(file);
          return;
        }

        const boardPosition = {
          x: (event.clientX - containerRect.left - stagePosition.x) / stageScale,
          y: (event.clientY - containerRect.top - stagePosition.y) / stageScale,
        };

        createImageFromFile(file, boardPosition);
      }}
    >
      {participantCursorScreenPositions.map((cursor) => (
        <div
          key={cursor.participantId}
          style={{
            position: "fixed",
            left: cursor.left,
            top: cursor.top,
            ...cursorOverlayStyle,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: cursor.color,
              border: "2px solid rgba(255, 255, 255, 0.92)",
              boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.35)",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              ...cursorLabelStyle,
              border: `1px solid ${cursor.color}`,
            }}
            title={cursor.name}
          >
            {cursor.name}
          </div>
        </div>
      ))}

      <div
        ref={sessionPanelRef}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 10,
          display: "grid",
          gap: 8,
          minWidth: 180,
          padding: 12,
          borderRadius: 14,
          border: "1px solid rgba(148, 163, 184, 0.22)",
          background: "rgba(15, 23, 42, 0.88)",
          color: "#e2e8f0",
          boxShadow: "0 18px 50px rgba(2, 6, 23, 0.35)",
          backdropFilter: "blur(10px)",
          fontFamily: HTML_UI_FONT_FAMILY,
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "grid", gap: 2, pointerEvents: "none" }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{roomId}</div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsColorPickerOpen((current) => !current);
            }}
            aria-label="Edit participant color"
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: participantSession.color,
              border: "2px solid rgba(255, 255, 255, 0.85)",
              boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.4)",
              flexShrink: 0,
              padding: 0,
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          />

          {isEditingParticipantName ? (
            <input
              value={participantNameDraft}
              onChange={(event) => {
                setParticipantNameDraft(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") {
                  return;
                }

                event.preventDefault();
                const trimmedName = participantNameDraft.trim();

                if (trimmedName && trimmedName !== participantSession.name) {
                  onUpdateParticipantSession((session) => ({
                    ...session,
                    name: trimmedName,
                  }));
                }

                setParticipantNameDraft(trimmedName || participantSession.name);
                setIsEditingParticipantName(false);
              }}
              autoFocus
              style={{
                minWidth: 0,
                padding: 0,
                border: "none",
                outline: "none",
                background: "transparent",
                color: "#e2e8f0",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: HTML_UI_FONT_FAMILY,
                pointerEvents: "auto",
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setParticipantNameDraft(participantSession.name);
                setIsEditingParticipantName(true);
              }}
              style={{
                padding: 0,
                border: "none",
                background: "transparent",
                color: "#e2e8f0",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: HTML_UI_FONT_FAMILY,
                cursor: "text",
                pointerEvents: "auto",
              }}
            >
              {participantSession.name}
            </button>
          )}
        </div>

        {isColorPickerOpen && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              pointerEvents: "none",
            }}
          >
            {PARTICIPANT_COLOR_OPTIONS.map(
              (color) => {
                const isSelected = color === participantSession.color;

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      onUpdateParticipantSession((session) => ({
                        ...session,
                        color,
                      }));
                      setIsColorPickerOpen(false);
                    }}
                    aria-label={`Select color ${color}`}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 999,
                      border: isSelected
                        ? "2px solid #f8fafc"
                        : "1px solid rgba(255, 255, 255, 0.22)",
                      background: color,
                      padding: 0,
                      cursor: "pointer",
                      pointerEvents: "auto",
                    }}
                  />
                );
              }
            )}
          </div>
        )}
      </div>

      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 10,
          display: "flex",
          gap: 12,
        }}
      >
        <button
          onClick={createToken}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #4c1d95",
            background: "#6d28d9",
            color: "#f5f3ff",
            cursor: "pointer",
          }}
        >
          Add token
        </button>

        <button
          onClick={() => {
            imageInputRef.current?.click();
          }}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #0f766e",
            background: "#0f766e",
            color: "#ecfeff",
            cursor: "pointer",
          }}
        >
          Add image
        </button>

        <button
          onClick={createNote}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            background: "#f8fafc",
            color: "#0f172a",
            cursor: "pointer",
          }}
        >
          Add note
        </button>

        <button
          onClick={resetBoard}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #334155",
            background: "#0f172a",
            color: "#e2e8f0",
            cursor: "pointer",
          }}
        >
          Reset board
        </button>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            createImageFromFile(file);
          }

          event.target.value = "";
        }}
      />

      <Stage
        width={stageSize.width}
        height={stageSize.height}
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onMouseDown={(event) => {
          const stage = event.target.getStage();
          const pointer = stage?.getPointerPosition();
          const clickedOnEmptyStage =
            event.target === stage || event.target === boardBackgroundRef.current;

          if (clickedOnEmptyStage) {
            setSelectedObjectId(null);
          }

          if (!clickedOnEmptyStage || !pointer) {
            return;
          }

          panStateRef.current = {
            isPanning: true,
            startPointerX: pointer.x,
            startPointerY: pointer.y,
            startStageX: stagePosition.x,
            startStageY: stagePosition.y,
          };
        }}
        onMouseMove={(event) => {
          const pointer = event.target.getStage()?.getPointerPosition();
          const panState = panStateRef.current;

          if (!panState?.isPanning || !pointer) {
            return;
          }

          setStagePosition({
            x: panState.startStageX + (pointer.x - panState.startPointerX),
            y: panState.startStageY + (pointer.y - panState.startPointerY),
          });
        }}
        onMouseUp={() => {
          panStateRef.current = null;
          endImageStroke();
        }}
        onMouseLeave={() => {
          panStateRef.current = null;
          endImageStroke();
        }}
        onTouchStart={(event) => {
          const stage = event.target.getStage();
          const pointer = stage?.getPointerPosition();
          const touchedEmptyStage =
            event.target === stage || event.target === boardBackgroundRef.current;

          if (touchedEmptyStage) {
            setSelectedObjectId(null);
          }

          if (!touchedEmptyStage || !pointer) {
            return;
          }

          panStateRef.current = {
            isPanning: true,
            startPointerX: pointer.x,
            startPointerY: pointer.y,
            startStageX: stagePosition.x,
            startStageY: stagePosition.y,
          };
        }}
        onTouchMove={(event) => {
          const pointer = event.target.getStage()?.getPointerPosition();
          const panState = panStateRef.current;

          if (!panState?.isPanning || !pointer) {
            return;
          }

          setStagePosition({
            x: panState.startStageX + (pointer.x - panState.startPointerX),
            y: panState.startStageY + (pointer.y - panState.startPointerY),
          });
        }}
        onTouchEnd={() => {
          panStateRef.current = null;
          endImageStroke();
        }}
        onWheel={(event) => {
          event.evt.preventDefault();

          const oldScale = stageScale;
          const pointer = event.target.getStage()?.getPointerPosition();

          if (!pointer) return;

          const mousePointTo = {
            x: (pointer.x - stagePosition.x) / oldScale,
            y: (pointer.y - stagePosition.y) / oldScale,
          };

          const direction = event.evt.deltaY > 0 ? -1 : 1;
          let newScale =
            direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;

          newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

          const newPosition = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
          };

          setStageScale(newScale);
          setStagePosition(newPosition);
        }}
      >
        <Layer>
          <Rect
            ref={boardBackgroundRef}
            x={0}
            y={0}
            width={BOARD_WIDTH}
            height={BOARD_HEIGHT}
            fill="#1e293b"
            cornerRadius={24}
            onMouseDown={() => {
              setSelectedObjectId(null);
            }}
          />

          <Text
            x={120}
            y={100}
            text="Play Space Alpha"
            fontSize={32}
            fill="#f8fafc"
          />

          <Text
            x={120}
            y={150}
            text="Text card with drag handle"
            fontSize={18}
            fill="#94a3b8"
          />

          <Text
            x={120}
            y={210}
            text="У note drag работает только через маленький handle в header."
            fontSize={16}
            fill="#94a3b8"
          />

          {sortedObjects.map((object) => {
            const isSelected = object.id === selectedObjectId;
            const isImage = object.kind === "image";
            const isTextCard = object.kind === "text-card";

            if (isImage) {
              const loadedImage = object.src ? loadedImages[object.src] : undefined;
              const isDrawing = drawingImageId === object.id;

              return (
                <Group key={object.id}>
                  <KonvaImage
                    ref={(node) => {
                      imageRefs.current[object.id] = node;
                    }}
                    x={object.x}
                    y={object.y}
                    image={loadedImage}
                    width={object.width}
                    height={object.height}
                    fill={loadedImage ? undefined : object.fill}
                    shadowBlur={8}
                    draggable={!isDrawing && transformingImageId !== object.id}
                    onMouseDown={(event) => {
                      event.cancelBubble = true;
                      setSelectedObjectId(object.id);

                      if (!isDrawing) {
                        return;
                      }

                      const point = event.target.getRelativePointerPosition();

                      if (!point) {
                        return;
                      }

                      startImageStroke(object.id, point, currentUserColor);
                    }}
                    onMouseMove={(event) => {
                      if (!isDrawing) {
                        return;
                      }

                      const point = event.target.getRelativePointerPosition();

                      if (!point) {
                        return;
                      }

                      appendStrokePoint(object.id, point);
                    }}
                    onMouseUp={() => {
                      endImageStroke();
                    }}
                    onDblClick={(event) => {
                      event.cancelBubble = true;
                      setSelectedObjectId(object.id);
                      setDrawingImageId(object.id);
                    }}
                    onDragStart={(event) => {
                      event.cancelBubble = true;
                      setSelectedObjectId(object.id);
                      syncImageStrokeLayerPosition(
                        object.id,
                        event.target.x(),
                        event.target.y()
                      );
                    }}
                    onDragMove={(event) => {
                      event.cancelBubble = true;
                      syncImageStrokeLayerPosition(
                        object.id,
                        event.target.x(),
                        event.target.y()
                      );
                      updateObjectPosition(object.id, event.target.x(), event.target.y());
                    }}
                    onDragEnd={(event) => {
                      event.cancelBubble = true;
                      syncImageStrokeLayerPosition(
                        object.id,
                        event.target.x(),
                        event.target.y()
                      );
                      updateObjectPosition(object.id, event.target.x(), event.target.y());
                    }}
                    onTransformStart={(event) => {
                      event.cancelBubble = true;
                      setSelectedObjectId(object.id);
                      setTransformingImageId(object.id);
                      transformingImageSnapshotRef.current[object.id] = object;
                      event.target.draggable(false);
                      syncImageStrokeLayerTransform(
                        object.id,
                        event.target.x(),
                        event.target.y(),
                        event.target.scaleX(),
                        event.target.scaleY()
                      );
                    }}
                    onTransform={(event) => {
                      event.cancelBubble = true;
                      syncImageStrokeLayerTransform(
                        object.id,
                        event.target.x(),
                        event.target.y(),
                        event.target.scaleX(),
                        event.target.scaleY()
                      );

                      const snapshot =
                        transformingImageSnapshotRef.current[object.id];

                      if (snapshot) {
                        publishImageTransformPreview(
                          event.target as Konva.Image,
                          snapshot
                        );
                      }
                    }}
                    onTransformEnd={(event) => {
                      event.cancelBubble = true;

                      const node = event.target;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      const strokeWidthScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
                      const nextWidth = Math.max(node.width() * node.scaleX(), MIN_IMAGE_SIZE);
                      const nextHeight = Math.max(
                        node.height() * node.scaleY(),
                        MIN_IMAGE_SIZE
                      );

                      node.scaleX(1);
                      node.scaleY(1);
                      node.draggable(true);

                      resizeImageObject(
                        object.id,
                        {
                          x: node.x(),
                          y: node.y(),
                          width: nextWidth,
                          height: nextHeight,
                        },
                        { x: scaleX, y: scaleY },
                        strokeWidthScale
                      );
                      syncImageStrokeLayerTransform(object.id, node.x(), node.y(), 1, 1);
                      delete transformingImageSnapshotRef.current[object.id];
                      setTransformingImageId(null);
                    }}
                  />

                  <Group
                    ref={(node) => {
                      imageStrokeLayerRefs.current[object.id] = node;
                    }}
                    x={object.x}
                    y={object.y}
                    listening={false}
                  >
                    {(object.imageStrokes ?? []).map((stroke, strokeIndex) => (
                      <Line
                        key={`${object.id}-stroke-${strokeIndex}`}
                        x={0}
                        y={0}
                        points={stroke.points}
                        stroke={stroke.color}
                        strokeWidth={stroke.width ?? DEFAULT_IMAGE_STROKE_WIDTH}
                        lineCap="round"
                        lineJoin="round"
                        listening={false}
                      />
                    ))}
                  </Group>
                </Group>
              );
            }

            if (isTextCard) {
              const isEditing = object.id === editingTextCardId;

              return (
                <Group
                  key={object.id}
                  ref={(node) => {
                    textCardRefs.current[object.id] = node;
                  }}
                  x={object.x}
                  y={object.y}
                  draggable={!isEditing}
                  onMouseDown={(event) => {
                    event.cancelBubble = true;
                    setSelectedObjectId(object.id);
                  }}
                  onDragStart={(event) => {
                    event.cancelBubble = true;
                    setSelectedObjectId(object.id);
                  }}
                  onDragMove={(event) => {
                    event.cancelBubble = true;
                    updateObjectPosition(object.id, event.target.x(), event.target.y());
                  }}
                  onDragEnd={(event) => {
                    event.cancelBubble = true;
                    updateObjectPosition(object.id, event.target.x(), event.target.y());
                  }}
                >
                  {isSelected && (
                    <Rect
                      x={-4}
                      y={-4}
                      width={object.width + 8}
                      height={object.height + 8}
                      stroke="#60a5fa"
                      strokeWidth={3}
                      listening={false}
                    />
                  )}

                  <Rect
                    width={object.width}
                    height={object.height}
                    fill={object.fill}
                    shadowBlur={8}
                  />

                  <Rect
                    width={object.width}
                    height={TEXT_CARD_HEADER_HEIGHT}
                    fill="#e2e8f0"
                  />

                  <Rect
                    x={10}
                    y={9}
                    width={NOTE_HANDLE_SIZE}
                    height={NOTE_HANDLE_SIZE}
                    fill={object.authorColor ?? "#94a3b8"}
                    cornerRadius={6}
                    onMouseDown={(event) => {
                      event.cancelBubble = true;
                      setSelectedObjectId(object.id);
                      startDraggingTextCard(object.id);
                    }}
                  />

                  <Text
                    x={40}
                    y={10}
                    text="Note"
                    fontSize={14}
                    fontStyle="bold"
                    fill="#334155"
                    listening={false}
                  />

                  <Rect
                    y={TEXT_CARD_HEADER_HEIGHT}
                    width={object.width}
                    height={object.height - TEXT_CARD_HEADER_HEIGHT}
                    fill={object.fill}
                    onMouseDown={() => {
                      setSelectedObjectId(object.id);
                    }}
                    onDblClick={(event) => {
                      event.cancelBubble = true;
                      startEditingTextCard(object);
                    }}
                  />

                  {!isEditing && (
                    <Text
                      x={TEXT_CARD_BODY_INSET_X}
                      y={TEXT_CARD_HEADER_HEIGHT + TEXT_CARD_BODY_INSET_Y}
                      width={object.width - TEXT_CARD_BODY_INSET_X * 2}
                      text={object.label}
                      fontSize={TEXT_CARD_BODY_FONT_SIZE}
                      lineHeight={TEXT_CARD_BODY_LINE_HEIGHT}
                      fontFamily={TEXT_CARD_BODY_FONT_FAMILY}
                      fill={object.textColor ?? "#0f172a"}
                      listening={false}
                    />
                  )}
                </Group>
              );
            }

            return (
              <Group
                key={object.id}
                x={object.x}
                y={object.y}
                draggable
                onMouseDown={(event) => {
                  event.cancelBubble = true;
                  setSelectedObjectId(object.id);
                }}
                onDragStart={(event) => {
                  event.cancelBubble = true;
                  setSelectedObjectId(object.id);
                }}
                onDragMove={(event) => {
                  event.cancelBubble = true;

                  if (object.kind !== "token") {
                    return;
                  }

                  updateObjectPosition(object.id, event.target.x(), event.target.y());
                }}
                onDragEnd={(event) => {
                  event.cancelBubble = true;
                  updateObjectPosition(object.id, event.target.x(), event.target.y());
                }}
              >
                {isSelected && (
                  <Rect
                    x={-4}
                    y={-4}
                    width={object.width + 8}
                    height={object.height + 8}
                    stroke="#60a5fa"
                    strokeWidth={3}
                    listening={false}
                  />
                )}

                <Rect
                  width={object.width}
                  height={object.height}
                  fill={object.fill}
                  shadowBlur={8}
                />

                <Text
                  x={0}
                  y={object.height / 2 - 12}
                  width={object.width}
                  align="center"
                  text={object.label}
                  fontSize={24}
                  fill={object.textColor ?? "#f8fafc"}
                />
              </Group>
            );
          })}

          <Transformer
            ref={imageTransformerRef}
            rotateEnabled={false}
            flipEnabled={false}
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
            ]}
            boundBoxFunc={(oldBox, newBox) => {
              if (
                Math.abs(newBox.width) < MIN_IMAGE_SIZE ||
                Math.abs(newBox.height) < MIN_IMAGE_SIZE
              ) {
                return oldBox;
              }

              return newBox;
            }}
          />
        </Layer>
      </Stage>

      {editingTextCard && editingTextareaStyle && (
        <textarea
          ref={textareaRef}
          value={editingDraft}
          onChange={(event) => {
            setEditingDraft(event.target.value);
          }}
          onBlur={() => {
            if (ignoreNextBlurRef.current) {
              ignoreNextBlurRef.current = false;
              return;
            }

            saveEditingTextCard();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              ignoreNextBlurRef.current = true;
              cancelEditingTextCard();
              return;
            }

            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              saveEditingTextCard();
            }
          }}
          style={{
            position: "absolute",
            left: editingTextareaStyle.left,
            top: editingTextareaStyle.top,
            width: editingTextareaStyle.width,
            height: editingTextareaStyle.height,
            padding: 0,
            margin: 0,
            border: "none",
            outline: "none",
            appearance: "none",
            WebkitAppearance: "none",
            borderRadius: 0,
            boxShadow: "none",
            resize: "none",
            overflow: "hidden",
            fontFamily: editingTextareaStyle.fontFamily,
            fontSize: editingTextareaStyle.fontSize,
            fontWeight: "normal",
            lineHeight: editingTextareaStyle.lineHeight,
            color: editingTextareaStyle.color,
            background: "transparent",
            caretColor: editingTextareaStyle.color,
            boxSizing: "border-box",
            whiteSpace: "pre-wrap",
          }}
        />
      )}
    </div>
  );
}
