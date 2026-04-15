import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
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
import { RemoteInteractionIndicator } from "../board/components/RemoteInteractionIndicator";
import { createNoteCardObject } from "../board/objects/noteCard/createNoteCardObject";
import { NoteCardRenderer } from "../board/objects/noteCard/NoteCardRenderer";
import {
  clampNoteCardWidth,
  getNoteCardHeightForLabel,
  MIN_NOTE_CARD_HEIGHT,
  MIN_NOTE_CARD_WIDTH,
  isNoteCardObject,
} from "../board/objects/noteCard/sizing";
import { createTokenObject } from "../board/objects/token/createTokenObject";
import { TokenRenderer } from "../board/objects/token/TokenRenderer";
import {
  buttonRecipes,
  createParticipantAccentButtonRecipe,
  createParticipantAccentButtonRecipeWithMode,
  interactionButtonRecipes,
  resolveCanvasButtonMetrics,
  resolveCanvasButtonTone,
  type ButtonRecipe,
} from "../ui/system/families/button";
import { boardSurfaceRecipes } from "../ui/system/boardSurfaces";
import {
  getDesignSystemDebugAttrs,
  isDesignSystemHoverDebugEnabled,
} from "../ui/system/debugMeta";
import { rowRecipes } from "../ui/system/families/row";
import { selectionControlRecipes } from "../ui/system/families/selectionControls";
import {
  getSwatchButtonProps,
  swatchPillRecipes,
} from "../ui/system/families/swatchPill";
import {
  boardMaterials,
  resolveBoardCanvasMaterials,
} from "../ui/system/boardMaterials";
import { surfaceRecipes } from "../ui/system/surfaces";
import {
  resolveEffectiveImageBounds,
  type ImageEffectiveBounds,
} from "../board/images/effectiveBounds";
import {
  getUpdateBoardObjectSyncOptions,
} from "../board/sync/boardObjectSync";
import {
  getRoomScopedBoardObjects,
  type LocalObjectsChangeOptions,
  useBoardObjectRuntime,
} from "../board/runtime/useBoardObjectRuntime";
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
  clearImageStrokesByCreatorInObjects,
  clearImageStrokesInObjects,
  createImageObject,
  DEFAULT_IMAGE_STROKE_WIDTH,
  getImageStorageScale,
  getInitialImageDisplaySize,
} from "../lib/boardImage";
import {
  loadDurableRoomSnapshot,
  saveDurableRoomSnapshot,
  saveDurableRoomSnapshotSlice,
  type DurableRoomSnapshotSlice,
} from "../lib/durableRoomSnapshot";
import {
  updateBoardObjectById,
  updateBoardObjectLabel,
  updateBoardObjectPosition,
} from "../lib/boardObjects";
import {
  clearBoardContentStorage,
  loadLocalRoomDocumentBootstrapState,
  saveLocalRoomDocumentReplica,
  loadViewportState,
  saveBoardObjects,
  saveRoomSnapshot,
  saveViewportState,
  type LocalRoomDocumentBootstrapReadSource,
} from "../lib/storage";
import { createClientId } from "../lib/id";
import {
  createRoomTokenConnection,
  type ActiveObjectMove,
  type ActiveObjectMoveMap,
} from "../lib/roomTokensRealtime";
import {
  createRoomImageConnection,
  type ImageDrawingLock,
} from "../lib/roomImagesRealtime";
import {
  createRoomTextCardConnection,
  type TextCardEditingPresence,
  type TextCardResizePresence,
} from "../lib/roomTextCardsRealtime";
import {
  PARTICIPANT_COLOR_OPTIONS,
  type LocalParticipantSession,
  type ParticipantPresence,
  type ParticipantPresenceMap,
  type RoomOccupancyMap,
} from "../lib/roomSession";
import { getRoomBaselinePayload } from "../lib/roomBaseline";
import { resolveCurrentParticipantColor } from "../lib/participantColors";
import {
  createBoardObjectGovernedEntityRef,
  createRoomGovernedEntityRef,
  resolveGovernedActionAccess,
  type AccessLevel,
  type GovernedActionAccessResolution,
  type GovernanceActionKey,
} from "../lib/governance";
import {
  resolveBoardObjectDeletePolicyAccess,
  resolveImageClearOwnDrawingPolicyAccess,
  resolveImageClearAllDrawingPolicyAccess,
} from "../lib/governancePolicy";
import type { RoomBaselineDescriptor, RoomBaselineId } from "../lib/roomMetadata";
import type { BoardObject, TokenAttachment } from "../types/board";

type SmallFloatingActionButtonProps = {
  x: number;
  y: number;
  label: string;
  recipe?: ButtonRecipe;
  onClick: () => void;
};

const IMAGE_ATTACHED_CONTROLS_GAP = 8;
const IMAGE_ATTACHED_CONTROLS_OUTER_OFFSET_Y = 12;
const LOCAL_CURSOR_PRESENCE_MIN_INTERVAL_MS = 33;

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
  onClick,
}: SmallFloatingActionButtonProps) {
  const metrics = resolveCanvasButtonMetrics(recipe);
  const width = getSmallFloatingActionButtonWidth(label, metrics);
  const height = metrics.minHeight;
  const toneStyles = resolveCanvasButtonTone(recipe);
  const textLineHeightPx = metrics.fontSize * metrics.lineHeight;
  const textYOffset = Math.max(0, (height - textLineHeightPx) / 2);

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
        cornerRadius={metrics.borderRadius}
        fill={toneStyles.fill}
        stroke={toneStyles.stroke}
        strokeWidth={1}
      />
      <Text
        x={0}
        y={textYOffset}
        width={width}
        align="center"
        text={label}
        fontSize={metrics.fontSize}
        fontStyle={String(metrics.fontWeight) === "600" || Number(metrics.fontWeight) >= 600 ? "bold" : "normal"}
        fontFamily={metrics.fontFamily || HTML_UI_FONT_FAMILY}
        fill={toneStyles.textColor}
        listening={false}
      />
    </Group>
  );
}

function getSharedBoardObjects(nextObjects: BoardObject[]) {
  return nextObjects.filter(
    (object) =>
      object.kind === "token" ||
      object.kind === "image" ||
      isNoteCardObject(object)
  );
}

function getReplicaObjectCount(content: {
  tokens: BoardObject[];
  images: BoardObject[];
  textCards: BoardObject[];
}) {
  return content.tokens.length + content.images.length + content.textCards.length;
}

function getDurableSliceObjects(
  nextObjects: BoardObject[],
  slice: DurableRoomSnapshotSlice
) {
  if (slice === "tokens") {
    return nextObjects.filter((object) => object.kind === "token");
  }

  if (slice === "images") {
    return nextObjects.filter((object) => object.kind === "image");
  }

  return nextObjects.filter((object) => isNoteCardObject(object));
}

function getDurableSliceForCommitBoundary(
  commitBoundary: LocalObjectsChangeOptions["commitBoundary"] | null | undefined
): DurableRoomSnapshotSlice | null {
  if (commitBoundary === "token-drop") {
    return "tokens";
  }

  if (
    commitBoundary === "image-drag-end" ||
    commitBoundary === "image-transform-end" ||
    commitBoundary === "image-draw-commit"
  ) {
    return "images";
  }

  if (
    commitBoundary === "note-drag-end" ||
    commitBoundary === "note-resize-end" ||
    commitBoundary === "note-text-save"
  ) {
    return "textCards";
  }

  return null;
}

function formatDebugTimestamp(timestamp: number | null) {
  if (timestamp === null) {
    return "none";
  }

  return new Date(timestamp).toLocaleString();
}

function formatIsoDebugTimestamp(timestamp: string | null) {
  if (timestamp === null) {
    return "none";
  }

  return new Date(timestamp).toLocaleString();
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

type BoardStageProps = {
  participantSession: LocalParticipantSession;
  participantPresences: ParticipantPresenceMap;
  roomOccupancies: RoomOccupancyMap;
  roomId: string;
  isCurrentParticipantRoomCreator: boolean;
  roomCreatorName: string | null;
  roomCreatorId: string | null;
  roomBaselineToApply: RoomBaselineDescriptor | null;
  roomEffectiveAccessLevel: AccessLevel;
  onLeaveRoom: () => void;
  onRoomBaselineApplied: (baselineId: RoomBaselineId) => void;
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

type GovernanceInspectionEntry = {
  id: string;
  resolution: GovernedActionAccessResolution;
  timestamp: number;
};

type ActiveImageStrokeSession = {
  imageId: string;
  strokeIndex: number;
};

type EditingTextareaStyle = {
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  color: string;
};

type ContainerRect = {
  left: number;
  top: number;
};

type LocalReplicaReadSource = "idle" | LocalRoomDocumentBootstrapReadSource;

type LocalReplicaInspectionState = {
  lastWriteStatus: "idle" | "writing" | "saved" | "failed";
  lastWriteCommitBoundary: LocalObjectsChangeOptions["commitBoundary"] | null;
  lastWriteRevision: number | null;
  lastWriteSavedAt: number | null;
  lastWriteObjectCount: number;
  lastReadSource: LocalReplicaReadSource;
  lastReadRevision: number | null;
  lastReadSavedAt: number | null;
  lastReadObjectCount: number;
  lastBootstrapBranch:
    | "pending"
    | "live-wins"
    | "durable-recovery"
    | "local-recovery"
    | "baseline-initialization"
    | "empty-room"
    | null;
  lastBootstrapLocalSource: Exclude<LocalReplicaReadSource, "idle"> | null;
  lastError: string | null;
};

type DurableDebugBoundary =
  | "image-drag-end"
  | "image-transform-end"
  | "image-draw-commit"
  | "token-drop"
  | "note-drag-end"
  | "note-resize-end"
  | "note-text-save"
  | "object-add"
  | "object-remove"
  | "image-clear-all"
  | "image-clear-own"
  | "room-reset";

type DurableSliceRevisionState = Record<DurableRoomSnapshotSlice, number | null>;

type DurableReplicaInspectionState = {
  currentRevision: number | null;
  currentSliceRevisions: DurableSliceRevisionState;
  lastWriteStatus: "idle" | "writing" | "saved" | "conflict" | "failed";
  lastWriteBoundary: DurableDebugBoundary | null;
  lastWriteSlice: DurableRoomSnapshotSlice | "snapshot" | null;
  lastKnownSliceRevision: number | null;
  lastBaseRevision: number | null;
  lastBaseSliceRevision: number | null;
  lastAckSnapshotRevision: number | null;
  lastAckSliceRevision: number | null;
  lastConflictRevision: number | null;
  lastConflictSliceRevision: number | null;
  lastRetryCount: number;
  lastResolvedViaRetry: boolean;
  lastAckSavedAt: string | null;
  lastWriteObjectCount: number;
  lastError: string | null;
};

function createInitialLocalReplicaInspectionState(): LocalReplicaInspectionState {
  return {
    lastWriteStatus: "idle",
    lastWriteCommitBoundary: null,
    lastWriteRevision: null,
    lastWriteSavedAt: null,
    lastWriteObjectCount: 0,
    lastReadSource: "idle",
    lastReadRevision: null,
    lastReadSavedAt: null,
    lastReadObjectCount: 0,
    lastBootstrapBranch: null,
    lastBootstrapLocalSource: null,
    lastError: null,
  };
}

function createInitialDurableSliceRevisionState(): DurableSliceRevisionState {
  return {
    tokens: null,
    images: null,
    textCards: null,
  };
}

function cloneDurableSliceRevisionState(
  state: DurableSliceRevisionState
): DurableSliceRevisionState {
  return {
    tokens: state.tokens,
    images: state.images,
    textCards: state.textCards,
  };
}

function getDurableSliceRevisionStateFromSnapshot(snapshot: {
  sliceRevisions: Record<DurableRoomSnapshotSlice, number>;
} | null): DurableSliceRevisionState {
  if (!snapshot) {
    return createInitialDurableSliceRevisionState();
  }

  return {
    tokens: snapshot.sliceRevisions.tokens,
    images: snapshot.sliceRevisions.images,
    textCards: snapshot.sliceRevisions.textCards,
  };
}

function createInitialDurableReplicaInspectionState(): DurableReplicaInspectionState {
  return {
    currentRevision: null,
    currentSliceRevisions: createInitialDurableSliceRevisionState(),
    lastWriteStatus: "idle",
    lastWriteBoundary: null,
    lastWriteSlice: null,
    lastKnownSliceRevision: null,
    lastBaseRevision: null,
    lastBaseSliceRevision: null,
    lastAckSnapshotRevision: null,
    lastAckSliceRevision: null,
    lastConflictRevision: null,
    lastConflictSliceRevision: null,
    lastRetryCount: 0,
    lastResolvedViaRetry: false,
    lastAckSavedAt: null,
    lastWriteObjectCount: 0,
    lastError: null,
  };
}

export default function BoardStage({
  participantSession,
  participantPresences,
  roomOccupancies,
  roomId,
  isCurrentParticipantRoomCreator,
  roomCreatorName,
  roomCreatorId,
  roomBaselineToApply,
  roomEffectiveAccessLevel,
  onLeaveRoom,
  onRoomBaselineApplied,
  onUpdateParticipantSession,
  onUpdateLocalPresence,
}: BoardStageProps) {
  const isDebugControlsEnabled = isDesignSystemHoverDebugEnabled();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const sessionPanelRef = useRef<HTMLDivElement | null>(null);
  const stageWrapperRef = useRef<HTMLDivElement | null>(null);
  const activeRoomIdRef = useRef(roomId);
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [localReplicaInspection, setLocalReplicaInspection] =
    useState<LocalReplicaInspectionState>(createInitialLocalReplicaInspectionState);
  const [durableReplicaInspection, setDurableReplicaInspection] =
    useState<DurableReplicaInspectionState>(
      createInitialDurableReplicaInspectionState
    );

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

  useEffect(() => {
    activeRoomIdRef.current = roomId;
  }, [roomId]);

  const persistLocalReplica = useEffectEvent(
    (
      nextObjects: BoardObject[],
      commitBoundary: NonNullable<LocalObjectsChangeOptions["commitBoundary"]>
    ) => {
      setLocalReplicaInspection((current) => ({
        ...current,
        lastWriteStatus: "writing",
        lastWriteCommitBoundary: commitBoundary,
        lastWriteObjectCount: getSharedBoardObjects(nextObjects).length,
        lastError: null,
      }));

      void saveLocalRoomDocumentReplica(roomId, nextObjects, {
        commitBoundary,
      })
        .then((replica) => {
          if (activeRoomIdRef.current !== roomId) {
            return;
          }

          setLocalReplicaInspection((current) => ({
            ...current,
            lastWriteStatus: "saved",
            lastWriteCommitBoundary: commitBoundary,
            lastWriteRevision: replica.revision,
            lastWriteSavedAt: replica.savedAt,
            lastWriteObjectCount: getReplicaObjectCount(replica.content),
            lastError: null,
          }));
        })
        .catch((error) => {
          if (activeRoomIdRef.current !== roomId) {
            return;
          }

          setLocalReplicaInspection((current) => ({
            ...current,
            lastWriteStatus: "failed",
            lastWriteCommitBoundary: commitBoundary,
            lastError: getErrorMessage(error),
          }));
        });
    }
  );

  const queueDurableWriteTask = useEffectEvent((task: () => Promise<void>) => {
    durableWriteQueueRef.current = durableWriteQueueRef.current
      .catch(() => undefined)
      .then(task);
  });

  const persistDurableSliceWrite = useEffectEvent(
    (
      nextObjects: BoardObject[],
      boundary: DurableDebugBoundary,
      slice: DurableRoomSnapshotSlice
    ) => {
      const sliceObjects = getDurableSliceObjects(nextObjects, slice);
      const objectCount = sliceObjects.length;

      queueDurableWriteTask(async () => {
        if (activeRoomIdRef.current !== roomId) {
          return;
        }

        let baseSliceRevision = durableSliceRevisionRef.current[slice];
        let retryCount = 0;

        setDurableReplicaInspection((current) => ({
          ...current,
          currentRevision: durableSnapshotRevisionRef.current,
          currentSliceRevisions: cloneDurableSliceRevisionState(
            durableSliceRevisionRef.current
          ),
          lastWriteStatus: "writing",
          lastWriteBoundary: boundary,
          lastWriteSlice: slice,
          lastKnownSliceRevision: durableSliceRevisionRef.current[slice],
          lastBaseRevision: null,
          lastBaseSliceRevision: baseSliceRevision,
          lastAckSnapshotRevision: null,
          lastAckSliceRevision: null,
          lastConflictRevision: null,
          lastConflictSliceRevision: null,
          lastRetryCount: 0,
          lastResolvedViaRetry: false,
          lastAckSavedAt: null,
          lastWriteObjectCount: objectCount,
          lastError: null,
        }));

        for (let attempt = 0; attempt < 2; attempt += 1) {
          const result = await saveDurableRoomSnapshotSlice(
            roomId,
            slice,
            sliceObjects,
            baseSliceRevision
          );

          if (activeRoomIdRef.current !== roomId) {
            return;
          }

          if (result.status === "conflict") {
            durableSnapshotRevisionRef.current = result.currentRevision;
            durableSliceRevisionRef.current = {
              ...durableSliceRevisionRef.current,
              [slice]: result.currentSliceRevision,
            };

            if (
              attempt === 0 &&
              result.currentSliceRevision !== null &&
              result.currentSliceRevision !== baseSliceRevision
            ) {
              baseSliceRevision = result.currentSliceRevision;
              retryCount = attempt + 1;
              continue;
            }

            setDurableReplicaInspection((current) => ({
              ...current,
              currentRevision: result.currentRevision,
              currentSliceRevisions: cloneDurableSliceRevisionState(
                durableSliceRevisionRef.current
              ),
              lastWriteStatus: "conflict",
              lastWriteBoundary: boundary,
              lastWriteSlice: slice,
              lastKnownSliceRevision: durableSliceRevisionRef.current[slice],
              lastBaseRevision: null,
              lastBaseSliceRevision: baseSliceRevision,
              lastAckSnapshotRevision: null,
              lastAckSliceRevision: null,
              lastConflictRevision: result.currentRevision,
              lastConflictSliceRevision: result.currentSliceRevision,
              lastRetryCount: retryCount,
              lastResolvedViaRetry: false,
              lastAckSavedAt: null,
              lastWriteObjectCount: objectCount,
              lastError: null,
            }));
            return;
          }

          if (result.status === "saved") {
            durableSnapshotRevisionRef.current = result.ack.snapshotRevision;
            durableSliceRevisionRef.current = {
              ...durableSliceRevisionRef.current,
              [slice]: result.ack.sliceRevision,
            };
            setDurableReplicaInspection((current) => ({
              ...current,
              currentRevision: result.ack.snapshotRevision,
              currentSliceRevisions: cloneDurableSliceRevisionState(
                durableSliceRevisionRef.current
              ),
              lastWriteStatus: "saved",
              lastWriteBoundary: boundary,
              lastWriteSlice: slice,
              lastKnownSliceRevision: result.ack.sliceRevision,
              lastBaseRevision: null,
              lastBaseSliceRevision: baseSliceRevision,
              lastAckSnapshotRevision: result.ack.snapshotRevision,
              lastAckSliceRevision: result.ack.sliceRevision,
              lastConflictRevision: null,
              lastConflictSliceRevision: null,
              lastRetryCount: retryCount,
              lastResolvedViaRetry: retryCount > 0,
              lastAckSavedAt: result.ack.savedAt,
              lastWriteObjectCount: result.ack.objectCount,
              lastError: null,
            }));
            return;
          }

          setDurableReplicaInspection((current) => ({
            ...current,
            currentRevision: durableSnapshotRevisionRef.current,
            currentSliceRevisions: cloneDurableSliceRevisionState(
              durableSliceRevisionRef.current
            ),
            lastWriteStatus: "failed",
            lastWriteBoundary: boundary,
            lastWriteSlice: slice,
            lastKnownSliceRevision: durableSliceRevisionRef.current[slice],
            lastBaseRevision: null,
            lastBaseSliceRevision: baseSliceRevision,
            lastAckSnapshotRevision: null,
            lastAckSliceRevision: null,
            lastRetryCount: retryCount,
            lastResolvedViaRetry: false,
            lastAckSavedAt: null,
            lastWriteObjectCount: objectCount,
            lastError: "durable-slice-write-unavailable",
          }));
          return;
        }
      });
    }
  );

  const persistLegacyDurableSnapshot = useEffectEvent(
    (nextObjects: BoardObject[], boundary: DurableDebugBoundary) => {
      const objectCount = getSharedBoardObjects(nextObjects).length;

      queueDurableWriteTask(async () => {
        if (activeRoomIdRef.current !== roomId) {
          return;
        }

        let baseRevision = durableSnapshotRevisionRef.current;
        let retryCount = 0;

        setDurableReplicaInspection((current) => ({
          ...current,
          currentRevision: durableSnapshotRevisionRef.current,
          currentSliceRevisions: cloneDurableSliceRevisionState(
            durableSliceRevisionRef.current
          ),
          lastWriteStatus: "writing",
          lastWriteBoundary: boundary,
          lastWriteSlice: "snapshot",
          lastKnownSliceRevision: null,
          lastBaseRevision: baseRevision,
          lastBaseSliceRevision: null,
          lastAckSnapshotRevision: null,
          lastAckSliceRevision: null,
          lastConflictRevision: null,
          lastConflictSliceRevision: null,
          lastRetryCount: 0,
          lastResolvedViaRetry: false,
          lastAckSavedAt: null,
          lastWriteObjectCount: objectCount,
          lastError: null,
        }));

        for (let attempt = 0; attempt < 2; attempt += 1) {
          const result = await saveDurableRoomSnapshot(
            roomId,
            nextObjects,
            baseRevision
          );

          if (activeRoomIdRef.current !== roomId) {
            return;
          }

          if (result.status === "conflict") {
            durableSnapshotRevisionRef.current = result.currentRevision;

            if (
              attempt === 0 &&
              result.currentRevision !== null &&
              result.currentRevision !== baseRevision
            ) {
              baseRevision = result.currentRevision;
              retryCount = attempt + 1;
              continue;
            }

            setDurableReplicaInspection((current) => ({
              ...current,
              currentRevision: result.currentRevision,
              currentSliceRevisions: cloneDurableSliceRevisionState(
                durableSliceRevisionRef.current
              ),
              lastWriteStatus: "conflict",
              lastWriteBoundary: boundary,
              lastWriteSlice: "snapshot",
              lastKnownSliceRevision: null,
              lastBaseRevision: baseRevision,
              lastBaseSliceRevision: null,
              lastAckSnapshotRevision: null,
              lastAckSliceRevision: null,
              lastConflictRevision: result.currentRevision,
              lastConflictSliceRevision: null,
              lastRetryCount: retryCount,
              lastResolvedViaRetry: false,
              lastAckSavedAt: null,
              lastWriteObjectCount: objectCount,
              lastError: null,
            }));
            return;
          }

          if (result.status === "saved") {
            durableSnapshotRevisionRef.current = result.snapshot.revision;
            durableSliceRevisionRef.current = getDurableSliceRevisionStateFromSnapshot(
              result.snapshot
            );
            setDurableReplicaInspection((current) => ({
              ...current,
              currentRevision: result.snapshot.revision,
              currentSliceRevisions: cloneDurableSliceRevisionState(
                durableSliceRevisionRef.current
              ),
              lastWriteStatus: "saved",
              lastWriteBoundary: boundary,
              lastWriteSlice: "snapshot",
              lastKnownSliceRevision: null,
              lastBaseRevision: baseRevision,
              lastBaseSliceRevision: null,
              lastAckSnapshotRevision: result.snapshot.revision,
              lastAckSliceRevision: null,
              lastConflictRevision: null,
              lastConflictSliceRevision: null,
              lastRetryCount: retryCount,
              lastResolvedViaRetry: retryCount > 0,
              lastAckSavedAt: result.snapshot.savedAt,
              lastWriteObjectCount: objectCount,
              lastError: null,
            }));
            return;
          }

          setDurableReplicaInspection((current) => ({
            ...current,
            currentRevision: durableSnapshotRevisionRef.current,
            currentSliceRevisions: cloneDurableSliceRevisionState(
              durableSliceRevisionRef.current
            ),
            lastWriteStatus: "failed",
            lastWriteBoundary: boundary,
            lastWriteSlice: "snapshot",
            lastKnownSliceRevision: null,
            lastBaseRevision: baseRevision,
            lastBaseSliceRevision: null,
            lastAckSnapshotRevision: null,
            lastAckSliceRevision: null,
            lastRetryCount: retryCount,
            lastResolvedViaRetry: false,
            lastAckSavedAt: null,
            lastWriteObjectCount: objectCount,
            lastError: "durable-snapshot-write-unavailable",
          }));
          return;
        }
      });
    }
  );

  const handleLocalBoardObjectsChange = useEffectEvent(
    (nextObjects: BoardObject[], options?: LocalObjectsChangeOptions) => {
      const commitBoundary =
        options?.commitBoundary &&
        options.commitBoundary !== "default"
          ? options.commitBoundary
          : null;
      const durableBoundary = commitBoundary ?? options?.durableBoundary ?? null;
      const durableSlice =
        options?.durableSlice ?? getDurableSliceForCommitBoundary(commitBoundary);

      if (commitBoundary) {
        persistLocalReplica(nextObjects, commitBoundary);
      }

      if (durableBoundary && durableSlice) {
        persistDurableSliceWrite(nextObjects, durableBoundary, durableSlice);
      }
    }
  );

  const {
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
  } = useBoardObjectRuntime({
    onLocalObjectsChange: handleLocalBoardObjectsChange,
    roomId,
  });

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [editingTextCardId, setEditingTextCardId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [editingOriginal, setEditingOriginal] = useState("");
  const [liveNoteCardResizePreview, setLiveNoteCardResizePreview] = useState<{
    noteCardId: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [transformingImageId, setTransformingImageId] = useState<string | null>(
    null
  );
  const [drawingImageId, setDrawingImageId] = useState<string | null>(null);
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);
  const [draggingNoteCardId, setDraggingNoteCardId] = useState<string | null>(
    null
  );
  const [isEditingParticipantName, setIsEditingParticipantName] = useState(false);
  const [participantNameDraft, setParticipantNameDraft] = useState(
    participantSession.name
  );
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [isObjectInspectionEnabled, setIsObjectInspectionEnabled] = useState(false);
  const objectInspectionSelectionRecipe = selectionControlRecipes.checkbox.small;
  const [objectSemanticsHoverState, setObjectSemanticsHoverState] =
    useState<ObjectSemanticsHoverState | null>(null);
  const [governanceInspectionEntries, setGovernanceInspectionEntries] = useState<
    GovernanceInspectionEntry[]
  >([]);
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
  const [remoteTextCardResizeStates, setRemoteTextCardResizeStates] = useState<
    Record<string, TextCardResizePresence>
  >({});
  const [remoteActiveObjectMoves, setRemoteActiveObjectMoves] = useState<
    ActiveObjectMoveMap
  >({});
  const [containerRect, setContainerRect] = useState<ContainerRect | null>(null);
  const [liveSelectedImageControlAnchor, setLiveSelectedImageControlAnchor] =
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
  const sharedTokenObjects = objects.filter((object) => object.kind === "token");
  const sharedTokenCount = sharedTokenObjects.length;
  const sharedImageObjects = objects.filter((object) => object.kind === "image");
  const sharedImageCount = sharedImageObjects.length;
  const sharedNoteObjects = objects.filter((object) => isNoteCardObject(object));
  const sharedNoteCount = sharedNoteObjects.length;
  const sharedObjectCount =
    sharedTokenCount + sharedImageCount + sharedNoteCount;
  const getLiveCreatorColor = (object: BoardObject) => {
    return resolveCurrentParticipantColor({
      participantId: object.creatorId,
      localParticipantSession: participantSession,
      participantPresences,
      roomOccupancies,
    });
  };

  const getTokenFillColor = (object: BoardObject) => {
    return getLiveCreatorColor(object) ?? object.fill;
  };

  const getParticipantMarkerTokens = (
    nextObjects: BoardObject[],
    participantId: string
  ) =>
    nextObjects.filter(
      (object) => object.kind === "token" && object.creatorId === participantId
    );

  const getBlockingActiveMove = (objectId: string): ActiveObjectMove | null => {
    const move = remoteActiveObjectMoves[objectId];

    if (!move || move.participantId === participantSession.id) {
      return null;
    }

    return move;
  };

  const getTokenAttachment = (object: BoardObject): TokenAttachment =>
    object.kind === "token" && object.tokenAttachment
      ? object.tokenAttachment
      : { mode: "free" };

  const getImageById = (objectId: string) => {
    const object = objects.find((candidate) => candidate.id === objectId);

    return object?.kind === "image" ? object : null;
  };

  const selectBoardObject = (
    object:
      | BoardObject
      | {
          id: string;
          kind: BoardObject["kind"];
        }
      | null
  ) => {
    if (!object || object.kind === "token") {
      setSelectedObjectIdWithImageDrawingGuard(null);
      return;
    }

    setSelectedObjectIdWithImageDrawingGuard(object.id);
  };

  const selectBoardObjectById = (objectId: string | null) => {
    if (!objectId) {
      setSelectedObjectIdWithImageDrawingGuard(null);
      return;
    }

    selectBoardObject(
      objects.find((candidate) => candidate.id === objectId) ?? null
    );
  };

  const getEffectiveImageBoundsForImageId = (
    objectId: string
  ): ImageEffectiveBounds | null => {
    const image = getImageById(objectId);

    if (!image) {
      return null;
    }

    const localImageNode = imageRefs.current[objectId];
    const sharedPreview =
      remoteImagePreviewPositions[objectId] ?? null;

    return resolveEffectiveImageBounds({
      committedImage: image,
      localNode: localImageNode,
      isLocallyInteracting:
        draggingImageId === objectId || transformingImageId === objectId,
      sharedPreview,
    });
  };

  const getTokenAnchorPosition = (
    object: BoardObject
  ): {
    x: number;
    y: number;
  } => {
    const attachment = getTokenAttachment(object);

    if (object.kind !== "token" || attachment.mode !== "attached") {
      return { x: object.x, y: object.y };
    }

    if (attachment.parentObjectKind !== "image") {
      return { x: object.x, y: object.y };
    }

    const parentImage = getEffectiveImageBoundsForImageId(
      attachment.parentObjectId
    );

    if (!parentImage) {
      return { x: object.x, y: object.y };
    }

    return {
      x: parentImage.x + parentImage.width * attachment.anchor.x,
      y: parentImage.y + parentImage.height * attachment.anchor.y,
    };
  };

  const createAttachedTokenAttachment = (
    image: BoardObject,
    point: { x: number; y: number }
  ): TokenAttachment => ({
    mode: "attached",
    parentObjectId: image.id,
    parentObjectKind: "image",
    coordinateSpace: "parent-normalized",
    anchor: {
      x: image.width > 0 ? (point.x - image.x) / image.width : 0.5,
      y: image.height > 0 ? (point.y - image.y) / image.height : 0.5,
    },
  });

  const getSnapshotObjectCount = (snapshot: {
    tokens: BoardObject[];
    images: BoardObject[];
    textCards: BoardObject[];
  } | null) =>
    snapshot
      ? snapshot.tokens.length + snapshot.images.length + snapshot.textCards.length
      : 0;

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
    return (
      resolveCurrentParticipantColor({
        participantId: stroke.creatorId,
        localParticipantSession: participantSession,
        participantPresences,
        roomOccupancies,
      }) ?? stroke.color
    );
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

  const recordGovernanceResolution = (
    resolution: GovernedActionAccessResolution
  ) => {
    const nextEntryId = governanceInspectionSequenceRef.current + 1;
    governanceInspectionSequenceRef.current = nextEntryId;

    setGovernanceInspectionEntries((currentEntries) => [
      {
        id: `governance-${nextEntryId}`,
        resolution,
        timestamp: Date.now(),
      },
      ...currentEntries,
    ].slice(0, 8));
  };

  const resolveRoomActionAccess = (actionKey: GovernanceActionKey) => {
    const resolution = resolveGovernedActionAccess({
      entity: createRoomGovernedEntityRef({
        roomId,
        creatorId: roomCreatorId,
      }),
      actionKey,
      participantId: participantSession.id,
      explicitAccessLevel: roomEffectiveAccessLevel,
      defaultAccessLevel: "full",
    });
    recordGovernanceResolution(resolution);

    return resolution;
  };

  const resolveObjectActionAccess = (
    objectId: string,
    actionKey: GovernanceActionKey
  ) => {
    const object = objects.find((candidate) => candidate.id === objectId);

    if (!object) {
      return null;
    }

    const resolution =
      actionKey === "board-object.delete"
        ? resolveBoardObjectDeletePolicyAccess({
            object,
            participantId: participantSession.id,
            roomCreatorId,
          })
        : actionKey === "board-object.clear-all-drawing"
          ? resolveImageClearAllDrawingPolicyAccess({
              object,
              participantId: participantSession.id,
              roomCreatorId,
            })
        : actionKey === "board-object.clear-own-drawing"
          ? resolveImageClearOwnDrawingPolicyAccess({
              object,
              participantId: participantSession.id,
            })
        : resolveGovernedActionAccess({
            entity: createBoardObjectGovernedEntityRef(object),
            actionKey,
            participantId: participantSession.id,
            defaultAccessLevel: "full",
          });

    recordGovernanceResolution(resolution);

    return resolution;
  };

  const noteCardRefs = useRef<Record<string, Konva.Group | null>>({});
  const imageRefs = useRef<Record<string, Konva.Image | null>>({});
  const imageStrokeLayerRefs = useRef<Record<string, Konva.Group | null>>({});
  const noteCardTransformerRef = useRef<Konva.Transformer | null>(null);
  const imageTransformerRef = useRef<Konva.Transformer | null>(null);
  const liveNoteCardResizePreviewRef = useRef<{
    noteCardId: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const liveNoteCardResizeFrameRef = useRef<number | null>(null);
  const boardBackgroundRef = useRef<Konva.Rect | null>(null);
  const panStateRef = useRef<{
    isPanning: boolean;
    startPointerX: number;
    startPointerY: number;
    startStageX: number;
    startStageY: number;
  } | null>(null);
  const ignoreNextBlurRef = useRef(false);
  const drawingImageIdRef = useRef<string | null>(null);
  const activeImageStrokeRef = useRef<ActiveImageStrokeSession | null>(null);
  const transformingImageSnapshotRef = useRef<Record<string, BoardObject>>({});
  const roomBootstrapEntryIdRef = useRef(0);
  const snapshotRecoveryAttemptedRoomRef = useRef<number | null>(null);
  const [resolvedSnapshotBootstrapRoomId, setResolvedSnapshotBootstrapRoomId] =
    useState<string | null>(null);
  const durableSnapshotRevisionRef = useRef<number | null>(null);
  const durableSliceRevisionRef = useRef<DurableSliceRevisionState>(
    createInitialDurableSliceRevisionState()
  );
  const durableWriteQueueRef = useRef<Promise<void>>(Promise.resolve());
  const governanceInspectionSequenceRef = useRef(0);
  const pendingLocalCursorPresenceFrameRef = useRef<number | null>(null);
  const pendingLocalCursorPresencePointRef = useRef<{
    clientX: number;
    clientY: number;
  } | null>(null);
  const lastPublishedLocalCursorRef = useRef<{
    x: number;
    y: number;
  } | null>(null);
  const lastLocalCursorPresenceSentAtRef = useRef(0);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>(
    {}
  );

  const scheduleNoteCardResizePreviewRender = () => {
    if (liveNoteCardResizeFrameRef.current !== null) {
      return;
    }

    liveNoteCardResizeFrameRef.current = window.requestAnimationFrame(() => {
      liveNoteCardResizeFrameRef.current = null;
      setLiveNoteCardResizePreview(liveNoteCardResizePreviewRef.current);
    });
  };

  const clearLiveNoteCardResizePreviewSession = () => {
    liveNoteCardResizePreviewRef.current = null;

    if (liveNoteCardResizeFrameRef.current !== null) {
      window.cancelAnimationFrame(liveNoteCardResizeFrameRef.current);
      liveNoteCardResizeFrameRef.current = null;
    }
  };

  const hasSharedRoomContentLoaded =
    tokenInitialSyncRoomId === roomId &&
    imageInitialSyncRoomId === roomId &&
    textCardInitialSyncRoomId === roomId;
  const sharedRoomObjects = useMemo(
    () =>
      getSharedBoardObjects(objects),
    [objects]
  );

  const clearImageDrawing = (id: string) => {
    const clearAccess = resolveObjectActionAccess(
      id,
      "board-object.clear-all-drawing"
    );

    if (!clearAccess?.isAllowed) {
      return;
    }

    applyBoardObjectsUpdate(
      (currentObjects) => clearImageStrokesInObjects(currentObjects, id),
      { syncSharedImageIds: [id] },
      {
        durableBoundary: "image-clear-all",
        durableSlice: "images",
      }
    );
  };

  const clearOwnImageDrawing = (id: string) => {
    const clearAccess = resolveObjectActionAccess(
      id,
      "board-object.clear-own-drawing"
    );

    if (!clearAccess?.isAllowed) {
      return;
    }

    applyBoardObjectsUpdate(
      (currentObjects) =>
        clearImageStrokesByCreatorInObjects(
          currentObjects,
          id,
          participantSession.id
        ),
      { syncSharedImageIds: [id] },
      {
        durableBoundary: "image-clear-own",
        durableSlice: "images",
      }
    );
  };

  const releaseImageDrawingLock = () => {
    setActiveImageDrawingLock(null);
  };

  const setDrawingImageSessionImageId = (nextImageId: string | null) => {
    drawingImageIdRef.current = nextImageId;
    setDrawingImageId(nextImageId);
  };

  const clearActiveImageStrokeSession = () => {
    activeImageStrokeRef.current = null;
  };

  const getImageDrawingLock = (imageId: string) => {
    return remoteImageDrawingLocks[imageId] ?? null;
  };

  const isImageLocallyDrawingInProgress = (imageId: string) => {
    return (
      drawingImageIdRef.current === imageId ||
      activeImageStrokeRef.current?.imageId === imageId
    );
  };

  const endImageStroke = () => {
    const activeStroke = activeImageStrokeRef.current;

    if (activeStroke) {
      syncCurrentImage(activeStroke.imageId);
      persistLocalReplica(objects, "image-draw-commit");
      persistDurableSliceWrite(objects, "image-draw-commit", "images");
    }

    clearActiveImageStrokeSession();
  };

  const finishImageDrawingMode = () => {
    endImageStroke();
    releaseImageDrawingLock();
    setDrawingImageSessionImageId(null);
  };

  const setSelectedObjectIdWithImageDrawingGuard = (
    nextSelectedObjectId: string | null
  ) => {
    if (
      drawingImageIdRef.current &&
      drawingImageIdRef.current !== nextSelectedObjectId
    ) {
      finishImageDrawingMode();
    }

    setSelectedObjectId(nextSelectedObjectId);
  };

  const isImageLockedByAnotherParticipant = (imageId: string) => {
    const lock = getImageDrawingLock(imageId);

    return !!lock && lock.participantId !== participantSession.id;
  };

  const startImageDrawingMode = (imageId: string) => {
    const drawAccess = resolveObjectActionAccess(imageId, "board-object.draw");

    if (!drawAccess?.isAllowed) {
      return;
    }

    if (isImageLockedByAnotherParticipant(imageId)) {
      return;
    }

    selectBoardObjectById(imageId);
    setDrawingImageSessionImageId(imageId);
    setActiveImageDrawingLock({
      imageId,
      participantId: participantSession.id,
      participantName: participantSession.name,
      participantColor: participantSession.color,
    });
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

  const handleRemoteImageDrawingLocksChange = useEffectEvent(
    (nextDrawingLocks: Record<string, ImageDrawingLock>) => {
      const currentDrawingImageId = drawingImageIdRef.current;

      if (currentDrawingImageId) {
        const currentDrawingLock = nextDrawingLocks[currentDrawingImageId] ?? null;

        if (
          currentDrawingLock &&
          currentDrawingLock.participantId !== participantSession.id
        ) {
          finishImageDrawingMode();
        }
      }

      setRemoteImageDrawingLocks(nextDrawingLocks);
    }
  );

  const resizeImageObject = (
    id: string,
    nextBounds: { x: number; y: number; width: number; height: number },
    scale: { x: number; y: number },
    strokeWidthScale: number
  ) => {
    const resizeAccess = resolveObjectActionAccess(id, "board-object.resize");

    if (!resizeAccess?.isAllowed) {
      return;
    }

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
      { syncSharedImageIds: [id] },
      { commitBoundary: "image-transform-end" }
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

    updateImagePreviewBounds(snapshot.id, {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      participantColor: participantSession.color,
    });
  };

  useEffect(() => {
    let isCancelled = false;
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

    roomBootstrapEntryIdRef.current = nextBootstrapEntryId;
    snapshotRecoveryAttemptedRoomRef.current = null;
    durableSnapshotRevisionRef.current = null;
    durableSliceRevisionRef.current = createInitialDurableSliceRevisionState();
    durableWriteQueueRef.current = Promise.resolve();
    panStateRef.current = null;
    clearLiveNoteCardResizePreviewSession();
    clearActiveImageStrokeSession();
    setLocalReplicaInspection({
      ...createInitialLocalReplicaInspectionState(),
      lastBootstrapBranch: "pending",
    });
    setDurableReplicaInspection(createInitialDurableReplicaInspectionState());
    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      replaceBoardObjects(getRoomScopedBoardObjects(roomId));
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
      setLiveNoteCardResizePreview(null);
      setDrawingImageSessionImageId(null);
      setTransformingImageId(null);
      setDraggingImageId(null);
      setDraggingTokenId(null);
      setDraggingNoteCardId(null);
      setRemoteImagePreviewPositions({});
      setRemoteImageDrawingLocks({});
      setRemoteTextCardEditingStates({});
      setRemoteTextCardResizeStates({});
      setLiveSelectedImageControlAnchor(null);
      setTokenInitialSyncRoomId(null);
      setImageInitialSyncRoomId(null);
      setTextCardInitialSyncRoomId(null);
      setResolvedSnapshotBootstrapRoomId(null);
      setIsDevToolsOpen(false);
      setObjectSemanticsHoverState(null);
      pendingLocalCursorPresencePointRef.current = null;
      lastPublishedLocalCursorRef.current = null;
      lastLocalCursorPresenceSentAtRef.current = 0;
    });

    return () => {
      isCancelled = true;
    };
  }, [replaceBoardObjects, roomId]);

  useEffect(() => {
    if (!isEditingParticipantName) {
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

    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("touchstart", handlePointerDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("touchstart", handlePointerDown);
    };
  }, [
    isEditingParticipantName,
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
      const nextContainerRect = containerRef.current?.getBoundingClientRect();

      setContainerRect(
        nextContainerRect
          ? {
              left: nextContainerRect.left,
              top: nextContainerRect.top,
            }
          : null
      );
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
    // Skip writes while local interaction is mid-flight so commit-time persistence
    // runs only after the committed end state lands in room objects.
    if (
      drawingImageId ||
      draggingImageId ||
      transformingImageId ||
      draggingTokenId ||
      draggingNoteCardId
    ) {
      return;
    }

    saveRoomSnapshot(roomId, objects);
  }, [
    drawingImageId,
    draggingNoteCardId,
    draggingTokenId,
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

      const resolveLiveBootstrap = async () => {
        let snapshot = null;

        try {
          snapshot = await loadDurableRoomSnapshot(roomId);
        } catch (error) {
          console.error(
            "Failed to resolve durable room snapshot during live bootstrap",
            error
          );
        }

        if (isCancelled) {
          return;
        }

        durableSnapshotRevisionRef.current = snapshot?.revision ?? null;
        durableSliceRevisionRef.current = getDurableSliceRevisionStateFromSnapshot(
          snapshot
        );
        setDurableReplicaInspection((current) => ({
          ...current,
          currentRevision: snapshot?.revision ?? null,
          currentSliceRevisions: cloneDurableSliceRevisionState(
            durableSliceRevisionRef.current
          ),
        }));
        console.info("[room-recovery][board-stage][bootstrap-terminal]", {
          roomId,
          branch: "live-wins",
          durableRevision: snapshot?.revision ?? null,
        });
        setLocalReplicaInspection((current) => ({
          ...current,
          lastBootstrapBranch: "live-wins",
          lastBootstrapLocalSource: null,
        }));
        snapshotRecoveryAttemptedRoomRef.current = roomBootstrapEntryIdRef.current;
        setResolvedSnapshotBootstrapRoomId(roomId);
      };

      void resolveLiveBootstrap();

      return () => {
        isCancelled = true;
      };
    }

    let isCancelled = false;

    const resolveRoomBootstrap = async () => {
      const composeSharedRoomObjects = (params: {
        roomId: string;
        tokens?: BoardObject[];
        images?: BoardObject[];
        textCards?: BoardObject[];
      }) => [
        ...getRoomScopedBoardObjects(params.roomId),
        ...(params.tokens ?? []),
        ...(params.images ?? []),
        ...(params.textCards ?? []),
      ];
      const composeBaselineRoomObjects = (
        nextRoomId: string,
        baselineObjects: BoardObject[]
      ) => [...getRoomScopedBoardObjects(nextRoomId), ...baselineObjects];
      const localBootstrapState = await loadLocalRoomDocumentBootstrapState(
        roomId
      );
      const localRecoverySnapshot = localBootstrapState.content;
      const localRecoverySource = localBootstrapState.source;
      const localRecoveryObjectCount = localBootstrapState.objectCount;
      const localRecoverySavedAt = localBootstrapState.savedAt;
      const localRecoveryRevision = localBootstrapState.revision;
      const localRecoveryIsVersionAware = localBootstrapState.isVersionAware;

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
      durableSliceRevisionRef.current = getDurableSliceRevisionStateFromSnapshot(
        durableSnapshot
      );
      setDurableReplicaInspection((current) => ({
        ...current,
        currentRevision: durableSnapshot?.revision ?? null,
        currentSliceRevisions: cloneDurableSliceRevisionState(
          durableSliceRevisionRef.current
        ),
      }));
      setLocalReplicaInspection((current) => ({
        ...current,
        lastReadSource: localRecoverySource,
        lastReadRevision: localRecoveryRevision,
        lastReadSavedAt: localRecoverySavedAt,
        lastReadObjectCount: localRecoveryObjectCount,
      }));

      const durableSnapshotObjectCount = getSnapshotObjectCount(durableSnapshot);
      const hasLocalRecoveryDocument =
        localRecoverySnapshot !== null &&
        (localRecoveryObjectCount > 0 || localRecoveryRevision !== null);
      const baselineObjects = roomBaselineToApply
        ? getRoomBaselinePayload(roomBaselineToApply)
        : [];
      const shouldApplyBaseline =
        durableSnapshotObjectCount === 0 &&
        !hasLocalRecoveryDocument &&
        baselineObjects.length > 0;
      const baselineIdToApply = shouldApplyBaseline
        ? roomBaselineToApply?.baselineId ?? null
        : null;
      let nextObjects: BoardObject[] | null = null;
      let terminalBranch:
        | "durable-recovery"
        | "local-recovery"
        | "baseline-initialization"
        | "empty-room" = "empty-room";
      let terminalSource: "durable" | "local" | "baseline" | null = null;

      console.info("[room-recovery][board-stage][bootstrap-inputs]", {
        roomId,
        bootstrapEntryId: roomBootstrapEntryIdRef.current,
        sharedRoomObjectCount: sharedRoomObjects.length,
        durableSnapshotObjectCount,
        localRecoveryObjectCount,
        localRecoverySource,
        localRecoveryRevision,
        localRecoveryIsVersionAware,
        durableSnapshotRevision: durableSnapshot?.revision ?? null,
        localRecoverySavedAt,
      });

      if (durableSnapshot && durableSnapshotObjectCount > 0) {
        nextObjects = composeSharedRoomObjects({
          roomId,
          tokens: durableSnapshot.tokens,
          images: durableSnapshot.images,
          textCards: durableSnapshot.textCards,
        });
        terminalBranch = "durable-recovery";
        terminalSource = "durable";
      } else if (hasLocalRecoveryDocument && localRecoverySnapshot) {
        nextObjects = composeSharedRoomObjects({
          roomId,
          tokens: localRecoverySnapshot.tokens,
          images: localRecoverySnapshot.images,
          textCards: localRecoverySnapshot.textCards,
        });
        terminalBranch = "local-recovery";
        terminalSource = "local";
      } else if (shouldApplyBaseline) {
        nextObjects = composeBaselineRoomObjects(roomId, baselineObjects);
        terminalBranch = "baseline-initialization";
        terminalSource = "baseline";
      }

      console.info("[room-recovery][board-stage][bootstrap-terminal]", {
        roomId,
        bootstrapEntryId: roomBootstrapEntryIdRef.current,
        branch: terminalBranch,
        source: terminalSource,
        localSource: terminalSource === "local" ? localRecoverySource : null,
        localRevision:
          terminalSource === "local" ? localRecoveryRevision : null,
        tokenCount:
          terminalSource === "durable"
            ? durableSnapshot?.tokens.length ?? 0
            : terminalSource === "local"
              ? localRecoverySnapshot?.tokens.length ?? 0
              : terminalSource === "baseline"
                ? baselineObjects.filter((object) => object.kind === "token").length
                : 0,
        imageCount:
          terminalSource === "durable"
            ? durableSnapshot?.images.length ?? 0
            : terminalSource === "local"
              ? localRecoverySnapshot?.images.length ?? 0
              : terminalSource === "baseline"
                ? baselineObjects.filter((object) => object.kind === "image").length
                : 0,
        textCardCount:
          terminalSource === "durable"
            ? durableSnapshot?.textCards.length ?? 0
            : terminalSource === "local"
            ? localRecoverySnapshot?.textCards.length ?? 0
              : terminalSource === "baseline"
                ? baselineObjects.filter((object) => isNoteCardObject(object)).length
                : 0,
      });
      setLocalReplicaInspection((current) => ({
        ...current,
        lastBootstrapBranch: terminalBranch,
        lastBootstrapLocalSource:
          terminalBranch === "local-recovery" ? localRecoverySource : null,
      }));

      snapshotRecoveryAttemptedRoomRef.current = roomBootstrapEntryIdRef.current;

      if (nextObjects) {
        replaceBoardObjects(nextObjects, {
          syncSharedTokens: true,
          syncSharedImages: true,
          syncSharedTextCards: true,
        });
      }

      setResolvedSnapshotBootstrapRoomId(roomId);

      if (baselineIdToApply) {
        onRoomBaselineApplied(baselineIdToApply);
      }
    };

    void resolveRoomBootstrap();

    return () => {
      isCancelled = true;
    };
  }, [
    hasSharedRoomContentLoaded,
    onRoomBaselineApplied,
    replaceBoardObjects,
    roomBaselineToApply,
    roomId,
    sharedRoomObjects.length,
  ]);

  useEffect(() => {
    const connection = createRoomTokenConnection({
      roomId,
      onActiveMovesChange: setRemoteActiveObjectMoves,
      onTokensChange: receiveSharedTokens,
      onInitialSyncComplete: () => {
        setTokenInitialSyncRoomId(roomId);
      },
    });
    attachTokenConnection(connection);

    return () => {
      detachTokenConnection(connection);
      connection.destroy();
    };
  }, [attachTokenConnection, detachTokenConnection, receiveSharedTokens, roomId]);

  useEffect(() => {
    const connection = createRoomImageConnection({
      roomId,
      onImagesChange: (sharedImages) => {
        receiveSharedImages(sharedImages, (sharedImage, localImage) => {
          if (localImage && transformingImageSnapshotRef.current[sharedImage.id]) {
            return localImage;
          }

          if (
            !isImageLocallyDrawingInProgress(sharedImage.id) ||
            !localImage?.imageStrokes?.length
          ) {
            return sharedImage;
          }

          return {
            ...sharedImage,
            imageStrokes: localImage.imageStrokes,
          };
        });
      },
      onInitialSyncComplete: () => {
        setImageInitialSyncRoomId(roomId);
      },
      onImagePreviewPositionsChange: setRemoteImagePreviewPositions,
      onImageDrawingLocksChange: handleRemoteImageDrawingLocksChange,
    });
    attachImageConnection(connection);

    return () => {
      detachImageConnection(connection);
      connection.destroy();
    };
  }, [
    attachImageConnection,
    detachImageConnection,
    receiveSharedImages,
    roomId,
  ]);

  useEffect(() => {
    const connection = createRoomTextCardConnection({
      roomId,
      onTextCardsChange: receiveSharedTextCards,
      onInitialSyncComplete: () => {
        setTextCardInitialSyncRoomId(roomId);
      },
      onTextCardEditingStatesChange: setRemoteTextCardEditingStates,
      onTextCardResizeStatesChange: setRemoteTextCardResizeStates,
    });
    attachTextCardConnection(connection);

    return () => {
      detachTextCardConnection(connection);
      connection.destroy();
    };
  }, [
    attachTextCardConnection,
    detachTextCardConnection,
    receiveSharedTextCards,
    roomId,
  ]);

  useEffect(() => {
    setActiveTextCardEditingState(
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
    setActiveTextCardEditingState,
  ]);

  useEffect(() => {
    return () => {
      setActiveTextCardResizeState(null);
    };
  }, [setActiveTextCardResizeState]);

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
      const selectedObject = objects.find((object) => object.id === selectedObjectId);

      if (selectedObject?.kind === "token") {
        return;
      }

      const deleteAccess = resolveObjectActionAccess(
        selectedObjectId,
        "board-object.delete"
      );

      if (!deleteAccess?.isAllowed) {
        return;
      }

      if (drawingImageId) {
        finishImageDrawingMode();
      }

      removeBoardObject(selectedObjectId);
      setSelectedObjectId(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    drawingImageId,
    editingTextCardId,
    finishImageDrawingMode,
    objects,
    removeBoardObject,
    resolveObjectActionAccess,
    selectedObjectId,
  ]);

  const sortedObjects = useMemo(() => {
    return [...objects].sort(
      (a, b) => objectLayerOrder[a.kind] - objectLayerOrder[b.kind]
    );
  }, [objects]);

  const updateObjectPosition = (
    id: string,
    x: number,
    y: number,
    localOptions?: LocalObjectsChangeOptions
  ) => {
    const moveAccess = resolveObjectActionAccess(id, "board-object.move");

    if (!moveAccess?.isAllowed) {
      return;
    }

    applyBoardObjectsUpdate(
      (currentObjects) => updateBoardObjectPosition(currentObjects, id, x, y),
      getUpdateBoardObjectSyncOptions(objects, id),
      localOptions
    );
  };

  const updateTokenAnchorPosition = (id: string, x: number, y: number) => {
    const moveAccess = resolveObjectActionAccess(id, "board-object.move");

    if (!moveAccess?.isAllowed) {
      return;
    }

    applyBoardObjectsUpdate(
      (currentObjects) =>
        updateBoardObjectById(currentObjects, id, (object) => {
          if (object.kind !== "token") {
            return object;
          }

          return {
            ...object,
            x,
            y,
            tokenAttachment: {
              mode: "free",
            },
          };
        }),
      getUpdateBoardObjectSyncOptions(objects, id)
    );
  };

  const updateTokenPlacementAfterDrop = (id: string, point: { x: number; y: number }) => {
    const moveAccess = resolveObjectActionAccess(id, "board-object.move");

    if (!moveAccess?.isAllowed) {
      return;
    }

    applyBoardObjectsUpdate(
      (currentObjects) =>
        updateBoardObjectById(currentObjects, id, (object) => {
          if (object.kind !== "token") {
            return object;
          }

          const attachmentTarget = currentObjects
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
              tokenAttachment: {
                mode: "free",
              },
            };
          }

          return {
            ...object,
            x: point.x,
            y: point.y,
            tokenAttachment: createAttachedTokenAttachment(attachmentTarget, point),
          };
        }),
      getUpdateBoardObjectSyncOptions(objects, id),
      { commitBoundary: "token-drop" }
    );
  };

  const previewImagePosition = (id: string, x: number, y: number) => {
    applyBoardObjectsUpdate((currentObjects) =>
      updateBoardObjectPosition(currentObjects, id, x, y)
    );
    updateImagePositionPreview(id, x, y, participantSession.color);
  };

  const updateObjectLabel = (
    id: string,
    label: string,
    localOptions?: LocalObjectsChangeOptions
  ) => {
    const editAccess = resolveObjectActionAccess(id, "board-object.edit");

    if (!editAccess?.isAllowed) {
      return;
    }

    applyBoardObjectsUpdate(
      (currentObjects) => updateBoardObjectLabel(currentObjects, id, label),
      getUpdateBoardObjectSyncOptions(objects, id),
      localOptions
    );
  };

  const resizeTextCardBounds = (
    id: string,
    nextBounds: { x: number; y: number; width: number; height: number },
    localOptions?: LocalObjectsChangeOptions
  ) => {
    const resizeAccess = resolveObjectActionAccess(id, "board-object.resize");

    if (!resizeAccess?.isAllowed) {
      return;
    }

    applyBoardObjectsUpdate(
      (currentObjects) =>
        updateBoardObjectById(currentObjects, id, (object) => {
          if (!isNoteCardObject(object)) {
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
        }),
      getUpdateBoardObjectSyncOptions(objects, id),
      localOptions
    );
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

  const getImageControlsAnchorFromBounds = (bounds: {
    x: number;
    y: number;
  }) => {
    return {
      x: bounds.x,
      y: bounds.y,
    };
  };

  const updateLiveSelectedImageControlAnchor = (
    imageId: string,
    node: Konva.Image
  ) => {
    const bounds = node.getClientRect({
      skipShadow: true,
      skipStroke: true,
      relativeTo: node.getLayer() ?? undefined,
    });

    setLiveSelectedImageControlAnchor({
      imageId,
      ...getImageControlsAnchorFromBounds(bounds),
    });
  };

  const createParticipantMarker = (position?: { x: number; y: number }) => {
    const createTokenAccess = resolveRoomActionAccess("room.add-token");

    if (!createTokenAccess.isAllowed) {
      return null;
    }

    const markerPosition =
      position ??
      getViewportCenterInBoardCoords({
        stageWidth: stageSize.width,
        stageHeight: stageSize.height,
        stageX: stagePosition.x,
        stageY: stagePosition.y,
        stageScale,
      });

    return createTokenObject({
      id: `token-${createClientId()}`,
      color: currentUserColor,
      creatorId: participantSession.id,
      position: markerPosition,
    });
  };

  useEffect(() => {
    if (tokenInitialSyncRoomId !== roomId) {
      return;
    }

    if (resolvedSnapshotBootstrapRoomId !== roomId) {
      return;
    }

    const participantMarkers = getParticipantMarkerTokens(
      objects,
      participantSession.id
    ).sort((a, b) => a.id.localeCompare(b.id));

    if (participantMarkers.length === 1) {
      return;
    }

    if (participantMarkers.length === 0) {
      const marker = createParticipantMarker();

      if (!marker) {
        return;
      }

      addBoardObject(marker);
      return;
    }

    applyBoardObjectsUpdate(
      (currentObjects) => {
        const currentParticipantMarkers = getParticipantMarkerTokens(
          currentObjects,
          participantSession.id
        ).sort((a, b) => a.id.localeCompare(b.id));

        if (currentParticipantMarkers.length <= 1) {
          return currentObjects;
        }

        const [, ...markersToRemove] = currentParticipantMarkers;
        const removeIds = new Set(markersToRemove.map((marker) => marker.id));

        return currentObjects.filter((object) => !removeIds.has(object.id));
      },
      { syncSharedTokens: true },
      {
        durableBoundary: "object-remove",
        durableSlice: "tokens",
      }
    );
  }, [
    addBoardObject,
    applyBoardObjectsUpdate,
    currentUserColor,
    objects,
    participantSession.id,
    roomId,
    resolvedSnapshotBootstrapRoomId,
    stagePosition.x,
    stagePosition.y,
    stageScale,
    stageSize.height,
    stageSize.width,
    tokenInitialSyncRoomId,
  ]);

  const createNote = () => {
    const createNoteAccess = resolveRoomActionAccess("room.add-note");

    if (!createNoteAccess.isAllowed) {
      return;
    }

    const center = getViewportCenterInBoardCoords({
      stageWidth: stageSize.width,
      stageHeight: stageSize.height,
      stageX: stagePosition.x,
      stageY: stagePosition.y,
      stageScale,
    });
    const newNote = createNoteCardObject({
      id: `note-${createClientId()}`,
      color: currentUserColor,
      creatorId: participantSession.id,
      position: center,
    });

    addBoardObject(newNote);
    selectBoardObject(newNote);
  };

  const createImageFromFile = (
    file: File,
    position?: { x: number; y: number }
  ) => {
    const createImageAccess = resolveRoomActionAccess("room.add-image");

    if (!createImageAccess.isAllowed) {
      return;
    }

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
        selectBoardObject(newImage);
      };

      image.src = originalSrc;
    };

    reader.readAsDataURL(file);
  };

  const resetBoard = () => {
    const resetAccess = resolveRoomActionAccess("room.reset-board");

    if (!resetAccess.isAllowed) {
      return;
    }

    replaceBoardObjects(EMPTY_BOARD_STATE, {
      syncSharedTokens: true,
      syncSharedImages: true,
      syncSharedTextCards: true,
    });
    persistLegacyDurableSnapshot(EMPTY_BOARD_STATE, "room-reset");
    setSelectedObjectIdWithImageDrawingGuard(null);
    clearBoardContentStorage(roomId);
  };

  const startEditingTextCard = (object: BoardObject) => {
    const nextContainerRect = containerRef.current?.getBoundingClientRect();

    setContainerRect(
      nextContainerRect
        ? {
            left: nextContainerRect.left,
            top: nextContainerRect.top,
          }
        : null
    );
    selectBoardObject(object);
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

    updateObjectLabel(editingTextCardId, editingDraft, {
      commitBoundary: "note-text-save",
    });
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
    const transformer = noteCardTransformerRef.current;

    if (!transformer) {
      return;
    }

    const selectedNoteCardNode =
      selectedObjectId && !editingTextCardId
        ? noteCardRefs.current[selectedObjectId] ?? null
        : null;

    if (selectedNoteCardNode) {
      transformer.nodes([selectedNoteCardNode]);
    } else {
      transformer.nodes([]);
    }

    transformer.getLayer()?.batchDraw();
  }, [editingTextCardId, selectedObjectId]);

  useEffect(() => {
    if (!selectedObjectId || editingTextCardId) {
      clearLiveNoteCardResizePreviewSession();
      return;
    }

    if (!noteCardRefs.current[selectedObjectId]) {
      clearLiveNoteCardResizePreviewSession();
    }
  }, [editingTextCardId, selectedObjectId]);

  useEffect(() => {
    return () => {
      if (liveNoteCardResizeFrameRef.current !== null) {
        window.cancelAnimationFrame(liveNoteCardResizeFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (editingTextCardId && !noteCardRefs.current[editingTextCardId]) {
      clearLiveNoteCardResizePreviewSession();
    }
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
    remoteImageDrawingLocks,
    selectedObjectId,
  ]);

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
    ? objects.find(
        (object) => object.id === editingTextCardId && isNoteCardObject(object)
      ) ?? null
    : null;
  const visibleLiveNoteCardResizePreview =
    liveNoteCardResizePreview &&
    selectedObjectId === liveNoteCardResizePreview.noteCardId &&
    !editingTextCardId &&
    objects.some(
      (object) =>
        object.id === liveNoteCardResizePreview.noteCardId &&
        isNoteCardObject(object)
    )
      ? liveNoteCardResizePreview
      : null;
  const getNoteCardPreviewBounds = (object: BoardObject) => {
    if (
      visibleLiveNoteCardResizePreview &&
      visibleLiveNoteCardResizePreview.noteCardId === object.id
    ) {
      return visibleLiveNoteCardResizePreview;
    }

    return {
      noteCardId: object.id,
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    };
  };
  const editingTextCardDisplayHeight = editingTextCard
    ? Math.max(
        getNoteCardPreviewBounds(editingTextCard).height,
        getNoteCardHeightForLabel(
          editingDraft,
          getNoteCardPreviewBounds(editingTextCard).width
        )
      )
    : null;
  const selectedImageObject =
    selectedObjectId && !editingTextCardId
      ? objects.find(
          (object) => object.id === selectedObjectId && object.kind === "image"
        ) ?? null
      : null;
  const selectedTokenObject =
    selectedObjectId && !editingTextCardId
      ? objects.find(
          (object) => object.id === selectedObjectId && object.kind === "token"
        ) ?? null
      : null;
  const selectedNoteCardObject =
    selectedObjectId && !editingTextCardId
      ? objects.find(
          (object) => object.id === selectedObjectId && isNoteCardObject(object)
        ) ?? null
      : null;
  const selectedImageLock = selectedImageObject
    ? getImageDrawingLock(selectedImageObject.id)
    : null;
  const isSelectedImageLockedByAnotherParticipant =
    !!selectedImageLock &&
    selectedImageLock.participantId !== participantSession.id;
  const isSelectedImageLocallyInteracting =
    !!selectedImageObject &&
    (draggingImageId === selectedImageObject.id ||
      transformingImageId === selectedImageObject.id);
  const selectedImageEffectiveBounds = selectedImageObject
    ? getEffectiveImageBoundsForImageId(selectedImageObject.id)
    : null;
  const selectedImageLiveControlAnchor =
    selectedImageObject &&
    isSelectedImageLocallyInteracting &&
    liveSelectedImageControlAnchor?.imageId === selectedImageObject.id
      ? liveSelectedImageControlAnchor
      : null;
  const selectedImageControlAnchor =
    selectedImageLiveControlAnchor ??
    (selectedImageEffectiveBounds
      ? getImageControlsAnchorFromBounds(selectedImageEffectiveBounds)
      : null);
  const inspectableImageObject =
    selectedImageObject ??
    (sharedImageObjects.length === 1 ? sharedImageObjects[0] : null);
  const inspectableImageBounds = inspectableImageObject
    ? {
        x: Math.round(inspectableImageObject.x),
        y: Math.round(inspectableImageObject.y),
        width: Math.round(inspectableImageObject.width),
        height: Math.round(inspectableImageObject.height),
      }
    : null;
  const inspectableImageStrokeStats = inspectableImageObject
    ? {
        total: inspectableImageObject.imageStrokes?.length ?? 0,
        own:
          inspectableImageObject.imageStrokes?.filter(
            (stroke) => stroke.creatorId === participantSession.id
          ).length ?? 0,
        points:
          inspectableImageObject.imageStrokes?.reduce(
            (pointCount, stroke) => pointCount + Math.round(stroke.points.length / 2),
            0
          ) ?? 0,
      }
    : null;
  const inspectableImageTarget =
    selectedImageObject && inspectableImageObject
      ? "selected"
      : inspectableImageObject
        ? "sole"
        : "none";
  const participantInspectableToken =
    sharedTokenObjects.filter(
      (object) => object.creatorId === participantSession.id
    ).length === 1
      ? sharedTokenObjects.find(
          (object) => object.creatorId === participantSession.id
        ) ?? null
      : null;
  const inspectableTokenObject =
    selectedTokenObject ??
    participantInspectableToken ??
    (sharedTokenObjects.length === 1 ? sharedTokenObjects[0] : null);
  const inspectableTokenPosition = inspectableTokenObject
    ? getTokenAnchorPosition(inspectableTokenObject)
    : null;
  const inspectableTokenTarget =
    selectedTokenObject && inspectableTokenObject
      ? "selected"
      : participantInspectableToken &&
          inspectableTokenObject === participantInspectableToken
        ? "participant-marker"
        : inspectableTokenObject
          ? "sole"
          : "none";
  const inspectableNoteCardObject =
    selectedNoteCardObject ??
    (sharedNoteObjects.filter(
      (object) => object.creatorId === participantSession.id
    ).length === 1
      ? sharedNoteObjects.find(
          (object) => object.creatorId === participantSession.id
        ) ?? null
      : null) ??
    (sharedNoteObjects.length === 1 ? sharedNoteObjects[0] : null);
  const inspectableNoteCardBounds = inspectableNoteCardObject
    ? {
        x: Math.round(inspectableNoteCardObject.x),
        y: Math.round(inspectableNoteCardObject.y),
        width: Math.round(inspectableNoteCardObject.width),
        height: Math.round(inspectableNoteCardObject.height),
      }
    : null;
  const inspectableNoteCardTarget =
    selectedNoteCardObject && inspectableNoteCardObject
      ? "selected"
      : inspectableNoteCardObject &&
          inspectableNoteCardObject.creatorId === participantSession.id
        ? "participant-owned"
      : inspectableNoteCardObject
        ? "sole"
        : "none";

  const inspectedObject = objectSemanticsHoverState
    ? objects.find((object) => object.id === objectSemanticsHoverState.objectId) ?? null
    : null;
  const governanceRoomSummary = useMemo(
    () =>
      resolveGovernedActionAccess({
        entity: createRoomGovernedEntityRef({
          roomId,
          creatorId: roomCreatorId,
        }),
        actionKey: "room.add-image",
        participantId: participantSession.id,
        explicitAccessLevel: roomEffectiveAccessLevel,
        defaultAccessLevel: "full",
      }),
    [participantSession.id, roomCreatorId, roomEffectiveAccessLevel, roomId]
  );
  const governanceSelectedObjectSummary = useMemo(() => {
    if (!selectedObjectId) {
      return null;
    }

    const selectedObject = objects.find((object) => object.id === selectedObjectId);

    if (!selectedObject) {
      return null;
    }

    return resolveBoardObjectDeletePolicyAccess({
      object: selectedObject,
      participantId: participantSession.id,
      roomCreatorId,
    });
  }, [objects, participantSession.id, roomCreatorId, selectedObjectId]);
  const governanceSelectedImageClearSummary = selectedImageObject
    ? resolveImageClearAllDrawingPolicyAccess({
        object: selectedImageObject,
        participantId: participantSession.id,
        roomCreatorId,
      })
    : null;
  const governanceSelectedImageClearOwnSummary = selectedImageObject
    ? resolveImageClearOwnDrawingPolicyAccess({
        object: selectedImageObject,
        participantId: participantSession.id,
      })
    : null;
  const selectedImageControlButtons: Array<{
    key: string;
    label: string;
    recipe?: ButtonRecipe;
  }> = [];

  if (selectedImageObject) {
    selectedImageControlButtons.push({
      key: "draw",
      label: drawingImageId === selectedImageObject.id ? "Save" : "Draw",
      recipe:
        drawingImageId === selectedImageObject.id
          ? createParticipantAccentButtonRecipeWithMode(
              interactionButtonRecipes.primary.pill,
              participantSession.color,
              "fill"
            )
          : createParticipantAccentButtonRecipeWithMode(
              interactionButtonRecipes.secondary.pill,
              participantSession.color,
              "border"
            ),
    });

    if (
      drawingImageId !== selectedImageObject.id &&
      governanceSelectedImageClearOwnSummary?.isAllowed
    ) {
      selectedImageControlButtons.push({
        key: "clear-own",
        label: "Clear",
        recipe: interactionButtonRecipes.danger.pill,
      });
    }

    if (
      drawingImageId !== selectedImageObject.id &&
      governanceSelectedImageClearSummary?.isAllowed &&
      (selectedImageObject.imageStrokes?.length ?? 0) > 0
    ) {
      selectedImageControlButtons.push({
        key: "clear-all",
        label: "Clear all",
        recipe: interactionButtonRecipes.danger.pill,
      });
    }
  }

  const moveInspectableImageForSmoke = () => {
    if (!inspectableImageObject) {
      return;
    }

    updateObjectPosition(
      inspectableImageObject.id,
      inspectableImageObject.x + 96,
      inspectableImageObject.y + 72,
      { commitBoundary: "image-drag-end" }
    );
    selectBoardObject(inspectableImageObject);
  };

  const resizeInspectableImageForSmoke = () => {
    if (!inspectableImageObject) {
      return;
    }

    const nextWidth = inspectableImageObject.width + 128;
    const nextHeight = inspectableImageObject.height + 96;
    const scaleX =
      inspectableImageObject.width > 0
        ? nextWidth / inspectableImageObject.width
        : 1;
    const scaleY =
      inspectableImageObject.height > 0
        ? nextHeight / inspectableImageObject.height
        : 1;

    resizeImageObject(
      inspectableImageObject.id,
      {
        x: inspectableImageObject.x,
        y: inspectableImageObject.y,
        width: nextWidth,
        height: nextHeight,
      },
      {
        x: scaleX,
        y: scaleY,
      },
      (Math.abs(scaleX) + Math.abs(scaleY)) / 2
    );
    selectBoardObject(inspectableImageObject);
  };

  const drawSmokeStrokeOnInspectableImage = () => {
    if (!inspectableImageObject) {
      return;
    }

    const horizontalInset = Math.max(
      Math.min(Math.round(inspectableImageObject.width * 0.18), 28),
      10
    );
    const verticalInset = Math.max(
      Math.min(Math.round(inspectableImageObject.height * 0.18), 28),
      10
    );
    const midX = Math.round(inspectableImageObject.width * 0.52);
    const midY = Math.round(inspectableImageObject.height * 0.44);
    const endX = Math.max(inspectableImageObject.width - horizontalInset, midX + 8);
    const endY = Math.max(inspectableImageObject.height - verticalInset, midY + 8);

    updateBoardObject(
      inspectableImageObject.id,
      (object) => {
        if (object.kind !== "image") {
          return object;
        }

        return {
          ...object,
          imageStrokes: [
            ...(object.imageStrokes ?? []),
            {
              color: currentUserColor,
              creatorId: participantSession.id,
              points: [
                horizontalInset,
                verticalInset,
                midX,
                midY,
                endX,
                endY,
              ],
              width: DEFAULT_IMAGE_STROKE_WIDTH,
            },
          ],
        };
      },
      { commitBoundary: "image-draw-commit" }
    );
    window.requestAnimationFrame(() => {
      syncCurrentImage(inspectableImageObject.id);
    });
    selectBoardObject(inspectableImageObject);
  };

  const moveInspectableTokenForSmoke = () => {
    if (!inspectableTokenObject || !inspectableTokenPosition) {
      return;
    }

    updateTokenPlacementAfterDrop(inspectableTokenObject.id, {
      x: inspectableTokenPosition.x + 84,
      y: inspectableTokenPosition.y + 60,
    });
    selectBoardObject(inspectableTokenObject);
  };

  const moveInspectableNoteCardForSmoke = () => {
    if (!inspectableNoteCardObject) {
      return;
    }

    updateObjectPosition(
      inspectableNoteCardObject.id,
      inspectableNoteCardObject.x + 112,
      inspectableNoteCardObject.y + 84,
      { commitBoundary: "note-drag-end" }
    );
    selectBoardObject(inspectableNoteCardObject);
  };

  const saveInspectableNoteCardTextForSmoke = () => {
    if (!inspectableNoteCardObject) {
      return;
    }

    const nextLabelBase = inspectableNoteCardObject.label.replace(
      /\s+\[smoke-saved\]$/,
      ""
    );

    updateObjectLabel(
      inspectableNoteCardObject.id,
      `${nextLabelBase} [smoke-saved]`,
      { commitBoundary: "note-text-save" }
    );
    selectBoardObject(inspectableNoteCardObject);
  };

  const resizeInspectableNoteCardForSmoke = () => {
    if (!inspectableNoteCardObject) {
      return;
    }

    resizeTextCardBounds(
      inspectableNoteCardObject.id,
      {
        x: inspectableNoteCardObject.x,
        y: inspectableNoteCardObject.y,
        width: inspectableNoteCardObject.width + 96,
        height: inspectableNoteCardObject.height + 72,
      },
      { commitBoundary: "note-resize-end" }
    );
    selectBoardObject(inspectableNoteCardObject);
  };

  const editingTextareaStyle = useMemo<EditingTextareaStyle | null>(() => {
    if (!editingTextCard) {
      return null;
    }

    if (!containerRect) {
      return null;
    }

    const left =
      stagePosition.x +
      (editingTextCard.x + TEXT_CARD_BODY_INSET_X) * stageScale -
      containerRect.left;
    const top =
      stagePosition.y +
      (editingTextCard.y + TEXT_CARD_BODY_INSET_Y) * stageScale -
      containerRect.top;
    const width = Math.max(
      (editingTextCard.width - TEXT_CARD_BODY_INSET_X * 2) * stageScale,
      40
    );
    const height = Math.max(
      (
        (editingTextCardDisplayHeight ?? editingTextCard.height) -
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
  }, [
    containerRect,
    editingTextCard,
    editingTextCardDisplayHeight,
    stagePosition.x,
    stagePosition.y,
    stageScale,
  ]);

  const flushLocalCursorPresence = useEffectEvent(() => {
    pendingLocalCursorPresenceFrameRef.current = null;

    const nextPoint = pendingLocalCursorPresencePointRef.current;
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!nextPoint || !containerRect) {
      return;
    }

    const cursor = getBoardPointFromScreen({
      clientX: nextPoint.clientX,
      clientY: nextPoint.clientY,
      containerLeft: containerRect.left,
      containerTop: containerRect.top,
      stageX: stagePosition.x,
      stageY: stagePosition.y,
      stageScale,
    });
    const lastPublishedCursor = lastPublishedLocalCursorRef.current;
    const now = Date.now();
    const cursorChanged =
      !lastPublishedCursor ||
      lastPublishedCursor.x !== cursor.x ||
      lastPublishedCursor.y !== cursor.y;
    const isPublishIntervalReady =
      now - lastLocalCursorPresenceSentAtRef.current >=
      LOCAL_CURSOR_PRESENCE_MIN_INTERVAL_MS;

    if (cursorChanged && !isPublishIntervalReady) {
      pendingLocalCursorPresenceFrameRef.current = window.requestAnimationFrame(() =>
        flushLocalCursorPresence()
      );
      return;
    }

    if (!cursorChanged && !isPublishIntervalReady) {
      return;
    }

    lastPublishedLocalCursorRef.current = cursor;
    lastLocalCursorPresenceSentAtRef.current = now;

    onUpdateLocalPresence((presence) =>
      presence
        ? {
            ...presence,
            cursor,
            lastActiveAt: now,
          }
        : null
    );
  });

  const scheduleLocalCursorPresencePublish = (
    clientX: number,
    clientY: number
  ) => {
    pendingLocalCursorPresencePointRef.current = {
      clientX,
      clientY,
    };

    if (pendingLocalCursorPresenceFrameRef.current !== null) {
      return;
    }

    pendingLocalCursorPresenceFrameRef.current = window.requestAnimationFrame(() =>
      flushLocalCursorPresence()
    );
  };

  const clearLocalCursorPresence = useEffectEvent(() => {
    pendingLocalCursorPresencePointRef.current = null;

    if (pendingLocalCursorPresenceFrameRef.current !== null) {
      window.cancelAnimationFrame(pendingLocalCursorPresenceFrameRef.current);
      pendingLocalCursorPresenceFrameRef.current = null;
    }

    lastPublishedLocalCursorRef.current = null;
    lastLocalCursorPresenceSentAtRef.current = Date.now();

    onUpdateLocalPresence((presence) =>
      presence
        ? {
            ...presence,
            cursor: null,
            lastActiveAt: Date.now(),
          }
        : null
    );
  });

  useEffect(() => {
    return () => {
      if (pendingLocalCursorPresenceFrameRef.current !== null) {
        window.cancelAnimationFrame(pendingLocalCursorPresenceFrameRef.current);
      }
    };
  }, []);

  const updateLocalCursorPresence = (clientX: number, clientY: number) => {
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!containerRect) {
      return;
    }

    scheduleLocalCursorPresencePublish(clientX, clientY);
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

  const canvasBoardMaterials = useMemo(() => resolveBoardCanvasMaterials(), []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        margin: 0,
        overflow: "hidden",
        background: boardMaterials.backdrop,
      }}
      onMouseMove={(event) => {
        updateLocalCursorPresence(event.clientX, event.clientY);
      }}
      onMouseLeave={() => {
        clearLocalCursorPresence();
      }}
      onTouchMove={(event) => {
        const touch = event.touches[0];

        if (!touch) {
          return;
        }

        updateLocalCursorPresence(touch.clientX, touch.clientY);
      }}
      onTouchEnd={() => {
        clearLocalCursorPresence();
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
        className={createParticipantAccentButtonRecipe(
          buttonRecipes.secondary.small,
          participantSession.color
        ).className}
        {...getDesignSystemDebugAttrs(
          createParticipantAccentButtonRecipe(
            buttonRecipes.secondary.small,
            participantSession.color
          ).debug
        )}
        style={{
          ...createParticipantAccentButtonRecipe(
            buttonRecipes.secondary.small,
            participantSession.color
          ).style,
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 30,
          pointerEvents: "auto",
          width: 32,
          minWidth: 32,
          height: 32,
          minHeight: 32,
          padding: 0,
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        +
      </button>

      <ParticipantSessionPanel
        ref={sessionPanelRef}
        roomId={roomId}
        isCurrentParticipantRoomCreator={isCurrentParticipantRoomCreator}
        roomCreatorName={roomCreatorName}
        roomCreatorColor={
          roomCreatorId && roomCreatorId !== participantSession.id
            ? resolveCurrentParticipantColor({
                participantId: roomCreatorId,
                localParticipantSession: participantSession,
                participantPresences,
                roomOccupancies,
              })
            : null
        }
        participantName={participantSession.name}
        participantColor={participantSession.color}
        participantNameDraft={participantNameDraft}
        isEditingParticipantName={isEditingParticipantName}
        isDebugToolsEnabled={isDebugControlsEnabled}
        isDevToolsOpen={isDevToolsOpen}
        onLeaveRoom={onLeaveRoom}
        onResetBoard={resetBoard}
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
        devToolsContent={
          <div style={{ display: "grid", gap: 12 }}>
            <div
              className={surfaceRecipes.inset.default.className}
              style={{
                ...surfaceRecipes.inset.default.style,
                gap: 8,
                fontSize: 12,
              }}
              data-testid="debug-room-object-counts"
              {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#94a3b8",
                }}
              >
                Room objects
              </div>
              <div style={{ color: "#e2e8f0" }}>Total: {sharedObjectCount}</div>
              <div style={{ color: "#94a3b8" }}>
                tokens {sharedTokenCount}
                {" · "}images {sharedImageCount}
                {" · "}notes {sharedNoteCount}
              </div>
            </div>

            <div
              className={surfaceRecipes.inset.default.className}
              style={{
                ...surfaceRecipes.inset.default.style,
                gap: 8,
                fontSize: 12,
              }}
              data-testid="debug-image-inspection"
              {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#94a3b8",
                }}
              >
                Image inspection
              </div>
              <div style={{ color: "#e2e8f0" }}>
                Target: {inspectableImageTarget}
              </div>
              <div data-testid="debug-image-label" style={{ color: "#94a3b8" }}>
                Label: {inspectableImageObject?.label ?? "none"}
              </div>
              <div data-testid="debug-image-id" style={{ color: "#94a3b8" }}>
                Id: {inspectableImageObject?.id ?? "none"}
              </div>
              <div data-testid="debug-image-bounds" style={{ color: "#94a3b8" }}>
                {inspectableImageBounds
                  ? `Bounds: x ${inspectableImageBounds.x} · y ${inspectableImageBounds.y} · w ${inspectableImageBounds.width} · h ${inspectableImageBounds.height}`
                  : "Bounds: none"}
              </div>
              <div data-testid="debug-image-strokes" style={{ color: "#94a3b8" }}>
                {inspectableImageStrokeStats
                  ? `Strokes: total ${inspectableImageStrokeStats.total} · own ${inspectableImageStrokeStats.own} · points ${inspectableImageStrokeStats.points}`
                  : "Strokes: none"}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  data-testid="debug-smoke-image-draw-button"
                  disabled={!inspectableImageObject}
                  onClick={drawSmokeStrokeOnInspectableImage}
                  className={buttonRecipes.secondary.small.className}
                  style={buttonRecipes.secondary.small.style}
                  {...getDesignSystemDebugAttrs(buttonRecipes.secondary.small.debug)}
                >
                  Draw stroke
                </button>
                <button
                  type="button"
                  data-testid="debug-smoke-image-move-button"
                  disabled={!inspectableImageObject}
                  onClick={moveInspectableImageForSmoke}
                  className={buttonRecipes.secondary.small.className}
                  style={buttonRecipes.secondary.small.style}
                  {...getDesignSystemDebugAttrs(buttonRecipes.secondary.small.debug)}
                >
                  Move image
                </button>
                <button
                  type="button"
                  data-testid="debug-smoke-image-resize-button"
                  disabled={!inspectableImageObject}
                  onClick={resizeInspectableImageForSmoke}
                  className={buttonRecipes.secondary.small.className}
                  style={buttonRecipes.secondary.small.style}
                  {...getDesignSystemDebugAttrs(buttonRecipes.secondary.small.debug)}
                >
                  Resize image
                </button>
              </div>
            </div>

            <div
              className={surfaceRecipes.inset.default.className}
              style={{
                ...surfaceRecipes.inset.default.style,
                gap: 8,
                fontSize: 12,
              }}
              data-testid="debug-token-inspection"
              {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#94a3b8",
                }}
              >
                Token inspection
              </div>
              <div style={{ color: "#e2e8f0" }}>
                Target: {inspectableTokenTarget}
              </div>
              <div data-testid="debug-token-id" style={{ color: "#94a3b8" }}>
                Id: {inspectableTokenObject?.id ?? "none"}
              </div>
              <div data-testid="debug-token-position" style={{ color: "#94a3b8" }}>
                {inspectableTokenPosition
                  ? `Position: x ${Math.round(inspectableTokenPosition.x)} · y ${Math.round(inspectableTokenPosition.y)}`
                  : "Position: none"}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  data-testid="debug-smoke-token-move-button"
                  disabled={!inspectableTokenObject}
                  onClick={moveInspectableTokenForSmoke}
                  className={buttonRecipes.secondary.small.className}
                  style={buttonRecipes.secondary.small.style}
                  {...getDesignSystemDebugAttrs(buttonRecipes.secondary.small.debug)}
                >
                  Move token
                </button>
              </div>
            </div>

            <div
              className={surfaceRecipes.inset.default.className}
              style={{
                ...surfaceRecipes.inset.default.style,
                gap: 8,
                fontSize: 12,
              }}
              data-testid="debug-note-inspection"
              {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#94a3b8",
                }}
              >
                Note inspection
              </div>
              <div style={{ color: "#e2e8f0" }}>
                Target: {inspectableNoteCardTarget}
              </div>
              <div data-testid="debug-note-id" style={{ color: "#94a3b8" }}>
                Id: {inspectableNoteCardObject?.id ?? "none"}
              </div>
              <div data-testid="debug-note-label" style={{ color: "#94a3b8" }}>
                Label: {inspectableNoteCardObject?.label ?? "none"}
              </div>
              <div data-testid="debug-note-bounds" style={{ color: "#94a3b8" }}>
                {inspectableNoteCardBounds
                  ? `Bounds: x ${inspectableNoteCardBounds.x} · y ${inspectableNoteCardBounds.y} · w ${inspectableNoteCardBounds.width} · h ${inspectableNoteCardBounds.height}`
                  : "Bounds: none"}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  data-testid="debug-smoke-note-move-button"
                  disabled={!inspectableNoteCardObject}
                  onClick={moveInspectableNoteCardForSmoke}
                  className={buttonRecipes.secondary.small.className}
                  style={buttonRecipes.secondary.small.style}
                  {...getDesignSystemDebugAttrs(buttonRecipes.secondary.small.debug)}
                >
                  Move note
                </button>
                <button
                  type="button"
                  data-testid="debug-smoke-note-edit-button"
                  disabled={!inspectableNoteCardObject}
                  onClick={saveInspectableNoteCardTextForSmoke}
                  className={buttonRecipes.secondary.small.className}
                  style={buttonRecipes.secondary.small.style}
                  {...getDesignSystemDebugAttrs(buttonRecipes.secondary.small.debug)}
                >
                  Save note text
                </button>
                <button
                  type="button"
                  data-testid="debug-smoke-note-resize-button"
                  disabled={!inspectableNoteCardObject}
                  onClick={resizeInspectableNoteCardForSmoke}
                  className={buttonRecipes.secondary.small.className}
                  style={buttonRecipes.secondary.small.style}
                  {...getDesignSystemDebugAttrs(buttonRecipes.secondary.small.debug)}
                >
                  Resize note
                </button>
              </div>
            </div>

            <div
              className={surfaceRecipes.inset.default.className}
              style={{
                ...surfaceRecipes.inset.default.style,
                gap: 8,
                fontSize: 12,
              }}
              {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#94a3b8",
                }}
              >
                Participant color
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {PARTICIPANT_COLOR_OPTIONS.map((color) => {
                  const swatchProps = getSwatchButtonProps(
                    swatchPillRecipes.swatch.small,
                    {
                      fillColor: color,
                      selected: color === participantSession.color,
                    }
                  );

                  return (
                    <button
                      key={`participant-debug-color-${color}`}
                      type="button"
                      onClick={() => {
                        onUpdateParticipantSession((session) => ({
                          ...session,
                          color,
                        }));
                      }}
                      aria-label={`Set participant color ${color}`}
                      className={swatchProps.className}
                      style={swatchProps.style}
                      {...getDesignSystemDebugAttrs(
                        swatchPillRecipes.swatch.small.debug
                      )}
                    />
                  );
                })}
              </div>
            </div>

            <label
              style={{
                ...objectInspectionSelectionRecipe.row.style,
                color: "#cbd5e1",
              }}
              className={objectInspectionSelectionRecipe.row.className}
              {...getDesignSystemDebugAttrs(objectInspectionSelectionRecipe.row.debug)}
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
                style={objectInspectionSelectionRecipe.indicator.style}
                className={objectInspectionSelectionRecipe.indicator.className}
              />
              <span
                style={objectInspectionSelectionRecipe.label.style}
                className={objectInspectionSelectionRecipe.label.className}
              >
                Inspect object semantics on hover
              </span>
            </label>

            <div
              className={surfaceRecipes.inset.default.className}
              style={{
                ...surfaceRecipes.inset.default.style,
                gap: 8,
                fontSize: 12,
              }}
              data-testid="debug-local-replica-inspection"
              {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#94a3b8",
                }}
              >
                Local replica
              </div>
              <div style={{ color: "#e2e8f0" }}>
                Backend: IndexedDB
              </div>
              <div style={{ color: "#94a3b8" }}>
                Bootstrap: {localReplicaInspection.lastBootstrapBranch ?? "none"}
                {" · "}local source{" "}
                {localReplicaInspection.lastBootstrapLocalSource ?? "none"}
              </div>
              <div
                data-testid="debug-local-replica-last-read"
                style={{ color: "#94a3b8" }}
              >
                Last read: {localReplicaInspection.lastReadSource}
                {" · "}rev {localReplicaInspection.lastReadRevision ?? "none"}
                {" · "}objects {localReplicaInspection.lastReadObjectCount}
                {" · "}saved {formatDebugTimestamp(localReplicaInspection.lastReadSavedAt)}
              </div>
              <div
                data-testid="debug-local-replica-last-write"
                style={{ color: "#94a3b8" }}
              >
                Last write: {localReplicaInspection.lastWriteStatus}
                {" · "}boundary{" "}
                {localReplicaInspection.lastWriteCommitBoundary ?? "none"}
                {" · "}rev {localReplicaInspection.lastWriteRevision ?? "none"}
                {" · "}objects {localReplicaInspection.lastWriteObjectCount}
                {" · "}saved{" "}
                {formatDebugTimestamp(localReplicaInspection.lastWriteSavedAt)}
              </div>
              {localReplicaInspection.lastError ? (
                <div style={{ color: "#fca5a5" }}>
                  Error: {localReplicaInspection.lastError}
                </div>
              ) : null}
            </div>

            <div
              className={surfaceRecipes.inset.default.className}
              style={{
                ...surfaceRecipes.inset.default.style,
                gap: 8,
                fontSize: 12,
              }}
              data-testid="debug-durable-replica-inspection"
              {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#94a3b8",
                }}
              >
                Durable replica
              </div>
              <div style={{ color: "#e2e8f0" }}>
                Backend: checkpoint store
              </div>
              <div
                data-testid="debug-durable-replica-known-revisions"
                style={{ color: "#94a3b8" }}
              >
                Known revisions: snapshot {durableReplicaInspection.currentRevision ?? "none"}
                {" · "}tokens{" "}
                {durableReplicaInspection.currentSliceRevisions.tokens ?? "none"}
                {" · "}images{" "}
                {durableReplicaInspection.currentSliceRevisions.images ?? "none"}
                {" · "}textCards{" "}
                {durableReplicaInspection.currentSliceRevisions.textCards ?? "none"}
              </div>
              <div
                data-testid="debug-durable-replica-last-write"
                style={{ color: "#94a3b8" }}
              >
                Last write: {durableReplicaInspection.lastWriteStatus}
                {" · "}boundary {durableReplicaInspection.lastWriteBoundary ?? "none"}
                {" · "}slice {durableReplicaInspection.lastWriteSlice ?? "none"}
                {" · "}known slice rev{" "}
                {durableReplicaInspection.lastKnownSliceRevision ?? "none"}
                {" · "}base rev {durableReplicaInspection.lastBaseRevision ?? "none"}
                {" · "}base slice rev{" "}
                {durableReplicaInspection.lastBaseSliceRevision ?? "none"}
                {" · "}ack snapshot rev{" "}
                {durableReplicaInspection.lastAckSnapshotRevision ?? "none"}
                {" · "}ack slice rev{" "}
                {durableReplicaInspection.lastAckSliceRevision ?? "none"}
                {" · "}conflict rev{" "}
                {durableReplicaInspection.lastConflictRevision ?? "none"}
                {" · "}conflict slice rev{" "}
                {durableReplicaInspection.lastConflictSliceRevision ?? "none"}
                {" · "}retry count {durableReplicaInspection.lastRetryCount}
                {" · "}retry resolved{" "}
                {durableReplicaInspection.lastResolvedViaRetry ? "yes" : "no"}
                {" · "}objects {durableReplicaInspection.lastWriteObjectCount}
                {" · "}saved{" "}
                {formatIsoDebugTimestamp(durableReplicaInspection.lastAckSavedAt)}
              </div>
              {durableReplicaInspection.lastError ? (
                <div style={{ color: "#fca5a5" }}>
                  Error: {durableReplicaInspection.lastError}
                </div>
              ) : null}
            </div>

            <div
              className={surfaceRecipes.inset.default.className}
              style={{
                ...surfaceRecipes.inset.default.style,
                gap: 8,
                fontSize: 12,
              }}
              {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#94a3b8",
                }}
              >
                Governance
              </div>
              <div>
                Room access: {governanceRoomSummary.effectiveAccess?.accessLevel ?? "none"}
                {" · "}
                sample action requires {governanceRoomSummary.action.requiredAccessLevel}
              </div>
              {governanceSelectedObjectSummary ? (
                <div style={{ display: "grid", gap: 2 }}>
                  <div>
                    Selected object:{" "}
                    {governanceSelectedObjectSummary.entity.entityType}
                    {" · "}
                    access {governanceSelectedObjectSummary.effectiveAccess?.accessLevel ?? "none"}
                    {" · "}
                    delete {governanceSelectedObjectSummary.isAllowed ? "allowed" : "blocked"}
                  </div>
                  {governanceSelectedImageClearSummary ? (
                    <div style={{ color: "#94a3b8" }}>
                      clear all{" "}
                      {governanceSelectedImageClearSummary.isAllowed
                        ? "allowed"
                        : "blocked"}
                      {" · "}required{" "}
                      {governanceSelectedImageClearSummary.action.requiredAccessLevel}
                    </div>
                  ) : null}
                  {governanceSelectedImageClearOwnSummary ? (
                    <div style={{ color: "#94a3b8" }}>
                      clear own{" "}
                      {governanceSelectedImageClearOwnSummary.isAllowed
                        ? "allowed"
                        : "blocked"}
                      {" · "}required{" "}
                      {governanceSelectedImageClearOwnSummary.action.requiredAccessLevel}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={{ color: "#94a3b8" }}>Selected object: none</div>
              )}
              <div style={{ display: "grid", gap: 4 }}>
                {governanceInspectionEntries.length > 0 ? (
                  governanceInspectionEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={surfaceRecipes.infoCard.default.className}
                      style={surfaceRecipes.infoCard.default.style}
                      {...getDesignSystemDebugAttrs(
                        surfaceRecipes.infoCard.default.debug
                      )}
                    >
                      <div style={{ color: "#e2e8f0" }}>
                        {entry.resolution.action.actionKey}
                        {" · "}
                        {entry.resolution.entity.entityType}
                        {" · "}
                        {entry.resolution.isAllowed ? "allowed" : "blocked"}
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: 11 }}>
                        effective{" "}
                        {entry.resolution.effectiveAccess?.accessLevel ?? "none"}
                        {" · "}required {entry.resolution.action.requiredAccessLevel}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#94a3b8" }}>
                    Trigger a room or object action to see governance resolutions here.
                  </div>
                )}
              </div>
            </div>

            <BoardToolbar
              onAddImage={() => {
                imageInputRef.current?.click();
              }}
              addImageRecipe={buttonRecipes.secondary.default}
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
        data-testid="image-file-input"
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
            fill={canvasBoardMaterials.surface}
            cornerRadius={canvasBoardMaterials.surfaceRadius}
            onMouseDown={() => {
              if (drawingImageId) {
                finishImageDrawingMode();
              }
              setSelectedObjectId(null);
            }}
          />

          {sortedObjects.map((object) => {
            const isImage = object.kind === "image";
            const isNoteCard = object.kind === "note-card";

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
                    <RemoteInteractionIndicator
                      x={previewPosition.x}
                      y={previewPosition.y}
                      width={previewPosition.width ?? object.width}
                      height={previewPosition.height ?? object.height}
                      participantColor={previewPosition.participantColor ?? "#94a3b8"}
                      variant="preview"
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

                      selectBoardObject(object);

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

                      selectBoardObject(object);
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
                      updateLiveSelectedImageControlAnchor(
                        object.id,
                        event.target as Konva.Image
                      );
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

                  {isLockedByAnotherParticipant && imageDrawingLock && (
                    <RemoteInteractionIndicator
                      x={object.x}
                      y={object.y}
                      width={object.width}
                      height={object.height}
                      participantColor={imageDrawingLock.participantColor}
                    />
                  )}
                </Group>
              );
            }

            if (isNoteCard) {
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

              return (
                <NoteCardRenderer
                  key={object.id}
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
                  remoteEditingIndicator={remoteEditingIndicator}
                  remoteResizeIndicator={remoteResizeIndicator}
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
                    event.cancelBubble = true;
                    selectBoardObject(object);
                  }}
                  onDragStart={(event) => {
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
                    event.cancelBubble = true;
                    selectBoardObject(object);
                    setActiveTextCardResizeState({
                      textCardId: object.id,
                      participantId: participantSession.id,
                      participantName: participantSession.name,
                      participantColor: participantSession.color,
                    });
                    liveNoteCardResizePreviewRef.current = {
                      noteCardId: object.id,
                      x: object.x,
                      y: object.y,
                      width: object.width,
                      height: object.height,
                    };
                    setLiveNoteCardResizePreview(
                      liveNoteCardResizePreviewRef.current
                    );
                  }}
                  onTransform={(event) => {
                    event.cancelBubble = true;

                    const node = event.target as Konva.Group;
                    const nextWidth = clampNoteCardWidth(
                      Math.abs(node.width() * node.scaleX())
                    );
                    const nextHeight = Math.max(
                      Math.round(Math.abs(node.height() * node.scaleY())),
                      MIN_NOTE_CARD_HEIGHT
                    );

                    liveNoteCardResizePreviewRef.current = {
                      noteCardId: object.id,
                      x: node.x(),
                      y: node.y(),
                      width: nextWidth,
                      height: nextHeight,
                    };
                    scheduleNoteCardResizePreviewRender();

                    node.scaleX(1);
                    node.scaleY(1);
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
                    setLiveNoteCardResizePreview(null);
                  }}
                  onDoubleClick={(event) => {
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
                  position={getTokenAnchorPosition(object)}
                  stageScale={stageScale}
                  isSelected={false}
                  selectionColor={currentUserColor}
                  fillColor={getTokenFillColor(object)}
                  occupiedIndicatorColor={
                    getBlockingActiveMove(object.id)?.participantColor ?? null
                  }
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
                  }}
                onDragStart={(event) => {
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
              />
            );
          })}

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
                      onClick={() => {
                        if (!selectedImageObject) {
                          return;
                        }

                        if (button.key === "draw") {
                          if (drawingImageId === selectedImageObject.id) {
                            finishImageDrawingMode();
                            return;
                          }

                          startImageDrawingMode(selectedImageObject.id);
                          return;
                        }

                        if (button.key === "clear-own") {
                          clearOwnImageDrawing(selectedImageObject.id);
                          return;
                        }

                        if (button.key === "clear-all") {
                          clearImageDrawing(selectedImageObject.id);
                        }
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
            ...boardSurfaceRecipes.objectSemanticsTooltip.shell.style,
            fontFamily: HTML_UI_FONT_FAMILY,
          }}
          {...getDesignSystemDebugAttrs(
            boardSurfaceRecipes.objectSemanticsTooltip.shell.debug
          )}
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
              <div style={rowRecipes.data.default.supportingText.style}>{row.label}</div>
              <div
                style={{
                  ...rowRecipes.data.default.title.style,
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
