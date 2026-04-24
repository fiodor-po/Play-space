import type { CSSProperties } from "react";
import { getBoardObjectElevationShadowRecipe } from "./boardMaterials";
import type { DesignSystemDebugMeta } from "./debugMeta";
import { border, radius, surface, text } from "./foundations";

const FLOATING_OBJECT_SHADOW =
  getBoardObjectElevationShadowRecipe("floating").cssBoxShadow;

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
      boxShadow: FLOATING_OBJECT_SHADOW,
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

function createFloatingShellRecipe(): BoardSurfaceRecipe {
  return {
    style: {
      display: "grid",
      gap: 8,
      padding: 12,
      borderRadius: radius.surface,
      background: surface.panel,
      border: `1px solid ${border.default}`,
      color: text.secondary,
      boxShadow: FLOATING_OBJECT_SHADOW,
      backdropFilter: "blur(10px)",
    },
    debug: {
      family: "board-surface",
      variant: "floating-shell",
    },
  };
}

export const boardSurfaceRecipes = {
  objectSemanticsTooltip: {
    shell: createObjectSemanticsTooltipRecipe(),
  },
  floatingShell: {
    shell: createFloatingShellRecipe(),
  },
  diceTray: {
    shell: createDiceTrayShellRecipe(),
    stack: createDiceTrayStackRecipe(),
  },
} as const;
