import { normalizeRoomId } from "../lib/roomId";

export type MediaDeviceStatePreference = {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
};

const MEDIA_DEVICE_STATE_STORAGE_PREFIX =
  "play-space-alpha-media-device-state-v1";

const DEFAULT_MEDIA_DEVICE_STATE: MediaDeviceStatePreference = {
  cameraEnabled: true,
  microphoneEnabled: true,
};

function getStorageKey(roomId: string, participantId: string) {
  return `${MEDIA_DEVICE_STATE_STORAGE_PREFIX}:${normalizeRoomId(
    roomId
  )}:${participantId}`;
}

function readStorageValue(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(key: string, value: MediaDeviceStatePreference) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local media preference is best-effort; media controls continue.
  }
}

export function readMediaDeviceStatePreference(
  roomId: string,
  participantId: string
): MediaDeviceStatePreference {
  const storedValue = readStorageValue(getStorageKey(roomId, participantId));

  if (!storedValue) {
    return DEFAULT_MEDIA_DEVICE_STATE;
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (
      parsedValue &&
      typeof parsedValue === "object" &&
      typeof parsedValue.cameraEnabled === "boolean" &&
      typeof parsedValue.microphoneEnabled === "boolean"
    ) {
      return {
        cameraEnabled: parsedValue.cameraEnabled,
        microphoneEnabled: parsedValue.microphoneEnabled,
      };
    }
  } catch {
    return DEFAULT_MEDIA_DEVICE_STATE;
  }

  return DEFAULT_MEDIA_DEVICE_STATE;
}

export function updateMediaDeviceStatePreference(
  roomId: string,
  participantId: string,
  preferencePatch: Partial<MediaDeviceStatePreference>
) {
  const currentPreference = readMediaDeviceStatePreference(roomId, participantId);

  writeStorageValue(getStorageKey(roomId, participantId), {
    ...currentPreference,
    ...preferencePatch,
  });
}
