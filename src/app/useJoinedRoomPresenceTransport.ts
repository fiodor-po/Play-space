import { useCallback, useEffect, useRef, useState } from "react";
import {
  createLocalParticipantPresence,
  createRoomOccupancy,
  type LocalParticipantSession,
  type ParticipantPresence,
  type ParticipantPresenceMap,
  type RoomOccupancyMap,
} from "../lib/roomSession";
import {
  createRoomPresenceConnection,
  type RoomPresenceConnection,
} from "../lib/roomPresenceRealtime";

type UseJoinedRoomPresenceTransportParams = {
  activeRoomId: string | null;
  isInRoom: boolean;
  participantSession: LocalParticipantSession | null;
  localParticipantPresence: ParticipantPresence | null;
  isForegroundPresenceCarrier: boolean;
};

export function useJoinedRoomPresenceTransport({
  activeRoomId,
  isInRoom,
  participantSession,
  localParticipantPresence,
  isForegroundPresenceCarrier,
}: UseJoinedRoomPresenceTransportParams) {
  const hasJoinedRoomPresenceTransport =
    isInRoom && !!activeRoomId && !!participantSession?.id;
  const [roomOccupancies, setRoomOccupancies] = useState<RoomOccupancyMap>({});
  const [participantPresences, setParticipantPresences] =
    useState<ParticipantPresenceMap>({});
  const roomPresenceConnectionRef = useRef<RoomPresenceConnection | null>(null);

  const disconnectJoinedRoomPresence = useCallback(() => {
    roomPresenceConnectionRef.current?.destroy();
    roomPresenceConnectionRef.current = null;
    setRoomOccupancies({});
    setParticipantPresences({});
  }, []);

  const publishJoinedRoomParticipantState = useCallback(
    (
      nextParticipantSession: LocalParticipantSession,
      nextLocalParticipantPresence: ParticipantPresence | null
    ) => {
      if (!isInRoom || !activeRoomId) {
        return;
      }

      const connection = roomPresenceConnectionRef.current;

      if (!connection) {
        return;
      }

      const basePresence =
        nextLocalParticipantPresence ??
        createLocalParticipantPresence(nextParticipantSession);

      connection.setLocalOccupancy(createRoomOccupancy(nextParticipantSession));
      connection.setLocalPresence(
        isForegroundPresenceCarrier
          ? basePresence
          : {
              ...basePresence,
              cursor: null,
            }
      );
    },
    [activeRoomId, isForegroundPresenceCarrier, isInRoom]
  );

  const syncJoinedRoomParticipantPresence = useCallback(
    (
      nextParticipantSession: LocalParticipantSession,
      nextLocalParticipantPresence: ParticipantPresence | null
    ) => {
      publishJoinedRoomParticipantState(
        nextParticipantSession,
        nextLocalParticipantPresence
      );
    },
    [publishJoinedRoomParticipantState]
  );

  useEffect(() => {
    if (!hasJoinedRoomPresenceTransport || !activeRoomId) {
      roomPresenceConnectionRef.current?.destroy();
      roomPresenceConnectionRef.current = null;
      return;
    }

    const connection = createRoomPresenceConnection({
      onOccupanciesChange: setRoomOccupancies,
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
  }, [activeRoomId, hasJoinedRoomPresenceTransport]);

  useEffect(() => {
    if (!isInRoom || !participantSession) {
      return;
    }

    publishJoinedRoomParticipantState(participantSession, localParticipantPresence);
  }, [
    isInRoom,
    localParticipantPresence,
    participantSession,
    publishJoinedRoomParticipantState,
  ]);

  return {
    participantPresences: hasJoinedRoomPresenceTransport ? participantPresences : {},
    roomOccupancies: hasJoinedRoomPresenceTransport ? roomOccupancies : {},
    disconnectJoinedRoomPresence,
    syncJoinedRoomParticipantPresence,
  };
}
