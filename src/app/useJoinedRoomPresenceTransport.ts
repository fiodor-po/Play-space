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

  const syncJoinedRoomParticipantPresence = useCallback(
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

      connection.setLocalOccupancy(
        createRoomOccupancy(nextParticipantSession)
      );
      connection.setLocalPresence(
        isForegroundPresenceCarrier
          ? nextLocalParticipantPresence ??
              createLocalParticipantPresence(nextParticipantSession)
          : null
      );
    },
    [activeRoomId, isForegroundPresenceCarrier, isInRoom]
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

    const connection = roomPresenceConnectionRef.current;

    if (!connection) {
      return;
    }

    connection.setLocalOccupancy(createRoomOccupancy(participantSession));
  }, [isInRoom, participantSession]);

  useEffect(() => {
    if (!isInRoom || !participantSession) {
      return;
    }

    const connection = roomPresenceConnectionRef.current;

    if (!connection) {
      return;
    }

    connection.setLocalPresence(
      isForegroundPresenceCarrier
        ? localParticipantPresence ??
            createLocalParticipantPresence(participantSession)
        : null
    );
  }, [
    isForegroundPresenceCarrier,
    isInRoom,
    localParticipantPresence,
    participantSession,
  ]);

  return {
    participantPresences: hasJoinedRoomPresenceTransport ? participantPresences : {},
    roomOccupancies: hasJoinedRoomPresenceTransport ? roomOccupancies : {},
    disconnectJoinedRoomPresence,
    syncJoinedRoomParticipantPresence,
  };
}
