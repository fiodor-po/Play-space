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
