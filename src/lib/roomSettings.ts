export const ROOM_BACKGROUND_THEME_IDS = [
  "dot-grid-dark-blue",
  "dot-grid-soft-light",
  "graph-paper",
  "granite",
  "granite-mid",
  "granite-dark",
  "cork-board",
  "starfield",
] as const;

export type RoomBackgroundThemeId = (typeof ROOM_BACKGROUND_THEME_IDS)[number];

export const DEFAULT_ROOM_BACKGROUND_THEME_ID: RoomBackgroundThemeId =
  "dot-grid-dark-blue";

export type RoomSettings = {
  backgroundThemeId: RoomBackgroundThemeId;
};

export function normalizeRoomBackgroundThemeId(
  value: unknown
): RoomBackgroundThemeId {
  return ROOM_BACKGROUND_THEME_IDS.includes(value as RoomBackgroundThemeId)
    ? (value as RoomBackgroundThemeId)
    : DEFAULT_ROOM_BACKGROUND_THEME_ID;
}

export function createRoomSettings(
  params?: Partial<RoomSettings> | null
): RoomSettings {
  return {
    backgroundThemeId: normalizeRoomBackgroundThemeId(
      params?.backgroundThemeId
    ),
  };
}
