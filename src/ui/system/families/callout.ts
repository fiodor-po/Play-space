import type { CSSProperties } from "react";
import { border, radius, surface, text } from "../foundations";
import type { DesignSystemDebugMeta } from "../debug";

type CalloutRecipe = {
  className: string;
  style: CSSProperties;
  debug: DesignSystemDebugMeta;
};

function createCalloutRecipe(
  variant: "warning" | "danger",
  size: "default" | "compact"
): CalloutRecipe {
  const isWarning = variant === "warning";
  const isCompact = size === "compact";

  return {
    className: "ui-callout",
    style: {
      padding: isCompact ? "8px 10px" : "10px 12px",
      borderRadius: radius.control,
      border: `1px solid ${isWarning ? border.warning : border.danger}`,
      background: isWarning
        ? surface.warning
        : isCompact
          ? "rgba(69, 10, 10, 0.78)"
          : surface.danger,
      color: isWarning ? text.warning : text.danger,
      fontSize: 12,
      fontWeight: 600,
    },
    debug: {
      family: "callout",
      variant,
      size,
    },
  };
}

export const calloutRecipes = {
  warning: {
    default: createCalloutRecipe("warning", "default"),
  },
  danger: {
    default: createCalloutRecipe("danger", "default"),
    compact: createCalloutRecipe("danger", "compact"),
  },
} as const;
