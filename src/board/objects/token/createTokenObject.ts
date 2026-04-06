import type { BoardObject } from "../../../types/board";

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
