import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  VideoPresets,
  type Participant,
} from "livekit-client";
import type { LocalParticipantSession } from "../lib/roomSession";
import {
  LiveKitAccessTokenError,
  fetchLiveKitAccessToken,
  getLiveKitUrl,
} from "../lib/livekit";
import { HTML_UI_FONT_FAMILY } from "../board/constants";

type LiveKitMediaDockProps = {
  roomId: string;
  participantSession: LocalParticipantSession;
};

type MediaDockError =
  | "media-disabled"
  | "token-failed"
  | "permission-denied"
  | "connect-failed"
  | "disconnected";

type ParticipantTileProps = {
  participant: Participant;
  accentColor?: string | null;
  isLocal?: boolean;
};

function ParticipantTile({
  participant,
  accentColor = null,
  isLocal = false,
}: ParticipantTileProps) {
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const cameraTrack = participant.getTrackPublication(Track.Source.Camera)?.videoTrack;
  const audioTrack = !isLocal
    ? participant.getTrackPublication(Track.Source.Microphone)?.audioTrack
    : null;

  useEffect(() => {
    const videoElement = videoElementRef.current;

    if (!videoElement || !cameraTrack) {
      return;
    }

    cameraTrack.attach(videoElement);

    return () => {
      cameraTrack.detach(videoElement);
    };
  }, [cameraTrack]);

  useEffect(() => {
    const audioElement = audioElementRef.current;

    if (!audioElement || !audioTrack) {
      return;
    }

    audioTrack.attach(audioElement);

    return () => {
      audioTrack.detach(audioElement);
    };
  }, [audioTrack]);

  return (
    <div
      style={{
        width: 132,
        minHeight: 104,
        borderRadius: 14,
        overflow: "hidden",
        background: "rgba(15, 23, 42, 0.96)",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        boxShadow: "0 14px 36px rgba(2, 6, 23, 0.3)",
        fontFamily: HTML_UI_FONT_FAMILY,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 84,
          background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
        }}
      >
        {cameraTrack ? (
          <video
            ref={videoElementRef}
            autoPlay
            playsInline
            muted={isLocal}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              placeItems: "center",
              color: "#94a3b8",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Camera off
          </div>
        )}
        {!isLocal && <audio ref={audioElementRef} autoPlay playsInline />}
      </div>
      <div
        style={{
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          color: "#e2e8f0",
          fontSize: 12,
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 600,
          }}
        >
          {accentColor ? (
            <span
              aria-hidden="true"
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: accentColor,
                boxShadow: `0 0 0 1px ${accentColor}55`,
                flexShrink: 0,
              }}
            />
          ) : null}
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
          {participant.name || participant.identity}
          {isLocal ? " (you)" : ""}
          </span>
        </span>
        <span style={{ color: "#94a3b8", flexShrink: 0 }}>
          {participant.isMicrophoneEnabled ? "Mic" : "Muted"}
        </span>
      </div>
    </div>
  );
}

export function LiveKitMediaDock({
  roomId,
  participantSession,
}: LiveKitMediaDockProps) {
  const roomRef = useRef<Room | null>(null);
  const intentionalDisconnectRef = useRef(false);
  const [roomVersion, setRoomVersion] = useState(0);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<MediaDockError | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );

  const room = roomRef.current;
  const isConnected = connectionState === ConnectionState.Connected;

  useEffect(() => {
    return () => {
      const currentRoom = roomRef.current;

      if (!currentRoom) {
        return;
      }

      intentionalDisconnectRef.current = true;
      void currentRoom.disconnect();
      roomRef.current = null;
    };
  }, []);

  useEffect(() => {
    const currentRoom = roomRef.current;

    if (!currentRoom) {
      setError(null);
      setErrorDetail(null);
      setConnectionState(ConnectionState.Disconnected);
      return;
    }

    intentionalDisconnectRef.current = true;
    void currentRoom.disconnect();
    roomRef.current = null;
    setRoomVersion((value) => value + 1);
    setError(null);
    setErrorDetail(null);
    setConnectionState(ConnectionState.Disconnected);
    setIsJoining(false);
  }, [roomId]);

  const participants = useMemo(() => {
    if (!room) {
      return [] as Participant[];
    }

    return [room.localParticipant, ...Array.from(room.remoteParticipants.values())];
  }, [room, roomVersion]);

  const refreshRoom = () => {
    setRoomVersion((value) => value + 1);
  };

  const joinMedia = async () => {
    if (isJoining || roomRef.current) {
      return;
    }

    intentionalDisconnectRef.current = false;
    setIsJoining(true);
    setError(null);
    setErrorDetail(null);

    let token: string;

    try {
      token = await fetchLiveKitAccessToken({
        roomId,
        participantId: participantSession.id,
        participantName: participantSession.name,
      });
    } catch (error) {
      const errorCode =
        error instanceof LiveKitAccessTokenError ? error.code : null;

      setError(errorCode === "LIVEKIT_DISABLED" ? "media-disabled" : "token-failed");
      setErrorDetail(error instanceof Error ? error.message : null);
      setConnectionState(ConnectionState.Disconnected);
      setIsJoining(false);
      return;
    }

    try {
      const nextRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
        },
      });

      nextRoom
        .on(RoomEvent.ConnectionStateChanged, (state) => {
          setConnectionState(state);

          if (state === ConnectionState.Connected) {
            setError(null);
            setErrorDetail(null);
          }

          if (
            state === ConnectionState.Disconnected &&
            roomRef.current === nextRoom &&
          !intentionalDisconnectRef.current
          ) {
            setError((currentError) => currentError ?? "disconnected");
            setErrorDetail((currentDetail) => currentDetail ?? `Room ${nextRoom.name || roomId} disconnected.`);
          }
        })
        .on(RoomEvent.ParticipantConnected, refreshRoom)
        .on(RoomEvent.ParticipantDisconnected, refreshRoom)
        .on(RoomEvent.TrackSubscribed, refreshRoom)
        .on(RoomEvent.TrackUnsubscribed, refreshRoom)
        .on(RoomEvent.TrackMuted, refreshRoom)
        .on(RoomEvent.TrackUnmuted, refreshRoom)
        .on(RoomEvent.LocalTrackPublished, refreshRoom)
        .on(RoomEvent.LocalTrackUnpublished, refreshRoom)
        .on(RoomEvent.ParticipantNameChanged, refreshRoom)
        .on(RoomEvent.Disconnected, () => {
          if (roomRef.current === nextRoom) {
            roomRef.current = null;
            refreshRoom();
          }

          intentionalDisconnectRef.current = false;
        });

      roomRef.current = nextRoom;
      setConnectionState(ConnectionState.Connecting);

      const liveKitUrl = getLiveKitUrl();
      nextRoom.prepareConnection(liveKitUrl, token);
      await nextRoom.connect(liveKitUrl, token);
      await nextRoom.startAudio();

      try {
        await nextRoom.localParticipant.setCameraEnabled(true);
        await nextRoom.localParticipant.setMicrophoneEnabled(true);
        setCameraEnabled(true);
        setMicEnabled(true);
        setError(null);
        setErrorDetail(null);
      } catch (error) {
        const errorName =
          error && typeof error === "object" && "name" in error
            ? String(error.name)
            : "";

        setError(
          errorName === "NotAllowedError" ? "permission-denied" : "connect-failed"
        );
        setErrorDetail(
          errorName === "NotAllowedError"
            ? null
            : error instanceof Error
              ? error.message
              : null
        );
      }

      refreshRoom();
    } catch (error) {
      roomRef.current = null;
      setError("connect-failed");
      setErrorDetail(error instanceof Error ? error.message : null);
      setConnectionState(ConnectionState.Disconnected);
    } finally {
      setIsJoining(false);
    }
  };

  const leaveMedia = async () => {
    const currentRoom = roomRef.current;

    if (!currentRoom) {
      return;
    }

    setError(null);
    setErrorDetail(null);
    intentionalDisconnectRef.current = true;
    await currentRoom.disconnect();
    if (roomRef.current === currentRoom) {
      roomRef.current = null;
    }
    setConnectionState(ConnectionState.Disconnected);
    refreshRoom();
  };

  const toggleCamera = async () => {
    const currentRoom = roomRef.current;

    if (!currentRoom) {
      return;
    }

    const nextValue = !cameraEnabled;

    try {
      await currentRoom.localParticipant.setCameraEnabled(nextValue);
      setCameraEnabled(nextValue);
      setError(null);
      setErrorDetail(null);
      refreshRoom();
    } catch (error) {
      const errorName =
        error && typeof error === "object" && "name" in error
          ? String(error.name)
          : "";

      if (errorName === "NotAllowedError") {
        setError("permission-denied");
        setErrorDetail(null);
      }
    }
  };

  const toggleMicrophone = async () => {
    const currentRoom = roomRef.current;

    if (!currentRoom) {
      return;
    }

    const nextValue = !micEnabled;

    try {
      await currentRoom.localParticipant.setMicrophoneEnabled(nextValue);
      setMicEnabled(nextValue);
      setError(null);
      setErrorDetail(null);
      refreshRoom();
    } catch (error) {
      const errorName =
        error && typeof error === "object" && "name" in error
          ? String(error.name)
          : "";

      if (errorName === "NotAllowedError") {
        setError("permission-denied");
        setErrorDetail(null);
      }
    }
  };

  const errorLabel =
    error === "media-disabled"
      ? "Media is disabled or not fully configured for this environment."
      : error === "token-failed"
      ? "Could not load a media token."
      : error === "permission-denied"
        ? "Camera or microphone permission was denied."
        : error === "connect-failed"
          ? "Could not connect media."
          : error === "disconnected"
            ? "Media disconnected."
            : null;

  const statusLabel =
    error === "media-disabled"
      ? `Media unavailable for ${roomId}`
      : connectionState === ConnectionState.Connected
      ? `Connected to ${roomId}`
      : connectionState === ConnectionState.Connecting || isJoining
        ? `Connecting to ${roomId}`
        : `Optional media for ${roomId}`;

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        width: 320,
        maxWidth: "calc(100vw - 32px)",
        display: "grid",
        gap: 10,
        padding: 12,
        borderRadius: 18,
        background: "rgba(15, 23, 42, 0.92)",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        boxShadow: "0 24px 60px rgba(2, 6, 23, 0.35)",
        backdropFilter: "blur(10px)",
        zIndex: 20,
        fontFamily: HTML_UI_FONT_FAMILY,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ display: "grid", gap: 2 }}>
          <div style={{ color: "#f8fafc", fontSize: 14, fontWeight: 700 }}>
            Room video
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>
            {statusLabel}
          </div>
        </div>

        {!isConnected ? (
          <button
            type="button"
            onClick={() => {
              void joinMedia();
            }}
            disabled={isJoining}
            style={actionButtonStyle("#334155")}
          >
            {isJoining ? "Joining..." : "Join media"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              void leaveMedia();
            }}
            style={actionButtonStyle("#1e293b")}
          >
            Leave
          </button>
        )}
      </div>

      {errorLabel && (
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 12,
            background: "rgba(69, 10, 10, 0.75)",
            border: "1px solid rgba(248, 113, 113, 0.35)",
            color: "#fecaca",
            fontSize: 12,
          }}
        >
          <div>{errorLabel}</div>
          {errorDetail && (
            <div style={{ marginTop: 4, color: "#fca5a5" }}>{errorDetail}</div>
          )}
        </div>
      )}

      {isConnected && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                void toggleMicrophone();
              }}
              style={actionButtonStyle(
                micEnabled ? "#334155" : "#1e293b",
                "rgba(148, 163, 184, 0.28)"
              )}
            >
              {micEnabled ? "Mute mic" : "Unmute mic"}
            </button>
            <button
              type="button"
              onClick={() => {
                void toggleCamera();
              }}
              style={actionButtonStyle(
                cameraEnabled ? "#334155" : "#1e293b",
                "rgba(148, 163, 184, 0.28)"
              )}
            >
              {cameraEnabled ? "Camera off" : "Camera on"}
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              paddingBottom: 2,
            }}
          >
            {participants.map((participant) => (
              <ParticipantTile
                key={participant.identity}
                participant={participant}
                accentColor={
                  participant.identity === participantSession.id
                    ? participantSession.color
                    : null
                }
                isLocal={participant.identity === participantSession.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function actionButtonStyle(
  background: string,
  border = "rgba(148, 163, 184, 0.28)"
): CSSProperties {
  return {
    padding: "9px 12px",
    borderRadius: 12,
    border: `1px solid ${border}`,
    background,
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: HTML_UI_FONT_FAMILY,
    cursor: "pointer",
  };
}
