import {
  getApiServerBaseUrl,
  getClientRuntimeDiagnostics,
} from "./runtimeConfig";
import { getRecentClientSessionErrors } from "./clientSessionErrorBuffer";

export type FeedbackCaptureType = "bug" | "feedback";

export type FeedbackCaptureRecentErrorEntry = {
  kind: string;
  message: string;
  source: string;
  timestamp: string;
};

export type FeedbackCapturePayload = {
  appVersionLabel: string;
  buildId: string;
  clientDiagnostics: {
    browser: {
      language: string | null;
      online: boolean;
      platform: string | null;
    };
    media: {
      cameraEnabled: boolean;
      connectionState: string;
      enabled: boolean;
      micEnabled: boolean;
    };
    recentErrors: FeedbackCaptureRecentErrorEntry[];
    room: {
      isRoomOwner: boolean;
      objectCounts: {
        images: number;
        textCards: number;
        tokens: number;
      };
      participantColor: string;
      participantCount: number;
      participantId: string;
      participantName: string;
      roomId: string;
    };
    runtime: ReturnType<typeof getClientRuntimeDiagnostics>;
    viewport: {
      devicePixelRatio: number;
      height: number;
      width: number;
    };
  };
  message: string;
  participant: {
    color: string;
    id: string;
    name: string;
  };
  path: string;
  roomId: string;
  timestamp: string;
  type: FeedbackCaptureType;
  userAgent: string;
};

export type FeedbackCaptureContext = {
  isRoomOwner: boolean;
  media: {
    cameraEnabled: boolean;
    connectionState: string;
    enabled: boolean;
    micEnabled: boolean;
  };
  room: {
    objectCounts: {
      images: number;
      textCards: number;
      tokens: number;
    };
    participantColor: string;
    participantCount: number;
    participantId: string;
    participantName: string;
    roomId: string;
  };
};

export function getFeedbackAppVersionLabel() {
  const configuredLabel = import.meta.env.VITE_APP_VERSION_LABEL;

  if (typeof configuredLabel === "string" && configuredLabel.trim()) {
    return configuredLabel.trim();
  }

  return __APP_VERSION_LABEL__.trim();
}

export function getFeedbackBuildId() {
  const configuredBuildId = import.meta.env.VITE_APP_BUILD_ID;

  if (typeof configuredBuildId === "string" && configuredBuildId.trim()) {
    return configuredBuildId.trim();
  }

  if (import.meta.env.DEV) {
    return `dev-local:${__APP_VERSION_LABEL__.trim()}`;
  }

  return `hosted-release-only:${__APP_VERSION_LABEL__.trim()}`;
}

export function buildFeedbackCapturePayload(params: {
  context: FeedbackCaptureContext;
  message: string;
  type: FeedbackCaptureType;
}): FeedbackCapturePayload {
  const timestamp = new Date().toISOString();
  const runtimeDiagnostics = getClientRuntimeDiagnostics();

  return {
    type: params.type,
    message: params.message,
    roomId: params.context.room.roomId,
    participant: {
      id: params.context.room.participantId,
      name: params.context.room.participantName,
      color: params.context.room.participantColor,
    },
    appVersionLabel: getFeedbackAppVersionLabel(),
    buildId: getFeedbackBuildId(),
    path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    userAgent: window.navigator.userAgent,
    timestamp,
    clientDiagnostics: {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      browser: {
        language: window.navigator.language || null,
        platform:
          typeof window.navigator.platform === "string" &&
          window.navigator.platform.trim()
            ? window.navigator.platform
            : null,
        online: window.navigator.onLine,
      },
      room: {
        roomId: params.context.room.roomId,
        participantId: params.context.room.participantId,
        participantName: params.context.room.participantName,
        participantColor: params.context.room.participantColor,
        isRoomOwner: params.context.isRoomOwner,
        participantCount: params.context.room.participantCount,
        objectCounts: params.context.room.objectCounts,
      },
      media: params.context.media,
      runtime: runtimeDiagnostics,
      recentErrors: getRecentClientSessionErrors(),
    },
  };
}

export async function submitFeedbackCapture(
  payload: FeedbackCapturePayload
) {
  const response = await fetch(new URL("/api/feedback", getApiServerBaseUrl()), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Feedback request failed with ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}
