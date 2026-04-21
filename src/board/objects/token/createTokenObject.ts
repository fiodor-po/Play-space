import type { BoardObject } from "../../../types/board";

export const TOKEN_PIN_SIZE = 30;
export const EMPTY_TOKEN_GLYPH = "○";
const TOKEN_SYMBOL_GLYPHS = new Set(["●", "■", "▲", "▼"]);

type CreateTokenObjectParams = {
  id: string;
  color: string;
  creatorId: string;
  position: { x: number; y: number };
};

export function createTokenObject({
  id,
  color,
  creatorId,
  position,
}: CreateTokenObjectParams): BoardObject {
  return {
    id,
    kind: "token",
    creatorId,
    x: position.x,
    y: position.y,
    width: TOKEN_PIN_SIZE,
    height: TOKEN_PIN_SIZE,
    anchorPosition: "center",
    fill: color,
    label: "",
    authorColor: color,
    tokenAttachment: {
      mode: "free",
    },
    textColor: "#f8fafc",
  };
}

export function normalizeTokenObject(object: BoardObject): BoardObject {
  if (object.kind !== "token") {
    return object;
  }

  const sourceWidth = object.width || TOKEN_PIN_SIZE;
  const sourceHeight = object.height || TOKEN_PIN_SIZE;
  const normalizedX =
    object.anchorPosition === "center" ? object.x : object.x + sourceWidth / 2;
  const normalizedY =
    object.anchorPosition === "center" ? object.y : object.y + sourceHeight / 2;

  return {
    ...object,
    x: normalizedX,
    y: normalizedY,
    width: TOKEN_PIN_SIZE,
    height: TOKEN_PIN_SIZE,
    label: normalizeTokenGlyphLabel(object.label),
    anchorPosition: "center",
    tokenAttachment: object.tokenAttachment ?? {
      mode: "free",
    },
  };
}

function normalizeTokenGlyphLabel(label: string | undefined) {
  const trimmedLabel = label?.trim() ?? "";

  if (trimmedLabel === EMPTY_TOKEN_GLYPH) {
    return "";
  }

  if (TOKEN_SYMBOL_GLYPHS.has(trimmedLabel)) {
    return trimmedLabel;
  }

  return "";
}
