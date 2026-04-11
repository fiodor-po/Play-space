export function normalizeRoomId(roomId: string | null | undefined) {
  if (typeof roomId !== "string") {
    return "";
  }

  return roomId.trim().replace(/\s+/g, " ").toLowerCase();
}
