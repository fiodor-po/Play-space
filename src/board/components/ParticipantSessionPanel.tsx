import { forwardRef, type ReactNode } from "react";
import { HTML_UI_FONT_FAMILY } from "../constants";
import { getDesignSystemDebugAttrs } from "../../ui/system/debug";
import {
  buttonRecipes,
  createTextButtonRecipe,
} from "../../ui/system/families/button";
import { boardSurfaceRecipes } from "../../ui/system/boardSurfaces";
import { selectionControlRecipes } from "../../ui/system/families/selectionControls";
import { surfaceRecipes } from "../../ui/system/surfaces";
import {
  getSwatchButtonProps,
  swatchPillRecipes,
} from "../../ui/system/families/swatchPill";

type ParticipantSessionPanelProps = {
  roomId: string;
  isCurrentParticipantRoomCreator: boolean;
  roomCreatorName: string | null;
  participantName: string;
  participantColor: string;
  participantNameDraft: string;
  isEditingParticipantName: boolean;
  isColorPickerOpen: boolean;
  isDevToolsOpen: boolean;
  participantColorOptions: string[];
  onLeaveRoom: () => void;
  onResetBoard: () => void;
  onToggleColorPicker: () => void;
  onToggleDevTools: () => void;
  onParticipantNameDraftChange: (value: string) => void;
  onParticipantNameSubmit: () => void;
  onStartEditingParticipantName: () => void;
  onSelectParticipantColor: (color: string) => void;
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
    participantName,
    participantColor,
    participantNameDraft,
    isEditingParticipantName,
    isColorPickerOpen,
    isDevToolsOpen,
    participantColorOptions,
    onLeaveRoom,
    onResetBoard,
    onToggleColorPicker,
    onToggleDevTools,
    onParticipantNameDraftChange,
    onParticipantNameSubmit,
    onStartEditingParticipantName,
    onSelectParticipantColor,
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
  const participantColorTriggerProps = getSwatchButtonProps(
    swatchPillRecipes.swatch.trigger,
    {
      fillColor: participantColor,
      selected: true,
    }
  );
  const roomCreatorLine = isCurrentParticipantRoomCreator
    ? "Creator: You"
    : roomCreatorName
      ? `Creator: ${roomCreatorName}`
      : null;

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

      {roomCreatorLine ? (
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
          {roomCreatorLine}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={onToggleColorPicker}
          aria-label="Edit participant color"
          className={participantColorTriggerProps.className}
          style={participantColorTriggerProps.style}
          {...getDesignSystemDebugAttrs(swatchPillRecipes.swatch.trigger.debug)}
        />

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
              color: "#e2e8f0",
              fontSize: 15,
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
              color: "#e2e8f0",
              fontSize: 15,
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

      {isColorPickerOpen && (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            pointerEvents: "none",
          }}
        >
          {participantColorOptions.map((color) => {
            const isSelected = color === participantColor;
            const participantPaletteSwatchProps = getSwatchButtonProps(
              swatchPillRecipes.swatch.small,
              {
                fillColor: color,
                selected: isSelected,
              }
            );

            return (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onSelectParticipantColor(color);
                }}
                aria-label={`Select color ${color}`}
                className={participantPaletteSwatchProps.className}
                style={participantPaletteSwatchProps.style}
                {...getDesignSystemDebugAttrs(swatchPillRecipes.swatch.small.debug)}
              />
            );
          })}
        </div>
      )}

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
    </div>
  );
});
