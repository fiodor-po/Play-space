import { forwardRef, type ReactNode } from "react";
import { HTML_UI_FONT_FAMILY } from "../constants";

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
  onAddImage: () => void;
  onLeaveRoom: () => void;
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
    isDevToolsOpen: _isDevToolsOpen,
    participantColorOptions,
    onAddImage,
    onLeaveRoom,
    onToggleColorPicker,
    onToggleDevTools: _onToggleDevTools,
    onParticipantNameDraftChange,
    onParticipantNameSubmit,
    onStartEditingParticipantName,
    onSelectParticipantColor,
    devToolsContent: _devToolsContent,
  },
  ref
) {
  const roomCreatorLine = isCurrentParticipantRoomCreator
    ? "Creator: You"
    : roomCreatorName
      ? `Creator: ${roomCreatorName}`
      : null;

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: 20,
        left: 20,
        zIndex: 10,
        display: "grid",
        gap: 8,
        minWidth: 180,
        padding: 12,
        borderRadius: 14,
        border: "1px solid rgba(148, 163, 184, 0.22)",
        background: "rgba(15, 23, 42, 0.88)",
        color: "#e2e8f0",
        boxShadow: "0 18px 50px rgba(2, 6, 23, 0.35)",
        backdropFilter: "blur(10px)",
        fontFamily: HTML_UI_FONT_FAMILY,
        pointerEvents: "none",
      }}
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
            display: "flex",
            alignItems: "center",
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
            onClick={onAddImage}
            aria-label="Add image"
            style={{
              width: 24,
              height: 24,
              display: "grid",
              placeItems: "center",
              padding: 0,
              borderRadius: 999,
              border: "1px solid rgba(15, 118, 110, 0.55)",
              background: "rgba(15, 118, 110, 0.18)",
              color: "#ccfbf1",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: HTML_UI_FONT_FAMILY,
              lineHeight: 1,
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          >
            +
          </button>
          <button
            type="button"
            onClick={onLeaveRoom}
            style={{
              padding: 0,
              border: "none",
              background: "transparent",
              color: "#94a3b8",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: HTML_UI_FONT_FAMILY,
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          >
            Leave room
          </button>
        </div>
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
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            background: participantColor,
            border: "2px solid rgba(255, 255, 255, 0.85)",
            boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.4)",
            flexShrink: 0,
            padding: 0,
            cursor: "pointer",
            pointerEvents: "auto",
          }}
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

            return (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onSelectParticipantColor(color);
                }}
                aria-label={`Select color ${color}`}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  border: isSelected
                    ? "2px solid #f8fafc"
                    : "1px solid rgba(255, 255, 255, 0.22)",
                  background: color,
                  padding: 0,
                  cursor: "pointer",
                  pointerEvents: "auto",
                }}
              />
            );
          })}
        </div>
      )}

      {_isDevToolsOpen && (
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
            Debug tools
          </div>
          <div style={{ pointerEvents: "auto" }}>{_devToolsContent}</div>
        </div>
      )}
    </div>
  );
});
