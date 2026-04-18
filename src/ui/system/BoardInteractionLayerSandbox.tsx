import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from "react";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { createNoteCardObject } from "../../board/objects/noteCard/createNoteCardObject";
import {
  clampNoteCardWidth,
  getNoteCardHeightForLabel,
} from "../../board/objects/noteCard/sizing";
import { createTokenObject } from "../../board/objects/token/createTokenObject";
import { BoardStageScene } from "../../board/components/BoardStageScene";
import type { LocalObjectsChangeOptions } from "../../board/runtime/useBoardObjectRuntime";
import {
  MAX_SCALE,
  MIN_SCALE,
  SCALE_BY,
  TEXT_CARD_BODY_FONT_FAMILY,
  TEXT_CARD_BODY_FONT_SIZE,
  TEXT_CARD_BODY_INSET_X,
  TEXT_CARD_BODY_INSET_Y,
  TEXT_CARD_BODY_LINE_HEIGHT,
} from "../../board/constants";
import { resolveEffectiveImageBounds } from "../../board/images/effectiveBounds";
import {
  getBoardPointFromScreen,
  getInitialRoomViewport,
  getZoomedViewport,
} from "../../board/viewport";
import { appendImageStrokePointInObjects, clearImageStrokesByCreatorInObjects, clearImageStrokesInObjects, createImageObject, DEFAULT_IMAGE_STROKE_WIDTH } from "../../lib/boardImage";
import { updateBoardObjectLabel } from "../../lib/boardObjects";
import type { GovernedActionAccessResolution } from "../../lib/governance";
import type { ImageDrawingLock } from "../../lib/roomImagesRealtime";
import { PARTICIPANT_COLOR_OPTIONS, type LocalParticipantSession } from "../../lib/roomSession";
import type { TextCardEditingPresence, TextCardResizePresence } from "../../lib/roomTextCardsRealtime";
import type { ActiveObjectMove } from "../../lib/roomTokensRealtime";
import type { BoardObject, ImageStroke, TokenAttachment } from "../../types/board";
import { resolveBoardCanvasMaterials } from "./boardMaterials";
import { getBoardStageSelectedImageControlsViewModel } from "../../board/viewModels/boardStageInspectability";
import { boardSurfaceRecipes } from "./boardSurfaces";
import { getDesignSystemDebugAttrs } from "./debugMeta";
import { inlineTextRecipes } from "./inlineText";
import { buttonRecipes, getButtonProps } from "./families/button";
import { border, surface, text } from "./foundations";

type PointerCursor = {
  x: number;
  y: number;
} | null;

type SandboxCursorOverlayItem = {
  participantId: string;
  left: number;
  top: number;
  name: string;
  color: string;
};

type StageSize = {
  width: number;
  height: number;
};

type ViewportRect = {
  left: number;
  top: number;
};

type ResizePreviewBounds = {
  noteCardId: string;
  x: number;
  y: number;
  width: number;
  height: number;
} | null;

type LiveSelectedImageControlAnchor = {
  imageId: string;
  x: number;
  y: number;
} | null;

const LOCAL_PARTICIPANT: LocalParticipantSession = {
  id: "sandbox-local",
  name: "Local",
  color: PARTICIPANT_COLOR_OPTIONS[2] ?? "#2563eb",
};

const REMOTE_PARTICIPANT: LocalParticipantSession = {
  id: "sandbox-remote",
  name: "Remote",
  color: PARTICIPANT_COLOR_OPTIONS[5] ?? "#ea580c",
};

const SIMULATOR_HEIGHT = 840;

const shellStyle: CSSProperties = {
  ...boardSurfaceRecipes.floatingShell.shell.style,
  display: "grid",
  gap: 14,
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
};

const headerTextBlockStyle: CSSProperties = {
  display: "grid",
  gap: 6,
};

const titleStyle: CSSProperties = {
  fontSize: 18,
  lineHeight: 1.1,
  fontWeight: 700,
  color: text.primary,
};

const descriptionStyle: CSSProperties = {
  ...inlineTextRecipes.muted.style,
  fontSize: 12,
};

const splitGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const paneStyle: CSSProperties = {
  position: "relative",
  minWidth: 0,
  minHeight: SIMULATOR_HEIGHT,
  height: SIMULATOR_HEIGHT,
  overflow: "hidden",
  borderRadius: 18,
  border: `1px solid ${border.default}`,
  background: surface.panel,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

const paneHeaderStyle: CSSProperties = {
  position: "absolute",
  left: 12,
  top: 12,
  zIndex: 4,
  display: "grid",
  gap: 3,
  padding: "8px 10px",
  borderRadius: 12,
  border: `1px solid ${border.default}`,
  background: "rgba(8, 18, 38, 0.82)",
  backdropFilter: "blur(10px)",
};

const paneTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: text.primary,
  lineHeight: 1.1,
};

const paneHintStyle: CSSProperties = {
  ...inlineTextRecipes.muted.style,
  fontSize: 11,
  lineHeight: 1.15,
};

const remoteShieldStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 3,
};

const cursorOverlayShellStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 12,
};

const sampleImageSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="560" height="360" viewBox="0 0 560 360">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#10223b"/>
      <stop offset="100%" stop-color="#243b63"/>
    </linearGradient>
  </defs>
  <rect width="560" height="360" fill="url(#bg)"/>
  <circle cx="430" cy="88" r="42" fill="#f59e0b" opacity="0.92"/>
  <path d="M0 290L120 200L210 252L320 146L430 210L560 116V360H0Z" fill="#0f766e" opacity="0.9"/>
  <path d="M0 330L112 230L214 292L338 202L560 300V360H0Z" fill="#2563eb" opacity="0.82"/>
  <text x="32" y="52" fill="#f8fafc" font-family="Arial, sans-serif" font-size="28" font-weight="700">Interaction Layer</text>
  <text x="32" y="88" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="18">sandbox image object</text>
</svg>
`);

const sampleImageSrc = `data:image/svg+xml;charset=utf-8,${sampleImageSvg}`;

function createAllowedSummary(
  actionKey: GovernedActionAccessResolution["action"]["actionKey"],
  imageId: string
): GovernedActionAccessResolution {
  return {
    entity: {
      kind: "board-object",
      entityType: "image",
      entityId: imageId,
      creatorId: LOCAL_PARTICIPANT.id,
    },
    action: {
      actionKey,
      requiredAccessLevel: actionKey === "board-object.clear-all-drawing" ? "full" : "none",
    },
    effectiveAccess: {
      participantId: LOCAL_PARTICIPANT.id,
      accessLevel: "full",
    },
    isAllowed: true,
  };
}

function createInitialObjects() {
  const image = createImageObject({
    id: "sandbox-image",
    creatorId: LOCAL_PARTICIPANT.id,
    label: "Sandbox image",
    authorColor: LOCAL_PARTICIPANT.color,
    src: sampleImageSrc,
    position: { x: 2120, y: 1500 },
    size: { width: 340, height: 220 },
  });
  const note = {
    ...createNoteCardObject({
      id: "sandbox-note",
      color: LOCAL_PARTICIPANT.color,
      creatorId: LOCAL_PARTICIPANT.id,
      position: { x: 1760, y: 1450 },
    }),
    label: "Review me",
  };
  note.height = getNoteCardHeightForLabel(note.label, note.width);

  const localToken = createTokenObject({
    id: "sandbox-token-local",
    color: LOCAL_PARTICIPANT.color,
    creatorId: LOCAL_PARTICIPANT.id,
    position: { x: 1890, y: 1710 },
  });

  const remoteToken = createTokenObject({
    id: "sandbox-token-remote",
    color: REMOTE_PARTICIPANT.color,
    creatorId: REMOTE_PARTICIPANT.id,
    position: { x: 2230, y: 1690 },
  });

  return [image, note, localToken, remoteToken];
}

function updateObjectById(
  objects: BoardObject[],
  id: string,
  updater: (object: BoardObject) => BoardObject
) {
  return objects.map((object) => (object.id === id ? updater(object) : object));
}

function isPointInsideRect(
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function sortObjects(objects: BoardObject[]) {
  const order: Record<BoardObject["kind"], number> = {
    image: 0,
    "note-card": 1,
    token: 2,
  };

  return [...objects].sort((a, b) => {
    const byLayer = order[a.kind] - order[b.kind];
    return byLayer !== 0 ? byLayer : a.id.localeCompare(b.id);
  });
}

function usePaneSize(ref: MutableRefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState<StageSize>({
    width: 560,
    height: SIMULATOR_HEIGHT,
  });

  useLayoutEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const updateSize = () => {
      setSize({
        width: Math.max(280, Math.round(node.clientWidth)),
        height: Math.max(260, Math.round(node.clientHeight)),
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return size;
}

function usePaneViewportRect(ref: MutableRefObject<HTMLDivElement | null>) {
  const [rect, setRect] = useState<ViewportRect | null>(null);

  useLayoutEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const updateRect = () => {
      const nextRect = node.getBoundingClientRect();

      setRect({
        left: nextRect.left,
        top: nextRect.top,
      });
    };

    updateRect();

    const observer = new ResizeObserver(updateRect);
    observer.observe(node);
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [ref]);

  return rect;
}

function SimulatorCursorOverlay({
  cursors,
}: {
  cursors: SandboxCursorOverlayItem[];
}) {
  return (
    <div style={cursorOverlayShellStyle}>
      {cursors.map((cursor) => (
        <div
          key={cursor.participantId}
          style={{
            position: "absolute",
            left: cursor.left,
            top: cursor.top,
            display: "flex",
            alignItems: "center",
            gap: 8,
            transform: "translate(-6px, -6px)",
            pointerEvents: "none",
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
              maxWidth: 140,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              padding: "3px 8px",
              borderRadius: 999,
              background: "rgba(15, 23, 42, 0.92)",
              color: "#f8fafc",
              boxShadow: "0 8px 24px rgba(2, 6, 23, 0.28)",
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.2,
              border: `1px solid ${cursor.color}`,
            }}
            title={cursor.name}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BoardInteractionLayerSandbox() {
  const initialObjects = useMemo(() => createInitialObjects(), []);
  const initialViewport = useMemo(
    () => getInitialRoomViewport(640, SIMULATOR_HEIGHT),
    []
  );
  const [sharedObjects, setSharedObjects] = useState<BoardObject[]>(initialObjects);
  const [localObjects, setLocalObjects] = useState<BoardObject[]>(initialObjects);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [stagePosition, setStagePosition] = useState<{ x: number; y: number }>(() => ({
    x: initialViewport.x,
    y: initialViewport.y,
  }));
  const [stageScale, setStageScale] = useState(initialViewport.scale);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [drawingImageId, setDrawingImageId] = useState<string | null>(null);
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [transformingImageId, setTransformingImageId] = useState<string | null>(null);
  const [editingTextCardId, setEditingTextCardId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [editingOriginal, setEditingOriginal] = useState("");
  const [liveSelectedImageControlAnchor, setLiveSelectedImageControlAnchor] =
    useState<LiveSelectedImageControlAnchor>(null);
  const [localCursor, setLocalCursor] = useState<PointerCursor>(null);
  const [remoteCursor, setRemoteCursor] = useState<PointerCursor>(null);
  const [remoteImagePreviewPositions, setRemoteImagePreviewPositions] = useState<
    Record<string, { x: number; y: number; width?: number; height?: number; participantColor?: string }>
  >({});
  const [localImageDrawingLock, setLocalImageDrawingLock] = useState<ImageDrawingLock | null>(null);
  const [activeLocalTokenMove, setActiveLocalTokenMove] = useState<ActiveObjectMove | null>(null);
  const [activeTextCardEditingState, setActiveTextCardEditingState] =
    useState<TextCardEditingPresence | null>(null);
  const [activeTextCardResizeState, setActiveTextCardResizeState] =
    useState<TextCardResizePresence | null>(null);
  const [liveNoteCardResizePreview, setLiveNoteCardResizePreview] =
    useState<ResizePreviewBounds>(null);
  const [isLocalPaneHovered, setIsLocalPaneHovered] = useState(false);
  const [isRemotePaneHovered, setIsRemotePaneHovered] = useState(false);

  const localOuterRef = useRef<HTMLDivElement | null>(null);
  const remoteOuterRef = useRef<HTMLDivElement | null>(null);
  const localStageWrapperRef = useRef<HTMLDivElement | null>(null);
  const remoteStageWrapperRef = useRef<HTMLDivElement | null>(null);
  const localBoardBackgroundRef = useRef<Konva.Rect | null>(null);
  const remoteBoardBackgroundRef = useRef<Konva.Rect | null>(null);
  const localNoteCardRefs = useRef<Record<string, Konva.Group | null>>({});
  const remoteNoteCardRefs = useRef<Record<string, Konva.Group | null>>({});
  const localImageRefs = useRef<Record<string, Konva.Image | null>>({});
  const remoteImageRefs = useRef<Record<string, Konva.Image | null>>({});
  const localImageStrokeLayerRefs = useRef<Record<string, Konva.Group | null>>({});
  const remoteImageStrokeLayerRefs = useRef<Record<string, Konva.Group | null>>({});
  const localNoteCardTransformerRef = useRef<Konva.Transformer | null>(null);
  const localImageTransformerRef = useRef<Konva.Transformer | null>(null);
  const remoteNoteCardTransformerRef = useRef<Konva.Transformer | null>(null);
  const remoteImageTransformerRef = useRef<Konva.Transformer | null>(null);
  const localTransformingImageSnapshotRef = useRef<Record<string, BoardObject>>({});
  const remoteTransformingImageSnapshotRef = useRef<Record<string, BoardObject>>({});
  const liveNoteCardResizePreviewRef = useRef<ResizePreviewBounds>(null);
  const panStateRef = useRef<{
    startPointerX: number;
    startPointerY: number;
    startStageX: number;
    startStageY: number;
  } | null>(null);
  const activeImageStrokeRef = useRef<{
    imageId: string;
    strokeIndex: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const localStageSize = usePaneSize(localOuterRef);
  const remoteStageSize = usePaneSize(remoteOuterRef);
  const localPaneViewportRect = usePaneViewportRect(localOuterRef);
  const remotePaneViewportRect = usePaneViewportRect(remoteOuterRef);
  const localStageViewportRect = usePaneViewportRect(localStageWrapperRef);
  const remoteStageViewportRect = usePaneViewportRect(remoteStageWrapperRef);

  const boardMaterials = useMemo(() => resolveBoardCanvasMaterials(), []);
  const sortedLocalObjects = useMemo(() => sortObjects(localObjects), [localObjects]);
  const sortedSharedObjects = useMemo(() => sortObjects(sharedObjects), [sharedObjects]);
  const noopMouseStageHandler = useCallback(() => {}, []);
  const noopTouchStageHandler = useCallback(() => {}, []);
  const noopWheelStageHandler = useCallback(() => {}, []);

  useEffect(() => {
    const image = new window.Image();
    image.onload = () => {
      setLoadedImages((current) => ({
        ...current,
        [sampleImageSrc]: image,
      }));
    };
    image.src = sampleImageSrc;
  }, []);

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
    const transformer = localNoteCardTransformerRef.current;

    if (!transformer) {
      return;
    }

    const selectedNoteCardNode =
      selectedObjectId && !editingTextCardId
        ? localNoteCardRefs.current[selectedObjectId] ?? null
        : null;

    transformer.nodes(selectedNoteCardNode ? [selectedNoteCardNode] : []);
    transformer.getLayer()?.batchDraw();
  }, [editingTextCardId, selectedObjectId]);

  useEffect(() => {
    const transformer = localImageTransformerRef.current;

    if (!transformer) {
      return;
    }

    const selectedImageNode =
      selectedObjectId &&
      !editingTextCardId &&
      drawingImageId !== selectedObjectId
        ? localImageRefs.current[selectedObjectId] ?? null
        : null;

    transformer.nodes(selectedImageNode ? [selectedImageNode] : []);
    transformer.getLayer()?.batchDraw();
  }, [drawingImageId, editingTextCardId, selectedObjectId]);

  const getObjectById = useCallback(
    (objects: BoardObject[], objectId: string) =>
      objects.find((candidate) => candidate.id === objectId) ?? null,
    []
  );

  const getImageById = useCallback(
    (objects: BoardObject[], objectId: string) => {
      const object = getObjectById(objects, objectId);
      return object?.kind === "image" ? object : null;
    },
    [getObjectById]
  );

  const getEffectiveImageBoundsForImageId = useCallback(
    (
      objects: BoardObject[],
      refs: MutableRefObject<Record<string, Konva.Image | null>>,
      objectId: string,
      isLocallyInteracting: boolean
    ) => {
      const image = getImageById(objects, objectId);

      if (!image) {
        return null;
      }

      return resolveEffectiveImageBounds({
        committedImage: image,
        localNode: refs.current[objectId],
        isLocallyInteracting,
        sharedPreview: remoteImagePreviewPositions[objectId] ?? null,
      });
    },
    [getImageById, remoteImagePreviewPositions]
  );

  const getTokenAttachment = useCallback(
    (object: BoardObject): TokenAttachment =>
      object.kind === "token" && object.tokenAttachment
        ? object.tokenAttachment
        : { mode: "free" },
    []
  );

  const getTokenAnchorPosition = useCallback(
    (
      objects: BoardObject[],
      refs: MutableRefObject<Record<string, Konva.Image | null>>,
      object: BoardObject,
      isLocalScene: boolean
    ) => {
      const attachment = getTokenAttachment(object);

      if (object.kind !== "token" || attachment.mode !== "attached") {
        return { x: object.x, y: object.y };
      }

      if (attachment.parentObjectKind !== "image") {
        return { x: object.x, y: object.y };
      }

      const parentImage = getEffectiveImageBoundsForImageId(
        objects,
        refs,
        attachment.parentObjectId,
        isLocalScene &&
          (draggingImageId === attachment.parentObjectId ||
            transformingImageId === attachment.parentObjectId)
      );

      if (!parentImage) {
        return { x: object.x, y: object.y };
      }

      return {
        x: parentImage.x + parentImage.width * attachment.anchor.x,
        y: parentImage.y + parentImage.height * attachment.anchor.y,
      };
    },
    [
      draggingImageId,
      getEffectiveImageBoundsForImageId,
      getTokenAttachment,
      transformingImageId,
    ]
  );

  const commitObjectUpdate = useCallback(
    (updater: (current: BoardObject[]) => BoardObject[]) => {
      setLocalObjects((current) => {
        const nextObjects = updater(current);
        setSharedObjects(nextObjects);
        return nextObjects;
      });
    },
    []
  );

  const updateLocalObjects = useCallback((updater: (current: BoardObject[]) => BoardObject[]) => {
    setLocalObjects((current) => updater(current));
  }, []);

  const updateObjectLabel = useCallback((id: string, label: string) => {
    commitObjectUpdate((current) =>
      updateBoardObjectLabel(current, id, label)
    );
  }, [commitObjectUpdate]);

  const resizeTextCardBounds = useCallback(
    (
      id: string,
      nextBounds: {
        x: number;
        y: number;
        width: number;
        height: number;
      }
    ) => {
      commitObjectUpdate((current) =>
        updateObjectById(current, id, (object) => {
          if (object.kind !== "note-card") {
            return object;
          }

          const width = clampNoteCardWidth(nextBounds.width);
          const textFitHeight = getNoteCardHeightForLabel(object.label, width);
          const height = Math.max(Math.round(nextBounds.height), textFitHeight);

          return {
            ...object,
            x: nextBounds.x,
            y: nextBounds.y,
            width,
            height,
          };
        })
      );
    },
    [commitObjectUpdate]
  );

  const clearLocalImagePreview = useCallback((imageId: string) => {
    setRemoteImagePreviewPositions((current) => {
      if (!current[imageId]) {
        return current;
      }

      const next = { ...current };
      delete next[imageId];
      return next;
    });
  }, []);

  const updateLocalObjectPosition = useCallback(
    (id: string, x: number, y: number, localOptions?: LocalObjectsChangeOptions) => {
      const updater = (current: BoardObject[]) =>
        updateObjectById(current, id, (object) => ({ ...object, x, y }));

      if (
        localOptions?.commitBoundary === "image-drag-end" ||
        localOptions?.commitBoundary === "note-drag-end"
      ) {
        clearLocalImagePreview(id);
        commitObjectUpdate(updater);
        return;
      }

      const movedObject = getObjectById(localObjects, id);

      if (movedObject?.kind === "note-card") {
        commitObjectUpdate(updater);
        return;
      }

      updateLocalObjects(updater);
    },
    [
      clearLocalImagePreview,
      commitObjectUpdate,
      getObjectById,
      localObjects,
      updateLocalObjects,
    ]
  );

  const syncImageStrokeLayerPosition = useCallback((id: string, x: number, y: number) => {
    const strokeLayer = localImageStrokeLayerRefs.current[id];

    if (!strokeLayer) {
      return;
    }

    strokeLayer.position({ x, y });
    strokeLayer.getLayer()?.batchDraw();
  }, []);

  const syncImageStrokeLayerTransform = useCallback(
    (id: string, x: number, y: number, scaleX: number, scaleY: number) => {
      const strokeLayer = localImageStrokeLayerRefs.current[id];

      if (!strokeLayer) {
        return;
      }

      strokeLayer.position({ x, y });
      strokeLayer.scale({ x: scaleX, y: scaleY });
      strokeLayer.getLayer()?.batchDraw();
    },
    []
  );

  const publishImageTransformPreview = useCallback((node: Konva.Image, snapshot: BoardObject) => {
    if (snapshot.kind !== "image") {
      return;
    }

    const bounds = node.getClientRect({
      skipShadow: true,
      skipStroke: true,
      relativeTo: node.getLayer() ?? undefined,
    });

    setRemoteImagePreviewPositions((current) => ({
      ...current,
      [snapshot.id]: {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        participantColor: LOCAL_PARTICIPANT.color,
      },
    }));
  }, []);

  const previewImagePosition = useCallback((id: string, x: number, y: number) => {
    updateLocalObjectPosition(id, x, y);
    setRemoteImagePreviewPositions((current) => ({
      ...current,
      [id]: {
        x,
        y,
        participantColor: LOCAL_PARTICIPANT.color,
      },
    }));
  }, [updateLocalObjectPosition]);

  const getImageDrawingLockForRemote = useCallback(
    (imageId: string) =>
      localImageDrawingLock?.imageId === imageId ? localImageDrawingLock : null,
    [localImageDrawingLock]
  );

  const startImageDrawingMode = useCallback((imageId: string) => {
    setSelectedObjectId(imageId);
    setDrawingImageId(imageId);
    setLocalImageDrawingLock({
      imageId,
      participantId: LOCAL_PARTICIPANT.id,
      participantName: LOCAL_PARTICIPANT.name,
      participantColor: LOCAL_PARTICIPANT.color,
    });
  }, []);

  const clearActiveImageStrokeSession = useCallback(() => {
    activeImageStrokeRef.current = null;
  }, []);

  const endImageStroke = useCallback(() => {
    const activeStroke = activeImageStrokeRef.current;

    if (!activeStroke) {
      return;
    }

    setSharedObjects(localObjects);
    clearActiveImageStrokeSession();
  }, [clearActiveImageStrokeSession, localObjects]);

  const finishImageDrawingMode = useCallback(() => {
    const activeImageId = drawingImageId;
    endImageStroke();
    setDrawingImageId(null);
    setLocalImageDrawingLock(null);
    if (activeImageId) {
      clearLocalImagePreview(activeImageId);
    }
  }, [clearLocalImagePreview, drawingImageId, endImageStroke]);

  const startImageStroke = useCallback(
    (id: string, point: { x: number; y: number }, color: string) => {
      setLocalObjects((current) =>
        updateObjectById(current, id, (object) => {
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
                creatorId: LOCAL_PARTICIPANT.id,
                points: [point.x, point.y],
                width: DEFAULT_IMAGE_STROKE_WIDTH,
              },
            ],
          };
        })
      );
    },
    []
  );

  const appendStrokePoint = useCallback((imageId: string, point: { x: number; y: number }) => {
    const activeStroke = activeImageStrokeRef.current;

    if (!activeStroke || activeStroke.imageId !== imageId) {
      return;
    }

    setLocalObjects((current) =>
      appendImageStrokePointInObjects(current, imageId, activeStroke.strokeIndex, point)
    );
  }, []);

  const resizeImageObject = useCallback(
    (
      id: string,
      nextBounds: { x: number; y: number; width: number; height: number },
      scale: { x: number; y: number },
      strokeWidthScale: number
    ) => {
      clearLocalImagePreview(id);
      commitObjectUpdate((current) =>
        updateObjectById(current, id, (object) => {
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
              points: stroke.points.map((value, index) =>
                index % 2 === 0 ? value * scale.x : value * scale.y
              ),
              width:
                (stroke.width ?? DEFAULT_IMAGE_STROKE_WIDTH) * strokeWidthScale,
            })),
          };
        })
      );
    },
    [clearLocalImagePreview, commitObjectUpdate]
  );

  const clearImageDrawing = useCallback((id: string) => {
    commitObjectUpdate((current) => clearImageStrokesInObjects(current, id));
  }, [commitObjectUpdate]);

  const clearOwnImageDrawing = useCallback((id: string) => {
    commitObjectUpdate((current) =>
      clearImageStrokesByCreatorInObjects(current, id, LOCAL_PARTICIPANT.id)
    );
  }, [commitObjectUpdate]);

  const selectBoardObject = useCallback(
    (
      object:
        | BoardObject
        | {
            id: string;
            kind: BoardObject["kind"];
          }
        | null
    ) => {
      if (!object || object.kind === "token") {
        if (drawingImageId) {
          finishImageDrawingMode();
        }
        setSelectedObjectId(null);
        return;
      }

      if (drawingImageId && drawingImageId !== object.id) {
        finishImageDrawingMode();
      }

      setSelectedObjectId(object.id);
    },
    [drawingImageId, finishImageDrawingMode]
  );

  const getLocalObjectById = useCallback(
    (objectId: string) => getObjectById(localObjects, objectId),
    [getObjectById, localObjects]
  );

  const createAttachedTokenAttachment = useCallback(
    (image: BoardObject, point: { x: number; y: number }): TokenAttachment => ({
      mode: "attached",
      parentObjectId: image.id,
      parentObjectKind: "image",
      coordinateSpace: "parent-normalized",
      anchor: {
        x: image.width > 0 ? (point.x - image.x) / image.width : 0.5,
        y: image.height > 0 ? (point.y - image.y) / image.height : 0.5,
      },
    }),
    []
  );

  const updateTokenPlacementAfterDrop = useCallback((id: string, point: { x: number; y: number }) => {
    commitObjectUpdate((current) =>
      updateObjectById(current, id, (object) => {
        if (object.kind !== "token") {
          return object;
        }

        const attachmentTarget = current
          .filter((candidate) => candidate.kind === "image")
          .slice()
          .reverse()
          .find((candidate) => {
            const withinX =
              point.x >= candidate.x && point.x <= candidate.x + candidate.width;
            const withinY =
              point.y >= candidate.y && point.y <= candidate.y + candidate.height;
            return withinX && withinY;
          });

        if (!attachmentTarget) {
          return {
            ...object,
            x: point.x,
            y: point.y,
            tokenAttachment: { mode: "free" },
          };
        }

        return {
          ...object,
          x: point.x,
          y: point.y,
          tokenAttachment: createAttachedTokenAttachment(attachmentTarget, point),
        };
      })
    );
  }, [commitObjectUpdate, createAttachedTokenAttachment]);

  const updateTokenAnchorPosition = useCallback((id: string, x: number, y: number) => {
    commitObjectUpdate((current) =>
      updateObjectById(current, id, (object) =>
        object.kind !== "token"
          ? object
          : {
              ...object,
              x,
              y,
              tokenAttachment: { mode: "free" },
            }
      )
    );
  }, [commitObjectUpdate]);

  const getBlockingActiveMoveForRemote = useCallback(
    (objectId: string) =>
      activeLocalTokenMove?.objectId === objectId ? activeLocalTokenMove : null,
    [activeLocalTokenMove]
  );

  const getSelectedImageObject = useMemo(
    () => (selectedObjectId ? getLocalObjectById(selectedObjectId) : null),
    [getLocalObjectById, selectedObjectId]
  );

  const selectedImageObject =
    getSelectedImageObject?.kind === "image" ? getSelectedImageObject : null;

  const selectedImageControlsViewModel = useMemo(
    () => {
      const selectedImageEffectiveBounds = selectedImageObject
        ? {
            x: selectedImageObject.x,
            y: selectedImageObject.y,
            width: selectedImageObject.width,
            height: selectedImageObject.height,
          }
        : null;

      return getBoardStageSelectedImageControlsViewModel({
        selectedImageObject,
        selectedImageEffectiveBounds,
        liveSelectedImageControlAnchor,
        isSelectedImageLocallyInteracting:
          !!selectedImageObject &&
          (draggingImageId === selectedImageObject.id ||
            transformingImageId === selectedImageObject.id),
        drawingImageId,
        participantColor: LOCAL_PARTICIPANT.color,
        governanceSelectedImageClearSummary: selectedImageObject
          ? createAllowedSummary(
              "board-object.clear-all-drawing",
              selectedImageObject.id
            )
          : null,
        governanceSelectedImageClearOwnSummary: selectedImageObject
          ? createAllowedSummary(
              "board-object.clear-own-drawing",
              selectedImageObject.id
            )
          : null,
      });
    },
    [
      drawingImageId,
      draggingImageId,
      liveSelectedImageControlAnchor,
      selectedImageObject,
      transformingImageId,
    ]
  );

  const localEditingTextCard =
    editingTextCardId && getLocalObjectById(editingTextCardId)?.kind === "note-card"
      ? (getLocalObjectById(editingTextCardId) as BoardObject)
      : null;

  const editingTextCardDisplayHeight = localEditingTextCard
    ? Math.max(
        liveNoteCardResizePreview?.noteCardId === localEditingTextCard.id
          ? liveNoteCardResizePreview.height
          : localEditingTextCard.height,
        getNoteCardHeightForLabel(
          editingDraft,
          liveNoteCardResizePreview?.noteCardId === localEditingTextCard.id
            ? liveNoteCardResizePreview.width
            : localEditingTextCard.width
        )
      )
    : null;

  const editingTextareaStyle = useMemo<CSSProperties | null>(() => {
    if (!localEditingTextCard || !localStageViewportRect) {
      return null;
    }

    const previewBounds =
      liveNoteCardResizePreview?.noteCardId === localEditingTextCard.id
        ? liveNoteCardResizePreview
        : {
            x: localEditingTextCard.x,
            y: localEditingTextCard.y,
            width: localEditingTextCard.width,
            height: localEditingTextCard.height,
          };

    return {
      position: "absolute",
      left:
        stagePosition.x +
        (previewBounds.x + TEXT_CARD_BODY_INSET_X) * stageScale,
      top:
        stagePosition.y +
        (previewBounds.y + TEXT_CARD_BODY_INSET_Y) * stageScale,
      width: Math.max((previewBounds.width - TEXT_CARD_BODY_INSET_X * 2) * stageScale, 40),
      height: Math.max(
        ((editingTextCardDisplayHeight ?? previewBounds.height) - TEXT_CARD_BODY_INSET_Y * 2) *
          stageScale,
        32
      ),
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
      fontFamily: TEXT_CARD_BODY_FONT_FAMILY,
      fontSize: TEXT_CARD_BODY_FONT_SIZE * stageScale,
      fontWeight: "normal",
      lineHeight: String(TEXT_CARD_BODY_LINE_HEIGHT),
      color: localEditingTextCard.textColor ?? "#0f172a",
      background: "transparent",
      caretColor: localEditingTextCard.textColor ?? "#0f172a",
      boxSizing: "border-box",
      whiteSpace: "pre-wrap",
      zIndex: 4,
    };
  }, [
    editingTextCardDisplayHeight,
    localEditingTextCard,
    localStageViewportRect,
    liveNoteCardResizePreview,
    stagePosition.x,
    stagePosition.y,
    stageScale,
  ]);

  const updateLiveSelectedImageControlAnchor = useCallback((imageId: string, node: Konva.Image) => {
    const bounds = node.getClientRect({
      skipShadow: true,
      skipStroke: true,
      relativeTo: node.getLayer() ?? undefined,
    });

    setLiveSelectedImageControlAnchor({
      imageId,
      x: bounds.x,
      y: bounds.y,
    });
  }, []);

  const scheduleNoteCardResizePreviewRender = useCallback(() => {
    setLiveNoteCardResizePreview(liveNoteCardResizePreviewRef.current);
  }, []);

  const clearLiveNoteCardResizePreviewSession = useCallback(() => {
    liveNoteCardResizePreviewRef.current = null;
  }, []);

  const startEditingTextCard = useCallback((object: BoardObject) => {
    selectBoardObject(object);
    setEditingTextCardId(object.id);
    setEditingDraft(object.label);
    setEditingOriginal(object.label);
    setActiveTextCardEditingState({
      textCardId: object.id,
      participantId: LOCAL_PARTICIPANT.id,
      participantName: LOCAL_PARTICIPANT.name,
      participantColor: LOCAL_PARTICIPANT.color,
    });
  }, [selectBoardObject]);

  const stopEditingTextCard = useCallback(() => {
    setEditingTextCardId(null);
    setEditingDraft("");
    setEditingOriginal("");
    setActiveTextCardEditingState(null);
  }, []);

  const saveEditingTextCard = useCallback(() => {
    if (!editingTextCardId) {
      return;
    }

    updateObjectLabel(editingTextCardId, editingDraft);
    stopEditingTextCard();
  }, [editingDraft, editingTextCardId, stopEditingTextCard, updateObjectLabel]);

  const cancelEditingTextCard = useCallback(() => {
    setEditingDraft(editingOriginal);
    stopEditingTextCard();
  }, [editingOriginal, stopEditingTextCard]);

  const getLocalNoteAtScreenPoint = useCallback(
    (clientX: number, clientY: number) => {
      const containerRect = localStageWrapperRef.current?.getBoundingClientRect();

      if (!containerRect) {
        return null;
      }

      const boardPoint = getBoardPointFromScreen({
        clientX,
        clientY,
        containerLeft: containerRect.left,
        containerTop: containerRect.top,
        stageX: stagePosition.x,
        stageY: stagePosition.y,
        stageScale,
      });

      return [...sortedLocalObjects]
        .reverse()
        .find(
          (object) =>
            object.kind === "note-card" &&
            isPointInsideRect(boardPoint, {
              x: object.x,
              y: object.y,
              width: object.width,
              height: object.height,
            })
        ) ?? null;
    },
    [
      sortedLocalObjects,
      stagePosition.x,
      stagePosition.y,
      stageScale,
    ]
  );

  const handleLocalNoteDoubleClick = useCallback(
    (target: EventTarget | null, clientX: number, clientY: number) => {
      const targetNode = target instanceof Node ? target : null;

      if (!targetNode || !localStageWrapperRef.current?.contains(targetNode)) {
        return;
      }

      const targetNote = getLocalNoteAtScreenPoint(clientX, clientY);

      if (!targetNote) {
        return;
      }

      if (!editingTextCardId) {
        startEditingTextCard(targetNote);
      }
    },
    [editingTextCardId, getLocalNoteAtScreenPoint, startEditingTextCard]
  );

  useEffect(() => {
    const localPane = localOuterRef.current;

    if (!localPane) {
      return;
    }

    const handleDoubleClickCapture = (event: MouseEvent) => {
      handleLocalNoteDoubleClick(event.target, event.clientX, event.clientY);
    };

    localPane.addEventListener("dblclick", handleDoubleClickCapture, true);

    return () => {
      localPane.removeEventListener("dblclick", handleDoubleClickCapture, true);
    };
  }, [handleLocalNoteDoubleClick]);

  const updatePaneCursor = useCallback(
    (
      point: { clientX: number; clientY: number },
      targetRef: MutableRefObject<HTMLDivElement | null>,
      setCursor: (value: PointerCursor) => void
    ) => {
      const containerRect = targetRef.current?.getBoundingClientRect();

      if (!containerRect) {
        return;
      }

      setCursor(
        getBoardPointFromScreen({
          clientX: point.clientX,
          clientY: point.clientY,
          containerLeft: containerRect.left,
          containerTop: containerRect.top,
          stageX: stagePosition.x,
          stageY: stagePosition.y,
          stageScale,
        })
      );
    },
    [stagePosition.x, stagePosition.y, stageScale]
  );

  const localStageOffset = useMemo(
    () =>
      localStageViewportRect && localPaneViewportRect
        ? {
            left: localStageViewportRect.left - localPaneViewportRect.left,
            top: localStageViewportRect.top - localPaneViewportRect.top,
          }
        : null,
    [localPaneViewportRect, localStageViewportRect]
  );

  const remoteStageOffset = useMemo(
    () =>
      remoteStageViewportRect && remotePaneViewportRect
        ? {
            left: remoteStageViewportRect.left - remotePaneViewportRect.left,
            top: remoteStageViewportRect.top - remotePaneViewportRect.top,
          }
        : null,
    [remotePaneViewportRect, remoteStageViewportRect]
  );

  const localCursorOverlays = useMemo<SandboxCursorOverlayItem[]>(
    () =>
      isRemotePaneHovered && remoteCursor && localStageOffset
        ? [
            {
              participantId: REMOTE_PARTICIPANT.id,
              left:
                localStageOffset.left +
                stagePosition.x +
                remoteCursor.x * stageScale,
              top:
                localStageOffset.top +
                stagePosition.y +
                remoteCursor.y * stageScale,
              name: REMOTE_PARTICIPANT.name,
              color: REMOTE_PARTICIPANT.color,
            },
          ]
        : [],
    [
      isRemotePaneHovered,
      localStageOffset,
      remoteCursor,
      stagePosition.x,
      stagePosition.y,
      stageScale,
    ]
  );

  const remoteCursorOverlays = useMemo<SandboxCursorOverlayItem[]>(
    () =>
      isLocalPaneHovered && localCursor && remoteStageOffset
        ? [
            {
              participantId: LOCAL_PARTICIPANT.id,
              left:
                remoteStageOffset.left +
                stagePosition.x +
                localCursor.x * stageScale,
              top:
                remoteStageOffset.top +
                stagePosition.y +
                localCursor.y * stageScale,
              name: LOCAL_PARTICIPANT.name,
              color: LOCAL_PARTICIPANT.color,
            },
          ]
        : [],
    [
      isLocalPaneHovered,
      localCursor,
      remoteStageOffset,
      stagePosition.x,
      stagePosition.y,
      stageScale,
    ]
  );

  const handleLocalStageMouseDown = useCallback(
    (event: KonvaEventObject<MouseEvent>) => {
      const stage = event.target.getStage();
      const pointer = stage?.getPointerPosition();
      const clickedOnEmptyStage =
        event.target === stage || event.target === localBoardBackgroundRef.current;

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
        startPointerX: pointer.x,
        startPointerY: pointer.y,
        startStageX: stagePosition.x,
        startStageY: stagePosition.y,
      };
    },
    [drawingImageId, finishImageDrawingMode, stagePosition.x, stagePosition.y]
  );

  const handleLocalStageMouseMove = useCallback(
    (event: KonvaEventObject<MouseEvent>) => {
      updatePaneCursor(event.evt, localStageWrapperRef, setLocalCursor);
      const pointer = event.target.getStage()?.getPointerPosition();
      const panState = panStateRef.current;

      if (!panState || !pointer) {
        return;
      }

      setStagePosition({
        x: panState.startStageX + (pointer.x - panState.startPointerX),
        y: panState.startStageY + (pointer.y - panState.startPointerY),
      });
    },
    [updatePaneCursor]
  );

  const handleLocalStageMouseUp = useCallback(() => {
    panStateRef.current = null;
    endImageStroke();
  }, [endImageStroke]);

  const handleLocalStageWheel = useCallback(
    (event: KonvaEventObject<WheelEvent>) => {
      event.evt.preventDefault();

      const pointer = event.target.getStage()?.getPointerPosition();

      if (!pointer) {
        return;
      }

      const direction = event.evt.deltaY > 0 ? -1 : 1;
      const nextScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, direction > 0 ? stageScale * SCALE_BY : stageScale / SCALE_BY)
      );

      setStagePosition(
        getZoomedViewport({
          pointerX: pointer.x,
          pointerY: pointer.y,
          stageX: stagePosition.x,
          stageY: stagePosition.y,
          oldScale: stageScale,
          newScale: nextScale,
        })
      );
      setStageScale(nextScale);
    },
    [stagePosition.x, stagePosition.y, stageScale]
  );

  const handleSelectedImageControlClick = useCallback(
    (buttonKey: string, imageId: string) => {
      if (buttonKey === "draw") {
        if (drawingImageId === imageId) {
          finishImageDrawingMode();
          return;
        }

        startImageDrawingMode(imageId);
        return;
      }

      if (buttonKey === "clear-own") {
        clearOwnImageDrawing(imageId);
        return;
      }

      if (buttonKey === "clear-all") {
        clearImageDrawing(imageId);
      }
    },
    [
      clearImageDrawing,
      clearOwnImageDrawing,
      drawingImageId,
      finishImageDrawingMode,
      startImageDrawingMode,
    ]
  );

  const handleResetBoard = useCallback(() => {
    const nextObjects = createInitialObjects();
    const nextViewport = getInitialRoomViewport(localStageSize.width, localStageSize.height);

    setSharedObjects(nextObjects);
    setLocalObjects(nextObjects);
    setStagePosition({ x: nextViewport.x, y: nextViewport.y });
    setStageScale(nextViewport.scale);
    setSelectedObjectId(null);
    setDrawingImageId(null);
    setDraggingImageId(null);
    setTransformingImageId(null);
    setEditingTextCardId(null);
    setEditingDraft("");
    setEditingOriginal("");
    setLiveSelectedImageControlAnchor(null);
    setLocalCursor(null);
    setRemoteCursor(null);
    setRemoteImagePreviewPositions({});
    setLocalImageDrawingLock(null);
    setActiveLocalTokenMove(null);
    setActiveTextCardEditingState(null);
    setActiveTextCardResizeState(null);
    setLiveNoteCardResizePreview(null);
    setIsLocalPaneHovered(false);
    setIsRemotePaneHovered(false);
    clearActiveImageStrokeSession();
    clearLiveNoteCardResizePreviewSession();
    panStateRef.current = null;
  }, [
    clearActiveImageStrokeSession,
    clearLiveNoteCardResizePreviewSession,
    localStageSize.height,
    localStageSize.width,
  ]);

  const resetButtonProps = getButtonProps(buttonRecipes.secondary.compact);

  return (
    <section
      style={shellStyle}
      {...getDesignSystemDebugAttrs(boardSurfaceRecipes.floatingShell.shell.debug)}
    >
      <div style={headerStyle}>
        <div style={headerTextBlockStyle}>
          <div style={titleStyle}>Board interaction layer simulator</div>
          <div style={descriptionStyle}>
            Shared-camera review harness for the current board interaction layer. Left
            pane is the local interactive session. Right pane is the remote-facing
            preview of the same camera and shared objects.
          </div>
        </div>
        <button
          type="button"
          {...resetButtonProps}
          onClick={handleResetBoard}
        >
          Reset board
        </button>
      </div>

      <div style={splitGridStyle}>
        <div
          ref={localOuterRef}
          style={paneStyle}
          onMouseMove={(event) => {
            updatePaneCursor(event, localStageWrapperRef, setLocalCursor);
          }}
          onMouseEnter={() => {
            setIsLocalPaneHovered(true);
          }}
          onMouseLeave={() => {
            setIsLocalPaneHovered(false);
            setLocalCursor(null);
          }}
        >
          <div style={paneHeaderStyle}>
            <div style={paneTitleStyle}>Local session</div>
            <div style={paneHintStyle}>
              Local interactive pass for image controls, token behavior, and basic
              note-card affordances.
            </div>
          </div>

          {editingTextCardId && editingTextareaStyle ? (
            <textarea
              ref={textareaRef}
              value={editingDraft}
              onChange={(event) => {
                setEditingDraft(event.target.value);
              }}
              onBlur={() => {
                saveEditingTextCard();
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelEditingTextCard();
                  return;
                }

                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  saveEditingTextCard();
                }
              }}
              style={editingTextareaStyle}
            />
          ) : null}

          <SimulatorCursorOverlay cursors={localCursorOverlays} />

          <BoardStageScene
            stageWrapperRef={localStageWrapperRef}
            stageSize={localStageSize}
            stagePosition={stagePosition}
            stageScale={stageScale}
            participantSession={LOCAL_PARTICIPANT}
            boardBackgroundRef={localBoardBackgroundRef}
            noteCardRefs={localNoteCardRefs}
            imageRefs={localImageRefs}
            imageStrokeLayerRefs={localImageStrokeLayerRefs}
            noteCardTransformerRef={localNoteCardTransformerRef}
            imageTransformerRef={localImageTransformerRef}
            liveNoteCardResizePreviewRef={liveNoteCardResizePreviewRef}
            transformingImageSnapshotRef={localTransformingImageSnapshotRef}
            boardSurfaceFill={boardMaterials.surface}
            boardSurfaceRadius={boardMaterials.surfaceRadius}
            sortedObjects={sortedLocalObjects}
            loadedImages={loadedImages}
            drawingImageId={drawingImageId}
            draggingImageId={draggingImageId}
            transformingImageId={transformingImageId}
            editingTextCardId={editingTextCardId}
            editingTextCardDisplayHeight={editingTextCardDisplayHeight}
            remoteImagePreviewPositions={{}}
            remoteTextCardEditingStates={{}}
            remoteTextCardResizeStates={{}}
            selectedImageObject={selectedImageObject}
            selectedImageControlAnchor={
              selectedImageControlsViewModel.selectedImageControlAnchor
            }
            selectedImageControlButtons={
              selectedImageControlsViewModel.selectedImageControlButtons
            }
            isSelectedImageLockedByAnotherParticipant={false}
            onStageMouseDown={handleLocalStageMouseDown}
            onStageMouseMove={handleLocalStageMouseMove}
            onStageMouseUp={handleLocalStageMouseUp}
            onStageMouseLeave={handleLocalStageMouseUp}
            onStageTouchStart={noopTouchStageHandler}
            onStageTouchMove={noopTouchStageHandler}
            onStageTouchEnd={handleLocalStageMouseUp}
            onStageWheel={handleLocalStageWheel}
            onBoardBackgroundMouseDown={() => {
              if (drawingImageId) {
                finishImageDrawingMode();
              }
              setSelectedObjectId(null);
            }}
            updateObjectSemanticsHover={() => {}}
            clearObjectSemanticsHover={() => {}}
            getImageDrawingLock={() => null}
            finishImageDrawingMode={finishImageDrawingMode}
            selectBoardObject={selectBoardObject}
            startImageStroke={startImageStroke}
            appendStrokePoint={appendStrokePoint}
            endImageStroke={endImageStroke}
            updateLiveSelectedImageControlAnchor={updateLiveSelectedImageControlAnchor}
            syncImageStrokeLayerPosition={syncImageStrokeLayerPosition}
            syncImageStrokeLayerTransform={syncImageStrokeLayerTransform}
            previewImagePosition={previewImagePosition}
            updateObjectPosition={updateLocalObjectPosition}
            setDraggingImageId={setDraggingImageId}
            setTransformingImageId={setTransformingImageId}
            resizeImageObject={resizeImageObject}
            publishImageTransformPreview={publishImageTransformPreview}
            getLiveStrokeColor={(stroke: ImageStroke) => stroke.color}
            getNoteCardPreviewBounds={(object) =>
              liveNoteCardResizePreview?.noteCardId === object.id
                ? liveNoteCardResizePreview
                : {
                    noteCardId: object.id,
                    x: object.x,
                    y: object.y,
                    width: object.width,
                    height: object.height,
                  }
            }
            setDraggingNoteCardId={() => {}}
            setActiveTextCardResizeState={setActiveTextCardResizeState}
            scheduleNoteCardResizePreviewRender={scheduleNoteCardResizePreviewRender}
            resizeTextCardBounds={resizeTextCardBounds}
            clearLiveNoteCardResizePreviewSession={clearLiveNoteCardResizePreviewSession}
            setLiveNoteCardResizePreview={setLiveNoteCardResizePreview}
            startEditingTextCard={startEditingTextCard}
            getTokenAnchorPosition={(object) =>
              getTokenAnchorPosition(localObjects, localImageRefs, object, true)
            }
            getTokenFillColor={(object) => object.fill}
            getBlockingActiveMove={() => null}
            setDraggingTokenId={() => {}}
            getTokenAttachment={getTokenAttachment}
            updateTokenAnchorPosition={updateTokenAnchorPosition}
            setActiveTokenMove={setActiveLocalTokenMove}
            updateTokenPlacementAfterDrop={updateTokenPlacementAfterDrop}
            onSelectedImageControlClick={handleSelectedImageControlClick}
          />
        </div>

        <div
          ref={remoteOuterRef}
          style={paneStyle}
          onMouseMove={(event) => {
            updatePaneCursor(event, remoteStageWrapperRef, setRemoteCursor);
          }}
          onMouseEnter={() => {
            setIsRemotePaneHovered(true);
          }}
          onMouseLeave={() => {
            setIsRemotePaneHovered(false);
            setRemoteCursor(null);
          }}
        >
          <div style={paneHeaderStyle}>
            <div style={paneTitleStyle}>Remote-facing preview</div>
            <div style={paneHintStyle}>
              Shared-camera remote-facing preview with cursor and interaction
              indicators. This pane is not a full second session.
            </div>
          </div>

          <SimulatorCursorOverlay cursors={remoteCursorOverlays} />

          <BoardStageScene
            stageWrapperRef={remoteStageWrapperRef}
            stageSize={remoteStageSize}
            stagePosition={stagePosition}
            stageScale={stageScale}
            participantSession={REMOTE_PARTICIPANT}
            boardBackgroundRef={remoteBoardBackgroundRef}
            noteCardRefs={remoteNoteCardRefs}
            imageRefs={remoteImageRefs}
            imageStrokeLayerRefs={remoteImageStrokeLayerRefs}
            noteCardTransformerRef={remoteNoteCardTransformerRef}
            imageTransformerRef={remoteImageTransformerRef}
            liveNoteCardResizePreviewRef={{ current: null }}
            transformingImageSnapshotRef={remoteTransformingImageSnapshotRef}
            boardSurfaceFill={boardMaterials.surface}
            boardSurfaceRadius={boardMaterials.surfaceRadius}
            sortedObjects={sortedSharedObjects}
            loadedImages={loadedImages}
            drawingImageId={null}
            draggingImageId={null}
            transformingImageId={null}
            editingTextCardId={null}
            editingTextCardDisplayHeight={null}
            remoteImagePreviewPositions={remoteImagePreviewPositions}
            remoteTextCardEditingStates={
              activeTextCardEditingState
                ? { [activeTextCardEditingState.textCardId]: activeTextCardEditingState }
                : {}
            }
            remoteTextCardResizeStates={
              activeTextCardResizeState
                ? { [activeTextCardResizeState.textCardId]: activeTextCardResizeState }
                : {}
            }
            selectedImageObject={null}
            selectedImageControlAnchor={null}
            selectedImageControlButtons={[]}
            isSelectedImageLockedByAnotherParticipant={false}
            onStageMouseDown={noopMouseStageHandler}
            onStageMouseMove={noopMouseStageHandler}
            onStageMouseUp={() => {}}
            onStageMouseLeave={() => {}}
            onStageTouchStart={noopTouchStageHandler}
            onStageTouchMove={noopTouchStageHandler}
            onStageTouchEnd={() => {}}
            onStageWheel={noopWheelStageHandler}
            onBoardBackgroundMouseDown={() => {}}
            updateObjectSemanticsHover={() => {}}
            clearObjectSemanticsHover={() => {}}
            getImageDrawingLock={getImageDrawingLockForRemote}
            finishImageDrawingMode={() => {}}
            selectBoardObject={() => {}}
            startImageStroke={() => {}}
            appendStrokePoint={() => {}}
            endImageStroke={() => {}}
            updateLiveSelectedImageControlAnchor={() => {}}
            syncImageStrokeLayerPosition={() => {}}
            syncImageStrokeLayerTransform={() => {}}
            previewImagePosition={() => {}}
            updateObjectPosition={() => {}}
            setDraggingImageId={() => {}}
            setTransformingImageId={() => {}}
            resizeImageObject={() => {}}
            publishImageTransformPreview={() => {}}
            getLiveStrokeColor={(stroke: ImageStroke) => stroke.color}
            getNoteCardPreviewBounds={(object) => ({
              noteCardId: object.id,
              x: object.x,
              y: object.y,
              width: object.width,
              height: object.height,
            })}
            setDraggingNoteCardId={() => {}}
            setActiveTextCardResizeState={() => {}}
            scheduleNoteCardResizePreviewRender={() => {}}
            resizeTextCardBounds={() => {}}
            clearLiveNoteCardResizePreviewSession={() => {}}
            setLiveNoteCardResizePreview={() => {}}
            startEditingTextCard={() => {}}
            getTokenAnchorPosition={(object) =>
              getTokenAnchorPosition(sharedObjects, remoteImageRefs, object, false)
            }
            getTokenFillColor={(object) => object.fill}
            getBlockingActiveMove={getBlockingActiveMoveForRemote}
            setDraggingTokenId={() => {}}
            getTokenAttachment={getTokenAttachment}
            updateTokenAnchorPosition={() => {}}
            setActiveTokenMove={() => {}}
            updateTokenPlacementAfterDrop={() => {}}
            onSelectedImageControlClick={() => {}}
          />

          <div
            style={remoteShieldStyle}
            onMouseMove={(event) => {
              updatePaneCursor(event, remoteStageWrapperRef, setRemoteCursor);
            }}
          />
        </div>
      </div>
    </section>
  );
}
