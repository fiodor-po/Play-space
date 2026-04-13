import type { CSSProperties } from "react";
import type { DesignSystemDebugMeta } from "./debug";
import { radius, text } from "./foundations";

type BoardSurfaceRecipe = {
  style: CSSProperties;
  debug: DesignSystemDebugMeta;
};

type BoardLayoutRecipe = {
  style: CSSProperties;
};

function createObjectSemanticsTooltipRecipe(): BoardSurfaceRecipe {
  return {
    style: {
      minWidth: 220,
      maxWidth: 240,
      display: "grid",
      gap: 6,
      padding: 10,
      borderRadius: radius.inset,
      border: "1px solid rgba(148, 163, 184, 0.24)",
      background: "rgba(15, 23, 42, 0.94)",
      color: text.secondary,
      boxShadow: "0 20px 48px rgba(2, 6, 23, 0.34)",
      pointerEvents: "none",
      fontSize: 12,
    },
    debug: {
      family: "board-surface",
      variant: "object-semantics-tooltip",
    },
  };
}

function createDiceTrayShellRecipe(): BoardSurfaceRecipe {
  return {
    style: {
      position: "fixed",
      left: 20,
      bottom: 20,
      zIndex: 31,
      display: "grid",
      gap: 8,
      pointerEvents: "none",
    },
    debug: {
      family: "board-surface",
      variant: "dice-tray-shell",
    },
  };
}

function createDiceTrayStackRecipe(): BoardLayoutRecipe {
  return {
    style: {
      display: "grid",
      gap: 8,
      pointerEvents: "none",
    },
  };
}

export const boardSurfaceRecipes = {
  objectSemanticsTooltip: {
    shell: createObjectSemanticsTooltipRecipe(),
  },
  diceTray: {
    shell: createDiceTrayShellRecipe(),
    stack: createDiceTrayStackRecipe(),
  },
} as const;
