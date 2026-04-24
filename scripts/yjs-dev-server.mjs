import http from "node:http";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import { AccessToken } from "livekit-server-sdk";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";

loadDotEnvFile(
  process.env.PLAY_SPACE_ENV_FILE || path.join(process.cwd(), ".env.localdev")
);

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || "1234");
const messageSync = 0;
const messageAwareness = 1;
const pingTimeoutMs = 30000;
const docs = new Map();
const defaultRuntimeDataDir = path.join(process.cwd(), ".runtime-data");
const durableSnapshotStorePath =
  process.env.ROOM_SNAPSHOT_STORE_FILE ||
  path.join(defaultRuntimeDataDir, "room-snapshots.json");
const durableIdentityStorePath =
  process.env.ROOM_IDENTITY_STORE_FILE ||
  path.join(defaultRuntimeDataDir, "room-identities.json");
const feedbackStorePath =
  process.env.FEEDBACK_STORE_FILE ||
  path.join(defaultRuntimeDataDir, "feedback.jsonl");
const opsKey = readEnvString("PLAY_SPACE_OPS_KEY");
const PARTICIPANT_AVATAR_FACE_IDS = [
  "mood-smile",
  "mood-happy",
  "mood-crazy-happy",
  "mood-wink",
  "mood-tongue",
  "mood-nerd",
  "mood-boy",
  "mood-xd",
  "ghost",
  "mood-kid",
  "mood-surprised",
  "mood-confuzed",
  "mood-puzzled",
  "mood-sad",
  "mood-angry",
  "mood-sick",
];
const PARTICIPANT_AVATAR_FACE_ID_SET = new Set(PARTICIPANT_AVATAR_FACE_IDS);
const ROOM_DOC_PREFIXES = {
  tokens: "play-space-alpha-tokens:",
  images: "play-space-alpha-images:",
  textCards: "play-space-alpha-text-cards:",
  presence: "play-space-alpha-presence:",
  roomState: "play-space-alpha-room-state:",
};
const ROOM_BACKGROUND_THEME_IDS = new Set([
  "dot-grid-dark-blue",
  "dot-grid-soft-light",
  "graph-paper",
  "granite",
  "granite-mid",
  "granite-dark",
  "cork-board",
  "starfield",
]);
const DEFAULT_ROOM_BACKGROUND_THEME_ID = "dot-grid-dark-blue";

class WSSharedDoc extends Y.Doc {
  constructor(name) {
    super();
    this.name = name;
    this.conns = new Map();
    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.setLocalState(null);

    this.awareness.on("update", ({ added, updated, removed }, conn) => {
      const changedClients = added.concat(updated, removed);

      if (conn !== null) {
        const controlledIds = this.conns.get(conn);

        if (controlledIds) {
          added.forEach((clientId) => controlledIds.add(clientId));
          removed.forEach((clientId) => controlledIds.delete(clientId));
        }
      }

      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      );
      const message = encoding.toUint8Array(encoder);

      this.conns.forEach((_, currentConn) => {
        send(this, currentConn, message);
      });
    });

    this.on("update", (update) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);

      this.conns.forEach((_, currentConn) => {
        send(this, currentConn, message);
      });
    });
  }
}

const server = http.createServer((req, res) => {
  installCorsWriteHead(req, res);

  void handleHttpRequest(req, res).catch((error) => {
    console.error("Failed to handle HTTP request", error);

    if (res.headersSent) {
      res.end();
      return;
    }

    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  });
});
const wss = new WebSocketServer({ server });

wss.on("connection", (conn, req) => {
  const docName = normalizeRealtimeDocName((req.url || "/").slice(1).split("?")[0]);
  const doc = getDoc(docName);

  conn.binaryType = "arraybuffer";
  doc.conns.set(conn, new Set());

  conn.on("message", (message) => {
    handleMessage(conn, doc, new Uint8Array(message));
  });

  let pongReceived = true;
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      closeConn(doc, conn);
      clearInterval(pingInterval);
      return;
    }

    if (!doc.conns.has(conn)) {
      clearInterval(pingInterval);
      return;
    }

    pongReceived = false;

    try {
      conn.ping();
    } catch {
      closeConn(doc, conn);
      clearInterval(pingInterval);
    }
  }, pingTimeoutMs);

  conn.on("pong", () => {
    pongReceived = true;
  });

  conn.on("close", () => {
    closeConn(doc, conn);
    clearInterval(pingInterval);
  });

  const syncEncoder = encoding.createEncoder();
  encoding.writeVarUint(syncEncoder, messageSync);
  syncProtocol.writeSyncStep1(syncEncoder, doc);
  send(doc, conn, encoding.toUint8Array(syncEncoder));

  const awarenessStates = doc.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, messageAwareness);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        doc.awareness,
        Array.from(awarenessStates.keys())
      )
    );
    send(doc, conn, encoding.toUint8Array(awarenessEncoder));
  }
});

server.listen(port, host, () => {
  const liveKitConfig = getLiveKitConfig();

  console.info("[runtime-config][presence-server]", {
    host,
    port,
    envFile:
      process.env.PLAY_SPACE_ENV_FILE || path.join(process.cwd(), ".env.localdev"),
    durableSnapshotStorePath,
    durableIdentityStorePath,
    feedbackStorePath,
    liveKitTokenRouteEnabled: liveKitConfig.enabled,
    liveKitStatus: liveKitConfig.enabled ? "enabled" : "disabled",
    liveKitCredentials: {
      apiKeyPresent: liveKitConfig.apiKeyPresent,
      apiSecretPresent: liveKitConfig.apiSecretPresent,
    },
  });

  if (!liveKitConfig.enabled) {
    console.warn("[runtime-config][presence-server][livekit-disabled]", {
      reason: getLiveKitDisabledReason(liveKitConfig),
    });
  }

  console.info(`running at '${host}' on port ${port}`);
});

function loadDotEnvFile(filePath) {
  if (!fsSync.existsSync(filePath)) {
    return;
  }

  try {
    const fileContents = fsSync.readFileSync(filePath, "utf8");

    fileContents.split(/\r?\n/).forEach((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmedLine.indexOf("=");

      if (separatorIndex <= 0) {
        return;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();

      if (!key || process.env[key] !== undefined) {
        return;
      }

      const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, "");
      process.env[key] = value;
    });
  } catch (error) {
    console.warn("Failed to load .env file", error);
  }
}

async function handleHttpRequest(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`
  );
  const snapshotRouteMatch = requestUrl.pathname.match(
    /^\/api\/room-snapshots\/([^/]+)$/
  );
  const roomIdentityRouteMatch = requestUrl.pathname.match(
    /^\/api\/room-identities\/([^/]+)$/
  );
  const roomsRouteMatch = requestUrl.pathname === "/api/rooms";
  const roomDetailRouteMatch = requestUrl.pathname.match(/^\/api\/rooms\/([^/]+)$/);
  const roomSnapshotDeleteRouteMatch = requestUrl.pathname.match(
    /^\/api\/rooms\/([^/]+)\/durable-snapshot$/
  );
  const clientResetPolicyRouteMatch =
    requestUrl.pathname === "/api/client-reset-policy";
  const liveKitTokenRouteMatch =
    requestUrl.pathname === "/api/livekit/token";
  const feedbackRouteMatch = requestUrl.pathname === "/api/feedback";
  const feedbackOpsRouteMatch = requestUrl.pathname === "/api/ops/feedback";
  const healthRouteMatch = requestUrl.pathname === "/api/health";

  if (
    !snapshotRouteMatch &&
    !liveKitTokenRouteMatch &&
    !feedbackRouteMatch &&
    !feedbackOpsRouteMatch &&
    !healthRouteMatch &&
    !roomIdentityRouteMatch &&
    !clientResetPolicyRouteMatch &&
    !roomsRouteMatch &&
    !roomDetailRouteMatch &&
    !roomSnapshotDeleteRouteMatch
  ) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  if (healthRouteMatch) {
    const liveKitConfig = getLiveKitConfig();

    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        service: "play-space-alpha-realtime-api",
        host,
        port,
        features: {
          roomIdentity: true,
          roomSnapshots: true,
          feedbackCapture: true,
          liveKitTokenRoute: liveKitConfig.enabled,
        },
        liveKitStatus: liveKitConfig.enabled ? "enabled" : "disabled",
        liveKitCredentials: {
          apiKeyPresent: liveKitConfig.apiKeyPresent,
          apiSecretPresent: liveKitConfig.apiSecretPresent,
        },
        durableIdentityStorePath,
        durableSnapshotStorePath,
        feedbackStorePath,
      })
    );
    return;
  }

  if (feedbackRouteMatch) {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const body = await readJsonBody(req);
    const feedbackEntry = normalizeFeedbackCapture(body);

    if (!feedbackEntry) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "type, message, roomId, and participant are required",
          code: "INVALID_FEEDBACK_REQUEST",
        })
      );
      return;
    }

    await appendFeedbackCapture(feedbackEntry);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (feedbackOpsRouteMatch) {
    if (!requireOpsAuthorization(req, res)) {
      return;
    }

    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const limit = readQueryPositiveInteger(requestUrl, "limit", 50, 1, 200);
    const cursorParseResult = readFeedbackRecordCursorQuery(requestUrl, "cursor");

    if (!cursorParseResult.ok) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Invalid feedback cursor",
          code: "INVALID_FEEDBACK_CURSOR",
        })
      );
      return;
    }

    const cursor = cursorParseResult.value;
    const type = readFeedbackQueryType(requestUrl);
    const roomId = readOptionalNormalizedRoomIdQuery(requestUrl, "roomId");
    const participantId = readOptionalFeedbackQueryString(
      requestUrl,
      "participantId",
      160
    );
    const since = readOptionalIsoTimestampQuery(requestUrl, "since");
    const feedbackEntries = await readFeedbackCaptures();
    const filteredEntries = feedbackEntries.filter((entry) => {
      if (type && entry.type !== type) {
        return false;
      }

      if (roomId && entry.roomId !== roomId) {
        return false;
      }

      if (participantId && entry.participant.id !== participantId) {
        return false;
      }

      if (since && entry.receivedAt < since) {
        return false;
      }

      return true;
    });
    const pagedEntries = cursor
      ? filteredEntries.filter(
          (entry) => compareFeedbackCursorPoint(entry, cursor) > 0
        )
      : filteredEntries;
    const items = pagedEntries.slice(0, limit);
    const nextCursor =
      items.length === limit && pagedEntries.length > limit
        ? createFeedbackRecordCursor(items[items.length - 1])
        : null;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        items,
        totalCount: filteredEntries.length,
        limit,
        nextCursor,
        filters: {
          type,
          roomId,
          participantId,
          since,
        },
      })
    );
    return;
  }

  if (roomsRouteMatch) {
    if (!requireOpsAuthorization(req, res)) {
      return;
    }

    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const snapshotStore = await readDurableSnapshotStore();
    const identityStore = await readDurableIdentityStore();
    const rooms = getRoomOpsSummaries(identityStore, snapshotStore);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ rooms }));
    return;
  }

  if (clientResetPolicyRouteMatch) {
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        policy: getClientResetPolicy(),
      })
    );
    return;
  }

  if (roomDetailRouteMatch) {
    if (!requireOpsAuthorization(req, res)) {
      return;
    }

    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const roomId = normalizeRoomId(decodeURIComponent(roomDetailRouteMatch[1]));
    const snapshotStore = await readDurableSnapshotStore();
    const identityStore = await readDurableIdentityStore();
    const room = getRoomOpsDetail(roomId, identityStore, snapshotStore);

    if (!room) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Room not found" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ room }));
    return;
  }

  if (roomSnapshotDeleteRouteMatch) {
    if (!requireOpsAuthorization(req, res)) {
      return;
    }

    if (req.method !== "DELETE") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const roomId = normalizeRoomId(decodeURIComponent(roomSnapshotDeleteRouteMatch[1]));
    const result = await deleteDurableRoomSnapshot(roomId);
    const snapshotStore = await readDurableSnapshotStore();
    const identityStore = await readDurableIdentityStore();
    const room = getRoomOpsDetail(roomId, identityStore, snapshotStore);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        deleted: result.deleted,
        roomId,
        room,
      })
    );
    return;
  }

  if (roomIdentityRouteMatch) {
    const roomId = normalizeRoomId(decodeURIComponent(roomIdentityRouteMatch[1]));

    if (req.method === "GET") {
      const identity = await readDurableRoomIdentity(roomId);

      if (!identity) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ identity: null }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ identity }));
      return;
    }

    if (req.method === "PUT") {
      const body = await readJsonBody(req);

      if (!body || typeof body !== "object") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON body" }));
        return;
      }

      const identity = await ensureDurableRoomIdentity(roomId, body);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ identity }));
      return;
    }

    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  if (liveKitTokenRouteMatch) {
    const liveKitConfig = getLiveKitConfig();

    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    if (!liveKitConfig.enabled) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: getLiveKitDisabledReason(liveKitConfig),
          code: "LIVEKIT_DISABLED",
          liveKitCredentials: {
            apiKeyPresent: liveKitConfig.apiKeyPresent,
            apiSecretPresent: liveKitConfig.apiSecretPresent,
          },
        })
      );
      return;
    }

    const body = await readJsonBody(req);

    if (!body || typeof body !== "object") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }

    const roomId =
      typeof body.roomId === "string" ? normalizeRoomId(body.roomId) : "";
    const participantId =
      typeof body.participantId === "string" ? body.participantId.trim() : "";
    const participantName =
      typeof body.participantName === "string"
        ? body.participantName.trim()
        : "";

    if (!roomId || !participantId || !participantName) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "roomId, participantId, and participantName are required",
          code: "INVALID_LIVEKIT_TOKEN_REQUEST",
        })
      );
      return;
    }

    const token = await createLiveKitToken({
      roomId,
      participantId,
      participantName,
    });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ token }));
    return;
  }

  const roomId = normalizeRoomId(decodeURIComponent(snapshotRouteMatch[1]));

  if (req.method === "GET") {
    const snapshot = await readDurableRoomSnapshot(roomId);

    if (!snapshot) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ snapshot: null }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ snapshot }));
    return;
  }

  if (req.method === "PUT") {
    const body = await readJsonBody(req);

    if (!body || typeof body !== "object") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }

    const baseRevision =
      typeof body.baseRevision === "number" ? body.baseRevision : null;
    const nextSnapshot = createDurableRoomSnapshot(roomId, body);
    const result = await writeDurableRoomSnapshot(nextSnapshot, baseRevision);

    if (result.status === "conflict") {
      res.writeHead(409, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ currentRevision: result.currentRevision }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ snapshot: result.snapshot }));
    return;
  }

  if (req.method === "PATCH") {
    const body = await readJsonBody(req);

    if (!body || typeof body !== "object") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }

    const participantAppearance = normalizeRoomParticipantAppearance(
      body.participantAppearance
    );
    const baseRevision =
      typeof body.baseRevision === "number" ? body.baseRevision : null;

    if (participantAppearance) {
      const result = await writeDurableRoomParticipantAppearance(
        roomId,
        participantAppearance,
        baseRevision
      );

      if (result.status === "conflict") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "conflict",
            currentRevision: result.currentRevision,
          })
        );
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "saved",
          snapshot: result.snapshot,
        })
      );
      return;
    }

    const slice = normalizeDurableRoomSnapshotSlice(body.slice);

    if (!slice) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid durable snapshot slice" }));
      return;
    }

    const baseSliceRevision =
      typeof body.baseSliceRevision === "number" ? body.baseSliceRevision : null;
    const result = await writeDurableRoomSnapshotSlice(
      roomId,
      slice,
      body.payload,
      baseSliceRevision
    );

    if (result.status === "conflict") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "conflict",
          currentRevision: result.currentRevision,
          currentSliceRevision: result.currentSliceRevision,
        })
      );
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "saved",
        ack: result.ack,
      })
    );
    return;
  }

  res.writeHead(405, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Method not allowed" }));
}

function getDoc(name) {
  let doc = docs.get(name);

  if (!doc) {
    doc = new WSSharedDoc(name);
    docs.set(name, doc);
  }

  return doc;
}

async function readDurableRoomSnapshot(roomId) {
  const store = await readDurableSnapshotStore();
  const snapshot = store[roomId];

  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  return normalizeDurableRoomSnapshot(roomId, snapshot);
}

async function writeDurableRoomSnapshot(snapshot, baseRevision) {
  const store = await readDurableSnapshotStore();
  const currentSnapshot = normalizeDurableRoomSnapshot(snapshot.roomId, store[snapshot.roomId]);
  const currentRevision = currentSnapshot?.revision ?? null;

  if (currentRevision !== baseRevision) {
    return {
      status: "conflict",
      currentRevision,
    };
  }

  const nextRevision = (currentRevision ?? 0) + 1;
  const nextSnapshot = {
    ...snapshot,
    revision: nextRevision,
    savedAt: new Date().toISOString(),
    sliceRevisions: createUniformDurableRoomSnapshotSliceRevisions(nextRevision),
  };

  store[snapshot.roomId] = nextSnapshot;
  await writeDurableSnapshotStore(store);

  return {
    status: "saved",
    snapshot: nextSnapshot,
  };
}

async function writeDurableRoomSnapshotSlice(
  roomId,
  slice,
  payload,
  baseSliceRevision
) {
  const store = await readDurableSnapshotStore();
  const currentSnapshot = normalizeDurableRoomSnapshot(roomId, store[roomId]);
  const currentRevision = currentSnapshot?.revision ?? null;
  const currentSliceRevision = currentSnapshot?.sliceRevisions[slice] ?? null;

  if (currentSliceRevision !== baseSliceRevision) {
    return {
      status: "conflict",
      currentRevision,
      currentSliceRevision,
    };
  }

  const nextRevision = (currentRevision ?? 0) + 1;
  const nextSliceRevision = (currentSliceRevision ?? 0) + 1;
  const nextSnapshot = {
    ...(currentSnapshot ?? createEmptyDurableRoomSnapshot(roomId)),
    [slice]: normalizeRoomObjects(payload, getDurableRoomSnapshotSliceKind(slice)),
    revision: nextRevision,
    savedAt: new Date().toISOString(),
    sliceRevisions: {
      ...(currentSnapshot?.sliceRevisions ??
        createUniformDurableRoomSnapshotSliceRevisions(0)),
      [slice]: nextSliceRevision,
    },
  };

  store[roomId] = nextSnapshot;
  await writeDurableSnapshotStore(store);

  return {
    status: "saved",
    ack: {
      roomId,
      slice,
      snapshotRevision: nextSnapshot.revision,
      sliceRevision: nextSnapshot.sliceRevisions[slice],
      savedAt: nextSnapshot.savedAt,
      objectCount: nextSnapshot[slice].length,
    },
  };
}

async function writeDurableRoomParticipantAppearance(
  roomId,
  participantAppearance,
  baseRevision
) {
  const store = await readDurableSnapshotStore();
  const currentSnapshot = normalizeDurableRoomSnapshot(roomId, store[roomId]);
  const currentRevision = currentSnapshot?.revision ?? null;

  if (currentRevision !== baseRevision) {
    return {
      status: "conflict",
      currentRevision,
    };
  }

  const nextRevision = (currentRevision ?? 0) + 1;
  const nextParticipantAppearance = canonicalizeRoomParticipantAppearance(
    currentSnapshot?.participantAppearance ?? {},
    participantAppearance
  );
  const nextSnapshot = {
    ...(currentSnapshot ?? createEmptyDurableRoomSnapshot(roomId)),
    revision: nextRevision,
    savedAt: new Date().toISOString(),
    participantAppearance: {
      ...(currentSnapshot?.participantAppearance ?? {}),
      [nextParticipantAppearance.participantId]: nextParticipantAppearance,
    },
  };

  store[roomId] = nextSnapshot;
  await writeDurableSnapshotStore(store);

  return {
    status: "saved",
    snapshot: nextSnapshot,
  };
}

async function deleteDurableRoomSnapshot(roomId) {
  const store = await readDurableSnapshotStore();

  if (!(roomId in store)) {
    return { deleted: false };
  }

  delete store[roomId];
  await writeDurableSnapshotStore(store);
  return { deleted: true };
}

async function readDurableRoomIdentity(roomId) {
  const store = await readDurableIdentityStore();
  const identity = store[roomId];

  if (!identity || typeof identity !== "object") {
    return null;
  }

  return normalizeDurableRoomIdentity(roomId, identity);
}

async function ensureDurableRoomIdentity(roomId, body) {
  const identityStore = await readDurableIdentityStore();
  const existingIdentity = normalizeDurableRoomIdentity(
    roomId,
    identityStore[roomId]
  );
  const requestedBackgroundThemeId =
    typeof body.backgroundThemeId === "string" &&
    ROOM_BACKGROUND_THEME_IDS.has(body.backgroundThemeId)
      ? body.backgroundThemeId
      : null;

  if (existingIdentity) {
    if (
      !requestedBackgroundThemeId ||
      existingIdentity.backgroundThemeId === requestedBackgroundThemeId
    ) {
      return existingIdentity;
    }

    const nextIdentity = {
      ...existingIdentity,
      backgroundThemeId: requestedBackgroundThemeId,
    };
    identityStore[roomId] = nextIdentity;
    await writeDurableIdentityStore(identityStore);
    return nextIdentity;
  }

  const snapshotStore = await readDurableSnapshotStore();
  const snapshot = normalizeDurableRoomSnapshot(roomId, snapshotStore[roomId]);
  const requestedCreatorId =
    typeof body.creatorId === "string" && body.creatorId.trim().length > 0
      ? body.creatorId.trim()
      : null;
  const creatorId = snapshot?.roomCreatorId ?? requestedCreatorId ?? null;

  const nextIdentity = {
    roomId,
    creatorId,
    createdAt: new Date().toISOString(),
    backgroundThemeId:
      requestedBackgroundThemeId ?? DEFAULT_ROOM_BACKGROUND_THEME_ID,
  };

  identityStore[roomId] = nextIdentity;
  await writeDurableIdentityStore(identityStore);
  return nextIdentity;
}

async function readDurableSnapshotStore() {
  try {
    const raw = await fs.readFile(durableSnapshotStorePath, "utf8");

    return JSON.parse(raw);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {};
    }

    console.error("Failed to read durable room snapshot store", error);
    return {};
  }
}

async function readDurableIdentityStore() {
  try {
    const raw = await fs.readFile(durableIdentityStorePath, "utf8");

    return JSON.parse(raw);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {};
    }

    console.error("Failed to read durable room identity store", error);
    return {};
  }
}

async function writeDurableSnapshotStore(store) {
  try {
    await fs.mkdir(path.dirname(durableSnapshotStorePath), { recursive: true });
    await fs.writeFile(
      durableSnapshotStorePath,
      JSON.stringify(store, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Failed to write durable room snapshot store", error);
    throw error;
  }
}

async function writeDurableIdentityStore(store) {
  try {
    await fs.mkdir(path.dirname(durableIdentityStorePath), { recursive: true });
    await fs.writeFile(
      durableIdentityStorePath,
      JSON.stringify(store, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Failed to write durable room identity store", error);
    throw error;
  }
}

async function appendFeedbackCapture(entry) {
  try {
    await fs.mkdir(path.dirname(feedbackStorePath), { recursive: true });
    await fs.appendFile(feedbackStorePath, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (error) {
    console.error("Failed to append feedback capture", error);
    throw error;
  }
}

async function readFeedbackCaptures() {
  let fileContents = "";

  try {
    fileContents = await fs.readFile(feedbackStorePath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return [];
    }

    console.error("Failed to read feedback capture store", error);
    throw error;
  }

  return fileContents
    .split(/\r?\n/)
    .map((line, index) => normalizeStoredFeedbackCaptureLine(line, index))
    .filter(Boolean)
    .sort(compareFeedbackCapturesNewestFirst);
}

function normalizeStoredFeedbackCaptureLine(line, index) {
  const trimmedLine = typeof line === "string" ? line.trim() : "";

  if (!trimmedLine) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmedLine);
    return normalizeStoredFeedbackCapture(parsed, index);
  } catch (error) {
    console.warn("[feedback-capture][invalid-jsonl-line]", {
      feedbackStorePath,
      index,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function normalizeStoredFeedbackCapture(body, index) {
  const fields = normalizeFeedbackCaptureFields(body);

  if (!fields) {
    return null;
  }

  const receivedAt =
    readOptionalFeedbackString(body.receivedAt, 80) ||
    fields.timestamp ||
    new Date(0).toISOString();
  const schemaVersion = readPositiveInteger(body.schemaVersion, 1);
  const id =
    readOptionalFeedbackString(body.id, 160) ||
    buildLegacyFeedbackCaptureId(receivedAt, index);

  return {
    id,
    schemaVersion,
    receivedAt,
    ...fields,
  };
}

function compareFeedbackCapturesNewestFirst(left, right) {
  const leftTimestamp = Date.parse(left.receivedAt);
  const rightTimestamp = Date.parse(right.receivedAt);
  const leftValue = Number.isFinite(leftTimestamp) ? leftTimestamp : 0;
  const rightValue = Number.isFinite(rightTimestamp) ? rightTimestamp : 0;

  if (leftValue !== rightValue) {
    return rightValue - leftValue;
  }

  return right.id.localeCompare(left.id);
}

function compareFeedbackCursorPoint(left, right) {
  return compareFeedbackCapturesNewestFirst(left, right);
}

function createFeedbackRecordCursor(entry) {
  return `${entry.receivedAt}|${entry.id}`;
}

function createDurableRoomSnapshot(roomId, body) {
  return {
    roomId,
    revision: 0,
    savedAt: new Date(0).toISOString(),
    sliceRevisions: createUniformDurableRoomSnapshotSliceRevisions(0),
    roomCreatorId:
      typeof body.roomCreatorId === "string" && body.roomCreatorId.trim().length > 0
        ? body.roomCreatorId.trim()
        : null,
    tokens: normalizeRoomObjects(body.tokens, "token"),
    images: normalizeRoomObjects(body.images, "image"),
    textCards: normalizeRoomObjects(body.textCards, "note-card"),
    participantAppearance: normalizeRoomParticipantAppearanceMap(
      body.participantAppearance
    ),
  };
}

function createEmptyDurableRoomSnapshot(roomId) {
  return {
    roomId,
    revision: 0,
    savedAt: new Date(0).toISOString(),
    sliceRevisions: createUniformDurableRoomSnapshotSliceRevisions(0),
    roomCreatorId: null,
    tokens: [],
    images: [],
    textCards: [],
    participantAppearance: {},
  };
}

function createUniformDurableRoomSnapshotSliceRevisions(revision) {
  return {
    tokens: revision,
    images: revision,
    textCards: revision,
  };
}

function normalizeDurableRoomSnapshotSlice(slice) {
  if (slice === "tokens" || slice === "images" || slice === "textCards") {
    return slice;
  }

  return null;
}

function getDurableRoomSnapshotSliceKind(slice) {
  if (slice === "tokens") {
    return "token";
  }

  if (slice === "images") {
    return "image";
  }

  return "note-card";
}

function normalizeDurableRoomSnapshot(roomId, snapshot) {
  if (!snapshot || typeof snapshot !== "object" || snapshot.roomId !== roomId) {
    return null;
  }

  return {
    roomId,
    revision: typeof snapshot.revision === "number" ? snapshot.revision : 0,
    savedAt:
      typeof snapshot.savedAt === "string"
        ? snapshot.savedAt
        : new Date(0).toISOString(),
    sliceRevisions: normalizeDurableRoomSnapshotSliceRevisions(
      snapshot.sliceRevisions,
      typeof snapshot.revision === "number" ? snapshot.revision : 0
    ),
    roomCreatorId:
      typeof snapshot.roomCreatorId === "string" &&
      snapshot.roomCreatorId.trim().length > 0
        ? snapshot.roomCreatorId.trim()
        : null,
    tokens: normalizeRoomObjects(snapshot.tokens, "token"),
    images: normalizeRoomObjects(snapshot.images, "image"),
    textCards: normalizeRoomObjects(snapshot.textCards, "note-card"),
    participantAppearance: normalizeRoomParticipantAppearanceMap(
      snapshot.participantAppearance
    ),
  };
}

function normalizeDurableRoomSnapshotSliceRevisions(sliceRevisions, fallbackRevision) {
  return {
    tokens:
      sliceRevisions && typeof sliceRevisions.tokens === "number"
        ? sliceRevisions.tokens
        : fallbackRevision,
    images:
      sliceRevisions && typeof sliceRevisions.images === "number"
        ? sliceRevisions.images
        : fallbackRevision,
    textCards:
      sliceRevisions && typeof sliceRevisions.textCards === "number"
        ? sliceRevisions.textCards
        : fallbackRevision,
  };
}

function normalizeRoomParticipantAppearanceMap(participantAppearance) {
  if (!participantAppearance || typeof participantAppearance !== "object") {
    return {};
  }

  return Object.entries(participantAppearance).reduce(
    (appearanceMap, [participantId, appearance]) => {
      const normalizedAppearance = normalizeRoomParticipantAppearance({
        participantId,
        ...appearance,
      });

      if (!normalizedAppearance) {
        return appearanceMap;
      }

      appearanceMap[participantId] = normalizedAppearance;
      return appearanceMap;
    },
    {}
  );
}

function normalizeRoomParticipantAppearance(appearance) {
  if (!appearance || typeof appearance !== "object") {
    return null;
  }

  const participantId =
    typeof appearance.participantId === "string" &&
    appearance.participantId.trim().length > 0
      ? appearance.participantId.trim()
      : null;
  const lastKnownName =
    typeof appearance.lastKnownName === "string" &&
    appearance.lastKnownName.trim().length > 0
      ? appearance.lastKnownName.trim()
      : null;
  const lastKnownColor =
    typeof appearance.lastKnownColor === "string" &&
    appearance.lastKnownColor.trim().length > 0
      ? appearance.lastKnownColor.trim()
      : null;

  if (!participantId || !lastKnownName || !lastKnownColor) {
    return null;
  }

  return {
    participantId,
    lastKnownName,
    lastKnownColor,
    avatarFaceId: isParticipantAvatarFaceId(appearance.avatarFaceId)
      ? appearance.avatarFaceId
      : undefined,
    lastSeenAt:
      typeof appearance.lastSeenAt === "number"
        ? appearance.lastSeenAt
        : Date.now(),
  };
}

function canonicalizeRoomParticipantAppearance(
  currentAppearanceMap,
  participantAppearance
) {
  const currentFaceId =
    currentAppearanceMap[participantAppearance.participantId]?.avatarFaceId;
  const requestedFaceId = participantAppearance.avatarFaceId;

  if (isParticipantAvatarFaceId(requestedFaceId)) {
    return {
      ...participantAppearance,
      avatarFaceId: pickUnusedParticipantAvatarFaceId(
        currentAppearanceMap,
        participantAppearance.participantId,
        requestedFaceId
      ),
    };
  }

  if (isParticipantAvatarFaceId(currentFaceId)) {
    return {
      ...participantAppearance,
      avatarFaceId: currentFaceId,
    };
  }

  return {
    ...participantAppearance,
    avatarFaceId: pickUnusedParticipantAvatarFaceId(
      currentAppearanceMap,
      participantAppearance.participantId,
      participantAppearance.avatarFaceId
    ),
  };
}

function isParticipantAvatarFaceId(value) {
  return (
    typeof value === "string" && PARTICIPANT_AVATAR_FACE_ID_SET.has(value)
  );
}

function pickUnusedParticipantAvatarFaceId(
  existingAppearanceMap,
  participantId,
  requestedFaceId
) {
  if (isParticipantAvatarFaceId(requestedFaceId)) {
    const duplicateEntry = Object.entries(existingAppearanceMap).find(
      ([appearanceParticipantId, appearance]) =>
        appearanceParticipantId !== participantId &&
        appearance?.avatarFaceId === requestedFaceId
    );

    if (!duplicateEntry) {
      return requestedFaceId;
    }
  }

  const usedFaceIds = new Set(
    Object.entries(existingAppearanceMap)
      .filter(
        ([appearanceParticipantId]) => appearanceParticipantId !== participantId
      )
      .map(([, appearance]) => appearance?.avatarFaceId)
      .filter(isParticipantAvatarFaceId)
  );
  const unusedFaceIds = PARTICIPANT_AVATAR_FACE_IDS.filter(
    (faceId) => !usedFaceIds.has(faceId)
  );
  const candidatePool =
    unusedFaceIds.length > 0 ? unusedFaceIds : PARTICIPANT_AVATAR_FACE_IDS;

  if (unusedFaceIds.length === 0) {
    console.warn("[participant-avatar-face][pool-exhausted]", {
      participantId,
      poolSize: PARTICIPANT_AVATAR_FACE_IDS.length,
    });
  }

  return candidatePool[Math.floor(Math.random() * candidatePool.length)];
}

function normalizeDurableRoomIdentity(roomId, identity) {
  if (!identity || typeof identity !== "object" || identity.roomId !== roomId) {
    return null;
  }

  return {
    roomId,
    creatorId:
      typeof identity.creatorId === "string" && identity.creatorId.trim().length > 0
        ? identity.creatorId.trim()
        : null,
    createdAt:
      typeof identity.createdAt === "string"
        ? identity.createdAt
        : new Date(0).toISOString(),
    backgroundThemeId:
      typeof identity.backgroundThemeId === "string" &&
      ROOM_BACKGROUND_THEME_IDS.has(identity.backgroundThemeId)
        ? identity.backgroundThemeId
        : DEFAULT_ROOM_BACKGROUND_THEME_ID,
  };
}

function normalizeRoomObjects(objects, kinds) {
  if (!Array.isArray(objects)) {
    return [];
  }

  const allowedKinds = Array.isArray(kinds) ? kinds : [kinds];

  return objects.filter(
    (object) =>
      object &&
      typeof object === "object" &&
      allowedKinds.includes(object.kind)
  );
}

function requireOpsAuthorization(req, res) {
  if (!opsKey) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return false;
  }

  const providedKey = readHeaderString(req, "x-play-space-ops-key");

  if (!providedKey || providedKey !== opsKey) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return false;
  }

  return true;
}

function readHeaderString(req, name) {
  const value = req.headers[name];

  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim();
  }

  return "";
}

function getRoomOpsSummaries(identityStore, snapshotStore) {
  return getBackendKnownRoomIds(identityStore, snapshotStore).map((roomId) =>
    buildRoomOpsSummary(roomId, identityStore, snapshotStore)
  );
}

function getRoomOpsDetail(roomId, identityStore, snapshotStore) {
  const knownRoomIds = getBackendKnownRoomIds(identityStore, snapshotStore);

  if (!knownRoomIds.includes(roomId)) {
    return null;
  }

  const summary = buildRoomOpsSummary(roomId, identityStore, snapshotStore);
  const liveSlices = getLiveRoomSlices(roomId);
  const snapshot = normalizeDurableRoomSnapshot(roomId, snapshotStore[roomId] ?? null);
  const identity = normalizeDurableRoomIdentity(roomId, identityStore[roomId] ?? null);

  return {
    ...summary,
    live: {
      ...summary.live,
      slices: liveSlices,
    },
    snapshot: {
      ...summary.snapshot,
      data: snapshot,
    },
    identity: {
      ...summary.identity,
      data: identity,
    },
  };
}

function getBackendKnownRoomIds(identityStore, snapshotStore) {
  const roomIds = new Set(Object.keys(identityStore));
  Object.keys(snapshotStore).forEach((roomId) => {
    roomIds.add(roomId);
  });

  docs.forEach((_, docName) => {
    const parsed = parseRoomDocName(docName);

    if (parsed) {
      roomIds.add(parsed.roomId);
    }
  });

  return Array.from(roomIds).sort((left, right) => left.localeCompare(right));
}

function buildRoomOpsSummary(roomId, identityStore, snapshotStore) {
  const liveSlices = getLiveRoomSlices(roomId);
  const snapshot = normalizeDurableRoomSnapshot(roomId, snapshotStore[roomId] ?? null);
  const identity = normalizeDurableRoomIdentity(roomId, identityStore[roomId] ?? null);
  const presenceSlice =
    liveSlices.find((slice) => slice.kind === "presence") ?? null;
  const fallbackConnectionCount = liveSlices.reduce(
    (maxCount, slice) => Math.max(maxCount, slice.connectionCount),
    0
  );
  const activeConnectionCount =
    presenceSlice?.connectionCount ?? fallbackConnectionCount;

  return {
    roomId,
    status: getRoomOpsStatus({
      hasIdentity: !!identity,
      hasLive: liveSlices.length > 0,
      hasSnapshot: !!snapshot,
    }),
    identity: {
      exists: !!identity,
      creatorId: identity?.creatorId ?? null,
      createdAt: identity?.createdAt ?? null,
    },
    live: {
      isActive: liveSlices.length > 0,
      activeConnectionCount,
      sliceCount: liveSlices.length,
    },
    snapshot: {
      exists: !!snapshot,
      revision: snapshot?.revision ?? null,
      savedAt: snapshot?.savedAt ?? null,
      objectCounts: snapshot
        ? {
            tokens: snapshot.tokens.length,
            images: snapshot.images.length,
            textCards: snapshot.textCards.length,
            total:
              snapshot.tokens.length +
              snapshot.images.length +
              snapshot.textCards.length,
          }
        : {
            tokens: 0,
            images: 0,
            textCards: 0,
            total: 0,
          },
    },
  };
}

function getRoomOpsStatus({ hasIdentity, hasLive, hasSnapshot }) {
  if (hasLive && hasSnapshot) {
    return "live-and-snapshot";
  }

  if (hasLive) {
    return "live-only";
  }

  if (hasSnapshot) {
    return "snapshot-only";
  }

  if (hasIdentity) {
    return "identity-only";
  }

  return "unknown";
}

function getLiveRoomSlices(roomId) {
  const slices = [];

  docs.forEach((doc, docName) => {
    const parsed = parseRoomDocName(docName);

    if (!parsed || parsed.roomId !== roomId) {
      return;
    }

    slices.push({
      kind: parsed.kind,
      docName,
      connectionCount: doc.conns.size,
      sharedObjectCount: getLiveDocSharedObjectCount(doc, parsed.kind),
      awarenessStateCount: doc.awareness.getStates().size,
    });
  });

  return slices.sort((left, right) => left.kind.localeCompare(right.kind));
}

function parseRoomDocName(docName) {
  for (const [kind, prefix] of Object.entries(ROOM_DOC_PREFIXES)) {
    if (docName.startsWith(prefix)) {
      return {
        kind,
        roomId: normalizeRoomId(docName.slice(prefix.length)),
      };
    }
  }

  return null;
}

function normalizeRoomId(roomId) {
  if (typeof roomId !== "string") {
    return "";
  }

  return roomId.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeFeedbackCapture(body) {
  const fields = normalizeFeedbackCaptureFields(body);

  if (!fields) {
    return null;
  }

  return {
    id: `fbk_${randomUUID()}`,
    schemaVersion: 4,
    receivedAt: new Date().toISOString(),
    ...fields,
  };
}

function normalizeFeedbackCaptureFields(body) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const type =
    body.type === "feedback" ? "feedback" : body.type === "bug" ? "bug" : "";
  const message = readLimitedFeedbackString(body.message, 2000);
  const roomId = normalizeRoomId(body.roomId);
  const participant =
    body.participant && typeof body.participant === "object"
      ? body.participant
      : null;
  const participantId = readLimitedFeedbackString(participant?.id, 160);
  const participantName = readLimitedFeedbackString(participant?.name, 160);
  const participantColor = readLimitedFeedbackString(participant?.color, 80);

  if (!type || !message || !roomId || !participantId || !participantName) {
    return null;
  }

  return {
    type,
    message,
    roomId,
    participant: {
      id: participantId,
      name: participantName,
      color: participantColor,
    },
    appVersionLabel: readOptionalFeedbackString(body.appVersionLabel, 120),
    buildId: readOptionalFeedbackString(body.buildId, 160),
    path: readLimitedFeedbackString(body.path, 500),
    userAgent: readLimitedFeedbackString(body.userAgent, 500),
    timestamp: readLimitedFeedbackString(body.timestamp, 80),
    clientDiagnostics: normalizeFeedbackClientDiagnostics(body.clientDiagnostics),
  };
}

function normalizeFeedbackClientDiagnostics(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const viewport =
    value.viewport && typeof value.viewport === "object"
      ? {
          width: readNonNegativeNumber(value.viewport.width),
          height: readNonNegativeNumber(value.viewport.height),
          devicePixelRatio: readNonNegativeNumber(value.viewport.devicePixelRatio),
        }
      : null;
  const browser =
    value.browser && typeof value.browser === "object"
      ? {
          language: readOptionalFeedbackString(value.browser.language, 80),
          platform: readOptionalFeedbackString(value.browser.platform, 160),
          online: readBooleanOrNull(value.browser.online),
        }
      : null;
  const room =
    value.room && typeof value.room === "object"
      ? {
          roomId: readOptionalFeedbackString(value.room.roomId, 160),
          participantId: readOptionalFeedbackString(value.room.participantId, 160),
          participantName: readOptionalFeedbackString(value.room.participantName, 160),
          participantColor: readOptionalFeedbackString(value.room.participantColor, 80),
          isRoomOwner: readBooleanOrNull(value.room.isRoomOwner),
          participantCount: readNonNegativeInteger(value.room.participantCount),
          objectCounts:
            value.room.objectCounts && typeof value.room.objectCounts === "object"
              ? {
                  tokens: readNonNegativeInteger(value.room.objectCounts.tokens),
                  images: readNonNegativeInteger(value.room.objectCounts.images),
                  textCards: readNonNegativeInteger(value.room.objectCounts.textCards),
                }
              : null,
        }
      : null;
  const media =
    value.media && typeof value.media === "object"
      ? {
          enabled: readBooleanOrNull(value.media.enabled),
          connectionState: readOptionalFeedbackString(
            value.media.connectionState,
            80
          ),
          micEnabled: readBooleanOrNull(value.media.micEnabled),
          cameraEnabled: readBooleanOrNull(value.media.cameraEnabled),
        }
      : null;
  const runtime =
    value.runtime && typeof value.runtime === "object"
      ? {
          mode: readOptionalFeedbackString(value.runtime.mode, 80),
          origin: readOptionalFeedbackString(value.runtime.origin, 500),
          realtimeUrl: readOptionalFeedbackString(value.runtime.realtimeUrl, 500),
          realtimeUrlSource: readOptionalFeedbackString(
            value.runtime.realtimeUrlSource,
            80
          ),
          apiBaseUrl: readOptionalFeedbackString(value.runtime.apiBaseUrl, 500),
          apiBaseUrlSource: readOptionalFeedbackString(
            value.runtime.apiBaseUrlSource,
            80
          ),
          liveKitUrl: readOptionalFeedbackString(value.runtime.liveKitUrl, 500),
          liveKitUrlSource: readOptionalFeedbackString(
            value.runtime.liveKitUrlSource,
            80
          ),
          liveKitTokenUrl: readOptionalFeedbackString(
            value.runtime.liveKitTokenUrl,
            500
          ),
          liveKitTokenUrlSource: readOptionalFeedbackString(
            value.runtime.liveKitTokenUrlSource,
            80
          ),
          liveKitEnabled: readBooleanOrNull(value.runtime.liveKitEnabled),
        }
      : null;
  const recentErrors = Array.isArray(value.recentErrors)
    ? value.recentErrors
        .map((entry) => normalizeFeedbackRecentError(entry))
        .filter(Boolean)
        .slice(-20)
    : [];

  if (!viewport && !browser && !room && !media && !runtime && recentErrors.length === 0) {
    return null;
  }

  return {
    viewport,
    browser,
    room,
    media,
    runtime,
    recentErrors,
  };
}

function normalizeFeedbackRecentError(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const kind = readOptionalFeedbackString(value.kind, 80);
  const message = readOptionalFeedbackString(value.message, 1000);
  const source = readOptionalFeedbackString(value.source, 500);
  const timestamp = readOptionalFeedbackString(value.timestamp, 80);

  if (!kind || !message || !source || !timestamp) {
    return null;
  }

  return {
    kind,
    message,
    source,
    timestamp,
  };
}

function buildLegacyFeedbackCaptureId(receivedAt, index) {
  const safeTimestamp = receivedAt.replace(/[^a-z0-9]+/gi, "-").slice(0, 80);
  return `fbk_legacy_${safeTimestamp || "unknown"}_${index}`;
}

function readLimitedFeedbackString(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function readOptionalFeedbackString(value, maxLength) {
  const normalized = readLimitedFeedbackString(value, maxLength);

  return normalized || null;
}

function readBooleanOrNull(value) {
  return typeof value === "boolean" ? value : null;
}

function readNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function readNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function readPositiveInteger(value, fallbackValue) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function readQueryPositiveInteger(
  requestUrl,
  name,
  fallbackValue,
  minValue,
  maxValue = Number.POSITIVE_INFINITY
) {
  const parsed = Number.parseInt(requestUrl.searchParams.get(name) || "", 10);

  if (!Number.isInteger(parsed)) {
    return fallbackValue;
  }

  return Math.min(Math.max(parsed, minValue), maxValue);
}

function readOptionalFeedbackQueryString(requestUrl, name, maxLength) {
  const value = readOptionalFeedbackString(requestUrl.searchParams.get(name), maxLength);
  return value || null;
}

function readFeedbackRecordCursorQuery(requestUrl, name) {
  const rawCursor = requestUrl.searchParams.get(name);

  if (rawCursor === null || rawCursor === "") {
    return {
      ok: true,
      value: null,
    };
  }

  const separatorIndex = rawCursor.indexOf("|");

  if (separatorIndex <= 0 || separatorIndex === rawCursor.length - 1) {
    return {
      ok: false,
      value: null,
    };
  }

  const receivedAt = readOptionalFeedbackString(
    rawCursor.slice(0, separatorIndex),
    80
  );
  const id = readOptionalFeedbackString(rawCursor.slice(separatorIndex + 1), 160);

  if (!receivedAt || !id) {
    return {
      ok: false,
      value: null,
    };
  }

  const timestampValue = Date.parse(receivedAt);

  if (!Number.isFinite(timestampValue)) {
    return {
      ok: false,
      value: null,
    };
  }

  return {
    ok: true,
    value: {
      receivedAt: new Date(timestampValue).toISOString(),
      id,
    },
  };
}

function readFeedbackQueryType(requestUrl) {
  const value = requestUrl.searchParams.get("type");
  return value === "bug" || value === "feedback" ? value : null;
}

function readOptionalNormalizedRoomIdQuery(requestUrl, name) {
  const value = requestUrl.searchParams.get(name);
  const normalized = normalizeRoomId(value);
  return normalized || null;
}

function readOptionalIsoTimestampQuery(requestUrl, name) {
  const value = readOptionalFeedbackString(requestUrl.searchParams.get(name), 80);

  if (!value) {
    return null;
  }

  const timestampValue = Date.parse(value);
  return Number.isFinite(timestampValue) ? new Date(timestampValue).toISOString() : null;
}

function normalizeRealtimeDocName(docName) {
  for (const prefix of Object.values(ROOM_DOC_PREFIXES)) {
    if (!docName.startsWith(prefix)) {
      continue;
    }

    const encodedRoomId = docName.slice(prefix.length);
    return `${prefix}${normalizeRoomId(decodeURIComponent(encodedRoomId))}`;
  }

  return decodeURIComponent(docName);
}

function getLiveDocSharedObjectCount(doc, kind) {
  switch (kind) {
    case "tokens":
      return doc.getMap("tokens").size;
    case "images":
      return doc.getMap("images").size;
    case "textCards":
      return doc.getMap("text-cards").size;
    case "roomState":
      return doc.getMap("room-state").size;
    default:
      return 0;
  }
}

function installCorsWriteHead(req, res) {
  if (res.__playSpaceCorsWriteHeadInstalled) {
    return;
  }

  const originalWriteHead = res.writeHead.bind(res);
  res.__playSpaceCorsWriteHeadInstalled = true;
  res.writeHead = (statusCode, statusMessage, headers) => {
    let nextStatusMessage = statusMessage;
    let nextHeaders = headers;

    if (
      nextHeaders === undefined &&
      nextStatusMessage &&
      typeof nextStatusMessage === "object" &&
      !Array.isArray(nextStatusMessage)
    ) {
      nextHeaders = nextStatusMessage;
      nextStatusMessage = undefined;
    }

    const mergedHeaders = {
      ...getCorsHeaders(req),
      ...(nextHeaders ?? {}),
    };

    if (typeof nextStatusMessage === "string") {
      return originalWriteHead(statusCode, nextStatusMessage, mergedHeaders);
    }

    return originalWriteHead(statusCode, mergedHeaders);
  };
}

function setCorsHeaders(req, res) {
  const corsHeaders = getCorsHeaders(req);

  Object.entries(corsHeaders).forEach(([name, value]) => {
    res.setHeader(name, value);
  });
}

function getCorsHeaders(req) {
  const requestOrigin = readHeaderString(req, "origin");
  const allowOrigin = requestOrigin || "*";
  const headers = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,PUT,PATCH,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Play-Space-Ops-Key",
  };

  if (requestOrigin) {
    return {
      ...headers,
      "Access-Control-Allow-Credentials": "true",
      Vary: "Origin",
    };
  }

  return headers;
}

async function createLiveKitToken({
  roomId,
  participantId,
  participantName,
}) {
  const liveKitConfig = getLiveKitConfig();

  const accessToken = new AccessToken(liveKitConfig.apiKey, liveKitConfig.apiSecret, {
    identity: participantId,
    name: participantName,
  });

  accessToken.addGrant({
    roomJoin: true,
    room: roomId,
    canPublish: true,
    canSubscribe: true,
  });

  return accessToken.toJwt();
}

function getLiveKitConfig() {
  const liveKitApiKey = readEnvString("LIVEKIT_API_KEY");
  const liveKitApiSecret = readEnvString("LIVEKIT_API_SECRET");

  return {
    apiKey: liveKitApiKey,
    apiSecret: liveKitApiSecret,
    apiKeyPresent: liveKitApiKey.length > 0,
    apiSecretPresent: liveKitApiSecret.length > 0,
    enabled: liveKitApiKey.length > 0 && liveKitApiSecret.length > 0,
  };
}

function getLiveKitDisabledReason(liveKitConfig) {
  if (!liveKitConfig.apiKeyPresent && !liveKitConfig.apiSecretPresent) {
    return "LiveKit credentials are not configured";
  }

  if (!liveKitConfig.apiKeyPresent) {
    return "LIVEKIT_API_KEY is not configured";
  }

  if (!liveKitConfig.apiSecretPresent) {
    return "LIVEKIT_API_SECRET is not configured";
  }

  return "LiveKit credentials are not configured";
}

function getClientResetPolicy() {
  const policyId = readEnvString("PLAY_SPACE_CLIENT_RESET_POLICY_ID");

  if (!policyId) {
    return null;
  }

  const issuedAt =
    readEnvString("PLAY_SPACE_CLIENT_RESET_POLICY_ISSUED_AT") ||
    new Date(0).toISOString();
  const reason = readEnvString("PLAY_SPACE_CLIENT_RESET_POLICY_REASON");

  return {
    policyId,
    issuedAt,
    reason: reason || undefined,
    scope: "all-browser-local-room-state",
    mode: "once-per-browser",
  };
}

function readEnvString(name) {
  const value = process.env[name];

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (chunks.length === 0) {
        resolve(null);
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        resolve(null);
      }
    });

    req.on("error", () => {
      resolve(null);
    });
  });
}

function handleMessage(conn, doc, message) {
  try {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case messageSync:
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn);
        if (encoding.length(encoder) > 1) {
          send(doc, conn, encoding.toUint8Array(encoder));
        }
        break;
      case messageAwareness:
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          conn
        );
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(error);
  }
}

function closeConn(doc, conn) {
  if (!doc.conns.has(conn)) {
    conn.close();
    return;
  }

  const controlledIds = doc.conns.get(conn);
  doc.conns.delete(conn);

  if (controlledIds && controlledIds.size > 0) {
    awarenessProtocol.removeAwarenessStates(
      doc.awareness,
      Array.from(controlledIds),
      null
    );
  }

  if (doc.conns.size === 0) {
    docs.delete(doc.name);
    doc.destroy();
  }

  conn.close();
}

function send(doc, conn, message) {
  if (conn.readyState !== conn.CONNECTING && conn.readyState !== conn.OPEN) {
    closeConn(doc, conn);
    return;
  }

  try {
    conn.send(message, (error) => {
      if (error) {
        closeConn(doc, conn);
      }
    });
  } catch {
    closeConn(doc, conn);
  }
}
