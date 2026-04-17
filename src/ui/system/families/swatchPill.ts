import type { CSSProperties } from "react";
import type { DesignSystemDebugMeta } from "../debugMeta";
import { controlScale } from "../controlScale";
import { border, participantColor, radius, text } from "../foundations";

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string | number>;

type SwatchPillRecipePart = {
  className: string;
  style: CSSProperties;
  debug: DesignSystemDebugMeta;
};

type SwatchState = {
  fillColor?: string;
  participantColorSlot?: number;
  selected?: boolean;
  occupied?: boolean;
  pending?: boolean;
  disabled?: boolean;
};

type PillState = {
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
      position: "relative",
      overflow: "visible",
      background:
        "var(--ui-swatch-overlay-current, linear-gradient(transparent, transparent)), var(--ui-swatch-surface-current, var(--ui-swatch-surface-default, transparent))",
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
      border: "1px solid var(--ui-pill-border-current, var(--ui-pill-border-default))",
      background: "var(--ui-pill-surface-current, var(--ui-pill-surface-default))",
      color: "var(--ui-pill-text-current, var(--ui-pill-text-default))",
      opacity: "var(--ui-pill-opacity-current, var(--ui-pill-opacity-default))",
      cursor: "pointer",
      "--ui-pill-surface-default": "rgba(15, 23, 42, 0.92)",
      "--ui-pill-surface-disabled": "var(--ui-color-surface-inset-disabled)",
      "--ui-pill-border-default": border.default,
      "--ui-pill-border-disabled": border.disabled,
      "--ui-pill-text-default": text.secondary,
      "--ui-pill-text-disabled": text.disabled,
      "--ui-pill-opacity-default": 1,
      "--ui-pill-opacity-disabled": "var(--ui-control-opacity-disabled)",
    } as CSSVariableProperties,
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
  const slotTokenSet =
    typeof state.participantColorSlot === "number"
      ? participantColor[state.participantColorSlot - 1]
      : null;

  return {
    className: recipe.className,
    style: {
      ...recipe.style,
      ...(slotTokenSet
        ? {
            "--ui-swatch-surface-default": slotTokenSet.surface.default,
            "--ui-swatch-surface-hover": slotTokenSet.surface.hover,
            "--ui-swatch-surface-active": slotTokenSet.surface.active,
            "--ui-swatch-border-default": slotTokenSet.border.default,
          }
        : {
            "--ui-swatch-surface-default": state.fillColor ?? "transparent",
          }),
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

export function getPillButtonProps(recipe: SwatchPillRecipePart, state: PillState = {}) {
  return {
    className: recipe.className,
    style: recipe.style,
    disabled: state.disabled || undefined,
  } as const;
}
