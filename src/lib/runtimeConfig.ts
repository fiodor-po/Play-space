type RuntimeUrlSource = "env" | "derived-hostname";
type ApiUrlSource = "derived-realtime" | "derived-hostname";
type LiveKitTokenUrlSource = "env" | "derived-api";

const warnedRuntimeAssumptions = new Set<string>();
let hasLoggedClientRuntimeConfig = false;

export function getRealtimeServerWsUrl(explicitServerUrl?: string) {
  if (explicitServerUrl) {
    return explicitServerUrl;
  }

  const configuredUrl = import.meta.env.VITE_Y_WEBSOCKET_URL;

  if (typeof configuredUrl === "string" && configuredUrl.length > 0) {
    return configuredUrl;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const fallbackUrl = `${protocol}//${window.location.hostname}:1234`;
  warnRuntimeAssumptionOnce("realtime-fallback", "[runtime-config][realtime][fallback-url]", {
    fallbackUrl,
    reason: "VITE_Y_WEBSOCKET_URL is not configured",
  });
  return fallbackUrl;
}

export function getApiServerBaseUrl(explicitRealtimeServerUrl?: string) {
  const realtimeServerUrl =
    explicitRealtimeServerUrl ??
    (typeof import.meta.env.VITE_Y_WEBSOCKET_URL === "string"
      ? import.meta.env.VITE_Y_WEBSOCKET_URL
      : "");

  if (realtimeServerUrl.length > 0) {
    return realtimeServerUrl.replace(/^ws/i, "http");
  }

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const fallbackUrl = `${protocol}//${window.location.hostname}:1234`;
  warnRuntimeAssumptionOnce("api-fallback", "[runtime-config][api][fallback-url]", {
    fallbackUrl,
    reason: "VITE_Y_WEBSOCKET_URL is not configured",
  });
  return fallbackUrl;
}

export function getLiveKitServerUrl() {
  const configuredUrl = import.meta.env.VITE_LIVEKIT_URL;

  if (typeof configuredUrl === "string" && configuredUrl.length > 0) {
    return configuredUrl;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const fallbackUrl = `${protocol}//${window.location.hostname}:7880`;
  warnRuntimeAssumptionOnce("livekit-fallback", "[runtime-config][livekit][fallback-url]", {
    fallbackUrl,
    reason: "VITE_LIVEKIT_URL is not configured",
  });
  return fallbackUrl;
}

export function getLiveKitTokenUrl() {
  const configuredUrl = import.meta.env.VITE_LIVEKIT_TOKEN_URL;

  if (typeof configuredUrl === "string" && configuredUrl.length > 0) {
    return configuredUrl;
  }

  return new URL("/api/livekit/token", getApiServerBaseUrl()).toString();
}

export function isLiveKitMediaEnabled() {
  const configuredValue = import.meta.env.VITE_ENABLE_LIVEKIT_MEDIA;

  if (typeof configuredValue !== "string" || configuredValue.length === 0) {
    return true;
  }

  const normalizedValue = configuredValue.trim().toLowerCase();

  return !(
    normalizedValue === "0" ||
    normalizedValue === "false" ||
    normalizedValue === "off" ||
    normalizedValue === "no"
  );
}

export function logClientRuntimeConfig(roomId: string) {
  if (hasLoggedClientRuntimeConfig) {
    return;
  }

  hasLoggedClientRuntimeConfig = true;

  const realtimeUrl = getRealtimeServerWsUrl();
  const apiBaseUrl = getApiServerBaseUrl();
  const liveKitUrl = getLiveKitServerUrl();
  const liveKitTokenUrl = getLiveKitTokenUrl();
  const liveKitEnabled = isLiveKitMediaEnabled();

  console.info("[runtime-config][client]", {
    roomId,
    mode: import.meta.env.DEV ? "dev" : "hosted-like",
    origin: window.location.origin,
    realtimeUrl,
    realtimeUrlSource: getRealtimeUrlSource(),
    apiBaseUrl,
    apiBaseUrlSource: getApiBaseUrlSource(),
    liveKitUrl,
    liveKitUrlSource: getLiveKitUrlSource(),
    liveKitTokenUrl,
    liveKitTokenUrlSource: getLiveKitTokenUrlSource(),
    liveKitEnabled,
  });
}

function getRealtimeUrlSource(): RuntimeUrlSource {
  return typeof import.meta.env.VITE_Y_WEBSOCKET_URL === "string" &&
    import.meta.env.VITE_Y_WEBSOCKET_URL.length > 0
    ? "env"
    : "derived-hostname";
}

function getApiBaseUrlSource(): ApiUrlSource {
  return typeof import.meta.env.VITE_Y_WEBSOCKET_URL === "string" &&
    import.meta.env.VITE_Y_WEBSOCKET_URL.length > 0
    ? "derived-realtime"
    : "derived-hostname";
}

function getLiveKitUrlSource(): RuntimeUrlSource {
  return typeof import.meta.env.VITE_LIVEKIT_URL === "string" &&
    import.meta.env.VITE_LIVEKIT_URL.length > 0
    ? "env"
    : "derived-hostname";
}

function getLiveKitTokenUrlSource(): LiveKitTokenUrlSource {
  return typeof import.meta.env.VITE_LIVEKIT_TOKEN_URL === "string" &&
    import.meta.env.VITE_LIVEKIT_TOKEN_URL.length > 0
    ? "env"
    : "derived-api";
}

function warnRuntimeAssumptionOnce(
  key: string,
  label: string,
  details: Record<string, unknown>
) {
  if (warnedRuntimeAssumptions.has(key)) {
    return;
  }

  warnedRuntimeAssumptions.add(key);
  console.warn(label, details);
}
