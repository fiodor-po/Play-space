import { getApiServerBaseUrl, getLiveKitServerUrl } from "./runtimeConfig";

export type LiveKitTokenResponse = {
  token: string;
};

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
    let errorDetail = "";

    try {
      errorDetail = await response.text();
    } catch {
      errorDetail = "";
    }

    throw new Error(
      `Failed to load LiveKit token: ${response.status}${
        errorDetail ? ` ${errorDetail}` : ""
      }`
    );
  }

  const parsed = (await response.json()) as Partial<LiveKitTokenResponse>;

  if (!parsed.token || typeof parsed.token !== "string") {
    throw new Error("Invalid LiveKit token response");
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
