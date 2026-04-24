import {
  DEFAULT_ROOM_BACKGROUND_THEME_ID,
  normalizeRoomBackgroundThemeId,
  type RoomBackgroundThemeId,
} from "../../lib/roomSettings";

const boardMaterialTokens = {
  backdrop: "--ui-board-backdrop",
  surface: "--ui-board-surface",
} as const;

const boardMaterialFallbacks = {
  backdrop: "#081226",
  surface: "#1e293b",
} as const;

export const boardMaterials = {
  backdrop: `var(${boardMaterialTokens.backdrop})`,
  surface: `var(${boardMaterialTokens.surface})`,
  surfaceRadius: 24,
} as const;

export type BoardBackgroundTheme = {
  id: RoomBackgroundThemeId;
  label: string;
  backdrop: string;
  pattern: "dot-grid" | "graph-paper" | "granite" | "cork" | "starfield";
  dotGrid: {
    detailColor: string;
    majorColor: string;
  };
  graphPaper?: {
    minorLineColor: string;
    majorLineColor: string;
  };
  granite?: {
    speckColors: string[];
  };
  cork?: {
    fleckColors: string[];
  };
  starfield?: {
    starColors: string[];
  };
};

export type BoardObjectElevationShadowId =
  | "surface"
  | "raised"
  | "floating";

export type BoardObjectElevationShadowRecipe = {
  id: BoardObjectElevationShadowId;
  label: string;
  description: string;
  cssBoxShadow: string;
  konva: {
    shadowColor: string;
    shadowOpacity: number;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
  };
};

export const boardObjectElevationShadowRecipes = [
  {
    id: "surface",
    label: "Surface",
    description: "Object rests on the board.",
    cssBoxShadow:
      "0 3px 7px rgba(2, 6, 23, 0.24), 0 1px 2px rgba(2, 6, 23, 0.38), 0 0 0 1px rgba(2, 6, 23, 0.16), 0 0 0 1px rgba(255, 255, 255, 0.06) inset",
    konva: {
      shadowColor: "#020617",
      shadowOpacity: 0.38,
      shadowBlur: 8,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
    },
  },
  {
    id: "raised",
    label: "Raised",
    description: "Object is slightly lifted.",
    cssBoxShadow:
      "0 18px 34px rgba(2, 6, 23, 0.38), 0 7px 14px rgba(2, 6, 23, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.08)",
    konva: {
      shadowColor: "#020617",
      shadowOpacity: 0.42,
      shadowBlur: 20,
      shadowOffsetX: 0,
      shadowOffsetY: 10,
    },
  },
  {
    id: "floating",
    label: "Floating",
    description: "Object is lifted high above the board.",
    cssBoxShadow:
      "0 24px 48px rgba(2, 6, 23, 0.38), 0 8px 18px rgba(2, 6, 23, 0.24), 0 0 0 1px rgba(255, 255, 255, 0.08)",
    konva: {
      shadowColor: "#020617",
      shadowOpacity: 0.36,
      shadowBlur: 22,
      shadowOffsetX: 0,
      shadowOffsetY: 12,
    },
  },
] satisfies BoardObjectElevationShadowRecipe[];

export function getBoardObjectElevationShadowRecipe(
  shadowId: BoardObjectElevationShadowId
): BoardObjectElevationShadowRecipe {
  return (
    boardObjectElevationShadowRecipes.find((recipe) => recipe.id === shadowId) ??
    boardObjectElevationShadowRecipes[0]
  );
}

const BOARD_BACKGROUND_THEMES: Record<
  RoomBackgroundThemeId,
  BoardBackgroundTheme
> = {
  "dot-grid-dark-blue": {
    id: "dot-grid-dark-blue",
    label: "Deep Slate",
    backdrop: boardMaterialFallbacks.backdrop,
    pattern: "dot-grid",
    dotGrid: {
      detailColor: "rgba(148, 163, 184, 0.1)",
      majorColor: "rgba(226, 232, 240, 0.26)",
    },
  },
  "dot-grid-soft-light": {
    id: "dot-grid-soft-light",
    label: "Mist Paper",
    backdrop: "#dce6f2",
    pattern: "dot-grid",
    dotGrid: {
      detailColor: "rgba(15, 23, 42, 0.08)",
      majorColor: "rgba(15, 23, 42, 0.22)",
    },
  },
  "graph-paper": {
    id: "graph-paper",
    label: "Grid Paper",
    backdrop: "#e9eef3",
    pattern: "graph-paper",
    dotGrid: {
      detailColor: "rgba(15, 23, 42, 0.08)",
      majorColor: "rgba(15, 23, 42, 0.18)",
    },
    graphPaper: {
      minorLineColor: "rgba(71, 85, 105, 0.07)",
      majorLineColor: "rgba(15, 23, 42, 0.12)",
    },
  },
  granite: {
    id: "granite",
    label: "Pale Granite",
    backdrop: "#d7d5ce",
    pattern: "granite",
    dotGrid: {
      detailColor: "rgba(15, 23, 42, 0.08)",
      majorColor: "rgba(15, 23, 42, 0.18)",
    },
    granite: {
      speckColors: [
        "rgba(30, 41, 59, 0.16)",
        "rgba(71, 85, 105, 0.12)",
        "rgba(100, 116, 139, 0.1)",
        "rgba(255, 255, 255, 0.18)",
      ],
    },
  },
  "granite-mid": {
    id: "granite-mid",
    label: "Warm Granite",
    backdrop: "#8f8a7f",
    pattern: "granite",
    dotGrid: {
      detailColor: "rgba(15, 23, 42, 0.08)",
      majorColor: "rgba(15, 23, 42, 0.18)",
    },
    granite: {
      speckColors: [
        "rgba(15, 23, 42, 0.2)",
        "rgba(51, 65, 85, 0.16)",
        "rgba(226, 232, 240, 0.16)",
        "rgba(120, 113, 108, 0.2)",
      ],
    },
  },
  "granite-dark": {
    id: "granite-dark",
    label: "Black Granite",
    backdrop: "#24272b",
    pattern: "granite",
    dotGrid: {
      detailColor: "rgba(226, 232, 240, 0.08)",
      majorColor: "rgba(226, 232, 240, 0.18)",
    },
    granite: {
      speckColors: [
        "rgba(226, 232, 240, 0.18)",
        "rgba(148, 163, 184, 0.14)",
        "rgba(15, 23, 42, 0.24)",
        "rgba(255, 255, 255, 0.1)",
      ],
    },
  },
  "cork-board": {
    id: "cork-board",
    label: "Cork Board",
    backdrop: "#98795b",
    pattern: "cork",
    dotGrid: {
      detailColor: "rgba(67, 20, 7, 0.08)",
      majorColor: "rgba(67, 20, 7, 0.18)",
    },
    cork: {
      fleckColors: [
        "rgba(61, 42, 27, 0.22)",
        "rgba(89, 63, 42, 0.2)",
        "rgba(145, 113, 78, 0.18)",
        "rgba(210, 184, 139, 0.16)",
      ],
    },
  },
  starfield: {
    id: "starfield",
    label: "Starfield",
    backdrop: "#050816",
    pattern: "starfield",
    dotGrid: {
      detailColor: "rgba(226, 232, 240, 0.08)",
      majorColor: "rgba(226, 232, 240, 0.18)",
    },
    starfield: {
      starColors: [
        "rgba(255, 255, 255, 0.36)",
        "rgba(191, 219, 254, 0.3)",
        "rgba(226, 232, 240, 0.24)",
        "rgba(125, 211, 252, 0.18)",
      ],
    },
  },
};

export function getBoardBackgroundTheme(
  themeId?: RoomBackgroundThemeId | null
): BoardBackgroundTheme {
  return (
    BOARD_BACKGROUND_THEMES[normalizeRoomBackgroundThemeId(themeId)] ??
    BOARD_BACKGROUND_THEMES[DEFAULT_ROOM_BACKGROUND_THEME_ID]
  );
}

export function getBoardBackgroundThemeOptions() {
  return Object.values(BOARD_BACKGROUND_THEMES);
}

export function resolveBoardCanvasMaterials() {
  if (typeof window === "undefined") {
    return {
      backdrop: boardMaterialFallbacks.backdrop,
      surface: boardMaterialFallbacks.surface,
      surfaceRadius: boardMaterials.surfaceRadius,
    };
  }

  const rootStyles = window.getComputedStyle(document.documentElement);
  const resolveColor = (
    tokenName: keyof typeof boardMaterialTokens,
    fallback: string
  ) => {
    const resolvedValue = rootStyles
      .getPropertyValue(boardMaterialTokens[tokenName])
      .trim();

    return resolvedValue || fallback;
  };

  return {
    backdrop: resolveColor("backdrop", boardMaterialFallbacks.backdrop),
    surface: resolveColor("surface", boardMaterialFallbacks.surface),
    surfaceRadius: boardMaterials.surfaceRadius,
  };
}
