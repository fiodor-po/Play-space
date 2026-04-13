import type { CSSProperties } from "react";
import type { DesignSystemDebugMeta } from "./debug";
import { border, radius, surface, text } from "./foundations";

type SurfaceRecipe = {
  className: string;
  style: CSSProperties;
  debug: DesignSystemDebugMeta;
};

function createSurfaceRecipe(
  variant: "panel" | "inset" | "infoCard",
  size: "default" | "compact" = "default"
): SurfaceRecipe {
  if (variant === "inset") {
    return {
      className: "ui-surface",
      style: {
        display: "grid",
        gap: 10,
        padding: "10px 12px",
        borderRadius: radius.inset,
        background: surface.panelSubtle,
        border: `1px solid ${border.default}`,
        color: text.secondary,
      },
      debug: {
        family: "surface",
        variant: "inset",
        size,
      },
    };
  }

  if (variant === "infoCard") {
    return {
      className: "ui-surface",
      style: {
        display: "grid",
        gap: 4,
        padding: 12,
        borderRadius: radius.inset,
        background: surface.panelSubtle,
        border: `1px solid ${border.default}`,
        color: text.secondary,
      },
      debug: {
        family: "surface",
        variant: "infoCard",
        size,
      },
    };
  }

  return {
    className: "ui-surface",
    style: {
      display: "grid",
      gap: size === "compact" ? 8 : 12,
      padding: size === "compact" ? 12 : 16,
      borderRadius: radius.surface,
      background: surface.panel,
      border: `1px solid ${border.default}`,
      color: text.secondary,
    },
    debug: {
      family: "surface",
      variant: "panel",
      size,
    },
  };
}

export const surfaceRecipes = {
  panel: {
    default: createSurfaceRecipe("panel", "default"),
    compact: createSurfaceRecipe("panel", "compact"),
  },
  inset: {
    default: createSurfaceRecipe("inset", "default"),
  },
  infoCard: {
    default: createSurfaceRecipe("infoCard", "default"),
  },
} as const;
