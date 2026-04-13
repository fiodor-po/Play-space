import type { CSSProperties } from "react";
import type { DesignSystemDebugMeta } from "../debug";
import { border, radius, surface, text } from "../foundations";
import { controlScale } from "../controlScale";
import { uiTextStyleSmall } from "../typography";

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string | number>;

export type ButtonRecipe = {
  className: string;
  style: CSSProperties;
  debug: DesignSystemDebugMeta;
};

type CanvasButtonTone = {
  fill: string;
  stroke: string;
  textColor: string;
};

type CanvasButtonMetrics = {
  minHeight: number;
  minWidth?: number;
  paddingX: number;
  borderRadius: number;
  fontSize: number;
  fontWeight: number | string;
  fontFamily: string;
  lineHeight: number;
};

type ButtonToneOverride = {
  surfaceDefault?: string;
  surfaceHover?: string;
  surfaceActive?: string;
  surfaceDisabled?: string;
  borderDefault?: string;
  borderHover?: string;
  borderActive?: string;
  borderDisabled?: string;
  textDefault?: string;
  textDisabled?: string;
};

type ParticipantAccentMode = "border" | "fill";

type ButtonVariantTone = {
  surfaceDefault: string;
  surfaceHover: string;
  surfaceActive: string;
  surfaceDisabled: string;
  borderDefault: string;
  borderHover: string;
  borderActive: string;
  borderDisabled: string;
  textDefault: string;
  textDisabled: string;
};

const compactButtonScale = {
  height: 24,
  paddingY: 2,
  paddingX: 6,
  contentGap: 4,
  bodyText: {
    ...uiTextStyleSmall.body,
    lineHeight: 1,
  } satisfies CSSProperties,
} as const;

const buttonTones = {
  primary: {
    surfaceDefault: surface.accent,
    surfaceHover: surface.accentHover,
    surfaceActive: surface.accentActive,
    surfaceDisabled: surface.insetDisabled,
    borderDefault: border.accent,
    borderHover: border.accent,
    borderActive: border.accent,
    borderDisabled: border.disabled,
    textDefault: text.inverse,
    textDisabled: text.disabled,
  },
  primaryNeutral: {
    surfaceDefault: surface.accentNeutral,
    surfaceHover: surface.accentNeutralHover,
    surfaceActive: surface.accentNeutralActive,
    surfaceDisabled: surface.insetDisabled,
    borderDefault: border.accentNeutral,
    borderHover: border.accentNeutral,
    borderActive: border.accentNeutral,
    borderDisabled: border.disabled,
    textDefault: text.onAccentNeutral,
    textDisabled: text.disabled,
  },
  secondary: {
    surfaceDefault: surface.inset,
    surfaceHover: surface.insetHover,
    surfaceActive: surface.insetActive,
    surfaceDisabled: surface.insetDisabled,
    borderDefault: border.default,
    borderHover: border.hover,
    borderActive: border.hover,
    borderDisabled: border.disabled,
    textDefault: text.secondary,
    textDisabled: text.disabled,
  },
  danger: {
    surfaceDefault: surface.danger,
    surfaceHover: surface.dangerHover,
    surfaceActive: surface.dangerActive,
    surfaceDisabled: surface.dangerDisabled,
    borderDefault: border.danger,
    borderHover: border.danger,
    borderActive: border.danger,
    borderDisabled: border.disabled,
    textDefault: text.danger,
    textDisabled: text.disabled,
  },
} satisfies Record<string, ButtonVariantTone>;

function createButtonRecipe(
  size:
    | (typeof controlScale)["default"]
    | (typeof controlScale)["small"]
    | typeof compactButtonScale,
  tone: ButtonVariantTone,
  debug: DesignSystemDebugMeta
): ButtonRecipe {
  return {
    className: "ui-button",
    style: {
      ...size.bodyText,
      minHeight: size.height,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: size.contentGap,
      padding: `${size.paddingY}px ${size.paddingX}px`,
      borderRadius: radius.control,
      border: `1px solid ${tone.borderDefault}`,
      background: tone.surfaceDefault,
      color: tone.textDefault,
      cursor: "pointer",
      textAlign: "center",
      textDecoration: "none",
      "--ui-button-surface-hover": tone.surfaceHover,
      "--ui-button-surface-active": tone.surfaceActive,
      "--ui-button-surface-disabled": tone.surfaceDisabled,
      "--ui-button-border-hover": tone.borderHover,
      "--ui-button-border-active": tone.borderActive,
      "--ui-button-border-disabled": tone.borderDisabled,
      "--ui-button-text-disabled": tone.textDisabled,
    } as CSSVariableProperties,
    debug,
  };
}

function createInteractionButtonRecipe(
  tone: ButtonVariantTone,
  shape: "pill" | "circle",
  debug: DesignSystemDebugMeta
): ButtonRecipe {
  return {
    className: "ui-button",
    style: {
      ...controlScale.small.bodyText,
      minHeight: controlScale.small.height,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: controlScale.small.contentGap,
      padding:
        shape === "circle"
          ? `${controlScale.small.paddingY}px 0`
          : `${controlScale.small.paddingY}px ${controlScale.small.paddingX * 1.5}px`,
      minWidth: shape === "circle" ? controlScale.small.height : undefined,
      borderRadius: radius.pill,
      border: `1px solid ${tone.borderDefault}`,
      background: tone.surfaceDefault,
      color: tone.textDefault,
      cursor: "pointer",
      textAlign: "center",
      textDecoration: "none",
      "--ui-button-surface-hover": tone.surfaceHover,
      "--ui-button-surface-active": tone.surfaceActive,
      "--ui-button-surface-disabled": tone.surfaceDisabled,
      "--ui-button-border-hover": tone.borderHover,
      "--ui-button-border-active": tone.borderActive,
      "--ui-button-border-disabled": tone.borderDisabled,
      "--ui-button-text-disabled": tone.textDisabled,
    } as CSSVariableProperties,
    debug,
  };
}

export const buttonRecipes = {
  primary: {
    default: createButtonRecipe(controlScale.default, buttonTones.primary, {
      family: "button",
      variant: "primary",
      size: "default",
    }),
    small: createButtonRecipe(controlScale.small, buttonTones.primary, {
      family: "button",
      variant: "primary",
      size: "small",
    }),
    compact: createButtonRecipe(compactButtonScale, buttonTones.primary, {
      family: "button",
      variant: "primary",
      size: "compact",
    }),
  },
  primaryNeutral: {
    default: createButtonRecipe(controlScale.default, buttonTones.primaryNeutral, {
      family: "button",
      variant: "primaryNeutral",
      size: "default",
    }),
    small: createButtonRecipe(controlScale.small, buttonTones.primaryNeutral, {
      family: "button",
      variant: "primaryNeutral",
      size: "small",
    }),
    compact: createButtonRecipe(compactButtonScale, buttonTones.primaryNeutral, {
      family: "button",
      variant: "primaryNeutral",
      size: "compact",
    }),
  },
  secondary: {
    default: createButtonRecipe(controlScale.default, buttonTones.secondary, {
      family: "button",
      variant: "secondary",
      size: "default",
    }),
    small: createButtonRecipe(controlScale.small, buttonTones.secondary, {
      family: "button",
      variant: "secondary",
      size: "small",
    }),
    compact: createButtonRecipe(compactButtonScale, buttonTones.secondary, {
      family: "button",
      variant: "secondary",
      size: "compact",
    }),
  },
  danger: {
    default: createButtonRecipe(controlScale.default, buttonTones.danger, {
      family: "button",
      variant: "danger",
      size: "default",
    }),
    small: createButtonRecipe(controlScale.small, buttonTones.danger, {
      family: "button",
      variant: "danger",
      size: "small",
    }),
    compact: createButtonRecipe(compactButtonScale, buttonTones.danger, {
      family: "button",
      variant: "danger",
      size: "compact",
    }),
  },
} as const;

export const interactionButtonRecipes = {
  primary: {
    pill: createInteractionButtonRecipe(buttonTones.primaryNeutral, "pill", {
      family: "interactionButton",
      variant: "primary",
      size: "small",
      subtype: "pill",
    }),
    circle: createInteractionButtonRecipe(buttonTones.primaryNeutral, "circle", {
      family: "interactionButton",
      variant: "primary",
      size: "small",
      subtype: "circle",
    }),
  },
  secondary: {
    pill: createInteractionButtonRecipe(buttonTones.secondary, "pill", {
      family: "interactionButton",
      variant: "secondary",
      size: "small",
      subtype: "pill",
    }),
    circle: createInteractionButtonRecipe(buttonTones.secondary, "circle", {
      family: "interactionButton",
      variant: "secondary",
      size: "small",
      subtype: "circle",
    }),
  },
  danger: {
    pill: createInteractionButtonRecipe(buttonTones.danger, "pill", {
      family: "interactionButton",
      variant: "danger",
      size: "small",
      subtype: "pill",
    }),
    circle: createInteractionButtonRecipe(buttonTones.danger, "circle", {
      family: "interactionButton",
      variant: "danger",
      size: "small",
      subtype: "circle",
    }),
  },
} as const;

export function withButtonToneOverride(
  recipe: ButtonRecipe,
  override: ButtonToneOverride,
  subtype?: string
): ButtonRecipe {
  const baseStyle = recipe.style as CSSVariableProperties;

  return {
    className: recipe.className,
    style: {
      ...baseStyle,
      ...(override.borderDefault ? { border: `1px solid ${override.borderDefault}` } : null),
      ...(override.surfaceDefault ? { background: override.surfaceDefault } : null),
      ...(override.textDefault ? { color: override.textDefault } : null),
      ...(override.surfaceHover
        ? { "--ui-button-surface-hover": override.surfaceHover }
        : null),
      ...(override.surfaceActive
        ? { "--ui-button-surface-active": override.surfaceActive }
        : null),
      ...(override.surfaceDisabled
        ? { "--ui-button-surface-disabled": override.surfaceDisabled }
        : null),
      ...(override.borderHover
        ? { "--ui-button-border-hover": override.borderHover }
        : null),
      ...(override.borderActive
        ? { "--ui-button-border-active": override.borderActive }
        : null),
      ...(override.borderDisabled
        ? { "--ui-button-border-disabled": override.borderDisabled }
        : null),
      ...(override.textDisabled
        ? { "--ui-button-text-disabled": override.textDisabled }
        : null),
    } as CSSVariableProperties,
    debug: {
      ...recipe.debug,
      subtype: subtype ?? recipe.debug.subtype,
    },
  };
}

export function createParticipantAccentButtonRecipe(recipe: ButtonRecipe, accent: string) {
  return createParticipantAccentButtonRecipeWithMode(recipe, accent, "border");
}

export function createParticipantAccentButtonRecipeWithMode(
  recipe: ButtonRecipe,
  accent: string,
  mode: ParticipantAccentMode
) {
  if (mode === "fill") {
    return withButtonToneOverride(recipe, {
      surfaceDefault: accent,
      surfaceHover: accent,
      surfaceActive: accent,
      borderDefault: accent,
      borderHover: accent,
      borderActive: accent,
      textDefault: text.inverse,
    }, "participantAccent");
  }

  return withButtonToneOverride(recipe, {
    borderDefault: accent,
    borderHover: accent,
    borderActive: accent,
  }, "participantAccent");
}

export function createToggleButtonRecipe(recipe: ButtonRecipe, isOn: boolean) {
  return withButtonToneOverride(recipe, {
    surfaceDefault: isOn ? "#334155" : "#1e293b",
    surfaceHover: isOn ? "#334155" : "#1e293b",
    surfaceActive: isOn ? "#334155" : "#1e293b",
    textDefault: text.primary,
  }, "toggle");
}

export function createTextButtonRecipe(
  recipe: ButtonRecipe,
  tone: "muted" | "secondary" | "danger" = "muted"
) {
  const textColor =
    tone === "danger"
      ? text.danger
      : tone === "secondary"
        ? text.secondary
        : text.muted;

  return withButtonToneOverride(recipe, {
    surfaceDefault: "transparent",
    surfaceHover: "transparent",
    surfaceActive: "transparent",
    surfaceDisabled: "transparent",
    borderDefault: "transparent",
    borderHover: "transparent",
    borderActive: "transparent",
    borderDisabled: "transparent",
    textDefault: textColor,
  }, "text");
}

function resolveCssValue(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmedValue = value.trim();

  if (!trimmedValue.startsWith("var(") || typeof window === "undefined") {
    return trimmedValue;
  }

  const tokenName = trimmedValue.slice(4, -1).trim();

  if (!tokenName.startsWith("--")) {
    return trimmedValue;
  }

  return window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(tokenName)
    .trim() || trimmedValue;
}

function resolveNumberValue(value: unknown, fallback: number) {
  if (typeof value === "number") {
    return value;
  }

  const resolved = resolveCssValue(value);
  const parsed = Number.parseFloat(resolved);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolvePaddingXValue(value: unknown, fallback: number) {
  if (typeof value !== "string") {
    return fallback;
  }

  const parts = value.trim().split(/\s+/);

  if (parts.length < 2) {
    return fallback;
  }

  const parsed = Number.parseFloat(parts[1]);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export function resolveCanvasButtonTone(recipe: ButtonRecipe): CanvasButtonTone {
  const style = recipe.style as CSSVariableProperties;
  const borderValue = typeof style.border === "string" ? style.border : "";
  const strokeValue = borderValue.split(" ").at(-1) ?? "";

  return {
    fill: resolveCssValue(style.background),
    stroke: resolveCssValue(strokeValue),
    textColor: resolveCssValue(style.color),
  };
}

export function resolveCanvasButtonMetrics(recipe: ButtonRecipe): CanvasButtonMetrics {
  const style = recipe.style as CSSVariableProperties;

  return {
    minHeight: resolveNumberValue(style.minHeight, 32),
    minWidth:
      style.minWidth === undefined ? undefined : resolveNumberValue(style.minWidth, 0),
    paddingX: resolvePaddingXValue(style.padding, 8),
    borderRadius: resolveNumberValue(style.borderRadius, 8),
    fontSize: resolveNumberValue(style.fontSize, 12),
    fontWeight:
      typeof style.fontWeight === "number" || typeof style.fontWeight === "string"
        ? style.fontWeight
        : 400,
    fontFamily:
      typeof style.fontFamily === "string" ? style.fontFamily : "sans-serif",
    lineHeight:
      typeof style.lineHeight === "number"
        ? style.lineHeight
        : resolveNumberValue(style.lineHeight, 1),
  };
}
