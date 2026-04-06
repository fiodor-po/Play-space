import http from "node:http";
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

const server = http.createServer();
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

function getDoc(name) {
  let doc = docs.get(name);

  if (!doc) {
    doc = new WSSharedDoc(name);
    docs.set(name, doc);
  }

  return doc;
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
