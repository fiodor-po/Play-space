import type { BoardObject } from "../../../types/board";

type CreateTokenObjectParams = {
  id: string;
  color: string;
  position: { x: number; y: number };
};

export function createTokenObject({
  id,
  color,
  position,
}: CreateTokenObjectParams): BoardObject {
  return {
    id,
    kind: "token",
    x: position.x - 70,
    y: position.y - 70,
    width: 140,
    height: 140,
    fill: color,
    label: "New Token",
    authorColor: color,
    textColor: "#f8fafc",
  };
}
