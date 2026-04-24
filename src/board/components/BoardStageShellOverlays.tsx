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
import { HoverHint } from "../../ui/system/HoverHint";
import { getParticipantColorSlotNumber } from "../../lib/roomSession";
import type { RoomBackgroundThemeId } from "../../lib/roomSettings";
import {
  BoardStageObjectSemanticsTooltip,
} from "./BoardStageDevToolsContent";
import { CursorOverlay, type CursorOverlayItem } from "./CursorOverlay";
import { ParticipantSessionPanel } from "./ParticipantSessionPanel";
import type { LiveKitMediaStatusViewModel } from "../../media/liveKitMediaStatus";
import type { FeedbackCaptureContext } from "../../lib/feedbackCapture";
import { ContextMenu, type ContextMenuItem } from "../../ui/system/ContextMenu";
import { getBoardObjectElevationShadowRecipe } from "../../ui/system/boardMaterials";
import {
  PARTICIPANT_AVATAR_FACE_TO_TOKEN_ICON_ID,
  TOKEN_BIG_ICON_IDS,
  TOKEN_DEFAULT_ICON_ID,
  TokenIconPreview,
  type TokenIconId,
} from "../objects/token/tokenIconSet";
import type { ParticipantAvatarFaceId } from "../../lib/participantAvatarFaces";
import type { TokenVisualVariant } from "../../types/board";

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

type BoardContextMenuState = {
  kind: "board";
  clientX: number;
  clientY: number;
} | {
  kind: "token";
  clientX: number;
  clientY: number;
  currentGlyph: string;
  currentIconId: TokenIconId | null;
  currentVisualVariant: TokenVisualVariant;
} | null;

const BOARD_SURFACE_CONTROL_BORDER_WIDTH = 2;
const FLOATING_BUTTON_EXTRA_BORDER = "1px solid rgba(255, 255, 255, 0.22)";
const FLOATING_BUTTON_SHADOW =
  getBoardObjectElevationShadowRecipe("floating").cssBoxShadow;
const TOKEN_CONTEXT_MENU_GRID_ITEM_SIZE = 38;
const TOKEN_CONTEXT_MENU_GRID_GAP = 5;
const TOKEN_CONTEXT_MENU_SHELL_INLINE_PADDING = 12;
const TOKEN_CONTEXT_MENU_COLUMN_COUNT = 5;
const TOKEN_CONTEXT_MENU_BIG_ICON_COUNT = 34;
const TOKEN_MENU_MINI_GLYPH = "";
const PLUS_BUTTON_GLYPH_STYLE = {
  display: "block",
  transform: "translateY(-1px)",
} as const;
const FLOATING_CONTROL_HINT_OFFSET_Y = 10;

type TokenAppearanceMenuAction = {
  glyph: string;
  iconId?: TokenIconId | null;
  visualVariant: TokenVisualVariant;
};

type BoardStageShellOverlaysProps = {
  cursors: CursorOverlayItem[];
  addTokenButtonColor: string;
  addImageButtonColor: string;
  onAddTokenButtonClick: () => void;
  onAddTextCardButtonClick: () => void;
  onAddImageButtonClick: () => void;
  sessionPanelRef: RefObject<HTMLDivElement | null>;
  roomId: string;
  isCurrentParticipantRoomCreator: boolean;
  roomCreatorName: string | null;
  roomCreatorColor: string | null;
  roomBackgroundThemeId: RoomBackgroundThemeId;
  participantName: string;
  participantColor: string;
  mediaStatus: LiveKitMediaStatusViewModel | null;
  feedbackContext: FeedbackCaptureContext;
  isDebugToolsEnabled: boolean;
  isDevToolsOpen: boolean;
  onLeaveRoom: () => void;
  onResetBoard: () => void;
  onRoomBackgroundThemeChange: (backgroundThemeId: RoomBackgroundThemeId) => void;
  onToggleDevTools: () => void;
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
  boardContextMenuState: BoardContextMenuState;
  participantAvatarFaceId?: ParticipantAvatarFaceId;
  onCloseBoardContextMenu: () => void;
  onShowBoardMenuAction: () => void;
  onSelectTokenAppearanceAction: (action: TokenAppearanceMenuAction) => void;
};

export function BoardStageShellOverlays({
  cursors,
  addTokenButtonColor,
  addImageButtonColor,
  onAddTokenButtonClick,
  onAddTextCardButtonClick,
  onAddImageButtonClick,
  sessionPanelRef,
  roomId,
  isCurrentParticipantRoomCreator,
  roomCreatorName,
  roomCreatorColor,
  roomBackgroundThemeId,
  participantName,
  participantColor,
  mediaStatus,
  feedbackContext,
  isDebugToolsEnabled,
  isDevToolsOpen,
  onLeaveRoom,
  onResetBoard,
  onRoomBackgroundThemeChange,
  onToggleDevTools,
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
  boardContextMenuState,
  participantAvatarFaceId,
  onCloseBoardContextMenu,
  onShowBoardMenuAction,
  onSelectTokenAppearanceAction,
}: BoardStageShellOverlaysProps) {
  const addTokenButtonRecipe = createDraftLocalUserButtonRecipeForSlot(
    buttonRecipes.primary.small,
    getParticipantColorSlotNumber(addTokenButtonColor),
    "fill"
  );
  const addTextCardButtonRecipe = buttonRecipes.primaryNeutral.small;
  const addImageButtonRecipe = createDraftLocalUserButtonRecipeForSlot(
    buttonRecipes.secondary.small,
    getParticipantColorSlotNumber(addImageButtonColor),
    "border"
  );
  const tokenShapeGlyphs = ["●", "■", "▲", "▼"] as const;
  const currentTokenVisualVariant =
    boardContextMenuState?.kind === "token"
      ? boardContextMenuState.currentVisualVariant
      : "standard";
  const currentTokenGlyph =
    boardContextMenuState?.kind === "token"
      ? boardContextMenuState.currentGlyph
      : "";
  const currentTokenIconId =
    boardContextMenuState?.kind === "token"
      ? boardContextMenuState.currentIconId
      : null;
  const currentParticipantAvatarTokenIconId = participantAvatarFaceId
    ? PARTICIPANT_AVATAR_FACE_TO_TOKEN_ICON_ID[participantAvatarFaceId]
    : TOKEN_DEFAULT_ICON_ID;
  const tokenBigIconIds = TOKEN_BIG_ICON_IDS.filter(
    (iconId) => iconId !== currentParticipantAvatarTokenIconId
  ).slice(0, TOKEN_CONTEXT_MENU_BIG_ICON_COUNT);
  const createTokenAppearanceMenuItem = ({
    ariaLabel,
    glyph,
    iconId = null,
    icon,
    id,
    label,
    visualVariant,
  }: {
    ariaLabel: string;
    glyph: string;
    iconId?: TokenIconId | null;
    icon?: ReactNode;
    id: string;
    label: ReactNode;
    visualVariant: TokenVisualVariant;
  }): ContextMenuItem => ({
    type: "item",
    id,
    label,
    ariaLabel,
    align: "center",
    icon,
    labelStyle: {
      fontSize: visualVariant === "icon" ? 20 : 18,
      lineHeight: 1,
    },
    selected:
      currentTokenVisualVariant === visualVariant &&
      (visualVariant === "icon"
        ? currentTokenIconId === iconId
        : currentTokenGlyph === glyph),
    onSelect: () => {
      onSelectTokenAppearanceAction({
        glyph,
        iconId,
        visualVariant,
      });
    },
    testId: `token-context-menu-${visualVariant}-${iconId ?? (glyph || "empty")}`,
  });
  const tokenShapeMenuItems: ContextMenuItem[] = [
    createTokenAppearanceMenuItem({
      ariaLabel: "Small token",
      glyph: TOKEN_MENU_MINI_GLYPH,
      id: "token-variant-mini",
      label: (
        <span
          aria-hidden="true"
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: participantColor,
            border: "2px solid rgba(248, 250, 252, 0.92)",
            boxSizing: "border-box",
            display: "block",
          }}
        />
      ),
      visualVariant: "mini",
    }),
    {
      type: "separator",
      id: "token-mini-section-separator",
    },
    ...tokenShapeGlyphs.map((glyph) =>
      createTokenAppearanceMenuItem({
        ariaLabel: glyph ? `Token symbol ${glyph}` : "Token without symbol",
        glyph,
        id: `token-symbol-${glyph || "empty"}`,
        label: glyph,
        visualVariant: "standard",
      })
    ),
    {
      type: "separator",
      id: "token-symbol-section-separator",
    },
    createTokenAppearanceMenuItem({
      ariaLabel: "Current player avatar token",
      glyph: "",
      iconId: currentParticipantAvatarTokenIconId,
      id: "token-big-icon-current-avatar",
      label: (
        <TokenIconPreview
          iconId={currentParticipantAvatarTokenIconId}
          size={22}
          strokeWidth={1.55}
        />
      ),
      visualVariant: "icon",
    }),
    ...tokenBigIconIds.map((iconId) =>
      createTokenAppearanceMenuItem({
        ariaLabel: `Big token icon ${iconId}`,
        glyph: "",
        iconId,
        id: `token-big-icon-${iconId}`,
        label: (
          <TokenIconPreview iconId={iconId} size={22} strokeWidth={1.55} />
        ),
        visualVariant: "icon",
      })
    ),
  ];
  const boardContextMenuItems: ContextMenuItem[] =
    boardContextMenuState?.kind === "board"
      ? [
          {
            type: "item",
            id: "center-board",
            label: "Center board",
            onSelect: onShowBoardMenuAction,
            testId: "board-context-menu-center-board",
          },
        ]
      : boardContextMenuState?.kind === "token"
        ? tokenShapeMenuItems
        : [];
  const isTokenContextMenu = boardContextMenuState?.kind === "token";
  const tokenContextMenuWidth =
    TOKEN_CONTEXT_MENU_COLUMN_COUNT * TOKEN_CONTEXT_MENU_GRID_ITEM_SIZE +
    Math.max(0, TOKEN_CONTEXT_MENU_COLUMN_COUNT - 1) *
      TOKEN_CONTEXT_MENU_GRID_GAP +
    TOKEN_CONTEXT_MENU_SHELL_INLINE_PADDING;

  return (
    <>
      <CursorOverlay cursors={cursors} />

      <div
        style={{
          position: "fixed",
          top: 20,
          left: "50%",
          zIndex: 30,
          display: "flex",
          gap: 8,
          transform: "translateX(-50%)",
          pointerEvents: "none",
        }}
      >
        <HoverHint
          placement="bottom"
          offset={FLOATING_CONTROL_HINT_OFFSET_Y}
          body="Add token"
          minWidth="max-content"
          maxWidth={160}
          wrapperStyle={{
            justifyItems: "center",
            pointerEvents: "auto",
          }}
          tooltipStyle={{
            padding: "8px 10px",
          }}
        >
          <button
            type="button"
            onClick={onAddTokenButtonClick}
            aria-label="Add token"
            {...getButtonProps(addTokenButtonRecipe)}
            {...getDesignSystemDebugAttrs(addTokenButtonRecipe.debug)}
            style={{
              ...getButtonProps(addTokenButtonRecipe).style,
              width: 32,
              minWidth: 32,
              height: 32,
              minHeight: 32,
              padding: 0,
              border: FLOATING_BUTTON_EXTRA_BORDER,
              borderRadius: 999,
              boxShadow: FLOATING_BUTTON_SHADOW,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            <span style={PLUS_BUTTON_GLYPH_STYLE}>+</span>
          </button>
        </HoverHint>

        <HoverHint
          placement="bottom"
          offset={FLOATING_CONTROL_HINT_OFFSET_Y}
          body="Add note"
          minWidth="max-content"
          maxWidth={160}
          wrapperStyle={{
            justifyItems: "center",
            pointerEvents: "auto",
          }}
          tooltipStyle={{
            padding: "8px 10px",
          }}
        >
          <button
            type="button"
            onClick={onAddTextCardButtonClick}
            aria-label="Add text card"
            {...getButtonProps(addTextCardButtonRecipe)}
            {...getDesignSystemDebugAttrs(addTextCardButtonRecipe.debug)}
            style={{
              ...getButtonProps(addTextCardButtonRecipe).style,
              width: 32,
              minWidth: 32,
              height: 32,
              minHeight: 32,
              padding: 0,
              boxShadow: FLOATING_BUTTON_SHADOW,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            <span style={PLUS_BUTTON_GLYPH_STYLE}>+</span>
          </button>
        </HoverHint>

        <HoverHint
          placement="bottom"
          offset={FLOATING_CONTROL_HINT_OFFSET_Y}
          body="Add image"
          minWidth="max-content"
          maxWidth={160}
          wrapperStyle={{
            justifyItems: "center",
            pointerEvents: "auto",
          }}
          tooltipStyle={{
            padding: "8px 10px",
          }}
        >
          <button
            type="button"
            onClick={onAddImageButtonClick}
            aria-label="Add image"
            {...getButtonProps(addImageButtonRecipe)}
            {...getDesignSystemDebugAttrs(addImageButtonRecipe.debug)}
            style={{
              ...getButtonProps(addImageButtonRecipe).style,
              width: 32,
              minWidth: 32,
              height: 32,
              minHeight: 32,
              padding: 0,
              borderWidth: BOARD_SURFACE_CONTROL_BORDER_WIDTH,
              boxShadow: FLOATING_BUTTON_SHADOW,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            <span style={PLUS_BUTTON_GLYPH_STYLE}>+</span>
          </button>
        </HoverHint>
      </div>

      <ParticipantSessionPanel
        ref={sessionPanelRef}
        roomId={roomId}
        isCurrentParticipantRoomCreator={isCurrentParticipantRoomCreator}
        roomCreatorName={roomCreatorName}
        roomCreatorColor={roomCreatorColor}
        roomBackgroundThemeId={roomBackgroundThemeId}
        participantName={participantName}
        participantColor={participantColor}
        mediaStatus={mediaStatus}
        feedbackContext={feedbackContext}
        isDebugToolsEnabled={isDebugToolsEnabled}
        isDevToolsOpen={isDevToolsOpen}
        onLeaveRoom={onLeaveRoom}
        onResetBoard={onResetBoard}
        onRoomBackgroundThemeChange={onRoomBackgroundThemeChange}
        onToggleDevTools={onToggleDevTools}
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

      <ContextMenu
        anchorPoint={
          boardContextMenuState
            ? {
                x: boardContextMenuState.clientX,
                y: boardContextMenuState.clientY,
              }
            : null
        }
        ariaLabel={
          boardContextMenuState?.kind === "token"
            ? "Token context menu"
            : "Board context menu"
        }
        items={boardContextMenuItems}
        gridColumnCount={
          isTokenContextMenu ? TOKEN_CONTEXT_MENU_COLUMN_COUNT : undefined
        }
        layout={isTokenContextMenu ? "grid" : "list"}
        maxWidth={isTokenContextMenu ? tokenContextMenuWidth : undefined}
        minWidth={isTokenContextMenu ? tokenContextMenuWidth : 160}
        onClose={onCloseBoardContextMenu}
      />
    </>
  );
}
