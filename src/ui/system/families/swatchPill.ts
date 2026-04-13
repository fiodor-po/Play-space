import type { CSSProperties } from "react";
import type { DesignSystemDebugMeta } from "../debugMeta";
import { controlScale } from "../controlScale";
import { border, radius, text } from "../foundations";

type SwatchPillRecipePart = {
  className: string;
  style: CSSProperties;
  debug: DesignSystemDebugMeta;
};

type SwatchState = {
  fillColor: string;
  selected?: boolean;
  occupied?: boolean;
  pending?: boolean;
  disabled?: boolean;
};

function createSwatchRecipe(
  sizeName: "default" | "small" | "trigger",
  sizePx: number
): SwatchPillRecipePart {
  return {
    className: "ui-swatch",
    style: {
      width: sizePx,
      height: sizePx,
      borderRadius: radius.pill,
      padding: 0,
      flexShrink: 0,
    },
    debug: {
      family: "swatch",
      size: sizeName,
    },
  };
}

function createPillRecipe(sizeName: "small"): SwatchPillRecipePart {
  return {
    className: "ui-pill",
    style: {
      ...controlScale.small.labelText,
      padding: "7px 10px",
      borderRadius: radius.pill,
      border: `1px solid ${border.default}`,
      background: "rgba(15, 23, 42, 0.92)",
      color: text.secondary,
      cursor: "pointer",
    },
    debug: {
      family: "pill",
      size: sizeName,
    },
  };
}

export const swatchPillRecipes = {
  swatch: {
    default: createSwatchRecipe("default", 36),
    small: createSwatchRecipe("small", 20),
    trigger: createSwatchRecipe("trigger", 16),
  },
  pill: {
    small: createPillRecipe("small"),
  },
} as const;

export function getSwatchButtonProps(
  recipe: SwatchPillRecipePart,
  state: SwatchState
) {
  return {
    className: recipe.className,
    style: {
      ...recipe.style,
      border: state.selected
        ? "3px solid #f8fafc"
        : state.occupied
          ? "2px dashed rgba(148, 163, 184, 0.65)"
          : "1px solid rgba(255, 255, 255, 0.22)",
      background: state.fillColor,
      boxShadow:
        recipe.debug.size === "trigger"
          ? "0 0 0 1px rgba(15, 23, 42, 0.4)"
          : undefined,
      opacity: state.occupied ? 0.45 : state.pending ? 0.75 : state.disabled ? 0.55 : 1,
      cursor: state.occupied || state.pending || state.disabled ? "not-allowed" : "pointer",
      pointerEvents: "auto",
    } satisfies CSSProperties,
    disabled: state.disabled || state.occupied || state.pending,
  } as const;
}

export function getPillButtonProps(recipe: SwatchPillRecipePart) {
  return {
    className: recipe.className,
    style: recipe.style,
  } as const;
}
