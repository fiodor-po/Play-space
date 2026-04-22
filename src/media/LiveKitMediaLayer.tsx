import { LiveKitMediaBubbles } from "./LiveKitMediaBubbles";
import { LiveKitRemoteAudioHost } from "./LiveKitRemoteAudioHost";
import { useEffect, useMemo } from "react";
import type {
  LocalParticipantSession,
  ParticipantPresenceMap,
  RoomOccupancyMap,
} from "../lib/roomSession";
import { useLiveKitMediaSession } from "./useLiveKitMediaSession";
import {
  createLiveKitMediaStatusViewModel,
  type LiveKitMediaStatusViewModel,
} from "./liveKitMediaStatus";
import { isFakeMicrophoneLevelEnabled } from "./mediaDiagnostics";

type LiveKitMediaLayerProps = {
  participantPresences: ParticipantPresenceMap;
  participantSession: LocalParticipantSession;
  roomId: string;
  roomOccupancies: RoomOccupancyMap;
  onMediaStatusChange: (status: LiveKitMediaStatusViewModel | null) => void;
};

export function LiveKitMediaLayer({
  onMediaStatusChange,
  participantPresences,
  participantSession,
  roomId,
  roomOccupancies,
}: LiveKitMediaLayerProps) {
  const mediaSession = useLiveKitMediaSession({
    autoJoin: !isFakeMicrophoneLevelEnabled(),
    roomId,
    participantSession,
  });

  const mediaStatus = useMemo(
    () =>
      createLiveKitMediaStatusViewModel({
        mediaSession,
        roomId,
      }),
    [
      mediaSession.connectionState,
      mediaSession.error,
      mediaSession.errorDetail,
      mediaSession.isConnected,
      mediaSession.isJoining,
      mediaSession.joinMedia,
      roomId,
    ]
  );

  useEffect(() => {
    onMediaStatusChange(mediaStatus);
  }, [mediaStatus, onMediaStatusChange]);

  useEffect(() => {
    return () => {
      onMediaStatusChange(null);
    };
  }, [onMediaStatusChange]);

  return (
    <>
      <LiveKitMediaBubbles
        mediaSession={mediaSession}
        participantPresences={participantPresences}
        participantSession={participantSession}
        roomId={roomId}
        roomOccupancies={roomOccupancies}
      />
      <LiveKitRemoteAudioHost
        mediaSession={mediaSession}
        participantSession={participantSession}
      />
    </>
  );
}
