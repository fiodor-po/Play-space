import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createParticipantAccentButtonRecipe, buttonRecipes } from "../ui/system/families/button";
import { calloutRecipes } from "../ui/system/families/callout";
import { boardSurfaceRecipes } from "../ui/system/boardSurfaces";
import { getDesignSystemDebugAttrs } from "../ui/system/debug";
import { createClientId } from "../lib/id";
import {
  createRoomDiceConnection,
  type DiceRollOutcome,
  type RoomDiceConnection,
  type SharedDiceRollEvent,
  type SupportedRollKind,
  SUPPORTED_DICE,
} from "../lib/roomDiceRealtime";
import type { LocalParticipantSession } from "../lib/roomSession";

type DiceBoxModule = typeof import("@3d-dice/dice-box-threejs");
type DiceBoxInstance = InstanceType<DiceBoxModule["default"]>;

type DiceSpikeOverlayProps = {
  participantSession: LocalParticipantSession;
  roomId: string;
};

const NEUTRAL_DICE_COLOR = "#94a3b8";
const DICE_TRAY_ITEMS = ["d4", "d6", "d8", "d10", "2d10", "d12", "d20"] as const;
const SINGLE_DIE_SIDES: Record<(typeof SUPPORTED_DICE)[number], number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
};

export function DiceSpikeOverlay({
  participantSession,
  roomId,
}: DiceSpikeOverlayProps) {
  const diceButtonRecipe = useMemo(
    () =>
      createParticipantAccentButtonRecipe(
        buttonRecipes.secondary.small,
        participantSession.color
      ),
    [participantSession.color]
  );
  const containerId = useId().replace(/:/g, "-");
  const diceBoxRef = useRef<DiceBoxInstance | null>(null);
  const diceConnectionRef = useRef<RoomDiceConnection | null>(null);
  const clearTimeoutRef = useRef<number | null>(null);
  const cleanupTimeoutsRef = useRef<Record<string, number>>({});
  const lastPlayedEventIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rollEvents, setRollEvents] = useState<SharedDiceRollEvent[]>([]);

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
        nextDiceBox = new DiceBox(`#${containerId}`, {
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

        await nextDiceBox.initialize();

        const renderer = (nextDiceBox as DiceBoxInstance & {
          renderer?: { setPixelRatio?: (value: number) => void };
        }).renderer;

        renderer?.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, 2));

        if (isCancelled) {
          return;
        }

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

      if (clearTimeoutRef.current !== null) {
        window.clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = null;
      }

      Object.values(cleanupTimeoutsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      cleanupTimeoutsRef.current = {};

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
    lastPlayedEventIdRef.current = null;

    if (clearTimeoutRef.current !== null) {
      window.clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }

    Object.values(cleanupTimeoutsRef.current).forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    cleanupTimeoutsRef.current = {};
  }, [roomId]);

  const activeRollEvent = useMemo(() => {
    const now = Date.now();

    return [...rollEvents]
      .filter((event) => now - event.createdAt < event.ttlMs)
      .sort((left, right) => right.createdAt - left.createdAt)[0] ?? null;
  }, [rollEvents]);

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
    const diceBox = diceBoxRef.current;

    if (!diceBox || !activeRollEvent) {
      return;
    }

    if (lastPlayedEventIdRef.current === activeRollEvent.id) {
      return;
    }

    lastPlayedEventIdRef.current = activeRollEvent.id;

    if (clearTimeoutRef.current !== null) {
      window.clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }

    const actorColor = activeRollEvent.actorColor || NEUTRAL_DICE_COLOR;

    setError(null);
    void diceBox
      .updateConfig({
        theme_customColorset: createActorColorset(actorColor),
      })
      .then(() => diceBox.roll(buildRollNotation(activeRollEvent.outcomes)))
      .then(() => {
        const remainingMs =
          activeRollEvent.createdAt + activeRollEvent.ttlMs - Date.now();

        clearTimeoutRef.current = window.setTimeout(() => {
          diceBoxRef.current?.clearDice();
          clearTimeoutRef.current = null;
        }, Math.max(remainingMs, 0));
      })
      .catch((rollError) => {
        console.error("Failed to play shared d20 roll", rollError);
        setError("Shared test roll failed.");
      });
  }, [activeRollEvent, isReady]);

  const rollTestDie = (rollKind: SupportedRollKind) => {
    const connection = diceConnectionRef.current;

    if (!connection || isPublishing) {
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const rollEvent = createSharedRollEvent({
        actorColor: participantSession.color,
        actorId: participantSession.id,
        actorName: participantSession.name,
        roomId,
        rollKind,
      });

      connection.publishRollEvent({
        ...rollEvent,
      });
    } catch (publishError) {
      console.error("Failed to publish shared d20 roll", publishError);
      setError("Could not publish shared test roll.");
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

      <div
        style={boardSurfaceRecipes.diceTray.shell.style}
        {...getDesignSystemDebugAttrs(boardSurfaceRecipes.diceTray.shell.debug)}
      >
        <div
          style={boardSurfaceRecipes.diceTray.stack.style}
        >
          {DICE_TRAY_ITEMS.map((die) => (
            <button
              key={die}
              type="button"
              onClick={() => {
                rollTestDie(die);
              }}
              disabled={!isReady || isPublishing}
              className={diceButtonRecipe.className}
              {...getDesignSystemDebugAttrs(diceButtonRecipe.debug)}
              style={{
                ...diceButtonRecipe.style,
                pointerEvents: "auto",
              }}
            >
              {die === "2d10" ? "d100" : die}
            </button>
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

function createSharedRollEvent(params: {
  actorColor: string;
  actorId: string;
  actorName: string;
  roomId: string;
  rollKind: SupportedRollKind;
}): SharedDiceRollEvent {
  if (params.rollKind === "2d10") {
    const percentile = Math.floor(Math.random() * 100) + 1;
    const onesDigit = percentile % 10;
    const tensDigit = Math.floor(percentile / 10) * 10;
    const tensValue = tensDigit === 0 ? 100 : tensDigit;
    const onesValue = onesDigit === 0 ? 10 : onesDigit;

    return {
      id: createClientId(),
      roomId: params.roomId,
      actorId: params.actorId,
      actorName: params.actorName,
      actorColor: params.actorColor,
      rollKind: params.rollKind,
      outcomes: [
        { die: "d100", value: tensValue },
        { die: "d10", value: onesValue },
      ],
      result: percentile,
      seed: createClientId(),
      createdAt: Date.now(),
      ttlMs: 5200,
    };
  }

  const result = Math.floor(Math.random() * SINGLE_DIE_SIDES[params.rollKind]) + 1;

  return {
    id: createClientId(),
    roomId: params.roomId,
    actorId: params.actorId,
    actorName: params.actorName,
    actorColor: params.actorColor,
    rollKind: params.rollKind,
    outcomes: [{ die: params.rollKind, value: result }],
    result,
    seed: createClientId(),
    createdAt: Date.now(),
    ttlMs: 5200,
  };
}

function buildRollNotation(outcomes: DiceRollOutcome[]) {
  return `${outcomes.map((outcome) => outcome.die).join("+")}@${outcomes
    .map((outcome) => outcome.value)
    .join(",")}`;
}
