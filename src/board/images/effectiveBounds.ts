import type Konva from "konva";
import type { BoardObject } from "../../types/board";

export type ImageEffectiveBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageSharedPreviewBounds = {
  x: number;
  y: number;
  width?: number;
  height?: number;
};

type ResolveEffectiveImageBoundsParams = {
  committedImage: BoardObject;
  localNode?: Konva.Image | null;
  isLocallyInteracting?: boolean;
  sharedPreview?: ImageSharedPreviewBounds | null;
};

export function resolveEffectiveImageBounds({
  committedImage,
  localNode,
  isLocallyInteracting = false,
}: ResolveEffectiveImageBoundsParams): ImageEffectiveBounds {
  if (isLocallyInteracting && localNode) {
    const bounds = localNode.getClientRect({
      skipShadow: true,
      skipStroke: true,
      relativeTo: localNode.getLayer() ?? undefined,
    });

    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  }

  return {
    x: committedImage.x,
    y: committedImage.y,
    width: committedImage.width,
    height: committedImage.height,
  };
}
