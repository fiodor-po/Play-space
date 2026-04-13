import { forwardRef, type ReactNode } from "react";
import { HTML_UI_FONT_FAMILY } from "../constants";
import { getDesignSystemDebugAttrs } from "../../ui/system/debugMeta";
import {
  buttonRecipes,
  createTextButtonRecipe,
} from "../../ui/system/families/button";
import { boardSurfaceRecipes } from "../../ui/system/boardSurfaces";
import { selectionControlRecipes } from "../../ui/system/families/selectionControls";
import { surfaceRecipes } from "../../ui/system/surfaces";
import { fontSize } from "../../ui/system/typography";

type ParticipantSessionPanelProps = {
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
  const devToolsSelectionRecipe = selectionControlRecipes.checkbox.small;
  return (
    <div
      ref={ref}
      className={surfaceRecipes.panel.compact.className}
      style={{
        ...boardSurfaceRecipes.floatingShell.shell.style,
        position: "fixed",
        top: 20,
        left: 20,
        zIndex: 10,
        minWidth: 180,
        paddingBottom: 14,
        fontFamily: HTML_UI_FONT_FAMILY,
        pointerEvents: "none",
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
            fontSize: 15,
            fontWeight: 700,
            pointerEvents: "none",
          }}
        >
          {roomId}
        </div>
        <button
          type="button"
          onClick={onLeaveRoom}
          style={{
            ...leaveRoomButtonRecipe.style,
            justifyContent: "flex-end",
            pointerEvents: "auto",
          }}
          className={leaveRoomButtonRecipe.className}
          {...getDesignSystemDebugAttrs(leaveRoomButtonRecipe.debug)}
        >
          Leave room
        </button>
      </div>

      {isCurrentParticipantRoomCreator || roomCreatorName ? (
        <div
          style={{
            fontSize: 12,
            color: "#94a3b8",
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
              <span style={{ color: roomCreatorColor ?? "#cbd5e1" }}>
                {roomCreatorName}
              </span>
            </>
          )}
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
            borderTop: "1px solid rgba(148, 163, 184, 0.16)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#94a3b8",
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
            style={{
              ...resetBoardButtonRecipe.style,
              textAlign: "left",
              justifyContent: "flex-start",
              pointerEvents: "auto",
            }}
            className={resetBoardButtonRecipe.className}
            {...getDesignSystemDebugAttrs(resetBoardButtonRecipe.debug)}
          >
            Reset board
          </button>
        </div>
      )}

      {isDebugToolsEnabled ? (
        <div
          style={{
            display: "grid",
            gap: 10,
            marginTop: 2,
            paddingTop: 10,
            borderTop: "1px solid rgba(148, 163, 184, 0.16)",
            pointerEvents: "none",
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
            <div style={{ pointerEvents: "auto" }}>{devToolsContent}</div>
          )}
        </div>
      ) : null}
    </div>
  );
});
