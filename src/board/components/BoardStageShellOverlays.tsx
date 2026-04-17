import type {
  ChangeEventHandler,
  FocusEventHandler,
  KeyboardEventHandler,
  ReactNode,
  RefObject,
} from "react";
import {
  buttonRecipes,
  createDraftLocalUserButtonRecipeForSlot,
  getButtonProps,
} from "../../ui/system/families/button";
import { getDesignSystemDebugAttrs } from "../../ui/system/debugMeta";
import { getParticipantColorSlotNumber } from "../../lib/roomSession";
import {
  BoardStageObjectSemanticsTooltip,
} from "./BoardStageDevToolsContent";
import { CursorOverlay, type CursorOverlayItem } from "./CursorOverlay";
import { ParticipantSessionPanel } from "./ParticipantSessionPanel";

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

type ObjectSemanticsHoverState = {
  clientX: number;
  clientY: number;
} | null;

type BoardStageShellOverlaysProps = {
  cursors: CursorOverlayItem[];
  addImageButtonColor: string;
  onAddImageButtonClick: () => void;
  sessionPanelRef: RefObject<HTMLDivElement | null>;
  roomId: string;
  isCurrentParticipantRoomCreator: boolean;
  roomCreatorName: string | null;
  roomCreatorColor: string | null;
  participantName: string;
  participantColor: string;
  participantNameDraft: string;
  isEditingParticipantName: boolean;
  isDebugToolsEnabled: boolean;
  isDevToolsOpen: boolean;
  onLeaveRoom: () => void;
  onResetBoard: () => void;
  onToggleDevTools: () => void;
  onParticipantNameDraftChange: (value: string) => void;
  onParticipantNameSubmit: () => void;
  onStartEditingParticipantName: () => void;
  devToolsContent: ReactNode;
  imageInputRef: RefObject<HTMLInputElement | null>;
  onImageInputChange: ChangeEventHandler<HTMLInputElement>;
  isEditingTextCardVisible: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  editingDraft: string;
  editingTextareaStyle: EditingTextareaStyle | null;
  onEditingDraftChange: ChangeEventHandler<HTMLTextAreaElement>;
  onEditingTextareaBlur: FocusEventHandler<HTMLTextAreaElement>;
  onEditingTextareaKeyDown: KeyboardEventHandler<HTMLTextAreaElement>;
  objectSemanticsHoverState: ObjectSemanticsHoverState;
  objectSemanticsRows: Array<{
    label: string;
    value: string;
  }>;
  isObjectSemanticsTooltipVisible: boolean;
};

export function BoardStageShellOverlays({
  cursors,
  addImageButtonColor,
  onAddImageButtonClick,
  sessionPanelRef,
  roomId,
  isCurrentParticipantRoomCreator,
  roomCreatorName,
  roomCreatorColor,
  participantName,
  participantColor,
  participantNameDraft,
  isEditingParticipantName,
  isDebugToolsEnabled,
  isDevToolsOpen,
  onLeaveRoom,
  onResetBoard,
  onToggleDevTools,
  onParticipantNameDraftChange,
  onParticipantNameSubmit,
  onStartEditingParticipantName,
  devToolsContent,
  imageInputRef,
  onImageInputChange,
  isEditingTextCardVisible,
  textareaRef,
  editingDraft,
  editingTextareaStyle,
  onEditingDraftChange,
  onEditingTextareaBlur,
  onEditingTextareaKeyDown,
  objectSemanticsHoverState,
  objectSemanticsRows,
  isObjectSemanticsTooltipVisible,
}: BoardStageShellOverlaysProps) {
  const addImageButtonRecipe = createDraftLocalUserButtonRecipeForSlot(
    buttonRecipes.secondary.small,
    getParticipantColorSlotNumber(addImageButtonColor),
    "border"
  );

  return (
    <>
      <CursorOverlay cursors={cursors} />

      <button
        type="button"
        onClick={onAddImageButtonClick}
        aria-label="Add image"
        {...getButtonProps(addImageButtonRecipe)}
        {...getDesignSystemDebugAttrs(addImageButtonRecipe.debug)}
        style={{
          ...getButtonProps(addImageButtonRecipe).style,
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
        roomCreatorColor={roomCreatorColor}
        participantName={participantName}
        participantColor={participantColor}
        participantNameDraft={participantNameDraft}
        isEditingParticipantName={isEditingParticipantName}
        isDebugToolsEnabled={isDebugToolsEnabled}
        isDevToolsOpen={isDevToolsOpen}
        onLeaveRoom={onLeaveRoom}
        onResetBoard={onResetBoard}
        onToggleDevTools={onToggleDevTools}
        onParticipantNameDraftChange={onParticipantNameDraftChange}
        onParticipantNameSubmit={onParticipantNameSubmit}
        onStartEditingParticipantName={onStartEditingParticipantName}
        devToolsContent={devToolsContent}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        data-testid="image-file-input"
        style={{ display: "none" }}
        onChange={onImageInputChange}
      />

      {isEditingTextCardVisible && editingTextareaStyle ? (
        <textarea
          ref={textareaRef}
          value={editingDraft}
          onChange={onEditingDraftChange}
          onBlur={onEditingTextareaBlur}
          onKeyDown={onEditingTextareaKeyDown}
          style={{
            position: "absolute",
            left: editingTextareaStyle.left,
            top: editingTextareaStyle.top,
            zIndex: 20,
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
      ) : null}

      <BoardStageObjectSemanticsTooltip
        hoverState={objectSemanticsHoverState}
        rows={objectSemanticsRows}
        isVisible={isObjectSemanticsTooltipVisible}
      />
    </>
  );
}
