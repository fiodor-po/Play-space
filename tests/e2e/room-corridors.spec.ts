import { expect, test } from "@playwright/test";
import {
  clickDebugAddNote,
  clickSmokeImageMove,
  clickSmokeImageResize,
  createSmokeRoomId,
  expectImageLabel,
  expectBootstrapBranch,
  expectRoomObjectCounts,
  getImageBounds,
  getRoomObjectCounts,
  joinRoom,
  openDebugTools,
  openEntryPage,
  uploadSmokeImage,
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

      await clickDebugAddNote(page);

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

      await clickDebugAddNote(page);
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

  test("syncs committed image move and resize to a second browser context", async ({
    browser,
    page,
  }) => {
    const roomId = createSmokeRoomId("image-sync");
    const imageLabel = `${roomId}.png`;

    await openEntryPage(page, roomId);
    await joinRoom(page, {
      roomId,
      name: "Smoke Image Alpha",
    });
    await openDebugTools(page);
    const initialCounts = await getRoomObjectCounts(page);

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();

    try {
      await openEntryPage(secondPage, roomId);
      await joinRoom(secondPage, {
        roomId,
        name: "Smoke Image Beta",
        color: "#0891b2",
      });
      await openDebugTools(secondPage);

      await uploadSmokeImage(page, imageLabel);
      await expectRoomObjectCounts(page, {
        images: initialCounts.images + 1,
      });
      await expectRoomObjectCounts(secondPage, {
        images: initialCounts.images + 1,
      });
      await expectImageLabel(page, imageLabel);
      await expectImageLabel(secondPage, imageLabel);

      const initialBounds = await getImageBounds(page);

      await clickSmokeImageMove(page);

      const movedBounds = await getImageBounds(page);
      expect(movedBounds.x).toBe(initialBounds.x + 96);
      expect(movedBounds.y).toBe(initialBounds.y + 72);
      expect(movedBounds.width).toBe(initialBounds.width);
      expect(movedBounds.height).toBe(initialBounds.height);

      await expect.poll(() => getImageBounds(secondPage)).toMatchObject({
        x: movedBounds.x,
        y: movedBounds.y,
        width: movedBounds.width,
        height: movedBounds.height,
      });

      await clickSmokeImageResize(page);

      const resizedBounds = await getImageBounds(page);
      expect(resizedBounds.x).toBe(movedBounds.x);
      expect(resizedBounds.y).toBe(movedBounds.y);
      expect(resizedBounds.width).toBe(movedBounds.width + 128);
      expect(resizedBounds.height).toBe(movedBounds.height + 96);

      await expect.poll(() => getImageBounds(secondPage)).toMatchObject({
        x: resizedBounds.x,
        y: resizedBounds.y,
        width: resizedBounds.width,
        height: resizedBounds.height,
      });
    } finally {
      await secondContext.close();
    }
  });

  test("preserves committed image bounds after refresh while room stays live", async ({
    browser,
    page,
  }) => {
    const roomId = createSmokeRoomId("image-refresh");
    const imageLabel = `${roomId}.png`;

    await openEntryPage(page, roomId);
    await joinRoom(page, {
      roomId,
      name: "Smoke Image Reload",
    });
    await openDebugTools(page);
    const initialCounts = await getRoomObjectCounts(page);

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();

    try {
      await openEntryPage(secondPage, roomId);
      await joinRoom(secondPage, {
        roomId,
        name: "Smoke Image Witness",
        color: "#0891b2",
      });
      await openDebugTools(secondPage);

      await uploadSmokeImage(page, imageLabel);
      await expectRoomObjectCounts(page, {
        images: initialCounts.images + 1,
      });
      await expectRoomObjectCounts(secondPage, {
        images: initialCounts.images + 1,
      });

      await clickSmokeImageMove(page);
      await clickSmokeImageResize(page);

      const committedBounds = await getImageBounds(page);

      await expect.poll(() => getImageBounds(secondPage)).toMatchObject({
        x: committedBounds.x,
        y: committedBounds.y,
        width: committedBounds.width,
        height: committedBounds.height,
      });

      await page.reload();
      await expect(page.getByTestId("session-leave-room-button")).toBeVisible();

      await openDebugTools(page);
      await expectRoomObjectCounts(page, {
        images: initialCounts.images + 1,
      });
      await expectImageLabel(page, imageLabel);
      await expect.poll(() => getImageBounds(page)).toMatchObject({
        x: committedBounds.x,
        y: committedBounds.y,
        width: committedBounds.width,
        height: committedBounds.height,
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
