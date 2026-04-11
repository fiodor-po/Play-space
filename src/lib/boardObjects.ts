import type { BoardObject } from "../types/board";
import {
  getTextCardHeightForLabel,
  isNoteLikeObject,
  normalizeNoteLikeObject,
} from "../board/objects/textCard/sizing";

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
    if (!isNoteLikeObject(object)) {
      return { ...object, label };
    }

    const minimumHeight = getTextCardHeightForLabel(label, object.width);

    return normalizeNoteLikeObject({
      ...object,
      label,
      height: Math.max(object.height, minimumHeight),
    });
  });
}

export function removeBoardObjectById(objects: BoardObject[], id: string) {
  return objects.filter((object) => object.id !== id);
}
