import type { BoardObject } from "../../../types/board";
import {
  getTextCardHeightForLabel,
  normalizeTextCardObject,
} from "./sizing";

type CreateTextCardObjectParams = {
  id: string;
  color: string;
  creatorId: string;
  position: { x: number; y: number };
};

export function createTextCardObject({
  id,
  color,
  creatorId,
  position,
}: CreateTextCardObjectParams): BoardObject {
  const width = 260;

  return normalizeTextCardObject({
    id,
    kind: "text-card",
    creatorId,
    x: position.x - width / 2,
    y: position.y - 90,
    width,
    height: getTextCardHeightForLabel("New note", width),
    fill: "#f8fafc",
    label: "New note",
    authorColor: color,
    textColor: "#0f172a",
  });
}
