export const AUDIO_METER_DEBUG_QUERY_PARAM = "audioMeterDebug";
export const FAKE_MIC_LEVEL_QUERY_PARAM = "fakeMicLevel";

function isQueryFlagEnabled(name: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get(name) === "1";
}

export function isAudioMeterDebugEnabled() {
  return isQueryFlagEnabled(AUDIO_METER_DEBUG_QUERY_PARAM);
}

export function isFakeMicrophoneLevelEnabled() {
  return isQueryFlagEnabled(FAKE_MIC_LEVEL_QUERY_PARAM);
}
