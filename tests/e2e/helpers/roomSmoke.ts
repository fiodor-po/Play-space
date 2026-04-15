import {
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

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

type ImageBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ImageStrokeCounts = {
  total: number;
  own: number;
  points: number;
};

type TokenPosition = {
  x: number;
  y: number;
};

type NoteBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type RoomOpsDetail = {
  roomId: string;
  live: {
    isActive: boolean;
    sliceCount: number;
  };
  snapshot: {
    exists: boolean;
  };
};

type RoomOpsExpectation = {
  liveIsActive?: boolean;
  snapshotExists?: boolean;
};

const SMOKE_BACKEND_URL =
  process.env.PLAYWRIGHT_SMOKE_BACKEND_URL ?? "http://127.0.0.1:1235";
const SMOKE_OPS_KEY = process.env.PLAY_SPACE_OPS_KEY ?? "dev-ops-key";

const SMOKE_IMAGE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+kv0cAAAAASUVORK5CYII=";

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
  await expect(page.getByTestId("debug-image-inspection")).toBeVisible();
  await expect(page.getByTestId("debug-token-inspection")).toBeVisible();
  await expect(page.getByTestId("debug-note-inspection")).toBeVisible();
  await expect(page.getByTestId("debug-local-replica-inspection")).toBeVisible();
  await expect(page.getByTestId("debug-local-replica-initial-open")).toBeVisible();
  await expect(page.getByTestId("debug-local-replica-bootstrap")).toBeVisible();
  await expect(
    page.getByTestId("debug-local-replica-durable-handoff")
  ).toBeVisible();
  await expect(
    page.getByTestId("debug-local-replica-bootstrap-slices")
  ).toBeVisible();
  await expect(page.getByTestId("debug-durable-replica-inspection")).toBeVisible();
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
  const inspection = page.getByTestId("debug-local-replica-bootstrap");

  await expect(inspection).not.toContainText("Bootstrap: pending");
  await expect(inspection).toContainText(`Bootstrap: ${branch}`);
}

export async function expectBootstrapLocalSource(page: Page, source: string) {
  await expect(page.getByTestId("debug-local-replica-bootstrap")).toContainText(
    `local source ${source}`
  );
}

export async function expectBootstrapSliceSource(
  page: Page,
  slice: "tokens" | "images" | "textCards",
  source: string
) {
  await expect(
    page.getByTestId("debug-local-replica-bootstrap-slices")
  ).toContainText(`${slice} ${source}`);
}

export async function expectLocalReplicaInitialOpen(
  page: Page,
  status: string,
  source: string
) {
  const inspection = page.getByTestId("debug-local-replica-initial-open");

  await expect(inspection).toContainText(`Initial open: ${status}`);
  await expect(inspection).toContainText(`source ${source}`);
}

export async function expectLocalReplicaLastRead(page: Page, source: string) {
  await expect(page.getByTestId("debug-local-replica-inspection")).toContainText(
    `Last read: ${source}`
  );
}

export async function expectLocalReplicaWriteSaved(
  page: Page,
  commitBoundary: string
) {
  const inspection = page.getByTestId("debug-local-replica-inspection");

  await expect(inspection).toContainText("Last write: saved");
  await expect(inspection).toContainText(`boundary ${commitBoundary}`);
}

export async function expectDurableReplicaWriteSaved(
  page: Page,
  boundary: string,
  slice: string
) {
  const inspection = page.getByTestId("debug-durable-replica-last-write");

  await expect(inspection).toContainText("Last write: saved");
  await expect(inspection).toContainText(`boundary ${boundary}`);
  await expect(inspection).toContainText(`slice ${slice}`);
}

export async function expectDurableReplicaWriteSavedWithoutRetry(
  page: Page,
  boundary: string,
  slice: string
) {
  await expectDurableReplicaWriteSaved(page, boundary, slice);

  const writeInspection = page.getByTestId("debug-durable-replica-last-write");
  const knownRevisions = page.getByTestId("debug-durable-replica-known-revisions");

  await expect(writeInspection).toContainText("retry count 0");
  await expect(writeInspection).toContainText("retry resolved no");
  await expect(writeInspection).toContainText("conflict slice rev none");

  const writeText = await writeInspection.innerText();
  const ackSnapshotMatch = writeText.match(/ack snapshot rev\s+(\d+)/);
  const ackSliceMatch = writeText.match(/ack slice rev\s+(\d+)/);

  if (!ackSnapshotMatch || !ackSliceMatch) {
    throw new Error(
      `Failed to read durable ack revisions from debug output: ${writeText}`
    );
  }

  const knownText = await knownRevisions.innerText();

  expect(knownText).toContain(`snapshot ${ackSnapshotMatch[1]}`);
  expect(knownText).toContain(`${slice} ${ackSliceMatch[1]}`);
}

export async function getDurableReplicaKnownRevisions(page: Page) {
  const text = await page
    .getByTestId("debug-durable-replica-known-revisions")
    .innerText();

  return {
    snapshot: extractOptionalDebugNumber(
      text,
      /snapshot\s+(\d+|none)/
    ),
    tokens: extractOptionalDebugNumber(text, /tokens\s+(\d+|none)/),
    images: extractOptionalDebugNumber(text, /images\s+(\d+|none)/),
    textCards: extractOptionalDebugNumber(text, /textCards\s+(\d+|none)/),
  };
}

export async function expectLocalReplicaLastReadRevision(
  page: Page,
  revision: number
) {
  await expect(page.getByTestId("debug-local-replica-last-read")).toContainText(
    `rev ${revision}`
  );
}

export async function expectLocalReplicaLastWriteRevision(
  page: Page,
  revision: number
) {
  await expect(
    page.getByTestId("debug-local-replica-last-write")
  ).toContainText(`rev ${revision}`);
}

export async function getLocalReplicaLastWriteRevision(page: Page) {
  return readLocalReplicaRevision(page, "debug-local-replica-last-write");
}

function readLocalReplicaRevision(page: Page, testId: string) {
  return page.getByTestId(testId).innerText().then((text) => {
    const match = text.match(/rev\s+(\d+)/);

    if (!match) {
      throw new Error(`Failed to read local replica revision from: ${text}`);
    }

    return Number(match[1]);
  });
}

export async function uploadSmokeImage(page: Page, fileName: string) {
  await page.getByTestId("image-file-input").setInputFiles({
    name: fileName,
    mimeType: "image/png",
    buffer: Buffer.from(SMOKE_IMAGE_PNG_BASE64, "base64"),
  });
}

export async function expectImageLabel(page: Page, label: string) {
  await expect(page.getByTestId("debug-image-label")).toContainText(label);
}

export async function getImageBounds(page: Page): Promise<ImageBounds> {
  const boundsText = await page.getByTestId("debug-image-bounds").innerText();
  const match = boundsText.match(
    /Bounds:\s*x\s+(-?\d+)\s+·\s+y\s+(-?\d+)\s+·\s+w\s+(\d+)\s+·\s+h\s+(\d+)/
  );

  if (!match) {
    throw new Error(`Failed to read image bounds from: ${boundsText}`);
  }

  return {
    x: Number(match[1]),
    y: Number(match[2]),
    width: Number(match[3]),
    height: Number(match[4]),
  };
}

export async function getImageStrokeCounts(
  page: Page
): Promise<ImageStrokeCounts> {
  const strokesText = await page.getByTestId("debug-image-strokes").innerText();
  const match = strokesText.match(
    /Strokes:\s*total\s+(\d+)\s+·\s+own\s+(\d+)\s+·\s+points\s+(\d+)/
  );

  if (!match) {
    throw new Error(`Failed to read image stroke counts from: ${strokesText}`);
  }

  return {
    total: Number(match[1]),
    own: Number(match[2]),
    points: Number(match[3]),
  };
}

export async function getTokenPosition(page: Page): Promise<TokenPosition> {
  const positionText = await page.getByTestId("debug-token-position").innerText();
  const match = positionText.match(/Position:\s*x\s+(-?\d+)\s+·\s+y\s+(-?\d+)/);

  if (!match) {
    throw new Error(`Failed to read token position from: ${positionText}`);
  }

  return {
    x: Number(match[1]),
    y: Number(match[2]),
  };
}

export async function getTokenId(page: Page) {
  const idText = await page.getByTestId("debug-token-id").innerText();
  const match = idText.match(/Id:\s+(.+)/);

  if (!match) {
    throw new Error(`Failed to read token id from: ${idText}`);
  }

  return match[1].trim();
}

export async function getNoteBounds(page: Page): Promise<NoteBounds> {
  const boundsText = await page.getByTestId("debug-note-bounds").innerText();
  const match = boundsText.match(
    /Bounds:\s*x\s+(-?\d+)\s+·\s+y\s+(-?\d+)\s+·\s+w\s+(\d+)\s+·\s+h\s+(\d+)/
  );

  if (!match) {
    throw new Error(`Failed to read note bounds from: ${boundsText}`);
  }

  return {
    x: Number(match[1]),
    y: Number(match[2]),
    width: Number(match[3]),
    height: Number(match[4]),
  };
}

export async function getNoteId(page: Page) {
  const idText = await page.getByTestId("debug-note-id").innerText();
  const match = idText.match(/Id:\s+(.+)/);

  if (!match) {
    throw new Error(`Failed to read note id from: ${idText}`);
  }

  return match[1].trim();
}

export async function expectNoteLabel(page: Page, label: string) {
  await expect(page.getByTestId("debug-note-label")).toContainText(label);
}

export async function clickSmokeImageMove(page: Page) {
  await expect(page.getByTestId("debug-smoke-image-move-button")).toBeEnabled();
  await page.getByTestId("debug-smoke-image-move-button").click();
}

export async function clickSmokeImageDraw(page: Page) {
  await expect(page.getByTestId("debug-smoke-image-draw-button")).toBeEnabled();
  await page.getByTestId("debug-smoke-image-draw-button").click();
}

export async function clickSmokeImageResize(page: Page) {
  await expect(page.getByTestId("debug-smoke-image-resize-button")).toBeEnabled();
  await page.getByTestId("debug-smoke-image-resize-button").click();
}

export async function clickSmokeTokenMove(page: Page) {
  await expect(page.getByTestId("debug-smoke-token-move-button")).toBeEnabled();
  await page.getByTestId("debug-smoke-token-move-button").click();
}

export async function clickSmokeNoteMove(page: Page) {
  await expect(page.getByTestId("debug-smoke-note-move-button")).toBeEnabled();
  await page.getByTestId("debug-smoke-note-move-button").click();
}

export async function clickSmokeNoteEdit(page: Page) {
  await expect(page.getByTestId("debug-smoke-note-edit-button")).toBeEnabled();
  await page.getByTestId("debug-smoke-note-edit-button").click();
}

export async function clickSmokeNoteResize(page: Page) {
  await expect(page.getByTestId("debug-smoke-note-resize-button")).toBeEnabled();
  await page.getByTestId("debug-smoke-note-resize-button").click();
}

export async function clickDebugAddNote(page: Page) {
  await expect(page.getByTestId("debug-add-note-button")).toBeVisible();
  await page.getByTestId("debug-add-note-button").evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
}

export async function waitForRoomOpsState(
  request: APIRequestContext,
  roomId: string,
  expected: RoomOpsExpectation
) {
  await expect
    .poll(async () => {
      const room = await getRoomOpsDetail(request, roomId);
      const result: RoomOpsExpectation = {};

      if (expected.liveIsActive !== undefined) {
        result.liveIsActive = room.live.isActive;
      }

      if (expected.snapshotExists !== undefined) {
        result.snapshotExists = room.snapshot.exists;
      }

      return JSON.stringify(result);
    })
    .toBe(JSON.stringify(expected));
}

export async function clearDurableRoomSnapshot(
  request: APIRequestContext,
  roomId: string
) {
  const response = await request.delete(
    `${SMOKE_BACKEND_URL}/api/rooms/${encodeURIComponent(roomId)}/durable-snapshot`,
    {
      headers: {
        "x-play-space-ops-key": SMOKE_OPS_KEY,
      },
    }
  );

  expect(response.ok()).toBeTruthy();

  await waitForRoomOpsState(request, roomId, {
    snapshotExists: false,
  });
}

export async function reopenRoomForLocalRecovery(
  page: Page,
  request: APIRequestContext,
  roomId: string
) {
  return reopenRoomForRecovery(page, request, roomId, {
    clearDurableSnapshotAfterClose: true,
  });
}

export async function reopenRoomForDurableRecovery(
  page: Page,
  request: APIRequestContext,
  roomId: string
) {
  return reopenRoomForRecovery(page, request, roomId, {
    clearDurableSnapshotAfterClose: false,
  });
}

async function reopenRoomForRecovery(
  page: Page,
  request: APIRequestContext,
  roomId: string,
  options: {
    clearDurableSnapshotAfterClose: boolean;
  }
) {
  const context = page.context();

  await waitForRoomOpsState(request, roomId, {
    liveIsActive: true,
    snapshotExists: true,
  });

  await page.close();

  await waitForRoomOpsState(request, roomId, {
    liveIsActive: false,
  });

  if (options.clearDurableSnapshotAfterClose) {
    await clearDurableRoomSnapshot(request, roomId);
    await waitForRoomOpsState(request, roomId, {
      liveIsActive: false,
      snapshotExists: false,
    });
  } else {
    await waitForRoomOpsState(request, roomId, {
      liveIsActive: false,
      snapshotExists: true,
    });
  }

  const recoveredPage = await context.newPage();

  await recoveredPage.goto(
    `/?room=${encodeURIComponent(roomId)}&uiDebugControls=1`
  );
  await expect(
    recoveredPage.getByTestId("session-leave-room-button")
  ).toBeVisible();
  await openDebugTools(recoveredPage);

  return recoveredPage;
}

export async function waitForRoomSnapshotState(
  page: Page,
  roomId: string,
  expected: {
    tokens?: number;
    images?: number;
    notes?: number;
    tokenId?: string;
    tokenPosition?: TokenPosition;
    noteId?: string;
    noteBounds?: NoteBounds;
    noteLabel?: string;
  }
) {
  await expect
    .poll(async () => {
      const snapshotState = await page.evaluate(
        ({ key, expectedTokenId, expectedNoteId }) => {
          const raw = window.localStorage.getItem(key);

          if (!raw) {
            return {
              tokens: 0,
              images: 0,
              notes: 0,
            };
          }

          const parsed = JSON.parse(raw) as {
            tokens?: Array<{ id?: string; x?: number; y?: number }>;
            images?: unknown[];
            textCards?: Array<{
              id?: string;
              x?: number;
              y?: number;
              width?: number;
              height?: number;
              label?: string;
            }>;
          };
          const matchedToken = Array.isArray(parsed.tokens)
            ? parsed.tokens.find((token) =>
                expectedTokenId ? token?.id === expectedTokenId : true
              ) ?? null
            : null;
          const matchedNote = Array.isArray(parsed.textCards)
            ? parsed.textCards.find((note) =>
                expectedNoteId ? note?.id === expectedNoteId : true
              ) ?? null
            : null;

          return {
            tokens: Array.isArray(parsed.tokens) ? parsed.tokens.length : 0,
            images: Array.isArray(parsed.images) ? parsed.images.length : 0,
            notes: Array.isArray(parsed.textCards) ? parsed.textCards.length : 0,
            tokenPosition: matchedToken
              ? {
                  x:
                    typeof matchedToken.x === "number"
                      ? Math.round(matchedToken.x)
                      : null,
                  y:
                    typeof matchedToken.y === "number"
                      ? Math.round(matchedToken.y)
                      : null,
                }
              : null,
            noteBounds: matchedNote
              ? {
                  x:
                    typeof matchedNote.x === "number"
                      ? Math.round(matchedNote.x)
                      : null,
                  y:
                    typeof matchedNote.y === "number"
                      ? Math.round(matchedNote.y)
                      : null,
                  width:
                    typeof matchedNote.width === "number"
                      ? Math.round(matchedNote.width)
                      : null,
                  height:
                    typeof matchedNote.height === "number"
                      ? Math.round(matchedNote.height)
                      : null,
                }
              : null,
            noteLabel:
              matchedNote && typeof matchedNote.label === "string"
                ? matchedNote.label
                : null,
          };
        },
        {
          key: getRoomSnapshotStorageKey(roomId),
          expectedTokenId: expected.tokenId ?? null,
          expectedNoteId: expected.noteId ?? null,
        }
      );
      const result: typeof expected = {};

      if (expected.tokens !== undefined) {
        result.tokens = snapshotState.tokens;
      }

      if (expected.images !== undefined) {
        result.images = snapshotState.images;
      }

      if (expected.notes !== undefined) {
        result.notes = snapshotState.notes;
      }

      if (expected.tokenPosition !== undefined) {
        result.tokenPosition = snapshotState.tokenPosition
          ? {
              x: snapshotState.tokenPosition.x ?? 0,
              y: snapshotState.tokenPosition.y ?? 0,
            }
          : null;
      }

      if (expected.noteBounds !== undefined) {
        result.noteBounds = snapshotState.noteBounds
          ? {
              x: snapshotState.noteBounds.x ?? 0,
              y: snapshotState.noteBounds.y ?? 0,
              width: snapshotState.noteBounds.width ?? 0,
              height: snapshotState.noteBounds.height ?? 0,
            }
          : null;
      }

      if (expected.noteLabel !== undefined) {
        result.noteLabel = snapshotState.noteLabel;
      }

      return JSON.stringify(result);
    })
    .toBe(
      JSON.stringify({
        tokens: expected.tokens,
        images: expected.images,
        notes: expected.notes,
        tokenPosition: expected.tokenPosition,
        noteBounds: expected.noteBounds,
        noteLabel: expected.noteLabel,
      })
    );
}

export async function seedEmptyVersionedLocalReplica(
  page: Page,
  roomId: string,
  revision: number
) {
  await writeIndexedDbLocalReplica(page, {
    roomId,
    revision,
    savedAt: Date.now(),
    content: {
      tokens: [],
      images: [],
      textCards: [],
    },
    lastKnownDurableSnapshotRevision: null,
    lastKnownDurableSliceRevisions: {
      tokens: null,
      images: null,
      textCards: null,
    },
  });
}

export async function seedStaleLocalReplicaNoteLabel(
  page: Page,
  roomId: string,
  options: {
    revision: number;
    label: string;
    lastKnownDurableSnapshotRevision: number | null;
    lastKnownDurableSliceRevisions: {
      tokens: number | null;
      images: number | null;
      textCards: number | null;
    };
  }
) {
  await page.evaluate(
    async ({
      nextRoomId,
      nextRevision,
      nextLabel,
      nextSavedAt,
      nextLastKnownDurableSnapshotRevision,
      nextLastKnownDurableSliceRevisions,
    }) => {
      const openDatabase = () =>
        new Promise<IDBDatabase>((resolve, reject) => {
          const request = window.indexedDB.open(
            "play-space-alpha-browser-storage-v1",
            1
          );

          request.onerror = () => {
            reject(request.error ?? new Error("indexeddb-open-failed"));
          };

          request.onsuccess = () => {
            resolve(request.result);
          };
        });

      const readReplica = async (roomIdToRead: string) => {
        const database = await openDatabase();

        try {
          const transaction = database.transaction(
            "room-document-replicas",
            "readonly"
          );
          const store = transaction.objectStore("room-document-replicas");
          const replica = await new Promise<any>((resolve, reject) => {
            const request = store.get(roomIdToRead);

            request.onerror = () => {
              reject(request.error ?? new Error("indexeddb-read-failed"));
            };

            request.onsuccess = () => {
              resolve(request.result ?? null);
            };
          });

          await new Promise<void>((resolve, reject) => {
            transaction.onerror = () => {
              reject(transaction.error ?? new Error("indexeddb-read-failed"));
            };

            transaction.oncomplete = () => {
              resolve();
            };
          });

          return replica;
        } finally {
          database.close();
        }
      };

      const writeReplica = async (nextReplica: unknown) => {
        const database = await openDatabase();

        try {
          const transaction = database.transaction(
            "room-document-replicas",
            "readwrite"
          );

          transaction.objectStore("room-document-replicas").put(nextReplica);

          await new Promise<void>((resolve, reject) => {
            transaction.onerror = () => {
              reject(transaction.error ?? new Error("indexeddb-write-failed"));
            };

            transaction.oncomplete = () => {
              resolve();
            };
          });
        } finally {
          database.close();
        }
      };

      const replica = await readReplica(nextRoomId);

      if (!replica) {
        throw new Error("local-replica-missing");
      }

      const staleTextCards = Array.isArray(replica.content?.textCards)
        ? replica.content.textCards
        : [];

      if (staleTextCards.length === 0) {
        throw new Error("local-replica-note-missing");
      }

      staleTextCards[0] = {
        ...staleTextCards[0],
        label: nextLabel,
      };

      await writeReplica({
        ...replica,
        roomId: nextRoomId,
        revision: nextRevision,
        savedAt: nextSavedAt,
        content: {
          ...replica.content,
          textCards: staleTextCards,
        },
        lastKnownDurableSnapshotRevision: nextLastKnownDurableSnapshotRevision,
        lastKnownDurableSliceRevisions: nextLastKnownDurableSliceRevisions,
      });
    },
    {
      nextRoomId: roomId,
      nextRevision: options.revision,
      nextLabel: options.label,
      nextSavedAt: Date.now(),
      nextLastKnownDurableSnapshotRevision:
        options.lastKnownDurableSnapshotRevision,
      nextLastKnownDurableSliceRevisions:
        options.lastKnownDurableSliceRevisions,
    }
  );
}

async function writeIndexedDbLocalReplica(
  page: Page,
  replica: {
    roomId: string;
    revision: number | null;
    savedAt: number;
    content: {
      tokens: unknown[];
      images: unknown[];
      textCards: unknown[];
    };
    lastKnownDurableSnapshotRevision: number | null;
    lastKnownDurableSliceRevisions: {
      tokens: number | null;
      images: number | null;
      textCards: number | null;
    };
  }
) {
  await page.evaluate(async (nextReplica) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = window.indexedDB.open(
        "play-space-alpha-browser-storage-v1",
        1
      );

      request.onerror = () => {
        reject(request.error ?? new Error("indexeddb-open-failed"));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });

    try {
      const transaction = database.transaction(
        "room-document-replicas",
        "readwrite"
      );

      transaction.objectStore("room-document-replicas").put(nextReplica);

      await new Promise<void>((resolve, reject) => {
        transaction.onerror = () => {
          reject(transaction.error ?? new Error("indexeddb-write-failed"));
        };

        transaction.oncomplete = () => {
          resolve();
        };
      });
    } finally {
      database.close();
    }
  }, replica);
}

function extractCount(text: string, pattern: RegExp) {
  const match = text.match(pattern);

  if (!match) {
    throw new Error(`Failed to read object count from: ${text}`);
  }

  return Number(match[1]);
}

function extractOptionalDebugNumber(text: string, pattern: RegExp) {
  const match = text.match(pattern);

  if (!match) {
    throw new Error(`Failed to read debug number from: ${text}`);
  }

  return match[1] === "none" ? null : Number(match[1]);
}

async function getRoomOpsDetail(
  request: APIRequestContext,
  roomId: string
): Promise<RoomOpsDetail> {
  const response = await request.get(
    `${SMOKE_BACKEND_URL}/api/rooms/${encodeURIComponent(roomId)}`,
    {
      headers: {
        "x-play-space-ops-key": SMOKE_OPS_KEY,
      },
    }
  );

  expect(response.ok()).toBeTruthy();

  const body = (await response.json()) as {
    room?: RoomOpsDetail;
  };

  if (!body.room) {
    throw new Error(`Missing room ops detail for ${roomId}`);
  }

  return body.room;
}

function getRoomSnapshotStorageKey(roomId: string) {
  return `play-space-alpha-room-snapshot-v1:${normalizeRoomId(roomId)}`;
}

function normalizeRoomId(roomId: string) {
  return roomId.trim().replace(/\s+/g, " ").toLowerCase();
}
