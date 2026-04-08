import { useEffect, useRef, useState } from "react";
import BoardStage from "./components/BoardStage";
import { DiceSpikeOverlay } from "./dice/DiceSpikeOverlay";
import { LiveKitMediaDock } from "./media/LiveKitMediaDock";
import {
  createRoomGovernedEntityRef,
  getEffectiveAccessLevel,
} from "./lib/governance";
import {
  clearActiveRoomId,
  createLocalParticipantPresence,
  getRoomIdFromLocation,
  loadActiveRoomId,
  loadLocalParticipantSession,
  PARTICIPANT_COLOR_OPTIONS,
  saveActiveRoomId,
  saveLocalParticipantSession,
} from "./lib/roomSession";
import { ensureRoomRecord, loadRoomRecord } from "./lib/roomMetadata";
import { createClientId } from "./lib/id";
import { createRoomPresenceConnection } from "./lib/roomPresenceRealtime";
import { isLiveKitMediaEnabled, logClientRuntimeConfig } from "./lib/runtimeConfig";
import type { FormEvent } from "react";
import type {
  LocalParticipantSession,
  ParticipantPresence,
  ParticipantPresenceMap,
} from "./lib/roomSession";
import type { RoomRecord } from "./lib/roomMetadata";
import type { RoomPresenceConnection } from "./lib/roomPresenceRealtime";

function loadParticipantDraftForRoom(roomId: string) {
  const savedSession = loadLocalParticipantSession(roomId);

  return {
    savedSession,
    draftName: savedSession?.name ?? "",
    draftColor: savedSession?.color ?? PARTICIPANT_COLOR_OPTIONS[0],
  };
}

export default function App() {
  const liveKitMediaEnabled = isLiveKitMediaEnabled();
  const initialDraftRoomId = getRoomIdFromLocation(window.location);
  const initialParticipantDraft = loadParticipantDraftForRoom(initialDraftRoomId);
  const initialActiveRoomId = loadActiveRoomId();
  const shouldRestoreJoinedRoom =
    initialActiveRoomId === initialDraftRoomId &&
    !!initialParticipantDraft.savedSession;

  const [draftRoomId, setDraftRoomId] = useState(initialDraftRoomId);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() =>
    shouldRestoreJoinedRoom ? initialDraftRoomId : null
  );
  const [isInRoom, setIsInRoom] = useState(() => shouldRestoreJoinedRoom);
  const [participantSession, setParticipantSession] =
    useState<LocalParticipantSession | null>(() =>
      shouldRestoreJoinedRoom ? initialParticipantDraft.savedSession : null
    );
  const [participantPresences, setParticipantPresences] =
    useState<ParticipantPresenceMap>({});
  const [localParticipantPresence, setLocalParticipantPresence] =
    useState<ParticipantPresence | null>(() => {
      const session = shouldRestoreJoinedRoom
        ? initialParticipantDraft.savedSession
        : null;
      return session ? createLocalParticipantPresence(session) : null;
    });
  const [roomRecord, setRoomRecord] = useState<RoomRecord | null>(() =>
    shouldRestoreJoinedRoom ? loadRoomRecord(initialDraftRoomId) : null
  );
  const [draftName, setDraftName] = useState(initialParticipantDraft.draftName);
  const [draftColor, setDraftColor] = useState(initialParticipantDraft.draftColor);
  const roomPresenceConnectionRef = useRef<RoomPresenceConnection | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      if (isInRoom) {
        return;
      }

      const nextRoomId = getRoomIdFromLocation(window.location);
      const nextParticipantDraft = loadParticipantDraftForRoom(nextRoomId);

      setDraftRoomId(nextRoomId);
      setDraftName(nextParticipantDraft.draftName);
      setDraftColor(nextParticipantDraft.draftColor);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isInRoom]);

  useEffect(() => {
    logClientRuntimeConfig(isInRoom ? activeRoomId ?? draftRoomId : draftRoomId);
  }, [activeRoomId, draftRoomId, isInRoom]);

  useEffect(() => {
    if (!isInRoom || !activeRoomId) {
      setRoomRecord(null);
      setParticipantPresences({});
      return;
    }

    const nextSession = loadLocalParticipantSession(activeRoomId);

    setParticipantSession(nextSession);
    setRoomRecord(loadRoomRecord(activeRoomId));
    setLocalParticipantPresence(
      nextSession ? createLocalParticipantPresence(nextSession) : null
    );
    setParticipantPresences({});
  }, [activeRoomId, isInRoom]);

  const joinRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedRoomId = draftRoomId.trim();
    const trimmedName = draftName.trim();

    if (!trimmedRoomId || !trimmedName) {
      return;
    }

    const savedSession = loadLocalParticipantSession(trimmedRoomId);
    const nextSession: LocalParticipantSession = {
      id: savedSession?.id ?? createClientId(),
      name: trimmedName,
      color: draftColor,
    };

    saveLocalParticipantSession(trimmedRoomId, nextSession);
    saveActiveRoomId(trimmedRoomId);
    if (getRoomIdFromLocation(window.location) !== trimmedRoomId) {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("room", trimmedRoomId);
      window.history.pushState({}, "", nextUrl);
    }

    setDraftRoomId(trimmedRoomId);
    setActiveRoomId(trimmedRoomId);
    setIsInRoom(true);
    setRoomRecord(ensureRoomRecord(trimmedRoomId, nextSession.id));
    setParticipantSession(nextSession);
    setLocalParticipantPresence(createLocalParticipantPresence(nextSession));
  };

  const updateParticipantSession = (updater: (session: LocalParticipantSession) => LocalParticipantSession) => {
    setParticipantSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      const participantId = currentSession.id;
      const nextSession = updater(currentSession);
      const nextRoomId = activeRoomId;

      if (!nextRoomId) {
        return currentSession;
      }

      saveLocalParticipantSession(nextRoomId, nextSession);
      setDraftName(nextSession.name);
      setDraftColor(nextSession.color);
      setLocalParticipantPresence((currentPresence) =>
        currentPresence
          ? {
              ...currentPresence,
              participantId,
              name: nextSession.name,
              color: nextSession.color,
            }
          : {
              ...createLocalParticipantPresence(nextSession),
              participantId,
            }
      );
      return nextSession;
    });
  };

  const leaveRoom = () => {
    if (!activeRoomId) {
      return;
    }

    clearActiveRoomId();
    setDraftRoomId(activeRoomId);
    setDraftName(participantSession?.name ?? draftName);
    setDraftColor(participantSession?.color ?? draftColor);
    setActiveRoomId(null);
    setIsInRoom(false);
    setParticipantSession(null);
    setLocalParticipantPresence(null);
    setParticipantPresences({});
    setRoomRecord(null);
  };

  useEffect(() => {
    if (!isInRoom || !activeRoomId || !participantSession?.id) {
      roomPresenceConnectionRef.current?.destroy();
      roomPresenceConnectionRef.current = null;
      setParticipantPresences({});
      return;
    }

    setRoomRecord(ensureRoomRecord(activeRoomId, participantSession.id));

    const connection = createRoomPresenceConnection({
      onPresencesChange: setParticipantPresences,
      roomId: activeRoomId,
    });
    roomPresenceConnectionRef.current = connection;

    return () => {
      if (roomPresenceConnectionRef.current === connection) {
        roomPresenceConnectionRef.current = null;
      }

      connection.destroy();
    };
  }, [activeRoomId, isInRoom, participantSession?.id]);

  useEffect(() => {
    if (!isInRoom || !participantSession) {
      return;
    }

    const connection = roomPresenceConnectionRef.current;

    if (!connection) {
      return;
    }

    connection.setLocalPresence(
      localParticipantPresence ?? createLocalParticipantPresence(participantSession)
    );
  }, [localParticipantPresence, participantSession]);

  const joinedRoomId = activeRoomId ?? draftRoomId;
  const roomGovernedEntity = createRoomGovernedEntityRef({
    roomId: joinedRoomId,
    creatorId: roomRecord?.creatorId ?? null,
  });
  const roomEffectiveAccessLevel = getEffectiveAccessLevel({
    entity: roomGovernedEntity,
    participantId: participantSession?.id ?? null,
    defaultAccessLevel: "full",
  });
  const roomCreatorId = roomRecord?.creatorId ?? null;
  const isCurrentParticipantRoomCreator =
    !!roomCreatorId && roomCreatorId === participantSession?.id;
  const roomCreatorName =
    roomCreatorId && !isCurrentParticipantRoomCreator
      ? participantPresences[roomCreatorId]?.name ?? null
      : null;

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
            <input
              value={draftRoomId}
              onChange={(event) => {
                const nextRoomId = event.target.value;
                setDraftRoomId(nextRoomId);

                const trimmedRoomId = nextRoomId.trim();

                if (!trimmedRoomId) {
                  return;
                }

                const nextParticipantDraft =
                  loadParticipantDraftForRoom(trimmedRoomId);

                if (!nextParticipantDraft.savedSession) {
                  return;
                }

                setDraftName(nextParticipantDraft.draftName);
                setDraftColor(nextParticipantDraft.draftColor);
              }}
              placeholder="Room name"
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(148, 163, 184, 0.3)",
                background: "rgba(15, 23, 42, 0.9)",
                color: "#f8fafc",
                fontSize: 22,
                fontWeight: 700,
              }}
            />
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
            disabled={!draftRoomId.trim() || !draftName.trim()}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: draftColor,
              color: "#f8fafc",
              fontSize: 16,
              fontWeight: 700,
              cursor:
                draftRoomId.trim() && draftName.trim() ? "pointer" : "not-allowed",
              opacity: draftRoomId.trim() && draftName.trim() ? 1 : 0.6,
            }}
          >
            Join room
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <BoardStage
        key={joinedRoomId}
        participantSession={participantSession}
        participantPresences={participantPresences}
        roomId={joinedRoomId}
        isCurrentParticipantRoomCreator={isCurrentParticipantRoomCreator}
        roomCreatorName={roomCreatorName}
        roomEffectiveAccessLevel={roomEffectiveAccessLevel}
        onLeaveRoom={leaveRoom}
        onUpdateParticipantSession={updateParticipantSession}
        onUpdateLocalPresence={(updater) => {
          setLocalParticipantPresence((currentPresence) =>
            updater(
              currentPresence ?? createLocalParticipantPresence(participantSession)
            )
          );
        }}
      />
      <DiceSpikeOverlay roomId={joinedRoomId} participantSession={participantSession} />
      {liveKitMediaEnabled ? (
        <LiveKitMediaDock roomId={joinedRoomId} participantSession={participantSession} />
      ) : null}
    </>
  );
}
