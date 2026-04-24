import type { CSSProperties } from "react";
import { HTML_UI_FONT_FAMILY } from "../../../board/constants";
import { getBoardObjectElevationShadowRecipe } from "../boardMaterials";
import type { DesignSystemDebugMeta } from "../debugMeta";
import { border, radiusPrimitive, surface, text } from "../foundations";
import { uiTextStyleSmall } from "../typography";

const FLOATING_OBJECT_SHADOW =
  getBoardObjectElevationShadowRecipe("floating").cssBoxShadow;

type ContextMenuRecipe = {
  className: string;
  style: CSSProperties;
  debug: DesignSystemDebugMeta;
};

function createContextMenuShellRecipe(): ContextMenuRecipe {
  return {
    className: "ui-context-menu",
    style: {
      position: "fixed",
      display: "grid",
      gap: 3,
      padding: 6,
      borderRadius: radiusPrimitive.r12,
      border: `1px solid ${border.default}`,
      background: surface.panel,
      color: text.secondary,
      boxShadow: FLOATING_OBJECT_SHADOW,
      backdropFilter: "blur(10px)",
      fontFamily: HTML_UI_FONT_FAMILY,
      pointerEvents: "auto",
    },
    debug: {
      family: "context-menu",
      variant: "shell",
    },
  };
}

function createContextMenuItemRecipe(): ContextMenuRecipe {
  return {
    className: "ui-context-menu-item",
    style: {
      width: "100%",
      minHeight: 30,
      display: "grid",
      gridTemplateColumns: "auto minmax(0, 1fr) auto",
      alignItems: "center",
      gap: 8,
      padding: "0 9px",
      border: 0,
      borderRadius: radiusPrimitive.r8,
      appearance: "none",
      WebkitAppearance: "none",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      lineHeight: "16px",
      textAlign: "left",
      cursor: "pointer",
    },
    debug: {
      family: "context-menu",
      variant: "item",
    },
  };
}

function createContextMenuGridItemRecipe(): ContextMenuRecipe {
  return {
    className: "ui-context-menu-grid-item",
    style: {
      width: 38,
      minWidth: 38,
      height: 38,
      minHeight: 38,
      display: "grid",
      placeItems: "center",
      padding: 0,
      border: 0,
      borderRadius: radiusPrimitive.r8,
      appearance: "none",
      WebkitAppearance: "none",
      fontFamily: "inherit",
      fontSize: 18,
      fontWeight: 700,
      lineHeight: 1,
      cursor: "pointer",
    },
    debug: {
      family: "context-menu",
      variant: "grid-item",
    },
  };
}

function createContextMenuSeparatorRecipe(): ContextMenuRecipe {
  return {
    className: "ui-context-menu-separator",
    style: {
      height: 1,
      margin: "3px 4px",
      background: border.default,
      pointerEvents: "none",
    },
    debug: {
      family: "context-menu",
      variant: "separator",
    },
  };
}

function createContextMenuSectionLabelRecipe(): ContextMenuRecipe {
  return {
    className: "ui-context-menu-section-label",
    style: {
      ...uiTextStyleSmall.label,
      padding: "5px 9px 3px",
      color: text.muted,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      pointerEvents: "none",
    },
    debug: {
      family: "context-menu",
      variant: "section-label",
    },
  };
}

export const contextMenuRecipes = {
  shell: createContextMenuShellRecipe(),
  item: createContextMenuItemRecipe(),
  gridItem: createContextMenuGridItemRecipe(),
  separator: createContextMenuSeparatorRecipe(),
  sectionLabel: createContextMenuSectionLabelRecipe(),
} as const;
