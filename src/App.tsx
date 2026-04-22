import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  loadParticipantDraftForRoom,
  useEntryAvailabilityState,
} from "./app/useEntryAvailabilityState";
import { useJoinedRoomPresenceTransport } from "./app/useJoinedRoomPresenceTransport";
import BoardStage from "./components/BoardStage";
import { DiceSpikeOverlay } from "./dice/DiceSpikeOverlay";
import { LiveKitMediaLayer } from "./media/LiveKitMediaLayer";
import type { LiveKitMediaStatusViewModel } from "./media/liveKitMediaStatus";
import { isFakeMicrophoneLevelEnabled } from "./media/mediaDiagnostics";
import { RoomsOpsPage } from "./ops/RoomsOpsPage";
import { HTML_UI_FONT_FAMILY } from "./board/constants";
import {
  DesignSystemHoverInspector,
} from "./ui/system/debug";
import { DesignSystemSandboxPage } from "./ui/system/DesignSystemSandboxPage";
import { isDesignSystemHoverDebugEnabled } from "./ui/system/debugMeta";
import { getDesignSystemDebugAttrs } from "./ui/system/debugMeta";
import {
  createDraftLocalUserButtonRecipeForSlot,
  buttonRecipes,
  getButtonProps,
} from "./ui/system/families/button";
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
  getParticipantColorSlotNumber,
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
  subscribeToLocalParticipantSession,
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
import { isLiveKitMediaEnabled, logClientRuntimeConfig } from "./lib/runtimeConfig";
import type { FormEvent, ReactNode } from "react";
import type {
  LocalParticipantSession,
  ParticipantPresence,
  ParticipantPresenceMap,
  RoomOccupancyMap,
} from "./lib/roomSession";
import type { RoomBaselineDescriptor, RoomRecord } from "./lib/roomMetadata";
import type { JoinClaim } from "./lib/roomPresenceRealtime";

const ENTRY_SCREEN_VERSION_LABEL = "alpha v0.0.0";
const DEFAULT_ROOM_BASELINE_DESCRIPTOR: RoomBaselineDescriptor =
  createRoomBaselineDescriptor({
    baselineId: "public-demo-v1",
  });
const JOIN_CLAIM_TTL_MS = 5000;
const JOIN_CLAIM_SETTLE_MS = 220;
const entryDebugActionButtonRecipe = buttonRecipes.secondary.compact;

type JoinedRoomActivationState = {
  draftRoomId: string;
  draftName: string;
  draftColor: string;
  activeRoomId: string;
  isInRoom: true;
  participantSession: LocalParticipantSession;
  localParticipantPresence: ParticipantPresence;
  roomRecord: RoomRecord | null;
  roomCreatorId: string | null;
};

function getIsForegroundPresenceCarrier() {
  return !document.hidden && document.hasFocus();
}

function createJoinedRoomActivationState(params: {
  roomId: string;
  participantSession: LocalParticipantSession;
  roomRecord: RoomRecord | null;
}): JoinedRoomActivationState {
  return {
    draftRoomId: params.roomId,
    draftName: params.participantSession.name,
    draftColor: params.participantSession.color,
    activeRoomId: params.roomId,
    isInRoom: true,
    participantSession: params.participantSession,
    localParticipantPresence: createLocalParticipantPresence(
      params.participantSession
    ),
    roomRecord: params.roomRecord,
    roomCreatorId: null,
  };
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
    typeof createDraftLocalUserButtonRecipeForSlot
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
          data-testid="entry-form"
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
                data-testid="entry-room-input"
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
                data-testid="entry-name-input"
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
                      participantColorSlot: getParticipantColorSlotNumber(color),
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
                      {...entryColorSwatchProps}
                      aria-label={`Select color ${color}${isOccupied ? " (currently occupied)" : ""}`}
                      title={
                        isOccupied
                          ? "Currently occupied by an active participant"
                          : undefined
                      }
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

          {isDebugControlsEnabled ? (
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
                          participantColorSlot: getParticipantColorSlotNumber(color),
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
                          {...debugOccupiedSwatchProps}
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
                    {...getButtonProps(entryDebugActionButtonRecipe)}
                    {...getDesignSystemDebugAttrs(entryDebugActionButtonRecipe.debug)}
                  >
                    Room full
                  </button>
                  <button
                    type="button"
                    onClick={onClearEntryDebugOverrides}
                    {...getButtonProps(entryDebugActionButtonRecipe)}
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
            data-testid="entry-join-button"
            {...getButtonProps(entryPrimaryButtonRecipe, {
              disabled:
                !normalizeRoomId(draftRoomId) ||
                !draftName.trim() ||
                !entryHasFreeColor ||
                isDraftColorOccupied,
              loading: isJoinPending,
            })}
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
  const [mediaStatus, setMediaStatus] =
    useState<LiveKitMediaStatusViewModel | null>(null);

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
        mediaStatus={liveKitMediaEnabled ? mediaStatus : null}
        onLeaveRoom={onLeaveRoom}
        onRoomBaselineApplied={onRoomBaselineApplied}
        onUpdateParticipantSession={onUpdateParticipantSession}
        onUpdateLocalPresence={onUpdateLocalPresence}
      />
      <DiceSpikeOverlay roomId={joinedRoomId} participantSession={participantSession} />
      {liveKitMediaEnabled ? (
        <LiveKitMediaLayer
          roomId={joinedRoomId}
          participantSession={participantSession}
          participantPresences={participantPresences}
          roomOccupancies={roomOccupancies}
          onMediaStatusChange={setMediaStatus}
        />
      ) : null}
    </>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <DesignSystemHoverInspector />
    </>
  );
}

function OpsRouteShell() {
  return (
    <AppShell>
      <RoomsOpsPage />
    </AppShell>
  );
}

function DesignSystemSandboxRouteShell() {
  return (
    <AppShell>
      <DesignSystemSandboxPage />
    </AppShell>
  );
}

function RoomRouteShell() {
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
      <AppShell>
        <AppBootScreen />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <BootstrappedApp />
    </AppShell>
  );
}

export default function App() {
  const isOpsRoute = window.location.pathname.startsWith("/ops/rooms");
  const isDesignSystemSandboxRoute =
    import.meta.env.DEV && window.location.pathname.startsWith("/dev/design-system");

  if (isDesignSystemSandboxRoute) {
    return <DesignSystemSandboxRouteShell />;
  }

  return isOpsRoute ? <OpsRouteShell /> : <RoomRouteShell />;
}

function BootstrappedApp() {
  const isDebugControlsEnabled = isDesignSystemHoverDebugEnabled();
  const liveKitMediaEnabled =
    isLiveKitMediaEnabled() || isFakeMicrophoneLevelEnabled();
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
  const initialJoinedRoomState =
    shouldRestoreJoinedRoom && initialParticipantDraft.savedSession
      ? createJoinedRoomActivationState({
          roomId: initialDraftRoomId,
          participantSession: initialParticipantDraft.savedSession,
          roomRecord: loadRoomRecord(initialDraftRoomId),
        })
      : null;

  const [draftRoomId, setDraftRoomId] = useState(
    initialJoinedRoomState?.draftRoomId ?? initialDraftRoomId
  );
  const [activeRoomId, setActiveRoomId] = useState<string | null>(
    initialJoinedRoomState?.activeRoomId ?? null
  );
  const [isInRoom, setIsInRoom] = useState(
    initialJoinedRoomState?.isInRoom ?? false
  );
  const [participantSession, setParticipantSession] =
    useState<LocalParticipantSession | null>(
      initialJoinedRoomState?.participantSession ?? null
    );
  const [localParticipantPresence, setLocalParticipantPresence] =
    useState<ParticipantPresence | null>(
      initialJoinedRoomState?.localParticipantPresence ?? null
    );
  const [roomRecord, setRoomRecord] = useState<RoomRecord | null>(
    initialJoinedRoomState?.roomRecord ?? null
  );
  const [roomCreatorId, setRoomCreatorId] = useState<string | null>(
    initialJoinedRoomState?.roomCreatorId ?? null
  );
  const [draftName, setDraftName] = useState(
    initialJoinedRoomState?.draftName ?? initialParticipantDraft.draftName
  );
  const [draftColor, setDraftColor] = useState(
    initialJoinedRoomState?.draftColor ?? initialParticipantDraft.draftColor
  );
  const [isJoinPending, setIsJoinPending] = useState(false);
  const [isForegroundPresenceCarrier, setIsForegroundPresenceCarrier] = useState(() =>
    getIsForegroundPresenceCarrier()
  );
  const entryPrimaryButtonRecipe = createDraftLocalUserButtonRecipeForSlot(
    buttonRecipes.primary.default,
    getParticipantColorSlotNumber(draftColor),
    "fill"
  );
  const roomCreatorConnectionRef = useRef<ReturnType<
    typeof createRoomCreatorConnection
  > | null>(null);
  const {
    roomOccupancies,
    participantPresences,
    disconnectJoinedRoomPresence,
    syncJoinedRoomParticipantPresence,
  } = useJoinedRoomPresenceTransport({
    activeRoomId,
    isInRoom,
    participantSession,
    localParticipantPresence,
    isForegroundPresenceCarrier,
  });

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

  const applyJoinedRoomActivationState = (
    nextJoinedRoomState: JoinedRoomActivationState
  ) => {
    setDraftRoomId(nextJoinedRoomState.draftRoomId);
    setDraftName(nextJoinedRoomState.draftName);
    setDraftColor(nextJoinedRoomState.draftColor);
    setActiveRoomId(nextJoinedRoomState.activeRoomId);
    setIsInRoom(nextJoinedRoomState.isInRoom);
    setParticipantSession(nextJoinedRoomState.participantSession);
    setLocalParticipantPresence(nextJoinedRoomState.localParticipantPresence);
    setRoomRecord(nextJoinedRoomState.roomRecord);
    setRoomCreatorId(nextJoinedRoomState.roomCreatorId);
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

  const activateJoinedRoom = (
    roomId: string,
    sessionOverride?: LocalParticipantSession | null
  ) => {
    const normalizedRoomId = normalizeRoomId(roomId);

    if (!normalizedRoomId) {
      return;
    }

    const nextSession =
      sessionOverride === undefined
        ? loadLocalParticipantSession(normalizedRoomId)
        : sessionOverride;

    if (!nextSession) {
      setDraftRoomId(normalizedRoomId);
      setActiveRoomId(normalizedRoomId);
      setIsInRoom(true);
      setParticipantSession(null);
      setLocalParticipantPresence(null);
      setRoomRecord(loadRoomRecord(normalizedRoomId));
      setRoomCreatorId(null);
      return;
    }

    saveActiveParticipantRoomSession({
      participantId: nextSession.id,
      roomId: normalizedRoomId,
    });
    applyJoinedRoomActivationState(
      createJoinedRoomActivationState({
        roomId: normalizedRoomId,
        participantSession: nextSession,
        roomRecord: rememberRoomMemberState(normalizedRoomId, nextSession),
      })
    );
  };

  const collapseToEntryScreen = (nextDraftRoomId: string) => {
    const normalizedNextDraftRoomId = normalizeRoomId(nextDraftRoomId);
    disconnectJoinedRoomPresence();
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

  const entryAvailability = useEntryAvailabilityState({
    draftRoomId,
    draftColor,
    participantSession,
    setIsJoinPending,
    setDraftRoomId,
    setDraftName,
    setDraftColor,
  });

  useEffect(() => {
    if (!isInRoom || !activeRoomId || !participantSession?.id) {
      roomCreatorConnectionRef.current?.destroy();
      roomCreatorConnectionRef.current = null;
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

  const handleActiveParticipantRoomSessionChange = useEffectEvent(
    (nextActiveRoomSession: ReturnType<typeof loadActiveParticipantRoomSession>) => {
      if (nextActiveRoomSession?.roomId) {
        if (isInRoom && activeRoomId === nextActiveRoomSession.roomId) {
          return;
        }

        activateJoinedRoom(nextActiveRoomSession.roomId);
        return;
      }

      if (!isInRoom && !activeRoomId) {
        return;
      }

      collapseToEntryScreen(activeRoomId ?? draftRoomId);
    }
  );

  const handleStoredParticipantSessionChange = useEffectEvent(
    (nextStoredSession: LocalParticipantSession | null) => {
      if (!activeRoomId || !participantSession || !nextStoredSession) {
        return;
      }

      if (nextStoredSession.id !== participantSession.id) {
        return;
      }

      if (
        nextStoredSession.name === participantSession.name &&
        nextStoredSession.color === participantSession.color
      ) {
        return;
      }

      const nextLocalParticipantPresence = localParticipantPresence
        ? {
            ...localParticipantPresence,
            participantId: nextStoredSession.id,
            name: nextStoredSession.name,
            color: nextStoredSession.color,
          }
        : {
            ...createLocalParticipantPresence(nextStoredSession),
            participantId: nextStoredSession.id,
          };

      setRoomRecord(rememberRoomMemberState(activeRoomId, nextStoredSession));
      setDraftName(nextStoredSession.name);
      setDraftColor(nextStoredSession.color);
      setParticipantSession(nextStoredSession);
      setLocalParticipantPresence(nextLocalParticipantPresence);
      syncJoinedRoomParticipantPresence(
        nextStoredSession,
        nextLocalParticipantPresence
      );
    }
  );

  useEffect(() => {
    return subscribeToActiveParticipantRoomSession(
      browserParticipantId,
      handleActiveParticipantRoomSessionChange
    );
  }, [browserParticipantId]);

  useEffect(() => {
    if (!isInRoom || !activeRoomId || !participantSession?.id) {
      return;
    }

    return subscribeToLocalParticipantSession(
      activeRoomId,
      handleStoredParticipantSessionChange
    );
  }, [activeRoomId, isInRoom, participantSession?.id]);

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
    const blockedColors = entryAvailability.getCurrentBlockedColors();

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
      entryAvailability.setEntryJoinFailureMessage(null);
      entryAvailability.setLocalJoinClaim(joinClaim);

      await new Promise((resolve) => {
        window.setTimeout(resolve, JOIN_CLAIM_SETTLE_MS);
      });

      const latestBlockedColors = entryAvailability.getCurrentBlockedColors({
        excludeJoinClaim: joinClaim,
      });
      const winningClaim = entryAvailability.getWinningJoinClaimForColor(
        draftColor
      );

      if (
        latestBlockedColors.size >= PARTICIPANT_COLOR_OPTIONS.length ||
        latestBlockedColors.has(draftColor) ||
        (winningClaim && winningClaim.participantId !== nextSessionDraft.id)
      ) {
        entryAvailability.setLocalJoinClaim(null);
        entryAvailability.setEntryJoinFailureMessage(
          "That color became unavailable while you were joining. Choose another free color and try again."
        );
        setIsJoinPending(false);
        return;
      }

      const nextSession: LocalParticipantSession = {
        ...nextSessionDraft,
        color: draftColor,
      };

      entryAvailability.setLocalJoinClaim(null);
      entryAvailability.destroyEntryPresenceConnection();

      saveLocalParticipantSession(trimmedRoomId, nextSession);
      saveActiveRoomId(trimmedRoomId);
      if (getRoomIdFromLocation(window.location) !== trimmedRoomId) {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("room", trimmedRoomId);
        window.history.pushState({}, "", nextUrl);
      }

      activateJoinedRoom(trimmedRoomId, nextSession);
      setIsJoinPending(false);
    };

    void finalizeJoin();
  };

  const updateParticipantSession = (
    updater: (session: LocalParticipantSession) => LocalParticipantSession
  ) => {
    if (!participantSession || !activeRoomId) {
      return;
    }

    const draftSession = updater(participantSession);
    const occupiedColors = getOccupiedParticipantColors(
      roomOccupancies,
      participantSession.id
    );

    if (
      draftSession.color !== participantSession.color &&
      occupiedColors.has(draftSession.color)
    ) {
      return;
    }

    const nextSession: LocalParticipantSession = {
      ...draftSession,
      color: draftSession.color,
    };
    const nextLocalParticipantPresence = localParticipantPresence
      ? {
          ...localParticipantPresence,
          participantId: participantSession.id,
          name: nextSession.name,
          color: nextSession.color,
        }
      : {
          ...createLocalParticipantPresence(nextSession),
          participantId: participantSession.id,
        };

    saveLocalParticipantSession(activeRoomId, nextSession);
    setRoomRecord(rememberRoomMemberState(activeRoomId, nextSession));
    setDraftName(nextSession.name);
    setDraftColor(nextSession.color);
    setParticipantSession(nextSession);
    setLocalParticipantPresence(nextLocalParticipantPresence);
    syncJoinedRoomParticipantPresence(
      nextSession,
      nextLocalParticipantPresence
    );
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

  if (!participantSession) {
    return (
      <EntryModeScreen
        draftRoomId={draftRoomId}
        draftName={draftName}
        draftColor={draftColor}
        returningRoomMember={entryAvailability.returningRoomMember}
        effectiveEntryOccupiedColors={entryAvailability.effectiveEntryOccupiedColors}
        entryHasFreeColor={entryAvailability.entryHasFreeColor}
        isJoinPending={isJoinPending}
        isDraftColorOccupied={entryAvailability.isDraftColorOccupied}
        isEntryDebugOpen={entryAvailability.isEntryDebugOpen}
        isDebugControlsEnabled={isDebugControlsEnabled}
        entryDebugOccupiedColors={entryAvailability.entryDebugOccupiedColors}
        entryDebugClaimColor={entryAvailability.entryDebugClaimColor}
        entryJoinFailureMessage={entryAvailability.entryJoinFailureMessage}
        entryPrimaryButtonRecipe={entryPrimaryButtonRecipe}
        onJoinRoom={joinRoom}
        onDraftRoomIdChange={entryAvailability.handleDraftRoomIdChange}
        onDraftNameChange={setDraftName}
        onDraftColorChange={entryAvailability.handleDraftColorChange}
        onEntryDebugOpenChange={entryAvailability.setIsEntryDebugOpen}
        onToggleEntryDebugOccupiedColor={
          entryAvailability.toggleEntryDebugOccupiedColor
        }
        onEntryDebugClaimColorChange={entryAvailability.setEntryDebugClaimColor}
        onFillEntryDebugOccupiedColors={
          entryAvailability.fillEntryDebugOccupiedColors
        }
        onClearEntryDebugOverrides={entryAvailability.clearEntryDebugOverrides}
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
