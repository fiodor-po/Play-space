import { LiveKitMediaBubbles } from "./LiveKitMediaBubbles";
import { LiveKitRemoteAudioHost } from "./LiveKitRemoteAudioHost";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  onUpdateParticipantSession: (
    updater: (session: LocalParticipantSession) => LocalParticipantSession
  ) => void;
};

export function LiveKitMediaLayer({
  onMediaStatusChange,
  onUpdateParticipantSession,
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
  const [resetVideoPositionsRevision, setResetVideoPositionsRevision] =
    useState(0);
  const resetVideoPositions = useCallback(() => {
    setResetVideoPositionsRevision((revision) => revision + 1);
  }, []);

  const mediaStatus = useMemo(
    () =>
      createLiveKitMediaStatusViewModel({
        mediaSession,
        onResetVideoPositions: resetVideoPositions,
        roomId,
      }),
    [
      mediaSession.connectionState,
      mediaSession.error,
      mediaSession.errorDetail,
      mediaSession.isConnected,
      mediaSession.isJoining,
      mediaSession.joinMedia,
      mediaSession.leaveMedia,
      resetVideoPositions,
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
        resetVideoPositionsRevision={resetVideoPositionsRevision}
        roomId={roomId}
        roomOccupancies={roomOccupancies}
        onUpdateParticipantSession={onUpdateParticipantSession}
      />
      <LiveKitRemoteAudioHost
        mediaSession={mediaSession}
        participantSession={participantSession}
      />
    </>
  );
}
