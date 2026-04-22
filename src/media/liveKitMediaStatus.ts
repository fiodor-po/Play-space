import { ConnectionState } from "livekit-client";
import type {
  LiveKitMediaSession,
  LiveKitMediaSessionError,
} from "./useLiveKitMediaSession";

export type LiveKitMediaStatusViewModel = {
  error: LiveKitMediaSessionError | null;
  mediaErrorDetail: string | null;
  mediaErrorLabel: string | null;
  mediaStatusLabel: string;
  isMediaConnected: boolean;
  isMediaJoining: boolean;
  canJoinMedia: boolean;
  canLeaveMedia: boolean;
  onJoinMedia: () => void;
  onLeaveMedia: () => void;
};

export function getLiveKitMediaErrorLabel(
  error: LiveKitMediaSessionError | null
) {
  return error === "media-disabled"
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
}

export function createLiveKitMediaStatusViewModel(params: {
  mediaSession: LiveKitMediaSession;
  roomId: string;
}): LiveKitMediaStatusViewModel {
  const { mediaSession, roomId } = params;
  const mediaErrorLabel = getLiveKitMediaErrorLabel(mediaSession.error);
  const mediaStatusLabel =
    mediaSession.error === "media-disabled"
      ? `Media unavailable for ${roomId}`
      : mediaSession.connectionState === ConnectionState.Connected
        ? `Connected to ${roomId}`
        : mediaSession.connectionState === ConnectionState.Connecting ||
            mediaSession.isJoining
          ? `Connecting to ${roomId}`
          : `Optional media for ${roomId}`;

  return {
    error: mediaSession.error,
    mediaErrorDetail: mediaSession.errorDetail,
    mediaErrorLabel,
    mediaStatusLabel,
    isMediaConnected: mediaSession.isConnected,
    isMediaJoining: mediaSession.isJoining,
    canJoinMedia:
      !mediaSession.isConnected && mediaSession.error !== "media-disabled",
    canLeaveMedia: mediaSession.isConnected,
    onJoinMedia: mediaSession.joinMedia,
    onLeaveMedia: mediaSession.leaveMedia,
  };
}
