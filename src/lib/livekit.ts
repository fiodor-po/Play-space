import { getApiServerBaseUrl, getLiveKitServerUrl } from "./runtimeConfig";

export type LiveKitTokenResponse = {
  token: string;
};

export class LiveKitAccessTokenError extends Error {
  code: string | null;
  status: number | null;

  constructor(message: string, options?: { code?: string | null; status?: number | null }) {
    super(message);
    this.name = "LiveKitAccessTokenError";
    this.code = options?.code ?? null;
    this.status = options?.status ?? null;
  }
}

export async function fetchLiveKitAccessToken(params: {
  roomId: string;
  participantId: string;
  participantName: string;
}) {
  const payload = {
    roomId: params.roomId,
    participantId: params.participantId,
    participantName: params.participantName,
  };

  const response = await fetch(getLiveKitTokenUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorCode: string | null = null;
    let errorDetail = "";

    try {
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const parsedError = (await response.json()) as {
          error?: unknown;
          code?: unknown;
        };

        errorCode =
          typeof parsedError.code === "string" ? parsedError.code : null;
        errorDetail =
          typeof parsedError.error === "string" ? parsedError.error : "";
      } else {
        errorDetail = await response.text();
      }
    } catch {
      errorDetail = "";
    }

    throw new LiveKitAccessTokenError(
      `Failed to load LiveKit token: ${response.status}${
        errorDetail ? ` ${errorDetail}` : ""
      }`,
      {
        code: errorCode,
        status: response.status,
      }
    );
  }

  const parsed = (await response.json()) as Partial<LiveKitTokenResponse>;

  if (!parsed.token || typeof parsed.token !== "string") {
    throw new LiveKitAccessTokenError("Invalid LiveKit token response", {
      code: "INVALID_LIVEKIT_TOKEN_RESPONSE",
      status: response.status,
    });
  }

  return parsed.token;
}

export function getLiveKitUrl() {
  return getLiveKitServerUrl();
}

function getLiveKitTokenUrl() {
  return new URL("/api/livekit/token", getLiveKitApiServerUrl()).toString();
}

function getLiveKitApiServerUrl() {
  return getApiServerBaseUrl();
}
