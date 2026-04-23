import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  buttonRecipes,
  createDraftLocalUserButtonRecipeForSlot,
} from "../ui/system/families/button";
import { calloutRecipes } from "../ui/system/families/callout";
import { boardSurfaceRecipes } from "../ui/system/boardSurfaces";
import { getDesignSystemDebugAttrs } from "../ui/system/debugMeta";
import { fontSize } from "../ui/system/typography";
import { createClientId } from "../lib/id";
import {
  createRoomDiceConnection,
  type DiceRollOutcome,
  type RoomDiceConnection,
  type SharedRollKind,
  type SharedDiceRollEvent,
  SUPPORTED_DICE,
} from "../lib/roomDiceRealtime";
import { HTML_UI_FONT_FAMILY } from "../board/constants";
import { getParticipantColorSlotNumber } from "../lib/roomSession";
import type { LocalParticipantSession } from "../lib/roomSession";
import {
  DiceRollLogPanel,
  type DiceRollLogPanelEntry,
} from "./DiceRollLogPanel";

type DiceBoxModule = typeof import("@3d-dice/dice-box-threejs");
type DiceBoxInstance = InstanceType<DiceBoxModule["default"]>;

type DiceSpikeOverlayProps = {
  participantSession: LocalParticipantSession;
  roomId: string;
};

const NEUTRAL_DICE_COLOR = "#94a3b8";
const SHARED_ROLL_TTL_MS = 5000;
const DICE_OVERLAY_FADE_MS = 160;
const BOARD_SURFACE_CONTROL_BORDER_WIDTH = 2;
const DICE_ROLL_LOG_EDGE_OFFSET = 20;
const DICE_ROLL_LOG_MAX_WIDTH = 340;
const DICE_ROLL_LOG_MAX_HISTORY_ITEMS = 40;
const DICE_ROLL_LOG_Z_INDEX = 20;
const FLOATING_BUTTON_SHADOW = "0 12px 26px rgba(2, 6, 23, 0.18)";
const DICE_TRAY_ITEMS = ["d4", "d6", "d8", "d10", "2d10", "d12", "d20"] as const;
type DiceTrayItem = (typeof DICE_TRAY_ITEMS)[number];
type PendingDicePool = Record<DiceTrayItem, number>;

const SINGLE_DIE_SIDES: Record<(typeof SUPPORTED_DICE)[number], number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
};

const diceRollLogOverlayStyle = {
  position: "fixed",
  top: DICE_ROLL_LOG_EDGE_OFFSET,
  right: DICE_ROLL_LOG_EDGE_OFFSET,
  zIndex: DICE_ROLL_LOG_Z_INDEX,
  width: `min(${DICE_ROLL_LOG_MAX_WIDTH}px, calc(100vw - ${
    DICE_ROLL_LOG_EDGE_OFFSET * 2
  }px))`,
  pointerEvents: "auto",
} as const;

export function DiceSpikeOverlay({
  participantSession,
  roomId,
}: DiceSpikeOverlayProps) {
  const participantColorSlot = getParticipantColorSlotNumber(participantSession.color);
  const diceButtonRecipe = useMemo(
    () =>
      createDraftLocalUserButtonRecipeForSlot(
        buttonRecipes.secondary.small,
        participantColorSlot,
        "border"
      ),
    [participantColorSlot]
  );
  const rollButtonRecipe = useMemo(
    () =>
      createDraftLocalUserButtonRecipeForSlot(
        buttonRecipes.primary.small,
        participantColorSlot,
        "fill"
      ),
    [participantColorSlot]
  );
  const resetButtonRecipe = useMemo(
    () =>
      createDraftLocalUserButtonRecipeForSlot(
        buttonRecipes.secondary.small,
        participantColorSlot,
        "border"
      ),
    [participantColorSlot]
  );
  const containerId = useId().replace(/:/g, "-");
  const diceBoxRef = useRef<DiceBoxInstance | null>(null);
  const diceConnectionRef = useRef<RoomDiceConnection | null>(null);
  const cleanupTimeoutsRef = useRef<Record<string, number>>({});
  const fadeCleanupTimeoutRef = useRef<number | null>(null);
  const playbackQueueRef = useRef(Promise.resolve());
  const liveEventIdsRef = useRef<Set<string>>(new Set());
  const scheduledEventIdsRef = useRef<Set<string>>(new Set());
  const playedEventIdsRef = useRef<Set<string>>(new Set());
  const sceneEventIdsRef = useRef<Set<string>>(new Set());
  const sceneHasDiceRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOverlayFadingOut, setIsOverlayFadingOut] = useState(false);
  const [pendingPool, setPendingPool] = useState<PendingDicePool>(() =>
    createEmptyPendingPool()
  );
  const [rollEvents, setRollEvents] = useState<SharedDiceRollEvent[]>([]);
  const [rollLogEvents, setRollLogEvents] = useState<SharedDiceRollEvent[]>([]);
  const [isRollLogExpanded, setIsRollLogExpanded] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let nextDiceBox: DiceBoxInstance | null = null;

    const setupDiceBox = async () => {
      try {
        const module = await import("@3d-dice/dice-box-threejs");

        if (isCancelled) {
          return;
        }

        const DiceBox = module.default;
        const createdDiceBox = new DiceBox(`#${containerId}`, {
          assetPath: "/",
          baseScale: 120,
          color_spotlight: 0xffffff,
          gravity_multiplier: 350,
          light_intensity: 1.25,
          shadows: true,
          sounds: false,
          strength: 1.2,
          theme_material: "plastic",
          theme_surface: "green-felt",
          theme_texture: "",
          theme_customColorset: createActorColorset(participantSession.color),
        });

        await createdDiceBox.initialize();

        const renderer = (createdDiceBox as DiceBoxInstance & {
          renderer?: { setPixelRatio?: (value: number) => void };
        }).renderer;

        renderer?.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, 2));

        if (isCancelled) {
          return;
        }

        nextDiceBox = createdDiceBox;
        diceBoxRef.current = nextDiceBox;
        setIsReady(true);
        setError(null);
      } catch (setupError) {
        if (isCancelled) {
          return;
        }

        console.error("Failed to initialize DiceBoxThreeJS", setupError);
        setError("3D dice preview could not start.");
      }
    };

    setIsReady(false);
    setError(null);
    void setupDiceBox();

    return () => {
      isCancelled = true;

      Object.values(cleanupTimeoutsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      cleanupTimeoutsRef.current = {};
      if (fadeCleanupTimeoutRef.current !== null) {
        window.clearTimeout(fadeCleanupTimeoutRef.current);
        fadeCleanupTimeoutRef.current = null;
      }

      diceBoxRef.current?.clearDice();
      diceBoxRef.current = null;

      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [containerId, participantSession.color]);

  useEffect(() => {
    const connection = createRoomDiceConnection({
      roomId,
      onRollEventsChange: setRollEvents,
    });
    diceConnectionRef.current = connection;

    return () => {
      if (diceConnectionRef.current === connection) {
        diceConnectionRef.current = null;
      }

      connection.destroy();
    };
  }, [roomId]);

  useEffect(() => {
    diceBoxRef.current?.clearDice();
    setIsPublishing(false);
    setIsOverlayFadingOut(false);
    setPendingPool(createEmptyPendingPool());
    setRollLogEvents([]);
    setIsRollLogExpanded(false);
    playbackQueueRef.current = Promise.resolve();
    liveEventIdsRef.current = new Set();
    scheduledEventIdsRef.current = new Set();
    playedEventIdsRef.current = new Set();
    sceneEventIdsRef.current = new Set();
    sceneHasDiceRef.current = false;
    Object.values(cleanupTimeoutsRef.current).forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    cleanupTimeoutsRef.current = {};
    if (fadeCleanupTimeoutRef.current !== null) {
      window.clearTimeout(fadeCleanupTimeoutRef.current);
      fadeCleanupTimeoutRef.current = null;
    }
  }, [roomId]);

  const liveRollEvents = useMemo(() => {
    const now = Date.now();

    return rollEvents.filter((event) => now - event.createdAt < event.ttlMs);
  }, [rollEvents]);

  useEffect(() => {
    if (rollEvents.length === 0) {
      return;
    }

    setRollLogEvents((currentEvents) => {
      const eventMap = new Map<string, SharedDiceRollEvent>();

      currentEvents.forEach((event) => {
        eventMap.set(event.id, event);
      });
      rollEvents.forEach((event) => {
        eventMap.set(event.id, event);
      });

      return Array.from(eventMap.values())
        .sort((leftEvent, rightEvent) => rightEvent.createdAt - leftEvent.createdAt)
        .slice(0, DICE_ROLL_LOG_MAX_HISTORY_ITEMS);
    });
  }, [rollEvents]);

  const pendingDiceCount = useMemo(
    () =>
      DICE_TRAY_ITEMS.reduce((total, die) => total + pendingPool[die], 0),
    [pendingPool]
  );
  const rollLogEntries = useMemo(
    () => rollLogEvents.map(createDiceRollLogEntry),
    [rollLogEvents]
  );

  useEffect(() => {
    rollEvents.forEach((event) => {
      const remainingMs = event.createdAt + event.ttlMs - Date.now();

      if (cleanupTimeoutsRef.current[event.id] !== undefined) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        diceConnectionRef.current?.removeRollEvent(event.id);
        delete cleanupTimeoutsRef.current[event.id];
      }, Math.max(remainingMs, 0));

      cleanupTimeoutsRef.current[event.id] = timeoutId;
    });
  }, [rollEvents]);

  useEffect(() => {
    liveEventIdsRef.current = new Set(liveRollEvents.map((event) => event.id));

    if (liveRollEvents.length > 0) {
      if (fadeCleanupTimeoutRef.current !== null) {
        window.clearTimeout(fadeCleanupTimeoutRef.current);
        fadeCleanupTimeoutRef.current = null;
      }

      if (isOverlayFadingOut) {
        setIsOverlayFadingOut(false);
      }

      return;
    }

    if (sceneHasDiceRef.current) {
      playbackQueueRef.current = playbackQueueRef.current
        .then(() => {
          if (liveEventIdsRef.current.size > 0 || !sceneHasDiceRef.current) {
            return;
          }

          setIsOverlayFadingOut(true);

          if (fadeCleanupTimeoutRef.current !== null) {
            window.clearTimeout(fadeCleanupTimeoutRef.current);
          }

          fadeCleanupTimeoutRef.current = window.setTimeout(() => {
            fadeCleanupTimeoutRef.current = null;

            if (liveEventIdsRef.current.size > 0 || !sceneHasDiceRef.current) {
              setIsOverlayFadingOut(false);
              return;
            }

            diceBoxRef.current?.clearDice();
            sceneHasDiceRef.current = false;
            scheduledEventIdsRef.current = new Set();
            sceneEventIdsRef.current = new Set();
            playedEventIdsRef.current = new Set();
            setIsOverlayFadingOut(false);
          }, DICE_OVERLAY_FADE_MS);
        })
        .catch((clearError) => {
          console.error("Failed to clear shared dice scene", clearError);
        });
    }
  }, [isOverlayFadingOut, liveRollEvents]);

  useEffect(() => {
    const diceBox = diceBoxRef.current;

    if (!diceBox || !isReady) {
      return;
    }

    const unplayedEvents = liveRollEvents.filter(
      (event) =>
        !playedEventIdsRef.current.has(event.id) &&
        !scheduledEventIdsRef.current.has(event.id)
    );

    if (unplayedEvents.length === 0) {
      return;
    }

    unplayedEvents.forEach((event) => {
      scheduledEventIdsRef.current = new Set(scheduledEventIdsRef.current).add(event.id);

      playbackQueueRef.current = playbackQueueRef.current
        .then(async () => {
          if (
            playedEventIdsRef.current.has(event.id) ||
            !scheduledEventIdsRef.current.has(event.id)
          ) {
            return;
          }

          if (!liveEventIdsRef.current.has(event.id)) {
            return;
          }

          const activeDiceBox = diceBoxRef.current;

          if (!activeDiceBox) {
            return;
          }

          const actorColor = event.actorColor || NEUTRAL_DICE_COLOR;
          const notation = buildRollNotation(event.outcomes);

          setError(null);
          if (fadeCleanupTimeoutRef.current !== null) {
            window.clearTimeout(fadeCleanupTimeoutRef.current);
            fadeCleanupTimeoutRef.current = null;
          }
          if (isOverlayFadingOut) {
            setIsOverlayFadingOut(false);
          }
          await activeDiceBox.updateConfig({
            theme_customColorset: createActorColorset(actorColor),
          });

          let playbackPromise: Promise<unknown>;

          if (sceneHasDiceRef.current) {
            playbackPromise = activeDiceBox.add(notation);
          } else {
            sceneHasDiceRef.current = true;
            playbackPromise = activeDiceBox.roll(notation);
          }

          await playbackPromise;

          playedEventIdsRef.current = new Set(playedEventIdsRef.current).add(event.id);
          scheduledEventIdsRef.current = new Set(scheduledEventIdsRef.current);
          scheduledEventIdsRef.current.delete(event.id);
          sceneEventIdsRef.current = new Set(sceneEventIdsRef.current).add(event.id);
        })
        .catch((rollError) => {
          scheduledEventIdsRef.current = new Set(scheduledEventIdsRef.current);
          scheduledEventIdsRef.current.delete(event.id);
          console.error("Failed to play shared dice roll", rollError);
          setError("Shared test roll failed.");
        });
    });
  }, [isReady, liveRollEvents]);

  const addDieToPendingPool = (rollKind: DiceTrayItem) => {
    setPendingPool((currentPool) => ({
      ...currentPool,
      [rollKind]: currentPool[rollKind] + 1,
    }));
  };

  const publishImmediateDieRoll = (rollKind: DiceTrayItem) => {
    const connection = diceConnectionRef.current;

    if (!connection || isPublishing) {
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const immediatePool = {
        ...createEmptyPendingPool(),
        [rollKind]: 1,
      };
      const rollEvent = createSharedRollEventFromPool({
        actorColor: participantSession.color,
        actorId: participantSession.id,
        actorName: participantSession.name,
        pendingPool: immediatePool,
        roomId,
      });

      connection.publishRollEvent({
        ...rollEvent,
      });
    } catch (publishError) {
      console.error("Failed to publish shared immediate roll", publishError);
      setError("Could not publish shared roll.");
    }

    window.setTimeout(() => {
      setIsPublishing(false);
    }, 200);
  };

  const resetPendingPool = () => {
    setPendingPool(createEmptyPendingPool());
  };

  const publishPendingPool = () => {
    const connection = diceConnectionRef.current;

    if (!connection || isPublishing || pendingDiceCount === 0) {
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const rollEvent = createSharedRollEventFromPool({
        actorColor: participantSession.color,
        actorId: participantSession.id,
        actorName: participantSession.name,
        pendingPool,
        roomId,
      });

      connection.publishRollEvent({
        ...rollEvent,
      });
      setPendingPool(createEmptyPendingPool());
    } catch (publishError) {
      console.error("Failed to publish shared pooled roll", publishError);
      setError("Could not publish shared roll.");
    }

    window.setTimeout(() => {
      setIsPublishing(false);
    }, 200);
  };

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          opacity: isOverlayFadingOut ? 0 : 1,
          transition: `opacity ${DICE_OVERLAY_FADE_MS}ms ease-out`,
          zIndex: 30,
        }}
      >
        <div
          id={containerId}
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            overflow: "hidden",
          }}
        />
      </div>

      <DiceRollLog
        entries={rollLogEntries}
        isExpanded={isRollLogExpanded}
        onToggleExpanded={() => {
          setIsRollLogExpanded((currentValue) => !currentValue);
        }}
      />

      <div
        style={boardSurfaceRecipes.diceTray.shell.style}
        {...getDesignSystemDebugAttrs(boardSurfaceRecipes.diceTray.shell.debug)}
      >
        {pendingDiceCount > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              pointerEvents: "auto",
            }}
          >
            <button
              type="button"
              onClick={publishPendingPool}
              disabled={!isReady || isPublishing}
              className={rollButtonRecipe.className}
              {...getDesignSystemDebugAttrs(rollButtonRecipe.debug)}
              style={{
                ...rollButtonRecipe.style,
                borderWidth: BOARD_SURFACE_CONTROL_BORDER_WIDTH,
                boxShadow: FLOATING_BUTTON_SHADOW,
              }}
            >
              Roll
            </button>

            <button
              type="button"
              onClick={resetPendingPool}
              disabled={isPublishing}
              className={resetButtonRecipe.className}
              {...getDesignSystemDebugAttrs(resetButtonRecipe.debug)}
              style={{
                ...resetButtonRecipe.style,
                borderWidth: BOARD_SURFACE_CONTROL_BORDER_WIDTH,
                boxShadow: FLOATING_BUTTON_SHADOW,
              }}
            >
              Reset
            </button>
          </div>
        )}

        <div
          style={boardSurfaceRecipes.diceTray.stack.style}
        >
          {DICE_TRAY_ITEMS.map((die) => (
            <div
              key={die}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                pointerEvents: "none",
              }}
            >
              <button
                type="button"
                onClick={(event) => {
                  if (event.shiftKey) {
                    publishImmediateDieRoll(die);
                    return;
                  }

                  addDieToPendingPool(die);
                }}
                disabled={!isReady}
                className={diceButtonRecipe.className}
                {...getDesignSystemDebugAttrs(diceButtonRecipe.debug)}
                style={{
                  ...diceButtonRecipe.style,
                  borderWidth: BOARD_SURFACE_CONTROL_BORDER_WIDTH,
                  boxShadow: FLOATING_BUTTON_SHADOW,
                  pointerEvents: "auto",
                }}
              >
                {die === "2d10" ? "d100" : die}
              </button>

              {pendingPool[die] > 0 && (
                <span
                  style={{
                    minWidth: 34,
                    padding: "2px 6px",
                    borderRadius: 999,
                    border: "1px solid rgba(248, 250, 252, 0.22)",
                    background: "rgba(15, 23, 42, 0.72)",
                    boxShadow:
                      "0 1px 2px rgba(2, 6, 23, 0.38), 0 0 0 1px rgba(255, 255, 255, 0.08) inset",
                    color: "rgba(248, 250, 252, 0.98)",
                    fontFamily: HTML_UI_FONT_FAMILY,
                    fontSize: fontSize.md,
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: "0",
                    textAlign: "center",
                    textShadow:
                      "0 1px 1px rgba(2, 6, 23, 0.85), 0 0 1px rgba(255, 255, 255, 0.18)",
                    backdropFilter: "blur(6px)",
                    pointerEvents: "none",
                  }}
                >
                  x{pendingPool[die]}
                </span>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div
            style={{
              pointerEvents: "none",
              maxWidth: 240,
              ...calloutRecipes.danger.compact.style,
            }}
            className={calloutRecipes.danger.compact.className}
            {...getDesignSystemDebugAttrs(calloutRecipes.danger.compact.debug)}
          >
            {error}
          </div>
        )}
      </div>
    </>
  );
}

function DiceRollLog({
  entries,
  isExpanded,
  onToggleExpanded,
}: {
  entries: DiceRollLogPanelEntry[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div style={diceRollLogOverlayStyle}>
      <DiceRollLogPanel
        entries={entries}
        isExpanded={isExpanded}
        maxExpandedHeight={`calc(100vh - ${DICE_ROLL_LOG_EDGE_OFFSET * 2}px)`}
        onToggleExpanded={onToggleExpanded}
      />
    </div>
  );
}

function createDiceRollLogEntry(event: SharedDiceRollEvent): DiceRollLogPanelEntry {
  return {
    id: event.id,
    actorName: event.actorName.trim() || "Player",
    actorColor: event.actorColor || NEUTRAL_DICE_COLOR,
    rollLabel: getDiceRollLogLabel(event),
    displayResults: getDiceRollLogDisplayResults(event),
  };
}

function getDiceRollLogLabel(event: SharedDiceRollEvent) {
  if (event.rollKind === "2d10") {
    return "d100";
  }

  const firstDie = event.outcomes[0]?.die;
  const isSingleDieKind =
    firstDie !== undefined &&
    event.outcomes.every((outcome) => outcome.die === firstDie);

  if (isSingleDieKind && firstDie !== undefined) {
    return event.outcomes.length > 1
      ? `${event.outcomes.length}${firstDie}`
      : firstDie;
  }

  return event.rollKind === "mixed" ? "mixed" : event.rollKind;
}

function getDiceRollLogDisplayResults(event: SharedDiceRollEvent) {
  const isOnlyD20 =
    event.outcomes.length > 0 &&
    event.outcomes.every((outcome) => outcome.die === "d20");
  const d20Values = event.outcomes
    .filter((outcome) => outcome.die === "d20")
    .map((outcome) => outcome.value);

  if (isOnlyD20 && d20Values.length > 1) {
    return [Math.min(...d20Values), Math.max(...d20Values)];
  }

  if (isOnlyD20 && d20Values.length === 1) {
    return d20Values;
  }

  return [event.result];
}

function createActorColorset(actorColor: string) {
  return {
    name: `actor-${actorColor.replace(/[^a-z0-9]/gi, "") || "neutral"}`,
    foreground: "#ffffff",
    background: actorColor || NEUTRAL_DICE_COLOR,
    outline: "#020617",
    edge: actorColor || NEUTRAL_DICE_COLOR,
    texture: "none",
    material: "glass",
  };
}

function createSharedRollEventFromPool(params: {
  actorColor: string;
  actorId: string;
  actorName: string;
  pendingPool: PendingDicePool;
  roomId: string;
}): SharedDiceRollEvent {
  const outcomes: DiceRollOutcome[] = [];
  const rollGroups: SharedRollKind[] = [];
  const logicalResults: number[] = [];

  DICE_TRAY_ITEMS.forEach((rollKind) => {
    const count = params.pendingPool[rollKind];

    for (let index = 0; index < count; index += 1) {
      if (rollKind === "2d10") {
        const percentile = Math.floor(Math.random() * 100) + 1;
        const onesDigit = percentile % 10;
        const tensDigit = Math.floor(percentile / 10) * 10;
        const tensValue = tensDigit === 0 ? 100 : tensDigit;
        const onesValue = onesDigit === 0 ? 10 : onesDigit;

        outcomes.push(
          { die: "d100", value: tensValue },
          { die: "d10", value: onesValue }
        );
        rollGroups.push(rollKind);
        logicalResults.push(percentile);
        continue;
      }

      const value = Math.floor(Math.random() * SINGLE_DIE_SIDES[rollKind]) + 1;

      outcomes.push({ die: rollKind, value });
      rollGroups.push(rollKind);
      logicalResults.push(value);
    }
  });

  if (outcomes.length === 0) {
    throw new Error("Cannot publish an empty dice pool.");
  }

  const uniqueRollKinds = Array.from(new Set(rollGroups));
  const rollKind =
    uniqueRollKinds.length === 1
      ? uniqueRollKinds[0]
      : ("mixed" as SharedRollKind);
  const result =
    logicalResults.length === 1
      ? logicalResults[0]
      : logicalResults.reduce((sum, value) => sum + value, 0);

  return {
    id: createClientId(),
    roomId: params.roomId,
    actorId: params.actorId,
    actorName: params.actorName,
    actorColor: params.actorColor,
    rollKind,
    outcomes,
    result,
    seed: createClientId(),
    createdAt: Date.now(),
    ttlMs: SHARED_ROLL_TTL_MS,
  };
}

function buildRollNotation(outcomes: DiceRollOutcome[]) {
  return `${outcomes.map((outcome) => outcome.die).join("+")}@${outcomes
    .map((outcome) => outcome.value)
    .join(",")}`;
}

function createEmptyPendingPool(): PendingDicePool {
  return {
    d4: 0,
    d6: 0,
    d8: 0,
    d10: 0,
    "2d10": 0,
    d12: 0,
    d20: 0,
  };
}
