import { defineConfig } from "@playwright/test";

const SMOKE_FRONTEND_PORT = 4173;
const SMOKE_BACKEND_PORT = 1235;
const smokeBaseUrl = `http://127.0.0.1:${SMOKE_FRONTEND_PORT}`;

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
    {
      command: "node ./scripts/yjs-dev-server.mjs",
      name: "presence-server",
      url: `http://127.0.0.1:${SMOKE_BACKEND_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        HOST: "127.0.0.1",
        PORT: String(SMOKE_BACKEND_PORT),
        PLAY_SPACE_ENV_FILE: ".env.localdev.example",
        LIVEKIT_API_KEY: "",
        LIVEKIT_API_SECRET: "",
      },
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${SMOKE_FRONTEND_PORT} --strictPort`,
      name: "vite",
      url: smokeBaseUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        VITE_ENABLE_LIVEKIT_MEDIA: "false",
        VITE_LIVEKIT_URL: "ws://127.0.0.1:7880",
        VITE_Y_WEBSOCKET_URL: `ws://127.0.0.1:${SMOKE_BACKEND_PORT}`,
      },
    },
  ],
});
