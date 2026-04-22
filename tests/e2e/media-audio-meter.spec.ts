import { expect, test } from "@playwright/test";
import path from "node:path";
import { createSmokeRoomId, joinRoom } from "./helpers/roomSmoke";

const fakeAudioCapturePath = path.resolve("tests/fixtures/audio-meter-tone.wav");

test.use({
  launchOptions: {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-audio-capture=${fakeAudioCapturePath}`,
    ],
  },
});

type AudioMeterSample = {
  context: string;
  level: number;
  phase: string;
  ringWidth: number;
  rms: number;
  source: string;
  track: string;
};

type AudioMeterSummary = ReturnType<typeof summarizeAudioMeterSamples>;

async function readAudioMeterSample(page: import("@playwright/test").Page) {
  return page.locator('[data-testid^="media-audio-meter-"]').first().evaluate(
    (element): AudioMeterSample => {
      const readNumberAttribute = (name: string) => {
        const rawValue = element.getAttribute(name);
        const value = Number(rawValue);

        if (!Number.isFinite(value)) {
          throw new Error(`Invalid ${name} value: ${rawValue}`);
        }

        return value;
      };

      return {
        context: element.getAttribute("data-audio-meter-context") ?? "",
        level: readNumberAttribute("data-audio-meter-level"),
        phase: element.getAttribute("data-audio-meter-phase") ?? "",
        ringWidth: readNumberAttribute("data-audio-meter-ring-width"),
        rms: readNumberAttribute("data-audio-meter-rms"),
        source: element.getAttribute("data-audio-meter-source") ?? "",
        track: element.getAttribute("data-audio-meter-track") ?? "",
      };
    }
  );
}

function getAudioMeterRoomUrl(roomId: string, query: Record<string, string>) {
  const baseUrl =
    process.env.PLAYWRIGHT_MEDIA_AUDIO_METER_BASE_URL ?? "http://127.0.0.1:4173";
  const url = new URL("/", baseUrl);

  url.searchParams.set("room", roomId);

  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

async function collectAudioMeterSamples(
  page: import("@playwright/test").Page,
  durationMs: number
) {
  const samples: AudioMeterSample[] = [];
  const startedAt = Date.now();

  while (Date.now() - startedAt < durationMs) {
    samples.push(await readAudioMeterSample(page));
    await page.waitForTimeout(100);
  }

  return samples;
}

function summarizeAudioMeterSamples(samples: AudioMeterSample[]) {
  const phases = new Set(samples.map((sample) => sample.phase));
  const contextStates = new Set(samples.map((sample) => sample.context));
  const sourceValues = new Set(samples.map((sample) => sample.source));
  const trackStates = new Set(samples.map((sample) => sample.track));
  const ringWidths = samples.map((sample) => sample.ringWidth);
  const rmsValues = samples.map((sample) => sample.rms);
  const levelValues = samples.map((sample) => sample.level);
  const lowSamples = samples.filter((sample) => sample.phase === "low");
  const mediumSamples = samples.filter((sample) => sample.phase === "medium");
  const highSamples = samples.filter((sample) => sample.phase === "high");
  const finalSilentSamples = getLateFinalSilentSamplesAfterHigh(samples);

  return {
    contextStates: Array.from(contextStates),
    phases: Array.from(phases),
    sourceValues: Array.from(sourceValues),
    trackStates: Array.from(trackStates),
    ringWidth: {
      min: Math.min(...ringWidths),
      max: Math.max(...ringWidths),
    },
    rms: {
      min: Math.min(...rmsValues),
      max: Math.max(...rmsValues),
    },
    level: {
      min: Math.min(...levelValues),
      max: Math.max(...levelValues),
    },
    byPhase: {
      lowMaxRingWidth: Math.max(...lowSamples.map((sample) => sample.ringWidth)),
      mediumMaxRingWidth: Math.max(
        ...mediumSamples.map((sample) => sample.ringWidth)
      ),
      highMaxRingWidth: Math.max(
        ...highSamples.map((sample) => sample.ringWidth)
      ),
      lateFinalSilentMinRingWidth: Math.min(
        ...finalSilentSamples.map((sample) => sample.ringWidth)
      ),
      lateFinalSilentMaxRingWidth: Math.max(
        ...finalSilentSamples.map((sample) => sample.ringWidth)
      ),
      lateFinalSilentMaxLevel: Math.max(
        ...finalSilentSamples.map((sample) => sample.level)
      ),
    },
  };
}

function getLateFinalSilentSamplesAfterHigh(samples: AudioMeterSample[]) {
  const highSampleIndex = samples.findLastIndex(
    (sample) => sample.phase === "high"
  );

  if (highSampleIndex < 0) {
    return [];
  }

  const silentSamplesAfterLastHigh = samples
    .slice(highSampleIndex + 1)
    .filter((sample) => sample.phase === "silent");

  return silentSamplesAfterLastHigh.slice(-3);
}

function expectCommonAudioMeterHealth(
  samples: AudioMeterSample[],
  summary: AudioMeterSummary,
  source: "fake" | "real"
) {
  expect(samples.length, JSON.stringify(summary)).toBeGreaterThan(0);
  expect(samples.every((sample) => sample.source === source)).toBe(true);
  expect(samples.some((sample) => sample.track === "live")).toBe(true);
  expect(summary.contextStates.includes("running"), JSON.stringify(summary)).toBe(
    true
  );
  expect(summary.rms.max, JSON.stringify(summary)).toBeGreaterThan(
    summary.rms.min
  );
  expect(summary.level.max, JSON.stringify(summary)).toBeGreaterThan(
    summary.level.min
  );
  expect(summary.ringWidth.max, JSON.stringify(summary)).toBeGreaterThanOrEqual(
    1
  );
}

test.describe("media audio meter diagnostics", () => {
  test("calibrates bubble activity ring with silent fake microphone input", async ({
    page,
  }) => {
    const roomId = createSmokeRoomId("audio-meter");

    await page.goto(
      getAudioMeterRoomUrl(roomId, {
        audioMeterDebug: "1",
        fakeMicLevel: "1",
        uiDebugControls: "1",
      })
    );
    await joinRoom(page, {
      roomId,
      name: "Audio Meter",
    });

    const meter = page.locator('[data-testid^="media-audio-meter-"]').first();

    await expect(meter).toBeVisible();

    const samples = await collectAudioMeterSamples(page, 8_000);
    const summary = summarizeAudioMeterSamples(samples);

    console.log("[media-audio-meter][synthetic]", JSON.stringify(summary));

    expectCommonAudioMeterHealth(samples, summary, "fake");
    expect(summary.phases.includes("silent"), JSON.stringify(summary)).toBe(true);
    expect(summary.phases.includes("low"), JSON.stringify(summary)).toBe(true);
    expect(summary.phases.includes("medium"), JSON.stringify(summary)).toBe(true);
    expect(summary.phases.includes("high"), JSON.stringify(summary)).toBe(true);
    expect(
      summary.byPhase.highMaxRingWidth,
      JSON.stringify(summary)
    ).toBeGreaterThan(summary.byPhase.lowMaxRingWidth);
    expect(
      summary.byPhase.lowMaxRingWidth,
      JSON.stringify(summary)
    ).toBeGreaterThanOrEqual(2);
    expect(
      summary.byPhase.highMaxRingWidth,
      JSON.stringify(summary)
    ).toBeGreaterThanOrEqual(summary.byPhase.mediumMaxRingWidth);
    expect(
      summary.byPhase.lateFinalSilentMinRingWidth,
      JSON.stringify(summary)
    ).toBe(0);
    expect(
      summary.byPhase.lateFinalSilentMaxLevel,
      JSON.stringify(summary)
    ).toBeLessThan(0.08);
  });

  test("verifies browser fake microphone through LiveKit real media path", async ({
    page,
  }) => {
    test.skip(
      process.env.PLAYWRIGHT_MEDIA_AUDIO_METER_LIVEKIT !== "1",
      "Run this spec directly so Playwright starts the local LiveKit media stack."
    );

    const roomId = createSmokeRoomId("audio-meter-real");

    await page.goto(
      getAudioMeterRoomUrl(roomId, {
        audioMeterDebug: "1",
        uiDebugControls: "1",
      })
    );

    const fakeMediaProbe = await page.evaluate(async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      const result = {
        audioTracks: stream.getAudioTracks().map((track) => ({
          label: track.label,
          readyState: track.readyState,
        })),
        videoTracks: stream.getVideoTracks().map((track) => ({
          label: track.label,
          readyState: track.readyState,
        })),
      };

      stream.getTracks().forEach((track) => {
        track.stop();
      });

      return result;
    });

    console.log("[media-audio-meter][browser-fake-media]", fakeMediaProbe);
    expect(fakeMediaProbe.audioTracks.length).toBeGreaterThan(0);
    expect(fakeMediaProbe.videoTracks.length).toBeGreaterThan(0);

    await joinRoom(page, {
      roomId,
      name: "Audio Meter Real",
    });

    const meter = page.locator('[data-testid^="media-audio-meter-"]').first();

    await expect(meter).toBeVisible();
    await expect(meter).toHaveAttribute("data-audio-meter-source", "real");
    await expect(meter).toHaveAttribute("data-audio-meter-track", "live", {
      timeout: 20_000,
    });
    await expect(meter).toHaveAttribute("data-audio-meter-context", "running", {
      timeout: 20_000,
    });

    const samples = await collectAudioMeterSamples(page, 8_000);
    const summary = summarizeAudioMeterSamples(samples);

    console.log("[media-audio-meter][livekit-real]", JSON.stringify(summary));

    expectCommonAudioMeterHealth(samples, summary, "real");
    expect(summary.rms.max, JSON.stringify(summary)).toBeGreaterThan(0.001);
    expect(summary.level.max, JSON.stringify(summary)).toBeGreaterThan(0.03);
  });
});
