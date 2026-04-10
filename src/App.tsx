import { useEffect, useRef, useState } from "react";
import BoardStage from "./components/BoardStage";
import { DiceSpikeOverlay } from "./dice/DiceSpikeOverlay";
import { LiveKitMediaDock } from "./media/LiveKitMediaDock";
import { HTML_UI_FONT_FAMILY } from "./board/constants";
import {
  createRoomGovernedEntityRef,
  resolveGovernedEntityAccess,
} from "./lib/governance";
import {
  clearActiveParticipantRoomSession,
  clearActiveRoomId,
  createLocalParticipantPresence,
  getOrCreateBrowserParticipantId,
  getRoomIdFromLocation,
  loadActiveParticipantRoomSession,
  loadActiveRoomId,
  loadLocalParticipantSession,
  PARTICIPANT_COLOR_OPTIONS,
  saveActiveParticipantRoomSession,
  saveActiveRoomId,
  saveLocalParticipantSession,
  subscribeToActiveParticipantRoomSession,
} from "./lib/roomSession";
import {
  createRoomBaselineDescriptor,
  ensureRoomMemberRegistered,
  ensureRoomRecordInitialized,
  getRoomMemberRecord,
  loadRoomRecord,
  markRoomBaselineApplied,
} from "./lib/roomMetadata";
import { createRoomPresenceConnection } from "./lib/roomPresenceRealtime";
import { isLiveKitMediaEnabled, logClientRuntimeConfig } from "./lib/runtimeConfig";
import type { FormEvent } from "react";
import type {
  LocalParticipantSession,
  ParticipantPresence,
  ParticipantPresenceMap,
} from "./lib/roomSession";
import type { RoomBaselineDescriptor, RoomRecord } from "./lib/roomMetadata";
import type {
  JoinClaim,
  JoinClaimMap,
  RoomPresenceConnection,
} from "./lib/roomPresenceRealtime";

const ENTRY_SCREEN_VERSION_LABEL = "alpha v0.0.0";
const DEFAULT_ROOM_BASELINE_DESCRIPTOR: RoomBaselineDescriptor =
  createRoomBaselineDescriptor({
    baselineId: "public-demo-v1",
  });
const JOIN_CLAIM_TTL_MS = 5000;
const JOIN_CLAIM_SETTLE_MS = 220;

function loadParticipantDraftForRoom(roomId: string) {
  const savedSession = loadLocalParticipantSession(roomId);

  return {
    savedSession,
    draftName: savedSession?.name ?? "",
    draftColor: savedSession?.color ?? PARTICIPANT_COLOR_OPTIONS[0],
  };
}

function getIsForegroundPresenceCarrier() {
  return !document.hidden && document.hasFocus();
}

export default function App() {
  const liveKitMediaEnabled = isLiveKitMediaEnabled();
  const browserParticipantId = getOrCreateBrowserParticipantId();
  const initialSharedActiveRoomSession =
    loadActiveParticipantRoomSession(browserParticipantId);
  const initialActiveRoomId =
    initialSharedActiveRoomSession?.roomId ?? loadActiveRoomId();
  const initialDraftRoomId =
    initialActiveRoomId ?? getRoomIdFromLocation(window.location);
  const initialParticipantDraft = loadParticipantDraftForRoom(initialDraftRoomId);
  const shouldRestoreJoinedRoom =
    !!initialActiveRoomId && !!initialParticipantDraft.savedSession;

  const [draftRoomId, setDraftRoomId] = useState(initialDraftRoomId);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() =>
    shouldRestoreJoinedRoom ? initialDraftRoomId : null
  );
  const [isInRoom, setIsInRoom] = useState(() => shouldRestoreJoinedRoom);
  const [participantSession, setParticipantSession] =
    useState<LocalParticipantSession | null>(() =>
      shouldRestoreJoinedRoom ? initialParticipantDraft.savedSession : null
    );
  const [participantPresences, setParticipantPresences] =
    useState<ParticipantPresenceMap>({});
  const [localParticipantPresence, setLocalParticipantPresence] =
    useState<ParticipantPresence | null>(() => {
      const session = shouldRestoreJoinedRoom
        ? initialParticipantDraft.savedSession
        : null;
      return session ? createLocalParticipantPresence(session) : null;
    });
  const [roomRecord, setRoomRecord] = useState<RoomRecord | null>(() =>
    shouldRestoreJoinedRoom ? loadRoomRecord(initialDraftRoomId) : null
  );
  const [draftName, setDraftName] = useState(initialParticipantDraft.draftName);
  const [draftColor, setDraftColor] = useState(initialParticipantDraft.draftColor);
  const [entryParticipantPresences, setEntryParticipantPresences] =
    useState<ParticipantPresenceMap>({});
  const [entryJoinClaims, setEntryJoinClaims] = useState<JoinClaimMap>({});
  const [hasManualEntryColorChoice, setHasManualEntryColorChoice] = useState(false);
  const [isJoinPending, setIsJoinPending] = useState(false);
  const [isForegroundPresenceCarrier, setIsForegroundPresenceCarrier] = useState(() =>
    getIsForegroundPresenceCarrier()
  );
  const entryPresenceConnectionRef = useRef<RoomPresenceConnection | null>(null);
  const roomPresenceConnectionRef = useRef<RoomPresenceConnection | null>(null);
  const entryParticipantPresencesRef = useRef<ParticipantPresenceMap>({});
  const entryJoinClaimsRef = useRef<JoinClaimMap>({});

  const ensureInitializedRoomRecord = (roomId: string, creatorId: string) => {
    return ensureRoomRecordInitialized({
      roomId,
      creatorId,
      baseline: DEFAULT_ROOM_BASELINE_DESCRIPTOR,
    });
  };

  const rememberRoomMemberState = (
    roomId: string,
    session: LocalParticipantSession
  ) => {
    const initializedRoomRecord = ensureInitializedRoomRecord(roomId, session.id);
    return (
      ensureRoomMemberRegistered({
        roomId,
        participantId: session.id,
        displayName: session.name,
        assignedColor: session.color,
      }) ?? initializedRoomRecord
    );
  };

  const getOccupiedParticipantColors = (
    presences: ParticipantPresenceMap,
    excludeParticipantId?: string
  ) => {
    return new Set(
      Object.values(presences)
        .filter((presence) => presence.participantId !== excludeParticipantId)
        .map((presence) => presence.color)
        .filter((color) => PARTICIPANT_COLOR_OPTIONS.includes(color))
    );
  };

  const getWinningJoinClaimsByColor = (
    claims: JoinClaimMap,
    presences: ParticipantPresenceMap
  ) => {
    const activeParticipantIds = new Set(Object.keys(presences));
    const winningClaims: Record<string, JoinClaim> = {};

    Object.values(claims).forEach((claim) => {
      if (activeParticipantIds.has(claim.participantId)) {
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
    presences: ParticipantPresenceMap,
    claims: JoinClaimMap,
    participantId?: string
  ) => {
    const blockedColors = getOccupiedParticipantColors(presences, participantId);
    const winningClaims = getWinningJoinClaimsByColor(claims, presences);

    Object.entries(winningClaims).forEach(([color, claim]) => {
      if (claim.participantId !== participantId) {
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

  const handleRoomBaselineApplied = (
    baselineId: RoomBaselineDescriptor["baselineId"]
  ) => {
    if (!activeRoomId) {
      return;
    }

    const nextRoomRecord = markRoomBaselineApplied({
      roomId: activeRoomId,
      baselineId,
    });

    if (nextRoomRecord) {
      setRoomRecord(nextRoomRecord);
    }
  };

  const collapseToEntryScreen = (nextDraftRoomId: string) => {
    roomPresenceConnectionRef.current?.destroy();
    roomPresenceConnectionRef.current = null;

    clearActiveRoomId();
    setDraftRoomId(nextDraftRoomId);
    setDraftName(participantSession?.name ?? draftName);
    setDraftColor(participantSession?.color ?? draftColor);
    setActiveRoomId(null);
    setIsInRoom(false);
    setParticipantSession(null);
    setLocalParticipantPresence(null);
    setParticipantPresences({});
    setRoomRecord(null);
  };

  useEffect(() => {
    const handlePopState = () => {
      if (isInRoom) {
        return;
      }

      const nextRoomId = getRoomIdFromLocation(window.location);
      const nextParticipantDraft = loadParticipantDraftForRoom(nextRoomId);

      setDraftRoomId(nextRoomId);
      setDraftName(nextParticipantDraft.draftName);
      setDraftColor(nextParticipantDraft.draftColor);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isInRoom]);

  useEffect(() => {
    logClientRuntimeConfig(isInRoom ? activeRoomId ?? draftRoomId : draftRoomId);
  }, [activeRoomId, draftRoomId, isInRoom]);

  useEffect(() => {
    const syncForegroundPresenceCarrier = () => {
      setIsForegroundPresenceCarrier(getIsForegroundPresenceCarrier());
    };

    document.addEventListener("visibilitychange", syncForegroundPresenceCarrier);
    window.addEventListener("focus", syncForegroundPresenceCarrier);
    window.addEventListener("blur", syncForegroundPresenceCarrier);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        syncForegroundPresenceCarrier
      );
      window.removeEventListener("focus", syncForegroundPresenceCarrier);
      window.removeEventListener("blur", syncForegroundPresenceCarrier);
    };
  }, []);

  useEffect(() => {
    entryParticipantPresencesRef.current = entryParticipantPresences;
  }, [entryParticipantPresences]);

  useEffect(() => {
    entryJoinClaimsRef.current = entryJoinClaims;
  }, [entryJoinClaims]);

  useEffect(() => {
    if (participantSession || !draftRoomId.trim()) {
      entryPresenceConnectionRef.current?.destroy();
      entryPresenceConnectionRef.current = null;
      setEntryParticipantPresences({});
      setEntryJoinClaims({});
      setIsJoinPending(false);
      return;
    }

    const entryRoomId = draftRoomId.trim();
    const connection = createRoomPresenceConnection({
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
  }, [draftRoomId, participantSession]);

  useEffect(() => {
    if (participantSession || !draftRoomId.trim()) {
      return;
    }
    setHasManualEntryColorChoice(false);
  }, [draftRoomId, participantSession]);

  useEffect(() => {
    if (!isInRoom || !activeRoomId) {
      setRoomRecord(null);
      setParticipantPresences({});
      return;
    }

    const nextSession = loadLocalParticipantSession(activeRoomId);
    if (!nextSession) {
      setParticipantSession(null);
      setRoomRecord(loadRoomRecord(activeRoomId));
      setLocalParticipantPresence(null);
      setParticipantPresences({});
      return;
    }

    saveActiveParticipantRoomSession({
      participantId: nextSession.id,
      roomId: activeRoomId,
    });
    setDraftName(nextSession.name);
    setDraftColor(nextSession.color);
    setParticipantSession(nextSession);
    setRoomRecord(rememberRoomMemberState(activeRoomId, nextSession));
    setLocalParticipantPresence(
      createLocalParticipantPresence(nextSession)
    );
    setParticipantPresences({});
  }, [activeRoomId, isInRoom]);

  useEffect(() => {
    return subscribeToActiveParticipantRoomSession(
      browserParticipantId,
      (nextActiveRoomSession) => {
        if (nextActiveRoomSession?.roomId) {
          if (isInRoom && activeRoomId === nextActiveRoomSession.roomId) {
            return;
          }

          setDraftRoomId(nextActiveRoomSession.roomId);
          setActiveRoomId(nextActiveRoomSession.roomId);
          setIsInRoom(true);
          return;
        }

        if (!isInRoom && !activeRoomId) {
          return;
        }

        collapseToEntryScreen(activeRoomId ?? draftRoomId);
      }
    );
  }, [activeRoomId, browserParticipantId, draftRoomId, draftColor, draftName, isInRoom, participantSession]);

  const joinRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedRoomId = draftRoomId.trim();
    const trimmedName = draftName.trim();

    if (!trimmedRoomId || !trimmedName) {
      return;
    }

    if (isJoinPending) {
      return;
    }

    const savedSession = loadLocalParticipantSession(trimmedRoomId);
    const nextSessionDraft: LocalParticipantSession = {
      id: savedSession?.id ?? getOrCreateBrowserParticipantId(),
      name: trimmedName,
      color: draftColor,
    };
    const blockedColors = getEntryBlockedColors(
      entryParticipantPresencesRef.current,
      entryJoinClaimsRef.current,
      nextSessionDraft.id
    );

    if (
      blockedColors.size >= PARTICIPANT_COLOR_OPTIONS.length ||
      blockedColors.has(draftColor)
    ) {
      return;
    }

    const joinClaim: JoinClaim = {
      participantId: nextSessionDraft.id,
      roomId: trimmedRoomId,
      color: draftColor,
      requestedAt: Date.now(),
      expiresAt: Date.now() + JOIN_CLAIM_TTL_MS,
    };

    const finalizeJoin = async () => {
      setIsJoinPending(true);
      entryPresenceConnectionRef.current?.setLocalJoinClaim(joinClaim);

      await new Promise((resolve) => {
        window.setTimeout(resolve, JOIN_CLAIM_SETTLE_MS);
      });

      const latestPresences = entryParticipantPresencesRef.current;
      const latestClaims = entryJoinClaimsRef.current;
      const latestBlockedColors = getEntryBlockedColors(
        latestPresences,
        latestClaims,
        nextSessionDraft.id
      );
      const winningClaim =
        getWinningJoinClaimsByColor(latestClaims, latestPresences)[draftColor] ?? null;

      if (
        latestBlockedColors.size >= PARTICIPANT_COLOR_OPTIONS.length ||
        latestBlockedColors.has(draftColor) ||
        (winningClaim && winningClaim.participantId !== nextSessionDraft.id)
      ) {
        entryPresenceConnectionRef.current?.setLocalJoinClaim(null);
        setIsJoinPending(false);
        return;
      }

      const nextSession: LocalParticipantSession = {
        ...nextSessionDraft,
        color: draftColor,
      };

      entryPresenceConnectionRef.current?.setLocalJoinClaim(null);
      entryPresenceConnectionRef.current?.destroy();
      entryPresenceConnectionRef.current = null;

      saveLocalParticipantSession(trimmedRoomId, nextSession);
      saveActiveRoomId(trimmedRoomId);
      saveActiveParticipantRoomSession({
        participantId: nextSession.id,
        roomId: trimmedRoomId,
      });
      if (getRoomIdFromLocation(window.location) !== trimmedRoomId) {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("room", trimmedRoomId);
        window.history.pushState({}, "", nextUrl);
      }

      setDraftRoomId(trimmedRoomId);
      setDraftName(nextSession.name);
      setDraftColor(nextSession.color);
      setActiveRoomId(trimmedRoomId);
      setIsInRoom(true);
      setRoomRecord(rememberRoomMemberState(trimmedRoomId, nextSession));
      setParticipantSession(nextSession);
      setLocalParticipantPresence(createLocalParticipantPresence(nextSession));
      setIsJoinPending(false);
    };

    void finalizeJoin();
  };

  const updateParticipantSession = (updater: (session: LocalParticipantSession) => LocalParticipantSession) => {
    setParticipantSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      const participantId = currentSession.id;
      const draftSession = updater(currentSession);
      const nextRoomId = activeRoomId;

      if (!nextRoomId) {
        return currentSession;
      }

      const occupiedColors = getOccupiedParticipantColors(
        participantPresences,
        currentSession.id
      );
      if (
        draftSession.color !== currentSession.color &&
        occupiedColors.has(draftSession.color)
      ) {
        return currentSession;
      }

      const nextSession: LocalParticipantSession = {
        ...draftSession,
        color: draftSession.color,
      };

      saveLocalParticipantSession(nextRoomId, nextSession);
      setRoomRecord(rememberRoomMemberState(nextRoomId, nextSession));
      setDraftName(nextSession.name);
      setDraftColor(nextSession.color);
      setLocalParticipantPresence((currentPresence) =>
        currentPresence
          ? {
              ...currentPresence,
              participantId,
              name: nextSession.name,
              color: nextSession.color,
            }
          : {
              ...createLocalParticipantPresence(nextSession),
              participantId,
            }
      );
      return nextSession;
    });
  };

  const leaveRoom = () => {
    if (!activeRoomId) {
      return;
    }

    if (participantSession?.id) {
      clearActiveParticipantRoomSession(participantSession.id);
    }

    collapseToEntryScreen(activeRoomId);
  };

  useEffect(() => {
    if (!isInRoom || !activeRoomId || !participantSession?.id) {
      roomPresenceConnectionRef.current?.destroy();
      roomPresenceConnectionRef.current = null;
      setParticipantPresences({});
      return;
    }

    const connection = createRoomPresenceConnection({
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
  }, [activeRoomId, isInRoom, participantSession?.id]);

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
        ? localParticipantPresence ?? createLocalParticipantPresence(participantSession)
        : null
    );
  }, [isForegroundPresenceCarrier, localParticipantPresence, participantSession]);

  const joinedRoomId = activeRoomId ?? draftRoomId;
  const roomGovernedEntity = createRoomGovernedEntityRef({
    roomId: joinedRoomId,
    creatorId: roomRecord?.creatorId ?? null,
  });
  const roomEffectiveAccess = resolveGovernedEntityAccess({
    entity: roomGovernedEntity,
    participantId: participantSession?.id ?? null,
    defaultAccessLevel: "full",
  });
  const roomEffectiveAccessLevel = roomEffectiveAccess?.accessLevel ?? "none";
  const roomCreatorId = roomRecord?.creatorId ?? null;
  const isCurrentParticipantRoomCreator =
    !!roomCreatorId && roomCreatorId === participantSession?.id;
  const roomCreatorName =
    roomCreatorId && !isCurrentParticipantRoomCreator
      ? participantPresences[roomCreatorId]?.name ?? null
      : null;
  const roomBaselineToApply =
    roomRecord?.initializedBaselineId &&
    roomRecord.initializedBaselineId !== "empty" &&
    roomRecord.appliedBaselineId !== roomRecord.initializedBaselineId
      ? createRoomBaselineDescriptor({
          baselineId: roomRecord.initializedBaselineId,
        })
      : null;
  const entryRoomId = draftRoomId.trim();
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
  const entryOccupiedColors = getEntryBlockedColors(
    entryParticipantPresences,
    entryJoinClaims,
    entrySavedSession?.id
  );
  const entryPreviousColor = returningRoomMember?.assignedColor ?? entrySavedSession?.color ?? null;
  const entrySuggestedColor = getFirstFreeParticipantColor(entryOccupiedColors, [
    draftColor,
    entryPreviousColor,
    PARTICIPANT_COLOR_OPTIONS[0],
  ]);
  const entryHasFreeColor = entrySuggestedColor !== null;
  const isDraftColorOccupied = draftColor.length > 0 && entryOccupiedColors.has(draftColor);

  useEffect(() => {
    if (participantSession) {
      return;
    }

    if (!entrySuggestedColor) {
      return;
    }

    if (!hasManualEntryColorChoice && (!draftColor || isDraftColorOccupied)) {
      setDraftColor(entrySuggestedColor);
    }
  }, [
    draftColor,
    hasManualEntryColorChoice,
    entrySuggestedColor,
    isDraftColorOccupied,
    participantSession,
  ]);

  if (!participantSession) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "radial-gradient(circle at top, #15314b 0%, #081226 50%, #020617 100%)",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            display: "grid",
            gap: 18,
            fontFamily: HTML_UI_FONT_FAMILY,
          }}
        >
          <div
            style={{
              position: "relative",
              display: "grid",
              gap: 6,
              color: "#e2e8f0",
              width: "100%",
              maxWidth: 420,
              paddingInline: 4,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 4,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#94a3b8",
              }}
            >
              {ENTRY_SCREEN_VERSION_LABEL}
            </div>
            <div
              style={{
                justifySelf: "center",
                textAlign: "center",
                fontSize: 52,
                lineHeight: 0.94,
                fontWeight: 800,
                letterSpacing: "-0.055em",
                color: "#f8fafc",
              }}
            >
              otheЯRoom
            </div>
          </div>

          <form
            onSubmit={joinRoom}
            style={{
              display: "grid",
              gap: 16,
              padding: 24,
              borderRadius: 20,
              background: "rgba(15, 23, 42, 0.88)",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              color: "#e2e8f0",
              boxShadow: "0 24px 80px rgba(2, 6, 23, 0.55)",
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 14, color: "#94a3b8" }}>Room</div>
              <input
                value={draftRoomId}
                onChange={(event) => {
                  const nextRoomId = event.target.value;
                  setDraftRoomId(nextRoomId);

                  const trimmedRoomId = nextRoomId.trim();

                  if (!trimmedRoomId) {
                    return;
                  }

                  setHasManualEntryColorChoice(false);

                  const nextParticipantDraft =
                    loadParticipantDraftForRoom(trimmedRoomId);

                  if (!nextParticipantDraft.savedSession) {
                    return;
                  }

                  setDraftName(nextParticipantDraft.draftName);
                  setDraftColor(nextParticipantDraft.draftColor);
                }}
                placeholder="Room name"
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                  background: "rgba(15, 23, 42, 0.9)",
                  color: "#f8fafc",
                  fontSize: 16,
                  fontWeight: 400,
                }}
              />
            </div>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 14, color: "#cbd5e1" }}>Player</span>
              <input
                value={draftName}
                onChange={(event) => {
                  setDraftName(event.target.value);
                }}
                placeholder="Your name"
                autoFocus
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                  background: "rgba(15, 23, 42, 0.9)",
                  color: "#f8fafc",
                  fontSize: 16,
                }}
              />
            </label>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 14, color: "#cbd5e1" }}>Color</div>
              <div style={{ display: "grid", gap: 8 }}>
                {returningRoomMember ? (
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    Previous room color is remembered and preselected when it is free.
                  </div>
                ) : null}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {PARTICIPANT_COLOR_OPTIONS.map((color) => {
                    const isSelected = color === draftColor;
                    const isOccupied = entryOccupiedColors.has(color);

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setHasManualEntryColorChoice(true);
                          setDraftColor(color);
                        }}
                        disabled={isOccupied || isJoinPending}
                        aria-label={`Select color ${color}${isOccupied ? " (currently occupied)" : ""}`}
                        title={
                          isOccupied ? "Currently occupied by an active participant" : undefined
                        }
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 999,
                          border: isSelected
                            ? "3px solid #f8fafc"
                            : isOccupied
                              ? "2px dashed rgba(148, 163, 184, 0.65)"
                              : "2px solid rgba(255, 255, 255, 0.2)",
                          background: color,
                          cursor:
                            isOccupied || isJoinPending ? "not-allowed" : "pointer",
                          opacity: isOccupied ? 0.45 : isJoinPending ? 0.75 : 1,
                        }}
                      />
                    );
                  })}
                </div>
                {entryHasFreeColor ? (
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    Dashed swatches are currently occupied by active participants or active join claims.
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#fda4af" }}>
                    All 8 participant colors are currently occupied. This room is full right now.
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={
                !draftRoomId.trim() ||
                !draftName.trim() ||
                !entryHasFreeColor ||
                isDraftColorOccupied ||
                isJoinPending
              }
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                background: draftColor,
                color: "#f8fafc",
                fontSize: 16,
                fontWeight: 700,
                cursor:
                  draftRoomId.trim() &&
                  draftName.trim() &&
                  entryHasFreeColor &&
                  !isDraftColorOccupied &&
                  !isJoinPending
                    ? "pointer"
                    : "not-allowed",
                opacity:
                  draftRoomId.trim() &&
                  draftName.trim() &&
                  entryHasFreeColor &&
                  !isDraftColorOccupied &&
                  !isJoinPending
                    ? 1
                    : 0.6,
              }}
            >
              {isJoinPending ? "Joining..." : "Join room"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <BoardStage
        key={joinedRoomId}
        participantSession={participantSession}
        participantPresences={participantPresences}
        roomId={joinedRoomId}
        isCurrentParticipantRoomCreator={isCurrentParticipantRoomCreator}
        roomCreatorName={roomCreatorName}
        roomCreatorId={roomCreatorId}
        roomBaselineToApply={roomBaselineToApply}
        roomEffectiveAccessLevel={roomEffectiveAccessLevel}
        onLeaveRoom={leaveRoom}
        onRoomBaselineApplied={handleRoomBaselineApplied}
        onUpdateParticipantSession={updateParticipantSession}
        onUpdateLocalPresence={(updater) => {
          setLocalParticipantPresence((currentPresence) =>
            updater(
              currentPresence ?? createLocalParticipantPresence(participantSession)
            )
          );
        }}
      />
      <DiceSpikeOverlay roomId={joinedRoomId} participantSession={participantSession} />
      {liveKitMediaEnabled ? (
        <LiveKitMediaDock roomId={joinedRoomId} participantSession={participantSession} />
      ) : null}
    </>
  );
}
