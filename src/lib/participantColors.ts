import type {
  LocalParticipantSession,
  ParticipantPresenceMap,
  RoomOccupancyMap,
} from "./roomSession";

type ResolveParticipantColorParams = {
  participantId: string | null | undefined;
  localParticipantSession: LocalParticipantSession;
  participantPresences: ParticipantPresenceMap;
  roomOccupancies: RoomOccupancyMap;
};

export function resolveCurrentParticipantColor({
  participantId,
  localParticipantSession,
  participantPresences,
  roomOccupancies,
}: ResolveParticipantColorParams) {
  if (!participantId) {
    return null;
  }

  if (participantId === localParticipantSession.id) {
    return localParticipantSession.color;
  }

  return (
    roomOccupancies[participantId]?.color ??
    participantPresences[participantId]?.color ??
    null
  );
}
