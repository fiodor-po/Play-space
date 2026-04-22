import type { BoardObject, TokenVisualVariant } from "../../../types/board";
import {
  normalizeTokenIconId,
  TOKEN_DEFAULT_ICON_ID,
  type TokenIconId,
} from "./tokenIconSet";

export const TOKEN_STANDARD_SIZE = 30;
export const TOKEN_MINI_SIZE = 16;
export const TOKEN_ICON_SIZE = 48;
export const TOKEN_PIN_SIZE = TOKEN_STANDARD_SIZE;
export const EMPTY_TOKEN_GLYPH = "○";
const TOKEN_SYMBOL_GLYPHS = new Set(["●", "■", "▲", "▼"]);
const TOKEN_VISUAL_VARIANTS = new Set<TokenVisualVariant>([
  "standard",
  "mini",
  "icon",
]);

type CreateTokenObjectParams = {
  id: string;
  color: string;
  creatorId: string;
  iconId?: TokenIconId | null;
  position: { x: number; y: number };
  visualVariant?: TokenVisualVariant;
};

export function createTokenObject({
  id,
  color,
  creatorId,
  iconId = TOKEN_DEFAULT_ICON_ID,
  position,
  visualVariant = "icon",
}: CreateTokenObjectParams): BoardObject {
  const normalizedVisualVariant = normalizeTokenVisualVariant(visualVariant);
  const size = getTokenVisualVariantSize(normalizedVisualVariant);
  const normalizedIconId = normalizeTokenIconId(iconId) ?? TOKEN_DEFAULT_ICON_ID;

  return {
    id,
    kind: "token",
    creatorId,
    x: position.x,
    y: position.y,
    width: size,
    height: size,
    anchorPosition: "center",
    fill: color,
    label: "",
    authorColor: color,
    tokenIconId:
      normalizedVisualVariant === "icon" ? normalizedIconId : undefined,
    tokenVisualVariant: normalizedVisualVariant,
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

  const normalizedVisualVariant = normalizeTokenVisualVariant(
    object.tokenVisualVariant
  );
  const normalizedSize = getTokenVisualVariantSize(normalizedVisualVariant);
  const normalizedIconId = normalizeTokenIconId(object.tokenIconId);
  const sourceWidth = object.width || normalizedSize;
  const sourceHeight = object.height || normalizedSize;
  const normalizedX =
    object.anchorPosition === "center" ? object.x : object.x + sourceWidth / 2;
  const normalizedY =
    object.anchorPosition === "center" ? object.y : object.y + sourceHeight / 2;

  return {
    ...object,
    x: normalizedX,
    y: normalizedY,
    width: normalizedSize,
    height: normalizedSize,
    label: normalizeTokenGlyphLabel(object.label, normalizedVisualVariant),
    anchorPosition: "center",
    tokenIconId:
      normalizedVisualVariant === "icon"
        ? normalizedIconId ?? TOKEN_DEFAULT_ICON_ID
        : undefined,
    tokenVisualVariant: normalizedVisualVariant,
    tokenAttachment: object.tokenAttachment ?? {
      mode: "free",
    },
  };
}

export function normalizeTokenVisualVariant(
  visualVariant: unknown
): TokenVisualVariant {
  if (visualVariant === "emoji") {
    return "icon";
  }

  return TOKEN_VISUAL_VARIANTS.has(visualVariant as TokenVisualVariant)
    ? (visualVariant as TokenVisualVariant)
    : "standard";
}

export function getTokenVisualVariantSize(
  visualVariant: TokenVisualVariant
) {
  if (visualVariant === "mini") {
    return TOKEN_MINI_SIZE;
  }

  if (visualVariant === "icon") {
    return TOKEN_ICON_SIZE;
  }

  return TOKEN_STANDARD_SIZE;
}

function normalizeTokenGlyphLabel(
  label: string | undefined,
  visualVariant: TokenVisualVariant
) {
  if (visualVariant === "mini") {
    return "";
  }

  const trimmedLabel = label?.trim() ?? "";

  if (visualVariant === "icon") {
    return trimmedLabel.slice(0, 8);
  }

  if (trimmedLabel === EMPTY_TOKEN_GLYPH) {
    return "";
  }

  if (TOKEN_SYMBOL_GLYPHS.has(trimmedLabel)) {
    return trimmedLabel;
  }

  return "";
}
