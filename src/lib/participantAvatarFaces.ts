export const PARTICIPANT_AVATAR_FACE_IDS = [
  "mood-smile",
  "mood-happy",
  "mood-crazy-happy",
  "mood-wink",
  "mood-tongue",
  "mood-nerd",
  "mood-boy",
  "mood-xd",
  "ghost",
  "mood-kid",
  "mood-surprised",
  "mood-confuzed",
  "mood-puzzled",
  "mood-sad",
  "mood-angry",
  "mood-sick",
] as const;

export type ParticipantAvatarFaceId =
  (typeof PARTICIPANT_AVATAR_FACE_IDS)[number];

type ParticipantAvatarFaceAppearanceMap = Record<
  string,
  {
    avatarFaceId?: unknown;
  }
>;

const PARTICIPANT_AVATAR_FACE_ID_SET = new Set<string>(
  PARTICIPANT_AVATAR_FACE_IDS
);

export function isParticipantAvatarFaceId(
  value: unknown
): value is ParticipantAvatarFaceId {
  return (
    typeof value === "string" && PARTICIPANT_AVATAR_FACE_ID_SET.has(value)
  );
}

export function pickUnusedParticipantAvatarFaceId(
  existingAppearanceMap: ParticipantAvatarFaceAppearanceMap,
  participantId: string
): ParticipantAvatarFaceId {
  const currentFaceId = existingAppearanceMap[participantId]?.avatarFaceId;

  if (isParticipantAvatarFaceId(currentFaceId)) {
    return currentFaceId;
  }

  const usedFaceIds = new Set<ParticipantAvatarFaceId>();

  Object.entries(existingAppearanceMap).forEach(
    ([appearanceParticipantId, appearance]) => {
      if (appearanceParticipantId === participantId) {
        return;
      }

      if (isParticipantAvatarFaceId(appearance.avatarFaceId)) {
        usedFaceIds.add(appearance.avatarFaceId);
      }
    }
  );

  const unusedFaceIds = PARTICIPANT_AVATAR_FACE_IDS.filter(
    (faceId) => !usedFaceIds.has(faceId)
  );
  const candidatePool =
    unusedFaceIds.length > 0 ? unusedFaceIds : PARTICIPANT_AVATAR_FACE_IDS;

  if (unusedFaceIds.length === 0) {
    console.warn("[participant-avatar-face][pool-exhausted]", {
      participantId,
      poolSize: PARTICIPANT_AVATAR_FACE_IDS.length,
    });
  }

  return candidatePool[Math.floor(Math.random() * candidatePool.length)];
}
