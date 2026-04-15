import { expect, type Page } from "@playwright/test";

type JoinRoomOptions = {
  roomId: string;
  name: string;
  color?: string;
};

type RoomObjectCountExpectation = Partial<{
  total: number;
  tokens: number;
  images: number;
  notes: number;
}>;

export function createSmokeRoomId(label: string) {
  const entropy = Math.random().toString(36).slice(2, 8);
  return `pw-${label}-${Date.now()}-${entropy}`;
}

export async function openEntryPage(page: Page, roomId: string) {
  await page.goto(`/?room=${encodeURIComponent(roomId)}&uiDebugControls=1`);
  await expect(page.getByTestId("entry-form")).toBeVisible();
  await expect(page.getByTestId("entry-room-input")).toHaveValue(roomId);
}

export async function joinRoom(page: Page, options: JoinRoomOptions) {
  await expect(page.getByTestId("entry-room-input")).toBeVisible();
  await page.getByTestId("entry-room-input").fill(options.roomId);
  await page.getByTestId("entry-name-input").fill(options.name);

  if (options.color) {
    await page.getByLabel(`Select color ${options.color}`).click();
  }

  await expect(page.getByTestId("entry-join-button")).toBeEnabled();
  await page.getByTestId("entry-join-button").click();
  await expect(page.getByTestId("session-leave-room-button")).toBeVisible();
}

export async function openDebugTools(page: Page) {
  const toggle = page.getByTestId("session-debug-tools-toggle");

  await expect(toggle).toBeVisible();

  if (!(await toggle.isChecked())) {
    await toggle.check({ force: true });
  }

  await expect(page.getByTestId("debug-room-object-counts")).toBeVisible();
  await expect(page.getByTestId("debug-local-replica-inspection")).toBeVisible();
}

export async function expectRoomObjectCounts(
  page: Page,
  expected: RoomObjectCountExpectation
) {
  const counts = page.getByTestId("debug-room-object-counts");

  if (expected.total !== undefined) {
    await expect(counts).toContainText(`Total: ${expected.total}`);
  }

  if (expected.tokens !== undefined) {
    await expect(counts).toContainText(`tokens ${expected.tokens}`);
  }

  if (expected.images !== undefined) {
    await expect(counts).toContainText(`images ${expected.images}`);
  }

  if (expected.notes !== undefined) {
    await expect(counts).toContainText(`notes ${expected.notes}`);
  }
}

export async function getRoomObjectCounts(page: Page) {
  const counts = page.getByTestId("debug-room-object-counts");

  await expect(counts).toBeVisible();

  const text = await counts.innerText();

  return {
    total: extractCount(text, /Total:\s*(\d+)/),
    tokens: extractCount(text, /tokens\s+(\d+)/),
    images: extractCount(text, /images\s+(\d+)/),
    notes: extractCount(text, /notes\s+(\d+)/),
  };
}

export async function expectBootstrapBranch(page: Page, branch: string) {
  const inspection = page.getByTestId("debug-local-replica-inspection");

  await expect(inspection).not.toContainText("Bootstrap: pending");
  await expect(inspection).toContainText(`Bootstrap: ${branch}`);
}

function extractCount(text: string, pattern: RegExp) {
  const match = text.match(pattern);

  if (!match) {
    throw new Error(`Failed to read object count from: ${text}`);
  }

  return Number(match[1]);
}
