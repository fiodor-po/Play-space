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
import { FeedbackDock } from "./ui/system/FeedbackDock";
import { surfaceRecipes } from "./ui/system/surfaces";
import { applyClientResetPolicyIfNeeded } from "./lib/clientResetPolicy";
import {
  type AccessLevel,
  createRoomGovernedEntityRef,
  resolveGovernedEntityAccess,
} from "./lib/governance";
import { createRoomStateConnection } from "./lib/roomCreatorRealtime";
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
  loadRoomRecord,
  markRoomBaselineApplied,
  mirrorRoomCreatorId,
} from "./lib/roomMetadata";
import { isLiveKitMediaEnabled, logClientRuntimeConfig } from "./lib/runtimeConfig";
import type { FormEvent, ReactNode } from "react";
import { createRoomSettings, type RoomSettings } from "./lib/roomSettings";
import type {
  LocalParticipantSession,
  ParticipantPresence,
  ParticipantPresenceMap,
  RoomOccupancyMap,
} from "./lib/roomSession";
import type { RoomBaselineDescriptor, RoomRecord } from "./lib/roomMetadata";
import type { JoinClaim } from "./lib/roomPresenceRealtime";
import {
  buildFeedbackCapturePayload,
  submitFeedbackCapture,
  type FeedbackCaptureContext,
} from "./lib/feedbackCapture";

const ENTRY_SCREEN_VERSION_LABEL = "alpha 2";
const DEFAULT_ROOM_BASELINE_DESCRIPTOR: RoomBaselineDescriptor =
  createRoomBaselineDescriptor({
    baselineId: "public-demo-v1",
  });
const JOIN_CLAIM_TTL_MS = 5000;
const JOIN_CLAIM_SETTLE_MS = 220;
const entryDebugActionButtonRecipe = buttonRecipes.secondary.compact;

function getExplicitRoomIdFromLocation(location: Location) {
  const searchRoomId = normalizeRoomId(
    new URLSearchParams(location.search).get("room")
  );

  if (searchRoomId) {
    return searchRoomId;
  }

  const pathSegments = location.pathname.split("/").filter(Boolean);

  if (pathSegments.length > 0) {
    return normalizeRoomId(decodeURIComponent(pathSegments[pathSegments.length - 1]));
  }

  return "";
}

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
  roomSettings: RoomSettings;
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
    roomSettings: createRoomSettings(),
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
  const isRoomMissing = !normalizeRoomId(draftRoomId);
  const feedbackContext: FeedbackCaptureContext = {
    isRoomOwner: false,
    media: {
      enabled: isLiveKitMediaEnabled(),
      connectionState: "not-joined",
      micEnabled: false,
      cameraEnabled: false,
    },
    room: {
      roomId: normalizeRoomId(draftRoomId) || "entry-screen",
      participantId: getOrCreateBrowserParticipantId(),
      participantName: draftName.trim() || "Guest",
      participantColor: draftColor,
      participantCount: 0,
      objectCounts: {
        tokens: 0,
        images: 0,
        textCards: 0,
      },
    },
  };

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
                autoFocus={isRoomMissing}
                autoComplete="off"
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
                autoFocus={!isRoomMissing && !draftName.trim()}
                autoComplete="off"
                className={fieldRecipes.default.input.className}
                style={fieldRecipes.default.input.style}
              />
            </div>
          </label>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 14, color: "#cbd5e1" }}>Color</div>
            <div style={{ display: "grid", gap: 8 }}>
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
              <div
                style={{
                  minHeight: 16,
                  fontSize: 12,
                  color: entryHasFreeColor ? "#94a3b8" : "#fecaca",
                }}
              >
                {entryHasFreeColor
                  ? "Choose a room, enter your name, and pick a color."
                  : "Room full right now: all 8 participant colors are occupied."}
              </div>
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
      <EntryFeedbackDock feedbackContext={feedbackContext} />
    </div>
  );
}

function EntryFeedbackDock({
  feedbackContext,
}: {
  feedbackContext: FeedbackCaptureContext;
}) {
  return (
    <FeedbackDock
      title="Report a problem"
      description="Quick note before joining the room."
      testIdPrefix="entry-feedback"
      launcherRecipe={buttonRecipes.secondary.small}
      launcherStyle={{
        width: 40,
        minWidth: 40,
        minHeight: 40,
        borderRadius: 999,
        boxShadow: "0 18px 40px rgba(2, 6, 23, 0.28)",
      }}
      wrapperStyle={{
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 12,
      }}
      onSubmit={async ({ type, message }) => {
        await submitFeedbackCapture(
          buildFeedbackCapturePayload({
            type,
            message,
            context: feedbackContext,
          })
        );
      }}
    />
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
  roomSettings: RoomSettings;
  roomBaselineToApply: RoomBaselineDescriptor | null;
  roomEffectiveAccessLevel: AccessLevel;
  liveKitMediaEnabled: boolean;
  onLeaveRoom: () => void;
  onRoomBaselineApplied: (
    baselineId: RoomBaselineDescriptor["baselineId"]
  ) => void;
  onRoomBackgroundThemeChange: (backgroundThemeId: RoomSettings["backgroundThemeId"]) => void;
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
  roomSettings,
  roomBaselineToApply,
  roomEffectiveAccessLevel,
  liveKitMediaEnabled,
  onLeaveRoom,
  onRoomBaselineApplied,
  onRoomBackgroundThemeChange,
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
        roomBackgroundThemeId={roomSettings.backgroundThemeId}
        roomBaselineToApply={roomBaselineToApply}
        roomEffectiveAccessLevel={roomEffectiveAccessLevel}
        mediaStatus={liveKitMediaEnabled ? mediaStatus : null}
        onLeaveRoom={onLeaveRoom}
        onRoomBaselineApplied={onRoomBaselineApplied}
        onRoomBackgroundThemeChange={onRoomBackgroundThemeChange}
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
          onUpdateParticipantSession={onUpdateParticipantSession}
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
  const initialRoomIdFromLocation = getExplicitRoomIdFromLocation(window.location);
  const initialSharedActiveRoomSession =
    loadActiveParticipantRoomSession(browserParticipantId);
  const initialActiveRoomId =
    initialSharedActiveRoomSession?.roomId ?? loadActiveRoomId();
  const initialDraftRoomId =
    initialRoomIdFromLocation || initialActiveRoomId || "";
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
    initialJoinedRoomState?.draftRoomId ?? initialRoomIdFromLocation
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
  const [roomSettings, setRoomSettings] = useState<RoomSettings>(
    initialJoinedRoomState?.roomSettings ?? createRoomSettings()
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
  const roomStateConnectionRef = useRef<ReturnType<
    typeof createRoomStateConnection
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
        avatarFaceId: session.avatarFaceId,
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
    setRoomSettings(nextJoinedRoomState.roomSettings);
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
      setRoomSettings(createRoomSettings());
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
    roomStateConnectionRef.current?.destroy();
    roomStateConnectionRef.current = null;

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
    setRoomSettings(createRoomSettings());
  };

  useEffect(() => {
    const handlePopState = () => {
      if (isInRoom) {
        return;
      }

      const nextRoomId = getExplicitRoomIdFromLocation(window.location);
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
    isJoinPending,
    participantSession,
    setIsJoinPending,
    setDraftRoomId,
    setDraftName,
    setDraftColor,
  });

  useEffect(() => {
    if (!isInRoom || !activeRoomId || !participantSession?.id) {
      roomStateConnectionRef.current?.destroy();
      roomStateConnectionRef.current = null;
      return;
    }

    const connection = createRoomStateConnection({
      roomId: activeRoomId,
      participantId: participantSession.id,
      onStateChange: (nextRoomState) => {
        setRoomCreatorId(nextRoomState.creatorId);
        setRoomSettings(nextRoomState.settings);
        const nextRoomRecord = mirrorRoomCreatorId({
          roomId: activeRoomId,
          creatorId: nextRoomState.creatorId,
        });

        if (nextRoomRecord) {
          setRoomRecord(nextRoomRecord);
        }
      },
    });

    roomStateConnectionRef.current = connection;

    return () => {
      if (roomStateConnectionRef.current === connection) {
        roomStateConnectionRef.current = null;
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
        nextStoredSession.color === participantSession.color &&
        nextStoredSession.avatarFaceId === participantSession.avatarFaceId
      ) {
        return;
      }

      const nextLocalParticipantPresence = localParticipantPresence
        ? {
            ...localParticipantPresence,
            participantId: nextStoredSession.id,
            name: nextStoredSession.name,
            color: nextStoredSession.color,
            avatarFaceId: nextStoredSession.avatarFaceId,
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
      avatarFaceId: savedSession?.avatarFaceId,
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
          avatarFaceId: nextSession.avatarFaceId,
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
      roomSettings={roomSettings}
      roomBaselineToApply={roomBaselineToApply}
      roomEffectiveAccessLevel={roomEffectiveAccessLevel}
      liveKitMediaEnabled={liveKitMediaEnabled}
      onLeaveRoom={leaveRoom}
      onRoomBaselineApplied={handleRoomBaselineApplied}
      onRoomBackgroundThemeChange={(backgroundThemeId) => {
        setRoomSettings(
          createRoomSettings({
            backgroundThemeId,
          })
        );
        void roomStateConnectionRef.current?.updateRoomSettings({
          backgroundThemeId,
        });
      }}
      onUpdateParticipantSession={updateParticipantSession}
      onUpdateLocalPresence={(updater) => {
        setLocalParticipantPresence((currentPresence) =>
          updater(currentPresence ?? createLocalParticipantPresence(participantSession))
        );
      }}
    />
  );
}
