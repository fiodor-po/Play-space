import { useEffect, useRef, useState } from "react";
import {
  getRoomMemberRecord,
  loadRoomRecord,
} from "../lib/roomMetadata";
import { normalizeRoomId } from "../lib/roomId";
import { createRoomPresenceConnection } from "../lib/roomPresenceRealtime";
import {
  loadLocalParticipantSession,
  PARTICIPANT_COLOR_OPTIONS,
  type LocalParticipantSession,
  type ParticipantPresenceMap,
  type RoomOccupancyMap,
} from "../lib/roomSession";
import type {
  JoinClaim,
  JoinClaimMap,
  RoomPresenceConnection,
} from "../lib/roomPresenceRealtime";

const ENTRY_JOIN_FAILURE_CUE_MS = 4000;

export function loadParticipantDraftForRoom(roomId: string) {
  const savedSession = loadLocalParticipantSession(roomId);

  return {
    savedSession,
    draftName: savedSession?.name ?? "",
    draftColor: savedSession?.color ?? PARTICIPANT_COLOR_OPTIONS[0],
  };
}

const getOccupiedParticipantColors = (
  occupancies: RoomOccupancyMap,
  excludeParticipantId?: string
) => {
  return new Set(
    Object.values(occupancies)
      .filter((occupancy) => occupancy.participantId !== excludeParticipantId)
      .map((occupancy) => occupancy.color)
      .filter((color) => PARTICIPANT_COLOR_OPTIONS.includes(color))
  );
};

const getWinningJoinClaimsByColor = (
  claims: JoinClaimMap,
  occupancies: RoomOccupancyMap
) => {
  const occupiedParticipantIds = new Set(Object.keys(occupancies));
  const winningClaims: Record<string, JoinClaim> = {};

  Object.values(claims).forEach((claim) => {
    if (occupiedParticipantIds.has(claim.participantId)) {
      return;
    }

    const currentWinner = winningClaims[claim.color];

    if (!currentWinner) {
      winningClaims[claim.color] = claim;
      return;
    }

    if (
      claim.requestedAt < currentWinner.requestedAt ||
      (claim.requestedAt === currentWinner.requestedAt &&
        claim.participantId < currentWinner.participantId)
    ) {
      winningClaims[claim.color] = claim;
    }
  });

  return winningClaims;
};

const getEntryBlockedColors = (
  occupancies: RoomOccupancyMap,
  claims: JoinClaimMap,
  options?: {
    excludeJoinClaim?: JoinClaim | null;
  }
) => {
  const blockedColors = getOccupiedParticipantColors(occupancies);
  const winningClaims = getWinningJoinClaimsByColor(claims, occupancies);

  Object.entries(winningClaims).forEach(([color, claim]) => {
    const excludedJoinClaim = options?.excludeJoinClaim;
    const isExcludedJoinClaim =
      !!excludedJoinClaim &&
      claim.participantId === excludedJoinClaim.participantId &&
      claim.roomId === excludedJoinClaim.roomId &&
      claim.color === excludedJoinClaim.color &&
      claim.requestedAt === excludedJoinClaim.requestedAt &&
      claim.expiresAt === excludedJoinClaim.expiresAt;

    if (!isExcludedJoinClaim) {
      blockedColors.add(color);
    }
  });

  return blockedColors;
};

const getFirstFreeParticipantColor = (
  occupiedColors: Set<string>,
  preferredColors: Array<string | null | undefined>
) => {
  for (const preferredColor of preferredColors) {
    if (
      preferredColor &&
      PARTICIPANT_COLOR_OPTIONS.includes(preferredColor) &&
      !occupiedColors.has(preferredColor)
    ) {
      return preferredColor;
    }
  }

  return (
    PARTICIPANT_COLOR_OPTIONS.find((color) => !occupiedColors.has(color)) ?? null
  );
};

type UseEntryAvailabilityStateParams = {
  draftRoomId: string;
  draftColor: string;
  participantSession: LocalParticipantSession | null;
  setIsJoinPending: (isPending: boolean) => void;
  setDraftRoomId: (roomId: string) => void;
  setDraftName: (name: string) => void;
  setDraftColor: (color: string) => void;
};

export function useEntryAvailabilityState({
  draftRoomId,
  draftColor,
  participantSession,
  setIsJoinPending,
  setDraftRoomId,
  setDraftName,
  setDraftColor,
}: UseEntryAvailabilityStateParams) {
  const [entryRoomOccupancies, setEntryRoomOccupancies] = useState<RoomOccupancyMap>(
    {}
  );
  const [, setEntryParticipantPresences] = useState<ParticipantPresenceMap>({});
  const [entryJoinClaims, setEntryJoinClaims] = useState<JoinClaimMap>({});
  const [hasManualEntryColorChoice, setHasManualEntryColorChoice] = useState(false);
  const [entryJoinFailureMessage, setEntryJoinFailureMessage] = useState<string | null>(
    null
  );
  const [isEntryDebugOpen, setIsEntryDebugOpen] = useState(false);
  const [entryDebugOccupiedColors, setEntryDebugOccupiedColors] = useState<string[]>(
    []
  );
  const [entryDebugClaimColor, setEntryDebugClaimColor] = useState<string | null>(null);
  const entryPresenceConnectionRef = useRef<RoomPresenceConnection | null>(null);
  const entryRoomOccupanciesRef = useRef<RoomOccupancyMap>({});
  const entryJoinClaimsRef = useRef<JoinClaimMap>({});

  useEffect(() => {
    entryRoomOccupanciesRef.current = entryRoomOccupancies;
  }, [entryRoomOccupancies]);

  useEffect(() => {
    entryJoinClaimsRef.current = entryJoinClaims;
  }, [entryJoinClaims]);

  useEffect(() => {
    if (!entryJoinFailureMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setEntryJoinFailureMessage(null);
    }, ENTRY_JOIN_FAILURE_CUE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [entryJoinFailureMessage]);

  useEffect(() => {
    if (participantSession) {
      entryPresenceConnectionRef.current?.destroy();
      entryPresenceConnectionRef.current = null;
      return;
    }

    const entryRoomId = normalizeRoomId(draftRoomId);

    if (!entryRoomId) {
      entryPresenceConnectionRef.current?.destroy();
      entryPresenceConnectionRef.current = null;
      return;
    }

    const connection = createRoomPresenceConnection({
      onOccupanciesChange: setEntryRoomOccupancies,
      onPresencesChange: setEntryParticipantPresences,
      onJoinClaimsChange: setEntryJoinClaims,
      roomId: entryRoomId,
    });
    entryPresenceConnectionRef.current = connection;

    return () => {
      if (entryPresenceConnectionRef.current === connection) {
        entryPresenceConnectionRef.current = null;
      }

      connection.destroy();
    };
  }, [draftRoomId, participantSession, setIsJoinPending]);

  const entryRoomId = normalizeRoomId(draftRoomId);
  const entrySavedSession = !participantSession && entryRoomId
    ? loadLocalParticipantSession(entryRoomId)
    : null;
  const entryRoomRecord = !participantSession && entryRoomId
    ? loadRoomRecord(entryRoomId)
    : null;
  const returningRoomMember =
    entrySavedSession && entryRoomRecord
      ? getRoomMemberRecord(entryRoomRecord, entrySavedSession.id)
      : null;
  const entryOccupiedColors =
    !participantSession && entryRoomId
      ? getEntryBlockedColors(entryRoomOccupancies, entryJoinClaims)
      : new Set<string>();
  const effectiveEntryOccupiedColors = new Set(entryOccupiedColors);

  entryDebugOccupiedColors.forEach((color) => {
    if (PARTICIPANT_COLOR_OPTIONS.includes(color)) {
      effectiveEntryOccupiedColors.add(color);
    }
  });

  if (
    entryDebugClaimColor &&
    PARTICIPANT_COLOR_OPTIONS.includes(entryDebugClaimColor)
  ) {
    effectiveEntryOccupiedColors.add(entryDebugClaimColor);
  }

  const entryPreviousColor =
    returningRoomMember?.assignedColor ?? entrySavedSession?.color ?? null;
  const entrySuggestedColor = getFirstFreeParticipantColor(
    effectiveEntryOccupiedColors,
    [draftColor, entryPreviousColor, PARTICIPANT_COLOR_OPTIONS[0]]
  );
  const entryHasFreeColor = entrySuggestedColor !== null;
  const isDraftColorOccupied =
    draftColor.length > 0 && effectiveEntryOccupiedColors.has(draftColor);

  useEffect(() => {
    if (participantSession || !entrySuggestedColor) {
      return;
    }

    if (!hasManualEntryColorChoice && (!draftColor || isDraftColorOccupied)) {
      setDraftColor(entrySuggestedColor);
    }
  }, [
    draftColor,
    entrySuggestedColor,
    hasManualEntryColorChoice,
    isDraftColorOccupied,
    participantSession,
    setDraftColor,
  ]);

  return {
    returningRoomMember,
    effectiveEntryOccupiedColors,
    entryHasFreeColor,
    isDraftColorOccupied,
    isEntryDebugOpen,
    entryDebugOccupiedColors,
    entryDebugClaimColor,
    entryJoinFailureMessage,
    setEntryJoinFailureMessage,
    setIsEntryDebugOpen,
    handleDraftRoomIdChange(nextRoomId: string) {
      setDraftRoomId(nextRoomId);
      setIsJoinPending(false);
      setHasManualEntryColorChoice(false);
      setEntryJoinFailureMessage(null);

      const trimmedRoomId = normalizeRoomId(nextRoomId);

      if (!trimmedRoomId) {
        return;
      }

      const nextParticipantDraft = loadParticipantDraftForRoom(trimmedRoomId);

      if (!nextParticipantDraft.savedSession) {
        return;
      }

      setDraftName(nextParticipantDraft.draftName);
      setDraftColor(nextParticipantDraft.draftColor);
    },
    handleDraftColorChange(nextDraftColor: string) {
      setHasManualEntryColorChoice(true);
      setDraftColor(nextDraftColor);
    },
    toggleEntryDebugOccupiedColor(color: string) {
      setEntryDebugOccupiedColors((current) =>
        current.includes(color)
          ? current.filter((currentColor) => currentColor !== color)
          : [...current, color]
      );
    },
    setEntryDebugClaimColor,
    fillEntryDebugOccupiedColors() {
      setEntryDebugOccupiedColors([...PARTICIPANT_COLOR_OPTIONS]);
      setEntryDebugClaimColor(null);
    },
    clearEntryDebugOverrides() {
      setEntryDebugOccupiedColors([]);
      setEntryDebugClaimColor(null);
    },
    setLocalJoinClaim(joinClaim: JoinClaim | null) {
      entryPresenceConnectionRef.current?.setLocalJoinClaim(joinClaim);
    },
    destroyEntryPresenceConnection() {
      entryPresenceConnectionRef.current?.destroy();
      entryPresenceConnectionRef.current = null;
    },
    getCurrentBlockedColors(options?: { excludeJoinClaim?: JoinClaim | null }) {
      return getEntryBlockedColors(
        entryRoomOccupanciesRef.current,
        entryJoinClaimsRef.current,
        options
      );
    },
    getWinningJoinClaimForColor(color: string) {
      return (
        getWinningJoinClaimsByColor(
          entryJoinClaimsRef.current,
          entryRoomOccupanciesRef.current
        )[color] ?? null
      );
    },
  };
}
