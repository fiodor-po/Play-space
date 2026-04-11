import type { BoardObject } from "../../../types/board";

export const TOKEN_PIN_SIZE = 44;

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
    textColor: "#f8fafc",
  };
}

export function normalizeTokenObject(object: BoardObject): BoardObject {
  if (object.kind !== "token" || object.anchorPosition === "center") {
    return object;
  }

  const width = object.width || TOKEN_PIN_SIZE;
  const height = object.height || TOKEN_PIN_SIZE;

  return {
    ...object,
    x: object.x + width / 2,
    y: object.y + height / 2,
    width,
    height,
    anchorPosition: "center",
  };
}
