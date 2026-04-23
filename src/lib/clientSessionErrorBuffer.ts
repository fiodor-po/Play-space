export type ClientSessionErrorKind = "window-error" | "unhandledrejection";

export type ClientSessionErrorEntry = {
  kind: ClientSessionErrorKind;
  message: string;
  source: string;
  timestamp: string;
};

const MAX_CLIENT_SESSION_ERRORS = 20;
const recentClientSessionErrors: ClientSessionErrorEntry[] = [];
let isInstalled = false;

function pushRecentClientSessionError(entry: ClientSessionErrorEntry) {
  recentClientSessionErrors.push(entry);

  if (recentClientSessionErrors.length > MAX_CLIENT_SESSION_ERRORS) {
    recentClientSessionErrors.splice(
      0,
      recentClientSessionErrors.length - MAX_CLIENT_SESSION_ERRORS
    );
  }
}

function getErrorMessage(value: unknown) {
  if (value instanceof Error) {
    return value.message || value.name || "Unknown error";
  }

  if (typeof value === "string") {
    return value.trim() || "Unknown error";
  }

  if (value === null || value === undefined) {
    return "Unknown error";
  }

  try {
    return JSON.stringify(value).slice(0, 500) || "Unknown error";
  } catch {
    return String(value).slice(0, 500) || "Unknown error";
  }
}

export function installClientSessionErrorBuffer() {
  if (isInstalled || typeof window === "undefined") {
    return;
  }

  isInstalled = true;

  window.addEventListener("error", (event) => {
    pushRecentClientSessionError({
      kind: "window-error",
      message: getErrorMessage(event.error ?? event.message),
      source: typeof event.filename === "string" && event.filename.trim()
        ? `${event.filename.trim()}:${event.lineno}:${event.colno}`
        : "window.error",
      timestamp: new Date().toISOString(),
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    pushRecentClientSessionError({
      kind: "unhandledrejection",
      message: getErrorMessage(event.reason),
      source: "window.unhandledrejection",
      timestamp: new Date().toISOString(),
    });
  });
}

export function getRecentClientSessionErrors() {
  return [...recentClientSessionErrors];
}
