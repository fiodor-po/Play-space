import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { HTML_UI_FONT_FAMILY } from "../board/constants";
import {
  deleteRoomOpsSnapshot,
  fetchRoomOpsDetail,
  fetchRoomOpsSummaries,
  type RoomOpsDetail,
  type RoomOpsSummary,
} from "../lib/roomOpsApi";

const OPS_KEY_STORAGE_KEY = "play-space-alpha-ops-key-v1";

function getInitialSelectedRoomId() {
  return new URLSearchParams(window.location.search).get("room")?.trim() ?? "";
}

export function RoomsOpsPage() {
  const [authenticatedOpsKey, setAuthenticatedOpsKey] = useState("");
  const [opsKeyDraft, setOpsKeyDraft] = useState(
    () => sessionStorage.getItem(OPS_KEY_STORAGE_KEY) ?? ""
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomOpsSummary[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState(getInitialSelectedRoomId);
  const [selectedRoom, setSelectedRoom] = useState<RoomOpsDetail | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDeletingSnapshot, setIsDeletingSnapshot] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const hasAuthenticatedOpsKey = authenticatedOpsKey.trim().length > 0;

  useEffect(() => {
    const nextUrl = new URL(window.location.href);

    if (selectedRoomId) {
      nextUrl.searchParams.set("room", selectedRoomId);
    } else {
      nextUrl.searchParams.delete("room");
    }

    window.history.replaceState({}, "", nextUrl);
  }, [selectedRoomId]);

  useEffect(() => {
    if (!hasAuthenticatedOpsKey) {
      setRooms([]);
      setSelectedRoom(null);
      return;
    }

    let cancelled = false;
    setIsLoadingRooms(true);
    setAuthError(null);

    void fetchRoomOpsSummaries({ opsKey: authenticatedOpsKey })
      .then((nextRooms) => {
        if (cancelled) {
          return;
        }

        setRooms(nextRooms);

        if (selectedRoomId && !nextRooms.some((room) => room.roomId === selectedRoomId)) {
          setSelectedRoomId("");
        } else if (!selectedRoomId && nextRooms[0]) {
          setSelectedRoomId(nextRooms[0].roomId);
        }
      })
      .catch((error: Error) => {
        if (cancelled) {
          return;
        }

        if (error.message === "unauthorized") {
          sessionStorage.removeItem(OPS_KEY_STORAGE_KEY);
          setOpsKeyDraft("");
          setAuthenticatedOpsKey("");
          setAuthError("Ops key rejected by backend.");
          setRooms([]);
          setSelectedRoomId("");
          setSelectedRoom(null);
          return;
        }

        setAuthError("Failed to load room list.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingRooms(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authenticatedOpsKey, hasAuthenticatedOpsKey, selectedRoomId, refreshNonce]);

  useEffect(() => {
    if (!hasAuthenticatedOpsKey || !selectedRoomId) {
      setSelectedRoom(null);
      return;
    }

    let cancelled = false;
    setIsLoadingDetail(true);
    setDetailError(null);

    void fetchRoomOpsDetail(selectedRoomId, { opsKey: authenticatedOpsKey })
      .then((room) => {
        if (!cancelled) {
          setSelectedRoom(room);
        }
      })
      .catch((error: Error) => {
        if (cancelled) {
          return;
        }

        if (error.message === "unauthorized") {
          sessionStorage.removeItem(OPS_KEY_STORAGE_KEY);
          setOpsKeyDraft("");
          setAuthenticatedOpsKey("");
          setAuthError("Ops key rejected by backend.");
          setRooms([]);
          setSelectedRoomId("");
          setSelectedRoom(null);
          return;
        }

        setDetailError("Failed to load room detail.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingDetail(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authenticatedOpsKey, hasAuthenticatedOpsKey, selectedRoomId]);

  useEffect(() => {
    const storedOpsKey = sessionStorage.getItem(OPS_KEY_STORAGE_KEY)?.trim() ?? "";

    if (!storedOpsKey || authenticatedOpsKey) {
      return;
    }

    let cancelled = false;
    setIsUnlocking(true);
    setAuthError(null);

    void fetchRoomOpsSummaries({ opsKey: storedOpsKey })
      .then((nextRooms) => {
        if (cancelled) {
          return;
        }

        setAuthenticatedOpsKey(storedOpsKey);
        setRooms(nextRooms);

        if (selectedRoomId && !nextRooms.some((room) => room.roomId === selectedRoomId)) {
          setSelectedRoomId("");
        } else if (!selectedRoomId && nextRooms[0]) {
          setSelectedRoomId(nextRooms[0].roomId);
        }
      })
      .catch((error: Error) => {
        if (cancelled) {
          return;
        }

        sessionStorage.removeItem(OPS_KEY_STORAGE_KEY);
        setAuthenticatedOpsKey("");
        setOpsKeyDraft("");
        setRooms([]);
        setSelectedRoom(null);
        setSelectedRoomId("");
        setAuthError(
          error.message === "unauthorized"
            ? "Ops key rejected by backend."
            : "Failed to validate ops key."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsUnlocking(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authenticatedOpsKey, selectedRoomId]);

  const selectedRoomSummary = useMemo(
    () => rooms.find((room) => room.roomId === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );

  const submitOpsKey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedKey = opsKeyDraft.trim();

    if (!trimmedKey) {
      return;
    }

    setIsUnlocking(true);
    setAuthError(null);

    try {
      const nextRooms = await fetchRoomOpsSummaries({ opsKey: trimmedKey });

      sessionStorage.setItem(OPS_KEY_STORAGE_KEY, trimmedKey);
      setAuthenticatedOpsKey(trimmedKey);
      setRooms(nextRooms);

      if (selectedRoomId && !nextRooms.some((room) => room.roomId === selectedRoomId)) {
        setSelectedRoomId("");
      } else if (!selectedRoomId && nextRooms[0]) {
        setSelectedRoomId(nextRooms[0].roomId);
      }
    } catch (error) {
      sessionStorage.removeItem(OPS_KEY_STORAGE_KEY);
      setAuthenticatedOpsKey("");
      setRooms([]);
      setSelectedRoom(null);
      setSelectedRoomId("");
      setAuthError(
        error instanceof Error && error.message === "unauthorized"
          ? "Ops key rejected by backend."
          : "Failed to validate ops key."
      );
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleDeleteSnapshot = async () => {
    if (!selectedRoomId || !authenticatedOpsKey) {
      return;
    }

    const confirmed = window.confirm(
      `Delete the durable snapshot for "${selectedRoomId}"? Live room docs will be left untouched.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingSnapshot(true);
    setDetailError(null);

    try {
      const result = await deleteRoomOpsSnapshot(selectedRoomId, {
        opsKey: authenticatedOpsKey,
      });

      setRooms((currentRooms) =>
        currentRooms.map((room) =>
          room.roomId === selectedRoomId
            ? {
                ...room,
                status: room.live.isActive ? "live-only" : "unknown",
                snapshot: {
                  exists: false,
                  revision: null,
                  savedAt: null,
                  objectCounts: {
                    tokens: 0,
                    images: 0,
                    textCards: 0,
                    total: 0,
                  },
                },
              }
            : room
        )
      );

      if (result.room) {
        setSelectedRoom(result.room);
      } else if (selectedRoomSummary) {
        setSelectedRoom({
          ...selectedRoomSummary,
          status: selectedRoomSummary.live.isActive ? "live-only" : "unknown",
          snapshot: {
            exists: false,
            revision: null,
            savedAt: null,
            objectCounts: {
              tokens: 0,
              images: 0,
              textCards: 0,
              total: 0,
            },
            data: null,
          },
          live: {
            ...selectedRoomSummary.live,
            slices: [],
          },
        });
      }
    } catch (error) {
      setDetailError(
        error instanceof Error && error.message === "unauthorized"
          ? "Ops key rejected by backend."
          : "Failed to delete durable snapshot."
      );
    } finally {
      setIsDeletingSnapshot(false);
    }
  };

  if (!hasAuthenticatedOpsKey) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#020617",
          padding: 24,
          fontFamily: HTML_UI_FONT_FAMILY,
        }}
      >
        <form
          onSubmit={submitOpsKey}
          style={{
            width: "100%",
            maxWidth: 360,
            display: "grid",
            gap: 12,
            padding: 20,
            borderRadius: 16,
            background: "#0f172a",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            color: "#e2e8f0",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700 }}>Room Ops</div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            Internal alpha room inspection and snapshot repair.
          </div>
          <input
            type="password"
            value={opsKeyDraft}
            onChange={(event) => setOpsKeyDraft(event.target.value)}
            placeholder="Ops key"
            autoFocus
            style={inputStyle}
          />
          {authError ? (
            <div style={{ fontSize: 12, color: "#fca5a5" }}>{authError}</div>
          ) : null}
          <button type="submit" style={primaryButtonStyle} disabled={isUnlocking}>
            {isUnlocking ? "Unlocking..." : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e2e8f0",
        fontFamily: HTML_UI_FONT_FAMILY,
        padding: 20,
      }}
    >
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>Room Ops</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              Backend-known rooms only. Live docs and durable snapshots are shown separately.
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(OPS_KEY_STORAGE_KEY);
              setAuthenticatedOpsKey("");
              setOpsKeyDraft("");
              setRooms([]);
              setSelectedRoom(null);
              setSelectedRoomId("");
            }}
            style={secondaryButtonStyle}
          >
            Lock
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 360px) minmax(0, 1fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div style={panelStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Rooms</div>
              <button
                type="button"
                onClick={() => {
                  setRefreshNonce((current) => current + 1);
                }}
                style={secondaryButtonStyle}
              >
                Refresh
              </button>
            </div>

            {isLoadingRooms ? (
              <div style={mutedTextStyle}>Loading rooms…</div>
            ) : null}
            {authError ? <div style={errorTextStyle}>{authError}</div> : null}

            <div style={{ display: "grid", gap: 8 }}>
              {rooms.map((room) => {
                const isSelected = room.roomId === selectedRoomId;

                return (
                  <button
                    key={room.roomId}
                    type="button"
                    onClick={() => setSelectedRoomId(room.roomId)}
                    style={{
                      ...roomRowStyle,
                      borderColor: isSelected
                        ? "rgba(96, 165, 250, 0.7)"
                        : "rgba(148, 163, 184, 0.16)",
                      background: isSelected
                        ? "rgba(30, 41, 59, 0.95)"
                        : "rgba(15, 23, 42, 0.72)",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{room.roomId}</div>
                    <div style={mutedTextStyle}>
                      {room.status} · live {room.live.activeConnectionCount} · snapshot rev{" "}
                      {room.snapshot.revision ?? "none"}
                    </div>
                    <div style={mutedTextStyle}>
                      objects {room.snapshot.objectCounts.total} · images{" "}
                      {room.snapshot.objectCounts.images} · notes{" "}
                      {room.snapshot.objectCounts.textCards}
                    </div>
                  </button>
                );
              })}

              {!isLoadingRooms && rooms.length === 0 ? (
                <div style={mutedTextStyle}>No backend-known rooms.</div>
              ) : null}
            </div>
          </div>

          <div style={panelStyle}>
            {!selectedRoomId ? (
              <div style={mutedTextStyle}>Select a room.</div>
            ) : isLoadingDetail ? (
              <div style={mutedTextStyle}>Loading room detail…</div>
            ) : selectedRoom ? (
              <div style={{ display: "grid", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>
                      {selectedRoom.roomId}
                    </div>
                    <div style={mutedTextStyle}>{selectedRoom.status}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteSnapshot}
                    disabled={!selectedRoom.snapshot.exists || isDeletingSnapshot}
                    style={{
                      ...dangerButtonStyle,
                      opacity:
                        !selectedRoom.snapshot.exists || isDeletingSnapshot ? 0.5 : 1,
                    }}
                  >
                    {isDeletingSnapshot ? "Deleting…" : "Delete durable snapshot"}
                  </button>
                </div>

                {detailError ? <div style={errorTextStyle}>{detailError}</div> : null}

                <div style={statsGridStyle}>
                  <InfoCard label="Live" value={selectedRoom.live.isActive ? "active" : "none"} />
                  <InfoCard
                    label="Connections"
                    value={String(selectedRoom.live.activeConnectionCount)}
                  />
                  <InfoCard
                    label="Snapshot"
                    value={selectedRoom.snapshot.exists ? "present" : "none"}
                  />
                  <InfoCard
                    label="Revision"
                    value={selectedRoom.snapshot.revision?.toString() ?? "none"}
                  />
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Live slices</div>
                  {selectedRoom.live.slices.length === 0 ? (
                    <div style={mutedTextStyle}>No live room docs currently in memory.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {selectedRoom.live.slices.map((slice) => (
                        <div key={slice.docName} style={sliceRowStyle}>
                          <div style={{ fontWeight: 700 }}>{slice.kind}</div>
                          <div style={mutedTextStyle}>{slice.docName}</div>
                          <div style={mutedTextStyle}>
                            connections {slice.connectionCount} · shared objects{" "}
                            {slice.sharedObjectCount} · awareness states{" "}
                            {slice.awarenessStateCount}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Durable snapshot</div>
                  <div style={mutedTextStyle}>
                    {selectedRoom.snapshot.exists
                      ? `saved ${selectedRoom.snapshot.savedAt ?? "unknown"}`
                      : "No durable snapshot stored."}
                  </div>
                  {selectedRoom.snapshot.exists ? (
                    <div style={mutedTextStyle}>
                      tokens {selectedRoom.snapshot.objectCounts.tokens} · images{" "}
                      {selectedRoom.snapshot.objectCounts.images} · notes{" "}
                      {selectedRoom.snapshot.objectCounts.textCards}
                    </div>
                  ) : null}
                  <pre style={preStyle}>
                    {JSON.stringify(selectedRoom.snapshot.data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div style={mutedTextStyle}>Room detail unavailable.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard(props: { label: string; value: string }) {
  return (
    <div style={infoCardStyle}>
      <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>
        {props.label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{props.value}</div>
    </div>
  );
}

const panelStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  padding: 16,
  borderRadius: 16,
  background: "#0f172a",
  border: "1px solid rgba(148, 163, 184, 0.16)",
};

const inputStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(148, 163, 184, 0.28)",
  background: "rgba(15, 23, 42, 0.9)",
  color: "#f8fafc",
  fontSize: 15,
};

const primaryButtonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "none",
  background: "#2563eb",
  color: "#eff6ff",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButtonStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid rgba(148, 163, 184, 0.22)",
  background: "rgba(15, 23, 42, 0.72)",
  color: "#e2e8f0",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
};

const dangerButtonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(248, 113, 113, 0.28)",
  background: "rgba(127, 29, 29, 0.3)",
  color: "#fecaca",
  cursor: "pointer",
  fontWeight: 700,
};

const roomRowStyle: CSSProperties = {
  display: "grid",
  gap: 4,
  textAlign: "left",
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(148, 163, 184, 0.16)",
  color: "#e2e8f0",
  cursor: "pointer",
};

const sliceRowStyle: CSSProperties = {
  display: "grid",
  gap: 2,
  padding: 10,
  borderRadius: 12,
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.14)",
};

const mutedTextStyle: CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
};

const errorTextStyle: CSSProperties = {
  fontSize: 12,
  color: "#fca5a5",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
};

const infoCardStyle: CSSProperties = {
  display: "grid",
  gap: 4,
  padding: 12,
  borderRadius: 12,
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.14)",
};

const preStyle: CSSProperties = {
  margin: 0,
  padding: 12,
  borderRadius: 12,
  background: "#020617",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  color: "#cbd5e1",
  fontSize: 11,
  overflow: "auto",
  maxHeight: 360,
};
