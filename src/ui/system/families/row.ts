import type { CSSProperties } from "react";
import { controlScale } from "../controlScale";
import type { DesignSystemDebugMeta } from "../debugMeta";
import { border, radius, surface, text } from "../foundations";
import { uiTextStyle, uiTextStyleSmall } from "../typography";

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string | number>;

type RowRecipePart = {
  className?: string;
  style: CSSProperties;
};

type RowRecipe = {
  container: RowRecipePart;
  title: RowRecipePart;
  supportingText: RowRecipePart;
  debug: DesignSystemDebugMeta;
};

type SelectableRowState = {
  selected?: boolean;
};

function createSelectableRowRecipe(size: "default"): RowRecipe {
  return {
    container: {
      className: "ui-row-selectable",
      style: {
        display: "grid",
        gap: 4,
        textAlign: "left",
        padding: 12,
        borderRadius: radius.inset,
        border: `1px solid ${border.default}`,
        background: surface.panelSubtle,
        color: text.secondary,
        cursor: "pointer",
        "--ui-row-surface-hover": surface.panel,
        "--ui-row-surface-active": surface.panel,
        "--ui-row-border-hover": border.hover,
        "--ui-row-border-active": border.hover,
      } as CSSVariableProperties,
    },
    title: {
      style: {
        ...controlScale.default.labelText,
        color: text.secondary,
      },
    },
    supportingText: {
      style: {
        ...uiTextStyleSmall.caption,
        color: text.muted,
      },
    },
    debug: {
      family: "row",
      variant: "selectable",
      size,
    },
  };
}

function createDataRowRecipe(size: "default"): RowRecipe {
  return {
    container: {
      className: "ui-row-data",
      style: {
        display: "grid",
        gap: 2,
        padding: 10,
        borderRadius: radius.inset,
        background: surface.panelSubtle,
        border: `1px solid ${border.default}`,
        color: text.secondary,
      },
    },
    title: {
      style: {
        ...uiTextStyle.labelSmall,
        color: text.secondary,
      },
    },
    supportingText: {
      style: {
        ...uiTextStyleSmall.caption,
        color: text.muted,
      },
    },
    debug: {
      family: "row",
      variant: "data",
      size,
    },
  };
}

export const rowRecipes = {
  selectable: {
    default: createSelectableRowRecipe("default"),
  },
  data: {
    default: createDataRowRecipe("default"),
  },
} as const;

export function getSelectableRowProps(recipe: RowRecipe, state: SelectableRowState = {}) {
  const baseStyle = recipe.container.style as CSSVariableProperties;

  return {
    className: recipe.container.className,
    style: {
      ...baseStyle,
      ...(state.selected
        ? {
            border: `1px solid rgba(96, 165, 250, 0.7)`,
            background: "rgba(30, 41, 59, 0.95)",
            "--ui-row-surface-hover": "rgba(30, 41, 59, 0.95)",
            "--ui-row-surface-active": "rgba(30, 41, 59, 0.95)",
            "--ui-row-border-hover": "rgba(96, 165, 250, 0.7)",
            "--ui-row-border-active": "rgba(96, 165, 250, 0.7)",
          }
        : null),
    } as CSSVariableProperties,
  } as const;
}
