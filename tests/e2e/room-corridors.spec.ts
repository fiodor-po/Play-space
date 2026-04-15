import { expect, test } from "./helpers/smokeRuntime";
import {
  clearDurableRoomSnapshot,
  clickDebugAddNote,
  clickSmokeImageDraw,
  clickSmokeImageMove,
  clickSmokeImageResize,
  clickSmokeNoteEdit,
  clickSmokeNoteMove,
  clickSmokeNoteResize,
  clickSmokeTokenMove,
  createSmokeRoomId,
  expectBootstrapLocalSource,
  expectImageLabel,
  expectNoteLabel,
  expectBootstrapBranch,
  expectLocalReplicaLastRead,
  expectLocalReplicaLastReadRevision,
  expectLocalReplicaLastWriteRevision,
  expectLocalReplicaWriteSaved,
  getLocalReplicaLastWriteRevision,
  expectRoomObjectCounts,
  getImageBounds,
  getImageStrokeCounts,
  getNoteBounds,
  getNoteId,
  getRoomObjectCounts,
  getTokenPosition,
  joinRoom,
  openDebugTools,
  openEntryPage,
  reopenRoomForLocalRecovery,
  seedEmptyVersionedLocalReplica,
  uploadSmokeImage,
  waitForRoomOpsState,
  waitForRoomSnapshotState,
} from "./helpers/roomSmoke";

test.describe("local room smoke corridors", () => {
  test("syncs a committed note to a second browser context", async ({
    browser,
    page,
    runtimeFailureMonitor,
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
    runtimeFailureMonitor.attachContext(secondContext);
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
    runtimeFailureMonitor,
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
    runtimeFailureMonitor.attachContext(secondContext);
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
    runtimeFailureMonitor,
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
    runtimeFailureMonitor.attachContext(secondContext);
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
    runtimeFailureMonitor,
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
    runtimeFailureMonitor.attachContext(secondContext);
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

  test("preserves committed image draw save after refresh while room stays live", async ({
    browser,
    page,
    runtimeFailureMonitor,
  }) => {
    const roomId = createSmokeRoomId("image-draw-refresh");
    const imageLabel = `${roomId}.png`;

    await openEntryPage(page, roomId);
    await joinRoom(page, {
      roomId,
      name: "Smoke Image Draw Reload",
    });
    await openDebugTools(page);
    const initialCounts = await getRoomObjectCounts(page);

    const secondContext = await browser.newContext();
    runtimeFailureMonitor.attachContext(secondContext);
    const secondPage = await secondContext.newPage();

    try {
      await openEntryPage(secondPage, roomId);
      await joinRoom(secondPage, {
        roomId,
        name: "Smoke Image Draw Witness",
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

      await clickSmokeImageDraw(page);
      await expectLocalReplicaWriteSaved(page, "image-draw-commit");
      await expect.poll(() => getImageStrokeCounts(page)).toMatchObject({
        total: 1,
        own: 1,
        points: 3,
      });
      await expect.poll(() => getImageStrokeCounts(secondPage)).toMatchObject({
        total: 1,
        points: 3,
      });

      await page.reload();
      await expect(page.getByTestId("session-leave-room-button")).toBeVisible();

      await openDebugTools(page);
      await expectBootstrapBranch(page, "live-wins");
      await expectImageLabel(page, imageLabel);
      await expect.poll(() => getImageStrokeCounts(page)).toMatchObject({
        total: 1,
        own: 1,
        points: 3,
      });
      await expect(
        page.getByTestId("debug-local-replica-inspection")
      ).not.toContainText("Error:");
    } finally {
      await secondContext.close();
    }
  });

  test("recovers committed room state through same-browser local recovery without a second live client", async ({
    page,
    request,
  }) => {
    const roomId = createSmokeRoomId("local-recovery");
    const imageLabel = `${roomId}.png`;
    const context = page.context();

    await openEntryPage(page, roomId);
    await joinRoom(page, {
      roomId,
      name: "Smoke Local Recovery",
    });
    await openDebugTools(page);

    const initialCounts = await getRoomObjectCounts(page);

    await clickDebugAddNote(page);
    await expectRoomObjectCounts(page, {
      notes: initialCounts.notes + 1,
    });

    await uploadSmokeImage(page, imageLabel);
    await expectRoomObjectCounts(page, {
      images: initialCounts.images + 1,
      notes: initialCounts.notes + 1,
    });

    await clickSmokeImageMove(page);
    await clickSmokeImageResize(page);
    await expectLocalReplicaWriteSaved(page, "image-transform-end");

    const committedBounds = await getImageBounds(page);

    await waitForRoomOpsState(request, roomId, {
      liveIsActive: true,
      snapshotExists: true,
    });

    await page.close();

    await waitForRoomOpsState(request, roomId, {
      liveIsActive: false,
    });

    await clearDurableRoomSnapshot(request, roomId);
    await waitForRoomOpsState(request, roomId, {
      liveIsActive: false,
      snapshotExists: false,
    });

    const recoveredPage = await context.newPage();

    try {
      await recoveredPage.goto(
        `/?room=${encodeURIComponent(roomId)}&uiDebugControls=1`
      );
      await expect(
        recoveredPage.getByTestId("session-leave-room-button")
      ).toBeVisible();

      await openDebugTools(recoveredPage);
      await expectBootstrapBranch(recoveredPage, "local-recovery");
      await expectBootstrapLocalSource(recoveredPage, "indexeddb");
      await expectLocalReplicaLastRead(recoveredPage, "indexeddb");
      await expectRoomObjectCounts(recoveredPage, {
        images: initialCounts.images + 1,
        notes: initialCounts.notes + 1,
      });
      await expectImageLabel(recoveredPage, imageLabel);
      await expect.poll(() => getImageBounds(recoveredPage)).toMatchObject({
        x: committedBounds.x,
        y: committedBounds.y,
        width: committedBounds.width,
        height: committedBounds.height,
      });
      await expect(
        recoveredPage.getByTestId("debug-local-replica-inspection")
      ).not.toContainText("Error:");
    } finally {
      await recoveredPage.close();
    }
  });

  test("prefers a versioned empty local replica over stale room-snapshot fallback during same-browser reopen", async ({
    page,
    request,
  }) => {
    const roomId = createSmokeRoomId("versioned-empty-local-recovery");

    await openEntryPage(page, roomId);
    await joinRoom(page, {
      roomId,
      name: "Smoke Versioned Empty Local",
    });
    await openDebugTools(page);

    const initialCounts = await getRoomObjectCounts(page);

    await clickDebugAddNote(page);
    await expectRoomObjectCounts(page, {
      notes: initialCounts.notes + 1,
    });
    const createdNoteId = await getNoteId(page);

    await clickSmokeNoteMove(page);
    await expectLocalReplicaWriteSaved(page, "note-drag-end");
    const localRevision = await getLocalReplicaLastWriteRevision(page);
    expect(localRevision).toBeGreaterThan(0);

    await waitForRoomSnapshotState(page, roomId, {
      notes: initialCounts.notes + 1,
      noteId: createdNoteId,
      noteLabel: "New note",
    });

    const emptyReplicaRevision = localRevision + 1;
    await seedEmptyVersionedLocalReplica(page, roomId, emptyReplicaRevision);

    const recoveredPage = await reopenRoomForLocalRecovery(page, request, roomId);

    try {
      await expectBootstrapBranch(recoveredPage, "local-recovery");
      await expectBootstrapLocalSource(recoveredPage, "indexeddb");
      await expectLocalReplicaLastRead(recoveredPage, "indexeddb");
      await expectLocalReplicaLastReadRevision(
        recoveredPage,
        emptyReplicaRevision
      );
      await expectRoomObjectCounts(recoveredPage, {
        tokens: initialCounts.tokens,
        images: initialCounts.images,
        notes: 0,
      });
      await expect(
        recoveredPage.getByTestId("debug-local-replica-inspection")
      ).not.toContainText("Error:");
    } finally {
      await recoveredPage.close();
    }
  });

  test("recovers committed image draw save through same-browser local recovery", async ({
    page,
    request,
  }) => {
    const roomId = createSmokeRoomId("image-draw-recovery");
    const imageLabel = `${roomId}.png`;

    await openEntryPage(page, roomId);
    await joinRoom(page, {
      roomId,
      name: "Smoke Image Draw Recovery",
    });
    await openDebugTools(page);
    const initialCounts = await getRoomObjectCounts(page);

    await uploadSmokeImage(page, imageLabel);
    await expectRoomObjectCounts(page, {
      images: initialCounts.images + 1,
    });

    await clickSmokeImageDraw(page);
    await expectLocalReplicaWriteSaved(page, "image-draw-commit");
    await expect.poll(() => getImageStrokeCounts(page)).toMatchObject({
      total: 1,
      own: 1,
      points: 3,
    });

    const recoveredPage = await reopenRoomForLocalRecovery(page, request, roomId);

    try {
      await expectBootstrapBranch(recoveredPage, "local-recovery");
      await expectBootstrapLocalSource(recoveredPage, "indexeddb");
      await expectLocalReplicaLastRead(recoveredPage, "indexeddb");
      await expectRoomObjectCounts(recoveredPage, {
        images: initialCounts.images + 1,
      });
      await expectImageLabel(recoveredPage, imageLabel);
      await expect.poll(() => getImageStrokeCounts(recoveredPage)).toMatchObject({
        total: 1,
        own: 1,
        points: 3,
      });
      await expect(
        recoveredPage.getByTestId("debug-local-replica-inspection")
      ).not.toContainText("Error:");
    } finally {
      await recoveredPage.close();
    }
  });

  test("recovers committed token move through same-browser IndexedDB local recovery", async ({
    page,
    request,
  }) => {
    const roomId = createSmokeRoomId("token-recovery");

    await openEntryPage(page, roomId);
    await joinRoom(page, {
      roomId,
      name: "Smoke Token Recovery",
    });
    await openDebugTools(page);
    await expectRoomObjectCounts(page, {
      tokens: 1,
    });

    const initialTokenPosition = await getTokenPosition(page);

    await clickSmokeTokenMove(page);
    await expectLocalReplicaWriteSaved(page, "token-drop");
    const localRevision = await getLocalReplicaLastWriteRevision(page);
    expect(localRevision).toBeGreaterThan(0);
    await expectLocalReplicaLastWriteRevision(page, localRevision);

    const movedTokenPosition = await getTokenPosition(page);
    expect(movedTokenPosition.x).toBe(initialTokenPosition.x + 84);
    expect(movedTokenPosition.y).toBe(initialTokenPosition.y + 60);

    const recoveredPage = await reopenRoomForLocalRecovery(page, request, roomId);

    try {
      await expectBootstrapBranch(recoveredPage, "local-recovery");
      await expectBootstrapLocalSource(recoveredPage, "indexeddb");
      await expectLocalReplicaLastRead(recoveredPage, "indexeddb");
      await expectLocalReplicaLastReadRevision(recoveredPage, localRevision);
      await expectRoomObjectCounts(recoveredPage, {
        tokens: 1,
      });
      await expect.poll(() => getTokenPosition(recoveredPage)).toMatchObject({
        x: movedTokenPosition.x,
        y: movedTokenPosition.y,
      });
      await expect(
        recoveredPage.getByTestId("debug-local-replica-inspection")
      ).not.toContainText("Error:");
    } finally {
      await recoveredPage.close();
    }
  });

  test("recovers committed note move through same-browser IndexedDB local recovery", async ({
    page,
    request,
  }) => {
    const roomId = createSmokeRoomId("note-move-recovery");

    await openEntryPage(page, roomId);
    await joinRoom(page, {
      roomId,
      name: "Smoke Note Move",
    });
    await openDebugTools(page);

    const initialCounts = await getRoomObjectCounts(page);

    await clickDebugAddNote(page);
    await expectRoomObjectCounts(page, {
      notes: initialCounts.notes + 1,
    });

    const initialNoteBounds = await getNoteBounds(page);

    await clickSmokeNoteMove(page);
    await expectLocalReplicaWriteSaved(page, "note-drag-end");
    const localRevision = await getLocalReplicaLastWriteRevision(page);
    expect(localRevision).toBeGreaterThan(0);
    await expectLocalReplicaLastWriteRevision(page, localRevision);

    const movedNoteBounds = await getNoteBounds(page);
    expect(movedNoteBounds.x).toBe(initialNoteBounds.x + 112);
    expect(movedNoteBounds.y).toBe(initialNoteBounds.y + 84);
    expect(movedNoteBounds.width).toBe(initialNoteBounds.width);
    expect(movedNoteBounds.height).toBe(initialNoteBounds.height);

    const recoveredPage = await reopenRoomForLocalRecovery(page, request, roomId);

    try {
      await expectBootstrapBranch(recoveredPage, "local-recovery");
      await expectBootstrapLocalSource(recoveredPage, "indexeddb");
      await expectLocalReplicaLastRead(recoveredPage, "indexeddb");
      await expectLocalReplicaLastReadRevision(recoveredPage, localRevision);
      await expectRoomObjectCounts(recoveredPage, {
        tokens: initialCounts.tokens,
        notes: initialCounts.notes + 1,
      });
      await expectNoteLabel(recoveredPage, "New note");
      await expect.poll(() => getNoteBounds(recoveredPage)).toMatchObject({
        x: movedNoteBounds.x,
        y: movedNoteBounds.y,
        width: movedNoteBounds.width,
        height: movedNoteBounds.height,
      });
      await expect(
        recoveredPage.getByTestId("debug-local-replica-inspection")
      ).not.toContainText("Error:");
    } finally {
      await recoveredPage.close();
    }
  });

  test("recovers saved note text through same-browser IndexedDB local recovery", async ({
    page,
    request,
  }) => {
    const roomId = createSmokeRoomId("note-edit-recovery");

    await openEntryPage(page, roomId);
    await joinRoom(page, {
      roomId,
      name: "Smoke Note Edit",
    });
    await openDebugTools(page);

    const initialCounts = await getRoomObjectCounts(page);

    await clickDebugAddNote(page);
    await expectRoomObjectCounts(page, {
      notes: initialCounts.notes + 1,
    });
    await expectNoteLabel(page, "New note");

    await clickSmokeNoteEdit(page);
    await expectLocalReplicaWriteSaved(page, "note-text-save");
    const localRevision = await getLocalReplicaLastWriteRevision(page);
    expect(localRevision).toBeGreaterThan(0);
    await expectLocalReplicaLastWriteRevision(page, localRevision);
    await expectNoteLabel(page, "New note [smoke-saved]");

    const recoveredPage = await reopenRoomForLocalRecovery(page, request, roomId);

    try {
      await expectBootstrapBranch(recoveredPage, "local-recovery");
      await expectBootstrapLocalSource(recoveredPage, "indexeddb");
      await expectLocalReplicaLastRead(recoveredPage, "indexeddb");
      await expectLocalReplicaLastReadRevision(recoveredPage, localRevision);
      await expectRoomObjectCounts(recoveredPage, {
        tokens: initialCounts.tokens,
        notes: initialCounts.notes + 1,
      });
      await expectNoteLabel(recoveredPage, "New note [smoke-saved]");
      await expect(
        recoveredPage.getByTestId("debug-local-replica-inspection")
      ).not.toContainText("Error:");
    } finally {
      await recoveredPage.close();
    }
  });

  test("recovers committed note resize through same-browser IndexedDB local recovery", async ({
    page,
    request,
  }) => {
    const roomId = createSmokeRoomId("note-resize-recovery");

    await openEntryPage(page, roomId);
    await joinRoom(page, {
      roomId,
      name: "Smoke Note Resize",
    });
    await openDebugTools(page);

    const initialCounts = await getRoomObjectCounts(page);

    await clickDebugAddNote(page);
    await expectRoomObjectCounts(page, {
      notes: initialCounts.notes + 1,
    });

    const initialNoteBounds = await getNoteBounds(page);

    await clickSmokeNoteResize(page);
    await expectLocalReplicaWriteSaved(page, "note-resize-end");
    const localRevision = await getLocalReplicaLastWriteRevision(page);
    expect(localRevision).toBeGreaterThan(0);
    await expectLocalReplicaLastWriteRevision(page, localRevision);

    const resizedNoteBounds = await getNoteBounds(page);
    expect(resizedNoteBounds.x).toBe(initialNoteBounds.x);
    expect(resizedNoteBounds.y).toBe(initialNoteBounds.y);
    expect(resizedNoteBounds.width).toBeGreaterThan(initialNoteBounds.width);
    expect(resizedNoteBounds.height).toBeGreaterThan(initialNoteBounds.height);

    const recoveredPage = await reopenRoomForLocalRecovery(page, request, roomId);

    try {
      await expectBootstrapBranch(recoveredPage, "local-recovery");
      await expectBootstrapLocalSource(recoveredPage, "indexeddb");
      await expectLocalReplicaLastRead(recoveredPage, "indexeddb");
      await expectLocalReplicaLastReadRevision(recoveredPage, localRevision);
      await expectRoomObjectCounts(recoveredPage, {
        tokens: initialCounts.tokens,
        notes: initialCounts.notes + 1,
      });
      await expectNoteLabel(recoveredPage, "New note");
      await expect.poll(() => getNoteBounds(recoveredPage)).toMatchObject({
        x: resizedNoteBounds.x,
        y: resizedNoteBounds.y,
        width: resizedNoteBounds.width,
        height: resizedNoteBounds.height,
      });
      await expect(
        recoveredPage.getByTestId("debug-local-replica-inspection")
      ).not.toContainText("Error:");
    } finally {
      await recoveredPage.close();
    }
  });
});
