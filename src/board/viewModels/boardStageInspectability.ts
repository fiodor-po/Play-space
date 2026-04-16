import {
  createParticipantAccentButtonRecipeWithMode,
  interactionButtonRecipes,
  type ButtonRecipe,
} from "../../ui/system/families/button";
import type {
  AccessLevel,
  GovernedActionAccessResolution,
} from "../../lib/governance";
import {
  createRoomGovernedEntityRef,
  resolveGovernedActionAccess,
} from "../../lib/governance";
import {
  resolveBoardObjectDeletePolicyAccess,
  resolveImageClearAllDrawingPolicyAccess,
  resolveImageClearOwnDrawingPolicyAccess,
} from "../../lib/governancePolicy";
import type { BoardObject } from "../../types/board";
import type { ImageEffectiveBounds } from "../images/effectiveBounds";
import { isNoteCardObject } from "../objects/noteCard/sizing";

type BoardStageObjectSemanticsHoverState = {
  objectId: string;
  clientX: number;
  clientY: number;
} | null;

type LiveSelectedImageControlAnchor = {
  imageId: string;
  x: number;
  y: number;
} | null;

export type BoardStageObjectSemanticsRow = {
  label: string;
  value: string;
};

export type BoardStageSelectedImageControlButton = {
  key: string;
  label: string;
  recipe?: ButtonRecipe;
};

export type BoardStageInspectableBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type BoardStageInspectableImageStrokeStats = {
  total: number;
  own: number;
  points: number;
};

export type BoardStageInspectableTokenPosition = {
  x: number;
  y: number;
};

export type BoardStageSelectedObjectsViewModel = {
  selectedImageObject: BoardObject | null;
  selectedTokenObject: BoardObject | null;
  selectedNoteCardObject: BoardObject | null;
};

export type BoardStageSelectedImageControlsViewModel = {
  selectedImageControlAnchor: {
    x: number;
    y: number;
  } | null;
  selectedImageControlButtons: BoardStageSelectedImageControlButton[];
};

export type BoardStageInspectabilityViewModel = {
  inspectableImageObject: BoardObject | null;
  inspectableImageId: string | null;
  inspectableImageLabel: string | null;
  inspectableImageBounds: BoardStageInspectableBounds | null;
  inspectableImageStrokeStats: BoardStageInspectableImageStrokeStats | null;
  inspectableImageTarget: string;
  inspectableTokenObject: BoardObject | null;
  inspectableTokenId: string | null;
  inspectableTokenPosition: BoardStageInspectableTokenPosition | null;
  inspectableTokenTarget: string;
  inspectableNoteCardObject: BoardObject | null;
  inspectableNoteCardId: string | null;
  inspectableNoteCardLabel: string | null;
  inspectableNoteCardBounds: BoardStageInspectableBounds | null;
  inspectableNoteCardTarget: string;
};

export type BoardStageGovernanceViewModel = {
  governanceRoomSummary: GovernedActionAccessResolution;
  governanceSelectedObjectSummary: GovernedActionAccessResolution | null;
  governanceSelectedImageClearSummary: GovernedActionAccessResolution | null;
  governanceSelectedImageClearOwnSummary: GovernedActionAccessResolution | null;
};

type BoardStageDevToolsViewModelParams<
  TLocalReplicaInspection,
  TDurableReplicaInspection,
  TGovernanceInspectionEntry,
> = {
  sharedObjectCount: number;
  sharedTokenCount: number;
  sharedImageCount: number;
  sharedNoteCount: number;
  inspectability: BoardStageInspectabilityViewModel;
  participantColor: string;
  isObjectInspectionEnabled: boolean;
  localReplicaInspection: TLocalReplicaInspection;
  durableReplicaInspection: TDurableReplicaInspection;
  governanceRoomSummary: GovernedActionAccessResolution;
  governanceSelectedObjectSummary: GovernedActionAccessResolution | null;
  governanceSelectedImageClearSummary: GovernedActionAccessResolution | null;
  governanceSelectedImageClearOwnSummary: GovernedActionAccessResolution | null;
  governanceInspectionEntries: TGovernanceInspectionEntry[];
};

type BoardStageObjectSemanticsViewModelParams = {
  objects: BoardObject[];
  objectSemanticsHoverState: BoardStageObjectSemanticsHoverState;
  isObjectInspectionEnabled: boolean;
  getCreatorColor: (object: BoardObject) => string | null;
};

type BoardStageInspectableViewModelParams = {
  selectedImageObject: BoardObject | null;
  selectedTokenObject: BoardObject | null;
  selectedNoteCardObject: BoardObject | null;
  sharedImageObjects: BoardObject[];
  sharedTokenObjects: BoardObject[];
  sharedNoteObjects: BoardObject[];
  participantId: string;
  getTokenAnchorPosition: (
    object: BoardObject
  ) => BoardStageInspectableTokenPosition;
};

type BoardStageSelectedImageControlsViewModelParams = {
  selectedImageObject: BoardObject | null;
  selectedImageEffectiveBounds: ImageEffectiveBounds | null;
  liveSelectedImageControlAnchor: LiveSelectedImageControlAnchor;
  isSelectedImageLocallyInteracting: boolean;
  drawingImageId: string | null;
  participantColor: string;
  governanceSelectedImageClearSummary: GovernedActionAccessResolution | null;
  governanceSelectedImageClearOwnSummary: GovernedActionAccessResolution | null;
};

type BoardStageGovernanceViewModelParams = {
  roomId: string;
  roomCreatorId: string | null;
  roomEffectiveAccessLevel: AccessLevel;
  participantId: string;
  selectedObjectId: string | null;
  objects: BoardObject[];
};

function getImageControlsAnchorFromBounds(bounds: { x: number; y: number }) {
  return {
    x: bounds.x,
    y: bounds.y,
  };
}

function getInspectableBounds(
  object: BoardObject | null
): BoardStageInspectableBounds | null {
  if (!object) {
    return null;
  }

  return {
    x: Math.round(object.x),
    y: Math.round(object.y),
    width: Math.round(object.width),
    height: Math.round(object.height),
  };
}

export function getBoardStageSelectedObjectsViewModel({
  objects,
  selectedObjectId,
  editingTextCardId,
}: {
  objects: BoardObject[];
  selectedObjectId: string | null;
  editingTextCardId: string | null;
}): BoardStageSelectedObjectsViewModel {
  if (!selectedObjectId || editingTextCardId) {
    return {
      selectedImageObject: null,
      selectedTokenObject: null,
      selectedNoteCardObject: null,
    };
  }

  const selectedObject =
    objects.find((object) => object.id === selectedObjectId) ?? null;

  return {
    selectedImageObject:
      selectedObject?.kind === "image" ? selectedObject : null,
    selectedTokenObject:
      selectedObject?.kind === "token" ? selectedObject : null,
    selectedNoteCardObject:
      selectedObject && isNoteCardObject(selectedObject) ? selectedObject : null,
  };
}

export function getBoardStageObjectSemanticsRows({
  object,
  creatorColor,
}: {
  object: BoardObject;
  creatorColor: string | null;
}): BoardStageObjectSemanticsRow[] {
  const rows = [
    { label: "Kind", value: object.kind },
    { label: "Id", value: object.id },
    { label: "Creator", value: object.creatorId ?? "none" },
    { label: "Creator color", value: creatorColor ?? "unresolved" },
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
}

export function getBoardStageObjectSemanticsViewModel({
  objects,
  objectSemanticsHoverState,
  isObjectInspectionEnabled,
  getCreatorColor,
}: BoardStageObjectSemanticsViewModelParams) {
  const inspectedObject = objectSemanticsHoverState
    ? objects.find((object) => object.id === objectSemanticsHoverState.objectId) ??
      null
    : null;
  const inspectedObjectSemanticsRows = inspectedObject
    ? getBoardStageObjectSemanticsRows({
        object: inspectedObject,
        creatorColor: getCreatorColor(inspectedObject),
      })
    : [];

  return {
    inspectedObjectSemanticsRows,
    isObjectSemanticsTooltipVisible:
      isObjectInspectionEnabled && !!inspectedObject && !!objectSemanticsHoverState,
  };
}

export function getBoardStageInspectabilityViewModel({
  selectedImageObject,
  selectedTokenObject,
  selectedNoteCardObject,
  sharedImageObjects,
  sharedTokenObjects,
  sharedNoteObjects,
  participantId,
  getTokenAnchorPosition,
}: BoardStageInspectableViewModelParams): BoardStageInspectabilityViewModel {
  const inspectableImageObject =
    selectedImageObject ??
    (sharedImageObjects.length === 1 ? sharedImageObjects[0] : null);
  const inspectableImageStrokeStats = inspectableImageObject
    ? {
        total: inspectableImageObject.imageStrokes?.length ?? 0,
        own:
          inspectableImageObject.imageStrokes?.filter(
            (stroke) => stroke.creatorId === participantId
          ).length ?? 0,
        points:
          inspectableImageObject.imageStrokes?.reduce(
            (pointCount, stroke) => pointCount + Math.round(stroke.points.length / 2),
            0
          ) ?? 0,
      }
    : null;
  const participantInspectableToken =
    sharedTokenObjects.filter((object) => object.creatorId === participantId)
      .length === 1
      ? sharedTokenObjects.find((object) => object.creatorId === participantId) ??
        null
      : null;
  const inspectableTokenObject =
    selectedTokenObject ??
    participantInspectableToken ??
    (sharedTokenObjects.length === 1 ? sharedTokenObjects[0] : null);
  const inspectableNoteCardObject =
    selectedNoteCardObject ??
    (sharedNoteObjects.filter((object) => object.creatorId === participantId)
      .length === 1
      ? sharedNoteObjects.find((object) => object.creatorId === participantId) ??
        null
      : null) ??
    (sharedNoteObjects.length === 1 ? sharedNoteObjects[0] : null);

  return {
    inspectableImageObject,
    inspectableImageId: inspectableImageObject?.id ?? null,
    inspectableImageLabel: inspectableImageObject?.label ?? null,
    inspectableImageBounds: getInspectableBounds(inspectableImageObject),
    inspectableImageStrokeStats,
    inspectableImageTarget:
      selectedImageObject && inspectableImageObject
        ? "selected"
        : inspectableImageObject
          ? "sole"
          : "none",
    inspectableTokenObject,
    inspectableTokenId: inspectableTokenObject?.id ?? null,
    inspectableTokenPosition: inspectableTokenObject
      ? getTokenAnchorPosition(inspectableTokenObject)
      : null,
    inspectableTokenTarget:
      selectedTokenObject && inspectableTokenObject
        ? "selected"
        : participantInspectableToken &&
            inspectableTokenObject === participantInspectableToken
          ? "participant-marker"
          : inspectableTokenObject
            ? "sole"
            : "none",
    inspectableNoteCardObject,
    inspectableNoteCardId: inspectableNoteCardObject?.id ?? null,
    inspectableNoteCardLabel: inspectableNoteCardObject?.label ?? null,
    inspectableNoteCardBounds: getInspectableBounds(inspectableNoteCardObject),
    inspectableNoteCardTarget:
      selectedNoteCardObject && inspectableNoteCardObject
        ? "selected"
        : inspectableNoteCardObject &&
            inspectableNoteCardObject.creatorId === participantId
          ? "participant-owned"
          : inspectableNoteCardObject
            ? "sole"
            : "none",
  };
}

export function getBoardStageSelectedImageControlsViewModel({
  selectedImageObject,
  selectedImageEffectiveBounds,
  liveSelectedImageControlAnchor,
  isSelectedImageLocallyInteracting,
  drawingImageId,
  participantColor,
  governanceSelectedImageClearSummary,
  governanceSelectedImageClearOwnSummary,
}: BoardStageSelectedImageControlsViewModelParams): BoardStageSelectedImageControlsViewModel {
  const selectedImageLiveControlAnchor =
    selectedImageObject &&
    isSelectedImageLocallyInteracting &&
    liveSelectedImageControlAnchor?.imageId === selectedImageObject.id
      ? liveSelectedImageControlAnchor
      : null;
  const selectedImageControlButtons: BoardStageSelectedImageControlButton[] = [];

  if (selectedImageObject) {
    selectedImageControlButtons.push({
      key: "draw",
      label: drawingImageId === selectedImageObject.id ? "Save" : "Draw",
      recipe:
        drawingImageId === selectedImageObject.id
          ? createParticipantAccentButtonRecipeWithMode(
              interactionButtonRecipes.primary.pill,
              participantColor,
              "fill"
            )
          : createParticipantAccentButtonRecipeWithMode(
              interactionButtonRecipes.secondary.pill,
              participantColor,
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

  return {
    selectedImageControlAnchor:
      selectedImageLiveControlAnchor ??
      (selectedImageEffectiveBounds
        ? getImageControlsAnchorFromBounds(selectedImageEffectiveBounds)
        : null),
    selectedImageControlButtons,
  };
}

export function getBoardStageGovernanceViewModel({
  roomId,
  roomCreatorId,
  roomEffectiveAccessLevel,
  participantId,
  selectedObjectId,
  objects,
}: BoardStageGovernanceViewModelParams): BoardStageGovernanceViewModel {
  const governanceRoomSummary = resolveGovernedActionAccess({
    entity: createRoomGovernedEntityRef({
      roomId,
      creatorId: roomCreatorId,
    }),
    actionKey: "room.add-image",
    participantId,
    explicitAccessLevel: roomEffectiveAccessLevel,
    defaultAccessLevel: "full",
  });
  const selectedObject = selectedObjectId
    ? objects.find((object) => object.id === selectedObjectId) ?? null
    : null;
  const selectedImageObject =
    selectedObject?.kind === "image" ? selectedObject : null;

  return {
    governanceRoomSummary,
    governanceSelectedObjectSummary: selectedObject
      ? resolveBoardObjectDeletePolicyAccess({
          object: selectedObject,
          participantId,
          roomCreatorId,
        })
      : null,
    governanceSelectedImageClearSummary: selectedImageObject
      ? resolveImageClearAllDrawingPolicyAccess({
          object: selectedImageObject,
          participantId,
          roomCreatorId,
        })
      : null,
    governanceSelectedImageClearOwnSummary: selectedImageObject
      ? resolveImageClearOwnDrawingPolicyAccess({
          object: selectedImageObject,
          participantId,
        })
      : null,
  };
}

export function getBoardStageDevToolsViewModel<
  TLocalReplicaInspection,
  TDurableReplicaInspection,
  TGovernanceInspectionEntry,
>({
  sharedObjectCount,
  sharedTokenCount,
  sharedImageCount,
  sharedNoteCount,
  inspectability,
  participantColor,
  isObjectInspectionEnabled,
  localReplicaInspection,
  durableReplicaInspection,
  governanceRoomSummary,
  governanceSelectedObjectSummary,
  governanceSelectedImageClearSummary,
  governanceSelectedImageClearOwnSummary,
  governanceInspectionEntries,
}: BoardStageDevToolsViewModelParams<
  TLocalReplicaInspection,
  TDurableReplicaInspection,
  TGovernanceInspectionEntry
>) {
  return {
    sharedObjectCount,
    sharedTokenCount,
    sharedImageCount,
    sharedNoteCount,
    inspectableImageTarget: inspectability.inspectableImageTarget,
    inspectableImageLabel: inspectability.inspectableImageLabel,
    inspectableImageId: inspectability.inspectableImageId,
    inspectableImageBounds: inspectability.inspectableImageBounds,
    inspectableImageStrokeStats: inspectability.inspectableImageStrokeStats,
    hasInspectableImage: !!inspectability.inspectableImageObject,
    inspectableTokenTarget: inspectability.inspectableTokenTarget,
    inspectableTokenId: inspectability.inspectableTokenId,
    inspectableTokenPosition: inspectability.inspectableTokenPosition,
    hasInspectableToken: !!inspectability.inspectableTokenObject,
    inspectableNoteCardTarget: inspectability.inspectableNoteCardTarget,
    inspectableNoteCardId: inspectability.inspectableNoteCardId,
    inspectableNoteCardLabel: inspectability.inspectableNoteCardLabel,
    inspectableNoteCardBounds: inspectability.inspectableNoteCardBounds,
    hasInspectableNoteCard: !!inspectability.inspectableNoteCardObject,
    participantColor,
    isObjectInspectionEnabled,
    localReplicaInspection,
    durableReplicaInspection,
    governanceRoomSummary,
    governanceSelectedObjectSummary,
    governanceSelectedImageClearSummary,
    governanceSelectedImageClearOwnSummary,
    governanceInspectionEntries,
  };
}
