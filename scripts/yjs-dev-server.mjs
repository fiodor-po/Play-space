import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || "1234");
const messageSync = 0;
const messageAwareness = 1;
const pingTimeoutMs = 30000;
const docs = new Map();
const durableSnapshotStorePath =
  process.env.ROOM_SNAPSHOT_STORE_FILE ||
  path.join(process.cwd(), "data", "room-snapshots.json");

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
  console.info(`running at '${host}' on port ${port}`);
});

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

  if (!snapshotRouteMatch) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
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

function createDurableRoomSnapshot(roomId, body) {
  return {
    roomId,
    revision: 0,
    savedAt: new Date(0).toISOString(),
    tokens: normalizeRoomObjects(body.tokens, "token"),
    images: normalizeRoomObjects(body.images, "image"),
    textCards: normalizeRoomObjects(body.textCards, "text-card"),
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
    tokens: normalizeRoomObjects(snapshot.tokens, "token"),
    images: normalizeRoomObjects(snapshot.images, "image"),
    textCards: normalizeRoomObjects(snapshot.textCards, "text-card"),
  };
}

function normalizeRoomObjects(objects, kind) {
  if (!Array.isArray(objects)) {
    return [];
  }

  return objects.filter(
    (object) => object && typeof object === "object" && object.kind === kind
  );
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
