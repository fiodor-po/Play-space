import type { CSSProperties } from "react";
import type { DesignSystemDebugMeta } from "../debugMeta";
import { controlScale } from "../controlScale";
import { border, radius, text } from "../foundations";

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string | number>;

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
      border: "var(--ui-swatch-border-current, var(--ui-swatch-border-default))",
      opacity: "var(--ui-swatch-opacity-current, var(--ui-swatch-opacity-default))",
      boxShadow: "var(--ui-swatch-shadow-current, var(--ui-swatch-shadow-default))",
      "--ui-swatch-shadow-default":
        sizeName === "trigger" ? "var(--ui-swatch-trigger-shadow)" : "none",
    } as CSSVariableProperties,
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
      background: state.fillColor,
      cursor:
        state.occupied || state.pending || state.disabled ? "not-allowed" : "pointer",
      pointerEvents: "auto",
    } satisfies CSSVariableProperties,
    disabled: state.disabled || state.occupied || state.pending,
    "data-ui-selected": state.selected ? "true" : undefined,
    "data-ui-occupied": state.occupied ? "true" : undefined,
    "data-ui-pending": state.pending ? "true" : undefined,
  } as const;
}

export function getPillButtonProps(recipe: SwatchPillRecipePart) {
  return {
    className: recipe.className,
    style: recipe.style,
  } as const;
}
