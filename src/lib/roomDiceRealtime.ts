import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export const SUPPORTED_DICE = ["d4", "d6", "d8", "d10", "d12", "d20"] as const;
export const SUPPORTED_ROLL_KINDS = [...SUPPORTED_DICE, "2d10"] as const;

export type SupportedDie = (typeof SUPPORTED_DICE)[number];
export type SupportedRollKind = (typeof SUPPORTED_ROLL_KINDS)[number];
export type DiceOutcomeDie = SupportedDie | "d100";

export type DiceRollOutcome = {
  die: DiceOutcomeDie;
  value: number;
};

export type SharedDiceRollEvent = {
  id: string;
  roomId: string;
  actorId: string;
  actorName: string;
  actorColor: string;
  rollKind: SupportedRollKind;
  outcomes: DiceRollOutcome[];
  result: number;
  seed: string;
  createdAt: number;
  ttlMs: number;
};

export type RoomDiceConnection = {
  destroy: () => void;
  publishRollEvent: (event: SharedDiceRollEvent) => void;
  removeRollEvent: (eventId: string) => void;
};

export function createRoomDiceConnection(params: {
  roomId: string;
  onRollEventsChange: (events: SharedDiceRollEvent[]) => void;
  serverUrl?: string;
}): RoomDiceConnection {
  const doc = new Y.Doc();
  const serverUrl =
    params.serverUrl ??
    import.meta.env.VITE_Y_WEBSOCKET_URL ??
    getDefaultRealtimeWsUrl();
  const provider = new WebsocketProvider(
    serverUrl,
    `play-space-alpha-dice:${params.roomId}`,
    doc
  );
  const rollEventMap = doc.getMap<string>("dice-roll-events");

  const publishRollEvents = () => {
    params.onRollEventsChange(getRollEventsFromMap(rollEventMap));
  };

  const handleStatus = (event: {
    status: "connected" | "connecting" | "disconnected";
  }) => {
    if (import.meta.env.DEV) {
      console.info("[dice]", serverUrl, event.status);
    }
  };

  rollEventMap.observe(publishRollEvents);
  provider.on("status", handleStatus);
  publishRollEvents();

  return {
    destroy: () => {
      rollEventMap.unobserve(publishRollEvents);
      provider.off("status", handleStatus);
      provider.destroy();
      doc.destroy();
    },
    publishRollEvent: (event) => {
      rollEventMap.set(event.id, JSON.stringify(event));
    },
    removeRollEvent: (eventId) => {
      rollEventMap.delete(eventId);
    },
  };
}

function getRollEventsFromMap(rollEventMap: Y.Map<string>) {
  const events: SharedDiceRollEvent[] = [];

  rollEventMap.forEach((value) => {
    try {
      const event = JSON.parse(value) as Partial<SharedDiceRollEvent>;

      if (
        !event.id ||
        !event.roomId ||
        !event.actorId ||
        !event.actorName ||
        (!event.rollKind && !("die" in event)) ||
        typeof event.createdAt !== "number" ||
        typeof event.ttlMs !== "number"
      ) {
        return;
      }

      events.push({
        id: event.id,
        roomId: event.roomId,
        actorId: event.actorId,
        actorName: event.actorName,
        actorColor:
          typeof event.actorColor === "string" && event.actorColor.length > 0
            ? event.actorColor
            : "#94a3b8",
        rollKind: getRollKind(event),
        outcomes: getOutcomes(event),
        result: getResult(event),
        seed: typeof event.seed === "string" ? event.seed : event.id,
        createdAt: event.createdAt,
        ttlMs: event.ttlMs,
      });
    } catch {
      return;
    }
  });

  return events.sort((left, right) => left.createdAt - right.createdAt);
}

function getDefaultRealtimeWsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:1234`;
}

function isSupportedDie(value: unknown): value is SupportedDie {
  return typeof value === "string" && SUPPORTED_DICE.includes(value as SupportedDie);
}

function isSupportedRollKind(value: unknown): value is SupportedRollKind {
  return (
    typeof value === "string" &&
    SUPPORTED_ROLL_KINDS.includes(value as SupportedRollKind)
  );
}

function isDiceOutcomeDie(value: unknown): value is DiceOutcomeDie {
  return value === "d100" || isSupportedDie(value);
}

function isDiceRollOutcome(value: unknown): value is DiceRollOutcome {
  if (!value || typeof value !== "object") {
    return false;
  }

  const outcome = value as Partial<DiceRollOutcome>;

  return isDiceOutcomeDie(outcome.die) && typeof outcome.value === "number";
}

function getRollKind(event: Partial<SharedDiceRollEvent> & { die?: unknown }) {
  if (isSupportedRollKind(event.rollKind)) {
    return event.rollKind;
  }

  if (isSupportedDie(event.die)) {
    return event.die;
  }

  return "d20" satisfies SupportedRollKind;
}

function getOutcomes(
  event: Partial<SharedDiceRollEvent> & { die?: unknown; value?: unknown }
) {
  if (Array.isArray(event.outcomes)) {
    const outcomes = event.outcomes.filter(isDiceRollOutcome);

    if (outcomes.length > 0) {
      return outcomes;
    }
  }

  const fallbackDie = isSupportedDie(event.die) ? event.die : "d20";
  const fallbackValue = typeof event.value === "number" ? event.value : 1;

  return [{ die: fallbackDie, value: fallbackValue }] satisfies DiceRollOutcome[];
}

function getResult(
  event: Partial<SharedDiceRollEvent> & { value?: unknown }
) {
  if (typeof event.result === "number") {
    return event.result;
  }

  if (typeof event.value === "number") {
    return event.value;
  }

  return 1;
}
