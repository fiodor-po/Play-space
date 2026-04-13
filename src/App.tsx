import { useEffect, useRef, useState } from "react";
import BoardStage from "./components/BoardStage";
import { DiceSpikeOverlay } from "./dice/DiceSpikeOverlay";
import { LiveKitMediaDock } from "./media/LiveKitMediaDock";
import { RoomsOpsPage } from "./ops/RoomsOpsPage";
import { HTML_UI_FONT_FAMILY } from "./board/constants";
import {
  DesignSystemHoverInspector,
} from "./ui/system/debug";
import { isDesignSystemHoverDebugEnabled } from "./ui/system/debugMeta";
import { getDesignSystemDebugAttrs } from "./ui/system/debugMeta";
import { createParticipantAccentButtonRecipeWithMode, buttonRecipes } from "./ui/system/families/button";
import { calloutRecipes } from "./ui/system/families/callout";
import { fieldRecipes, getFieldShellProps } from "./ui/system/families/field";
import {
  getSwatchButtonProps,
  swatchPillRecipes,
} from "./ui/system/families/swatchPill";
import { surfaceRecipes } from "./ui/system/surfaces";
import { applyClientResetPolicyIfNeeded } from "./lib/clientResetPolicy";
import {
  type AccessLevel,
  createRoomGovernedEntityRef,
  resolveGovernedEntityAccess,
} from "./lib/governance";
import { createRoomCreatorConnection } from "./lib/roomCreatorRealtime";
import {
  clearActiveParticipantRoomSession,
  clearActiveRoomId,
  createLocalParticipantPresence,
  createRoomOccupancy,
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
import { normalizeRoomId } from "./lib/roomId";
import {
  createRoomBaselineDescriptor,
  ensureRoomMemberRegistered,
  ensureRoomRecordInitialized,
  getRoomMemberRecord,
  loadRoomRecord,
  markRoomBaselineApplied,
  mirrorRoomCreatorId,
} from "./lib/roomMetadata";
import { createRoomPresenceConnection } from "./lib/roomPresenceRealtime";
import { isLiveKitMediaEnabled, logClientRuntimeConfig } from "./lib/runtimeConfig";
import type { FormEvent } from "react";
import type {
  LocalParticipantSession,
  ParticipantPresence,
  ParticipantPresenceMap,
  RoomOccupancyMap,
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
const ENTRY_JOIN_FAILURE_CUE_MS = 4000;
const IS_DEV = import.meta.env.DEV;
const entryDebugActionButtonRecipe = buttonRecipes.secondary.compact;

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

function AppBootScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: HTML_UI_FONT_FAMILY,
      }}
    >
      <div
        style={{
          padding: "24px 28px",
          borderRadius: 16,
          background: "rgba(255, 255, 255, 0.92)",
          border: "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
          fontSize: 14,
          letterSpacing: "0.01em",
        }}
      >
        Preparing room…
      </div>
    </div>
  );
}

type EntryModeScreenProps = {
  draftRoomId: string;
  draftName: string;
  draftColor: string;
  returningRoomMember: ReturnType<typeof getRoomMemberRecord> | null;
  effectiveEntryOccupiedColors: Set<string>;
  entryHasFreeColor: boolean;
  isJoinPending: boolean;
  isDraftColorOccupied: boolean;
  isEntryDebugOpen: boolean;
  isDebugControlsEnabled: boolean;
  entryDebugOccupiedColors: string[];
  entryDebugClaimColor: string | null;
  entryJoinFailureMessage: string | null;
  entryPrimaryButtonRecipe: ReturnType<
    typeof createParticipantAccentButtonRecipeWithMode
  >;
  onJoinRoom: (event: FormEvent<HTMLFormElement>) => void;
  onDraftRoomIdChange: (nextRoomId: string) => void;
  onDraftNameChange: (nextDraftName: string) => void;
  onDraftColorChange: (nextDraftColor: string) => void;
  onEntryDebugOpenChange: (isOpen: boolean) => void;
  onToggleEntryDebugOccupiedColor: (color: string) => void;
  onEntryDebugClaimColorChange: (color: string | null) => void;
  onFillEntryDebugOccupiedColors: () => void;
  onClearEntryDebugOverrides: () => void;
};

function EntryModeScreen({
  draftRoomId,
  draftName,
  draftColor,
  returningRoomMember,
  effectiveEntryOccupiedColors,
  entryHasFreeColor,
  isJoinPending,
  isDraftColorOccupied,
  isEntryDebugOpen,
  isDebugControlsEnabled,
  entryDebugOccupiedColors,
  entryDebugClaimColor,
  entryJoinFailureMessage,
  entryPrimaryButtonRecipe,
  onJoinRoom,
  onDraftRoomIdChange,
  onDraftNameChange,
  onDraftColorChange,
  onEntryDebugOpenChange,
  onToggleEntryDebugOccupiedColor,
  onEntryDebugClaimColorChange,
  onFillEntryDebugOccupiedColors,
  onClearEntryDebugOverrides,
}: EntryModeScreenProps) {
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
          onSubmit={onJoinRoom}
          className={surfaceRecipes.panel.default.className}
          style={surfaceRecipes.panel.default.style}
          {...getDesignSystemDebugAttrs(surfaceRecipes.panel.default.debug)}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>Room</div>
            <div
              {...getFieldShellProps(fieldRecipes.default.shell)}
              {...getDesignSystemDebugAttrs(fieldRecipes.default.shell.debug)}
            >
              <input
                value={draftRoomId}
                onChange={(event) => {
                  onDraftRoomIdChange(event.target.value);
                }}
                placeholder="Room name"
                className={fieldRecipes.default.input.className}
                style={fieldRecipes.default.input.style}
              />
            </div>
          </div>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 14, color: "#cbd5e1" }}>Player</span>
            <div
              {...getFieldShellProps(fieldRecipes.default.shell)}
              {...getDesignSystemDebugAttrs(fieldRecipes.default.shell.debug)}
            >
              <input
                value={draftName}
                onChange={(event) => {
                  onDraftNameChange(event.target.value);
                }}
                placeholder="Your name"
                autoFocus
                className={fieldRecipes.default.input.className}
                style={fieldRecipes.default.input.style}
              />
            </div>
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
                  const isOccupied = effectiveEntryOccupiedColors.has(color);
                  const entryColorSwatchProps = getSwatchButtonProps(
                    swatchPillRecipes.swatch.default,
                    {
                      fillColor: color,
                      selected: isSelected,
                      occupied: isOccupied,
                      pending: isJoinPending,
                    }
                  );

                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        onDraftColorChange(color);
                      }}
                      disabled={isOccupied || isJoinPending}
                      aria-label={`Select color ${color}${isOccupied ? " (currently occupied)" : ""}`}
                      title={
                        isOccupied
                          ? "Currently occupied by an active participant"
                          : undefined
                      }
                      className={entryColorSwatchProps.className}
                      style={entryColorSwatchProps.style}
                      {...getDesignSystemDebugAttrs(
                        swatchPillRecipes.swatch.default.debug
                      )}
                    />
                  );
                })}
              </div>
              {entryHasFreeColor ? (
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  Dashed swatches are currently occupied by active participants, active join claims, or local debug overrides.
                </div>
              ) : (
                <div
                  style={calloutRecipes.warning.default.style}
                  className={calloutRecipes.warning.default.className}
                  {...getDesignSystemDebugAttrs(
                    calloutRecipes.warning.default.debug
                  )}
                >
                  Room full right now: all 8 participant colors are currently occupied.
                </div>
              )}
            </div>
          </div>

          {IS_DEV && isDebugControlsEnabled ? (
            <details
              open={isEntryDebugOpen}
              onToggle={(event) => {
                onEntryDebugOpenChange((event.target as HTMLDetailsElement).open);
              }}
              className={surfaceRecipes.inset.default.className}
              style={surfaceRecipes.inset.default.style}
              {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#93c5fd",
                  userSelect: "none",
                }}
              >
                Entry debug
              </summary>
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  Local overrides only. These do not publish fake room state.
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                    Simulated occupied colors
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {PARTICIPANT_COLOR_OPTIONS.map((color) => {
                      const isDebugOccupied =
                        entryDebugOccupiedColors.includes(color);
                      const debugOccupiedSwatchProps = getSwatchButtonProps(
                        swatchPillRecipes.swatch.small,
                        {
                          fillColor: color,
                          selected: isDebugOccupied,
                        }
                      );

                      return (
                        <button
                          key={`entry-debug-occupied-${color}`}
                          type="button"
                          onClick={() => {
                            onToggleEntryDebugOccupiedColor(color);
                          }}
                          className={debugOccupiedSwatchProps.className}
                          style={{
                            ...debugOccupiedSwatchProps.style,
                            width: 24,
                            height: 24,
                            opacity: isDebugOccupied ? 1 : 0.7,
                          }}
                          aria-label={`Toggle debug occupied color ${color}`}
                          title="Toggle local debug occupied color"
                          {...getDesignSystemDebugAttrs(
                            swatchPillRecipes.swatch.small.debug
                          )}
                        />
                      );
                    })}
                  </div>
                </div>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#cbd5e1" }}>
                    Simulated claimed color
                  </span>
                  <div
                    {...getFieldShellProps(fieldRecipes.small.shell)}
                    {...getDesignSystemDebugAttrs(fieldRecipes.small.shell.debug)}
                  >
                    <select
                      value={entryDebugClaimColor ?? ""}
                      onChange={(event) => {
                        const nextValue = event.target.value.trim();
                        onEntryDebugClaimColorChange(nextValue ? nextValue : null);
                      }}
                      className={fieldRecipes.small.select.className}
                      style={fieldRecipes.small.select.style}
                    >
                      <option value="">None</option>
                      {PARTICIPANT_COLOR_OPTIONS.map((color) => (
                        <option key={`entry-debug-claim-${color}`} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={onFillEntryDebugOccupiedColors}
                    className={entryDebugActionButtonRecipe.className}
                    style={entryDebugActionButtonRecipe.style}
                    {...getDesignSystemDebugAttrs(entryDebugActionButtonRecipe.debug)}
                  >
                    Room full
                  </button>
                  <button
                    type="button"
                    onClick={onClearEntryDebugOverrides}
                    className={entryDebugActionButtonRecipe.className}
                    style={entryDebugActionButtonRecipe.style}
                    {...getDesignSystemDebugAttrs(entryDebugActionButtonRecipe.debug)}
                  >
                    Clear debug overrides
                  </button>
                </div>
              </div>
            </details>
          ) : null}

          {entryJoinFailureMessage ? (
            <div
              style={calloutRecipes.warning.default.style}
              className={calloutRecipes.warning.default.className}
              {...getDesignSystemDebugAttrs(calloutRecipes.warning.default.debug)}
            >
              {entryJoinFailureMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={
              !normalizeRoomId(draftRoomId) ||
              !draftName.trim() ||
              !entryHasFreeColor ||
              isDraftColorOccupied ||
              isJoinPending
            }
            style={{
              ...entryPrimaryButtonRecipe.style,
            }}
            className={entryPrimaryButtonRecipe.className}
            {...getDesignSystemDebugAttrs(entryPrimaryButtonRecipe.debug)}
          >
            {isJoinPending ? "Joining..." : "Join room"}
          </button>
        </form>
      </div>
    </div>
  );
}

type JoinedRoomScreenProps = {
  joinedRoomId: string;
  participantSession: LocalParticipantSession;
  participantPresences: ParticipantPresenceMap;
  roomOccupancies: RoomOccupancyMap;
  isCurrentParticipantRoomCreator: boolean;
  roomCreatorName: string | null;
  roomCreatorId: string | null;
  roomBaselineToApply: RoomBaselineDescriptor | null;
  roomEffectiveAccessLevel: AccessLevel;
  liveKitMediaEnabled: boolean;
  onLeaveRoom: () => void;
  onRoomBaselineApplied: (
    baselineId: RoomBaselineDescriptor["baselineId"]
  ) => void;
  onUpdateParticipantSession: (
    updater: (session: LocalParticipantSession) => LocalParticipantSession
  ) => void;
  onUpdateLocalPresence: (
    updater: (presence: ParticipantPresence | null) => ParticipantPresence | null
  ) => void;
};

function JoinedRoomScreen({
  joinedRoomId,
  participantSession,
  participantPresences,
  roomOccupancies,
  isCurrentParticipantRoomCreator,
  roomCreatorName,
  roomCreatorId,
  roomBaselineToApply,
  roomEffectiveAccessLevel,
  liveKitMediaEnabled,
  onLeaveRoom,
  onRoomBaselineApplied,
  onUpdateParticipantSession,
  onUpdateLocalPresence,
}: JoinedRoomScreenProps) {
  return (
    <>
      <BoardStage
        key={joinedRoomId}
        participantSession={participantSession}
        participantPresences={participantPresences}
        roomOccupancies={roomOccupancies}
        roomId={joinedRoomId}
        isCurrentParticipantRoomCreator={isCurrentParticipantRoomCreator}
        roomCreatorName={roomCreatorName}
        roomCreatorId={roomCreatorId}
        roomBaselineToApply={roomBaselineToApply}
        roomEffectiveAccessLevel={roomEffectiveAccessLevel}
        onLeaveRoom={onLeaveRoom}
        onRoomBaselineApplied={onRoomBaselineApplied}
        onUpdateParticipantSession={onUpdateParticipantSession}
        onUpdateLocalPresence={onUpdateLocalPresence}
      />
      <DiceSpikeOverlay roomId={joinedRoomId} participantSession={participantSession} />
      {liveKitMediaEnabled ? (
        <LiveKitMediaDock roomId={joinedRoomId} participantSession={participantSession} />
      ) : null}
    </>
  );
}

export default function App() {
  const isOpsRoute = window.location.pathname.startsWith("/ops/rooms");

  if (isOpsRoute) {
    return (
      <>
        <RoomsOpsPage />
        <DesignSystemHoverInspector />
      </>
    );
  }

  const [isBootReady, setIsBootReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void applyClientResetPolicyIfNeeded().finally(() => {
      if (isMounted) {
        setIsBootReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isBootReady) {
    return (
      <>
        <AppBootScreen />
        <DesignSystemHoverInspector />
      </>
    );
  }

  return (
    <>
      <BootstrappedApp />
      <DesignSystemHoverInspector />
    </>
  );
}

function BootstrappedApp() {
  const isDebugControlsEnabled = isDesignSystemHoverDebugEnabled();
  const liveKitMediaEnabled = isLiveKitMediaEnabled();
  const browserParticipantId = getOrCreateBrowserParticipantId();
  const initialRoomIdFromLocation = getRoomIdFromLocation(window.location);
  const initialSharedActiveRoomSession =
    loadActiveParticipantRoomSession(browserParticipantId);
  const initialActiveRoomId =
    initialSharedActiveRoomSession?.roomId ?? loadActiveRoomId();
  const initialDraftRoomId =
    initialRoomIdFromLocation ?? initialActiveRoomId;
  const initialParticipantDraft = loadParticipantDraftForRoom(initialDraftRoomId);
  const shouldRestoreJoinedRoom =
    !!initialActiveRoomId &&
    initialDraftRoomId === initialActiveRoomId &&
    !!initialParticipantDraft.savedSession;

  const [draftRoomId, setDraftRoomId] = useState(initialDraftRoomId);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() =>
    shouldRestoreJoinedRoom ? initialDraftRoomId : null
  );
  const [isInRoom, setIsInRoom] = useState(() => shouldRestoreJoinedRoom);
  const [participantSession, setParticipantSession] =
    useState<LocalParticipantSession | null>(() =>
      shouldRestoreJoinedRoom ? initialParticipantDraft.savedSession : null
    );
  const [roomOccupancies, setRoomOccupancies] = useState<RoomOccupancyMap>({});
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
  const [roomCreatorId, setRoomCreatorId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState(initialParticipantDraft.draftName);
  const [draftColor, setDraftColor] = useState(initialParticipantDraft.draftColor);
  const [entryRoomOccupancies, setEntryRoomOccupancies] = useState<RoomOccupancyMap>(
    {}
  );
  const [entryParticipantPresences, setEntryParticipantPresences] =
    useState<ParticipantPresenceMap>({});
  const [entryJoinClaims, setEntryJoinClaims] = useState<JoinClaimMap>({});
  const [hasManualEntryColorChoice, setHasManualEntryColorChoice] = useState(false);
  const [isJoinPending, setIsJoinPending] = useState(false);
  const [entryJoinFailureMessage, setEntryJoinFailureMessage] = useState<string | null>(null);
  const [isEntryDebugOpen, setIsEntryDebugOpen] = useState(false);
  const [entryDebugOccupiedColors, setEntryDebugOccupiedColors] = useState<string[]>(
    []
  );
  const [entryDebugClaimColor, setEntryDebugClaimColor] = useState<string | null>(null);
  const [isForegroundPresenceCarrier, setIsForegroundPresenceCarrier] = useState(() =>
    getIsForegroundPresenceCarrier()
  );
  const entryPrimaryButtonRecipe = createParticipantAccentButtonRecipeWithMode(
    buttonRecipes.primary.default,
    draftColor,
    "fill"
  );
  const entryPresenceConnectionRef = useRef<RoomPresenceConnection | null>(null);
  const roomPresenceConnectionRef = useRef<RoomPresenceConnection | null>(null);
  const roomCreatorConnectionRef = useRef<ReturnType<
    typeof createRoomCreatorConnection
  > | null>(null);
  const entryRoomOccupanciesRef = useRef<RoomOccupancyMap>({});
  const entryParticipantPresencesRef = useRef<ParticipantPresenceMap>({});
  const entryJoinClaimsRef = useRef<JoinClaimMap>({});

  const ensureInitializedRoomRecord = (roomId: string) => {
    return ensureRoomRecordInitialized({
      roomId,
      baseline: DEFAULT_ROOM_BASELINE_DESCRIPTOR,
    });
  };

  const rememberRoomMemberState = (
    roomId: string,
    session: LocalParticipantSession
  ) => {
    const initializedRoomRecord = ensureInitializedRoomRecord(roomId);
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
    const normalizedNextDraftRoomId = normalizeRoomId(nextDraftRoomId);
    roomPresenceConnectionRef.current?.destroy();
    roomPresenceConnectionRef.current = null;
    roomCreatorConnectionRef.current?.destroy();
    roomCreatorConnectionRef.current = null;

    clearActiveRoomId();
    setDraftRoomId(normalizedNextDraftRoomId);
    setDraftName(participantSession?.name ?? draftName);
    setDraftColor(participantSession?.color ?? draftColor);
    setActiveRoomId(null);
    setIsInRoom(false);
    setParticipantSession(null);
    setLocalParticipantPresence(null);
    setRoomOccupancies({});
    setParticipantPresences({});
    setRoomRecord(null);
    setRoomCreatorId(null);
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
    entryRoomOccupanciesRef.current = entryRoomOccupancies;
  }, [entryRoomOccupancies]);

  useEffect(() => {
    entryParticipantPresencesRef.current = entryParticipantPresences;
  }, [entryParticipantPresences]);

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
    const entryRoomId = normalizeRoomId(draftRoomId);

    if (participantSession || !entryRoomId) {
      entryPresenceConnectionRef.current?.destroy();
      entryPresenceConnectionRef.current = null;
      setEntryRoomOccupancies({});
      setEntryParticipantPresences({});
      setEntryJoinClaims({});
      setEntryJoinFailureMessage(null);
      setIsJoinPending(false);
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
  }, [draftRoomId, participantSession]);

  useEffect(() => {
    if (participantSession || !normalizeRoomId(draftRoomId)) {
      return;
    }
    setHasManualEntryColorChoice(false);
    setEntryJoinFailureMessage(null);
  }, [draftRoomId, participantSession]);

  useEffect(() => {
    if (!isInRoom || !activeRoomId) {
      setRoomRecord(null);
      setRoomCreatorId(null);
      setRoomOccupancies({});
      setParticipantPresences({});
      return;
    }

    const nextSession = loadLocalParticipantSession(activeRoomId);
    if (!nextSession) {
      setParticipantSession(null);
      setRoomRecord(loadRoomRecord(activeRoomId));
      setRoomCreatorId(null);
      setLocalParticipantPresence(null);
      setRoomOccupancies({});
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
    setRoomCreatorId(null);
    setLocalParticipantPresence(
      createLocalParticipantPresence(nextSession)
    );
    setRoomOccupancies({});
    setParticipantPresences({});
  }, [activeRoomId, isInRoom]);

  useEffect(() => {
    if (!isInRoom || !activeRoomId || !participantSession?.id) {
      roomCreatorConnectionRef.current?.destroy();
      roomCreatorConnectionRef.current = null;
      setRoomCreatorId(null);
      return;
    }

    const connection = createRoomCreatorConnection({
      roomId: activeRoomId,
      participantId: participantSession.id,
      onCreatorIdChange: (nextCreatorId) => {
        setRoomCreatorId(nextCreatorId);
        const nextRoomRecord = mirrorRoomCreatorId({
          roomId: activeRoomId,
          creatorId: nextCreatorId,
        });

        if (nextRoomRecord) {
          setRoomRecord(nextRoomRecord);
        }
      },
    });

    roomCreatorConnectionRef.current = connection;

    return () => {
      if (roomCreatorConnectionRef.current === connection) {
        roomCreatorConnectionRef.current = null;
      }

      connection.destroy();
    };
  }, [activeRoomId, isInRoom, participantSession?.id]);

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

    const trimmedRoomId = normalizeRoomId(draftRoomId);
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
      entryRoomOccupanciesRef.current,
      entryJoinClaimsRef.current
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
      setEntryJoinFailureMessage(null);
      entryPresenceConnectionRef.current?.setLocalJoinClaim(joinClaim);

      await new Promise((resolve) => {
        window.setTimeout(resolve, JOIN_CLAIM_SETTLE_MS);
      });

      const latestOccupancies = entryRoomOccupanciesRef.current;
      const latestClaims = entryJoinClaimsRef.current;
      const latestBlockedColors = getEntryBlockedColors(
        latestOccupancies,
        latestClaims,
        {
          excludeJoinClaim: joinClaim,
        }
      );
      const winningClaim =
        getWinningJoinClaimsByColor(latestClaims, latestOccupancies)[draftColor] ??
        null;

      if (
        latestBlockedColors.size >= PARTICIPANT_COLOR_OPTIONS.length ||
        latestBlockedColors.has(draftColor) ||
        (winningClaim && winningClaim.participantId !== nextSessionDraft.id)
      ) {
        entryPresenceConnectionRef.current?.setLocalJoinClaim(null);
        setEntryJoinFailureMessage(
          "That color became unavailable while you were joining. Choose another free color and try again."
        );
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
        roomOccupancies,
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
      setRoomOccupancies({});
      setParticipantPresences({});
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
  }, [activeRoomId, isInRoom, participantSession?.id]);

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
        ? localParticipantPresence ?? createLocalParticipantPresence(participantSession)
        : null
    );
  }, [isForegroundPresenceCarrier, localParticipantPresence, participantSession]);

  const joinedRoomId = activeRoomId ?? draftRoomId;
  const roomGovernedEntity = createRoomGovernedEntityRef({
    roomId: joinedRoomId,
    creatorId: roomCreatorId,
  });
  const roomEffectiveAccess = resolveGovernedEntityAccess({
    entity: roomGovernedEntity,
    participantId: participantSession?.id ?? null,
    defaultAccessLevel: "full",
  });
  const roomEffectiveAccessLevel = roomEffectiveAccess?.accessLevel ?? "none";
  const isCurrentParticipantRoomCreator =
    !!roomCreatorId && roomCreatorId === participantSession?.id;
  const roomCreatorName =
    roomCreatorId && !isCurrentParticipantRoomCreator
      ? roomOccupancies[roomCreatorId]?.name ??
        participantPresences[roomCreatorId]?.name ??
        null
      : null;
  const roomBaselineToApply =
    roomRecord?.initializedBaselineId &&
    roomRecord.initializedBaselineId !== "empty" &&
    roomRecord.appliedBaselineId !== roomRecord.initializedBaselineId
      ? createRoomBaselineDescriptor({
          baselineId: roomRecord.initializedBaselineId,
        })
      : null;
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
  const entryOccupiedColors = getEntryBlockedColors(
    entryRoomOccupancies,
    entryJoinClaims
  );
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
  const entryPreviousColor = returningRoomMember?.assignedColor ?? entrySavedSession?.color ?? null;
  const entrySuggestedColor = getFirstFreeParticipantColor(effectiveEntryOccupiedColors, [
    draftColor,
    entryPreviousColor,
    PARTICIPANT_COLOR_OPTIONS[0],
  ]);
  const entryHasFreeColor = entrySuggestedColor !== null;
  const isDraftColorOccupied =
    draftColor.length > 0 && effectiveEntryOccupiedColors.has(draftColor);

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
      <EntryModeScreen
        draftRoomId={draftRoomId}
        draftName={draftName}
        draftColor={draftColor}
        returningRoomMember={returningRoomMember}
        effectiveEntryOccupiedColors={effectiveEntryOccupiedColors}
        entryHasFreeColor={entryHasFreeColor}
        isJoinPending={isJoinPending}
        isDraftColorOccupied={isDraftColorOccupied}
        isEntryDebugOpen={isEntryDebugOpen}
        isDebugControlsEnabled={isDebugControlsEnabled}
        entryDebugOccupiedColors={entryDebugOccupiedColors}
        entryDebugClaimColor={entryDebugClaimColor}
        entryJoinFailureMessage={entryJoinFailureMessage}
        entryPrimaryButtonRecipe={entryPrimaryButtonRecipe}
        onJoinRoom={joinRoom}
        onDraftRoomIdChange={(nextRoomId) => {
          setDraftRoomId(nextRoomId);

          const trimmedRoomId = normalizeRoomId(nextRoomId);

          if (!trimmedRoomId) {
            return;
          }

          setHasManualEntryColorChoice(false);

          const nextParticipantDraft = loadParticipantDraftForRoom(trimmedRoomId);

          if (!nextParticipantDraft.savedSession) {
            return;
          }

          setDraftName(nextParticipantDraft.draftName);
          setDraftColor(nextParticipantDraft.draftColor);
        }}
        onDraftNameChange={setDraftName}
        onDraftColorChange={(nextDraftColor) => {
          setHasManualEntryColorChoice(true);
          setDraftColor(nextDraftColor);
        }}
        onEntryDebugOpenChange={setIsEntryDebugOpen}
        onToggleEntryDebugOccupiedColor={(color) => {
          setEntryDebugOccupiedColors((current) =>
            current.includes(color)
              ? current.filter((currentColor) => currentColor !== color)
              : [...current, color]
          );
        }}
        onEntryDebugClaimColorChange={setEntryDebugClaimColor}
        onFillEntryDebugOccupiedColors={() => {
          setEntryDebugOccupiedColors([...PARTICIPANT_COLOR_OPTIONS]);
          setEntryDebugClaimColor(null);
        }}
        onClearEntryDebugOverrides={() => {
          setEntryDebugOccupiedColors([]);
          setEntryDebugClaimColor(null);
        }}
      />
    );
  }

  return (
    <JoinedRoomScreen
      joinedRoomId={joinedRoomId}
      participantSession={participantSession}
      participantPresences={participantPresences}
      roomOccupancies={roomOccupancies}
      isCurrentParticipantRoomCreator={isCurrentParticipantRoomCreator}
      roomCreatorName={roomCreatorName}
      roomCreatorId={roomCreatorId}
      roomBaselineToApply={roomBaselineToApply}
      roomEffectiveAccessLevel={roomEffectiveAccessLevel}
      liveKitMediaEnabled={liveKitMediaEnabled}
      onLeaveRoom={leaveRoom}
      onRoomBaselineApplied={handleRoomBaselineApplied}
      onUpdateParticipantSession={updateParticipantSession}
      onUpdateLocalPresence={(updater) => {
        setLocalParticipantPresence((currentPresence) =>
          updater(currentPresence ?? createLocalParticipantPresence(participantSession))
        );
      }}
    />
  );
}
