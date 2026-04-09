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
import { BoardToolbar } from "../board/components/BoardToolbar";
import { CursorOverlay } from "../board/components/CursorOverlay";
import { ParticipantSessionPanel } from "../board/components/ParticipantSessionPanel";
import { createTextCardObject } from "../board/objects/textCard/createTextCardObject";
import { TextCardRenderer } from "../board/objects/textCard/TextCardRenderer";
import { createTokenObject } from "../board/objects/token/createTokenObject";
import { TokenRenderer } from "../board/objects/token/TokenRenderer";
import {
  getAddBoardObjectSyncOptions,
  getRemoveBoardObjectSyncOptions,
  getUpdateBoardObjectSyncOptions,
  syncBoardObjects,
  type BoardObjectSyncOptions,
} from "../board/sync/boardObjectSync";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  HTML_UI_FONT_FAMILY,
  MAX_INITIAL_IMAGE_DISPLAY_HEIGHT,
  MAX_INITIAL_IMAGE_DISPLAY_WIDTH,
  MAX_SCALE,
  MAX_UPLOADED_IMAGE_SOURCE_DIMENSION,
  MIN_IMAGE_SIZE,
  MIN_SCALE,
  objectLayerOrder,
  SCALE_BY,
  TEXT_CARD_BODY_FONT_FAMILY,
  TEXT_CARD_BODY_FONT_SIZE,
  TEXT_CARD_BODY_INSET_X,
  TEXT_CARD_BODY_INSET_Y,
  TEXT_CARD_BODY_LINE_HEIGHT,
  TEXT_CARD_HEADER_HEIGHT,
} from "../board/constants";
import {
  getBoardPointFromScreen,
  getInitialRoomViewport,
  getViewportCenterInBoardCoords,
  getZoomedViewport,
} from "../board/viewport";
import { EMPTY_BOARD_STATE } from "../data/emptyBoard";
import {
  appendImageStrokePointInObjects,
  clearImageStrokesInObjects,
  createImageObject,
  DEFAULT_IMAGE_STROKE_WIDTH,
  getImageStorageScale,
  getInitialImageDisplaySize,
} from "../lib/boardImage";
import {
  loadDurableRoomSnapshot,
  saveDurableRoomSnapshot,
} from "../lib/durableRoomSnapshot";
import {
  updateBoardObjectById,
  removeBoardObjectById,
  updateBoardObjectLabel,
  updateBoardObjectPosition,
} from "../lib/boardObjects";
import {
  clearBoardContentStorage,
  loadBoardObjects,
  loadRoomSnapshot,
  loadViewportState,
  saveBoardObjects,
  saveRoomSnapshot,
  saveViewportState,
} from "../lib/storage";
import { createClientId } from "../lib/id";
import {
  createRoomTokenConnection,
  type RoomTokenConnection,
} from "../lib/roomTokensRealtime";
import {
  createRoomImageConnection,
  type ImageDrawingLock,
  type RoomImageConnection,
} from "../lib/roomImagesRealtime";
import {
  createRoomTextCardConnection,
  type TextCardEditingPresence,
  type RoomTextCardConnection,
} from "../lib/roomTextCardsRealtime";
import {
  PARTICIPANT_COLOR_OPTIONS,
  type LocalParticipantSession,
  type ParticipantPresence,
  type ParticipantPresenceMap,
} from "../lib/roomSession";
import type { AccessLevel } from "../lib/governance";
import type { BoardObject } from "../types/board";

type SmallFloatingActionButtonProps = {
  x: number;
  y: number;
  label: string;
  tone?: "default" | "danger" | "primary";
  onClick: () => void;
};

function SmallFloatingActionButton({
  x,
  y,
  label,
  tone = "default",
  onClick,
}: SmallFloatingActionButtonProps) {
  const width = Math.max(44, label.length * 7 + 18);
  const height = 28;
  const toneStyles =
    tone === "primary"
      ? {
          fill: "#2563eb",
          stroke: "rgba(96, 165, 250, 0.6)",
          textColor: "#f8fafc",
        }
      : tone === "danger"
        ? {
            fill: "#450a0a",
            stroke: "rgba(248, 113, 113, 0.5)",
            textColor: "#fecaca",
          }
        : {
            fill: "#0f172a",
            stroke: "rgba(148, 163, 184, 0.35)",
            textColor: "#f8fafc",
          };

  return (
    <Group
      x={x}
      y={y}
      onMouseDown={(event) => {
        event.cancelBubble = true;
      }}
      onTouchStart={(event) => {
        event.cancelBubble = true;
      }}
      onClick={(event) => {
        event.cancelBubble = true;
        onClick();
      }}
      onTap={(event) => {
        event.cancelBubble = true;
        onClick();
      }}
    >
      <Rect
        width={width}
        height={height}
        cornerRadius={999}
        fill={toneStyles.fill}
        stroke={toneStyles.stroke}
        strokeWidth={1}
        shadowBlur={8}
        shadowColor="rgba(2, 6, 23, 0.3)"
      />
      <Text
        x={0}
        y={7}
        width={width}
        align="center"
        text={label}
        fontSize={12}
        fontStyle="bold"
        fontFamily={HTML_UI_FONT_FAMILY}
        fill={toneStyles.textColor}
        listening={false}
      />
    </Group>
  );
}

type BoardStageProps = {
  participantSession: LocalParticipantSession;
  participantPresences: ParticipantPresenceMap;
  roomId: string;
  isCurrentParticipantRoomCreator: boolean;
  roomCreatorName: string | null;
  roomEffectiveAccessLevel: AccessLevel;
  onLeaveRoom: () => void;
  onUpdateParticipantSession: (
    updater: (session: LocalParticipantSession) => LocalParticipantSession
  ) => void;
  onUpdateLocalPresence: (
    updater: (presence: ParticipantPresence | null) => ParticipantPresence | null
  ) => void;
};

type ObjectSemanticsHoverState = {
  objectId: string;
  clientX: number;
  clientY: number;
};

export default function BoardStage({
  participantSession,
  participantPresences,
  roomId,
  isCurrentParticipantRoomCreator,
  roomCreatorName,
  roomEffectiveAccessLevel,
  onLeaveRoom,
  onUpdateParticipantSession,
  onUpdateLocalPresence,
}: BoardStageProps) {
  const mergeSharedImages = (
    sharedImages: BoardObject[],
    localImages: BoardObject[]
  ) => {
    return sharedImages.map((sharedImage) => {
      const localImage = localImages.find(
        (localObject) =>
          localObject.id === sharedImage.id && localObject.kind === "image"
      );

      if (localImage && transformingImageSnapshotRef.current[sharedImage.id]) {
        return localImage;
      }

      const hasLocalInProgressDrawing =
        drawingImageId === sharedImage.id ||
        activeImageStrokeRef.current?.imageId === sharedImage.id;

      if (!hasLocalInProgressDrawing || !localImage?.imageStrokes?.length) {
        return sharedImage;
      }

      return {
        ...sharedImage,
        imageStrokes: localImage.imageStrokes,
      };
    });
  };

  const getRoomScopedObjects = (nextRoomId: string) => {
    const localObjects = loadBoardObjects(nextRoomId, EMPTY_BOARD_STATE);

    return [
      ...localObjects.filter(
        (object) =>
          object.kind !== "token" &&
          object.kind !== "image" &&
          object.kind !== "text-card"
      ),
    ];
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const sessionPanelRef = useRef<HTMLDivElement | null>(null);
  const stageWrapperRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [stagePosition, setStagePosition] = useState(() => {
    const savedViewport = loadViewportState(roomId);
    const initialRoomViewport = getInitialRoomViewport(
      window.innerWidth,
      window.innerHeight
    );

    const hasSavedViewport =
      savedViewport.x !== 120 ||
      savedViewport.y !== 80 ||
      savedViewport.scale !== 1;

    if (!hasSavedViewport) {
      return { x: initialRoomViewport.x, y: initialRoomViewport.y };
    }

    return { x: savedViewport.x, y: savedViewport.y };
  });

  const [stageScale, setStageScale] = useState(() => {
    const savedViewport = loadViewportState(roomId);
    const initialRoomViewport = getInitialRoomViewport(
      window.innerWidth,
      window.innerHeight
    );

    const hasSavedViewport =
      savedViewport.x !== 120 ||
      savedViewport.y !== 80 ||
      savedViewport.scale !== 1;

    if (!hasSavedViewport) {
      return initialRoomViewport.scale;
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
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [isEditingParticipantName, setIsEditingParticipantName] = useState(false);
  const [participantNameDraft, setParticipantNameDraft] = useState(
    participantSession.name
  );
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [isObjectInspectionEnabled, setIsObjectInspectionEnabled] = useState(false);
  const [objectSemanticsHoverState, setObjectSemanticsHoverState] =
    useState<ObjectSemanticsHoverState | null>(null);
  const [remoteImagePreviewPositions, setRemoteImagePreviewPositions] = useState<
    Record<
      string,
      {
        x: number;
        y: number;
        width?: number;
        height?: number;
        participantColor?: string;
      }
    >
  >({});
  const [remoteImageDrawingLocks, setRemoteImageDrawingLocks] = useState<
    Record<string, ImageDrawingLock>
  >({});
  const [remoteTextCardEditingStates, setRemoteTextCardEditingStates] = useState<
    Record<string, TextCardEditingPresence>
  >({});
  const [liveSelectedImageActionPosition, setLiveSelectedImageActionPosition] =
    useState<{ imageId: string; x: number; y: number } | null>(null);
  const [tokenInitialSyncRoomId, setTokenInitialSyncRoomId] = useState<
    string | null
  >(null);
  const [imageInitialSyncRoomId, setImageInitialSyncRoomId] = useState<
    string | null
  >(null);
  const [textCardInitialSyncRoomId, setTextCardInitialSyncRoomId] = useState<
    string | null
  >(null);
  const currentUserColor = participantSession.color;
  const getLiveCreatorColor = (object: BoardObject) => {
    if (!object.creatorId) {
      return null;
    }

    if (object.creatorId === participantSession.id) {
      return participantSession.color;
    }

    return participantPresences[object.creatorId]?.color ?? null;
  };

  const getTokenFillColor = (object: BoardObject) => {
    return getLiveCreatorColor(object) ?? object.authorColor ?? object.fill;
  };

  const getTextCardAccentColor = (object: BoardObject) => {
    return getLiveCreatorColor(object) ?? object.authorColor ?? "#94a3b8";
  };

  const getObjectSemanticsRows = (object: BoardObject) => {
    const rows = [
      { label: "Kind", value: object.kind },
      { label: "Id", value: object.id },
      { label: "Creator", value: object.creatorId ?? "none" },
      { label: "Creator color", value: getLiveCreatorColor(object) ?? "unresolved" },
      { label: "Author color", value: object.authorColor ?? "none" },
    ];

    if (object.kind === "image") {
      rows.push({
        label: "Stroke creators",
        value: String(
          new Set(
            (object.imageStrokes ?? [])
              .map((stroke) => stroke.creatorId)
              .filter((creatorId): creatorId is string => typeof creatorId === "string")
          ).size
        ),
      });
    }

    return rows;
  };

  const getLiveStrokeColor = (stroke: {
    color: string;
    creatorId?: string;
  }) => {
    if (!stroke.creatorId) {
      return stroke.color;
    }

    if (stroke.creatorId === participantSession.id) {
      return participantSession.color;
    }

    return participantPresences[stroke.creatorId]?.color ?? stroke.color;
  };

  const updateObjectSemanticsHover = (
    object: BoardObject,
    event: { evt: MouseEvent }
  ) => {
    if (!isObjectInspectionEnabled) {
      return;
    }

    setObjectSemanticsHoverState({
      objectId: object.id,
      clientX: event.evt.clientX,
      clientY: event.evt.clientY,
    });
  };

  const clearObjectSemanticsHover = () => {
    setObjectSemanticsHoverState(null);
  };

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
  const roomTokenConnectionRef = useRef<RoomTokenConnection | null>(null);
  const roomImageConnectionRef = useRef<RoomImageConnection | null>(null);
  const roomTextCardConnectionRef = useRef<RoomTextCardConnection | null>(null);
  const roomBootstrapEntryIdRef = useRef(0);
  const snapshotRecoveryAttemptedRoomRef = useRef<number | null>(null);
  const [resolvedSnapshotBootstrapRoomId, setResolvedSnapshotBootstrapRoomId] =
    useState<string | null>(null);
  const durableSnapshotRevisionRef = useRef<number | null>(null);
  const pendingDurableSnapshotSaveKeyRef = useRef<string | null>(null);
  const lastSavedDurableSnapshotKeyRef = useRef<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>(
    {}
  );

  const hasSharedRoomContentLoaded =
    tokenInitialSyncRoomId === roomId &&
    imageInitialSyncRoomId === roomId &&
    textCardInitialSyncRoomId === roomId;
  const sharedRoomObjects = useMemo(
    () =>
      objects.filter(
        (object) =>
          object.kind === "token" ||
          object.kind === "image" ||
          object.kind === "text-card"
      ),
    [objects]
  );

  const applyBoardObjectsUpdate = (
    updater: (currentObjects: BoardObject[]) => BoardObject[],
    options?: BoardObjectSyncOptions
  ) => {
    setObjects((currentObjects) => {
      const nextObjects = updater(currentObjects);

      syncBoardObjects(
        {
          roomTokenConnection: roomTokenConnectionRef.current,
          roomImageConnection: roomImageConnectionRef.current,
          roomTextCardConnection: roomTextCardConnectionRef.current,
        },
        nextObjects,
        options
      );

      return nextObjects;
    });
  };

  const replaceBoardObjects = (
    nextObjects: BoardObject[],
    options?: BoardObjectSyncOptions
  ) => {
    setObjects(nextObjects);

    syncBoardObjects(
      {
        roomTokenConnection: roomTokenConnectionRef.current,
        roomImageConnection: roomImageConnectionRef.current,
        roomTextCardConnection: roomTextCardConnectionRef.current,
      },
      nextObjects,
      options
    );
  };

  const addBoardObject = (object: BoardObject) => {
    applyBoardObjectsUpdate(
      (currentObjects) => [...currentObjects, object],
      getAddBoardObjectSyncOptions(object)
    );
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
      getRemoveBoardObjectSyncOptions(objects, id)
    );
  };

  const clearImageDrawing = (id: string) => {
    applyBoardObjectsUpdate(
      (currentObjects) => clearImageStrokesInObjects(currentObjects, id),
      { syncSharedImageIds: [id] }
    );
  };

  const releaseImageDrawingLock = () => {
    roomImageConnectionRef.current?.setActiveDrawingImage(null);
  };

  const getImageDrawingLock = (imageId: string) => {
    return remoteImageDrawingLocks[imageId] ?? null;
  };

  const isImageLockedByAnotherParticipant = (imageId: string) => {
    const lock = getImageDrawingLock(imageId);

    return !!lock && lock.participantId !== participantSession.id;
  };

  const startImageDrawingMode = (imageId: string) => {
    if (isImageLockedByAnotherParticipant(imageId)) {
      return;
    }

    setSelectedObjectId(imageId);
    setDrawingImageId(imageId);
    roomImageConnectionRef.current?.setActiveDrawingImage({
      imageId,
      participantId: participantSession.id,
      participantName: participantSession.name,
      participantColor: participantSession.color,
    });
  };

  const finishImageDrawingMode = () => {
    endImageStroke();
    releaseImageDrawingLock();
    setDrawingImageId(null);
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
            creatorId: participantSession.id,
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

    const bounds = node.getClientRect({
      skipShadow: true,
      skipStroke: true,
      relativeTo: node.getLayer() ?? undefined,
    });

    roomImageConnectionRef.current?.updateImagePreviewBounds(snapshot.id, {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      participantColor: participantSession.color,
    });
  };

  useEffect(() => {
    const savedViewport = loadViewportState(roomId);
    const initialRoomViewport = getInitialRoomViewport(
      window.innerWidth,
      window.innerHeight
    );
    const hasSavedViewport =
      savedViewport.x !== 120 ||
      savedViewport.y !== 80 ||
      savedViewport.scale !== 1;
    const nextBootstrapEntryId = roomBootstrapEntryIdRef.current + 1;

    console.info("[room-recovery][board-stage][bootstrap-start]", {
      roomId,
      bootstrapEntryId: nextBootstrapEntryId,
      viewportSource: hasSavedViewport ? "saved" : "initial-default",
      hasSavedViewport,
    });

    replaceBoardObjects(getRoomScopedObjects(roomId));
    setStagePosition(
      hasSavedViewport
        ? { x: savedViewport.x, y: savedViewport.y }
        : { x: initialRoomViewport.x, y: initialRoomViewport.y }
    );
    setStageScale(
      hasSavedViewport ? savedViewport.scale : initialRoomViewport.scale
    );
    setSelectedObjectId(null);
    setEditingTextCardId(null);
    setEditingDraft("");
    setEditingOriginal("");
    setDrawingImageId(null);
    setTransformingImageId(null);
    setDraggingImageId(null);
    setRemoteImagePreviewPositions({});
    setRemoteImageDrawingLocks({});
    setRemoteTextCardEditingStates({});
    setLiveSelectedImageActionPosition(null);
    roomBootstrapEntryIdRef.current = nextBootstrapEntryId;
    setTokenInitialSyncRoomId(null);
    setImageInitialSyncRoomId(null);
    setTextCardInitialSyncRoomId(null);
    snapshotRecoveryAttemptedRoomRef.current = null;
    setResolvedSnapshotBootstrapRoomId(null);
    durableSnapshotRevisionRef.current = null;
    pendingDurableSnapshotSaveKeyRef.current = null;
    lastSavedDurableSnapshotKeyRef.current = null;
    panStateRef.current = null;
    setIsDevToolsOpen(false);
    setObjectSemanticsHoverState(null);
  }, [roomId]);

  useEffect(() => {
    setParticipantNameDraft(participantSession.name);
  }, [participantSession.name]);

  useEffect(() => {
    if (!isEditingParticipantName && !isColorPickerOpen && !isDevToolsOpen) {
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

      if (isDevToolsOpen) {
        setIsDevToolsOpen(false);
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
    isDevToolsOpen,
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

    // Local room snapshots are a fallback cache of last known committed shared content.
    // Do not rewrite the current room snapshot until all shared room slices have
    // finished their initial load for this room, otherwise room bootstrap/reset can
    // overwrite a good snapshot with stale previous-room objects or with the stripped
    // shared-empty shell that exists before live shared state resolves.
    if (!hasSharedRoomContentLoaded) {
      return;
    }

    // Wait until this room's bootstrap/recovery decision has completed. Otherwise the
    // first "loaded and empty" render can still overwrite a good snapshot with empty
    // content before the recovery effect gets a chance to inspect it.
    if (resolvedSnapshotBootstrapRoomId !== roomId) {
      return;
    }

    // Local room snapshots are a fallback cache of last known committed shared content.
    // Skip writes while image state is mid-interaction so we don't persist transient
    // preview/drawing-in-progress state as if it were committed room content.
    if (drawingImageId || draggingImageId || transformingImageId) {
      return;
    }

    saveRoomSnapshot(roomId, objects);

    const durableSnapshotKey = JSON.stringify({
      roomId,
      tokens: objects.filter((object) => object.kind === "token"),
      images: objects.filter((object) => object.kind === "image"),
      textCards: objects.filter((object) => object.kind === "text-card"),
    });

    if (
      pendingDurableSnapshotSaveKeyRef.current === durableSnapshotKey ||
      lastSavedDurableSnapshotKeyRef.current === durableSnapshotKey
    ) {
      return;
    }

    pendingDurableSnapshotSaveKeyRef.current = durableSnapshotKey;
    let isCancelled = false;

    const persistDurableSnapshot = async () => {
      const result = await saveDurableRoomSnapshot(
        roomId,
        objects,
        durableSnapshotRevisionRef.current
      );

      if (isCancelled) {
        return;
      }

      if (result.status === "conflict") {
        durableSnapshotRevisionRef.current = result.currentRevision;
        return;
      }

      if (result.status === "saved") {
        durableSnapshotRevisionRef.current = result.snapshot.revision;
        lastSavedDurableSnapshotKeyRef.current = durableSnapshotKey;
      }
    };

    void persistDurableSnapshot().finally(() => {
      if (pendingDurableSnapshotSaveKeyRef.current === durableSnapshotKey) {
        pendingDurableSnapshotSaveKeyRef.current = null;
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [
    drawingImageId,
    draggingImageId,
    hasSharedRoomContentLoaded,
    objects,
    resolvedSnapshotBootstrapRoomId,
    roomId,
    transformingImageId,
  ]);

  useEffect(() => {
    if (!hasSharedRoomContentLoaded) {
      return;
    }

    if (
      snapshotRecoveryAttemptedRoomRef.current === roomBootstrapEntryIdRef.current
    ) {
      return;
    }

    if (sharedRoomObjects.length > 0) {
      let isCancelled = false;

      void loadDurableRoomSnapshot(roomId).then((snapshot) => {
        if (isCancelled) {
          return;
        }

        durableSnapshotRevisionRef.current = snapshot?.revision ?? null;
        console.info("[room-recovery][board-stage][bootstrap-terminal]", {
          roomId,
          branch: "live-wins",
          durableRevision: snapshot?.revision ?? null,
        });
      });

      snapshotRecoveryAttemptedRoomRef.current = roomBootstrapEntryIdRef.current;
      setResolvedSnapshotBootstrapRoomId(roomId);
      return () => {
        isCancelled = true;
      };
    }

    let isCancelled = false;

    const resolveRoomBootstrap = async () => {
      const localSnapshot = loadRoomSnapshot(roomId);
      const localSnapshotObjectCount = localSnapshot
        ? localSnapshot.tokens.length +
          localSnapshot.images.length +
          localSnapshot.textCards.length
        : 0;

      let durableSnapshot = null;

      try {
        durableSnapshot = await loadDurableRoomSnapshot(roomId);
      } catch (error) {
        console.error("Failed to resolve durable room snapshot during bootstrap", error);
      }

      if (isCancelled) {
        return;
      }

      durableSnapshotRevisionRef.current = durableSnapshot?.revision ?? null;

      const durableSnapshotObjectCount = durableSnapshot
        ? durableSnapshot.tokens.length +
          durableSnapshot.images.length +
          durableSnapshot.textCards.length
        : 0;

      console.info("[room-recovery][board-stage][bootstrap-inputs]", {
        roomId,
        bootstrapEntryId: roomBootstrapEntryIdRef.current,
        sharedRoomObjectCount: sharedRoomObjects.length,
        durableSnapshotObjectCount,
        localSnapshotObjectCount,
        durableSnapshotRevision: durableSnapshot?.revision ?? null,
        localSnapshotSavedAt: localSnapshot?.savedAt ?? null,
      });

      if (durableSnapshot && durableSnapshotObjectCount > 0) {
        console.info("[room-recovery][board-stage][bootstrap-terminal]", {
          roomId,
          bootstrapEntryId: roomBootstrapEntryIdRef.current,
          branch: "durable-recovery",
          source: "durable",
          tokenCount: durableSnapshot.tokens.length,
          imageCount: durableSnapshot.images.length,
          textCardCount: durableSnapshot.textCards.length,
        });
        replaceBoardObjects(
          [
            ...getRoomScopedObjects(roomId),
            ...durableSnapshot.tokens,
            ...durableSnapshot.images,
            ...durableSnapshot.textCards,
          ],
          {
            syncSharedTokens: true,
            syncSharedImages: true,
            syncSharedTextCards: true,
          }
        );
        snapshotRecoveryAttemptedRoomRef.current = roomBootstrapEntryIdRef.current;
        setResolvedSnapshotBootstrapRoomId(roomId);
        return;
      }

      if (!localSnapshot || localSnapshotObjectCount === 0) {
        console.info("[room-recovery][board-stage][bootstrap-terminal]", {
          roomId,
          bootstrapEntryId: roomBootstrapEntryIdRef.current,
          branch: "empty-room",
        });
        snapshotRecoveryAttemptedRoomRef.current = roomBootstrapEntryIdRef.current;
        setResolvedSnapshotBootstrapRoomId(roomId);
        return;
      }

      console.info("[room-recovery][board-stage][bootstrap-terminal]", {
        roomId,
        bootstrapEntryId: roomBootstrapEntryIdRef.current,
        branch: "local-recovery",
        source: "local",
        tokenCount: localSnapshot.tokens.length,
        imageCount: localSnapshot.images.length,
        textCardCount: localSnapshot.textCards.length,
      });
      replaceBoardObjects(
        [
          ...getRoomScopedObjects(roomId),
          ...localSnapshot.tokens,
          ...localSnapshot.images,
          ...localSnapshot.textCards,
        ],
        {
          syncSharedTokens: true,
          syncSharedImages: true,
          syncSharedTextCards: true,
        }
      );
      snapshotRecoveryAttemptedRoomRef.current = roomBootstrapEntryIdRef.current;
      setResolvedSnapshotBootstrapRoomId(roomId);
    };

    void resolveRoomBootstrap();

    return () => {
      isCancelled = true;
    };
  }, [hasSharedRoomContentLoaded, roomId, sharedRoomObjects.length]);

  useEffect(() => {
    const connection = createRoomTokenConnection({
      roomId,
      onTokensChange: (sharedTokens) => {
        setObjects((currentObjects) => [
          ...currentObjects.filter((object) => object.kind !== "token"),
          ...sharedTokens,
        ]);
      },
      onInitialSyncComplete: () => {
        setTokenInitialSyncRoomId(roomId);
      },
    });
    roomTokenConnectionRef.current = connection;

    return () => {
      if (roomTokenConnectionRef.current === connection) {
        roomTokenConnectionRef.current = null;
      }

      connection.destroy();
    };
  }, [roomId]);

  useEffect(() => {
    const connection = createRoomImageConnection({
      roomId,
      onImagesChange: (sharedImages) => {
        setObjects((currentObjects) => [
          ...currentObjects.filter((object) => object.kind !== "image"),
          ...mergeSharedImages(
            sharedImages,
            currentObjects.filter((object) => object.kind === "image")
          ),
        ]);
      },
      onInitialSyncComplete: () => {
        setImageInitialSyncRoomId(roomId);
      },
      onImagePreviewPositionsChange: setRemoteImagePreviewPositions,
      onImageDrawingLocksChange: setRemoteImageDrawingLocks,
    });
    roomImageConnectionRef.current = connection;

    return () => {
      if (roomImageConnectionRef.current === connection) {
        roomImageConnectionRef.current = null;
      }

      connection.destroy();
    };
  }, [roomId]);

  useEffect(() => {
    const connection = createRoomTextCardConnection({
      roomId,
      onTextCardsChange: (sharedTextCards) => {
        setObjects((currentObjects) => [
          ...currentObjects.filter((object) => object.kind !== "text-card"),
          ...sharedTextCards,
        ]);
      },
      onInitialSyncComplete: () => {
        setTextCardInitialSyncRoomId(roomId);
      },
      onTextCardEditingStatesChange: setRemoteTextCardEditingStates,
    });
    roomTextCardConnectionRef.current = connection;

    return () => {
      if (roomTextCardConnectionRef.current === connection) {
        roomTextCardConnectionRef.current = null;
      }

      connection.destroy();
    };
  }, [roomId]);

  useEffect(() => {
    roomTextCardConnectionRef.current?.setActiveEditingTextCard(
      editingTextCardId
        ? {
            textCardId: editingTextCardId,
            participantId: participantSession.id,
            participantName: participantSession.name,
            participantColor: participantSession.color,
          }
        : null
    );
  }, [
    editingTextCardId,
    participantSession.color,
    participantSession.id,
    participantSession.name,
  ]);

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
      const isEscapeKey = event.key === "Escape";
      const isDeleteKey = event.key === "Backspace" || event.key === "Delete";

      if ((isEnterKey || isEscapeKey) && drawingImageId) {
        event.preventDefault();
        finishImageDrawingMode();
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
      getUpdateBoardObjectSyncOptions(objects, id)
    );
  };

  const previewImagePosition = (id: string, x: number, y: number) => {
    applyBoardObjectsUpdate((currentObjects) =>
      updateBoardObjectPosition(currentObjects, id, x, y)
    );
    roomImageConnectionRef.current?.updateImagePosition(
      id,
      x,
      y,
      participantSession.color
    );
  };

  const updateObjectLabel = (id: string, label: string) => {
    applyBoardObjectsUpdate(
      (currentObjects) => updateBoardObjectLabel(currentObjects, id, label),
      getUpdateBoardObjectSyncOptions(objects, id)
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
          roomImageConnectionRef.current?.upsertImages([image]);
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

  const getImageActionPositionFromBounds = (bounds: {
    x: number;
    y: number;
    width: number;
  }) => {
    return {
      x: bounds.x + bounds.width - 72,
      y: bounds.y - 36,
    };
  };

  const updateLiveSelectedImageActionPosition = (
    imageId: string,
    node: Konva.Image
  ) => {
    const bounds = node.getClientRect({
      skipShadow: true,
      skipStroke: true,
      relativeTo: node.getLayer() ?? undefined,
    });

    setLiveSelectedImageActionPosition({
      imageId,
      ...getImageActionPositionFromBounds(bounds),
    });
  };

  const createToken = () => {
    const center = getViewportCenterInBoardCoords({
      stageWidth: stageSize.width,
      stageHeight: stageSize.height,
      stageX: stagePosition.x,
      stageY: stagePosition.y,
      stageScale,
    });
    const newToken = createTokenObject({
      id: `token-${createClientId()}`,
      color: currentUserColor,
      creatorId: participantSession.id,
      position: center,
    });

    addBoardObject(newToken);
    setSelectedObjectId(newToken.id);
  };

  const createNote = () => {
    const center = getViewportCenterInBoardCoords({
      stageWidth: stageSize.width,
      stageHeight: stageSize.height,
      stageX: stagePosition.x,
      stageY: stagePosition.y,
      stageScale,
    });
    const newNote = createTextCardObject({
      id: `note-${createClientId()}`,
      color: currentUserColor,
      creatorId: participantSession.id,
      position: center,
    });

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
        const spawnPosition =
          position ??
          getViewportCenterInBoardCoords({
            stageWidth: stageSize.width,
            stageHeight: stageSize.height,
            stageX: stagePosition.x,
            stageY: stagePosition.y,
            stageScale,
          });
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
          id: `image-${createClientId()}`,
          creatorId: participantSession.id,
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
    if (roomEffectiveAccessLevel === "none") {
      return;
    }

    replaceBoardObjects(EMPTY_BOARD_STATE, {
      syncSharedTokens: true,
      syncSharedImages: true,
      syncSharedTextCards: true,
    });
    setSelectedObjectId(null);
    clearBoardContentStorage(roomId);
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
      selectedObjectId &&
      !editingTextCardId &&
      drawingImageId !== selectedObjectId &&
      !isImageLockedByAnotherParticipant(selectedObjectId)
        ? imageRefs.current[selectedObjectId] ?? null
        : null;

    if (selectedImageNode) {
      transformer.nodes([selectedImageNode]);
    } else {
      transformer.nodes([]);
    }

    transformer.getLayer()?.batchDraw();
  }, [
    drawingImageId,
    editingTextCardId,
    objects,
    remoteImageDrawingLocks,
    selectedObjectId,
  ]);

  useEffect(() => {
    if (drawingImageId && drawingImageId !== selectedObjectId) {
      activeImageStrokeRef.current = null;
      finishImageDrawingMode();
    }
  }, [drawingImageId, selectedObjectId]);

  useEffect(() => {
    if (!drawingImageId) {
      return;
    }

    const lock = getImageDrawingLock(drawingImageId);

    if (!lock || lock.participantId === participantSession.id) {
      return;
    }

    finishImageDrawingMode();
  }, [drawingImageId, participantSession.id, remoteImageDrawingLocks]);

  useEffect(() => {
    if (!drawingImageId) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;

      if (!target) {
        return;
      }

      if (stageWrapperRef.current?.contains(target)) {
        return;
      }

      finishImageDrawingMode();
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("touchstart", handlePointerDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("touchstart", handlePointerDown);
    };
  }, [drawingImageId]);

  useEffect(() => {
    return () => {
      releaseImageDrawingLock();
    };
  }, []);

  const editingTextCard = editingTextCardId
    ? objects.find((object) => object.id === editingTextCardId && object.kind === "text-card") ?? null
    : null;
  const selectedImageObject =
    selectedObjectId && !editingTextCardId
      ? objects.find(
          (object) => object.id === selectedObjectId && object.kind === "image"
        ) ?? null
      : null;
  const selectedImageLock = selectedImageObject
    ? getImageDrawingLock(selectedImageObject.id)
    : null;
  const isSelectedImageLockedByAnotherParticipant =
    !!selectedImageLock &&
    selectedImageLock.participantId !== participantSession.id;
  const selectedImageBaseActionPosition = useMemo(() => {
    if (!selectedImageObject) {
      return null;
    }

    return getImageActionPositionFromBounds({
      x: selectedImageObject.x,
      y: selectedImageObject.y,
      width: selectedImageObject.width,
    });
  }, [selectedImageObject]);
  const selectedImageActionPosition =
    selectedImageObject &&
    liveSelectedImageActionPosition?.imageId === selectedImageObject.id
      ? {
          x: liveSelectedImageActionPosition.x,
          y: liveSelectedImageActionPosition.y,
        }
      : selectedImageBaseActionPosition;

  useEffect(() => {
    if (!selectedImageObject) {
      setLiveSelectedImageActionPosition(null);
      return;
    }

    if (
      draggingImageId === selectedImageObject.id ||
      transformingImageId === selectedImageObject.id
    ) {
      return;
    }

    setLiveSelectedImageActionPosition((current) =>
      current?.imageId === selectedImageObject.id ? null : current
    );
  }, [draggingImageId, selectedImageObject, transformingImageId]);

  const inspectedObject = objectSemanticsHoverState
    ? objects.find((object) => object.id === objectSemanticsHoverState.objectId) ?? null
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

    const cursor = getBoardPointFromScreen({
      clientX,
      clientY,
      containerLeft: containerRect.left,
      containerTop: containerRect.top,
      stageX: stagePosition.x,
      stageY: stagePosition.y,
      stageScale,
    });

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
      .filter(
        (presence) =>
          presence.cursor && presence.participantId !== participantSession.id
      )
      .map((presence) => ({
        participantId: presence.participantId,
        left: stagePosition.x + presence.cursor!.x * stageScale,
        top: stagePosition.y + presence.cursor!.y * stageScale,
        name: presence.name || "Participant",
        color: presence.color,
      }));
  }, [
    participantPresences,
    participantSession.id,
    stagePosition.x,
    stagePosition.y,
    stageScale,
  ]);

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

        const boardPosition = getBoardPointFromScreen({
          clientX: event.clientX,
          clientY: event.clientY,
          containerLeft: containerRect.left,
          containerTop: containerRect.top,
          stageX: stagePosition.x,
          stageY: stagePosition.y,
          stageScale,
        });

        createImageFromFile(file, boardPosition);
      }}
    >
      <CursorOverlay cursors={participantCursorScreenPositions} />

      <button
        type="button"
        onClick={() => {
          imageInputRef.current?.click();
        }}
        aria-label="Add image"
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 30,
          pointerEvents: "auto",
          width: 36,
          height: 36,
          padding: 0,
          borderRadius: 12,
          border: `1px solid ${participantSession.color}`,
          background: "rgba(15, 23, 42, 0.92)",
          color: "#f8fafc",
          fontSize: 18,
          fontWeight: 700,
          fontFamily: HTML_UI_FONT_FAMILY,
          lineHeight: 1,
          boxShadow: "0 18px 40px rgba(2, 6, 23, 0.3)",
          cursor: "pointer",
        }}
      >
        +
      </button>

      <ParticipantSessionPanel
        ref={sessionPanelRef}
        roomId={roomId}
        isCurrentParticipantRoomCreator={isCurrentParticipantRoomCreator}
        roomCreatorName={roomCreatorName}
        participantName={participantSession.name}
        participantColor={participantSession.color}
        participantNameDraft={participantNameDraft}
        isEditingParticipantName={isEditingParticipantName}
        isColorPickerOpen={isColorPickerOpen}
        isDevToolsOpen={isDevToolsOpen}
        participantColorOptions={PARTICIPANT_COLOR_OPTIONS}
        onLeaveRoom={onLeaveRoom}
        onToggleColorPicker={() => {
          setIsColorPickerOpen((current) => !current);
        }}
        onToggleDevTools={() => {
          setIsDevToolsOpen((current) => !current);
        }}
        onParticipantNameDraftChange={setParticipantNameDraft}
        onParticipantNameSubmit={() => {
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
        onStartEditingParticipantName={() => {
          setParticipantNameDraft(participantSession.name);
          setIsEditingParticipantName(true);
        }}
        onSelectParticipantColor={(color) => {
          onUpdateParticipantSession((session) => ({
            ...session,
            color,
          }));
          setIsColorPickerOpen(false);
        }}
        devToolsContent={
          <div style={{ display: "grid", gap: 12 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#cbd5e1",
                fontSize: 12,
              }}
            >
              <input
                type="checkbox"
                checked={isObjectInspectionEnabled}
                onChange={(event) => {
                  const isEnabled = event.target.checked;
                  setIsObjectInspectionEnabled(isEnabled);

                  if (!isEnabled) {
                    clearObjectSemanticsHover();
                  }
                }}
              />
              Inspect object semantics on hover
            </label>

            <BoardToolbar
              onAddToken={createToken}
              onAddImage={() => {
                imageInputRef.current?.click();
              }}
              onAddNote={createNote}
              onResetBoard={resetBoard}
            />
          </div>
        }
      />

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

      <div ref={stageWrapperRef}>
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
            if (drawingImageId) {
              finishImageDrawingMode();
            }
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
            if (drawingImageId) {
              finishImageDrawingMode();
            }
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

          const direction = event.evt.deltaY > 0 ? -1 : 1;
          let newScale =
            direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;

          newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

          const newPosition = getZoomedViewport({
            pointerX: pointer.x,
            pointerY: pointer.y,
            stageX: stagePosition.x,
            stageY: stagePosition.y,
            oldScale,
            newScale,
          });

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
              if (drawingImageId) {
                finishImageDrawingMode();
              }
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
              const imageDrawingLock = getImageDrawingLock(object.id);
              const isLockedByAnotherParticipant =
                !!imageDrawingLock &&
                imageDrawingLock.participantId !== participantSession.id;
              const previewPosition = remoteImagePreviewPositions[object.id];
              const isRemoteDragPreviewActive =
                draggingImageId !== object.id &&
                !isLockedByAnotherParticipant &&
                transformingImageId !== object.id &&
                !!previewPosition &&
                (previewPosition.x !== object.x ||
                  previewPosition.y !== object.y ||
                  previewPosition.width !== undefined ||
                  previewPosition.height !== undefined);

              return (
                <Group
                  key={object.id}
                  onMouseEnter={(event) => {
                    updateObjectSemanticsHover(object, event);
                  }}
                  onMouseMove={(event) => {
                    updateObjectSemanticsHover(object, event);
                  }}
                  onMouseLeave={() => {
                    clearObjectSemanticsHover();
                  }}
                >
                  {isRemoteDragPreviewActive && (
                    <Rect
                      x={previewPosition.x}
                      y={previewPosition.y}
                      width={previewPosition.width ?? object.width}
                      height={previewPosition.height ?? object.height}
                      stroke={previewPosition.participantColor ?? "#94a3b8"}
                      strokeWidth={3}
                      dash={[10, 8]}
                      opacity={0.85}
                      listening={false}
                    />
                  )}

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
                    opacity={isRemoteDragPreviewActive ? 0.28 : 1}
                    shadowBlur={8}
                    draggable={
                      !isDrawing &&
                      transformingImageId !== object.id &&
                      !isLockedByAnotherParticipant
                    }
                    onMouseDown={(event) => {
                      event.cancelBubble = true;

                      if (drawingImageId && drawingImageId !== object.id) {
                        finishImageDrawingMode();
                      }

                      if (isLockedByAnotherParticipant) {
                        return;
                      }

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
                      if (!isDrawing || isLockedByAnotherParticipant) {
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
                    onDragStart={(event) => {
                      event.cancelBubble = true;

                      if (isLockedByAnotherParticipant) {
                        event.target.stopDrag();
                        return;
                      }

                      if (drawingImageId && drawingImageId !== object.id) {
                        finishImageDrawingMode();
                      }

                      setSelectedObjectId(object.id);
                      setDraggingImageId(object.id);
                      updateLiveSelectedImageActionPosition(
                        object.id,
                        event.target as Konva.Image
                      );
                      syncImageStrokeLayerPosition(
                        object.id,
                        event.target.x(),
                        event.target.y()
                      );
                    }}
                    onDragMove={(event) => {
                      event.cancelBubble = true;
                      updateLiveSelectedImageActionPosition(
                        object.id,
                        event.target as Konva.Image
                      );
                      syncImageStrokeLayerPosition(
                        object.id,
                        event.target.x(),
                        event.target.y()
                      );
                      previewImagePosition(
                        object.id,
                        event.target.x(),
                        event.target.y()
                      );
                    }}
                    onDragEnd={(event) => {
                      event.cancelBubble = true;
                      updateLiveSelectedImageActionPosition(
                        object.id,
                        event.target as Konva.Image
                      );
                      setDraggingImageId(null);
                      syncImageStrokeLayerPosition(
                        object.id,
                        event.target.x(),
                        event.target.y()
                      );
                      updateObjectPosition(object.id, event.target.x(), event.target.y());
                    }}
                    onTransformStart={(event) => {
                      event.cancelBubble = true;

                      if (isLockedByAnotherParticipant) {
                        return;
                      }

                      if (drawingImageId && drawingImageId !== object.id) {
                        finishImageDrawingMode();
                      }

                      setSelectedObjectId(object.id);
                      setTransformingImageId(object.id);
                      transformingImageSnapshotRef.current[object.id] = object;
                      event.target.draggable(false);
                      updateLiveSelectedImageActionPosition(
                        object.id,
                        event.target as Konva.Image
                      );
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
                      updateLiveSelectedImageActionPosition(
                        object.id,
                        event.target as Konva.Image
                      );
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
                      updateLiveSelectedImageActionPosition(
                        object.id,
                        node as Konva.Image
                      );
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
                        stroke={getLiveStrokeColor(stroke)}
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
              const remoteEditingState = remoteTextCardEditingStates[object.id];
              const remoteEditingIndicator =
                remoteEditingState &&
                remoteEditingState.participantId !== participantSession.id
                  ? {
                      participantName: remoteEditingState.participantName,
                      participantColor: remoteEditingState.participantColor,
                    }
                  : null;

              return (
                <TextCardRenderer
                  key={object.id}
                  object={object}
                  isSelected={isSelected}
                  isEditing={isEditing}
                  selectionColor={currentUserColor}
                  accentColor={getTextCardAccentColor(object)}
                  remoteEditingIndicator={remoteEditingIndicator}
                  onHoverStart={(event) => {
                    updateObjectSemanticsHover(object, event);
                  }}
                  onHoverMove={(event) => {
                    updateObjectSemanticsHover(object, event);
                  }}
                  onHoverEnd={() => {
                    clearObjectSemanticsHover();
                  }}
                  onGroupRef={(node) => {
                    textCardRefs.current[object.id] = node;
                  }}
                  onSelect={(event) => {
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
                  onHandleMouseDown={(event) => {
                    event.cancelBubble = true;
                    setSelectedObjectId(object.id);
                    startDraggingTextCard(object.id);
                  }}
                  onBodyMouseDown={() => {
                    setSelectedObjectId(object.id);
                  }}
                  onBodyDoubleClick={(event) => {
                    event.cancelBubble = true;
                    startEditingTextCard(object);
                  }}
                />
              );
            }

            return (
                <TokenRenderer
                  key={object.id}
                  object={object}
                  isSelected={isSelected}
                  selectionColor={currentUserColor}
                  fillColor={getTokenFillColor(object)}
                  onHoverStart={(event) => {
                    updateObjectSemanticsHover(object, event);
                  }}
                  onHoverMove={(event) => {
                    updateObjectSemanticsHover(object, event);
                  }}
                  onHoverEnd={() => {
                    clearObjectSemanticsHover();
                  }}
                  onSelect={(event) => {
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
              />
            );
          })}

          {selectedImageObject &&
            selectedImageActionPosition &&
            !isSelectedImageLockedByAnotherParticipant && (
              <Group
                x={selectedImageActionPosition.x}
                y={selectedImageActionPosition.y}
              >
                <SmallFloatingActionButton
                  x={0}
                  y={0}
                  label={drawingImageId === selectedImageObject.id ? "Save" : "Draw"}
                  tone={
                    drawingImageId === selectedImageObject.id ? "primary" : "default"
                  }
                  onClick={() => {
                    if (drawingImageId === selectedImageObject.id) {
                      finishImageDrawingMode();
                      return;
                    }

                    startImageDrawingMode(selectedImageObject.id);
                  }}
                />

                {drawingImageId !== selectedImageObject.id &&
                  (selectedImageObject.imageStrokes?.length ?? 0) > 0 && (
                    <SmallFloatingActionButton
                      x={52}
                      y={0}
                      label="Clear"
                      tone="danger"
                      onClick={() => {
                        clearImageDrawing(selectedImageObject.id);
                      }}
                    />
                  )}
              </Group>
            )}

          <Transformer
            ref={imageTransformerRef}
            rotateEnabled={false}
            flipEnabled={false}
            borderStroke={currentUserColor}
            borderStrokeWidth={3}
            anchorStroke={currentUserColor}
            anchorFill="#f8fafc"
            anchorCornerRadius={999}
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
      </div>

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

      {isObjectInspectionEnabled && inspectedObject && objectSemanticsHoverState && (
        <div
          style={{
            position: "fixed",
            left: Math.min(
              objectSemanticsHoverState.clientX + 14,
              window.innerWidth - 250
            ),
            top: Math.min(
              objectSemanticsHoverState.clientY + 14,
              window.innerHeight - 180
            ),
            zIndex: 40,
            minWidth: 220,
            maxWidth: 240,
            display: "grid",
            gap: 6,
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(148, 163, 184, 0.24)",
            background: "rgba(15, 23, 42, 0.94)",
            color: "#e2e8f0",
            boxShadow: "0 20px 48px rgba(2, 6, 23, 0.34)",
            pointerEvents: "none",
            fontFamily: HTML_UI_FONT_FAMILY,
            fontSize: 12,
          }}
        >
          <div
            style={{
              color: "#94a3b8",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Object semantics
          </div>

          {getObjectSemanticsRows(inspectedObject).map((row) => (
            <div
              key={row.label}
              style={{
                display: "grid",
                gridTemplateColumns: "84px minmax(0, 1fr)",
                gap: 8,
                alignItems: "start",
              }}
            >
              <div style={{ color: "#94a3b8" }}>{row.label}</div>
              <div
                style={{
                  color: "#f8fafc",
                  wordBreak: "break-word",
                }}
              >
                {row.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
