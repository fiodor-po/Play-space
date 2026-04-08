import { AccessToken } from "livekit-server-sdk";

type TokenRequestBody = {
  roomId?: unknown;
  participantId?: unknown;
  participantName?: unknown;
};

export default {
  async fetch(request: Request) {
    if (request.method === "GET") {
      return jsonResponse(405, { error: "Method not allowed" });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed" });
    }

    const liveKitConfig = getLiveKitConfig();

    if (!liveKitConfig.enabled) {
      return jsonResponse(500, {
        error: getLiveKitDisabledReason(liveKitConfig),
        code: "LIVEKIT_DISABLED",
        liveKitCredentials: {
          apiKeyPresent: liveKitConfig.apiKeyPresent,
          apiSecretPresent: liveKitConfig.apiSecretPresent,
        },
      });
    }

    let parsedBody: unknown;

    try {
      parsedBody = await request.json();
    } catch {
      parsedBody = null;
    }

    const body = isRecord(parsedBody) ? (parsedBody as TokenRequestBody) : null;
    const roomId = typeof body?.roomId === "string" ? body.roomId.trim() : "";
    const participantId =
      typeof body?.participantId === "string" ? body.participantId.trim() : "";
    const participantName =
      typeof body?.participantName === "string" ? body.participantName.trim() : "";

    if (!roomId || !participantId || !participantName) {
      return jsonResponse(400, {
        error: "roomId, participantId, and participantName are required",
        code: "INVALID_LIVEKIT_TOKEN_REQUEST",
      });
    }

    const accessToken = new AccessToken(
      liveKitConfig.apiKey,
      liveKitConfig.apiSecret,
      {
        identity: participantId,
        name: participantName,
      },
    );

    accessToken.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
    });

    return jsonResponse(200, { token: await accessToken.toJwt() });
  },
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json",
    },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function getLiveKitConfig() {
  const apiKey = readEnvString("LIVEKIT_API_KEY");
  const apiSecret = readEnvString("LIVEKIT_API_SECRET");

  return {
    apiKey,
    apiSecret,
    apiKeyPresent: apiKey.length > 0,
    apiSecretPresent: apiSecret.length > 0,
    enabled: apiKey.length > 0 && apiSecret.length > 0,
  };
}

function getLiveKitDisabledReason(liveKitConfig: {
  apiKeyPresent: boolean;
  apiSecretPresent: boolean;
}) {
  if (!liveKitConfig.apiKeyPresent && !liveKitConfig.apiSecretPresent) {
    return "LiveKit credentials are not configured";
  }

  if (!liveKitConfig.apiKeyPresent) {
    return "LIVEKIT_API_KEY is not configured";
  }

  if (!liveKitConfig.apiSecretPresent) {
    return "LIVEKIT_API_SECRET is not configured";
  }

  return "LiveKit credentials are not configured";
}

function readEnvString(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
