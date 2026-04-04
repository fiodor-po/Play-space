import type { BoardObject, ImageStroke } from "../types/board";

export const DEFAULT_IMAGE_STROKE_WIDTH = 4;

type ImageDisplaySizeOptions = {
  maxWidth: number;
  maxHeight: number;
  minSize: number;
};

export function getInitialImageDisplaySize(
  naturalWidth: number,
  naturalHeight: number,
  options: ImageDisplaySizeOptions
) {
  const displayScale = Math.min(
    1,
    options.maxWidth / naturalWidth,
    options.maxHeight / naturalHeight
  );

  return {
    width: Math.max(Math.round(naturalWidth * displayScale), options.minSize),
    height: Math.max(Math.round(naturalHeight * displayScale), options.minSize),
  };
}

export function getImageStorageScale(
  naturalWidth: number,
  naturalHeight: number,
  maxDimension: number
) {
  return Math.min(1, maxDimension / naturalWidth, maxDimension / naturalHeight);
}

export function clearImageStrokesInObjects(
  objects: BoardObject[],
  imageId: string
) {
  return objects.map((object) =>
    object.id === imageId && object.kind === "image"
      ? { ...object, imageStrokes: [] }
      : object
  );
}

export function updateImageStrokeInObjects(
  objects: BoardObject[],
  id: string,
  strokeIndex: number,
  updater: (stroke: ImageStroke) => ImageStroke
) {
  return objects.map((object) => {
    if (object.id !== id || object.kind !== "image") {
      return object;
    }

    const imageStrokes = object.imageStrokes ?? [];

    return {
      ...object,
      imageStrokes: imageStrokes.map((stroke, index) =>
        index === strokeIndex ? updater(stroke) : stroke
      ),
    };
  });
}

export function appendImageStrokePointInObjects(
  objects: BoardObject[],
  imageId: string,
  strokeIndex: number,
  point: { x: number; y: number }
) {
  return updateImageStrokeInObjects(objects, imageId, strokeIndex, (stroke) => ({
    ...stroke,
    points: [...stroke.points, point.x, point.y],
  }));
}

type CreateImageObjectParams = {
  id: string;
  label: string;
  authorColor: string;
  src: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
};

export function createImageObject(params: CreateImageObjectParams): BoardObject {
  return {
    id: params.id,
    kind: "image",
    x: params.position.x - params.size.width / 2,
    y: params.position.y - params.size.height / 2,
    width: params.size.width,
    height: params.size.height,
    fill: "#64748b",
    label: params.label,
    authorColor: params.authorColor,
    src: params.src,
    textColor: "#0f172a",
  };
}
