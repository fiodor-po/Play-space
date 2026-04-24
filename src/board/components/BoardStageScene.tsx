import type { MutableRefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
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
import type { KonvaEventObject } from "konva/lib/Node";
import {
  HTML_UI_FONT_FAMILY,
  MAX_SCALE,
  MIN_SCALE,
  MIN_IMAGE_SIZE,
  NOTE_HANDLE_SIZE,
} from "../constants";
import {
  DEFAULT_IMAGE_STROKE_WIDTH,
} from "../../lib/boardImage";
import {
  createEraserDrawingCursor,
  createMarkerDrawingCursor,
  type BoardDrawingCursorTool,
} from "../cursors";
import { NoteCardRenderer } from "../objects/noteCard/NoteCardRenderer";
import {
  clampNoteCardWidth,
  MIN_NOTE_CARD_HEIGHT,
  MIN_NOTE_CARD_WIDTH,
} from "../objects/noteCard/sizing";
import { TokenRenderer } from "../objects/token/TokenRenderer";
import type { LocalObjectsChangeOptions } from "../runtime/useBoardObjectRuntime";
import {
  buttonRecipes,
  resolveCanvasButtonMetrics,
  resolveCanvasButtonTone,
  type ButtonRecipe,
} from "../../ui/system/families/button";
import {
  getBoardBackgroundTheme,
  getBoardObjectElevationShadowRecipe,
} from "../../ui/system/boardMaterials";
import { RemoteInteractionIndicator } from "./RemoteInteractionIndicator";
import type {
  BoardStageSelectedImageControlButton,
} from "../viewModels/boardStageInspectability";
import type { ActiveObjectMove } from "../../lib/roomTokensRealtime";
import type { ImageDrawingLock } from "../../lib/roomImagesRealtime";
import type {
  LocalParticipantSession,
} from "../../lib/roomSession";
import type {
  TextCardEditingPresence,
  TextCardResizePresence,
} from "../../lib/roomTextCardsRealtime";
import type {
  BoardObject,
  ImageStroke,
  TokenAttachment,
} from "../../types/board";
import type { RoomBackgroundThemeId } from "../../lib/roomSettings";

type RemoteSelectedObjectIndicator = {
  participantId: string;
  participantColor: string;
  objectKind: BoardObject["kind"];
  selectedAt: number;
};

const IMAGE_ATTACHED_CONTROLS_GAP = 8;
const IMAGE_ATTACHED_CONTROLS_OUTER_OFFSET_Y = 12;
const BOARD_BACKGROUND_HIT_MARGIN_SCREEN_PX = 32;
const DOT_GRID_DETAIL_SPACING = 64;
const DOT_GRID_MINOR_SPACING = 128;
const DOT_GRID_MAJOR_SPACING = 512;
const DOT_GRID_DETAIL_SIZE = 1;
const DOT_GRID_MAJOR_SIZE = 2;
const GRAPH_PAPER_MINOR_SPACING = 64;
const GRAPH_PAPER_MAJOR_SPACING = 512;
const GRAPH_PAPER_MINOR_LINE_WIDTH = 1;
const GRAPH_PAPER_MAJOR_LINE_WIDTH = 1.5;
const GRANITE_CELL_SIZE = 42;
const GRANITE_VISIBLE_THRESHOLD = 0.42;
const GRANITE_MIN_DOT_SIZE = 0.75;
const GRANITE_DOT_SIZE_RANGE = 1.8;
const CORK_CELL_SIZE = 34;
const CORK_VISIBLE_THRESHOLD = 0.32;
const CORK_MIN_FLECK_SIZE = 1.1;
const CORK_FLECK_SIZE_RANGE = 2.4;
const STARFIELD_CELL_SIZE = 54;
const STARFIELD_VISIBLE_THRESHOLD = 0.72;
const STARFIELD_MIN_SIZE = 0.35;
const STARFIELD_SIZE_RANGE = 0.85;
const DOT_GRID_ZOOM_OUT_ONLY_MAJOR_THRESHOLD =
  MIN_SCALE + (MAX_SCALE - MIN_SCALE) * 0.08;
const DOT_GRID_ZOOM_IN_DETAIL_THRESHOLD =
  MAX_SCALE - (MAX_SCALE - MIN_SCALE) * 0.12;
const BLOCKED_IMAGE_PILL_INSET = 10;
const BLOCKED_IMAGE_PILL_HEIGHT = 28;
const BLOCKED_IMAGE_PILL_RADIUS = 999;
const BLOCKED_IMAGE_PILL_FONT_SIZE = 13;
const BLOCKED_IMAGE_PILL_PADDING_X = 12;
const ERASER_CURSOR_RADIUS_SCREEN_PX = 8;
const DRAWING_HIT_SURFACE_FILL = "rgba(15, 23, 42, 0.001)";
const SURFACE_KONVA_SHADOW =
  getBoardObjectElevationShadowRecipe("surface").konva;

function getBlockedImagePillWidth(label: string) {
  let measuredTextWidth = label.length * BLOCKED_IMAGE_PILL_FONT_SIZE * 0.56;

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (context) {
      context.font = `600 ${BLOCKED_IMAGE_PILL_FONT_SIZE}px ${HTML_UI_FONT_FAMILY}`;
      measuredTextWidth = context.measureText(label).width;
    }
  }

  return Math.ceil(measuredTextWidth + BLOCKED_IMAGE_PILL_PADDING_X * 2);
}

function getDeterministicUnitValue(seed: number) {
  return Math.abs(Math.sin(seed) * 10000) % 1;
}

function getGraniteCellSeed(cellX: number, cellY: number) {
  return cellX * 127.1 + cellY * 311.7;
}

function getCorkCellSeed(cellX: number, cellY: number) {
  return cellX * 211.3 + cellY * 89.9;
}

function getStarfieldCellSeed(cellX: number, cellY: number) {
  return cellX * 43.7 + cellY * 269.9;
}

type NoteCardPreviewBounds = {
  noteCardId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type ImagePreviewPosition = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  participantColor?: string;
};

type SmallFloatingActionButtonProps = {
  x: number;
  y: number;
  label: string;
  recipe?: ButtonRecipe;
  strokeWidth?: number;
  onClick: () => void;
};

type BoardStageSceneProps = {
  stageWrapperRef: MutableRefObject<HTMLDivElement | null>;
  stageSize: {
    width: number;
    height: number;
  };
  stagePosition: {
    x: number;
    y: number;
  };
  stageScale: number;
  roomBackgroundThemeId: RoomBackgroundThemeId;
  participantSession: LocalParticipantSession;
  boardBackgroundRef: MutableRefObject<Konva.Rect | null>;
  noteCardRefs: MutableRefObject<Record<string, Konva.Group | null>>;
  imageRefs: MutableRefObject<Record<string, Konva.Image | null>>;
  imageStrokeLayerRefs: MutableRefObject<Record<string, Konva.Group | null>>;
  noteCardTransformerRef: MutableRefObject<Konva.Transformer | null>;
  imageTransformerRef: MutableRefObject<Konva.Transformer | null>;
  liveNoteCardResizePreviewRef: MutableRefObject<NoteCardPreviewBounds | null>;
  transformingImageSnapshotRef: MutableRefObject<Record<string, BoardObject>>;
  sortedObjects: BoardObject[];
  loadedImages: Record<string, HTMLImageElement>;
  drawingImageId: string | null;
  drawingCursorTool: BoardDrawingCursorTool | null;
  drawingCursorParticipantColor: string;
  draggingImageId: string | null;
  transformingImageId: string | null;
  editingTextCardId: string | null;
  editingTextCardDisplayHeight: number | null;
  remoteImagePreviewPositions: Record<string, ImagePreviewPosition>;
  remoteTextCardEditingStates: Record<string, TextCardEditingPresence>;
  remoteTextCardResizeStates: Record<string, TextCardResizePresence>;
  selectedImageObject: BoardObject | null;
  selectedTokenObject: BoardObject | null;
  selectedImageControlAnchor: {
    x: number;
    y: number;
  } | null;
  selectedImageControlButtons: BoardStageSelectedImageControlButton[];
  remoteSelectedObjects: Record<string, RemoteSelectedObjectIndicator>;
  isSelectedImageLockedByAnotherParticipant: boolean;
  isSpacePanActive: boolean;
  isSpacePanDragging: boolean;
  isMiddleMousePanDragging: boolean;
  onStageMouseDown: (event: KonvaEventObject<MouseEvent>) => void;
  onStageMouseMove: (event: KonvaEventObject<MouseEvent>) => void;
  onStageMouseUp: () => void;
  onStageMouseLeave: () => void;
  onStageTouchStart: (event: KonvaEventObject<TouchEvent>) => void;
  onStageTouchMove: (event: KonvaEventObject<TouchEvent>) => void;
  onStageTouchEnd: () => void;
  onStageWheel: (event: KonvaEventObject<WheelEvent>) => void;
  onBoardBackgroundMouseDown: () => void;
  updateObjectSemanticsHover: (
    object: BoardObject,
    event: KonvaEventObject<MouseEvent>
  ) => void;
  onStageContextMenu: (event: KonvaEventObject<PointerEvent>) => void;
  clearObjectSemanticsHover: () => void;
  getImageDrawingLock: (imageId: string) => ImageDrawingLock | null;
  finishImageDrawingMode: () => void;
  selectBoardObject: (
    object:
      | BoardObject
      | {
          id: string;
          kind: BoardObject["kind"];
        }
      | null
  ) => void;
  startImageStroke: (
    id: string,
    point: {
      x: number;
      y: number;
    },
    color: string
  ) => void;
  appendStrokePoint: (
    imageId: string,
    point: {
      x: number;
      y: number;
    },
    options?: {
      constrainToStraightLine?: boolean;
    }
  ) => void;
  eraseImageStrokesAtPoint: (
    imageId: string,
    point: {
      x: number;
      y: number;
    },
    radius: number,
    mode: "partial" | "whole-stroke"
  ) => void;
  endImageStroke: () => void;
  updateLiveSelectedImageControlAnchor: (
    imageId: string,
    node: Konva.Image
  ) => void;
  syncImageStrokeLayerPosition: (id: string, x: number, y: number) => void;
  syncImageStrokeLayerTransform: (
    id: string,
    x: number,
    y: number,
    scaleX: number,
    scaleY: number
  ) => void;
  previewImagePosition: (id: string, x: number, y: number) => void;
  updateObjectPosition: (
    id: string,
    x: number,
    y: number,
    localOptions?: LocalObjectsChangeOptions
  ) => void;
  rememberDraggingImageOrigin: (
    imageId: string,
    position: {
      x: number;
      y: number;
    }
  ) => void;
  clearDraggingImageOrigin: (imageId: string) => void;
  stopLockedImageDrag: (imageId: string, node: Konva.Image) => void;
  setDraggingImageId: (imageId: string | null) => void;
  setTransformingImageId: (imageId: string | null) => void;
  resizeImageObject: (
    id: string,
    nextBounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
    scale: {
      x: number;
      y: number;
    },
    strokeWidthScale: number
  ) => void;
  publishImageTransformPreview: (
    node: Konva.Image,
    snapshot: BoardObject
  ) => void;
  getLiveStrokeColor: (stroke: ImageStroke) => string;
  getNoteCardPreviewBounds: (object: BoardObject) => NoteCardPreviewBounds;
  setLiveNoteCardResizePreview: (bounds: NoteCardPreviewBounds | null) => void;
  setDraggingNoteCardId: (noteCardId: string | null) => void;
  setActiveTextCardResizeState: (
    resizePresence: TextCardResizePresence | null
  ) => void;
  resizeTextCardBounds: (
    id: string,
    nextBounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
    localOptions?: LocalObjectsChangeOptions
  ) => void;
  clearLiveNoteCardResizePreviewSession: () => void;
  startEditingTextCard: (object: BoardObject) => void;
  getTokenAnchorPosition: (object: BoardObject) => {
    x: number;
    y: number;
  };
  getTokenFillColor: (object: BoardObject) => string;
  getBlockingActiveMove: (objectId: string) => ActiveObjectMove | null;
  setDraggingTokenId: (tokenId: string | null) => void;
  getTokenAttachment: (object: BoardObject) => TokenAttachment;
  updateTokenAnchorPosition: (id: string, x: number, y: number) => void;
  setActiveTokenMove: (move: ActiveObjectMove | null) => void;
  updateTokenPlacementAfterDrop: (
    id: string,
    point: {
      x: number;
      y: number;
    }
  ) => void;
  onTokenContextMenu?: (
    event: KonvaEventObject<PointerEvent>,
    object: BoardObject
  ) => void;
  onSelectedImageControlClick: (buttonKey: string, imageId: string) => void;
};

function getSmallFloatingActionButtonWidth(
  label: string,
  metrics: ReturnType<typeof resolveCanvasButtonMetrics>
) {
  let measuredTextWidth = label.length * metrics.fontSize * 0.58;

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (context) {
      const fontWeight =
        typeof metrics.fontWeight === "number"
          ? String(metrics.fontWeight)
          : metrics.fontWeight;
      context.font = `${fontWeight} ${metrics.fontSize}px ${metrics.fontFamily}`;
      measuredTextWidth = context.measureText(label).width;
    }
  }

  const contentWidth = measuredTextWidth + metrics.paddingX * 2;
  const minimumWidth = metrics.minWidth ?? metrics.minHeight;

  return Math.max(minimumWidth, Math.ceil(contentWidth));
}

function SmallFloatingActionButton({
  x,
  y,
  label,
  recipe = buttonRecipes.secondary.small,
  strokeWidth = 1,
  onClick,
}: SmallFloatingActionButtonProps) {
  const metrics = resolveCanvasButtonMetrics(recipe);
  const width = getSmallFloatingActionButtonWidth(label, metrics);
  const height = metrics.minHeight;
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const toneStyles = resolveCanvasButtonTone(recipe, {
    hover: isHovered,
    active: isPressed,
  });
  const textLineHeightPx = metrics.fontSize * metrics.lineHeight;
  const textYOffset = Math.max(0, (height - textLineHeightPx) / 2);

  return (
    <Group
      x={x}
      y={y}
      onMouseDown={(event) => {
        event.cancelBubble = true;
        setIsPressed(true);
      }}
      onTouchStart={(event) => {
        event.cancelBubble = true;
        setIsPressed(true);
      }}
      onMouseUp={() => {
        setIsPressed(false);
      }}
      onTouchEnd={() => {
        setIsPressed(false);
      }}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onClick={(event) => {
        event.cancelBubble = true;
        setIsPressed(false);
        onClick();
      }}
      onTap={(event) => {
        event.cancelBubble = true;
        setIsPressed(false);
        onClick();
      }}
    >
      <Rect
        width={width}
        height={height}
        cornerRadius={metrics.borderRadius}
        fill={toneStyles.fill}
        stroke={toneStyles.stroke}
        strokeWidth={strokeWidth}
        shadowBlur={SURFACE_KONVA_SHADOW.shadowBlur}
        shadowColor={SURFACE_KONVA_SHADOW.shadowColor}
        shadowOffsetX={SURFACE_KONVA_SHADOW.shadowOffsetX}
        shadowOffsetY={SURFACE_KONVA_SHADOW.shadowOffsetY}
        shadowOpacity={SURFACE_KONVA_SHADOW.shadowOpacity}
      />
      <Text
        x={0}
        y={textYOffset}
        width={width}
        align="center"
        text={label}
        fontSize={metrics.fontSize}
        fontStyle={
          String(metrics.fontWeight) === "600" || Number(metrics.fontWeight) >= 600
            ? "bold"
            : "normal"
        }
        fontFamily={metrics.fontFamily || HTML_UI_FONT_FAMILY}
        fill={toneStyles.textColor}
        listening={false}
      />
    </Group>
  );
}

export function BoardStageScene({
  stageWrapperRef,
  stageSize,
  stagePosition,
  stageScale,
  roomBackgroundThemeId,
  participantSession,
  boardBackgroundRef,
  noteCardRefs,
  imageRefs,
  imageStrokeLayerRefs,
  noteCardTransformerRef,
  imageTransformerRef,
  liveNoteCardResizePreviewRef,
  transformingImageSnapshotRef,
  sortedObjects,
  loadedImages,
  drawingImageId,
  drawingCursorTool,
  drawingCursorParticipantColor,
  draggingImageId,
  transformingImageId,
  editingTextCardId,
  editingTextCardDisplayHeight,
  remoteImagePreviewPositions,
  remoteTextCardEditingStates,
  remoteTextCardResizeStates,
  selectedImageObject,
  selectedTokenObject,
  selectedImageControlAnchor,
  selectedImageControlButtons,
  remoteSelectedObjects,
  isSelectedImageLockedByAnotherParticipant,
  isSpacePanActive,
  isSpacePanDragging,
  isMiddleMousePanDragging,
  onStageMouseDown,
  onStageMouseMove,
  onStageMouseUp,
  onStageMouseLeave,
  onStageTouchStart,
  onStageTouchMove,
  onStageTouchEnd,
  onStageWheel,
  onBoardBackgroundMouseDown,
  updateObjectSemanticsHover,
  onStageContextMenu,
  clearObjectSemanticsHover,
  getImageDrawingLock,
  finishImageDrawingMode,
  selectBoardObject,
  startImageStroke,
  appendStrokePoint,
  eraseImageStrokesAtPoint,
  endImageStroke,
  updateLiveSelectedImageControlAnchor,
  syncImageStrokeLayerPosition,
  syncImageStrokeLayerTransform,
  previewImagePosition,
  updateObjectPosition,
  rememberDraggingImageOrigin,
  clearDraggingImageOrigin,
  stopLockedImageDrag,
  setDraggingImageId,
  setTransformingImageId,
  resizeImageObject,
  publishImageTransformPreview,
  getLiveStrokeColor,
  getNoteCardPreviewBounds,
  setLiveNoteCardResizePreview,
  setDraggingNoteCardId,
  setActiveTextCardResizeState,
  resizeTextCardBounds,
  clearLiveNoteCardResizePreviewSession,
  startEditingTextCard,
  getTokenAnchorPosition,
  getTokenFillColor,
  getBlockingActiveMove,
  setDraggingTokenId,
  getTokenAttachment,
  updateTokenAnchorPosition,
  setActiveTokenMove,
  updateTokenPlacementAfterDrop,
  onTokenContextMenu,
  onSelectedImageControlClick,
}: BoardStageSceneProps) {
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [blockedImageHoverId, setBlockedImageHoverId] = useState<string | null>(null);
  const backgroundTheme = useMemo(
    () => getBoardBackgroundTheme(roomBackgroundThemeId),
    [roomBackgroundThemeId]
  );
  const isPanInteractionOverrideActive =
    isSpacePanActive || isMiddleMousePanDragging;
  const markerDrawingCursor = useMemo(
    () => createMarkerDrawingCursor(drawingCursorParticipantColor),
    [drawingCursorParticipantColor]
  );
  const eraserDrawingCursor = useMemo(
    () => createEraserDrawingCursor(),
    []
  );

  useEffect(() => {
    const wrapper = stageWrapperRef.current;

    if (!wrapper) {
      return;
    }

    let cursor = "";

    if (blockedImageHoverId) {
      cursor = "not-allowed";
    } else if (isSpacePanDragging || isMiddleMousePanDragging) {
      cursor = "grabbing";
    } else if (isSpacePanActive) {
      cursor = "grab";
    } else if (drawingCursorTool === "eraser") {
      cursor = eraserDrawingCursor;
    } else if (drawingCursorTool === "marker") {
      cursor = markerDrawingCursor;
    }

    wrapper.style.cursor = cursor;

    return () => {
      wrapper.style.cursor = "";
    };
  }, [
    blockedImageHoverId,
    drawingCursorTool,
    eraserDrawingCursor,
    isMiddleMousePanDragging,
    isSpacePanActive,
    isSpacePanDragging,
    markerDrawingCursor,
    stageWrapperRef,
  ]);

  useEffect(() => {
    const canvas = backgroundCanvasRef.current;

    if (!canvas || stageScale <= 0) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const devicePixelRatio =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const pixelWidth = Math.max(1, Math.round(stageSize.width * devicePixelRatio));
    const pixelHeight = Math.max(1, Math.round(stageSize.height * devicePixelRatio));

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    canvas.style.width = `${stageSize.width}px`;
    canvas.style.height = `${stageSize.height}px`;
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.clearRect(0, 0, stageSize.width, stageSize.height);

    const drawGridLayer = (
      worldSpacing: number,
      dotSize: number,
      color: string
    ) => {
      const screenSpacing = worldSpacing * stageScale;

      if (screenSpacing < dotSize * 2.2) {
        return;
      }

      const minWorldX = -stagePosition.x / stageScale;
      const minWorldY = -stagePosition.y / stageScale;
      const maxWorldX = (stageSize.width - stagePosition.x) / stageScale;
      const maxWorldY = (stageSize.height - stagePosition.y) / stageScale;
      const firstWorldX = Math.floor(minWorldX / worldSpacing) * worldSpacing;
      const firstWorldY = Math.floor(minWorldY / worldSpacing) * worldSpacing;

      context.fillStyle = color;

      for (
        let worldY = firstWorldY;
        worldY <= maxWorldY + worldSpacing;
        worldY += worldSpacing
      ) {
        const screenY = worldY * stageScale + stagePosition.y - dotSize / 2;

        for (
          let worldX = firstWorldX;
          worldX <= maxWorldX + worldSpacing;
          worldX += worldSpacing
        ) {
          const screenX = worldX * stageScale + stagePosition.x - dotSize / 2;
          context.fillRect(screenX, screenY, dotSize, dotSize);
        }
      }
    };
    const drawGraphPaperLines = (
      worldSpacing: number,
      lineWidth: number,
      color: string
    ) => {
      const screenSpacing = worldSpacing * stageScale;

      if (screenSpacing < lineWidth * 2.2) {
        return;
      }

      const minWorldX = -stagePosition.x / stageScale;
      const minWorldY = -stagePosition.y / stageScale;
      const maxWorldX = (stageSize.width - stagePosition.x) / stageScale;
      const maxWorldY = (stageSize.height - stagePosition.y) / stageScale;
      const firstWorldX = Math.floor(minWorldX / worldSpacing) * worldSpacing;
      const firstWorldY = Math.floor(minWorldY / worldSpacing) * worldSpacing;

      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      context.beginPath();

      for (
        let worldX = firstWorldX;
        worldX <= maxWorldX + worldSpacing;
        worldX += worldSpacing
      ) {
        const screenX = worldX * stageScale + stagePosition.x;
        context.moveTo(screenX, 0);
        context.lineTo(screenX, stageSize.height);
      }

      for (
        let worldY = firstWorldY;
        worldY <= maxWorldY + worldSpacing;
        worldY += worldSpacing
      ) {
        const screenY = worldY * stageScale + stagePosition.y;
        context.moveTo(0, screenY);
        context.lineTo(stageSize.width, screenY);
      }

      context.stroke();
    };
    const drawGraniteSpeckles = (colors: string[]) => {
      const minWorldX = -stagePosition.x / stageScale;
      const minWorldY = -stagePosition.y / stageScale;
      const maxWorldX = (stageSize.width - stagePosition.x) / stageScale;
      const maxWorldY = (stageSize.height - stagePosition.y) / stageScale;
      const firstCellX = Math.floor(minWorldX / GRANITE_CELL_SIZE) - 1;
      const firstCellY = Math.floor(minWorldY / GRANITE_CELL_SIZE) - 1;
      const lastCellX = Math.ceil(maxWorldX / GRANITE_CELL_SIZE) + 1;
      const lastCellY = Math.ceil(maxWorldY / GRANITE_CELL_SIZE) + 1;

      for (let cellY = firstCellY; cellY <= lastCellY; cellY += 1) {
        for (let cellX = firstCellX; cellX <= lastCellX; cellX += 1) {
          const seed = getGraniteCellSeed(cellX, cellY);
          const visibility = getDeterministicUnitValue(seed);

          if (visibility < GRANITE_VISIBLE_THRESHOLD) {
            continue;
          }

          const localX = getDeterministicUnitValue(seed + 19.19) * GRANITE_CELL_SIZE;
          const localY = getDeterministicUnitValue(seed + 73.73) * GRANITE_CELL_SIZE;
          const dotSize =
            GRANITE_MIN_DOT_SIZE +
            getDeterministicUnitValue(seed + 41.41) * GRANITE_DOT_SIZE_RANGE;
          const colorIndex = Math.floor(
            getDeterministicUnitValue(seed + 97.97) * colors.length
          );
          const worldX = cellX * GRANITE_CELL_SIZE + localX;
          const worldY = cellY * GRANITE_CELL_SIZE + localY;
          const screenX = worldX * stageScale + stagePosition.x;
          const screenY = worldY * stageScale + stagePosition.y;

          context.fillStyle = colors[colorIndex] ?? colors[0] ?? "rgba(0,0,0,0.1)";
          context.beginPath();
          context.arc(screenX, screenY, dotSize, 0, Math.PI * 2);
          context.fill();
        }
      }
    };
    const drawCorkFlecks = (colors: string[]) => {
      const minWorldX = -stagePosition.x / stageScale;
      const minWorldY = -stagePosition.y / stageScale;
      const maxWorldX = (stageSize.width - stagePosition.x) / stageScale;
      const maxWorldY = (stageSize.height - stagePosition.y) / stageScale;
      const firstCellX = Math.floor(minWorldX / CORK_CELL_SIZE) - 1;
      const firstCellY = Math.floor(minWorldY / CORK_CELL_SIZE) - 1;
      const lastCellX = Math.ceil(maxWorldX / CORK_CELL_SIZE) + 1;
      const lastCellY = Math.ceil(maxWorldY / CORK_CELL_SIZE) + 1;

      for (let cellY = firstCellY; cellY <= lastCellY; cellY += 1) {
        for (let cellX = firstCellX; cellX <= lastCellX; cellX += 1) {
          const seed = getCorkCellSeed(cellX, cellY);
          const visibility = getDeterministicUnitValue(seed);

          if (visibility < CORK_VISIBLE_THRESHOLD) {
            continue;
          }

          const localX = getDeterministicUnitValue(seed + 11.11) * CORK_CELL_SIZE;
          const localY = getDeterministicUnitValue(seed + 37.37) * CORK_CELL_SIZE;
          const fleckWidth =
            CORK_MIN_FLECK_SIZE +
            getDeterministicUnitValue(seed + 53.53) * CORK_FLECK_SIZE_RANGE;
          const fleckHeight =
            CORK_MIN_FLECK_SIZE +
            getDeterministicUnitValue(seed + 79.79) * CORK_FLECK_SIZE_RANGE;
          const colorIndex = Math.floor(
            getDeterministicUnitValue(seed + 101.1) * colors.length
          );
          const worldX = cellX * CORK_CELL_SIZE + localX;
          const worldY = cellY * CORK_CELL_SIZE + localY;
          const screenX = worldX * stageScale + stagePosition.x - fleckWidth / 2;
          const screenY = worldY * stageScale + stagePosition.y - fleckHeight / 2;

          context.fillStyle = colors[colorIndex] ?? colors[0] ?? "rgba(0,0,0,0.1)";
          context.fillRect(screenX, screenY, fleckWidth, fleckHeight);
        }
      }
    };
    const drawStarfield = (colors: string[]) => {
      const minWorldX = -stagePosition.x / stageScale;
      const minWorldY = -stagePosition.y / stageScale;
      const maxWorldX = (stageSize.width - stagePosition.x) / stageScale;
      const maxWorldY = (stageSize.height - stagePosition.y) / stageScale;
      const firstCellX = Math.floor(minWorldX / STARFIELD_CELL_SIZE) - 1;
      const firstCellY = Math.floor(minWorldY / STARFIELD_CELL_SIZE) - 1;
      const lastCellX = Math.ceil(maxWorldX / STARFIELD_CELL_SIZE) + 1;
      const lastCellY = Math.ceil(maxWorldY / STARFIELD_CELL_SIZE) + 1;

      for (let cellY = firstCellY; cellY <= lastCellY; cellY += 1) {
        for (let cellX = firstCellX; cellX <= lastCellX; cellX += 1) {
          const seed = getStarfieldCellSeed(cellX, cellY);
          const visibility = getDeterministicUnitValue(seed);

          if (visibility < STARFIELD_VISIBLE_THRESHOLD) {
            continue;
          }

          const localX = getDeterministicUnitValue(seed + 23.23) * STARFIELD_CELL_SIZE;
          const localY = getDeterministicUnitValue(seed + 61.61) * STARFIELD_CELL_SIZE;
          const starSize =
            STARFIELD_MIN_SIZE +
            getDeterministicUnitValue(seed + 17.17) * STARFIELD_SIZE_RANGE;
          const colorIndex = Math.floor(
            getDeterministicUnitValue(seed + 131.31) * colors.length
          );
          const worldX = cellX * STARFIELD_CELL_SIZE + localX;
          const worldY = cellY * STARFIELD_CELL_SIZE + localY;
          const screenX = worldX * stageScale + stagePosition.x;
          const screenY = worldY * stageScale + stagePosition.y;

          context.fillStyle = colors[colorIndex] ?? colors[0] ?? "rgba(255,255,255,0.7)";
          context.beginPath();
          context.arc(screenX, screenY, starSize, 0, Math.PI * 2);
          context.fill();
        }
      }
    };

    if (backgroundTheme.pattern === "starfield" && backgroundTheme.starfield) {
      drawStarfield(backgroundTheme.starfield.starColors);
      return;
    }

    if (backgroundTheme.pattern === "cork" && backgroundTheme.cork) {
      drawCorkFlecks(backgroundTheme.cork.fleckColors);
      return;
    }

    if (backgroundTheme.pattern === "granite" && backgroundTheme.granite) {
      drawGraniteSpeckles(backgroundTheme.granite.speckColors);
      return;
    }

    if (backgroundTheme.pattern === "graph-paper" && backgroundTheme.graphPaper) {
      drawGraphPaperLines(
        GRAPH_PAPER_MINOR_SPACING,
        GRAPH_PAPER_MINOR_LINE_WIDTH,
        backgroundTheme.graphPaper.minorLineColor
      );
      drawGraphPaperLines(
        GRAPH_PAPER_MAJOR_SPACING,
        GRAPH_PAPER_MAJOR_LINE_WIDTH,
        backgroundTheme.graphPaper.majorLineColor
      );
      return;
    }

    const isNearZoomOutLimit =
      stageScale <= DOT_GRID_ZOOM_OUT_ONLY_MAJOR_THRESHOLD;
    const isNearZoomInLimit =
      stageScale >= DOT_GRID_ZOOM_IN_DETAIL_THRESHOLD;
    if (isNearZoomInLimit) {
      drawGridLayer(
        DOT_GRID_DETAIL_SPACING,
        DOT_GRID_DETAIL_SIZE,
        backgroundTheme.dotGrid.detailColor
      );
    }

    if (!isNearZoomOutLimit) {
      drawGridLayer(
        DOT_GRID_MINOR_SPACING,
        DOT_GRID_MAJOR_SIZE,
        backgroundTheme.dotGrid.majorColor
      );
    }

    if (isNearZoomOutLimit) {
      drawGridLayer(
        DOT_GRID_MAJOR_SPACING,
        DOT_GRID_MAJOR_SIZE,
        backgroundTheme.dotGrid.majorColor
      );
    }
  }, [
    backgroundTheme.cork,
    backgroundTheme.dotGrid.detailColor,
    backgroundTheme.dotGrid.majorColor,
    backgroundTheme.granite,
    backgroundTheme.graphPaper,
    backgroundTheme.pattern,
    backgroundTheme.starfield,
    stagePosition.x,
    stagePosition.y,
    stageScale,
    stageSize.height,
    stageSize.width,
  ]);

  const activeDrawingImage =
    drawingImageId && !isPanInteractionOverrideActive
      ? sortedObjects.find(
          (object) => object.kind === "image" && object.id === drawingImageId
        )
      : null;
  const activeDrawingImageLock = activeDrawingImage
    ? getImageDrawingLock(activeDrawingImage.id)
    : null;
  const isActiveDrawingImageLockedByAnotherParticipant =
    !!activeDrawingImageLock &&
    activeDrawingImageLock.participantId !== participantSession.id;
  const isDrawingHitSurfaceVisible =
    !!activeDrawingImage && !isActiveDrawingImageLockedByAnotherParticipant;
  const boardBackgroundHitBounds = useMemo(() => {
    const safeScale = stageScale > 0 ? stageScale : 1;

    return {
      x: (-stagePosition.x - BOARD_BACKGROUND_HIT_MARGIN_SCREEN_PX) / safeScale,
      y: (-stagePosition.y - BOARD_BACKGROUND_HIT_MARGIN_SCREEN_PX) / safeScale,
      width:
        (stageSize.width + BOARD_BACKGROUND_HIT_MARGIN_SCREEN_PX * 2) / safeScale,
      height:
        (stageSize.height + BOARD_BACKGROUND_HIT_MARGIN_SCREEN_PX * 2) / safeScale,
    };
  }, [stagePosition.x, stagePosition.y, stageScale, stageSize.height, stageSize.width]);

  const handleDrawingHitSurfaceMouseDown = (
    event: KonvaEventObject<MouseEvent>
  ) => {
    if (!activeDrawingImage || event.evt.button === 1) {
      return;
    }

    event.cancelBubble = true;
    selectBoardObject(activeDrawingImage);

    const point = event.target.getRelativePointerPosition();

    if (!point) {
      return;
    }

    if (drawingCursorTool === "eraser") {
      eraseImageStrokesAtPoint(
        activeDrawingImage.id,
        point,
        ERASER_CURSOR_RADIUS_SCREEN_PX / stageScale,
        event.evt.altKey ? "whole-stroke" : "partial"
      );
      return;
    }

    startImageStroke(activeDrawingImage.id, point, participantSession.color);
  };

  const handleDrawingHitSurfaceMouseMove = (
    event: KonvaEventObject<MouseEvent>
  ) => {
    if (!activeDrawingImage || event.evt.buttons !== 1) {
      return;
    }

    event.cancelBubble = true;

    const point = event.target.getRelativePointerPosition();

    if (!point) {
      return;
    }

    if (drawingCursorTool === "eraser") {
      eraseImageStrokesAtPoint(
        activeDrawingImage.id,
        point,
        ERASER_CURSOR_RADIUS_SCREEN_PX / stageScale,
        event.evt.altKey ? "whole-stroke" : "partial"
      );
      return;
    }

    appendStrokePoint(activeDrawingImage.id, point, {
      constrainToStraightLine: event.evt.shiftKey,
    });
  };

  return (
    <div
      ref={stageWrapperRef}
      style={{
        position: "relative",
        width: stageSize.width,
        height: stageSize.height,
      }}
    >
      <canvas
        ref={backgroundCanvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onMouseDown={onStageMouseDown}
        onMouseMove={onStageMouseMove}
        onMouseUp={() => {
          onStageMouseUp();
        }}
        onContextMenu={onStageContextMenu}
        onMouseLeave={() => {
          setBlockedImageHoverId(null);
          onStageMouseLeave();
        }}
        onTouchStart={onStageTouchStart}
        onTouchMove={onStageTouchMove}
        onTouchEnd={() => {
          setBlockedImageHoverId(null);
          onStageTouchEnd();
        }}
        onWheel={onStageWheel}
      >
        <Layer>
          <Rect
            ref={boardBackgroundRef}
            x={boardBackgroundHitBounds.x}
            y={boardBackgroundHitBounds.y}
            width={boardBackgroundHitBounds.width}
            height={boardBackgroundHitBounds.height}
            fill="rgba(0, 0, 0, 0)"
            onMouseDown={(event) => {
              if (event.evt.button === 1) {
                return;
              }

              onBoardBackgroundMouseDown();
            }}
          />

          {sortedObjects.map((object) => {
            if (object.kind === "image") {
              const loadedImage = object.src ? loadedImages[object.src] : undefined;
              const isDrawing = drawingImageId === object.id;
              const imageDrawingLock = getImageDrawingLock(object.id);
              const isLockedByAnotherParticipant =
                !!imageDrawingLock &&
                imageDrawingLock.participantId !== participantSession.id;
              const blockedImageActivityLabel =
                isLockedByAnotherParticipant && imageDrawingLock
                  ? `${imageDrawingLock.participantName} is drawing...`
                  : null;
              const previewPosition = remoteImagePreviewPositions[object.id];
              const remoteSelectionIndicator = remoteSelectedObjects[object.id];
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
                    if (isLockedByAnotherParticipant) {
                      setBlockedImageHoverId(object.id);
                    }

                    updateObjectSemanticsHover(object, event);
                  }}
                    onMouseMove={(event) => {
                      if (isLockedByAnotherParticipant) {
                        setBlockedImageHoverId(object.id);
                      }

                      updateObjectSemanticsHover(object, event);
                    }}
                    onMouseLeave={() => {
                      if (blockedImageHoverId === object.id) {
                        setBlockedImageHoverId(null);
                    }

                    clearObjectSemanticsHover();
                  }}
                >
                  {isRemoteDragPreviewActive && (
                    <RemoteInteractionIndicator
                      x={previewPosition.x}
                      y={previewPosition.y}
                      width={previewPosition.width ?? object.width}
                      height={previewPosition.height ?? object.height}
                      participantColor={previewPosition.participantColor ?? "#94a3b8"}
                      stageScale={stageScale}
                      variant="preview"
                    />
                  )}

                  {!isRemoteDragPreviewActive &&
                    !isLockedByAnotherParticipant &&
                    remoteSelectionIndicator && (
                      <RemoteInteractionIndicator
                        x={object.x}
                        y={object.y}
                        width={object.width}
                        height={object.height}
                        participantColor={remoteSelectionIndicator.participantColor}
                        stageScale={stageScale}
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
                    shadowBlur={SURFACE_KONVA_SHADOW.shadowBlur}
                    shadowColor={SURFACE_KONVA_SHADOW.shadowColor}
                    shadowOffsetX={SURFACE_KONVA_SHADOW.shadowOffsetX}
                    shadowOffsetY={SURFACE_KONVA_SHADOW.shadowOffsetY}
                    shadowOpacity={SURFACE_KONVA_SHADOW.shadowOpacity}
                    draggable={
                      !isPanInteractionOverrideActive &&
                      !isDrawing &&
                      transformingImageId !== object.id &&
                      !isLockedByAnotherParticipant
                    }
                    onMouseDown={(event) => {
                      if (isPanInteractionOverrideActive || event.evt.button === 1) {
                        return;
                      }

                      event.cancelBubble = true;

                      if (drawingImageId && drawingImageId !== object.id) {
                        finishImageDrawingMode();
                      }

                      if (isLockedByAnotherParticipant) {
                        setBlockedImageHoverId(object.id);
                        return;
                      }

                      selectBoardObject(object);

                      if (!isDrawing) {
                        return;
                      }

                      const point = event.target.getRelativePointerPosition();

                      if (!point) {
                        return;
                      }

                      if (drawingCursorTool === "eraser") {
                        eraseImageStrokesAtPoint(
                          object.id,
                          point,
                          ERASER_CURSOR_RADIUS_SCREEN_PX / stageScale,
                          event.evt.altKey ? "whole-stroke" : "partial"
                        );
                        return;
                      }

                      startImageStroke(object.id, point, participantSession.color);
                    }}
                    onMouseMove={(event) => {
                      if (!isDrawing || isLockedByAnotherParticipant) {
                        return;
                      }

                      if (drawingCursorTool !== "eraser" && event.evt.buttons !== 1) {
                        return;
                      }

                      const point = event.target.getRelativePointerPosition();

                      if (!point) {
                        return;
                      }

                      if (drawingCursorTool === "eraser") {
                        if (event.evt.buttons !== 1) {
                          return;
                        }

                        eraseImageStrokesAtPoint(
                          object.id,
                          point,
                          ERASER_CURSOR_RADIUS_SCREEN_PX / stageScale,
                          event.evt.altKey ? "whole-stroke" : "partial"
                        );
                        return;
                      }

                      appendStrokePoint(object.id, point, {
                        constrainToStraightLine: event.evt.shiftKey,
                      });
                    }}
                    onMouseUp={() => {
                      endImageStroke();
                    }}
                    onDragStart={(event) => {
                      if (isPanInteractionOverrideActive) {
                        return;
                      }

                      event.cancelBubble = true;

                      if (isLockedByAnotherParticipant) {
                        setBlockedImageHoverId(object.id);
                        event.target.stopDrag();
                        return;
                      }

                      if (drawingImageId && drawingImageId !== object.id) {
                        finishImageDrawingMode();
                      }

                      selectBoardObject(object);
                      rememberDraggingImageOrigin(object.id, {
                        x: object.x,
                        y: object.y,
                      });
                      setDraggingImageId(object.id);
                      updateLiveSelectedImageControlAnchor(
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

                      if (isLockedByAnotherParticipant) {
                        stopLockedImageDrag(object.id, event.target as Konva.Image);
                        return;
                      }

                      updateLiveSelectedImageControlAnchor(
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

                      if (isLockedByAnotherParticipant) {
                        stopLockedImageDrag(object.id, event.target as Konva.Image);
                        return;
                      }

                      updateLiveSelectedImageControlAnchor(
                        object.id,
                        event.target as Konva.Image
                      );
                      clearDraggingImageOrigin(object.id);
                      setDraggingImageId(null);
                      syncImageStrokeLayerPosition(
                        object.id,
                        event.target.x(),
                        event.target.y()
                      );
                      updateObjectPosition(
                        object.id,
                        event.target.x(),
                        event.target.y(),
                        { commitBoundary: "image-drag-end" }
                      );
                    }}
                    onTransformStart={(event) => {
                      if (isPanInteractionOverrideActive) {
                        return;
                      }

                      event.cancelBubble = true;

                      if (isLockedByAnotherParticipant) {
                        return;
                      }

                      if (drawingImageId && drawingImageId !== object.id) {
                        finishImageDrawingMode();
                      }

                      selectBoardObject(object);
                      setTransformingImageId(object.id);
                      transformingImageSnapshotRef.current[object.id] = object;
                      event.target.draggable(false);
                      updateLiveSelectedImageControlAnchor(
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
                      updateLiveSelectedImageControlAnchor(
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
                      updateLiveSelectedImageControlAnchor(
                        object.id,
                        node as Konva.Image
                      );
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      const strokeWidthScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
                      const nextWidth = Math.max(
                        node.width() * node.scaleX(),
                        MIN_IMAGE_SIZE
                      );
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

                  {isLockedByAnotherParticipant && imageDrawingLock && (
                    <>
                      <RemoteInteractionIndicator
                        x={object.x}
                        y={object.y}
                        width={object.width}
                        height={object.height}
                        participantColor={imageDrawingLock.participantColor}
                        stageScale={stageScale}
                      />

                      {blockedImageActivityLabel ? (
                        <Group
                          x={object.x + BLOCKED_IMAGE_PILL_INSET / stageScale}
                          y={object.y + BLOCKED_IMAGE_PILL_INSET / stageScale}
                          scaleX={1 / stageScale}
                          scaleY={1 / stageScale}
                          listening={false}
                        >
                          <Rect
                            width={getBlockedImagePillWidth(blockedImageActivityLabel)}
                            height={BLOCKED_IMAGE_PILL_HEIGHT}
                            cornerRadius={BLOCKED_IMAGE_PILL_RADIUS}
                            fill="rgba(15, 23, 42, 0.88)"
                            stroke={imageDrawingLock.participantColor}
                            strokeWidth={1}
                          />
                          <Text
                            x={BLOCKED_IMAGE_PILL_PADDING_X}
                            y={6}
                            text={blockedImageActivityLabel}
                            fontSize={BLOCKED_IMAGE_PILL_FONT_SIZE}
                            fontStyle="bold"
                            fontFamily={HTML_UI_FONT_FAMILY}
                            fill="#f8fafc"
                            listening={false}
                          />
                        </Group>
                      ) : null}
                    </>
                  )}
                </Group>
              );
            }

            if (object.kind === "note-card") {
              const isEditing = object.id === editingTextCardId;
              const noteCardPreviewBounds = getNoteCardPreviewBounds(object);
              const remoteEditingState = remoteTextCardEditingStates[object.id];
              const remoteResizeState = remoteTextCardResizeStates[object.id];
              const remoteEditingIndicator =
                remoteEditingState &&
                remoteEditingState.participantId !== participantSession.id
                  ? {
                      participantName: remoteEditingState.participantName,
                      participantColor: remoteEditingState.participantColor,
                    }
                  : null;
              const remoteResizeIndicator =
                remoteResizeState &&
                remoteResizeState.participantId !== participantSession.id
                  ? {
                      participantName: remoteResizeState.participantName,
                      participantColor: remoteResizeState.participantColor,
                    }
                  : null;
              const remoteSelectionIndicator =
                !remoteResizeIndicator && !remoteEditingIndicator
                  ? remoteSelectedObjects[object.id] ?? null
                  : null;

              const noteCardDisplayHeight =
                object.id === editingTextCardId
                  ? editingTextCardDisplayHeight ?? noteCardPreviewBounds.height
                  : noteCardPreviewBounds.height;

              return (
                <Group key={object.id}>
                  {!remoteResizeIndicator && !remoteEditingIndicator && remoteSelectionIndicator && (
                    <RemoteInteractionIndicator
                      x={noteCardPreviewBounds.x}
                      y={noteCardPreviewBounds.y}
                      width={noteCardPreviewBounds.width}
                      height={noteCardDisplayHeight}
                      participantColor={remoteSelectionIndicator.participantColor}
                      stageScale={stageScale}
                    />
                  )}

                  {remoteResizeIndicator && (
                    <RemoteInteractionIndicator
                      x={noteCardPreviewBounds.x}
                      y={noteCardPreviewBounds.y}
                      width={noteCardPreviewBounds.width}
                      height={noteCardDisplayHeight}
                      participantColor={remoteResizeIndicator.participantColor}
                      stageScale={stageScale}
                    />
                  )}

                  {!remoteResizeIndicator && remoteEditingIndicator && (
                    <RemoteInteractionIndicator
                      x={noteCardPreviewBounds.x}
                      y={noteCardPreviewBounds.y}
                      width={noteCardPreviewBounds.width}
                      height={noteCardDisplayHeight}
                      participantColor={remoteEditingIndicator.participantColor}
                      stageScale={stageScale}
                    />
                  )}

                  <NoteCardRenderer
                    object={object}
                    displayX={noteCardPreviewBounds.x}
                    displayY={noteCardPreviewBounds.y}
                    displayWidth={noteCardPreviewBounds.width}
                    displayHeight={
                      object.id === editingTextCardId
                        ? editingTextCardDisplayHeight ?? undefined
                        : noteCardPreviewBounds.height
                    }
                    isEditing={isEditing}
                    draggable={!isPanInteractionOverrideActive}
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
                      noteCardRefs.current[object.id] = node;
                    }}
                    onSelect={(event) => {
                      if (isPanInteractionOverrideActive || event.evt.button === 1) {
                        return;
                      }

                      event.cancelBubble = true;
                      selectBoardObject(object);
                    }}
                    onDragStart={(event) => {
                      if (isPanInteractionOverrideActive) {
                        return;
                      }

                      event.cancelBubble = true;
                      selectBoardObject(object);
                      setDraggingNoteCardId(object.id);
                    }}
                    onDragMove={(event) => {
                      event.cancelBubble = true;
                      updateObjectPosition(object.id, event.target.x(), event.target.y());
                    }}
                    onDragEnd={(event) => {
                      event.cancelBubble = true;
                      updateObjectPosition(
                        object.id,
                        event.target.x(),
                        event.target.y(),
                        { commitBoundary: "note-drag-end" }
                      );
                      setDraggingNoteCardId(null);
                    }}
                    onTransformStart={(event) => {
                      if (isPanInteractionOverrideActive) {
                        return;
                      }

                      event.cancelBubble = true;
                      selectBoardObject(object);
                      setActiveTextCardResizeState({
                        textCardId: object.id,
                        participantId: participantSession.id,
                        participantName: participantSession.name,
                        participantColor: participantSession.color,
                      });
                      const initialBounds = {
                        noteCardId: object.id,
                        x: object.x,
                        y: object.y,
                        width: object.width,
                        height: object.height,
                      };

                      liveNoteCardResizePreviewRef.current = initialBounds;
                      setLiveNoteCardResizePreview(initialBounds);
                    }}
                    onTransform={(event) => {
                      event.cancelBubble = true;

                      const node = event.target as Konva.Group;
                      const nextBounds = {
                        noteCardId: object.id,
                        x: node.x(),
                        y: node.y(),
                        width: clampNoteCardWidth(
                          Math.abs(node.width() * node.scaleX())
                        ),
                        height: Math.max(
                          Math.round(Math.abs(node.height() * node.scaleY())),
                          MIN_NOTE_CARD_HEIGHT
                        ),
                      };

                      liveNoteCardResizePreviewRef.current = nextBounds;
                      node.position({ x: nextBounds.x, y: nextBounds.y });
                      node.width(nextBounds.width);
                      node.height(nextBounds.height);
                      node.scaleX(1);
                      node.scaleY(1);
                      flushSync(() => {
                        setLiveNoteCardResizePreview(nextBounds);
                      });
                      noteCardTransformerRef.current?.forceUpdate();
                      node.getLayer()?.batchDraw();
                    }}
                    onTransformEnd={(event) => {
                      event.cancelBubble = true;

                      const node = event.target as Konva.Group;
                      const nextBounds =
                        liveNoteCardResizePreviewRef.current?.noteCardId === object.id
                          ? {
                              x: liveNoteCardResizePreviewRef.current.x,
                              y: liveNoteCardResizePreviewRef.current.y,
                              width: liveNoteCardResizePreviewRef.current.width,
                              height: liveNoteCardResizePreviewRef.current.height,
                            }
                          : {
                              x: node.x(),
                              y: node.y(),
                              width: clampNoteCardWidth(
                                Math.abs(node.width() * node.scaleX())
                              ),
                              height: Math.max(
                                Math.round(Math.abs(node.height() * node.scaleY())),
                                MIN_NOTE_CARD_HEIGHT
                              ),
                            };

                    node.scaleX(1);
                    node.scaleY(1);
                    resizeTextCardBounds(object.id, nextBounds, {
                      commitBoundary: "note-resize-end",
                    });
                    setActiveTextCardResizeState(null);
                    clearLiveNoteCardResizePreviewSession();
                  }}
                    onDoubleClick={(event) => {
                      if (isPanInteractionOverrideActive) {
                        return;
                      }

                      event.cancelBubble = true;
                      startEditingTextCard(object);
                    }}
                  />
                </Group>
              );
            }

            return (
              <TokenRenderer
                key={object.id}
                object={object}
                position={getTokenAnchorPosition(object)}
                stageScale={stageScale}
                isSelected={selectedTokenObject?.id === object.id}
                selectionColor={participantSession.color}
                fillColor={getTokenFillColor(object)}
                draggable={!isPanInteractionOverrideActive}
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
                  if (isPanInteractionOverrideActive || event.evt.button === 1) {
                    return;
                  }

                  event.cancelBubble = true;
                  selectBoardObject(object);
                }}
                onDragStart={(event) => {
                  if (isPanInteractionOverrideActive) {
                    return;
                  }

                  event.cancelBubble = true;

                  const blockingMove = getBlockingActiveMove(object.id);

                  if (blockingMove) {
                    event.target.stopDrag();
                    return;
                  }

                  setDraggingTokenId(object.id);

                  if (getTokenAttachment(object).mode === "attached") {
                    const anchorPosition = getTokenAnchorPosition(object);

                    updateTokenAnchorPosition(
                      object.id,
                      anchorPosition.x,
                      anchorPosition.y
                    );
                  }

                  setActiveTokenMove({
                    objectId: object.id,
                    objectKind: object.kind,
                    participantId: participantSession.id,
                    participantName: participantSession.name,
                    participantColor: participantSession.color,
                    startedAt: Date.now(),
                  });
                }}
                onDragMove={(event) => {
                  event.cancelBubble = true;

                  if (object.kind !== "token") {
                    return;
                  }

                  updateTokenAnchorPosition(
                    object.id,
                    event.target.x(),
                    event.target.y()
                  );
                }}
                onDragEnd={(event) => {
                  event.cancelBubble = true;
                  setActiveTokenMove(null);
                  updateTokenPlacementAfterDrop(object.id, {
                    x: event.target.x(),
                    y: event.target.y(),
                  });
                  setDraggingTokenId(null);
                }}
                onContextMenu={(event) => {
                  event.cancelBubble = true;
                  onTokenContextMenu?.(event, object);
                }}
              />
            );
          })}

          {isDrawingHitSurfaceVisible && activeDrawingImage ? (
            <Rect
              x={activeDrawingImage.x}
              y={activeDrawingImage.y}
              width={activeDrawingImage.width}
              height={activeDrawingImage.height}
              fill={DRAWING_HIT_SURFACE_FILL}
              onMouseDown={handleDrawingHitSurfaceMouseDown}
              onMouseMove={handleDrawingHitSurfaceMouseMove}
              onMouseUp={() => {
                endImageStroke();
              }}
            />
          ) : null}

          {selectedImageObject &&
            selectedImageControlAnchor &&
            selectedImageControlButtons.length > 0 &&
            !isSelectedImageLockedByAnotherParticipant && (
              <Group
                x={selectedImageControlAnchor.x}
                y={selectedImageControlAnchor.y}
                scaleX={1 / stageScale}
                scaleY={1 / stageScale}
              >
                {selectedImageControlButtons.map((button, buttonIndex) => {
                  const buttonMetrics = resolveCanvasButtonMetrics(
                    button.recipe ?? buttonRecipes.secondary.small
                  );
                  const x = selectedImageControlButtons
                    .slice(0, buttonIndex)
                    .reduce(
                      (offset, currentButton) =>
                        offset +
                        getSmallFloatingActionButtonWidth(
                          currentButton.label,
                          resolveCanvasButtonMetrics(
                            currentButton.recipe ?? buttonRecipes.secondary.small
                          )
                        ) +
                        IMAGE_ATTACHED_CONTROLS_GAP,
                      0
                    );

                  return (
                    <SmallFloatingActionButton
                      key={button.key}
                      x={x}
                      y={-(buttonMetrics.minHeight + IMAGE_ATTACHED_CONTROLS_OUTER_OFFSET_Y)}
                      label={button.label}
                      recipe={button.recipe}
                      strokeWidth={2}
                      onClick={() => {
                        onSelectedImageControlClick(
                          button.key,
                          selectedImageObject.id
                        );
                      }}
                    />
                  );
                })}
              </Group>
            )}

          <Transformer
            ref={noteCardTransformerRef}
            rotateEnabled={false}
            flipEnabled={false}
            keepRatio={false}
            borderStroke={participantSession.color}
            borderStrokeWidth={3}
            anchorStroke={participantSession.color}
            anchorStrokeWidth={2}
            anchorFill="#f8fafc"
            anchorCornerRadius={999}
            anchorSize={NOTE_HANDLE_SIZE}
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
            ]}
            boundBoxFunc={(oldBox, newBox) => {
              if (
                Math.abs(newBox.width) < MIN_NOTE_CARD_WIDTH ||
                Math.abs(newBox.height) < MIN_NOTE_CARD_HEIGHT
              ) {
                return oldBox;
              }

              return newBox;
            }}
          />

          <Transformer
            ref={imageTransformerRef}
            rotateEnabled={false}
            flipEnabled={false}
            borderStroke={participantSession.color}
            borderStrokeWidth={3}
            anchorStroke={participantSession.color}
            anchorStrokeWidth={2}
            anchorFill="#f8fafc"
            anchorCornerRadius={999}
            anchorSize={NOTE_HANDLE_SIZE}
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
  );
}
