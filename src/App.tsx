import { useMemo, useState } from "react";
import BoardStage from "./components/BoardStage";
import {
  getRoomIdFromLocation,
  loadLocalParticipantSession,
  PARTICIPANT_COLOR_OPTIONS,
  saveLocalParticipantSession,
} from "./lib/roomSession";
import type { FormEvent } from "react";
import type { LocalParticipantSession } from "./lib/roomSession";

export default function App() {
  const roomId = useMemo(() => getRoomIdFromLocation(window.location), []);
  const [participantSession, setParticipantSession] =
    useState<LocalParticipantSession | null>(() =>
      loadLocalParticipantSession(roomId)
    );
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState(PARTICIPANT_COLOR_OPTIONS[0]);

  const joinRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = draftName.trim();

    if (!trimmedName) {
      return;
    }

    const nextSession: LocalParticipantSession = {
      id: crypto.randomUUID(),
      name: trimmedName,
      color: draftColor,
    };

    saveLocalParticipantSession(roomId, nextSession);
    setParticipantSession(nextSession);
  };

  if (!participantSession) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "radial-gradient(circle at top, #15314b 0%, #081226 50%, #020617 100%)",
          padding: 24,
        }}
      >
        <form
          onSubmit={joinRoom}
          style={{
            width: "100%",
            maxWidth: 420,
            display: "grid",
            gap: 16,
            padding: 24,
            borderRadius: 20,
            background: "rgba(15, 23, 42, 0.88)",
            border: "1px solid rgba(148, 163, 184, 0.25)",
            color: "#e2e8f0",
            boxShadow: "0 24px 80px rgba(2, 6, 23, 0.55)",
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>Room</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{roomId}</div>
          </div>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 14, color: "#cbd5e1" }}>Display name</span>
            <input
              value={draftName}
              onChange={(event) => {
                setDraftName(event.target.value);
              }}
              placeholder="Your name"
              autoFocus
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(148, 163, 184, 0.3)",
                background: "rgba(15, 23, 42, 0.9)",
                color: "#f8fafc",
                fontSize: 16,
              }}
            />
          </label>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 14, color: "#cbd5e1" }}>Color</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {PARTICIPANT_COLOR_OPTIONS.map((color) => {
                const isSelected = color === draftColor;

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setDraftColor(color);
                    }}
                    aria-label={`Select color ${color}`}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      border: isSelected
                        ? "3px solid #f8fafc"
                        : "2px solid rgba(255, 255, 255, 0.2)",
                      background: color,
                      cursor: "pointer",
                    }}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={!draftName.trim()}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: draftColor,
              color: "#f8fafc",
              fontSize: 16,
              fontWeight: 700,
              cursor: draftName.trim() ? "pointer" : "not-allowed",
              opacity: draftName.trim() ? 1 : 0.6,
            }}
          >
            Join room
          </button>
        </form>
      </div>
    );
  }

  return <BoardStage participantSession={participantSession} roomId={roomId} />;
}
