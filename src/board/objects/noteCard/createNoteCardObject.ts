import type { BoardObject } from "../../../types/board";
import { getTextCardHeightForLabel, normalizeNoteLikeObject } from "../textCard/sizing";

type CreateNoteCardObjectParams = {
  id: string;
  color: string;
  creatorId: string;
  position: { x: number; y: number };
};

export function createNoteCardObject({
  id,
  color,
  creatorId,
  position,
}: CreateNoteCardObjectParams): BoardObject {
  const width = 260;

  return normalizeNoteLikeObject({
    id,
    kind: "note-card",
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
