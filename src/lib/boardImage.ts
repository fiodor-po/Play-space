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

export function clearImageStrokesByCreatorInObjects(
  objects: BoardObject[],
  imageId: string,
  creatorId: string
) {
  return objects.map((object) =>
    object.id === imageId && object.kind === "image"
      ? {
          ...object,
          imageStrokes: (object.imageStrokes ?? []).filter(
            (stroke) => stroke.creatorId !== creatorId
          ),
        }
      : object
  );
}

function getSquaredDistanceBetweenPoints(
  firstPoint: { x: number; y: number },
  secondPoint: { x: number; y: number }
) {
  const dx = firstPoint.x - secondPoint.x;
  const dy = firstPoint.y - secondPoint.y;

  return dx * dx + dy * dy;
}

export function getPointToSegmentDistance(
  point: { x: number; y: number },
  segmentStart: { x: number; y: number },
  segmentEnd: { x: number; y: number }
) {
  const segmentDx = segmentEnd.x - segmentStart.x;
  const segmentDy = segmentEnd.y - segmentStart.y;
  const segmentLengthSquared = segmentDx * segmentDx + segmentDy * segmentDy;

  if (segmentLengthSquared === 0) {
    return Math.sqrt(getSquaredDistanceBetweenPoints(point, segmentStart));
  }

  const projection =
    ((point.x - segmentStart.x) * segmentDx +
      (point.y - segmentStart.y) * segmentDy) /
    segmentLengthSquared;
  const clampedProjection = Math.max(0, Math.min(1, projection));
  const closestPoint = {
    x: segmentStart.x + clampedProjection * segmentDx,
    y: segmentStart.y + clampedProjection * segmentDy,
  };

  return Math.sqrt(getSquaredDistanceBetweenPoints(point, closestPoint));
}

function doesImageStrokeIntersectCircle(
  stroke: ImageStroke,
  point: { x: number; y: number },
  radius: number
) {
  const points = stroke.points;

  if (points.length < 2) {
    return false;
  }

  if (points.length === 2) {
    return (
      Math.sqrt(
        getSquaredDistanceBetweenPoints(point, {
          x: points[0],
          y: points[1],
        })
      ) <= radius
    );
  }

  for (let index = 0; index < points.length - 2; index += 2) {
    const distance = getPointToSegmentDistance(
      point,
      {
        x: points[index],
        y: points[index + 1],
      },
      {
        x: points[index + 2],
        y: points[index + 3],
      }
    );

    if (distance <= radius) {
      return true;
    }
  }

  return false;
}

export function removeImageStrokesIntersectingCircleInObjects(
  objects: BoardObject[],
  imageId: string,
  point: { x: number; y: number },
  radius: number
) {
  let didRemoveStroke = false;

  const nextObjects = objects.map((object) => {
    if (object.id !== imageId || object.kind !== "image") {
      return object;
    }

    const imageStrokes = object.imageStrokes ?? [];

    if (imageStrokes.length === 0) {
      return object;
    }

    const nextImageStrokes = imageStrokes.filter(
      (stroke) => !doesImageStrokeIntersectCircle(stroke, point, radius)
    );

    if (nextImageStrokes.length === imageStrokes.length) {
      return object;
    }

    didRemoveStroke = true;

    return {
      ...object,
      imageStrokes: nextImageStrokes,
    };
  });

  return didRemoveStroke ? nextObjects : objects;
}

function getStrokePointAt(points: number[], index: number) {
  return {
    x: points[index * 2],
    y: points[index * 2 + 1],
  };
}

function appendStrokePoint(points: number[], point: { x: number; y: number }) {
  points.push(point.x, point.y);
}

function createStrokeFragment(
  stroke: ImageStroke,
  points: number[]
): ImageStroke | null {
  if (points.length < 4) {
    return null;
  }

  return {
    ...stroke,
    points,
  };
}

function splitImageStrokeAroundCircle(
  stroke: ImageStroke,
  point: { x: number; y: number },
  radius: number
) {
  const points = stroke.points;
  const pointCount = Math.floor(points.length / 2);

  if (pointCount === 0) {
    return [stroke];
  }

  if (pointCount === 1) {
    const onlyPoint = getStrokePointAt(points, 0);

    return getSquaredDistanceBetweenPoints(onlyPoint, point) <= radius * radius
      ? []
      : [stroke];
  }

  const fragments: ImageStroke[] = [];
  let currentFragmentPoints: number[] = [];
  const firstPoint = getStrokePointAt(points, 0);

  if (getSquaredDistanceBetweenPoints(firstPoint, point) > radius * radius) {
    appendStrokePoint(currentFragmentPoints, firstPoint);
  }

  for (let pointIndex = 1; pointIndex < pointCount; pointIndex += 1) {
    const previousPoint = getStrokePointAt(points, pointIndex - 1);
    const currentPoint = getStrokePointAt(points, pointIndex);
    const currentPointIsInside =
      getSquaredDistanceBetweenPoints(currentPoint, point) <= radius * radius;
    const segmentIntersectsCircle =
      getPointToSegmentDistance(point, previousPoint, currentPoint) <= radius;

    if (segmentIntersectsCircle) {
      const completedFragment = createStrokeFragment(
        stroke,
        currentFragmentPoints
      );

      if (completedFragment) {
        fragments.push(completedFragment);
      }

      currentFragmentPoints = [];

      if (!currentPointIsInside) {
        appendStrokePoint(currentFragmentPoints, currentPoint);
      }

      continue;
    }

    if (currentFragmentPoints.length === 0) {
      appendStrokePoint(currentFragmentPoints, previousPoint);
    }

    appendStrokePoint(currentFragmentPoints, currentPoint);
  }

  const completedFragment = createStrokeFragment(stroke, currentFragmentPoints);

  if (completedFragment) {
    fragments.push(completedFragment);
  }

  return fragments;
}

export function removeImageStrokePartsIntersectingCircleInObjects(
  objects: BoardObject[],
  imageId: string,
  point: { x: number; y: number },
  radius: number
) {
  let didChangeStrokes = false;

  const nextObjects = objects.map((object) => {
    if (object.id !== imageId || object.kind !== "image") {
      return object;
    }

    const imageStrokes = object.imageStrokes ?? [];

    if (imageStrokes.length === 0) {
      return object;
    }

    const nextImageStrokes = imageStrokes.flatMap((stroke) => {
      const strokeFragments = splitImageStrokeAroundCircle(
        stroke,
        point,
        radius
      );

      if (
        strokeFragments.length !== 1 ||
        strokeFragments[0].points.length !== stroke.points.length
      ) {
        didChangeStrokes = true;
      }

      return strokeFragments;
    });

    if (!didChangeStrokes) {
      return object;
    }

    return {
      ...object,
      imageStrokes: nextImageStrokes,
    };
  });

  return didChangeStrokes ? nextObjects : objects;
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
  creatorId: string;
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
    creatorId: params.creatorId,
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
