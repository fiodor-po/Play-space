import http from "node:http";
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
const durableSnapshotStorePath =
  process.env.ROOM_SNAPSHOT_STORE_FILE ||
  path.join(process.cwd(), "data", "room-snapshots.json");
const durableIdentityStorePath =
  process.env.ROOM_IDENTITY_STORE_FILE ||
  path.join(process.cwd(), "data", "room-identities.json");
const opsKey = readEnvString("PLAY_SPACE_OPS_KEY");
const ROOM_DOC_PREFIXES = {
  tokens: "play-space-alpha-tokens:",
  images: "play-space-alpha-images:",
  textCards: "play-space-alpha-text-cards:",
  presence: "play-space-alpha-presence:",
  roomState: "play-space-alpha-room-state:",
};

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
  const docName = (req.url || "/").slice(1).split("?")[0];
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
  setCorsHeaders(res);

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
  const healthRouteMatch = requestUrl.pathname === "/api/health";

  if (
    !snapshotRouteMatch &&
    !liveKitTokenRouteMatch &&
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
          liveKitTokenRoute: liveKitConfig.enabled,
        },
        liveKitStatus: liveKitConfig.enabled ? "enabled" : "disabled",
        liveKitCredentials: {
          apiKeyPresent: liveKitConfig.apiKeyPresent,
          apiSecretPresent: liveKitConfig.apiSecretPresent,
        },
        durableIdentityStorePath,
        durableSnapshotStorePath,
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

    const roomId = decodeURIComponent(roomDetailRouteMatch[1]);
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

    const roomId = decodeURIComponent(roomSnapshotDeleteRouteMatch[1]);
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
    const roomId = decodeURIComponent(roomIdentityRouteMatch[1]);

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
      typeof body.roomId === "string" ? body.roomId.trim() : "";
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

  const roomId = decodeURIComponent(snapshotRouteMatch[1]);

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

  const nextSnapshot = {
    ...snapshot,
    revision: (currentRevision ?? 0) + 1,
    savedAt: new Date().toISOString(),
  };

  store[snapshot.roomId] = nextSnapshot;
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

  if (existingIdentity) {
    return existingIdentity;
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

function createDurableRoomSnapshot(roomId, body) {
  return {
    roomId,
    revision: 0,
    savedAt: new Date(0).toISOString(),
    roomCreatorId:
      typeof body.roomCreatorId === "string" && body.roomCreatorId.trim().length > 0
        ? body.roomCreatorId.trim()
        : null,
    tokens: normalizeRoomObjects(body.tokens, "token"),
    images: normalizeRoomObjects(body.images, "image"),
    textCards: normalizeRoomObjects(body.textCards, "note-card"),
  };
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
    roomCreatorId:
      typeof snapshot.roomCreatorId === "string" &&
      snapshot.roomCreatorId.trim().length > 0
        ? snapshot.roomCreatorId.trim()
        : null,
    tokens: normalizeRoomObjects(snapshot.tokens, "token"),
    images: normalizeRoomObjects(snapshot.images, "image"),
    textCards: normalizeRoomObjects(snapshot.textCards, "note-card"),
  };
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
        roomId: docName.slice(prefix.length),
      };
    }
  }

  return null;
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

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Play-Space-Ops-Key");
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
