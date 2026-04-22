import { useEffect, useRef } from "react";
import { Track, type Participant } from "livekit-client";
import type { LocalParticipantSession } from "../lib/roomSession";
import type { LiveKitMediaSession } from "./useLiveKitMediaSession";

type LiveKitRemoteAudioHostProps = {
  mediaSession: LiveKitMediaSession;
  participantSession: LocalParticipantSession;
};

type RemoteAudioElementProps = {
  participant: Participant;
};

function RemoteAudioElement({ participant }: RemoteAudioElementProps) {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioTrack =
    participant.getTrackPublication(Track.Source.Microphone)?.audioTrack ??
    null;

  useEffect(() => {
    const audioElement = audioElementRef.current;

    if (!audioElement || !audioTrack) {
      return;
    }

    audioTrack.attach(audioElement);

    return () => {
      audioTrack.detach(audioElement);
    };
  }, [audioTrack, participant.identity]);

  return <audio ref={audioElementRef} autoPlay playsInline />;
}

type RemoteAudioElementsProps = {
  localParticipantId: string;
  participants: Participant[];
};

function RemoteAudioElements({
  localParticipantId,
  participants,
}: RemoteAudioElementsProps) {
  const remoteParticipants = participants.filter(
    (participant) => participant.identity !== localParticipantId
  );

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        margin: -1,
        padding: 0,
        overflow: "hidden",
        clip: "rect(0 0 0 0)",
        whiteSpace: "nowrap",
      }}
    >
      {remoteParticipants.map((participant) => (
        <RemoteAudioElement key={participant.identity} participant={participant} />
      ))}
    </div>
  );
}

export function LiveKitRemoteAudioHost({
  mediaSession,
  participantSession,
}: LiveKitRemoteAudioHostProps) {
  return (
    <RemoteAudioElements
      localParticipantId={participantSession.id}
      participants={mediaSession.participants}
    />
  );
}
