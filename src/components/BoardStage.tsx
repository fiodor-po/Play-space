import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type Konva from "konva";
import {
  BoardStageDevToolsContent,
  type BoardStageGovernanceInspectionEntry,
} from "../board/components/BoardStageDevToolsContent";
import { BoardStageScene } from "../board/components/BoardStageScene";
import { BoardStageShellOverlays } from "../board/components/BoardStageShellOverlays";
import { createNoteCardObject } from "../board/objects/noteCard/createNoteCardObject";
import {
  clampNoteCardWidth,
  getNoteCardHeightForLabel,
  isNoteCardObject,
} from "../board/objects/noteCard/sizing";
import { createTokenObject } from "../board/objects/token/createTokenObject";
import { isDesignSystemHoverDebugEnabled } from "../ui/system/debugMeta";
import {
  boardMaterials,
  resolveBoardCanvasMaterials,
} from "../ui/system/boardMaterials";
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
  getBoardStageDevToolsViewModel,
  getBoardStageGovernanceViewModel,
  getBoardStageInspectabilityViewModel,
  getBoardStageObjectSemanticsViewModel,
  getBoardStageSelectedImageControlsViewModel,
  getBoardStageSelectedObjectsViewModel,
} from "../board/viewModels/boardStageInspectability";
import {
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
  saveDurableRoomParticipantAppearance,
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
  saveLocalRoomParticipantAppearance,
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
  type LocalParticipantSession,
  type ParticipantPresence,
  type ParticipantPresenceMap,
  type RoomOccupancyMap,
} from "../lib/roomSession";
import { getRoomBaselinePayload } from "../lib/roomBaseline";
import {
  createRoomParticipantAppearance,
  resolveCurrentParticipantColor,
  resolveCurrentParticipantColorResolution,
  upsertRoomParticipantAppearance,
  type RoomParticipantAppearance,
  type RoomParticipantAppearanceMap,
} from "../lib/participantColors";
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

const LOCAL_CURSOR_PRESENCE_MIN_INTERVAL_MS = 33;

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
  participantAppearance: RoomParticipantAppearanceMap;
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

type LocalCursorViewportState = {
  stageX: number;
  stageY: number;
  stageScale: number;
};

type LocalReplicaReadSource = "idle" | LocalRoomDocumentBootstrapReadSource;

type SharedBootstrapSliceCounts = {
  tokens: number;
  images: number;
  textCards: number;
};

type SettledRecoveryState =
  | "pending"
  | "live-active"
  | "replica-converged"
  | "baseline-initialization"
  | "empty-room";

type SettledRecoverySliceSource =
  | "live"
  | "local"
  | "durable"
  | "baseline"
  | "empty";

type SettledRecoverySliceSourceState = Record<
  DurableRoomSnapshotSlice,
  SettledRecoverySliceSource
>;

type LocalReplicaInspectionState = {
  initialOpenStatus: "idle" | "pending" | "applied" | "skipped";
  initialOpenSource: Exclude<LocalReplicaReadSource, "idle"> | null;
  initialOpenRevision: number | null;
  initialOpenObjectCount: number;
  lastWriteStatus: "idle" | "writing" | "saved" | "failed";
  lastWriteCommitBoundary: LocalObjectsChangeOptions["commitBoundary"] | null;
  lastWriteRevision: number | null;
  lastWriteSavedAt: number | null;
  lastWriteObjectCount: number;
  lastReadSource: LocalReplicaReadSource;
  lastReadRevision: number | null;
  lastReadSavedAt: number | null;
  lastReadObjectCount: number;
  lastReadKnownDurableSnapshotRevision: number | null;
  lastReadKnownDurableSliceRevisions: DurableSliceRevisionState;
  lastSettledRecoveryState: SettledRecoveryState | null;
  lastSettledRecoverySliceSources: SettledRecoverySliceSourceState;
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
  | "participant-appearance"
  | "room-reset";

type DurableSliceRevisionState = Record<DurableRoomSnapshotSlice, number | null>;

type DurableReplicaInspectionState = {
  currentRevision: number | null;
  currentSliceRevisions: DurableSliceRevisionState;
  lastWriteStatus: "idle" | "writing" | "saved" | "conflict" | "failed";
  lastWriteBoundary: DurableDebugBoundary | null;
  lastWriteSlice: DurableRoomSnapshotSlice | "checkpoint" | null;
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

type CreatorColorSource =
  | "local-session"
  | "live-occupancy"
  | "live-presence"
  | "room-document"
  | "legacy-fill"
  | "unresolved";

type CreatorColorResolution = {
  color: string | null;
  source: CreatorColorSource;
};

function createInitialSharedBootstrapSliceCounts(): SharedBootstrapSliceCounts {
  return {
    tokens: 0,
    images: 0,
    textCards: 0,
  };
}

function createInitialSettledRecoverySliceSourceState(
  source: SettledRecoverySliceSource = "empty"
): SettledRecoverySliceSourceState {
  return {
    tokens: source,
    images: source,
    textCards: source,
  };
}

function createInitialLocalReplicaInspectionState(): LocalReplicaInspectionState {
  return {
    initialOpenStatus: "idle",
    initialOpenSource: null,
    initialOpenRevision: null,
    initialOpenObjectCount: 0,
    lastWriteStatus: "idle",
    lastWriteCommitBoundary: null,
    lastWriteRevision: null,
    lastWriteSavedAt: null,
    lastWriteObjectCount: 0,
    lastReadSource: "idle",
    lastReadRevision: null,
    lastReadSavedAt: null,
    lastReadObjectCount: 0,
    lastReadKnownDurableSnapshotRevision: null,
    lastReadKnownDurableSliceRevisions: createInitialDurableSliceRevisionState(),
    lastSettledRecoveryState: null,
    lastSettledRecoverySliceSources:
      createInitialSettledRecoverySliceSourceState(),
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

function createEmptyRoomParticipantAppearance() {
  return {} satisfies RoomParticipantAppearanceMap;
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

function getRoomDocumentSliceObjects(
  content: {
    tokens: BoardObject[];
    images: BoardObject[];
    textCards: BoardObject[];
    participantAppearance: RoomParticipantAppearanceMap;
  },
  slice: DurableRoomSnapshotSlice
) {
  if (slice === "tokens") {
    return content.tokens;
  }

  if (slice === "images") {
    return content.images;
  }

  return content.textCards;
}

function isDurableSliceAhead(
  localKnownRevision: number | null,
  durableRevision: number | null
) {
  return (
    durableRevision !== null &&
    (localKnownRevision === null || durableRevision > localKnownRevision)
  );
}

function resolveSettledRecoveryConvergence(params: {
  localRecoverySnapshot: {
    tokens: BoardObject[];
    images: BoardObject[];
    textCards: BoardObject[];
    participantAppearance: RoomParticipantAppearanceMap;
  } | null;
  localRecoveryKnownDurableSnapshotRevision: number | null;
  localRecoveryKnownDurableSliceRevisions: DurableSliceRevisionState;
  durableSnapshot: {
    revision: number;
    sliceRevisions: Record<DurableRoomSnapshotSlice, number>;
    tokens: BoardObject[];
    images: BoardObject[];
    textCards: BoardObject[];
    participantAppearance: RoomParticipantAppearanceMap;
  } | null;
}) {
  const sliceSources = createInitialSettledRecoverySliceSourceState();
  const content = {
    tokens: [] as BoardObject[],
    images: [] as BoardObject[],
    textCards: [] as BoardObject[],
    participantAppearance: createEmptyRoomParticipantAppearance(),
  };

  (["tokens", "images", "textCards"] as const).forEach((slice) => {
    const localRecoverySnapshot = params.localRecoverySnapshot;
    const shouldUseDurableSlice =
      !localRecoverySnapshot ||
      isDurableSliceAhead(
        params.localRecoveryKnownDurableSliceRevisions[slice],
        params.durableSnapshot?.sliceRevisions[slice] ?? null
      );
    const nextSliceObjects = shouldUseDurableSlice
      ? params.durableSnapshot
        ? getRoomDocumentSliceObjects(params.durableSnapshot, slice)
        : []
      : getRoomDocumentSliceObjects(localRecoverySnapshot, slice);

    content[slice] = nextSliceObjects;
    sliceSources[slice] = shouldUseDurableSlice ? "durable" : "local";
  });

  const localParticipantAppearance =
    params.localRecoverySnapshot?.participantAppearance ??
    createEmptyRoomParticipantAppearance();
  const durableParticipantAppearance =
    params.durableSnapshot?.participantAppearance ??
    createEmptyRoomParticipantAppearance();
  const shouldUseDurableParticipantAppearance =
    !params.localRecoverySnapshot ||
    isDurableSliceAhead(
      params.localRecoveryKnownDurableSnapshotRevision,
      params.durableSnapshot?.revision ?? null
    ) ||
    (Object.keys(localParticipantAppearance).length === 0 &&
      Object.keys(durableParticipantAppearance).length > 0);

  content.participantAppearance = shouldUseDurableParticipantAppearance
    ? durableParticipantAppearance
    : localParticipantAppearance;

  return {
    content,
    sliceSources,
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
  const [roomParticipantAppearance, setRoomParticipantAppearance] =
    useState<RoomParticipantAppearanceMap>(createEmptyRoomParticipantAppearance);
  const lastPersistedParticipantAppearanceKeyRef = useRef<string | null>(null);
  const pendingParticipantAppearanceKeyRef = useRef<string | null>(null);

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

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setRoomParticipantAppearance(createEmptyRoomParticipantAppearance());
      lastPersistedParticipantAppearanceKeyRef.current = null;
      pendingParticipantAppearanceKeyRef.current = null;
    });

    return () => {
      isCancelled = true;
    };
  }, [roomId]);

  const persistLocalReplica = useCallback(
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
        participantAppearance: roomParticipantAppearance,
        lastKnownDurableSnapshotRevision:
          durableTrackingRef.current.snapshotRevision,
        lastKnownDurableSliceRevisions: cloneDurableSliceRevisionState(
          durableTrackingRef.current.sliceRevisions
        ),
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
    },
    [roomId, roomParticipantAppearance]
  );

  const queueDurableWriteTask = useCallback((task: () => Promise<void>) => {
    const enqueueDurableWriteTask = () => {
      durableTrackingRef.current.writeQueue = durableTrackingRef.current.writeQueue
        .catch(() => undefined)
        .then(task);
    };

    enqueueDurableWriteTask();
  }, []);

  const persistDurableSliceWrite = useCallback(
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

        let baseSliceRevision = durableTrackingRef.current.sliceRevisions[slice];
        let retryCount = 0;

        setDurableReplicaInspection((current) => ({
          ...current,
          currentRevision: durableTrackingRef.current.snapshotRevision,
          currentSliceRevisions: cloneDurableSliceRevisionState(
            durableTrackingRef.current.sliceRevisions
          ),
          lastWriteStatus: "writing",
          lastWriteBoundary: boundary,
          lastWriteSlice: slice,
          lastKnownSliceRevision: durableTrackingRef.current.sliceRevisions[slice],
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
            durableTrackingRef.current.snapshotRevision = result.currentRevision;
            durableTrackingRef.current.sliceRevisions = {
              ...durableTrackingRef.current.sliceRevisions,
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
                durableTrackingRef.current.sliceRevisions
              ),
              lastWriteStatus: "conflict",
              lastWriteBoundary: boundary,
              lastWriteSlice: slice,
              lastKnownSliceRevision:
                durableTrackingRef.current.sliceRevisions[slice],
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
            durableTrackingRef.current.snapshotRevision =
              result.ack.snapshotRevision;
            durableTrackingRef.current.sliceRevisions = {
              ...durableTrackingRef.current.sliceRevisions,
              [slice]: result.ack.sliceRevision,
            };
            setDurableReplicaInspection((current) => ({
              ...current,
              currentRevision: result.ack.snapshotRevision,
              currentSliceRevisions: cloneDurableSliceRevisionState(
                durableTrackingRef.current.sliceRevisions
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
            currentRevision: durableTrackingRef.current.snapshotRevision,
            currentSliceRevisions: cloneDurableSliceRevisionState(
              durableTrackingRef.current.sliceRevisions
            ),
            lastWriteStatus: "failed",
            lastWriteBoundary: boundary,
            lastWriteSlice: slice,
            lastKnownSliceRevision: durableTrackingRef.current.sliceRevisions[slice],
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
    },
    [queueDurableWriteTask, roomId]
  );

  const persistLegacyDurableSnapshot = useCallback(
    (nextObjects: BoardObject[], boundary: DurableDebugBoundary) => {
      const objectCount = getSharedBoardObjects(nextObjects).length;

      queueDurableWriteTask(async () => {
        if (activeRoomIdRef.current !== roomId) {
          return;
        }

        let baseRevision = durableTrackingRef.current.snapshotRevision;
        let retryCount = 0;

        setDurableReplicaInspection((current) => ({
          ...current,
          currentRevision: durableTrackingRef.current.snapshotRevision,
          currentSliceRevisions: cloneDurableSliceRevisionState(
            durableTrackingRef.current.sliceRevisions
          ),
          lastWriteStatus: "writing",
          lastWriteBoundary: boundary,
          lastWriteSlice: "checkpoint",
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
            baseRevision,
            {
              participantAppearance: roomParticipantAppearance,
            }
          );

          if (activeRoomIdRef.current !== roomId) {
            return;
          }

          if (result.status === "conflict") {
            durableTrackingRef.current.snapshotRevision = result.currentRevision;

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
                durableTrackingRef.current.sliceRevisions
              ),
              lastWriteStatus: "conflict",
              lastWriteBoundary: boundary,
              lastWriteSlice: "checkpoint",
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
            durableTrackingRef.current.snapshotRevision = result.snapshot.revision;
            durableTrackingRef.current.sliceRevisions =
              getDurableSliceRevisionStateFromSnapshot(result.snapshot);
            setDurableReplicaInspection((current) => ({
              ...current,
              currentRevision: result.snapshot.revision,
              currentSliceRevisions: cloneDurableSliceRevisionState(
                durableTrackingRef.current.sliceRevisions
              ),
              lastWriteStatus: "saved",
              lastWriteBoundary: boundary,
              lastWriteSlice: "checkpoint",
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
            currentRevision: durableTrackingRef.current.snapshotRevision,
            currentSliceRevisions: cloneDurableSliceRevisionState(
              durableTrackingRef.current.sliceRevisions
            ),
            lastWriteStatus: "failed",
            lastWriteBoundary: boundary,
            lastWriteSlice: "checkpoint",
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
    },
    [queueDurableWriteTask, roomId, roomParticipantAppearance]
  );

  const handleLocalBoardObjectsChange = useCallback(
    (nextObjects: BoardObject[], options?: LocalObjectsChangeOptions) => {
      const commitBoundary =
        options?.commitBoundary &&
        options.commitBoundary !== "default"
          ? options.commitBoundary
          : null;
      const localCommitBoundary =
        commitBoundary ??
        (options?.durableBoundary === "object-add" ||
        options?.durableBoundary === "object-remove"
          ? options.durableBoundary
          : null);
      const durableBoundary = commitBoundary ?? options?.durableBoundary ?? null;
      const durableSlice =
        options?.durableSlice ?? getDurableSliceForCommitBoundary(commitBoundary);

      if (localCommitBoundary) {
        persistLocalReplica(nextObjects, localCommitBoundary);
      }

      if (durableBoundary && durableSlice) {
        persistDurableSliceWrite(nextObjects, durableBoundary, durableSlice);
      }
    },
    [persistDurableSliceWrite, persistLocalReplica]
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

  const persistDurableParticipantAppearance = useCallback(
    (
      appearance: RoomParticipantAppearance,
      nextParticipantAppearance: RoomParticipantAppearanceMap
    ) => {
      return new Promise<boolean>((resolve) => {
        queueDurableWriteTask(async () => {
          if (activeRoomIdRef.current !== roomId) {
            resolve(false);
            return;
          }

          let retryCount = 0;
          let baseRevision = durableTrackingRef.current.snapshotRevision;

          setDurableReplicaInspection((current) => ({
            ...current,
            currentRevision: durableTrackingRef.current.snapshotRevision,
            currentSliceRevisions: cloneDurableSliceRevisionState(
              durableTrackingRef.current.sliceRevisions
            ),
            lastWriteStatus: "writing",
            lastWriteBoundary: "participant-appearance",
            lastWriteSlice: "checkpoint",
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
            lastWriteObjectCount: Object.keys(nextParticipantAppearance).length,
            lastError: null,
          }));

          for (let attempt = 0; attempt < 2; attempt += 1) {
            const result =
              baseRevision === null
                ? await saveDurableRoomSnapshot(
                    roomId,
                    objects,
                    null,
                    {
                      participantAppearance: nextParticipantAppearance,
                    }
                  )
                : await saveDurableRoomParticipantAppearance(
                    roomId,
                    appearance,
                    baseRevision
                  );

            if (activeRoomIdRef.current !== roomId) {
              resolve(false);
              return;
            }

            if (result.status === "conflict") {
              durableTrackingRef.current.snapshotRevision = result.currentRevision;

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
                  durableTrackingRef.current.sliceRevisions
                ),
                lastWriteStatus: "conflict",
                lastWriteBoundary: "participant-appearance",
                lastWriteSlice: "checkpoint",
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
                lastWriteObjectCount: Object.keys(nextParticipantAppearance).length,
                lastError: null,
              }));
              resolve(false);
              return;
            }

            if (result.status === "saved") {
              durableTrackingRef.current.snapshotRevision = result.snapshot.revision;
              durableTrackingRef.current.sliceRevisions =
                getDurableSliceRevisionStateFromSnapshot(result.snapshot);
              setDurableReplicaInspection((current) => ({
                ...current,
                currentRevision: result.snapshot.revision,
                currentSliceRevisions: cloneDurableSliceRevisionState(
                  durableTrackingRef.current.sliceRevisions
                ),
                lastWriteStatus: "saved",
                lastWriteBoundary: "participant-appearance",
                lastWriteSlice: "checkpoint",
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
                lastWriteObjectCount: Object.keys(
                  result.snapshot.participantAppearance
                ).length,
                lastError: null,
              }));
              resolve(true);
              return;
            }

            setDurableReplicaInspection((current) => ({
              ...current,
              currentRevision: durableTrackingRef.current.snapshotRevision,
              currentSliceRevisions: cloneDurableSliceRevisionState(
                durableTrackingRef.current.sliceRevisions
              ),
              lastWriteStatus: "failed",
              lastWriteBoundary: "participant-appearance",
              lastWriteSlice: "checkpoint",
              lastKnownSliceRevision: null,
              lastBaseRevision: baseRevision,
              lastBaseSliceRevision: null,
              lastAckSnapshotRevision: null,
              lastAckSliceRevision: null,
              lastRetryCount: retryCount,
              lastResolvedViaRetry: false,
              lastAckSavedAt: null,
              lastWriteObjectCount: Object.keys(nextParticipantAppearance).length,
              lastError: "durable-participant-appearance-write-unavailable",
            }));
            resolve(false);
            return;
          }
        });
      });
    },
    [objects, queueDurableWriteTask, roomId]
  );

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
  const [objectSemanticsHoverState, setObjectSemanticsHoverState] =
    useState<ObjectSemanticsHoverState | null>(null);
  const [governanceInspectionEntries, setGovernanceInspectionEntries] = useState<
    BoardStageGovernanceInspectionEntry[]
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
  const [sharedBootstrapSliceCounts, setSharedBootstrapSliceCounts] =
    useState<SharedBootstrapSliceCounts>(
      createInitialSharedBootstrapSliceCounts
    );
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
  const sharedBootstrapObjectCountRef = useRef(0);
  const currentUserColor = participantSession.color;
  const sharedTokenObjects = objects.filter((object) => object.kind === "token");
  const sharedTokenCount = sharedTokenObjects.length;
  const sharedImageObjects = objects.filter((object) => object.kind === "image");
  const sharedImageCount = sharedImageObjects.length;
  const sharedNoteObjects = objects.filter((object) => isNoteCardObject(object));
  const sharedNoteCount = sharedNoteObjects.length;
  const sharedObjectCount =
    sharedTokenCount + sharedImageCount + sharedNoteCount;
  const getRoomDocumentCreatorAppearance = (creatorId: string | null | undefined) => {
    if (!creatorId) {
      return null;
    }

    return roomParticipantAppearance[creatorId] ?? null;
  };

  const getLiveCreatorColorResolution = (object: BoardObject) => {
    return resolveCurrentParticipantColorResolution({
      participantId: object.creatorId,
      localParticipantSession: participantSession,
      participantPresences,
      roomOccupancies,
    });
  };

  const getCreatorColorResolution = (object: BoardObject): CreatorColorResolution => {
    const liveCreatorColorResolution = getLiveCreatorColorResolution(object);

    if (liveCreatorColorResolution.color) {
      return liveCreatorColorResolution;
    }

    const roomDocumentCreatorColor = getRoomDocumentCreatorAppearance(
      object.creatorId
    )?.lastKnownColor;

    if (roomDocumentCreatorColor) {
      return {
        color: roomDocumentCreatorColor,
        source: "room-document",
      };
    }

    if (object.fill) {
      return {
        color: object.fill,
        source: "legacy-fill",
      };
    }

    return {
      color: null,
      source: "unresolved",
    };
  };

  const getTokenFillColor = (object: BoardObject) => {
    return getCreatorColorResolution(object).color ?? object.fill;
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

  const recordGovernanceResolution = useCallback(
    (resolution: GovernedActionAccessResolution) => {
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
    },
    []
  );

  const resolveRoomActionAccess = useCallback(
    (actionKey: GovernanceActionKey) => {
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
    },
    [
      participantSession.id,
      recordGovernanceResolution,
      roomCreatorId,
      roomEffectiveAccessLevel,
      roomId,
    ]
  );

  const resolveObjectActionAccess = useCallback(
    (objectId: string, actionKey: GovernanceActionKey) => {
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
    },
    [objects, participantSession.id, recordGovernanceResolution, roomCreatorId]
  );

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
  const durableTrackingRef = useRef<{
    snapshotRevision: number | null;
    sliceRevisions: DurableSliceRevisionState;
    writeQueue: Promise<void>;
  }>({
    snapshotRevision: null,
    sliceRevisions: createInitialDurableSliceRevisionState(),
    writeQueue: Promise.resolve(),
  });
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
  const flushLocalCursorPresenceRef = useRef<() => void>(() => undefined);
  const localCursorViewportRef = useRef<LocalCursorViewportState>({
    stageX: stagePosition.x,
    stageY: stagePosition.y,
    stageScale,
  });
  const onUpdateLocalPresenceRef = useRef(onUpdateLocalPresence);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>(
    {}
  );

  useLayoutEffect(() => {
    localCursorViewportRef.current = {
      stageX: stagePosition.x,
      stageY: stagePosition.y,
      stageScale,
    };
    onUpdateLocalPresenceRef.current = onUpdateLocalPresence;
  }, [onUpdateLocalPresence, stagePosition.x, stagePosition.y, stageScale]);

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
  const sharedBootstrapObjectCount =
    sharedBootstrapSliceCounts.tokens +
    sharedBootstrapSliceCounts.images +
    sharedBootstrapSliceCounts.textCards;

  useEffect(() => {
    sharedBootstrapObjectCountRef.current = sharedBootstrapObjectCount;
  }, [sharedBootstrapObjectCount]);

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

  const releaseImageDrawingLock = useCallback(() => {
    setActiveImageDrawingLock(null);
  }, [setActiveImageDrawingLock]);

  const setDrawingImageSessionImageId = (nextImageId: string | null) => {
    drawingImageIdRef.current = nextImageId;
    setDrawingImageId(nextImageId);
  };

  const clearActiveImageStrokeSession = () => {
    activeImageStrokeRef.current = null;
  };

  const isImageLocallyDrawingInProgress = (imageId: string) => {
    return (
      drawingImageIdRef.current === imageId ||
      activeImageStrokeRef.current?.imageId === imageId
    );
  };

  const getImageDrawingLock = useCallback(
    (imageId: string) => {
      return remoteImageDrawingLocks[imageId] ?? null;
    },
    [remoteImageDrawingLocks]
  );

  const endImageStroke = useCallback(() => {
    const activeStroke = activeImageStrokeRef.current;

    if (activeStroke) {
      syncCurrentImage(activeStroke.imageId);
      persistLocalReplica(objects, "image-draw-commit");
      persistDurableSliceWrite(objects, "image-draw-commit", "images");
    }

    clearActiveImageStrokeSession();
  }, [objects, persistDurableSliceWrite, persistLocalReplica, syncCurrentImage]);

  const finishImageDrawingMode = useCallback(() => {
    endImageStroke();
    releaseImageDrawingLock();
    setDrawingImageSessionImageId(null);
  }, [endImageStroke, releaseImageDrawingLock]);

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

  const isImageLockedByAnotherParticipant = useCallback(
    (imageId: string) => {
      const lock = remoteImageDrawingLocks[imageId] ?? null;

      return !!lock && lock.participantId !== participantSession.id;
    },
    [participantSession.id, remoteImageDrawingLocks]
  );

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
    const resetDurableWriteTracking = () => {
      durableTrackingRef.current.snapshotRevision = null;
      durableTrackingRef.current.sliceRevisions =
        createInitialDurableSliceRevisionState();
      durableTrackingRef.current.writeQueue = Promise.resolve();
    };
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
    resetDurableWriteTracking();
    panStateRef.current = null;
    clearLiveNoteCardResizePreviewSession();
    clearActiveImageStrokeSession();
    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setLocalReplicaInspection({
        ...createInitialLocalReplicaInspectionState(),
        initialOpenStatus: "pending",
        lastSettledRecoveryState: "pending",
      });
      setDurableReplicaInspection(createInitialDurableReplicaInspectionState());
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
      setSharedBootstrapSliceCounts(createInitialSharedBootstrapSliceCounts());
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

    let isCancelled = false;
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
    const applyDurableSnapshotInspection = (
      snapshot: Awaited<ReturnType<typeof loadDurableRoomSnapshot>>
    ) => {
      durableTrackingRef.current.snapshotRevision = snapshot?.revision ?? null;
      durableTrackingRef.current.sliceRevisions =
        getDurableSliceRevisionStateFromSnapshot(snapshot);
      setDurableReplicaInspection((current) => ({
        ...current,
        currentRevision: snapshot?.revision ?? null,
        currentSliceRevisions: cloneDurableSliceRevisionState(
          durableTrackingRef.current.sliceRevisions
        ),
      }));
    };
    const settleLiveWinsBootstrap = (
      snapshot: Awaited<ReturnType<typeof loadDurableRoomSnapshot>>
    ) => {
      applyDurableSnapshotInspection(snapshot);
      setRoomParticipantAppearance(
        snapshot?.participantAppearance ?? createEmptyRoomParticipantAppearance()
      );
      console.info("[room-recovery][board-stage][bootstrap-terminal]", {
        roomId,
        settledState: "live-active",
        settledSliceSources: createInitialSettledRecoverySliceSourceState("live"),
        durableRevision: snapshot?.revision ?? null,
      });
      setLocalReplicaInspection((current) => ({
        ...current,
        initialOpenStatus:
          current.initialOpenStatus === "pending"
            ? "skipped"
            : current.initialOpenStatus,
        initialOpenSource:
          current.initialOpenStatus === "pending"
            ? "none"
            : current.initialOpenSource,
        initialOpenRevision:
          current.initialOpenStatus === "pending"
            ? null
            : current.initialOpenRevision,
        initialOpenObjectCount:
          current.initialOpenStatus === "pending"
            ? 0
            : current.initialOpenObjectCount,
        lastSettledRecoveryState: "live-active",
        lastSettledRecoverySliceSources:
          createInitialSettledRecoverySliceSourceState("live"),
      }));
      snapshotRecoveryAttemptedRoomRef.current = roomBootstrapEntryIdRef.current;
      setResolvedSnapshotBootstrapRoomId(roomId);
    };
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

      settleLiveWinsBootstrap(snapshot);
    };

    const resolveRoomBootstrap = async () => {
      const localBootstrapState = await loadLocalRoomDocumentBootstrapState(
        roomId
      );

      if (isCancelled) {
        return;
      }

      const localRecoverySnapshot = localBootstrapState.content;
      const localRecoverySource = localBootstrapState.source;
      const localRecoveryObjectCount = localBootstrapState.objectCount;
      const localRecoverySavedAt = localBootstrapState.savedAt;
      const localRecoveryRevision = localBootstrapState.revision;
      const localRecoveryIsVersionAware = localBootstrapState.isVersionAware;
      const localRecoveryKnownDurableSnapshotRevision =
        localBootstrapState.lastKnownDurableSnapshotRevision;
      const localRecoveryKnownDurableSliceRevisions =
        cloneDurableSliceRevisionState(
          localBootstrapState.lastKnownDurableSliceRevisions
        );
      const shouldApplyProvisionalLocalOpen =
        localRecoverySnapshot !== null &&
        localRecoveryIsVersionAware &&
        sharedBootstrapObjectCountRef.current === 0;

      setLocalReplicaInspection((current) => ({
        ...current,
        initialOpenStatus: shouldApplyProvisionalLocalOpen ? "applied" : "skipped",
        initialOpenSource: localRecoverySource,
        initialOpenRevision: localRecoveryRevision,
        initialOpenObjectCount: localRecoveryObjectCount,
        lastReadSource: localRecoverySource,
        lastReadRevision: localRecoveryRevision,
        lastReadSavedAt: localRecoverySavedAt,
        lastReadObjectCount: localRecoveryObjectCount,
        lastReadKnownDurableSnapshotRevision:
          localRecoveryKnownDurableSnapshotRevision,
        lastReadKnownDurableSliceRevisions:
          localRecoveryKnownDurableSliceRevisions,
      }));

      if (shouldApplyProvisionalLocalOpen && localRecoverySnapshot) {
        console.info("[room-recovery][board-stage][initial-open]", {
          roomId,
          source: localRecoverySource,
          revision: localRecoveryRevision,
          objectCount: localRecoveryObjectCount,
        });
        replaceBoardObjects(
          composeSharedRoomObjects({
            roomId,
            tokens: localRecoverySnapshot.tokens,
            images: localRecoverySnapshot.images,
            textCards: localRecoverySnapshot.textCards,
          })
        );
      }

      let durableSnapshot = null;

      try {
        durableSnapshot = await loadDurableRoomSnapshot(roomId);
      } catch (error) {
        console.error("Failed to resolve durable room snapshot during bootstrap", error);
      }

      if (isCancelled) {
        return;
      }

      if (sharedBootstrapObjectCountRef.current > 0) {
        settleLiveWinsBootstrap(durableSnapshot);
        return;
      }

      applyDurableSnapshotInspection(durableSnapshot);

      const durableSnapshotObjectCount = getSnapshotObjectCount(durableSnapshot);
      const hasLocalRecoveryDocument =
        localRecoverySnapshot !== null &&
        (localRecoveryObjectCount > 0 || localRecoveryRevision !== null);
      const baselineObjects = roomBaselineToApply
        ? getRoomBaselinePayload(roomBaselineToApply)
        : [];
      const baselineContent = {
        tokens: baselineObjects.filter((object) => object.kind === "token"),
        images: baselineObjects.filter((object) => object.kind === "image"),
        textCards: baselineObjects.filter((object) => isNoteCardObject(object)),
        participantAppearance: createEmptyRoomParticipantAppearance(),
      };
      const shouldRunConvergence =
        hasLocalRecoveryDocument || durableSnapshotObjectCount > 0;
      const shouldApplyBaseline =
        !shouldRunConvergence &&
        !hasLocalRecoveryDocument &&
        baselineObjects.length > 0;
      const baselineIdToApply = shouldApplyBaseline
        ? roomBaselineToApply?.baselineId ?? null
        : null;
      let nextObjects: BoardObject[] | null = null;
      let terminalContent: {
        tokens: BoardObject[];
        images: BoardObject[];
        textCards: BoardObject[];
        participantAppearance: RoomParticipantAppearanceMap;
      } | null = null;
      let settledState: Exclude<SettledRecoveryState, "pending"> = "empty-room";
      let settledSliceSources = createInitialSettledRecoverySliceSourceState();

      console.info("[room-recovery][board-stage][bootstrap-inputs]", {
        roomId,
        bootstrapEntryId: roomBootstrapEntryIdRef.current,
        sharedRoomObjectCount: sharedBootstrapObjectCountRef.current,
        durableSnapshotObjectCount,
        localRecoveryObjectCount,
        localRecoverySource,
        localRecoveryRevision,
        localRecoveryIsVersionAware,
        localRecoveryKnownDurableSnapshotRevision,
        localRecoveryKnownDurableSliceRevisions,
        durableSnapshotRevision: durableSnapshot?.revision ?? null,
        durableSnapshotSliceRevisions: durableSnapshot?.sliceRevisions ?? null,
        localRecoverySavedAt,
      });

      if (shouldRunConvergence) {
        const convergenceResult = resolveSettledRecoveryConvergence({
          localRecoverySnapshot: hasLocalRecoveryDocument
            ? localRecoverySnapshot
            : null,
          localRecoveryKnownDurableSnapshotRevision,
          localRecoveryKnownDurableSliceRevisions,
          durableSnapshot,
        });

        terminalContent = convergenceResult.content;
        settledSliceSources = convergenceResult.sliceSources;
        nextObjects = composeSharedRoomObjects({
          roomId,
          tokens: convergenceResult.content.tokens,
          images: convergenceResult.content.images,
          textCards: convergenceResult.content.textCards,
        });
        settledState = "replica-converged";
      } else if (shouldApplyBaseline) {
        terminalContent = baselineContent;
        settledSliceSources =
          createInitialSettledRecoverySliceSourceState("baseline");
        nextObjects = composeBaselineRoomObjects(roomId, baselineObjects);
        settledState = "baseline-initialization";
      }

      console.info("[room-recovery][board-stage][bootstrap-terminal]", {
        roomId,
        bootstrapEntryId: roomBootstrapEntryIdRef.current,
        settledState,
        localRevision: hasLocalRecoveryDocument ? localRecoveryRevision : null,
        tokenCount: terminalContent?.tokens.length ?? 0,
        imageCount: terminalContent?.images.length ?? 0,
        textCardCount: terminalContent?.textCards.length ?? 0,
        settledSliceSources,
      });
      setLocalReplicaInspection((current) => ({
        ...current,
        lastSettledRecoveryState: settledState,
        lastSettledRecoverySliceSources: settledSliceSources,
      }));
      setRoomParticipantAppearance(
        terminalContent?.participantAppearance ??
          createEmptyRoomParticipantAppearance()
      );

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

    if (sharedBootstrapObjectCount > 0) {
      void resolveLiveBootstrap();
    } else {
      void resolveRoomBootstrap();
    }

    return () => {
      isCancelled = true;
    };
  }, [
    hasSharedRoomContentLoaded,
    onRoomBaselineApplied,
    replaceBoardObjects,
    roomBaselineToApply,
    roomId,
    sharedBootstrapObjectCount,
  ]);

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setRoomParticipantAppearance((current) => {
        let nextParticipantAppearance = current;
        const upsertObservedAppearance = (
          participantId: string | null | undefined,
          name: string | null | undefined,
          color: string | null | undefined
        ) => {
          const nextAppearance = createRoomParticipantAppearance({
            participantId: participantId ?? "",
            name: name ?? "",
            color: color ?? "",
          });

          if (!nextAppearance) {
            return;
          }

          nextParticipantAppearance = upsertRoomParticipantAppearance(
            nextParticipantAppearance,
            nextAppearance
          );
        };

        upsertObservedAppearance(
          participantSession.id,
          participantSession.name,
          participantSession.color
        );

        Object.values(roomOccupancies).forEach((occupancy) => {
          upsertObservedAppearance(
            occupancy.participantId,
            occupancy.name,
            occupancy.color
          );
        });

        Object.values(participantPresences).forEach((presence) => {
          if (roomOccupancies[presence.participantId]) {
            return;
          }

          upsertObservedAppearance(
            presence.participantId,
            presence.name,
            presence.color
          );
        });

        return nextParticipantAppearance;
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [
    participantPresences,
    participantSession.color,
    participantSession.id,
    participantSession.name,
    roomOccupancies,
  ]);

  useEffect(() => {
    if (resolvedSnapshotBootstrapRoomId !== roomId) {
      return;
    }

    const nextAppearance = createRoomParticipantAppearance({
      participantId: participantSession.id,
      name: participantSession.name,
      color: participantSession.color,
    });

    if (!nextAppearance) {
      return;
    }

    const nextPersistenceKey = [
      roomId,
      nextAppearance.participantId,
      nextAppearance.lastKnownName,
      nextAppearance.lastKnownColor,
    ].join(":");

    if (lastPersistedParticipantAppearanceKeyRef.current === nextPersistenceKey) {
      return;
    }

    if (pendingParticipantAppearanceKeyRef.current === nextPersistenceKey) {
      return;
    }

    const nextParticipantAppearance = upsertRoomParticipantAppearance(
      roomParticipantAppearance,
      nextAppearance
    );

    pendingParticipantAppearanceKeyRef.current = nextPersistenceKey;

    queueMicrotask(() => {
      if (nextParticipantAppearance !== roomParticipantAppearance) {
        setRoomParticipantAppearance(nextParticipantAppearance);
      }
    });

    void Promise.all([
      saveLocalRoomParticipantAppearance(roomId, nextAppearance, objects, {
        lastKnownDurableSnapshotRevision:
          durableTrackingRef.current.snapshotRevision,
        lastKnownDurableSliceRevisions: cloneDurableSliceRevisionState(
          durableTrackingRef.current.sliceRevisions
        ),
      })
        .then(() => true)
        .catch(() => false),
      persistDurableParticipantAppearance(nextAppearance, nextParticipantAppearance),
    ]).then(([isLocalWriteSaved, isDurableWriteSaved]) => {
      if (activeRoomIdRef.current !== roomId) {
        return;
      }

      if (pendingParticipantAppearanceKeyRef.current !== nextPersistenceKey) {
        return;
      }

      pendingParticipantAppearanceKeyRef.current = null;

      if (isLocalWriteSaved && isDurableWriteSaved) {
        lastPersistedParticipantAppearanceKeyRef.current = nextPersistenceKey;
      }
    });
  }, [
    objects,
    participantSession.color,
    participantSession.id,
    participantSession.name,
    persistDurableParticipantAppearance,
    resolvedSnapshotBootstrapRoomId,
    roomId,
    roomParticipantAppearance,
  ]);

  useEffect(() => {
    const connection = createRoomTokenConnection({
      roomId,
      onActiveMovesChange: setRemoteActiveObjectMoves,
      onTokensChange: (tokens) => {
        setSharedBootstrapSliceCounts((current) =>
          current.tokens === tokens.length
            ? current
            : {
                ...current,
                tokens: tokens.length,
              }
        );
        receiveSharedTokens(tokens);
      },
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
        setSharedBootstrapSliceCounts((current) =>
          current.images === sharedImages.length
            ? current
            : {
                ...current,
                images: sharedImages.length,
              }
        );
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
      onTextCardsChange: (textCards) => {
        setSharedBootstrapSliceCounts((current) =>
          current.textCards === textCards.length
            ? current
            : {
                ...current,
                textCards: textCards.length,
              }
        );
        receiveSharedTextCards(textCards);
      },
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

  const createParticipantMarker = useCallback(
    (position?: { x: number; y: number }) => {
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
    },
    [
      currentUserColor,
      participantSession.id,
      resolveRoomActionAccess,
      stagePosition.x,
      stagePosition.y,
      stageScale,
      stageSize.height,
      stageSize.width,
    ]
  );

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
    createParticipantMarker,
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
    isImageLockedByAnotherParticipant,
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
  }, [drawingImageId, finishImageDrawingMode]);

  useEffect(() => {
    return () => {
      releaseImageDrawingLock();
    };
  }, [releaseImageDrawingLock]);

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
  const {
    selectedImageObject,
    selectedTokenObject,
    selectedNoteCardObject,
  } = getBoardStageSelectedObjectsViewModel({
    objects,
    selectedObjectId,
    editingTextCardId,
  });
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
  const {
    inspectedObjectSemanticsRows,
    isObjectSemanticsTooltipVisible,
  } = getBoardStageObjectSemanticsViewModel({
    objects,
    objectSemanticsHoverState,
    isObjectInspectionEnabled,
    getCreatorColor: (object) => getCreatorColorResolution(object).color,
    getCreatorColorSource: (object) => getCreatorColorResolution(object).source,
  });
  const {
    governanceRoomSummary,
    governanceSelectedObjectSummary,
    governanceSelectedImageClearSummary,
    governanceSelectedImageClearOwnSummary,
  } = useMemo(
    () =>
      getBoardStageGovernanceViewModel({
        roomId,
        roomCreatorId,
        roomEffectiveAccessLevel,
        participantId: participantSession.id,
        selectedObjectId,
        objects,
      }),
    [
      objects,
      participantSession.id,
      roomCreatorId,
      roomEffectiveAccessLevel,
      roomId,
      selectedObjectId,
    ]
  );
  const {
    selectedImageControlAnchor,
    selectedImageControlButtons,
  } = getBoardStageSelectedImageControlsViewModel({
    selectedImageObject,
    selectedImageEffectiveBounds,
    liveSelectedImageControlAnchor,
    isSelectedImageLocallyInteracting,
    drawingImageId,
    participantColor: participantSession.color,
    governanceSelectedImageClearSummary,
    governanceSelectedImageClearOwnSummary,
  });
  const inspectabilityViewModel = getBoardStageInspectabilityViewModel({
    selectedImageObject,
    selectedTokenObject,
    selectedNoteCardObject,
    sharedImageObjects,
    sharedTokenObjects,
    sharedNoteObjects,
    participantId: participantSession.id,
    getTokenAnchorPosition,
  });
  const {
    inspectableImageObject,
    inspectableTokenObject,
    inspectableTokenPosition,
    inspectableNoteCardObject,
  } = inspectabilityViewModel;

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

  const deleteInspectableNoteCardForSmoke = () => {
    if (!inspectableNoteCardObject) {
      return;
    }

    removeBoardObject(inspectableNoteCardObject.id);
    setSelectedObjectId(null);
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

  const flushLocalCursorPresence = useCallback(() => {
    pendingLocalCursorPresenceFrameRef.current = null;

    const nextPoint = pendingLocalCursorPresencePointRef.current;
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!nextPoint || !containerRect) {
      return;
    }

    const { stageX, stageY, stageScale: currentStageScale } =
      localCursorViewportRef.current;
    const cursor = getBoardPointFromScreen({
      clientX: nextPoint.clientX,
      clientY: nextPoint.clientY,
      containerLeft: containerRect.left,
      containerTop: containerRect.top,
      stageX,
      stageY,
      stageScale: currentStageScale,
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
      pendingLocalCursorPresenceFrameRef.current =
        window.requestAnimationFrame(() => {
          flushLocalCursorPresenceRef.current();
        });
      return;
    }

    if (!cursorChanged && !isPublishIntervalReady) {
      return;
    }

    lastPublishedLocalCursorRef.current = cursor;
    lastLocalCursorPresenceSentAtRef.current = now;

    onUpdateLocalPresenceRef.current((presence) =>
      presence
        ? {
            ...presence,
            cursor,
            lastActiveAt: now,
          }
        : null
    );
  }, []);

  useLayoutEffect(() => {
    flushLocalCursorPresenceRef.current = flushLocalCursorPresence;
  }, [flushLocalCursorPresence]);

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

    pendingLocalCursorPresenceFrameRef.current =
      window.requestAnimationFrame(() => {
        flushLocalCursorPresenceRef.current();
      });
  };

  const clearLocalCursorPresence = useCallback(() => {
    pendingLocalCursorPresencePointRef.current = null;

    if (pendingLocalCursorPresenceFrameRef.current !== null) {
      window.cancelAnimationFrame(pendingLocalCursorPresenceFrameRef.current);
      pendingLocalCursorPresenceFrameRef.current = null;
    }

    const now = Date.now();
    lastPublishedLocalCursorRef.current = null;
    lastLocalCursorPresenceSentAtRef.current = now;

    onUpdateLocalPresenceRef.current((presence) =>
      presence
        ? {
            ...presence,
            cursor: null,
            lastActiveAt: now,
          }
        : null
    );
  }, []);

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
  const roomCreatorLiveColor =
    roomCreatorId && roomCreatorId !== participantSession.id
      ? resolveCurrentParticipantColor({
          participantId: roomCreatorId,
          localParticipantSession: participantSession,
          participantPresences,
          roomOccupancies,
        })
      : null;
  const devToolsViewModel = getBoardStageDevToolsViewModel({
    sharedObjectCount,
    sharedTokenCount,
    sharedImageCount,
    sharedNoteCount,
    inspectability: inspectabilityViewModel,
    participantColor: participantSession.color,
    isObjectInspectionEnabled,
    localReplicaInspection,
    durableReplicaInspection,
    governanceRoomSummary,
    governanceSelectedObjectSummary,
    governanceSelectedImageClearSummary,
    governanceSelectedImageClearOwnSummary,
    governanceInspectionEntries,
  });
  const devToolsContent = (
    <BoardStageDevToolsContent
      {...devToolsViewModel}
      onMoveInspectableImageForSmoke={moveInspectableImageForSmoke}
      onDrawSmokeStrokeOnInspectableImage={drawSmokeStrokeOnInspectableImage}
      onResizeInspectableImageForSmoke={resizeInspectableImageForSmoke}
      onMoveInspectableTokenForSmoke={moveInspectableTokenForSmoke}
      onMoveInspectableNoteCardForSmoke={moveInspectableNoteCardForSmoke}
      onSaveInspectableNoteCardTextForSmoke={saveInspectableNoteCardTextForSmoke}
      onResizeInspectableNoteCardForSmoke={resizeInspectableNoteCardForSmoke}
      onDeleteInspectableNoteCardForSmoke={deleteInspectableNoteCardForSmoke}
      onParticipantColorChange={(color) => {
        onUpdateParticipantSession((session) => ({
          ...session,
          color,
        }));
      }}
      onObjectInspectionEnabledChange={(isEnabled) => {
        setIsObjectInspectionEnabled(isEnabled);

        if (!isEnabled) {
          clearObjectSemanticsHover();
        }
      }}
      onAddImage={() => {
        imageInputRef.current?.click();
      }}
      onAddNote={createNote}
      onResetBoard={resetBoard}
    />
  );
  const handleBoardBackgroundMouseDown = () => {
    if (drawingImageId) {
      finishImageDrawingMode();
    }

    setSelectedObjectId(null);
  };
  const handleStageMouseDown = (event: {
    target: Konva.Node;
  }) => {
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
  };
  const handleStageMouseMove = (event: {
    target: Konva.Node;
  }) => {
    const pointer = event.target.getStage()?.getPointerPosition();
    const panState = panStateRef.current;

    if (!panState?.isPanning || !pointer) {
      return;
    }

    setStagePosition({
      x: panState.startStageX + (pointer.x - panState.startPointerX),
      y: panState.startStageY + (pointer.y - panState.startPointerY),
    });
  };
  const handleStageMouseUp = () => {
    panStateRef.current = null;
    endImageStroke();
  };
  const handleStageTouchStart = handleStageMouseDown;
  const handleStageTouchMove = handleStageMouseMove;
  const handleStageTouchEnd = handleStageMouseUp;
  const handleStageWheel = (event: {
    evt: WheelEvent;
    target: Konva.Node;
  }) => {
    event.evt.preventDefault();

    const oldScale = stageScale;
    const pointer = event.target.getStage()?.getPointerPosition();

    if (!pointer) {
      return;
    }

    const direction = event.evt.deltaY > 0 ? -1 : 1;
    let newScale = direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;

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
  };
  const handleSelectedImageControlClick = (buttonKey: string, imageId: string) => {
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
      <BoardStageShellOverlays
        cursors={participantCursorScreenPositions}
        addImageButtonColor={participantSession.color}
        onAddImageButtonClick={() => {
          imageInputRef.current?.click();
        }}
        sessionPanelRef={sessionPanelRef}
        roomId={roomId}
        isCurrentParticipantRoomCreator={isCurrentParticipantRoomCreator}
        roomCreatorName={roomCreatorName}
        roomCreatorColor={roomCreatorLiveColor}
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
        devToolsContent={devToolsContent}
        imageInputRef={imageInputRef}
        onImageInputChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            createImageFromFile(file);
          }

          event.target.value = "";
        }}
        isEditingTextCardVisible={!!editingTextCard}
        textareaRef={textareaRef}
        editingDraft={editingDraft}
        editingTextareaStyle={editingTextareaStyle}
        onEditingDraftChange={(event) => {
          setEditingDraft(event.target.value);
        }}
        onEditingTextareaBlur={() => {
          if (ignoreNextBlurRef.current) {
            ignoreNextBlurRef.current = false;
            return;
          }

          saveEditingTextCard();
        }}
        onEditingTextareaKeyDown={(event) => {
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
        objectSemanticsHoverState={objectSemanticsHoverState}
        objectSemanticsRows={inspectedObjectSemanticsRows}
        isObjectSemanticsTooltipVisible={isObjectSemanticsTooltipVisible}
      />

      <BoardStageScene
        stageWrapperRef={stageWrapperRef}
        stageSize={stageSize}
        stagePosition={stagePosition}
        stageScale={stageScale}
        participantSession={participantSession}
        boardBackgroundRef={boardBackgroundRef}
        noteCardRefs={noteCardRefs}
        imageRefs={imageRefs}
        imageStrokeLayerRefs={imageStrokeLayerRefs}
        noteCardTransformerRef={noteCardTransformerRef}
        imageTransformerRef={imageTransformerRef}
        liveNoteCardResizePreviewRef={liveNoteCardResizePreviewRef}
        transformingImageSnapshotRef={transformingImageSnapshotRef}
        boardSurfaceFill={canvasBoardMaterials.surface}
        boardSurfaceRadius={canvasBoardMaterials.surfaceRadius}
        sortedObjects={sortedObjects}
        loadedImages={loadedImages}
        drawingImageId={drawingImageId}
        draggingImageId={draggingImageId}
        transformingImageId={transformingImageId}
        editingTextCardId={editingTextCardId}
        editingTextCardDisplayHeight={editingTextCardDisplayHeight}
        remoteImagePreviewPositions={remoteImagePreviewPositions}
        remoteTextCardEditingStates={remoteTextCardEditingStates}
        remoteTextCardResizeStates={remoteTextCardResizeStates}
        selectedImageObject={selectedImageObject}
        selectedImageControlAnchor={selectedImageControlAnchor}
        selectedImageControlButtons={selectedImageControlButtons}
        isSelectedImageLockedByAnotherParticipant={
          isSelectedImageLockedByAnotherParticipant
        }
        onStageMouseDown={handleStageMouseDown}
        onStageMouseMove={handleStageMouseMove}
        onStageMouseUp={handleStageMouseUp}
        onStageMouseLeave={handleStageMouseUp}
        onStageTouchStart={handleStageTouchStart}
        onStageTouchMove={handleStageTouchMove}
        onStageTouchEnd={handleStageTouchEnd}
        onStageWheel={handleStageWheel}
        onBoardBackgroundMouseDown={handleBoardBackgroundMouseDown}
        updateObjectSemanticsHover={updateObjectSemanticsHover}
        clearObjectSemanticsHover={clearObjectSemanticsHover}
        getImageDrawingLock={getImageDrawingLock}
        finishImageDrawingMode={finishImageDrawingMode}
        selectBoardObject={selectBoardObject}
        startImageStroke={startImageStroke}
        appendStrokePoint={appendStrokePoint}
        endImageStroke={endImageStroke}
        updateLiveSelectedImageControlAnchor={updateLiveSelectedImageControlAnchor}
        syncImageStrokeLayerPosition={syncImageStrokeLayerPosition}
        syncImageStrokeLayerTransform={syncImageStrokeLayerTransform}
        previewImagePosition={previewImagePosition}
        updateObjectPosition={updateObjectPosition}
        setDraggingImageId={setDraggingImageId}
        setTransformingImageId={setTransformingImageId}
        resizeImageObject={resizeImageObject}
        publishImageTransformPreview={publishImageTransformPreview}
        getLiveStrokeColor={getLiveStrokeColor}
        getNoteCardPreviewBounds={getNoteCardPreviewBounds}
        setDraggingNoteCardId={setDraggingNoteCardId}
        setActiveTextCardResizeState={setActiveTextCardResizeState}
        scheduleNoteCardResizePreviewRender={scheduleNoteCardResizePreviewRender}
        resizeTextCardBounds={resizeTextCardBounds}
        clearLiveNoteCardResizePreviewSession={clearLiveNoteCardResizePreviewSession}
        setLiveNoteCardResizePreview={setLiveNoteCardResizePreview}
        startEditingTextCard={startEditingTextCard}
        getTokenAnchorPosition={getTokenAnchorPosition}
        getTokenFillColor={getTokenFillColor}
        getBlockingActiveMove={getBlockingActiveMove}
        setDraggingTokenId={setDraggingTokenId}
        getTokenAttachment={getTokenAttachment}
        updateTokenAnchorPosition={updateTokenAnchorPosition}
        setActiveTokenMove={setActiveTokenMove}
        updateTokenPlacementAfterDrop={updateTokenPlacementAfterDrop}
        onSelectedImageControlClick={handleSelectedImageControlClick}
      />

    </div>
  );
}
