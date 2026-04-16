import type { CSSProperties } from "react";
import { HTML_UI_FONT_FAMILY } from "../constants";
import { PARTICIPANT_COLOR_OPTIONS } from "../../lib/roomSession";
import type { GovernedActionAccessResolution } from "../../lib/governance";
import { BoardToolbar } from "./BoardToolbar";
import { boardSurfaceRecipes } from "../../ui/system/boardSurfaces";
import { getDesignSystemDebugAttrs } from "../../ui/system/debugMeta";
import {
  buttonRecipes,
} from "../../ui/system/families/button";
import { rowRecipes } from "../../ui/system/families/row";
import { selectionControlRecipes } from "../../ui/system/families/selectionControls";
import {
  getSwatchButtonProps,
  swatchPillRecipes,
} from "../../ui/system/families/swatchPill";
import { surfaceRecipes } from "../../ui/system/surfaces";

type InspectableBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type InspectableTokenPosition = {
  x: number;
  y: number;
};

type InspectableImageStrokeStats = {
  total: number;
  own: number;
  points: number;
};

type LocalReplicaInspectionViewModel = {
  initialOpenStatus: string;
  initialOpenSource: string | null;
  initialOpenRevision: number | null;
  initialOpenObjectCount: number;
  lastWriteStatus: string;
  lastWriteCommitBoundary: string | null | undefined;
  lastWriteRevision: number | null;
  lastWriteSavedAt: number | null;
  lastWriteObjectCount: number;
  lastReadSource: string;
  lastReadRevision: number | null;
  lastReadSavedAt: number | null;
  lastReadObjectCount: number;
  lastReadKnownDurableSnapshotRevision: number | null;
  lastReadKnownDurableSliceRevisions: {
    tokens: number | null;
    images: number | null;
    textCards: number | null;
  };
  lastSettledRecoveryState: string | null;
  lastSettledRecoverySliceSources: {
    tokens: string;
    images: string;
    textCards: string;
  };
  lastError: string | null;
};

type DurableReplicaInspectionViewModel = {
  currentRevision: number | null;
  currentSliceRevisions: {
    tokens: number | null;
    images: number | null;
    textCards: number | null;
  };
  lastWriteStatus: string;
  lastWriteBoundary: string | null;
  lastWriteSlice: string | null;
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

export type BoardStageGovernanceInspectionEntry = {
  id: string;
  resolution: GovernedActionAccessResolution;
  timestamp: number;
};

type BoardStageDevToolsContentProps = {
  sharedObjectCount: number;
  sharedTokenCount: number;
  sharedImageCount: number;
  sharedNoteCount: number;
  inspectableImageTarget: string;
  inspectableImageLabel: string | null;
  inspectableImageId: string | null;
  inspectableImageBounds: InspectableBounds | null;
  inspectableImageStrokeStats: InspectableImageStrokeStats | null;
  hasInspectableImage: boolean;
  onMoveInspectableImageForSmoke: () => void;
  onDrawSmokeStrokeOnInspectableImage: () => void;
  onResizeInspectableImageForSmoke: () => void;
  inspectableTokenTarget: string;
  inspectableTokenId: string | null;
  inspectableTokenPosition: InspectableTokenPosition | null;
  hasInspectableToken: boolean;
  onMoveInspectableTokenForSmoke: () => void;
  inspectableNoteCardTarget: string;
  inspectableNoteCardId: string | null;
  inspectableNoteCardLabel: string | null;
  inspectableNoteCardBounds: InspectableBounds | null;
  hasInspectableNoteCard: boolean;
  onMoveInspectableNoteCardForSmoke: () => void;
  onSaveInspectableNoteCardTextForSmoke: () => void;
  onResizeInspectableNoteCardForSmoke: () => void;
  onDeleteInspectableNoteCardForSmoke: () => void;
  participantColor: string;
  onParticipantColorChange: (color: string) => void;
  isObjectInspectionEnabled: boolean;
  onObjectInspectionEnabledChange: (enabled: boolean) => void;
  localReplicaInspection: LocalReplicaInspectionViewModel;
  durableReplicaInspection: DurableReplicaInspectionViewModel;
  governanceRoomSummary: GovernedActionAccessResolution;
  governanceSelectedObjectSummary: GovernedActionAccessResolution | null;
  governanceSelectedImageClearSummary: GovernedActionAccessResolution | null;
  governanceSelectedImageClearOwnSummary: GovernedActionAccessResolution | null;
  governanceInspectionEntries: BoardStageGovernanceInspectionEntry[];
  onAddImage: () => void;
  onAddNote: () => void;
  onResetBoard: () => void;
};

type BoardStageObjectSemanticsTooltipProps = {
  hoverState: {
    clientX: number;
    clientY: number;
  } | null;
  rows: Array<{
    label: string;
    value: string;
  }>;
  isVisible: boolean;
};

const debugPanelSectionHeadingStyle: CSSProperties = {
  paddingLeft: 2,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#cbd5e1",
};

const debugInsetCardStyle: CSSProperties = {
  ...surfaceRecipes.inset.default.style,
  gap: 8,
  minWidth: 0,
  fontSize: 12,
  overflowWrap: "anywhere",
};

const debugInsetCardTitleStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#94a3b8",
};

function formatDebugTimestamp(timestamp: number | null) {
  if (timestamp === null) {
    return "none";
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatIsoDebugTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return "none";
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function BoardStageDevToolsContent({
  sharedObjectCount,
  sharedTokenCount,
  sharedImageCount,
  sharedNoteCount,
  inspectableImageTarget,
  inspectableImageLabel,
  inspectableImageId,
  inspectableImageBounds,
  inspectableImageStrokeStats,
  hasInspectableImage,
  onMoveInspectableImageForSmoke,
  onDrawSmokeStrokeOnInspectableImage,
  onResizeInspectableImageForSmoke,
  inspectableTokenTarget,
  inspectableTokenId,
  inspectableTokenPosition,
  hasInspectableToken,
  onMoveInspectableTokenForSmoke,
  inspectableNoteCardTarget,
  inspectableNoteCardId,
  inspectableNoteCardLabel,
  inspectableNoteCardBounds,
  hasInspectableNoteCard,
  onMoveInspectableNoteCardForSmoke,
  onSaveInspectableNoteCardTextForSmoke,
  onResizeInspectableNoteCardForSmoke,
  onDeleteInspectableNoteCardForSmoke,
  participantColor,
  onParticipantColorChange,
  isObjectInspectionEnabled,
  onObjectInspectionEnabledChange,
  localReplicaInspection,
  durableReplicaInspection,
  governanceRoomSummary,
  governanceSelectedObjectSummary,
  governanceSelectedImageClearSummary,
  governanceSelectedImageClearOwnSummary,
  governanceInspectionEntries,
  onAddImage,
  onAddNote,
  onResetBoard,
}: BoardStageDevToolsContentProps) {
  const objectInspectionSelectionRecipe = selectionControlRecipes.checkbox.small;

  return (
    <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
      <div style={debugPanelSectionHeadingStyle}>Board inspection</div>

      <div
        className={surfaceRecipes.inset.default.className}
        style={debugInsetCardStyle}
        {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
      >
        <div style={debugInsetCardTitleStyle}>Board actions</div>
        <BoardToolbar
          onAddImage={onAddImage}
          addImageRecipe={buttonRecipes.secondary.default}
          onAddNote={onAddNote}
          onResetBoard={onResetBoard}
        />
      </div>

      <div
        className={surfaceRecipes.inset.default.className}
        style={debugInsetCardStyle}
        data-testid="debug-room-object-counts"
        {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
      >
        <div style={debugInsetCardTitleStyle}>Room objects</div>
        <div style={{ color: "#e2e8f0" }}>Total: {sharedObjectCount}</div>
        <div style={{ color: "#94a3b8" }}>
          tokens {sharedTokenCount}
          {" · "}images {sharedImageCount}
          {" · "}notes {sharedNoteCount}
        </div>
      </div>

      <div
        className={surfaceRecipes.inset.default.className}
        style={debugInsetCardStyle}
        data-testid="debug-image-inspection"
        {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
      >
        <div style={debugInsetCardTitleStyle}>Image inspection</div>
        <div style={{ color: "#e2e8f0" }}>Target: {inspectableImageTarget}</div>
        <div data-testid="debug-image-label" style={{ color: "#94a3b8" }}>
          Label: {inspectableImageLabel ?? "none"}
        </div>
        <div data-testid="debug-image-id" style={{ color: "#94a3b8" }}>
          Id: {inspectableImageId ?? "none"}
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
            disabled={!hasInspectableImage}
            onClick={onDrawSmokeStrokeOnInspectableImage}
            className={buttonRecipes.secondary.small.className}
            style={buttonRecipes.secondary.small.style}
            {...getDesignSystemDebugAttrs(buttonRecipes.secondary.small.debug)}
          >
            Draw stroke
          </button>
          <button
            type="button"
            data-testid="debug-smoke-image-move-button"
            disabled={!hasInspectableImage}
            onClick={onMoveInspectableImageForSmoke}
            className={buttonRecipes.secondary.small.className}
            style={buttonRecipes.secondary.small.style}
            {...getDesignSystemDebugAttrs(buttonRecipes.secondary.small.debug)}
          >
            Move image
          </button>
          <button
            type="button"
            data-testid="debug-smoke-image-resize-button"
            disabled={!hasInspectableImage}
            onClick={onResizeInspectableImageForSmoke}
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
        style={debugInsetCardStyle}
        data-testid="debug-token-inspection"
        {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
      >
        <div style={debugInsetCardTitleStyle}>Token inspection</div>
        <div style={{ color: "#e2e8f0" }}>Target: {inspectableTokenTarget}</div>
        <div data-testid="debug-token-id" style={{ color: "#94a3b8" }}>
          Id: {inspectableTokenId ?? "none"}
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
            disabled={!hasInspectableToken}
            onClick={onMoveInspectableTokenForSmoke}
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
        style={debugInsetCardStyle}
        data-testid="debug-note-inspection"
        {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
      >
        <div style={debugInsetCardTitleStyle}>Note inspection</div>
        <div style={{ color: "#e2e8f0" }}>Target: {inspectableNoteCardTarget}</div>
        <div data-testid="debug-note-id" style={{ color: "#94a3b8" }}>
          Id: {inspectableNoteCardId ?? "none"}
        </div>
        <div data-testid="debug-note-label" style={{ color: "#94a3b8" }}>
          Label: {inspectableNoteCardLabel ?? "none"}
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
            disabled={!hasInspectableNoteCard}
            onClick={onMoveInspectableNoteCardForSmoke}
            className={buttonRecipes.secondary.small.className}
            style={buttonRecipes.secondary.small.style}
            {...getDesignSystemDebugAttrs(buttonRecipes.secondary.small.debug)}
          >
            Move note
          </button>
          <button
            type="button"
            data-testid="debug-smoke-note-edit-button"
            disabled={!hasInspectableNoteCard}
            onClick={onSaveInspectableNoteCardTextForSmoke}
            className={buttonRecipes.secondary.small.className}
            style={buttonRecipes.secondary.small.style}
            {...getDesignSystemDebugAttrs(buttonRecipes.secondary.small.debug)}
          >
            Save note text
          </button>
          <button
            type="button"
            data-testid="debug-smoke-note-resize-button"
            disabled={!hasInspectableNoteCard}
            onClick={onResizeInspectableNoteCardForSmoke}
            className={buttonRecipes.secondary.small.className}
            style={buttonRecipes.secondary.small.style}
            {...getDesignSystemDebugAttrs(buttonRecipes.secondary.small.debug)}
          >
            Resize note
          </button>
          <button
            type="button"
            data-testid="debug-smoke-note-delete-button"
            disabled={!hasInspectableNoteCard}
            onClick={onDeleteInspectableNoteCardForSmoke}
            className={buttonRecipes.secondary.small.className}
            style={buttonRecipes.secondary.small.style}
            {...getDesignSystemDebugAttrs(buttonRecipes.secondary.small.debug)}
          >
            Delete note
          </button>
        </div>
      </div>

      <div style={debugPanelSectionHeadingStyle}>Utilities</div>

      <div
        className={surfaceRecipes.inset.default.className}
        style={debugInsetCardStyle}
        {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
      >
        <div style={debugInsetCardTitleStyle}>Participant color</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PARTICIPANT_COLOR_OPTIONS.map((color) => {
            const swatchProps = getSwatchButtonProps(
              swatchPillRecipes.swatch.small,
              {
                fillColor: color,
                selected: color === participantColor,
              }
            );

            return (
              <button
                key={`participant-debug-color-${color}`}
                type="button"
                onClick={() => {
                  onParticipantColorChange(color);
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

      <div
        className={surfaceRecipes.inset.default.className}
        style={debugInsetCardStyle}
        {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
      >
        <div style={debugInsetCardTitleStyle}>Object semantics</div>
        <label
          style={{
            ...objectInspectionSelectionRecipe.row.style,
            color: "#cbd5e1",
          }}
          className={objectInspectionSelectionRecipe.row.className}
          {...getDesignSystemDebugAttrs(
            objectInspectionSelectionRecipe.row.debug
          )}
        >
          <input
            type="checkbox"
            checked={isObjectInspectionEnabled}
            onChange={(event) => {
              onObjectInspectionEnabledChange(event.target.checked);
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
      </div>

      <div style={debugPanelSectionHeadingStyle}>Recovery and runtime</div>

      <div
        className={surfaceRecipes.inset.default.className}
        style={debugInsetCardStyle}
        data-testid="debug-local-replica-inspection"
        {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
      >
        <div style={debugInsetCardTitleStyle}>Local replica</div>
        <div style={{ color: "#e2e8f0" }}>Backend: IndexedDB</div>
        <div
          data-testid="debug-local-replica-initial-open"
          style={{ color: "#94a3b8" }}
        >
          Initial open: {localReplicaInspection.initialOpenStatus}
          {" · "}source {localReplicaInspection.initialOpenSource ?? "none"}
          {" · "}rev {localReplicaInspection.initialOpenRevision ?? "none"}
          {" · "}objects {localReplicaInspection.initialOpenObjectCount}
        </div>
        <div
          data-testid="debug-local-replica-settled-recovery"
          style={{ color: "#94a3b8" }}
        >
          Settled: {localReplicaInspection.lastSettledRecoveryState ?? "none"}
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
          data-testid="debug-local-replica-durable-handoff"
          style={{ color: "#94a3b8" }}
        >
          Durable handoff: checkpoint{" "}
          {localReplicaInspection.lastReadKnownDurableSnapshotRevision ?? "none"}
          {" · "}tokens{" "}
          {localReplicaInspection.lastReadKnownDurableSliceRevisions.tokens ?? "none"}
          {" · "}images{" "}
          {localReplicaInspection.lastReadKnownDurableSliceRevisions.images ?? "none"}
          {" · "}textCards{" "}
          {localReplicaInspection.lastReadKnownDurableSliceRevisions.textCards ??
            "none"}
        </div>
        <div
          data-testid="debug-local-replica-settled-slices"
          style={{ color: "#94a3b8" }}
        >
          Settled slices: tokens{" "}
          {localReplicaInspection.lastSettledRecoverySliceSources.tokens}
          {" · "}images{" "}
          {localReplicaInspection.lastSettledRecoverySliceSources.images}
          {" · "}textCards{" "}
          {localReplicaInspection.lastSettledRecoverySliceSources.textCards}
        </div>
        <div
          data-testid="debug-local-replica-last-write"
          style={{ color: "#94a3b8" }}
        >
          Last write: {localReplicaInspection.lastWriteStatus}
          {" · "}boundary {localReplicaInspection.lastWriteCommitBoundary ?? "none"}
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
        style={debugInsetCardStyle}
        data-testid="debug-durable-replica-inspection"
        {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
      >
        <div style={debugInsetCardTitleStyle}>Durable replica</div>
        <div style={{ color: "#e2e8f0" }}>Backend: checkpoint store</div>
        <div
          data-testid="debug-durable-replica-known-revisions"
          style={{ color: "#94a3b8" }}
        >
          Known revisions: checkpoint{" "}
          {durableReplicaInspection.currentRevision ?? "none"}
          {" · "}tokens {durableReplicaInspection.currentSliceRevisions.tokens ?? "none"}
          {" · "}images {durableReplicaInspection.currentSliceRevisions.images ?? "none"}
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
          {" · "}known slice rev {durableReplicaInspection.lastKnownSliceRevision ?? "none"}
          {" · "}base rev {durableReplicaInspection.lastBaseRevision ?? "none"}
          {" · "}base slice rev {durableReplicaInspection.lastBaseSliceRevision ?? "none"}
          {" · "}ack checkpoint rev {durableReplicaInspection.lastAckSnapshotRevision ?? "none"}
          {" · "}ack slice rev {durableReplicaInspection.lastAckSliceRevision ?? "none"}
          {" · "}conflict rev {durableReplicaInspection.lastConflictRevision ?? "none"}
          {" · "}conflict slice rev {durableReplicaInspection.lastConflictSliceRevision ?? "none"}
          {" · "}retry count {durableReplicaInspection.lastRetryCount}
          {" · "}retry resolved {durableReplicaInspection.lastResolvedViaRetry ? "yes" : "no"}
          {" · "}objects {durableReplicaInspection.lastWriteObjectCount}
          {" · "}saved {formatIsoDebugTimestamp(durableReplicaInspection.lastAckSavedAt)}
        </div>
        {durableReplicaInspection.lastError ? (
          <div style={{ color: "#fca5a5" }}>
            Error: {durableReplicaInspection.lastError}
          </div>
        ) : null}
      </div>

      <div
        className={surfaceRecipes.inset.default.className}
        style={debugInsetCardStyle}
        {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
      >
        <div style={debugInsetCardTitleStyle}>Governance</div>
        <div>
          Room access: {governanceRoomSummary.effectiveAccess?.accessLevel ?? "none"}
          {" · "}sample action requires{" "}
          {governanceRoomSummary.action.requiredAccessLevel}
        </div>
        {governanceSelectedObjectSummary ? (
          <div style={{ display: "grid", gap: 2 }}>
            <div>
              Selected object: {governanceSelectedObjectSummary.entity.entityType}
              {" · "}access{" "}
              {governanceSelectedObjectSummary.effectiveAccess?.accessLevel ??
                "none"}
              {" · "}delete{" "}
              {governanceSelectedObjectSummary.isAllowed ? "allowed" : "blocked"}
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
                {...getDesignSystemDebugAttrs(surfaceRecipes.infoCard.default.debug)}
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
    </div>
  );
}

export function BoardStageObjectSemanticsTooltip({
  hoverState,
  rows,
  isVisible,
}: BoardStageObjectSemanticsTooltipProps) {
  if (!isVisible || !hoverState || rows.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        left: Math.min(hoverState.clientX + 14, window.innerWidth - 250),
        top: Math.min(hoverState.clientY + 14, window.innerHeight - 180),
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

      {rows.map((row) => (
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
  );
}
