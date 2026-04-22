import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ConnectionState,
  Room,
  RoomEvent,
  VideoPresets,
  type Participant,
} from "livekit-client";
import {
  LiveKitAccessTokenError,
  fetchLiveKitAccessToken,
  getLiveKitUrl,
} from "../lib/livekit";
import type { LocalParticipantSession } from "../lib/roomSession";
import {
  readMediaDeviceStatePreference,
  updateMediaDeviceStatePreference,
} from "./mediaDeviceStatePreference";

export type LiveKitMediaSessionError =
  | "media-disabled"
  | "token-failed"
  | "permission-denied"
  | "connect-failed"
  | "disconnected";

type UseLiveKitMediaSessionParams = {
  autoJoin?: boolean;
  roomId: string;
  participantSession: LocalParticipantSession;
};

const MEDIA_IDLE_DISABLE_TIMEOUT_MS = 60_000;

export function useLiveKitMediaSession({
  autoJoin = false,
  roomId,
  participantSession,
}: UseLiveKitMediaSessionParams) {
  const roomRef = useRef<Room | null>(null);
  const intentionalDisconnectRef = useRef(false);
  const hasAutoJoinAttemptedRef = useRef(false);
  const joinAttemptIdRef = useRef(0);
  const activeJoinAttemptIdRef = useRef<number | null>(null);
  const [participantsVersion, setParticipantsVersion] = useState(0);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<LiveKitMediaSessionError | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );

  const room = roomRef.current;
  const isConnected = connectionState === ConnectionState.Connected;

  const refreshRoom = useCallback(() => {
    setParticipantsVersion((value) => value + 1);
  }, []);

  const cancelActiveJoinAttempt = useCallback(() => {
    joinAttemptIdRef.current += 1;
    activeJoinAttemptIdRef.current = null;
  }, []);

  const disconnectRoom = useCallback(
    (room: Room) => {
      intentionalDisconnectRef.current = true;
      void room.disconnect();

      if (roomRef.current === room) {
        roomRef.current = null;
      }

      refreshRoom();
    },
    [refreshRoom]
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    let idleTimeoutId: number | null = null;

    const clearIdleTimeout = () => {
      if (idleTimeoutId === null) {
        return;
      }

      window.clearTimeout(idleTimeoutId);
      idleTimeoutId = null;
    };

    const disableLocalMediaForIdle = async () => {
      idleTimeoutId = null;

      const currentRoom = roomRef.current;

      if (!currentRoom) {
        return;
      }

      try {
        await currentRoom.localParticipant.setCameraEnabled(false);
        await currentRoom.localParticipant.setMicrophoneEnabled(false);
      } finally {
        setCameraEnabled(false);
        setMicEnabled(false);
        updateMediaDeviceStatePreference(roomId, participantSession.id, {
          cameraEnabled: false,
          microphoneEnabled: false,
        });
        refreshRoom();
      }
    };

    const scheduleIdleTimeout = () => {
      clearIdleTimeout();

      if (document.hidden !== true) {
        return;
      }

      idleTimeoutId = window.setTimeout(() => {
        void disableLocalMediaForIdle();
      }, MEDIA_IDLE_DISABLE_TIMEOUT_MS);
    };

    const handleVisibilityChange = () => {
      if (document.hidden === true) {
        scheduleIdleTimeout();
        return;
      }

      clearIdleTimeout();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    scheduleIdleTimeout();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearIdleTimeout();
    };
  }, [participantSession.id, refreshRoom, roomId]);

  useEffect(() => {
    cancelActiveJoinAttempt();
    hasAutoJoinAttemptedRef.current = false;
    setIsJoining(false);
  }, [cancelActiveJoinAttempt, participantSession.id, roomId]);

  useEffect(() => {
    return () => {
      cancelActiveJoinAttempt();

      const currentRoom = roomRef.current;

      if (!currentRoom) {
        return;
      }

      intentionalDisconnectRef.current = true;
      void currentRoom.disconnect();
      roomRef.current = null;
    };
  }, [cancelActiveJoinAttempt]);

  useEffect(() => {
    cancelActiveJoinAttempt();

    const currentRoom = roomRef.current;

    if (!currentRoom) {
      setError(null);
      setErrorDetail(null);
      setConnectionState(ConnectionState.Disconnected);
      setIsJoining(false);
      return;
    }

    disconnectRoom(currentRoom);
    refreshRoom();
    setError(null);
    setErrorDetail(null);
    setConnectionState(ConnectionState.Disconnected);
    setIsJoining(false);
  }, [
    cancelActiveJoinAttempt,
    disconnectRoom,
    participantSession.id,
    refreshRoom,
    roomId,
  ]);

  const participants = useMemo(() => {
    if (!room) {
      return [] as Participant[];
    }

    void participantsVersion;
    return [room.localParticipant, ...Array.from(room.remoteParticipants.values())];
  }, [room, participantsVersion]);

  const joinMedia = useCallback(async () => {
    if (activeJoinAttemptIdRef.current !== null || roomRef.current) {
      return;
    }

    const joinAttemptId = joinAttemptIdRef.current + 1;
    const isCurrentJoinAttempt = () =>
      activeJoinAttemptIdRef.current === joinAttemptId &&
      joinAttemptIdRef.current === joinAttemptId;

    joinAttemptIdRef.current = joinAttemptId;
    activeJoinAttemptIdRef.current = joinAttemptId;
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
      if (!isCurrentJoinAttempt()) {
        return;
      }

      const errorCode =
        error instanceof LiveKitAccessTokenError ? error.code : null;

      setError(errorCode === "LIVEKIT_DISABLED" ? "media-disabled" : "token-failed");
      setErrorDetail(error instanceof Error ? error.message : null);
      setConnectionState(ConnectionState.Disconnected);
      setIsJoining(false);
      return;
    }

    if (!isCurrentJoinAttempt()) {
      return;
    }

    let nextRoom: Room | null = null;

    try {
      nextRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
        },
      });
      const roomForAttempt = nextRoom;
      const refreshCurrentRoom = () => {
        if (roomRef.current === roomForAttempt) {
          refreshRoom();
        }
      };
      roomForAttempt
        .on(RoomEvent.ConnectionStateChanged, (state) => {
          if (roomRef.current !== roomForAttempt) {
            return;
          }

          setConnectionState(state);

          if (state === ConnectionState.Connected) {
            setError(null);
            setErrorDetail(null);
          }

          if (
            state === ConnectionState.Disconnected &&
            !intentionalDisconnectRef.current
          ) {
            setError((currentError) => currentError ?? "disconnected");
            setErrorDetail(
              (currentDetail) =>
                currentDetail ?? `Room ${roomForAttempt.name || roomId} disconnected.`
            );
          }
        })
        .on(RoomEvent.ParticipantConnected, refreshCurrentRoom)
        .on(RoomEvent.ParticipantDisconnected, refreshCurrentRoom)
        .on(RoomEvent.TrackSubscribed, refreshCurrentRoom)
        .on(RoomEvent.TrackUnsubscribed, refreshCurrentRoom)
        .on(RoomEvent.TrackMuted, refreshCurrentRoom)
        .on(RoomEvent.TrackUnmuted, refreshCurrentRoom)
        .on(RoomEvent.LocalTrackPublished, refreshCurrentRoom)
        .on(RoomEvent.LocalTrackUnpublished, refreshCurrentRoom)
        .on(RoomEvent.ParticipantNameChanged, refreshCurrentRoom)
        .on(RoomEvent.Disconnected, () => {
          if (roomRef.current === roomForAttempt) {
            roomRef.current = null;
            refreshRoom();
          }

          intentionalDisconnectRef.current = false;
        });

      roomRef.current = roomForAttempt;
      setConnectionState(ConnectionState.Connecting);

      const liveKitUrl = getLiveKitUrl();
      roomForAttempt.prepareConnection(liveKitUrl, token);
      await roomForAttempt.connect(liveKitUrl, token);

      if (!isCurrentJoinAttempt()) {
        disconnectRoom(roomForAttempt);
        return;
      }

      try {
        await roomForAttempt.startAudio();
      } catch {
        // Browser autoplay policies can block remote audio until a user gesture.
      }

      if (!isCurrentJoinAttempt()) {
        disconnectRoom(roomForAttempt);
        return;
      }

      const preferredMediaState = readMediaDeviceStatePreference(
        roomId,
        participantSession.id
      );

      try {
        await roomForAttempt.localParticipant.setCameraEnabled(
          preferredMediaState.cameraEnabled
        );
        setCameraEnabled(preferredMediaState.cameraEnabled);
        await roomForAttempt.localParticipant.setMicrophoneEnabled(
          preferredMediaState.microphoneEnabled
        );
        setMicEnabled(preferredMediaState.microphoneEnabled);

        if (!isCurrentJoinAttempt()) {
          disconnectRoom(roomForAttempt);
          return;
        }

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
      if (nextRoom) {
        disconnectRoom(nextRoom);
      }

      if (!isCurrentJoinAttempt()) {
        return;
      }

      setError("connect-failed");
      setErrorDetail(error instanceof Error ? error.message : null);
      setConnectionState(ConnectionState.Disconnected);
    } finally {
      if (activeJoinAttemptIdRef.current === joinAttemptId) {
        activeJoinAttemptIdRef.current = null;
        setIsJoining(false);
      }
    }
  }, [
    disconnectRoom,
    participantSession.id,
    participantSession.name,
    refreshRoom,
    roomId,
  ]);

  useEffect(() => {
    if (autoJoin !== true) {
      return;
    }

    if (
      hasAutoJoinAttemptedRef.current ||
      isConnected ||
      roomRef.current ||
      activeJoinAttemptIdRef.current !== null
    ) {
      return;
    }

    hasAutoJoinAttemptedRef.current = true;
    void joinMedia();
  }, [autoJoin, isConnected, joinMedia]);

  const leaveMedia = useCallback(async () => {
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
  }, [refreshRoom]);

  const toggleCamera = useCallback(async () => {
    const currentRoom = roomRef.current;

    if (!currentRoom) {
      return;
    }

    const nextValue = !cameraEnabled;

    try {
      await currentRoom.localParticipant.setCameraEnabled(nextValue);
      setCameraEnabled(nextValue);
      updateMediaDeviceStatePreference(roomId, participantSession.id, {
        cameraEnabled: nextValue,
      });
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
  }, [cameraEnabled, participantSession.id, refreshRoom, roomId]);

  const toggleMicrophone = useCallback(async () => {
    const currentRoom = roomRef.current;

    if (!currentRoom) {
      return;
    }

    const nextValue = !micEnabled;

    try {
      await currentRoom.localParticipant.setMicrophoneEnabled(nextValue);
      setMicEnabled(nextValue);
      updateMediaDeviceStatePreference(roomId, participantSession.id, {
        microphoneEnabled: nextValue,
      });
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
  }, [micEnabled, participantSession.id, refreshRoom, roomId]);

  return {
    cameraEnabled,
    connectionState,
    error,
    errorDetail,
    isConnected,
    isJoining,
    joinMedia,
    leaveMedia,
    micEnabled,
    participants,
    toggleCamera,
    toggleMicrophone,
  };
}

export type LiveKitMediaSession = ReturnType<typeof useLiveKitMediaSession>;
