import {
  TEXT_CARD_BODY_FONT_FAMILY,
  TEXT_CARD_BODY_FONT_SIZE,
  TEXT_CARD_BODY_INSET_X,
  TEXT_CARD_BODY_INSET_Y,
  TEXT_CARD_BODY_LINE_HEIGHT,
  TEXT_CARD_HEADER_HEIGHT,
} from "../../constants";
import type { BoardObject } from "../../../types/board";

export const MIN_TEXT_CARD_WIDTH = 96;
export const MIN_TEXT_CARD_HEIGHT = 72;

const MIN_TEXT_CARD_BODY_WIDTH = 40;

let cachedMeasureContext: CanvasRenderingContext2D | null = null;

function getMeasureContext() {
  if (cachedMeasureContext) {
    return cachedMeasureContext;
  }

  if (typeof document === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  cachedMeasureContext = canvas.getContext("2d");

  return cachedMeasureContext;
}

export function clampTextCardWidth(width: number) {
  return Math.max(MIN_TEXT_CARD_WIDTH, Math.round(width));
}

export function getTextCardBodyWidth(width: number) {
  return Math.max(
    clampTextCardWidth(width) - TEXT_CARD_BODY_INSET_X * 2,
    MIN_TEXT_CARD_BODY_WIDTH
  );
}

function getLineHeightPx() {
  return TEXT_CARD_BODY_FONT_SIZE * TEXT_CARD_BODY_LINE_HEIGHT;
}

function measureWordWidth(word: string, context: CanvasRenderingContext2D | null) {
  if (!context) {
    return word.length * TEXT_CARD_BODY_FONT_SIZE * 0.56;
  }

  return context.measureText(word).width;
}

function getWrappedLineCount(text: string, bodyWidth: number) {
  const context = getMeasureContext();

  if (context) {
    context.font = `${TEXT_CARD_BODY_FONT_SIZE}px ${TEXT_CARD_BODY_FONT_FAMILY}`;
  }

  const paragraphs = text.replace(/\r\n/g, "\n").split("\n");
  let lineCount = 0;

  paragraphs.forEach((paragraph) => {
    if (paragraph.length === 0) {
      lineCount += 1;
      return;
    }

    const words = paragraph.split(/(\s+)/).filter((segment) => segment.length > 0);
    let currentLineWidth = 0;

    words.forEach((segment) => {
      const segmentWidth = measureWordWidth(segment, context);

      if (segmentWidth > bodyWidth && !/^\s+$/.test(segment)) {
        if (currentLineWidth > 0) {
          lineCount += 1;
          currentLineWidth = 0;
        }

        let chunkWidth = 0;

        for (const character of segment) {
          const characterWidth = measureWordWidth(character, context);

          if (chunkWidth > 0 && chunkWidth + characterWidth > bodyWidth) {
            lineCount += 1;
            chunkWidth = 0;
          }

          chunkWidth += characterWidth;
        }

        currentLineWidth = chunkWidth;
        return;
      }

      if (currentLineWidth > 0 && currentLineWidth + segmentWidth > bodyWidth) {
        lineCount += 1;
        currentLineWidth = 0;
      }

      currentLineWidth += segmentWidth;
    });

    lineCount += 1;
  });

  return Math.max(lineCount, 1);
}

export function getTextCardHeightForLabel(label: string, width: number) {
  const bodyWidth = getTextCardBodyWidth(width);
  const lineCount = getWrappedLineCount(label, bodyWidth);
  const contentHeight = Math.ceil(lineCount * getLineHeightPx());
  const minimumBodyHeight = MIN_TEXT_CARD_HEIGHT - TEXT_CARD_HEADER_HEIGHT;
  const bodyHeight = Math.max(
    minimumBodyHeight,
    contentHeight + TEXT_CARD_BODY_INSET_Y * 2
  );

  return TEXT_CARD_HEADER_HEIGHT + bodyHeight;
}

export function getTextCardMinimumBounds(label: string, width: number) {
  const clampedWidth = clampTextCardWidth(width);

  return {
    width: clampedWidth,
    height: getTextCardHeightForLabel(label, clampedWidth),
  };
}

export function normalizeTextCardObject(object: BoardObject) {
  if (object.kind !== "text-card") {
    return object;
  }

  const width = clampTextCardWidth(object.width);
  const minimumHeight = getTextCardHeightForLabel(object.label, width);

  return {
    ...object,
    width,
    height: Math.max(Math.round(object.height), minimumHeight),
  };
}
