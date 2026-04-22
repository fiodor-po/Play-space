import { forwardRef, type ReactNode } from "react";
import { HTML_UI_FONT_FAMILY } from "../constants";
import { getDesignSystemDebugAttrs } from "../../ui/system/debugMeta";
import {
  buttonRecipes,
  createTextButtonRecipe,
  getButtonProps,
} from "../../ui/system/families/button";
import { boardSurfaceRecipes } from "../../ui/system/boardSurfaces";
import { selectionControlRecipes } from "../../ui/system/families/selectionControls";
import { inlineTextRecipes } from "../../ui/system/inlineText";
import { border, text } from "../../ui/system/foundations";
import { fontSize, uiTextStyle, uiTextStyleSmall } from "../../ui/system/typography";
import type { LiveKitMediaStatusViewModel } from "../../media/liveKitMediaStatus";

type ParticipantSessionPanelProps = {
  roomId: string;
  isCurrentParticipantRoomCreator: boolean;
  roomCreatorName: string | null;
  roomCreatorColor: string | null;
  participantName: string;
  participantColor: string;
  participantNameDraft: string;
  isEditingParticipantName: boolean;
  mediaStatus: LiveKitMediaStatusViewModel | null;
  isDebugToolsEnabled: boolean;
  isDevToolsOpen: boolean;
  onLeaveRoom: () => void;
  onResetBoard: () => void;
  onToggleDevTools: () => void;
  onParticipantNameDraftChange: (value: string) => void;
  onParticipantNameSubmit: () => void;
  onStartEditingParticipantName: () => void;
  devToolsContent: ReactNode;
};

export const ParticipantSessionPanel = forwardRef<
  HTMLDivElement,
  ParticipantSessionPanelProps
>(function ParticipantSessionPanel(
  {
    roomId,
    isCurrentParticipantRoomCreator,
    roomCreatorName,
    roomCreatorColor,
    participantName,
    participantColor,
    participantNameDraft,
    isEditingParticipantName,
    mediaStatus,
    isDebugToolsEnabled,
    isDevToolsOpen,
    onLeaveRoom,
    onResetBoard,
    onToggleDevTools,
    onParticipantNameDraftChange,
    onParticipantNameSubmit,
    onStartEditingParticipantName,
    devToolsContent,
  },
  ref
) {
  const leaveRoomButtonRecipe = createTextButtonRecipe(
    buttonRecipes.secondary.small,
    "muted"
  );
  const resetBoardButtonRecipe = buttonRecipes.danger.small;
  const mediaRetryButtonRecipe = buttonRecipes.secondary.small;
  const devToolsSelectionRecipe = selectionControlRecipes.checkbox.small;
  return (
    <div
      ref={ref}
      style={{
        ...boardSurfaceRecipes.floatingShell.shell.style,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "fixed",
        top: 20,
        left: 20,
        zIndex: 10,
        minWidth: 180,
        maxWidth: "min(360px, calc(100vw - 40px))",
        maxHeight: "calc(100vh - 40px)",
        paddingBottom: 14,
        fontFamily: HTML_UI_FONT_FAMILY,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      {...getDesignSystemDebugAttrs(boardSurfaceRecipes.floatingShell.shell.debug)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{
            ...uiTextStyle.label,
            fontSize: 15,
            pointerEvents: "none",
            overflowWrap: "anywhere",
          }}
        >
          {roomId}
        </div>
        <button
          type="button"
          onClick={onLeaveRoom}
          data-testid="session-leave-room-button"
          {...getButtonProps(leaveRoomButtonRecipe)}
          style={{
            ...getButtonProps(leaveRoomButtonRecipe).style,
            justifyContent: "flex-end",
            pointerEvents: "auto",
          }}
          {...getDesignSystemDebugAttrs(leaveRoomButtonRecipe.debug)}
        >
          Leave room
        </button>
      </div>

      {isCurrentParticipantRoomCreator || roomCreatorName ? (
        <div
          style={{
            ...inlineTextRecipes.muted.style,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {isCurrentParticipantRoomCreator ? (
            "Room Owner: You"
          ) : (
            <>
              {"Room Owner: "}
              <span style={{ color: roomCreatorColor ?? text.secondary }}>
                {roomCreatorName}
              </span>
            </>
          )}
        </div>
      ) : null}

      {mediaStatus ? (
        <div
          style={{
            display: "grid",
            gap: 6,
            marginTop: 2,
            paddingTop: 10,
            borderTop: `1px solid ${border.default}`,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              ...uiTextStyleSmall.label,
              color: text.muted,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}
          >
            Room media
          </div>
          <div
            style={{
              ...inlineTextRecipes.muted.style,
              pointerEvents: "none",
            }}
          >
            {mediaStatus.mediaStatusLabel}
          </div>
          {mediaStatus.mediaErrorLabel ? (
            <div
              style={{
                color: "#fecaca",
                fontSize: 12,
                lineHeight: "16px",
                pointerEvents: "none",
              }}
            >
              <div>{mediaStatus.mediaErrorLabel}</div>
              {mediaStatus.mediaErrorDetail ? (
                <div style={{ marginTop: 3, color: "#fca5a5" }}>
                  {mediaStatus.mediaErrorDetail}
                </div>
              ) : null}
            </div>
          ) : null}
          {mediaStatus.canJoinMedia ? (
            <button
              type="button"
              onClick={() => {
                mediaStatus.onJoinMedia();
              }}
              {...getButtonProps(mediaRetryButtonRecipe, {
                loading: mediaStatus.isMediaJoining,
              })}
              style={{
                ...getButtonProps(mediaRetryButtonRecipe, {
                  loading: mediaStatus.isMediaJoining,
                }).style,
                justifyContent: "flex-start",
                pointerEvents: "auto",
              }}
              {...getDesignSystemDebugAttrs(mediaRetryButtonRecipe.debug)}
            >
              {mediaStatus.isMediaJoining
                ? "Joining..."
                : mediaStatus.mediaErrorLabel
                  ? "Retry media"
                  : "Join media"}
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {isEditingParticipantName ? (
          <input
            value={participantNameDraft}
            onChange={(event) => {
              onParticipantNameDraftChange(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") {
                return;
              }

              event.preventDefault();
              onParticipantNameSubmit();
            }}
            autoFocus
            style={{
              minWidth: 0,
              padding: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              color: participantColor,
              fontSize: fontSize["2xl"],
              fontWeight: 700,
              fontFamily: HTML_UI_FONT_FAMILY,
              pointerEvents: "auto",
            }}
          />
        ) : (
          <button
            type="button"
            onClick={onStartEditingParticipantName}
            style={{
              padding: 0,
              border: "none",
              background: "transparent",
              color: participantColor,
              fontSize: fontSize["2xl"],
              fontWeight: 700,
              fontFamily: HTML_UI_FONT_FAMILY,
              cursor: "text",
              pointerEvents: "auto",
            }}
          >
            {participantName}
          </button>
        )}
      </div>

      {isCurrentParticipantRoomCreator && (
        <div
          style={{
            display: "grid",
            gap: 8,
            marginTop: 2,
            paddingTop: 10,
            borderTop: `1px solid ${border.default}`,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              ...uiTextStyleSmall.label,
              color: text.muted,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}
          >
            Room tools
          </div>

          <button
            type="button"
            onClick={onResetBoard}
            {...getButtonProps(resetBoardButtonRecipe)}
            style={{
              ...getButtonProps(resetBoardButtonRecipe).style,
              textAlign: "left",
              justifyContent: "flex-start",
              pointerEvents: "auto",
            }}
            {...getDesignSystemDebugAttrs(resetBoardButtonRecipe.debug)}
          >
            Reset board
          </button>
        </div>
      )}

      {isDebugToolsEnabled ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 2,
            paddingTop: 10,
            borderTop: `1px solid ${border.default}`,
            pointerEvents: "none",
            minHeight: 0,
            flex: isDevToolsOpen ? 1 : "0 0 auto",
          }}
        >
          <label
            style={{
              ...devToolsSelectionRecipe.row.style,
              pointerEvents: "auto",
            }}
            className={devToolsSelectionRecipe.row.className}
            {...getDesignSystemDebugAttrs(devToolsSelectionRecipe.row.debug)}
          >
            <input
              type="checkbox"
              data-testid="session-debug-tools-toggle"
              checked={isDevToolsOpen}
              onChange={() => {
                onToggleDevTools();
              }}
              style={devToolsSelectionRecipe.indicator.style}
              className={devToolsSelectionRecipe.indicator.className}
            />
            <span
              style={devToolsSelectionRecipe.label.style}
              className={devToolsSelectionRecipe.label.className}
            >
              Debug tools
            </span>
          </label>

          {isDevToolsOpen && (
            <div
              style={{
                pointerEvents: "auto",
                minHeight: 0,
                overflowY: "auto",
                overscrollBehavior: "contain",
                paddingRight: 4,
              }}
            >
              {devToolsContent}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
});
