import { defineConfig } from "@playwright/test";

const isMediaAudioMeterSpecRun = process.argv.some((argument) =>
  argument.includes("media-audio-meter.spec")
);
const SMOKE_FRONTEND_PORT = isMediaAudioMeterSpecRun ? 4274 : 4173;
const SMOKE_BACKEND_PORT = isMediaAudioMeterSpecRun ? 2236 : 1235;
const LIVEKIT_PORT = 7880;
const smokeBaseUrl = `http://127.0.0.1:${SMOKE_FRONTEND_PORT}`;

if (isMediaAudioMeterSpecRun) {
  process.env.PLAYWRIGHT_MEDIA_AUDIO_METER_LIVEKIT = "1";
  process.env.PLAYWRIGHT_MEDIA_AUDIO_METER_BASE_URL = smokeBaseUrl;
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"]],
  use: {
    baseURL: smokeBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: {
      width: 1440,
      height: 900,
    },
  },
  webServer: [
    ...(isMediaAudioMeterSpecRun
      ? [
          {
            command: "npm run livekit-server",
            name: "livekit",
            port: LIVEKIT_PORT,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
            stdout: "pipe" as const,
            stderr: "pipe" as const,
          },
        ]
      : []),
    {
      command: "node ./scripts/yjs-dev-server.mjs",
      name: "presence-server",
      url: `http://127.0.0.1:${SMOKE_BACKEND_PORT}/api/health`,
      reuseExistingServer: !process.env.CI && !isMediaAudioMeterSpecRun,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        HOST: "127.0.0.1",
        PORT: String(SMOKE_BACKEND_PORT),
        PLAY_SPACE_ENV_FILE: ".env.localdev.example",
        LIVEKIT_API_KEY: isMediaAudioMeterSpecRun ? "devkey" : "",
        LIVEKIT_API_SECRET: isMediaAudioMeterSpecRun ? "secret" : "",
      },
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${SMOKE_FRONTEND_PORT} --strictPort`,
      name: "vite",
      url: smokeBaseUrl,
      reuseExistingServer: !process.env.CI && !isMediaAudioMeterSpecRun,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        VITE_ENABLE_LIVEKIT_MEDIA: isMediaAudioMeterSpecRun ? "true" : "false",
        VITE_API_BASE_URL: `http://127.0.0.1:${SMOKE_BACKEND_PORT}`,
        VITE_LIVEKIT_TOKEN_URL: `http://127.0.0.1:${SMOKE_BACKEND_PORT}/api/livekit/token`,
        VITE_LIVEKIT_URL: "ws://127.0.0.1:7880",
        VITE_Y_WEBSOCKET_URL: `ws://127.0.0.1:${SMOKE_BACKEND_PORT}`,
      },
    },
  ],
});
