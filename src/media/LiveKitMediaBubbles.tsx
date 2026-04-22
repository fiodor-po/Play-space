import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import {
  createAudioAnalyser,
  Track,
  type AudioTrack,
  type Participant,
} from "livekit-client";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { HTML_UI_FONT_FAMILY } from "../board/constants";
import {
  PARTICIPANT_AVATAR_FACE_IDS,
  type ParticipantAvatarFaceId,
} from "../lib/participantAvatarFaces";
import type {
  LocalParticipantSession,
  ParticipantPresenceMap,
  RoomOccupancyMap,
} from "../lib/roomSession";
import { normalizeRoomId } from "../lib/roomId";
import { ContextMenu, type ContextMenuItem } from "../ui/system/ContextMenu";
import {
  getParticipantAvatarFaceIconPixelSize,
  ParticipantAvatarFaceIcon,
} from "./ParticipantAvatarFaceIcon";
import {
  isAudioMeterDebugEnabled,
  isFakeMicrophoneLevelEnabled,
} from "./mediaDiagnostics";
import type { LiveKitMediaSession } from "./useLiveKitMediaSession";

type LiveKitMediaBubblesProps = {
  mediaSession: LiveKitMediaSession;
  participantPresences: ParticipantPresenceMap;
  participantSession: LocalParticipantSession;
  roomId: string;
  roomOccupancies: RoomOccupancyMap;
  onUpdateParticipantSession: (
    updater: (session: LocalParticipantSession) => LocalParticipantSession
  ) => void;
  resetVideoPositionsRevision: number;
};

type MediaBubbleParticipant = {
  id: string;
  name: string;
  color: string;
  avatarFaceId?: ParticipantAvatarFaceId;
  isLocal: boolean;
};

type MediaBubbleProps = {
  audioMeterDebugEnabled: boolean;
  onAudioMeterDebugStateChange?: (
    participantId: string,
    state: AudioMeterDebugDisplayState | null
  ) => void;
  liveKitParticipant: Participant | null;
  mediaSession: LiveKitMediaSession;
  onLocalAvatarContextMenu?: (
    event: MouseEvent<HTMLDivElement>,
    participant: MediaBubbleParticipant
  ) => void;
  participant: MediaBubbleParticipant;
  size: number;
};

type BubblePosition = {
  x: number;
  y: number;
};

type BubbleDragState = {
  participantId: string;
  pointerId: number;
  startPointerX: number;
  startPointerY: number;
  size: number;
  startX: number;
  startY: number;
  wasPositioned: boolean;
};

type BubbleResizeState = {
  participantId: string;
  pointerId: number;
  anchorOffsetX: number;
  anchorOffsetY: number;
  anchorX: number;
  anchorY: number;
  circleOffsetX: number;
  circleOffsetY: number;
  cursor: string;
  minSize: number;
  maxSize: number;
  startSize: number;
  startX: number;
  startY: number;
  wasPositioned: boolean;
};

type BubbleResizeResult = {
  position: BubblePosition;
  size: number;
};

type BubbleDragOffset = {
  participantId: string;
  x: number;
  y: number;
};

type BubbleResizePreview = {
  cursor: string;
  participantId: string;
  position: BubblePosition;
  size: number;
};

type BubbleResizeHover = {
  cursor: string;
  participantId: string;
};

type AvatarFaceContextMenuState = {
  clientX: number;
  clientY: number;
} | null;

type AudioTrackLevelDebugState = {
  audioContextState: string;
  enabled: boolean;
  fakePhase: AudioMeterPhase;
  gatedRms: number;
  hasAudioTrack: boolean;
  level: number;
  mediaStreamTrackState: string;
  noiseFloor: number;
  rms: number;
};

type AudioMeterDebugDisplayState = {
  audioContextState: string;
  enabled: boolean;
  gatedRms: number;
  hasAudioTrack: boolean;
  level: number;
  mediaStreamTrackState: string;
  noiseFloor: number;
  phase: AudioMeterPhase;
  ringWidth: number;
  rms: number;
  source: "fake" | "real";
  visualLevel: number;
  visualSource: "webaudio";
};

type FakeMicrophoneLevelSource = {
  audioContext: AudioContext;
  gainNode: GainNode;
  oscillatorNode: OscillatorNode;
  phase: AudioMeterPhase;
  track: MediaStreamTrack;
};

type AudioMeterPhase = "silent" | "low" | "medium" | "high";

const REMOTE_BUBBLE_SIZE = 96;
const LOCAL_BUBBLE_SIZE = Math.round(REMOTE_BUBBLE_SIZE * 1.2);
const BUBBLE_SLOT_WIDTH = 132;
const BUBBLE_SLOT_EXTRA_WIDTH = BUBBLE_SLOT_WIDTH - LOCAL_BUBBLE_SIZE;
const BUBBLE_SLOT_HEIGHT = 176;
const MEDIA_BUBBLES_STORAGE_PREFIX = "play-space-alpha-media-bubbles-v1";
const MEDIA_BUBBLES_SIZE_STORAGE_PREFIX =
  "play-space-alpha-media-bubble-sizes-v1";
const LOCAL_MEDIA_CONTROL_SIZE = 30;
const LOCAL_MEDIA_CONTROL_ICON_SIZE = 16;
const LOCAL_MEDIA_CONTROL_ICON_STROKE_WIDTH = 2.25;
const LOCAL_MEDIA_CONTROL_GROUP_ANGLE_DEGREES = 25;
const LOCAL_MEDIA_CONTROL_CENTER_GAP = 42;
const BUBBLE_RING_WIDTH = 4;
const AUDIO_ACTIVITY_RING_MAX_WIDTH = 12;
const AUDIO_ACTIVITY_RING_ALPHA = 0.7;
const AVATAR_AUDIO_PULSE_OPACITY_BASE = 0.167;
const AVATAR_AUDIO_PULSE_OPACITY_GAIN = 0.3;
const AVATAR_AUDIO_PULSE_STROKE_BASE_WIDTH = 1.8;
const AVATAR_AUDIO_PULSE_STROKE_WIDTH = 5;
const AVATAR_AUDIO_PULSE_LEVEL_ATTACK_EASING = 0.12;
const AVATAR_AUDIO_PULSE_LEVEL_RELEASE_EASING = 0.08;
const AVATAR_AUDIO_PULSE_TRANSITION = "opacity 180ms ease-out, stroke-width 180ms ease-out";
const VIDEO_AUDIO_RING_LEVEL_ATTACK_EASING = AVATAR_AUDIO_PULSE_LEVEL_ATTACK_EASING;
const VIDEO_AUDIO_RING_LEVEL_RELEASE_EASING = AVATAR_AUDIO_PULSE_LEVEL_RELEASE_EASING;
const VIDEO_AUDIO_RING_TRANSITION = "box-shadow 180ms ease-out";
const AUDIO_ACTIVITY_THRESHOLD = 0.02;
const VIDEO_AUDIO_ACTIVITY_THRESHOLD = 0.02;
const AUDIO_ACTIVITY_CURVE_EXPONENT = 0.45;
const AUDIO_ACTIVITY_MIN_ACTIVE_WIDTH = 1.5;
const AUDIO_LEVEL_ATTACK_EASING = 0.24;
const AUDIO_LEVEL_RELEASE_EASING = 0.18;
const AUDIO_LEVEL_UPDATE_INTERVAL_MS = 50;
const AUDIO_RMS_NOISE_FLOOR_MIN = 0.016;
const AUDIO_RMS_NOISE_FLOOR_MAX = 0.07;
const AUDIO_RMS_NOISE_MARGIN = 0.012;
const AUDIO_RMS_NOISE_FLOOR_RISE_EASING = 0.004;
const AUDIO_RMS_NOISE_FLOOR_FALL_EASING = 0.12;
const AUDIO_LEVEL_GAIN = 44;
const AUDIO_LEVEL_GAIN_REDUCED_BROWSER_MULTIPLIER = 2 / 3;
const MEDIA_BUBBLE_CIRCLE_SELECTOR = "[data-media-bubble-circle]";
const BUBBLE_RESIZE_HIT_BAND_WIDTH = 12;
const BUBBLE_MAX_SIZE = 720;
const AVATAR_FACE_CONTEXT_MENU_GRID_ITEM_SIZE = 38;
const AVATAR_FACE_CONTEXT_MENU_GRID_GAP = 5;
const AVATAR_FACE_CONTEXT_MENU_SHELL_INLINE_PADDING = 12;
const AVATAR_FACE_CONTEXT_MENU_COLUMN_COUNT = 4;
const AVATAR_FACE_CONTEXT_MENU_WIDTH =
  AVATAR_FACE_CONTEXT_MENU_COLUMN_COUNT * AVATAR_FACE_CONTEXT_MENU_GRID_ITEM_SIZE +
  (AVATAR_FACE_CONTEXT_MENU_COLUMN_COUNT - 1) *
    AVATAR_FACE_CONTEXT_MENU_GRID_GAP +
  AVATAR_FACE_CONTEXT_MENU_SHELL_INLINE_PADDING;

function getLocalMediaControlPosition(angleDegrees: number, bubbleSize: number) {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const bubbleCenter = bubbleSize / 2;
  const controlCenter = LOCAL_MEDIA_CONTROL_SIZE / 2;
  const controlRadius = bubbleSize / 2 - BUBBLE_RING_WIDTH / 2;

  return {
    right: Math.round(
      bubbleSize -
        (bubbleCenter + controlRadius * Math.cos(angleRadians)) -
        controlCenter
    ),
    bottom: Math.round(
      bubbleSize -
        (bubbleCenter + controlRadius * Math.sin(angleRadians)) -
        controlCenter
    ),
  };
}

function getLocalMediaControlPositions(bubbleSize: number) {
  const radius = bubbleSize / 2;
  const halfGap = LOCAL_MEDIA_CONTROL_CENTER_GAP / 2;
  const angleOffsetRadians = Math.asin(clamp(halfGap / radius, 0, 0.95));
  const angleOffsetDegrees = (angleOffsetRadians * 180) / Math.PI;

  return {
    camera: getLocalMediaControlPosition(
      LOCAL_MEDIA_CONTROL_GROUP_ANGLE_DEGREES - angleOffsetDegrees,
      bubbleSize
    ),
    microphone: getLocalMediaControlPosition(
      LOCAL_MEDIA_CONTROL_GROUP_ANGLE_DEGREES + angleOffsetDegrees,
      bubbleSize
    ),
  };
}

function getParticipantInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[1]?.[0] ?? "" : "";

  return `${first}${second}`.toUpperCase();
}

function stopBubbleControlPointerEvent(event: React.SyntheticEvent) {
  event.stopPropagation();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getColorWithAlpha(color: string, alpha: number) {
  const hexMatch = color.trim().match(/^#([0-9a-f]{6})$/i);

  if (!hexMatch) {
    return color;
  }

  const hexValue = hexMatch[1];
  const red = Number.parseInt(hexValue.slice(0, 2), 16);
  const green = Number.parseInt(hexValue.slice(2, 4), 16);
  const blue = Number.parseInt(hexValue.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.AudioContext ||
    (
      window as Window &
        typeof globalThis & {
          webkitAudioContext?: typeof AudioContext;
        }
    ).webkitAudioContext ||
    null
  );
}

function getLiveKitAudioMediaStreamTrack(audioTrack: AudioTrack | null) {
  if (!audioTrack) {
    return null;
  }

  const trackWithMediaStreamTrack = audioTrack as AudioTrack & {
    mediaStreamTrack?: MediaStreamTrack;
  };

  return trackWithMediaStreamTrack.mediaStreamTrack ?? null;
}

function getAudioLevelGain() {
  if (typeof navigator === "undefined") {
    return AUDIO_LEVEL_GAIN;
  }

  const userAgent = navigator.userAgent;
  const isFirefox = userAgent.includes("Firefox/");
  const isSafari =
    userAgent.includes("Safari/") &&
    !userAgent.includes("Chrome/") &&
    !userAgent.includes("Chromium/") &&
    !userAgent.includes("CriOS/") &&
    !userAgent.includes("Edg/");

  return isFirefox || isSafari
    ? AUDIO_LEVEL_GAIN * AUDIO_LEVEL_GAIN_REDUCED_BROWSER_MULTIPLIER
    : AUDIO_LEVEL_GAIN;
}

function createFakeMicrophoneLevelSource(): FakeMicrophoneLevelSource | null {
  const AudioContextConstructor = getAudioContextConstructor();

  if (!AudioContextConstructor) {
    return null;
  }

  const audioContext = new AudioContextConstructor();
  const oscillatorNode = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const destinationNode = audioContext.createMediaStreamDestination();
  const generatedTrack = destinationNode.stream.getAudioTracks()[0] ?? null;

  if (!generatedTrack) {
    oscillatorNode.disconnect();
    gainNode.disconnect();
    void audioContext.close();
    return null;
  }

  oscillatorNode.type = "sine";
  oscillatorNode.frequency.value = 220;
  gainNode.gain.setValueAtTime(0.02, audioContext.currentTime);
  oscillatorNode.connect(gainNode);
  gainNode.connect(destinationNode);
  oscillatorNode.start();

  console.info("[media-bubbles][fake-mic]", {
    enabled: true,
    audioContextState: audioContext.state,
    trackReadyState: generatedTrack.readyState,
  });

  return {
    audioContext,
    gainNode,
    oscillatorNode,
    phase: "silent",
    track: generatedTrack,
  };
}

function getFakeMicrophonePhase(elapsedMs: number): {
  gain: number;
  phase: AudioMeterPhase;
} {
  const cycleMs = elapsedMs % 4_000;

  if (cycleMs < 500) {
    return { gain: 0, phase: "silent" };
  }

  if (cycleMs < 1_500) {
    return { gain: 0.038, phase: "low" };
  }

  if (cycleMs < 2_500) {
    return { gain: 0.07, phase: "medium" };
  }

  if (cycleMs < 3_500) {
    return { gain: 0.16, phase: "high" };
  }

  return { gain: 0, phase: "silent" };
}

function useFakeMicrophoneLevelSource(enabled: boolean) {
  const [track, setTrack] = useState<MediaStreamTrack | null>(null);
  const [phase, setPhase] = useState<AudioMeterPhase>("silent");

  useEffect(() => {
    if (!enabled) {
      setTrack(null);
      setPhase("silent");
      return;
    }

    const fakeSource = createFakeMicrophoneLevelSource();

    if (!fakeSource) {
      setTrack(null);
      setPhase("silent");
      return;
    }

    let animationFrameId: number | null = null;
    const startedAt = performance.now();
    let lastPhase: AudioMeterPhase = "silent";

    const pulseGain = (timestamp: number) => {
      const time = fakeSource.audioContext.currentTime;
      const nextPhase = getFakeMicrophonePhase(timestamp - startedAt);
      fakeSource.gainNode.gain.setTargetAtTime(
        nextPhase.gain,
        time,
        0.03
      );

      if (nextPhase.phase !== lastPhase) {
        lastPhase = nextPhase.phase;
        setPhase(nextPhase.phase);
      }

      animationFrameId = window.requestAnimationFrame(pulseGain);
    };

    void fakeSource.audioContext.resume();
    animationFrameId = window.requestAnimationFrame(pulseGain);
    setTrack(fakeSource.track);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      fakeSource.oscillatorNode.stop();
      fakeSource.oscillatorNode.disconnect();
      fakeSource.gainNode.disconnect();
      fakeSource.track.stop();
      void fakeSource.audioContext.close();
      setTrack(null);
      setPhase("silent");
    };
  }, [enabled]);

  return { phase, track };
}

function useAudioTrackLevel(
  audioTrack: AudioTrack | null,
  {
    enabled,
    fakePhase = "silent",
    overrideMediaStreamTrack = null,
  }: {
    enabled: boolean;
    fakePhase?: AudioMeterPhase;
    overrideMediaStreamTrack?: MediaStreamTrack | null;
  }
) {
  const [debugState, setDebugState] = useState<AudioTrackLevelDebugState>({
    audioContextState: "idle",
    enabled,
    fakePhase,
    gatedRms: 0,
    hasAudioTrack: false,
    level: 0,
    mediaStreamTrackState: "none",
    noiseFloor: 0,
    rms: 0,
  });
  const fakePhaseRef = useRef(fakePhase);

  useEffect(() => {
    fakePhaseRef.current = fakePhase;
    setDebugState((currentState) => ({
      ...currentState,
      fakePhase,
    }));
  }, [fakePhase]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setDebugState({
        audioContextState: "disabled",
        enabled,
        fakePhase: fakePhaseRef.current,
        gatedRms: 0,
        hasAudioTrack: audioTrack !== null,
        level: 0,
        mediaStreamTrackState: "none",
        noiseFloor: 0,
        rms: 0,
      });
      return;
    }

    const mediaStreamTrack =
      overrideMediaStreamTrack ?? getLiveKitAudioMediaStreamTrack(audioTrack);

    if (!mediaStreamTrack || mediaStreamTrack.readyState !== "live") {
      setDebugState({
        audioContextState: "no-track",
        enabled,
        fakePhase: fakePhaseRef.current,
        gatedRms: 0,
        hasAudioTrack: audioTrack !== null,
        level: 0,
        mediaStreamTrackState: mediaStreamTrack?.readyState ?? "none",
        noiseFloor: 0,
        rms: 0,
      });
      return;
    }

    const AudioContextConstructor =
      window.AudioContext ||
      (
        window as Window &
          typeof globalThis & {
            webkitAudioContext?: typeof AudioContext;
          }
      ).webkitAudioContext;

    if (!AudioContextConstructor) {
      setDebugState({
        audioContextState: "unsupported",
        enabled,
        fakePhase: fakePhaseRef.current,
        gatedRms: 0,
        hasAudioTrack: true,
        level: 0,
        mediaStreamTrackState: mediaStreamTrack.readyState,
        noiseFloor: 0,
        rms: 0,
      });
      return;
    }

    let animationFrameId: number | null = null;
    let audioContext: AudioContext | null = null;
    let sourceNode: MediaStreamAudioSourceNode | null = null;
    let analyserNode: AnalyserNode | null = null;
    let liveKitAudioAnalyser: ReturnType<typeof createAudioAnalyser> | null =
      null;
    let lastUpdateAt = 0;
    const audioLevelGain = getAudioLevelGain();
    let noiseFloor = AUDIO_RMS_NOISE_FLOOR_MIN;
    let smoothedLevel = 0;

    try {
      if (!overrideMediaStreamTrack && audioTrack) {
        liveKitAudioAnalyser = createAudioAnalyser(audioTrack, {
          cloneTrack: true,
          fftSize: 1024,
          maxDecibels: -35,
          minDecibels: -95,
          smoothingTimeConstant: 0.2,
        });

        const liveKitAudioContext = liveKitAudioAnalyser.analyser.context;

        if ("resume" in liveKitAudioContext) {
          void (liveKitAudioContext as AudioContext).resume();
        }

        const updateLevel = (timestamp: number) => {
          if (!liveKitAudioAnalyser || mediaStreamTrack.readyState !== "live") {
            setDebugState({
              audioContextState:
                liveKitAudioAnalyser?.analyser.context.state ?? "missing",
              enabled,
              fakePhase: fakePhaseRef.current,
              gatedRms: 0,
              hasAudioTrack: true,
              level: 0,
              mediaStreamTrackState: mediaStreamTrack.readyState,
              noiseFloor,
              rms: 0,
            });
            return;
          }

          const rms = liveKitAudioAnalyser.calculateVolume();
          const noiseFloorTarget = clamp(
            rms,
            AUDIO_RMS_NOISE_FLOOR_MIN,
            AUDIO_RMS_NOISE_FLOOR_MAX
          );
          const noiseFloorEasing =
            noiseFloorTarget > noiseFloor
              ? AUDIO_RMS_NOISE_FLOOR_RISE_EASING
              : AUDIO_RMS_NOISE_FLOOR_FALL_EASING;
          noiseFloor += (noiseFloorTarget - noiseFloor) * noiseFloorEasing;

          const gatedRms = Math.max(0, rms - noiseFloor - AUDIO_RMS_NOISE_MARGIN);
          const nextLevel = clamp(gatedRms * audioLevelGain, 0, 1);
          const easing =
            nextLevel > smoothedLevel
              ? AUDIO_LEVEL_ATTACK_EASING
              : AUDIO_LEVEL_RELEASE_EASING;
          smoothedLevel += (nextLevel - smoothedLevel) * easing;

          if (timestamp - lastUpdateAt >= AUDIO_LEVEL_UPDATE_INTERVAL_MS) {
            lastUpdateAt = timestamp;
            setDebugState({
              audioContextState: liveKitAudioAnalyser.analyser.context.state,
              enabled,
              fakePhase: fakePhaseRef.current,
              gatedRms,
              hasAudioTrack: true,
              level: smoothedLevel,
              mediaStreamTrackState: mediaStreamTrack.readyState,
              noiseFloor,
              rms,
            });
          }

          animationFrameId = window.requestAnimationFrame(updateLevel);
        };

        animationFrameId = window.requestAnimationFrame(updateLevel);

        return () => {
          if (animationFrameId !== null) {
            window.cancelAnimationFrame(animationFrameId);
          }

          void liveKitAudioAnalyser?.cleanup();

          setDebugState({
            audioContextState: "closed",
            enabled: false,
            fakePhase: "silent",
            gatedRms: 0,
            hasAudioTrack: false,
            level: 0,
            mediaStreamTrackState: "none",
            noiseFloor: 0,
            rms: 0,
          });
        };
      }

      audioContext = new AudioContextConstructor();
      void audioContext.resume();
      const mediaStream = new MediaStream([mediaStreamTrack]);
      sourceNode = audioContext.createMediaStreamSource(mediaStream);
      analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 512;
      analyserNode.smoothingTimeConstant = 0;
      sourceNode.connect(analyserNode);
      const samples = new Uint8Array(analyserNode.fftSize);

      const updateLevel = (timestamp: number) => {
        if (!analyserNode || mediaStreamTrack.readyState !== "live") {
          setDebugState({
            audioContextState: audioContext?.state ?? "missing",
            enabled,
            fakePhase: fakePhaseRef.current,
            gatedRms: 0,
            hasAudioTrack: true,
            level: 0,
            mediaStreamTrackState: mediaStreamTrack.readyState,
            noiseFloor,
            rms: 0,
          });
          return;
        }

        analyserNode.getByteTimeDomainData(samples);

        let sumSquares = 0;

        samples.forEach((sample) => {
          const normalizedSample = (sample - 128) / 128;
          sumSquares += normalizedSample * normalizedSample;
        });

        const rms = Math.sqrt(sumSquares / samples.length);
        const noiseFloorTarget = clamp(
          rms,
          AUDIO_RMS_NOISE_FLOOR_MIN,
          AUDIO_RMS_NOISE_FLOOR_MAX
        );
        const noiseFloorEasing =
          noiseFloorTarget > noiseFloor
            ? AUDIO_RMS_NOISE_FLOOR_RISE_EASING
            : AUDIO_RMS_NOISE_FLOOR_FALL_EASING;
        noiseFloor += (noiseFloorTarget - noiseFloor) * noiseFloorEasing;

        const gatedRms = Math.max(0, rms - noiseFloor - AUDIO_RMS_NOISE_MARGIN);
        const nextLevel = clamp(gatedRms * audioLevelGain, 0, 1);
        const easing =
          nextLevel > smoothedLevel
            ? AUDIO_LEVEL_ATTACK_EASING
            : AUDIO_LEVEL_RELEASE_EASING;
        smoothedLevel += (nextLevel - smoothedLevel) * easing;

        if (timestamp - lastUpdateAt >= AUDIO_LEVEL_UPDATE_INTERVAL_MS) {
          lastUpdateAt = timestamp;
          setDebugState({
            audioContextState: audioContext?.state ?? "missing",
            enabled,
            fakePhase: fakePhaseRef.current,
            gatedRms,
            hasAudioTrack: true,
            level: smoothedLevel,
            mediaStreamTrackState: mediaStreamTrack.readyState,
            noiseFloor,
            rms,
          });
        }

        animationFrameId = window.requestAnimationFrame(updateLevel);
      };

      animationFrameId = window.requestAnimationFrame(updateLevel);
    } catch {
      setDebugState({
        audioContextState: "error",
        enabled,
        fakePhase: fakePhaseRef.current,
        gatedRms: 0,
        hasAudioTrack: true,
        level: 0,
        mediaStreamTrackState: mediaStreamTrack.readyState,
        noiseFloor: 0,
        rms: 0,
      });
    }

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      sourceNode?.disconnect();
      analyserNode?.disconnect();

      if (audioContext && audioContext.state !== "closed") {
        void audioContext.close();
      }

      setDebugState({
        audioContextState: "closed",
        enabled: false,
        fakePhase: "silent",
        gatedRms: 0,
        hasAudioTrack: false,
        level: 0,
        mediaStreamTrackState: "none",
        noiseFloor: 0,
        rms: 0,
      });
    };
  }, [audioTrack, enabled, overrideMediaStreamTrack]);

  return debugState;
}

function getAudioActivityRingWidth(
  level: number,
  threshold = AUDIO_ACTIVITY_THRESHOLD
) {
  const clampedLevel = clamp(level, 0, 1);

  if (clampedLevel < threshold) {
    return 0;
  }

  const activeLevel = clamp(
    (clampedLevel - threshold) / (1 - threshold),
    0,
    1
  );

  return Math.max(
    AUDIO_ACTIVITY_MIN_ACTIVE_WIDTH,
    activeLevel ** AUDIO_ACTIVITY_CURVE_EXPONENT *
      AUDIO_ACTIVITY_RING_MAX_WIDTH
  );
}

function isPointerInsideBubbleCircle(event: React.PointerEvent<HTMLElement>) {
  const metrics = getBubbleCirclePointerMetrics(event);

  return metrics !== null && metrics.distanceFromCenter <= metrics.radius;
}

function isPointerOnBubbleResizeRing(event: React.PointerEvent<HTMLElement>) {
  const metrics = getBubbleCirclePointerMetrics(event);

  if (!metrics || metrics.distanceFromCenter > metrics.radius) {
    return false;
  }

  return (
    metrics.distanceFromCenter >=
    metrics.radius - Math.max(BUBBLE_RING_WIDTH, BUBBLE_RESIZE_HIT_BAND_WIDTH)
  );
}

function getBubbleCirclePointerMetrics(event: React.PointerEvent<HTMLElement>) {
  const target = event.target;

  if (!(target instanceof Element)) {
    return null;
  }

  const circleElement = target.closest(MEDIA_BUBBLE_CIRCLE_SELECTOR);

  if (!(circleElement instanceof HTMLElement)) {
    return null;
  }

  const rect = circleElement.getBoundingClientRect();
  const radius = rect.width / 2;
  const centerX = rect.left + radius;
  const centerY = rect.top + rect.height / 2;
  const distanceFromCenter = Math.hypot(
    event.clientX - centerX,
    event.clientY - centerY
  );

  return {
    centerX,
    centerY,
    circleLeft: rect.left,
    circleTop: rect.top,
    distanceFromCenter,
    radius,
  };
}

function getResizeDirectionFromPointer(
  event: React.PointerEvent<HTMLElement>,
  centerX: number,
  centerY: number
) {
  const rawX = event.clientX - centerX;
  const rawY = event.clientY - centerY;
  const absX = Math.abs(rawX);
  const absY = Math.abs(rawY);
  const sideBias = 1.8;

  if (absX > absY * sideBias) {
    return {
      x: rawX >= 0 ? 1 : -1,
      y: 0,
    };
  }

  if (absY > absX * sideBias) {
    return {
      x: 0,
      y: rawY >= 0 ? 1 : -1,
    };
  }

  return {
    x: rawX >= 0 ? 1 : -1,
    y: rawY >= 0 ? 1 : -1,
  };
}

function getBubbleResizeCursor(direction: { x: number; y: number }) {
  if (direction.y === 0) {
    return "ew-resize";
  }

  if (direction.x === 0) {
    return "ns-resize";
  }

  return direction.x === direction.y ? "nwse-resize" : "nesw-resize";
}

function getBubbleResizeCursorFromPointer(event: React.PointerEvent<HTMLElement>) {
  const metrics = getBubbleCirclePointerMetrics(event);

  if (!metrics || !isPointerOnBubbleResizeRing(event)) {
    return null;
  }

  return getBubbleResizeCursor(
    getResizeDirectionFromPointer(event, metrics.centerX, metrics.centerY)
  );
}

function createBubbleResizeState({
  currentPosition,
  currentSize,
  event,
  maxSize,
  metrics,
  minSize,
  participantId,
  pointerId,
  wasPositioned,
}: {
  currentPosition: BubblePosition;
  currentSize: number;
  event: React.PointerEvent<HTMLElement>;
  maxSize: number;
  metrics: NonNullable<ReturnType<typeof getBubbleCirclePointerMetrics>>;
  minSize: number;
  participantId: string;
  pointerId: number;
  wasPositioned: boolean;
}): BubbleResizeState {
  const direction = getResizeDirectionFromPointer(
    event,
    metrics.centerX,
    metrics.centerY
  );
  const anchorOffsetX = direction.x === 0 ? 0.5 : direction.x > 0 ? 0 : 1;
  const anchorOffsetY = direction.y === 0 ? 0.5 : direction.y > 0 ? 0 : 1;
  const circleOffsetX = metrics.circleLeft - currentPosition.x;
  const circleOffsetY = metrics.circleTop - currentPosition.y;

  return {
    participantId,
    pointerId,
    anchorOffsetX,
    anchorOffsetY,
    anchorX: metrics.circleLeft + currentSize * anchorOffsetX,
    anchorY: metrics.circleTop + currentSize * anchorOffsetY,
    circleOffsetX,
    circleOffsetY,
    cursor: getBubbleResizeCursor(direction),
    minSize,
    maxSize,
    startSize: currentSize,
    startX: currentPosition.x,
    startY: currentPosition.y,
    wasPositioned,
  };
}

function getBubbleResizeResult(
  resizeState: BubbleResizeState,
  pointerX: number,
  pointerY: number
): BubbleResizeResult {
  const pointerDistanceX =
    resizeState.anchorOffsetX === 0.5
      ? resizeState.startSize
      : Math.abs(pointerX - resizeState.anchorX);
  const pointerDistanceY =
    resizeState.anchorOffsetY === 0.5
      ? resizeState.startSize
      : Math.abs(pointerY - resizeState.anchorY);
  const rawSize =
    resizeState.anchorOffsetX === 0.5
      ? pointerDistanceY
      : resizeState.anchorOffsetY === 0.5
        ? pointerDistanceX
        : Math.max(pointerDistanceX, pointerDistanceY);
  const nextSize = Math.round(
    clamp(rawSize, resizeState.minSize, resizeState.maxSize)
  );
  const nextCircleLeft =
    resizeState.anchorX - nextSize * resizeState.anchorOffsetX;
  const nextCircleTop =
    resizeState.anchorY - nextSize * resizeState.anchorOffsetY;

  return {
    position: clampBubblePositionForSize(
      {
        x: nextCircleLeft - resizeState.circleOffsetX,
        y: nextCircleTop - resizeState.circleOffsetY,
      },
      nextSize
    ),
    size: nextSize,
  };
}

function MediaBubble({
  audioMeterDebugEnabled,
  onAudioMeterDebugStateChange,
  liveKitParticipant,
  mediaSession,
  onLocalAvatarContextMenu,
  participant,
  size,
}: MediaBubbleProps) {
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const cameraPublication = liveKitParticipant?.getTrackPublication(
    Track.Source.Camera
  );
  const cameraTrack = cameraPublication?.videoTrack ?? null;
  const fakeMicrophoneLevelEnabled = isFakeMicrophoneLevelEnabled();
  const microphonePublication = liveKitParticipant?.getTrackPublication(
    Track.Source.Microphone
  );
  const microphoneTrack = microphonePublication?.audioTrack ?? null;
  const isMicrophoneMuted =
    !fakeMicrophoneLevelEnabled &&
    (microphonePublication?.isMuted === true ||
      (participant.isLocal && !mediaSession.micEnabled));
  const shouldShowAudioActivity =
    fakeMicrophoneLevelEnabled ||
    (microphonePublication !== undefined && !isMicrophoneMuted);
  const isCameraMuted = cameraPublication?.isMuted ?? false;
  const shouldShowCameraTrack = Boolean(
    (cameraTrack || fakeMicrophoneLevelEnabled) &&
      (!cameraTrack || !isCameraMuted) &&
      (!participant.isLocal || mediaSession.cameraEnabled)
  );
  const shouldShowFakeVideoSurface =
    fakeMicrophoneLevelEnabled && !cameraTrack && shouldShowCameraTrack;
  const hasLiveKitParticipant = liveKitParticipant !== null;
  const shouldShowAvatarFallback =
    !shouldShowCameraTrack && !!participant.avatarFaceId;
  const shouldRunAudioMeter =
    shouldShowCameraTrack || shouldShowAvatarFallback;
  const fakeMicrophoneLevelTrack = useFakeMicrophoneLevelSource(
    fakeMicrophoneLevelEnabled && shouldRunAudioMeter
  );
  const audioLevelDebug = useAudioTrackLevel(microphoneTrack, {
    enabled: shouldRunAudioMeter && !isMicrophoneMuted,
    fakePhase: fakeMicrophoneLevelTrack.phase,
    overrideMediaStreamTrack: fakeMicrophoneLevelTrack.track,
  });
  const audioVisualLevel = shouldShowAudioActivity ? audioLevelDebug.level : 0;
  const [videoAudioRingLevel, setVideoAudioRingLevel] = useState(0);
  const [avatarAudioPulseLevel, setAvatarAudioPulseLevel] = useState(0);
  useEffect(() => {
    const nextLevel =
      shouldShowCameraTrack && shouldShowAudioActivity ? audioVisualLevel : 0;
    setVideoAudioRingLevel((currentLevel) => {
      const easing =
        nextLevel > currentLevel
          ? VIDEO_AUDIO_RING_LEVEL_ATTACK_EASING
          : VIDEO_AUDIO_RING_LEVEL_RELEASE_EASING;

      if (nextLevel === 0 && currentLevel < 0.01) {
        return 0;
      }

      return currentLevel + (nextLevel - currentLevel) * easing;
    });
  }, [audioVisualLevel, shouldShowAudioActivity, shouldShowCameraTrack]);

  const audioActivityRingWidth = getAudioActivityRingWidth(
    shouldShowAudioActivity
      ? shouldShowCameraTrack
        ? videoAudioRingLevel
        : audioVisualLevel
      : 0,
    shouldShowCameraTrack ? VIDEO_AUDIO_ACTIVITY_THRESHOLD : AUDIO_ACTIVITY_THRESHOLD
  );
  const audioActivityRingColor = getColorWithAlpha(
    participant.color,
    AUDIO_ACTIVITY_RING_ALPHA
  );
  const audioMeterDiagnosticAttrs = getAudioMeterDiagnosticAttrs({
    audioLevelDebug,
    fakeMicrophoneLevelEnabled,
    participantId: participant.id,
    ringWidth: audioActivityRingWidth,
    visualLevel: audioVisualLevel,
    visualSource: "webaudio",
    visualRingWidth: audioActivityRingWidth,
  });
  const avatarIconFrameSize = getParticipantAvatarFaceIconPixelSize(size);
  useEffect(() => {
    const nextLevel =
      shouldShowAvatarFallback && shouldShowAudioActivity ? audioVisualLevel : 0;
    setAvatarAudioPulseLevel((currentLevel) => {
      const easing =
        nextLevel > currentLevel
          ? AVATAR_AUDIO_PULSE_LEVEL_ATTACK_EASING
          : AVATAR_AUDIO_PULSE_LEVEL_RELEASE_EASING;

      if (nextLevel === 0 && currentLevel < 0.01) {
        return 0;
      }

      return currentLevel + (nextLevel - currentLevel) * easing;
    });
  }, [audioVisualLevel, shouldShowAudioActivity, shouldShowAvatarFallback]);

  const avatarAudioPulseRingWidth = getAudioActivityRingWidth(
    avatarAudioPulseLevel
  );
  const avatarAudioPulseOpacity =
    avatarAudioPulseRingWidth > 0
      ? AVATAR_AUDIO_PULSE_OPACITY_BASE +
        avatarAudioPulseLevel * AVATAR_AUDIO_PULSE_OPACITY_GAIN
      : 0;
  const avatarAudioPulseStroke =
    avatarAudioPulseRingWidth > 0
      ? AVATAR_AUDIO_PULSE_STROKE_BASE_WIDTH +
        avatarAudioPulseLevel *
          (AVATAR_AUDIO_PULSE_STROKE_WIDTH -
            AVATAR_AUDIO_PULSE_STROKE_BASE_WIDTH)
      : AVATAR_AUDIO_PULSE_STROKE_BASE_WIDTH;

  useEffect(() => {
    if (!audioMeterDebugEnabled || !onAudioMeterDebugStateChange) {
      return;
    }

    onAudioMeterDebugStateChange(participant.id, {
      audioContextState: audioLevelDebug.audioContextState,
      enabled: audioLevelDebug.enabled,
      gatedRms: audioLevelDebug.gatedRms,
      hasAudioTrack: audioLevelDebug.hasAudioTrack,
      level: audioLevelDebug.level,
      mediaStreamTrackState: audioLevelDebug.mediaStreamTrackState,
      noiseFloor: audioLevelDebug.noiseFloor,
      phase: audioLevelDebug.fakePhase,
      ringWidth: audioActivityRingWidth,
      rms: audioLevelDebug.rms,
      source: fakeMicrophoneLevelEnabled ? "fake" : "real",
      visualLevel: audioVisualLevel,
      visualSource: "webaudio",
    });

    return () => {
      onAudioMeterDebugStateChange(participant.id, null);
    };
  }, [
    audioActivityRingWidth,
    audioLevelDebug.audioContextState,
    audioLevelDebug.enabled,
    audioLevelDebug.fakePhase,
    audioLevelDebug.gatedRms,
    audioLevelDebug.hasAudioTrack,
    audioLevelDebug.level,
    audioLevelDebug.mediaStreamTrackState,
    audioLevelDebug.noiseFloor,
    audioLevelDebug.rms,
    audioVisualLevel,
    audioMeterDebugEnabled,
    fakeMicrophoneLevelEnabled,
    isMicrophoneMuted,
    onAudioMeterDebugStateChange,
    participant.id,
  ]);

  const slotWidth = size + BUBBLE_SLOT_EXTRA_WIDTH;
  const slotHeight = BUBBLE_SLOT_HEIGHT + Math.max(0, size - LOCAL_BUBBLE_SIZE);
  const shouldShowLocalControls = participant.isLocal && mediaSession.isConnected;
  const canOpenLocalAvatarMenu = participant.isLocal && !shouldShowCameraTrack;
  const localMediaControlPositions = getLocalMediaControlPositions(size);
  const mediaControlButtonStyle = {
    width: LOCAL_MEDIA_CONTROL_SIZE,
    height: LOCAL_MEDIA_CONTROL_SIZE,
    minWidth: LOCAL_MEDIA_CONTROL_SIZE,
    minHeight: LOCAL_MEDIA_CONTROL_SIZE,
    padding: 0,
    borderRadius: 999,
    border: `1.5px solid ${participant.color}`,
    background: "rgba(15, 23, 42, 0.9)",
    color: "#f8fafc",
    display: "grid",
    placeItems: "center",
    boxShadow: `0 8px 18px rgba(2, 6, 23, 0.36), 0 0 0 1px ${getColorWithAlpha(
      participant.color,
      0.28
    )}`,
    cursor: "pointer",
    pointerEvents: "auto",
  } as const;

  useEffect(() => {
    const videoElement = videoElementRef.current;

    if (!videoElement || !cameraTrack || !shouldShowCameraTrack) {
      return;
    }

    cameraTrack.attach(videoElement);

    return () => {
      cameraTrack.detach(videoElement);
    };
  }, [cameraTrack, shouldShowCameraTrack]);

  return (
    <div
      style={{
        width: slotWidth,
        height: slotHeight,
        display: "grid",
        alignContent: "end",
        justifyItems: "center",
        gap: 6,
        pointerEvents: "none",
        fontFamily: HTML_UI_FONT_FAMILY,
      }}
    >
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
        }}
      >
        <div
          data-media-bubble-circle="true"
          aria-label={`${participant.name} media bubble`}
          title={participant.name}
          onContextMenu={(event) => {
            if (!canOpenLocalAvatarMenu) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            onLocalAvatarContextMenu?.(event, participant);
          }}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: 999,
            clipPath: "circle(50% at 50% 50%)",
            overflow: "hidden",
            border: `${BUBBLE_RING_WIDTH}px solid ${participant.color}`,
            background: participant.color,
            pointerEvents: "auto",
            boxShadow:
              "0 18px 42px rgba(2, 6, 23, 0.36), inset 0 0 0 1px rgba(255, 255, 255, 0.12)",
          }}
        >
          {shouldShowCameraTrack ? (
            <>
              {shouldShowFakeVideoSurface ? (
                <div
                  aria-hidden="true"
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    background: participant.color,
                    color: "#f8fafc",
                    fontSize: participant.isLocal ? 38 : 28,
                    fontWeight: 800,
                    letterSpacing: 0.4,
                    textShadow:
                      "0 2px 10px rgba(2, 6, 23, 0.78), 0 0 2px rgba(2, 6, 23, 0.8)",
                  }}
                >
                  {participant.avatarFaceId ? (
                    <ParticipantAvatarFaceIcon
                      faceId={participant.avatarFaceId}
                      size={size}
                    />
                  ) : (
                    getParticipantInitials(participant.name)
                  )}
                </div>
              ) : (
                <video
                  ref={videoElementRef}
                  autoPlay
                  playsInline
                  muted={participant.isLocal}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              )}
              {shouldShowCameraTrack ? (
                <div
                  aria-hidden="true"
                  {...audioMeterDiagnosticAttrs}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    boxShadow: `inset 0 0 0 ${audioActivityRingWidth}px ${audioActivityRingColor}`,
                    pointerEvents: "none",
                    transition: VIDEO_AUDIO_RING_TRANSITION,
                  }}
                />
              ) : null}
            </>
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: "100%",
                height: "100%",
                display: "grid",
                placeItems: "center",
                background: participant.color,
                color: "#f8fafc",
                fontSize: participant.isLocal ? 38 : 28,
                fontWeight: 800,
                letterSpacing: 0.4,
                textShadow:
                  "0 2px 10px rgba(2, 6, 23, 0.78), 0 0 2px rgba(2, 6, 23, 0.8)",
              }}
            >
              {participant.avatarFaceId ? (
                <div
                  aria-hidden="true"
                  style={{
                    position: "relative",
                    width: avatarIconFrameSize,
                    height: avatarIconFrameSize,
                    display: "grid",
                    placeItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <ParticipantAvatarFaceIcon
                    {...audioMeterDiagnosticAttrs}
                    faceId={participant.avatarFaceId}
                    size={size}
                    stroke={avatarAudioPulseStroke}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      opacity: avatarAudioPulseOpacity,
                      transition: AVATAR_AUDIO_PULSE_TRANSITION,
                    }}
                  />
                  <ParticipantAvatarFaceIcon
                    faceId={participant.avatarFaceId}
                    size={size}
                  />
                </div>
              ) : (
                getParticipantInitials(participant.name)
              )}
            </div>
          )}

          {!hasLiveKitParticipant ? (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 6,
                top: 6,
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "rgba(148, 163, 184, 0.78)",
                boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.5)",
              }}
            />
          ) : null}
        </div>

        {shouldShowLocalControls ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            <button
              type="button"
              aria-label={
                mediaSession.micEnabled
                  ? "Mute microphone"
                  : "Unmute microphone"
              }
              onClick={(event) => {
                stopBubbleControlPointerEvent(event);
                void mediaSession.toggleMicrophone();
              }}
              onPointerDown={stopBubbleControlPointerEvent}
              onPointerMove={stopBubbleControlPointerEvent}
              onPointerUp={stopBubbleControlPointerEvent}
              onPointerCancel={stopBubbleControlPointerEvent}
              style={{
                ...mediaControlButtonStyle,
                position: "absolute",
                ...localMediaControlPositions.microphone,
              }}
            >
              {mediaSession.micEnabled ? (
                <Mic
                  aria-hidden="true"
                  size={LOCAL_MEDIA_CONTROL_ICON_SIZE}
                  strokeWidth={LOCAL_MEDIA_CONTROL_ICON_STROKE_WIDTH}
                />
              ) : (
                <MicOff
                  aria-hidden="true"
                  size={LOCAL_MEDIA_CONTROL_ICON_SIZE}
                  strokeWidth={LOCAL_MEDIA_CONTROL_ICON_STROKE_WIDTH}
                />
              )}
            </button>
            <button
              type="button"
              aria-label={
                mediaSession.cameraEnabled
                  ? "Turn camera off"
                  : "Turn camera on"
              }
              onClick={(event) => {
                stopBubbleControlPointerEvent(event);
                void mediaSession.toggleCamera();
              }}
              onPointerDown={stopBubbleControlPointerEvent}
              onPointerMove={stopBubbleControlPointerEvent}
              onPointerUp={stopBubbleControlPointerEvent}
              onPointerCancel={stopBubbleControlPointerEvent}
              style={{
                ...mediaControlButtonStyle,
                position: "absolute",
                ...localMediaControlPositions.camera,
              }}
            >
              {mediaSession.cameraEnabled ? (
                <Video
                  aria-hidden="true"
                  size={LOCAL_MEDIA_CONTROL_ICON_SIZE}
                  strokeWidth={LOCAL_MEDIA_CONTROL_ICON_STROKE_WIDTH}
                />
              ) : (
                <VideoOff
                  aria-hidden="true"
                  size={LOCAL_MEDIA_CONTROL_ICON_SIZE}
                  strokeWidth={LOCAL_MEDIA_CONTROL_ICON_STROKE_WIDTH}
                />
              )}
            </button>
          </div>
        ) : null}
      </div>

      <div
        style={{
          maxWidth: slotWidth,
          padding: "3px 8px",
          borderRadius: 999,
          color: "#f8fafc",
          background: "rgba(15, 23, 42, 0.72)",
          border: "1px solid rgba(248, 250, 252, 0.12)",
          boxShadow: "0 8px 20px rgba(2, 6, 23, 0.24)",
          fontSize: 11,
          fontWeight: 700,
          lineHeight: "14px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          backdropFilter: "blur(8px)",
          pointerEvents: "none",
        }}
      >
        {participant.isLocal ? `${participant.name} (you)` : participant.name}
      </div>
    </div>
  );
}

type AudioLevelDebugOverlayProps = {
  debugStatesByParticipantId: Map<string, AudioMeterDebugDisplayState>;
  participants: MediaBubbleParticipant[];
};

function AudioLevelDebugRow({
  debugState,
  participant,
}: {
  debugState: AudioMeterDebugDisplayState | null;
  participant: MediaBubbleParticipant;
}) {
  if (!debugState) {
    return (
      <div>
        {participant.isLocal ? "you" : participant.name}: meter missing
      </div>
    );
  }

  return (
    <div>
      {participant.isLocal ? "you" : participant.name}: px{" "}
      {debugState.ringWidth.toFixed(2)}, level{" "}
      {debugState.level.toFixed(3)}, rms {debugState.rms.toFixed(4)}, ctx{" "}
      {debugState.audioContextState}, floor {debugState.noiseFloor.toFixed(4)},
      gated {debugState.gatedRms.toFixed(4)}, enabled{" "}
      {debugState.enabled ? "yes" : "no"}, source {debugState.source},
      track {debugState.hasAudioTrack ? "yes" : "no"}/
      {debugState.mediaStreamTrackState}, phase {debugState.phase}, visual{" "}
      {debugState.visualSource}/{debugState.visualLevel.toFixed(3)}
    </div>
  );
}

function AudioLevelDebugOverlay({
  debugStatesByParticipantId,
  participants,
}: AudioLevelDebugOverlayProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: "50%",
        top: 72,
        transform: "translateX(-50%)",
        zIndex: 9999,
        maxWidth: "min(840px, calc(100vw - 32px))",
        padding: "8px 10px",
        borderRadius: 10,
        background: "rgba(2, 6, 23, 0.88)",
        color: "#f8fafc",
        fontSize: 12,
        fontWeight: 800,
        lineHeight: "16px",
        pointerEvents: "none",
        textAlign: "left",
        whiteSpace: "normal",
        overflowWrap: "anywhere",
      }}
    >
      <div>
        WebAudio level, gain {getAudioLevelGain().toFixed(1)} base{" "}
        {AUDIO_LEVEL_GAIN}, max {AUDIO_ACTIVITY_RING_MAX_WIDTH}px, fakeMicLevel{" "}
        {isFakeMicrophoneLevelEnabled() ? "on" : "off"}
      </div>
      {participants.map((participant) => (
        <AudioLevelDebugRow
          key={participant.id}
          debugState={debugStatesByParticipantId.get(participant.id) ?? null}
          participant={participant}
        />
      ))}
    </div>
  );
}

function getAudioMeterDiagnosticAttrs({
  audioLevelDebug,
  fakeMicrophoneLevelEnabled,
  participantId,
  ringWidth,
  visualLevel,
  visualRingWidth,
  visualSource,
}: {
  audioLevelDebug: AudioTrackLevelDebugState;
  fakeMicrophoneLevelEnabled: boolean;
  participantId: string;
  ringWidth: number;
  visualLevel: number;
  visualRingWidth: number;
  visualSource: "webaudio";
}) {
  return {
    "data-testid": `media-audio-meter-${participantId}`,
    "data-audio-meter-context": audioLevelDebug.audioContextState,
    "data-audio-meter-level": audioLevelDebug.level,
    "data-audio-meter-phase": audioLevelDebug.fakePhase,
    "data-audio-meter-ring-width": ringWidth,
    "data-audio-meter-gated-rms": audioLevelDebug.gatedRms,
    "data-audio-meter-noise-floor": audioLevelDebug.noiseFloor,
    "data-audio-meter-rms": audioLevelDebug.rms,
    "data-audio-meter-source": fakeMicrophoneLevelEnabled ? "fake" : "real",
    "data-audio-meter-track": audioLevelDebug.mediaStreamTrackState,
    "data-audio-meter-visual-level": visualLevel,
    "data-audio-meter-visual-ring-width": visualRingWidth,
    "data-audio-meter-visual-source": visualSource,
  };
}

function addBubbleParticipant(
  participants: Map<string, MediaBubbleParticipant>,
  participant: MediaBubbleParticipant
) {
  const current = participants.get(participant.id);

  participants.set(participant.id, {
    id: participant.id,
    name: participant.name || current?.name || "Player",
    color: participant.color || current?.color || "#64748b",
    avatarFaceId: participant.avatarFaceId ?? current?.avatarFaceId,
    isLocal: participant.isLocal || current?.isLocal || false,
  });
}

function clampBubblePosition(position: BubblePosition) {
  return clampBubblePositionForSize(position, LOCAL_BUBBLE_SIZE);
}

function clampBubblePositionForSize(position: BubblePosition, size: number) {
  if (typeof window === "undefined") {
    return position;
  }

  const slotWidth = size + BUBBLE_SLOT_EXTRA_WIDTH;
  const slotHeight = BUBBLE_SLOT_HEIGHT + Math.max(0, size - LOCAL_BUBBLE_SIZE);

  return {
    x: Math.min(
      Math.max(position.x, 8),
      Math.max(8, window.innerWidth - slotWidth - 8)
    ),
    y: Math.min(
      Math.max(position.y, 8),
      Math.max(8, window.innerHeight - slotHeight - 8)
    ),
  };
}

function getMediaBubblesStorageKey(roomId: string, participantId: string) {
  return `${MEDIA_BUBBLES_STORAGE_PREFIX}:${normalizeRoomId(roomId)}:${participantId}`;
}

function getMediaBubbleSizesStorageKey(roomId: string, participantId: string) {
  return `${MEDIA_BUBBLES_SIZE_STORAGE_PREFIX}:${normalizeRoomId(roomId)}:${participantId}`;
}

function getDefaultBubbleSize(participant: MediaBubbleParticipant) {
  return participant.isLocal ? LOCAL_BUBBLE_SIZE : REMOTE_BUBBLE_SIZE;
}

function getMaxBubbleSize() {
  return BUBBLE_MAX_SIZE;
}

function parseStoredBubblePositions(raw: string | null) {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.entries(parsed).reduce<Record<string, BubblePosition>>(
      (positions, [participantId, value]) => {
        if (
          !value ||
          typeof value !== "object" ||
          Array.isArray(value) ||
          !("x" in value) ||
          !("y" in value)
        ) {
          return positions;
        }

        const x = Number(value.x);
        const y = Number(value.y);

        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          return positions;
        }

        positions[participantId] = clampBubblePosition({ x, y });
        return positions;
      },
      {}
    );
  } catch {
    return {};
  }
}

function parseStoredBubbleSizes(raw: string | null) {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.entries(parsed).reduce<Record<string, number>>(
      (sizes, [participantId, value]) => {
        const size = Number(value);

        if (!Number.isFinite(size)) {
          return sizes;
        }

        sizes[participantId] = Math.round(size);
        return sizes;
      },
      {}
    );
  } catch {
    return {};
  }
}

function loadStoredBubblePositions(roomId: string, participantId: string) {
  try {
    return parseStoredBubblePositions(
      localStorage.getItem(getMediaBubblesStorageKey(roomId, participantId))
    );
  } catch {
    return {};
  }
}

function loadStoredBubbleSizes(roomId: string, participantId: string) {
  try {
    return parseStoredBubbleSizes(
      localStorage.getItem(getMediaBubbleSizesStorageKey(roomId, participantId))
    );
  } catch {
    return {};
  }
}

function saveStoredBubblePositions(
  roomId: string,
  participantId: string,
  positions: Record<string, BubblePosition>
) {
  try {
    localStorage.setItem(
      getMediaBubblesStorageKey(roomId, participantId),
      JSON.stringify(positions)
    );
  } catch {
    // Local bubble layout is an optional browser preference.
  }
}

function clearStoredBubblePositions(roomId: string, participantId: string) {
  try {
    localStorage.removeItem(getMediaBubblesStorageKey(roomId, participantId));
  } catch {
    // Local bubble layout is an optional browser preference.
  }
}

function saveStoredBubbleSizes(
  roomId: string,
  participantId: string,
  sizes: Record<string, number>
) {
  try {
    localStorage.setItem(
      getMediaBubbleSizesStorageKey(roomId, participantId),
      JSON.stringify(sizes)
    );
  } catch {
    // Local bubble layout is an optional browser preference.
  }
}

function clearStoredBubbleSizes(roomId: string, participantId: string) {
  try {
    localStorage.removeItem(getMediaBubbleSizesStorageKey(roomId, participantId));
  } catch {
    // Local bubble layout is an optional browser preference.
  }
}

function createInitialBubblePositions(roomId: string, participantId: string) {
  return loadStoredBubblePositions(roomId, participantId);
}

function createInitialBubbleSizes(roomId: string, participantId: string) {
  return loadStoredBubbleSizes(roomId, participantId);
}

export function LiveKitMediaBubbles({
  mediaSession,
  onUpdateParticipantSession,
  participantPresences,
  participantSession,
  resetVideoPositionsRevision,
  roomId,
  roomOccupancies,
}: LiveKitMediaBubblesProps) {
  const [bubblePositionsById, setBubblePositionsById] = useState<
    Record<string, BubblePosition>
  >(() => createInitialBubblePositions(roomId, participantSession.id));
  const [bubbleSizesById, setBubbleSizesById] = useState<Record<string, number>>(
    () => createInitialBubbleSizes(roomId, participantSession.id)
  );
  const [activeDragOffset, setActiveDragOffset] =
    useState<BubbleDragOffset | null>(null);
  const [activeResizePreview, setActiveResizePreview] =
    useState<BubbleResizePreview | null>(null);
  const [resizeHover, setResizeHover] = useState<BubbleResizeHover | null>(null);
  const [avatarFaceContextMenuState, setAvatarFaceContextMenuState] =
    useState<AvatarFaceContextMenuState>(null);
  const [audioMeterDebugStatesById, setAudioMeterDebugStatesById] = useState(
    () => new Map<string, AudioMeterDebugDisplayState>()
  );
  const audioMeterDebugEnabled = isAudioMeterDebugEnabled();
  const dragStateRef = useRef<BubbleDragState | null>(null);
  const resizeStateRef = useRef<BubbleResizeState | null>(null);

  useEffect(() => {
    setBubblePositionsById(
      loadStoredBubblePositions(roomId, participantSession.id)
    );
    setBubbleSizesById(loadStoredBubbleSizes(roomId, participantSession.id));
    setActiveDragOffset(null);
    setActiveResizePreview(null);
    setResizeHover(null);
    setAvatarFaceContextMenuState(null);
    dragStateRef.current = null;
    resizeStateRef.current = null;
    setAudioMeterDebugStatesById(new Map());
  }, [participantSession.id, roomId]);

  useEffect(() => {
    if (resetVideoPositionsRevision <= 0) {
      return;
    }

    clearStoredBubblePositions(roomId, participantSession.id);
    clearStoredBubbleSizes(roomId, participantSession.id);
    setBubblePositionsById({});
    setBubbleSizesById({});
    setActiveDragOffset(null);
    setActiveResizePreview(null);
    setResizeHover(null);
    dragStateRef.current = null;
    resizeStateRef.current = null;
  }, [participantSession.id, resetVideoPositionsRevision, roomId]);

  const liveKitParticipantsById = useMemo(() => {
    return new Map(
      mediaSession.participants.map((participant) => [
        participant.identity,
        participant,
      ])
    );
  }, [mediaSession.participants]);

  const bubbleParticipants = useMemo(() => {
    const participants = new Map<string, MediaBubbleParticipant>();

    addBubbleParticipant(participants, {
      id: participantSession.id,
      name: participantSession.name,
      color: participantSession.color,
      avatarFaceId: participantSession.avatarFaceId,
      isLocal: true,
    });

    Object.values(roomOccupancies).forEach((occupancy) => {
      addBubbleParticipant(participants, {
        id: occupancy.participantId,
        name: occupancy.name,
        color: occupancy.color,
        avatarFaceId: occupancy.avatarFaceId,
        isLocal: occupancy.participantId === participantSession.id,
      });
    });

    Object.values(participantPresences).forEach((presence) => {
      addBubbleParticipant(participants, {
        id: presence.participantId,
        name: presence.name,
        color: presence.color,
        avatarFaceId: presence.avatarFaceId,
        isLocal: presence.participantId === participantSession.id,
      });
    });

    mediaSession.participants.forEach((liveKitParticipant) => {
      if (participants.has(liveKitParticipant.identity)) {
        return;
      }

      addBubbleParticipant(participants, {
        id: liveKitParticipant.identity,
        name: liveKitParticipant.name || liveKitParticipant.identity,
        color:
          liveKitParticipant.identity === participantSession.id
            ? participantSession.color
            : "#64748b",
        isLocal: liveKitParticipant.identity === participantSession.id,
      });
    });

    return Array.from(participants.values()).sort((a, b) => {
      if (a.isLocal) {
        return -1;
      }

      if (b.isLocal) {
        return 1;
      }

      return a.name.localeCompare(b.name);
    });
  }, [
    mediaSession.participants,
    participantPresences,
    participantSession.avatarFaceId,
    participantSession.color,
    participantSession.id,
    participantSession.name,
    roomOccupancies,
  ]);

  const availableAvatarFaceIds = useMemo(() => {
    const usedByOtherParticipants = new Set<ParticipantAvatarFaceId>();

    bubbleParticipants.forEach((participant) => {
      if (
        participant.id === participantSession.id ||
        !participant.avatarFaceId
      ) {
        return;
      }

      usedByOtherParticipants.add(participant.avatarFaceId);
    });

    return PARTICIPANT_AVATAR_FACE_IDS.filter(
      (faceId) =>
        faceId !== participantSession.avatarFaceId &&
        !usedByOtherParticipants.has(faceId)
    );
  }, [bubbleParticipants, participantSession.avatarFaceId, participantSession.id]);

  const avatarFaceContextMenuItems = useMemo<ContextMenuItem[]>(
    () =>
      availableAvatarFaceIds.map((faceId) => ({
        type: "item",
        id: `avatar-face-${faceId}`,
        label: faceId,
        ariaLabel: `Choose avatar ${faceId}`,
        icon: (
          <ParticipantAvatarFaceIcon
            faceId={faceId}
            size={AVATAR_FACE_CONTEXT_MENU_GRID_ITEM_SIZE}
            stroke={1.55}
          />
        ),
        onSelect: () => {
          onUpdateParticipantSession((session) =>
            session.id === participantSession.id
              ? {
                  ...session,
                  avatarFaceId: faceId,
                }
              : session
          );
        },
        testId: `avatar-face-context-menu-${faceId}`,
      })),
    [availableAvatarFaceIds, onUpdateParticipantSession, participantSession.id]
  );

  const handleLocalAvatarContextMenu = useCallback(
    (
      event: MouseEvent<HTMLDivElement>,
      participant: MediaBubbleParticipant
    ) => {
      if (
        participant.id !== participantSession.id ||
        availableAvatarFaceIds.length === 0
      ) {
        return;
      }

      setAvatarFaceContextMenuState({
        clientX: event.clientX,
        clientY: event.clientY,
      });
    },
    [availableAvatarFaceIds.length, participantSession.id]
  );

  const handleBubblePointerDown = useCallback(
    (
      event: React.PointerEvent<HTMLDivElement>,
      participant: MediaBubbleParticipant
    ) => {
      if (event.button !== 0) {
        return;
      }

      if (!isPointerInsideBubbleCircle(event)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const participantId = participant.id;
      const bubbleElement = event.currentTarget;
      const bubbleRect = bubbleElement.getBoundingClientRect();
      const currentSize =
        activeResizePreview?.participantId === participantId
          ? activeResizePreview.size
          : bubbleSizesById[participantId] ?? getDefaultBubbleSize(participant);
      const minSize = getDefaultBubbleSize(participant);
      const maxSize = getMaxBubbleSize();
      const storedPosition = bubblePositionsById[participantId];
      const currentPosition =
        storedPosition ??
        clampBubblePositionForSize(
          {
            x: bubbleRect.left,
            y: bubbleRect.top,
          },
          currentSize
        );

      if (isPointerOnBubbleResizeRing(event)) {
        const metrics = getBubbleCirclePointerMetrics(event);

        if (!metrics) {
          return;
        }

        resizeStateRef.current = createBubbleResizeState({
          participantId,
          pointerId: event.pointerId,
          currentPosition,
          currentSize,
          event,
          maxSize,
          metrics,
          minSize,
          wasPositioned: storedPosition !== undefined,
        });

        bubbleElement.setPointerCapture(event.pointerId);
        setActiveResizePreview({
          cursor: resizeStateRef.current.cursor,
          participantId,
          position: currentPosition,
          size: currentSize,
        });
        setResizeHover({
          cursor: resizeStateRef.current.cursor,
          participantId,
        });
        return;
      }

      dragStateRef.current = {
        participantId,
        pointerId: event.pointerId,
        startPointerX: event.clientX,
        startPointerY: event.clientY,
        size: currentSize,
        startX: currentPosition.x,
        startY: currentPosition.y,
        wasPositioned: storedPosition !== undefined,
      };

      bubbleElement.setPointerCapture(event.pointerId);
      setActiveDragOffset({
        participantId,
        x: 0,
        y: 0,
      });
    },
    [activeResizePreview, bubblePositionsById, bubbleSizesById]
  );

  const handleBubblePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const resizeState = resizeStateRef.current;

      if (resizeState && resizeState.pointerId === event.pointerId) {
        event.preventDefault();
        event.stopPropagation();

        const nextResize = getBubbleResizeResult(
          resizeState,
          event.clientX,
          event.clientY
        );

        setActiveResizePreview({
          cursor: resizeState.cursor,
          participantId: resizeState.participantId,
          position: nextResize.position,
          size: nextResize.size,
        });
        return;
      }

      const dragState = dragStateRef.current;

      if (!dragState || dragState.pointerId !== event.pointerId) {
        const participantId = event.currentTarget.dataset.participantId ?? null;
        const cursor = getBubbleResizeCursorFromPointer(event);
        const nextHover =
          participantId && cursor
            ? {
                cursor,
                participantId,
              }
            : null;

        setResizeHover((currentHover) => {
          return currentHover?.participantId === nextHover?.participantId &&
            currentHover?.cursor === nextHover?.cursor
            ? currentHover
            : nextHover;
        });
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const nextPosition = clampBubblePositionForSize(
        {
          x: dragState.startX + event.clientX - dragState.startPointerX,
          y: dragState.startY + event.clientY - dragState.startPointerY,
        },
        dragState.size
      );

      if (dragState.wasPositioned) {
        setBubblePositionsById((currentPositions) => ({
          ...currentPositions,
          [dragState.participantId]: nextPosition,
        }));
        return;
      }

      setActiveDragOffset({
        participantId: dragState.participantId,
        x: nextPosition.x - dragState.startX,
        y: nextPosition.y - dragState.startY,
      });
    },
    []
  );

  const handleBubblePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const resizeState = resizeStateRef.current;

      if (resizeState && resizeState.pointerId === event.pointerId) {
        event.preventDefault();
        event.stopPropagation();
        resizeStateRef.current = null;

        const nextResize = getBubbleResizeResult(
          resizeState,
          event.clientX,
          event.clientY
        );

        setActiveResizePreview(null);
        setResizeHover(null);
        setBubbleSizesById((currentSizes) => {
          const nextSizes = {
            ...currentSizes,
            [resizeState.participantId]: nextResize.size,
          };

          saveStoredBubbleSizes(roomId, participantSession.id, nextSizes);
          return nextSizes;
        });
        setBubblePositionsById((currentPositions) => {
          const nextPositions = resizeState.wasPositioned
            ? {
                ...currentPositions,
                [resizeState.participantId]: nextResize.position,
              }
            : {
                ...currentPositions,
                [resizeState.participantId]: nextResize.position,
              };

          saveStoredBubblePositions(roomId, participantSession.id, nextPositions);
          return nextPositions;
        });

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        return;
      }

      const dragState = dragStateRef.current;

      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      dragStateRef.current = null;
      setActiveDragOffset(null);

      const nextPosition = clampBubblePositionForSize(
        {
          x: dragState.startX + event.clientX - dragState.startPointerX,
          y: dragState.startY + event.clientY - dragState.startPointerY,
        },
        dragState.size
      );
      setBubblePositionsById((currentPositions) => {
        const nextPositions = {
          ...currentPositions,
          [dragState.participantId]: nextPosition,
        };

        saveStoredBubblePositions(roomId, participantSession.id, nextPositions);
        return nextPositions;
      });

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [bubbleSizesById, participantSession.id, roomId]
  );

  const handleBubblePointerLeave = useCallback(() => {
    if (dragStateRef.current || resizeStateRef.current) {
      return;
    }

    setResizeHover(null);
  }, []);

  const railBubbleParticipants = bubbleParticipants.filter(
    (participant) => !bubblePositionsById[participant.id]
  );
  const positionedBubbleParticipants = bubbleParticipants.filter(
    (participant) => bubblePositionsById[participant.id]
  );

  const getRenderedBubbleSize = (participant: MediaBubbleParticipant) => {
    if (activeResizePreview?.participantId === participant.id) {
      return clamp(
        activeResizePreview.size,
        getDefaultBubbleSize(participant),
        getMaxBubbleSize()
      );
    }

    return clamp(
      bubbleSizesById[participant.id] ?? getDefaultBubbleSize(participant),
      getDefaultBubbleSize(participant),
      getMaxBubbleSize()
    );
  };

  const getBubbleCursor = (participant: MediaBubbleParticipant) => {
    if (resizeStateRef.current?.participantId === participant.id) {
      return resizeStateRef.current.cursor;
    }

    if (dragStateRef.current?.participantId === participant.id) {
      return "grabbing";
    }

    return activeResizePreview?.participantId === participant.id
      ? activeResizePreview.cursor
      : resizeHover?.participantId === participant.id
        ? resizeHover.cursor
        : "grab";
  };

  const handleAudioMeterDebugStateChange = useCallback(
    (participantId: string, state: AudioMeterDebugDisplayState | null) => {
      setAudioMeterDebugStatesById((currentStates) => {
        const nextStates = new Map(currentStates);

        if (state) {
          nextStates.set(participantId, state);
        } else {
          nextStates.delete(participantId);
        }

        return nextStates;
      });
    },
    []
  );

  const renderBubble = (participant: MediaBubbleParticipant) => (
    <MediaBubble
      audioMeterDebugEnabled={audioMeterDebugEnabled}
      onAudioMeterDebugStateChange={
        audioMeterDebugEnabled ? handleAudioMeterDebugStateChange : undefined
      }
      mediaSession={mediaSession}
      onLocalAvatarContextMenu={handleLocalAvatarContextMenu}
      participant={participant}
      liveKitParticipant={liveKitParticipantsById.get(participant.id) ?? null}
      size={getRenderedBubbleSize(participant)}
    />
  );

  return (
    <div
      aria-label="Room media bubbles"
      data-testid="media-bubbles-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 22,
        pointerEvents: "none",
      }}
    >
      {audioMeterDebugEnabled ? (
        <AudioLevelDebugOverlay
          debugStatesByParticipantId={audioMeterDebugStatesById}
          participants={bubbleParticipants}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          right: 18,
          bottom: 18,
          display: "flex",
          flexDirection: "row-reverse",
          flexWrap: "wrap-reverse",
          alignItems: "flex-end",
          alignContent: "flex-end",
          gap: 8,
          maxWidth: "calc(100vw - 36px)",
          pointerEvents: "none",
        }}
      >
        {railBubbleParticipants.map((participant) => (
          <div
            key={participant.id}
            data-participant-id={participant.id}
            onPointerDown={(event) => {
              handleBubblePointerDown(event, participant);
            }}
            onPointerMove={handleBubblePointerMove}
            onPointerUp={handleBubblePointerEnd}
            onPointerCancel={handleBubblePointerEnd}
            onPointerLeave={handleBubblePointerLeave}
            style={{
              cursor: getBubbleCursor(participant),
              left:
                activeResizePreview?.participantId === participant.id
                  ? activeResizePreview.position.x
                  : undefined,
              pointerEvents: "none",
              position:
                activeResizePreview?.participantId === participant.id
                  ? "fixed"
                  : "relative",
              touchAction: "none",
              top:
                activeResizePreview?.participantId === participant.id
                  ? activeResizePreview.position.y
                  : undefined,
              transform:
                activeResizePreview?.participantId === participant.id
                  ? undefined
                  : activeDragOffset?.participantId === participant.id
                  ? `translate3d(${activeDragOffset.x}px, ${activeDragOffset.y}px, 0)`
                  : undefined,
              userSelect: "none",
              zIndex:
                activeResizePreview?.participantId === participant.id
                  ? participant.isLocal
                    ? 4
                    : 3
                  : participant.isLocal
                    ? 2
                    : 1,
            }}
          >
            {renderBubble(participant)}
          </div>
        ))}
      </div>

      {positionedBubbleParticipants.map((participant) => {
        const position = bubblePositionsById[participant.id];
        const resizePreviewPosition =
          activeResizePreview?.participantId === participant.id
            ? activeResizePreview.position
            : null;

        return (
          <div
            key={participant.id}
            data-participant-id={participant.id}
            onPointerDown={(event) => {
              handleBubblePointerDown(event, participant);
            }}
            onPointerMove={handleBubblePointerMove}
            onPointerUp={handleBubblePointerEnd}
            onPointerCancel={handleBubblePointerEnd}
            onPointerLeave={handleBubblePointerLeave}
            style={{
              position: "absolute",
              left: resizePreviewPosition?.x ?? position.x,
              top: resizePreviewPosition?.y ?? position.y,
              cursor: getBubbleCursor(participant),
              pointerEvents: "none",
              touchAction: "none",
              userSelect: "none",
              zIndex: participant.isLocal ? 2 : 1,
            }}
          >
            {renderBubble(participant)}
          </div>
        );
      })}

      <ContextMenu
        anchorPoint={
          avatarFaceContextMenuState
            ? {
                x: avatarFaceContextMenuState.clientX,
                y: avatarFaceContextMenuState.clientY,
              }
            : null
        }
        ariaLabel="Choose avatar face"
        gridColumnCount={AVATAR_FACE_CONTEXT_MENU_COLUMN_COUNT}
        items={avatarFaceContextMenuItems}
        layout="grid"
        maxWidth={AVATAR_FACE_CONTEXT_MENU_WIDTH}
        minWidth={AVATAR_FACE_CONTEXT_MENU_WIDTH}
        onClose={() => {
          setAvatarFaceContextMenuState(null);
        }}
      />
    </div>
  );
}
