import type { CSSProperties } from "react";
import type { DesignSystemDebugMeta } from "../debug";
import { controlScale } from "../controlScale";
import { text } from "../foundations";

type SelectionControlPart = {
  className: string;
  style: CSSProperties;
  debug?: DesignSystemDebugMeta;
};

type SelectionControlRecipe = {
  row: SelectionControlPart;
  label: SelectionControlPart;
  indicator: SelectionControlPart;
};

function createSelectionRow(
  size: (typeof controlScale)["default"] | (typeof controlScale)["small"],
  debug: DesignSystemDebugMeta
): SelectionControlPart {
  return {
    className: "ui-selection-row",
    style: {
      display: "flex",
      alignItems: "center",
      gap: size.contentGap,
      minHeight: size.height,
      color: text.muted,
      cursor: "pointer",
    },
    debug,
  };
}

function createSelectionLabel(
  size: (typeof controlScale)["default"] | (typeof controlScale)["small"]
): SelectionControlPart {
  return {
    className: "ui-selection-label",
    style: {
      ...size.labelText,
      color: "inherit",
      minWidth: 0,
    },
  };
}

function createSelectionIndicator(
  size: (typeof controlScale)["default"] | (typeof controlScale)["small"]
): SelectionControlPart {
  return {
    className: "ui-selection-indicator",
    style: {
      margin: 0,
      width: size === controlScale.small ? 14 : 16,
      height: size === controlScale.small ? 14 : 16,
      flexShrink: 0,
      accentColor: "#2563eb",
      cursor: "inherit",
    },
  };
}

function createSelectionRecipe(
  variant: "checkbox" | "radio" | "switch",
  sizeName: "default" | "small",
  size: (typeof controlScale)["default"] | (typeof controlScale)["small"]
): SelectionControlRecipe {
  return {
    row: createSelectionRow(size, {
      family: "selection",
      variant,
      size: sizeName,
    }),
    label: createSelectionLabel(size),
    indicator: createSelectionIndicator(size),
  };
}

export const selectionControlRecipes = {
  checkbox: {
    default: createSelectionRecipe("checkbox", "default", controlScale.default),
    small: createSelectionRecipe("checkbox", "small", controlScale.small),
  },
  radio: {
    default: createSelectionRecipe("radio", "default", controlScale.default),
    small: createSelectionRecipe("radio", "small", controlScale.small),
  },
  switch: {
    default: createSelectionRecipe("switch", "default", controlScale.default),
    small: createSelectionRecipe("switch", "small", controlScale.small),
  },
} as const;
