import type { BoardObject } from "../../../types/board";

type CreateTextCardObjectParams = {
  id: string;
  color: string;
  position: { x: number; y: number };
};

export function createTextCardObject({
  id,
  color,
  position,
}: CreateTextCardObjectParams): BoardObject {
  return {
    id,
    kind: "text-card",
    x: position.x - 130,
    y: position.y - 90,
    width: 260,
    height: 180,
    fill: "#f8fafc",
    label: "New note",
    authorColor: color,
    textColor: "#0f172a",
  };
}
