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
  onRequestRoomChange: () => void;
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
    onRequestRoomChange,
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
            onClick={onRequestRoomChange}
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
            Change
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleDevTools}
          aria-label={isDevToolsOpen ? "Close debug tools" : "Open debug tools"}
          aria-expanded={isDevToolsOpen}
          style={{
            width: 28,
            height: 28,
            display: "grid",
            placeItems: "center",
            borderRadius: 10,
            border: isDevToolsOpen
              ? "1px solid rgba(96, 165, 250, 0.5)"
              : "1px solid rgba(148, 163, 184, 0.22)",
            background: isDevToolsOpen
              ? "rgba(37, 99, 235, 0.18)"
              : "rgba(15, 23, 42, 0.72)",
            color: "#e2e8f0",
            cursor: "pointer",
            pointerEvents: "auto",
            flexShrink: 0,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 3.25H12M4.5 7H12M2 10.75H9.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <circle cx="3.2" cy="3.25" r="1.2" fill="currentColor" />
            <circle cx="10.8" cy="7" r="1.2" fill="currentColor" />
            <circle cx="8.1" cy="10.75" r="1.2" fill="currentColor" />
          </svg>
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

      {isDevToolsOpen && (
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
          <div style={{ pointerEvents: "auto" }}>{devToolsContent}</div>
        </div>
      )}
    </div>
  );
});
