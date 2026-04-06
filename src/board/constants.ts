import type { BoardObjectKind } from "../types/board";

export const BOARD_WIDTH = 4000;
export const BOARD_HEIGHT = 3000;
export const DEFAULT_STAGE_SCALE = 1;
export const MIN_SCALE = 0.4;
export const MAX_SCALE = 2.5;
export const SCALE_BY = 1.05;
export const TEXT_CARD_HEADER_HEIGHT = 36;
export const NOTE_HANDLE_SIZE = 18;
export const TEXT_CARD_BODY_INSET_X = 16;
export const TEXT_CARD_BODY_INSET_Y = 16;
export const TEXT_CARD_BODY_FONT_SIZE = 22;
export const TEXT_CARD_BODY_LINE_HEIGHT = 1.2;
export const TEXT_CARD_BODY_FONT_FAMILY = "Arial, sans-serif";
export const MIN_IMAGE_SIZE = 80;
export const MAX_UPLOADED_IMAGE_SOURCE_DIMENSION = 1600;
export const MAX_INITIAL_IMAGE_DISPLAY_WIDTH = 360;
export const MAX_INITIAL_IMAGE_DISPLAY_HEIGHT = 240;
export const HTML_UI_FONT_FAMILY =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const objectLayerOrder: Record<BoardObjectKind, number> = {
  image: 0,
  "text-card": 1,
  token: 2,
};
