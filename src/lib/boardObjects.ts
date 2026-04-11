import type { BoardObject } from "../types/board";
import {
  getNoteCardHeightForLabel,
  isNoteCardObject,
  normalizeNoteCardObject,
} from "../board/objects/noteCard/sizing";

export function updateBoardObjectById(
  objects: BoardObject[],
  id: string,
  updater: (object: BoardObject) => BoardObject
) {
  return objects.map((object) => (object.id === id ? updater(object) : object));
}

export function updateBoardObjectPosition(
  objects: BoardObject[],
  id: string,
  x: number,
  y: number
) {
  return updateBoardObjectById(objects, id, (object) => ({ ...object, x, y }));
}

export function updateBoardObjectLabel(
  objects: BoardObject[],
  id: string,
  label: string
) {
  return updateBoardObjectById(objects, id, (object) => {
    if (!isNoteCardObject(object)) {
      return { ...object, label };
    }

    const minimumHeight = getNoteCardHeightForLabel(label, object.width);

    return normalizeNoteCardObject({
      ...object,
      label,
      height: Math.max(object.height, minimumHeight),
    });
  });
}

export function removeBoardObjectById(objects: BoardObject[], id: string) {
  return objects.filter((object) => object.id !== id);
}
