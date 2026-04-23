import type {
  LiveKitMediaSession,
  LiveKitMediaSessionError,
} from "./useLiveKitMediaSession";

export type LiveKitMediaStatusViewModel = {
  cameraEnabled: boolean;
  connectionState: string;
  enabled: boolean;
  error: LiveKitMediaSessionError | null;
  micEnabled: boolean;
  mediaErrorDetail: string | null;
  mediaErrorLabel: string | null;
  isMediaConnected: boolean;
  isMediaJoining: boolean;
  canJoinMedia: boolean;
  canLeaveMedia: boolean;
  onJoinMedia: () => void;
  onLeaveMedia: () => void;
  onResetVideoPositions: () => void;
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
  onResetVideoPositions: () => void;
  roomId: string;
}): LiveKitMediaStatusViewModel {
  const { mediaSession, onResetVideoPositions } = params;
  const mediaErrorLabel = getLiveKitMediaErrorLabel(mediaSession.error);

  return {
    cameraEnabled: mediaSession.cameraEnabled,
    connectionState: String(mediaSession.connectionState),
    enabled: true,
    error: mediaSession.error,
    micEnabled: mediaSession.micEnabled,
    mediaErrorDetail: mediaSession.errorDetail,
    mediaErrorLabel,
    isMediaConnected: mediaSession.isConnected,
    isMediaJoining: mediaSession.isJoining,
    canJoinMedia:
      !mediaSession.isConnected && mediaSession.error !== "media-disabled",
    canLeaveMedia: mediaSession.isConnected,
    onJoinMedia: mediaSession.joinMedia,
    onLeaveMedia: mediaSession.leaveMedia,
    onResetVideoPositions,
  };
}
