import { expect, test } from "@playwright/test";
import {
  createSmokeRoomId,
  expectBootstrapBranch,
  expectRoomObjectCounts,
  getRoomObjectCounts,
  joinRoom,
  openDebugTools,
  openEntryPage,
} from "./helpers/roomSmoke";

test.describe("local room smoke corridors", () => {
  test("syncs a committed note to a second browser context", async ({
    browser,
    page,
  }) => {
    const roomId = createSmokeRoomId("shared-note");

    await openEntryPage(page, roomId);
    await joinRoom(page, {
      roomId,
      name: "Smoke Alice",
    });
    await openDebugTools(page);
    const initialAliceCounts = await getRoomObjectCounts(page);

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();

    try {
      await openEntryPage(secondPage, roomId);
      await joinRoom(secondPage, {
        roomId,
        name: "Smoke Bob",
        color: "#0891b2",
      });
      await openDebugTools(secondPage);
      const initialBobCounts = await getRoomObjectCounts(secondPage);

      await page.getByTestId("debug-add-note-button").click();

      await expectRoomObjectCounts(page, {
        notes: initialAliceCounts.notes + 1,
      });
      await expectRoomObjectCounts(secondPage, {
        notes: initialBobCounts.notes + 1,
      });
    } finally {
      await secondContext.close();
    }
  });

  test("refreshes an active room while shared live state stays available", async ({
    browser,
    page,
  }) => {
    const roomId = createSmokeRoomId("refresh");

    await openEntryPage(page, roomId);
    await joinRoom(page, {
      roomId,
      name: "Smoke Reload",
    });
    await openDebugTools(page);
    const countsBeforeCreate = await getRoomObjectCounts(page);

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();

    try {
      await openEntryPage(secondPage, roomId);
      await joinRoom(secondPage, {
        roomId,
        name: "Smoke Witness",
        color: "#0891b2",
      });
      await openDebugTools(secondPage);

      await page.getByTestId("debug-add-note-button").click();
      await expectRoomObjectCounts(page, {
        notes: countsBeforeCreate.notes + 1,
      });
      await expectRoomObjectCounts(secondPage, {
        notes: countsBeforeCreate.notes + 1,
      });

      await page.reload();
      await expect(page.getByTestId("session-leave-room-button")).toBeVisible();

      await openDebugTools(page);
      await expectRoomObjectCounts(page, {
        notes: countsBeforeCreate.notes + 1,
      });
      await expectBootstrapBranch(page, "live-wins");
      await expect(page.getByTestId("debug-local-replica-inspection")).not.toContainText(
        "Error:"
      );
    } finally {
      await secondContext.close();
    }
  });
});
