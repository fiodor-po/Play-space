import type { CSSProperties } from "react";
import type { DesignSystemDebugMeta } from "../debugMeta";
import {
  DRAFT_LOCAL_USER_SOURCE_SLOT,
  getParticipantColorTokenSet,
  localUserButton,
  radius,
  type ParticipantColorSlotNumber,
} from "../foundations";
import { controlScale } from "../controlScale";
import { uiTextStyleSmall } from "../typography";

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string | number>;

export type ButtonRecipe = {
  className: string;
  style: CSSProperties;
  debug: DesignSystemDebugMeta;
};

export type ButtonState = {
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  open?: boolean;
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
  surfaceSelected?: string;
  surfaceSelectedHover?: string;
  surfaceSelectedActive?: string;
  surfaceOpen?: string;
  surfaceOpenHover?: string;
  surfaceOpenActive?: string;
  surfaceLoading?: string;
  borderDefault?: string;
  borderHover?: string;
  borderActive?: string;
  borderDisabled?: string;
  borderSelected?: string;
  borderSelectedHover?: string;
  borderSelectedActive?: string;
  borderOpen?: string;
  borderOpenHover?: string;
  borderOpenActive?: string;
  borderLoading?: string;
  textDefault?: string;
  textHover?: string;
  textActive?: string;
  textDisabled?: string;
  textSelected?: string;
  textSelectedHover?: string;
  textSelectedActive?: string;
  textOpen?: string;
  textOpenHover?: string;
  textOpenActive?: string;
  textLoading?: string;
};

type ParticipantAccentMode = "border" | "fill";

type ButtonVariantTone = {
  surfaceDefault: string;
  surfaceHover: string;
  surfaceActive: string;
  surfaceDisabled: string;
  surfaceSelected: string;
  surfaceSelectedHover: string;
  surfaceSelectedActive: string;
  surfaceOpen: string;
  surfaceOpenHover: string;
  surfaceOpenActive: string;
  surfaceLoading: string;
  borderDefault: string;
  borderHover: string;
  borderActive: string;
  borderDisabled: string;
  borderSelected: string;
  borderSelectedHover: string;
  borderSelectedActive: string;
  borderOpen: string;
  borderOpenHover: string;
  borderOpenActive: string;
  borderLoading: string;
  textDefault: string;
  textHover: string;
  textActive: string;
  textDisabled: string;
  textSelected: string;
  textSelectedHover: string;
  textSelectedActive: string;
  textOpen: string;
  textOpenHover: string;
  textOpenActive: string;
  textLoading: string;
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

function createButtonVariantTone(prefix: string): ButtonVariantTone {
  return {
    surfaceDefault: `var(--ui-button-${prefix}-surface-default)`,
    surfaceHover: `var(--ui-button-${prefix}-surface-hover)`,
    surfaceActive: `var(--ui-button-${prefix}-surface-active)`,
    surfaceDisabled: `var(--ui-button-${prefix}-surface-disabled)`,
    surfaceSelected: `var(--ui-button-${prefix}-surface-selected)`,
    surfaceSelectedHover: `var(--ui-button-${prefix}-surface-selected-hover)`,
    surfaceSelectedActive: `var(--ui-button-${prefix}-surface-selected-active)`,
    surfaceOpen: `var(--ui-button-${prefix}-surface-open)`,
    surfaceOpenHover: `var(--ui-button-${prefix}-surface-open-hover)`,
    surfaceOpenActive: `var(--ui-button-${prefix}-surface-open-active)`,
    surfaceLoading: `var(--ui-button-${prefix}-surface-loading)`,
    borderDefault: `var(--ui-button-${prefix}-border-default)`,
    borderHover: `var(--ui-button-${prefix}-border-hover)`,
    borderActive: `var(--ui-button-${prefix}-border-active)`,
    borderDisabled: `var(--ui-button-${prefix}-border-disabled)`,
    borderSelected: `var(--ui-button-${prefix}-border-selected)`,
    borderSelectedHover: `var(--ui-button-${prefix}-border-selected-hover)`,
    borderSelectedActive: `var(--ui-button-${prefix}-border-selected-active)`,
    borderOpen: `var(--ui-button-${prefix}-border-open)`,
    borderOpenHover: `var(--ui-button-${prefix}-border-open-hover)`,
    borderOpenActive: `var(--ui-button-${prefix}-border-open-active)`,
    borderLoading: `var(--ui-button-${prefix}-border-loading)`,
    textDefault: `var(--ui-button-${prefix}-text-default)`,
    textHover: `var(--ui-button-${prefix}-text-hover)`,
    textActive: `var(--ui-button-${prefix}-text-active)`,
    textDisabled: `var(--ui-button-${prefix}-text-disabled)`,
    textSelected: `var(--ui-button-${prefix}-text-selected)`,
    textSelectedHover: `var(--ui-button-${prefix}-text-selected-hover)`,
    textSelectedActive: `var(--ui-button-${prefix}-text-selected-active)`,
    textOpen: `var(--ui-button-${prefix}-text-open)`,
    textOpenHover: `var(--ui-button-${prefix}-text-open-hover)`,
    textOpenActive: `var(--ui-button-${prefix}-text-open-active)`,
    textLoading: `var(--ui-button-${prefix}-text-loading)`,
  };
}

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
      border: "1px solid var(--ui-button-border-current, var(--ui-button-border-default))",
      background:
        "var(--ui-button-surface-current, var(--ui-button-surface-default))",
      color: "var(--ui-button-text-current, var(--ui-button-text-default))",
      cursor: "pointer",
      textAlign: "center",
      textDecoration: "none",
      "--ui-button-surface-default": tone.surfaceDefault,
      "--ui-button-surface-hover": tone.surfaceHover,
      "--ui-button-surface-active": tone.surfaceActive,
      "--ui-button-surface-disabled": tone.surfaceDisabled,
      "--ui-button-surface-selected": tone.surfaceSelected,
      "--ui-button-surface-selected-hover": tone.surfaceSelectedHover,
      "--ui-button-surface-selected-active": tone.surfaceSelectedActive,
      "--ui-button-surface-open": tone.surfaceOpen,
      "--ui-button-surface-open-hover": tone.surfaceOpenHover,
      "--ui-button-surface-open-active": tone.surfaceOpenActive,
      "--ui-button-surface-loading": tone.surfaceLoading,
      "--ui-button-border-default": tone.borderDefault,
      "--ui-button-border-hover": tone.borderHover,
      "--ui-button-border-active": tone.borderActive,
      "--ui-button-border-disabled": tone.borderDisabled,
      "--ui-button-border-selected": tone.borderSelected,
      "--ui-button-border-selected-hover": tone.borderSelectedHover,
      "--ui-button-border-selected-active": tone.borderSelectedActive,
      "--ui-button-border-open": tone.borderOpen,
      "--ui-button-border-open-hover": tone.borderOpenHover,
      "--ui-button-border-open-active": tone.borderOpenActive,
      "--ui-button-border-loading": tone.borderLoading,
      "--ui-button-text-default": tone.textDefault,
      "--ui-button-text-hover": tone.textHover,
      "--ui-button-text-active": tone.textActive,
      "--ui-button-text-selected": tone.textSelected,
      "--ui-button-text-selected-hover": tone.textSelectedHover,
      "--ui-button-text-selected-active": tone.textSelectedActive,
      "--ui-button-text-open": tone.textOpen,
      "--ui-button-text-open-hover": tone.textOpenHover,
      "--ui-button-text-open-active": tone.textOpenActive,
      "--ui-button-text-loading": tone.textLoading,
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
      border: "1px solid var(--ui-button-border-current, var(--ui-button-border-default))",
      background:
        "var(--ui-button-surface-current, var(--ui-button-surface-default))",
      color: "var(--ui-button-text-current, var(--ui-button-text-default))",
      cursor: "pointer",
      textAlign: "center",
      textDecoration: "none",
      "--ui-button-surface-default": tone.surfaceDefault,
      "--ui-button-surface-hover": tone.surfaceHover,
      "--ui-button-surface-active": tone.surfaceActive,
      "--ui-button-surface-disabled": tone.surfaceDisabled,
      "--ui-button-surface-selected": tone.surfaceSelected,
      "--ui-button-surface-selected-hover": tone.surfaceSelectedHover,
      "--ui-button-surface-selected-active": tone.surfaceSelectedActive,
      "--ui-button-surface-open": tone.surfaceOpen,
      "--ui-button-surface-open-hover": tone.surfaceOpenHover,
      "--ui-button-surface-open-active": tone.surfaceOpenActive,
      "--ui-button-surface-loading": tone.surfaceLoading,
      "--ui-button-border-default": tone.borderDefault,
      "--ui-button-border-hover": tone.borderHover,
      "--ui-button-border-active": tone.borderActive,
      "--ui-button-border-disabled": tone.borderDisabled,
      "--ui-button-border-selected": tone.borderSelected,
      "--ui-button-border-selected-hover": tone.borderSelectedHover,
      "--ui-button-border-selected-active": tone.borderSelectedActive,
      "--ui-button-border-open": tone.borderOpen,
      "--ui-button-border-open-hover": tone.borderOpenHover,
      "--ui-button-border-open-active": tone.borderOpenActive,
      "--ui-button-border-loading": tone.borderLoading,
      "--ui-button-text-default": tone.textDefault,
      "--ui-button-text-hover": tone.textHover,
      "--ui-button-text-active": tone.textActive,
      "--ui-button-text-selected": tone.textSelected,
      "--ui-button-text-selected-hover": tone.textSelectedHover,
      "--ui-button-text-selected-active": tone.textSelectedActive,
      "--ui-button-text-open": tone.textOpen,
      "--ui-button-text-open-hover": tone.textOpenHover,
      "--ui-button-text-open-active": tone.textOpenActive,
      "--ui-button-text-loading": tone.textLoading,
      "--ui-button-text-disabled": tone.textDisabled,
    } as CSSVariableProperties,
    debug,
  };
}

export const buttonRecipes = {
  primary: {
    default: createButtonRecipe(controlScale.default, createButtonVariantTone("primary"), {
      family: "button",
      variant: "primary",
      size: "default",
    }),
    small: createButtonRecipe(controlScale.small, createButtonVariantTone("primary"), {
      family: "button",
      variant: "primary",
      size: "small",
    }),
    compact: createButtonRecipe(compactButtonScale, createButtonVariantTone("primary"), {
      family: "button",
      variant: "primary",
      size: "compact",
    }),
  },
  primaryNeutral: {
    default: createButtonRecipe(controlScale.default, createButtonVariantTone("primary-neutral"), {
      family: "button",
      variant: "primaryNeutral",
      size: "default",
    }),
    small: createButtonRecipe(controlScale.small, createButtonVariantTone("primary-neutral"), {
      family: "button",
      variant: "primaryNeutral",
      size: "small",
    }),
    compact: createButtonRecipe(compactButtonScale, createButtonVariantTone("primary-neutral"), {
      family: "button",
      variant: "primaryNeutral",
      size: "compact",
    }),
  },
  secondary: {
    default: createButtonRecipe(controlScale.default, createButtonVariantTone("secondary"), {
      family: "button",
      variant: "secondary",
      size: "default",
    }),
    small: createButtonRecipe(controlScale.small, createButtonVariantTone("secondary"), {
      family: "button",
      variant: "secondary",
      size: "small",
    }),
    compact: createButtonRecipe(compactButtonScale, createButtonVariantTone("secondary"), {
      family: "button",
      variant: "secondary",
      size: "compact",
    }),
  },
  danger: {
    default: createButtonRecipe(controlScale.default, createButtonVariantTone("danger"), {
      family: "button",
      variant: "danger",
      size: "default",
    }),
    small: createButtonRecipe(controlScale.small, createButtonVariantTone("danger"), {
      family: "button",
      variant: "danger",
      size: "small",
    }),
    compact: createButtonRecipe(compactButtonScale, createButtonVariantTone("danger"), {
      family: "button",
      variant: "danger",
      size: "compact",
    }),
  },
} as const;

export const interactionButtonRecipes = {
  primary: {
    pill: createInteractionButtonRecipe(createButtonVariantTone("primary-neutral"), "pill", {
      family: "interactionButton",
      variant: "primary",
      size: "small",
      subtype: "pill",
    }),
    circle: createInteractionButtonRecipe(createButtonVariantTone("primary-neutral"), "circle", {
      family: "interactionButton",
      variant: "primary",
      size: "small",
      subtype: "circle",
    }),
  },
  secondary: {
    pill: createInteractionButtonRecipe(createButtonVariantTone("secondary"), "pill", {
      family: "interactionButton",
      variant: "secondary",
      size: "small",
      subtype: "pill",
    }),
    circle: createInteractionButtonRecipe(createButtonVariantTone("secondary"), "circle", {
      family: "interactionButton",
      variant: "secondary",
      size: "small",
      subtype: "circle",
    }),
  },
  danger: {
    pill: createInteractionButtonRecipe(createButtonVariantTone("danger"), "pill", {
      family: "interactionButton",
      variant: "danger",
      size: "small",
      subtype: "pill",
    }),
    circle: createInteractionButtonRecipe(createButtonVariantTone("danger"), "circle", {
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
      ...(override.borderDefault
        ? {
            "--ui-button-border-default": override.borderDefault,
          }
        : null),
      ...(override.surfaceDefault
        ? {
            "--ui-button-surface-default": override.surfaceDefault,
          }
        : null),
      ...(override.textDefault
        ? {
            "--ui-button-text-default": override.textDefault,
          }
        : null),
      ...(override.textHover
        ? {
            "--ui-button-text-hover": override.textHover,
          }
        : null),
      ...(override.textActive
        ? {
            "--ui-button-text-active": override.textActive,
          }
        : null),
      ...(override.surfaceHover
        ? { "--ui-button-surface-hover": override.surfaceHover }
        : null),
      ...(override.surfaceActive
        ? { "--ui-button-surface-active": override.surfaceActive }
        : null),
      ...(override.surfaceDisabled
        ? { "--ui-button-surface-disabled": override.surfaceDisabled }
        : null),
      ...(override.surfaceSelected
        ? { "--ui-button-surface-selected": override.surfaceSelected }
        : null),
      ...(override.surfaceSelectedHover
        ? { "--ui-button-surface-selected-hover": override.surfaceSelectedHover }
        : null),
      ...(override.surfaceSelectedActive
        ? { "--ui-button-surface-selected-active": override.surfaceSelectedActive }
        : null),
      ...(override.surfaceOpen
        ? { "--ui-button-surface-open": override.surfaceOpen }
        : null),
      ...(override.surfaceOpenHover
        ? { "--ui-button-surface-open-hover": override.surfaceOpenHover }
        : null),
      ...(override.surfaceOpenActive
        ? { "--ui-button-surface-open-active": override.surfaceOpenActive }
        : null),
      ...(override.surfaceLoading
        ? { "--ui-button-surface-loading": override.surfaceLoading }
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
      ...(override.borderSelected
        ? { "--ui-button-border-selected": override.borderSelected }
        : null),
      ...(override.borderSelectedHover
        ? { "--ui-button-border-selected-hover": override.borderSelectedHover }
        : null),
      ...(override.borderSelectedActive
        ? { "--ui-button-border-selected-active": override.borderSelectedActive }
        : null),
      ...(override.borderOpen
        ? { "--ui-button-border-open": override.borderOpen }
        : null),
      ...(override.borderOpenHover
        ? { "--ui-button-border-open-hover": override.borderOpenHover }
        : null),
      ...(override.borderOpenActive
        ? { "--ui-button-border-open-active": override.borderOpenActive }
        : null),
      ...(override.borderLoading
        ? { "--ui-button-border-loading": override.borderLoading }
        : null),
      ...(override.textSelected
        ? { "--ui-button-text-selected": override.textSelected }
        : null),
      ...(override.textSelectedHover
        ? { "--ui-button-text-selected-hover": override.textSelectedHover }
        : null),
      ...(override.textSelectedActive
        ? { "--ui-button-text-selected-active": override.textSelectedActive }
        : null),
      ...(override.textOpen
        ? { "--ui-button-text-open": override.textOpen }
        : null),
      ...(override.textOpenHover
        ? { "--ui-button-text-open-hover": override.textOpenHover }
        : null),
      ...(override.textOpenActive
        ? { "--ui-button-text-open-active": override.textOpenActive }
        : null),
      ...(override.textLoading
        ? { "--ui-button-text-loading": override.textLoading }
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

export function createDraftLocalUserButtonRecipeWithMode(
  recipe: ButtonRecipe,
  mode: ParticipantAccentMode
) {
  return createDraftLocalUserButtonRecipeForSlot(recipe, DRAFT_LOCAL_USER_SOURCE_SLOT, mode);
}

export function createDraftLocalUserButtonRecipeForSlot(
  recipe: ButtonRecipe,
  slot: ParticipantColorSlotNumber,
  mode: ParticipantAccentMode
) {
  const slotTokens = getParticipantColorTokenSet(slot);

  if (mode === "fill") {
    return withButtonToneOverride(recipe, {
      surfaceDefault: slotTokens.surface.default,
      surfaceHover: slotTokens.surface.hover,
      surfaceActive: slotTokens.surface.active,
      surfaceDisabled: localUserButton.surface.disabled,
      surfaceSelected: slotTokens.surface.active,
      surfaceSelectedHover: slotTokens.surface.active,
      surfaceSelectedActive: slotTokens.surface.active,
      surfaceOpen: slotTokens.surface.hover,
      surfaceOpenHover: slotTokens.surface.active,
      surfaceOpenActive: slotTokens.surface.active,
      surfaceLoading: slotTokens.surface.active,
      borderDefault: slotTokens.border.default,
      borderHover: slotTokens.border.default,
      borderActive: slotTokens.border.default,
      borderDisabled: localUserButton.border.disabled,
      borderSelected: slotTokens.border.default,
      borderSelectedHover: slotTokens.border.default,
      borderSelectedActive: slotTokens.border.default,
      borderOpen: slotTokens.border.default,
      borderOpenHover: slotTokens.border.default,
      borderOpenActive: slotTokens.border.default,
      borderLoading: slotTokens.border.default,
      textDefault: slotTokens.text.default,
      textHover: slotTokens.text.default,
      textActive: slotTokens.text.default,
      textDisabled: localUserButton.text.disabled,
      textSelected: slotTokens.text.default,
      textSelectedHover: slotTokens.text.default,
      textSelectedActive: slotTokens.text.default,
      textOpen: slotTokens.text.default,
      textOpenHover: slotTokens.text.default,
      textOpenActive: slotTokens.text.default,
      textLoading: slotTokens.text.default,
    }, "localUser");
  }

  return withButtonToneOverride(recipe, {
    borderDefault: slotTokens.border.default,
    borderHover: slotTokens.border.default,
    borderActive: slotTokens.border.default,
    borderDisabled: localUserButton.border.disabled,
    borderSelected: slotTokens.border.default,
    borderSelectedHover: slotTokens.border.default,
    borderSelectedActive: slotTokens.border.default,
    borderOpen: slotTokens.border.default,
    borderOpenHover: slotTokens.border.default,
    borderOpenActive: slotTokens.border.default,
    borderLoading: slotTokens.border.default,
  }, "localUser");
}

export function createToggleButtonRecipe(recipe: ButtonRecipe) {
  return withButtonToneOverride(recipe, {
    surfaceDefault: "var(--ui-button-toggle-surface-default)",
    surfaceHover: "var(--ui-button-toggle-surface-hover)",
    surfaceActive: "var(--ui-button-toggle-surface-active)",
    surfaceDisabled: "var(--ui-button-toggle-surface-disabled)",
    surfaceSelected: "var(--ui-button-toggle-surface-selected)",
    surfaceSelectedHover: "var(--ui-button-toggle-surface-selected-hover)",
    surfaceSelectedActive: "var(--ui-button-toggle-surface-selected-active)",
    surfaceLoading: "var(--ui-button-toggle-surface-loading)",
    borderDefault: "var(--ui-button-toggle-border-default)",
    borderHover: "var(--ui-button-toggle-border-hover)",
    borderActive: "var(--ui-button-toggle-border-active)",
    borderDisabled: "var(--ui-button-toggle-border-disabled)",
    borderSelected: "var(--ui-button-toggle-border-selected)",
    borderSelectedHover: "var(--ui-button-toggle-border-selected-hover)",
    borderSelectedActive: "var(--ui-button-toggle-border-selected-active)",
    borderLoading: "var(--ui-button-toggle-border-loading)",
    textDefault: "var(--ui-button-toggle-text-default)",
    textHover: "var(--ui-button-toggle-text-hover)",
    textActive: "var(--ui-button-toggle-text-active)",
    textDisabled: "var(--ui-button-toggle-text-disabled)",
    textSelected: "var(--ui-button-toggle-text-selected)",
    textSelectedHover: "var(--ui-button-toggle-text-selected-hover)",
    textSelectedActive: "var(--ui-button-toggle-text-selected-active)",
    textLoading: "var(--ui-button-toggle-text-loading)",
  }, "toggle");
}

export function createTextButtonRecipe(
  recipe: ButtonRecipe,
  tone: "muted" | "secondary" | "danger" = "muted"
) {
  return withButtonToneOverride(recipe, {
    surfaceDefault: "transparent",
    surfaceHover: "transparent",
    surfaceActive: "transparent",
    surfaceDisabled: "transparent",
    surfaceSelected: "transparent",
    surfaceSelectedHover: "transparent",
    surfaceSelectedActive: "transparent",
    surfaceOpen: "transparent",
    surfaceOpenHover: "transparent",
    surfaceOpenActive: "transparent",
    surfaceLoading: "transparent",
    borderDefault: "transparent",
    borderHover: "transparent",
    borderActive: "transparent",
    borderDisabled: "transparent",
    borderSelected: "transparent",
    borderSelectedHover: "transparent",
    borderSelectedActive: "transparent",
    borderOpen: "transparent",
    borderOpenHover: "transparent",
    borderOpenActive: "transparent",
    borderLoading: "transparent",
    textDefault:
      tone === "danger"
        ? "var(--ui-button-text-danger-color)"
        : tone === "secondary"
          ? "var(--ui-button-text-secondary-color)"
          : "var(--ui-button-text-muted-color)",
    textHover:
      tone === "danger"
        ? "var(--ui-button-text-danger-color)"
        : tone === "secondary"
          ? "var(--ui-button-text-secondary-color)"
          : "var(--ui-button-text-muted-color)",
    textActive:
      tone === "danger"
        ? "var(--ui-button-text-danger-color)"
        : tone === "secondary"
          ? "var(--ui-button-text-secondary-color)"
          : "var(--ui-button-text-muted-color)",
    textSelected:
      tone === "danger"
        ? "var(--ui-button-text-danger-color)"
        : tone === "secondary"
          ? "var(--ui-button-text-secondary-color)"
          : "var(--ui-button-text-muted-color)",
    textSelectedHover:
      tone === "danger"
        ? "var(--ui-button-text-danger-color)"
        : tone === "secondary"
          ? "var(--ui-button-text-secondary-color)"
          : "var(--ui-button-text-muted-color)",
    textSelectedActive:
      tone === "danger"
        ? "var(--ui-button-text-danger-color)"
        : tone === "secondary"
          ? "var(--ui-button-text-secondary-color)"
          : "var(--ui-button-text-muted-color)",
    textOpen:
      tone === "danger"
        ? "var(--ui-button-text-danger-color)"
        : tone === "secondary"
          ? "var(--ui-button-text-secondary-color)"
          : "var(--ui-button-text-muted-color)",
    textOpenHover:
      tone === "danger"
        ? "var(--ui-button-text-danger-color)"
        : tone === "secondary"
          ? "var(--ui-button-text-secondary-color)"
          : "var(--ui-button-text-muted-color)",
    textOpenActive:
      tone === "danger"
        ? "var(--ui-button-text-danger-color)"
        : tone === "secondary"
          ? "var(--ui-button-text-secondary-color)"
          : "var(--ui-button-text-muted-color)",
    textLoading:
      tone === "danger"
        ? "var(--ui-button-text-danger-color)"
        : tone === "secondary"
          ? "var(--ui-button-text-secondary-color)"
          : "var(--ui-button-text-muted-color)",
  }, "text");
}

export function getButtonProps(recipe: ButtonRecipe, state: ButtonState = {}) {
  return {
    className: recipe.className,
    style: recipe.style,
    disabled: state.disabled || state.loading || undefined,
    "aria-busy": state.loading ? "true" : undefined,
    "data-ui-loading": state.loading ? "true" : undefined,
    "data-ui-selected": state.selected ? "true" : undefined,
    "data-ui-open": state.open ? "true" : undefined,
  } as const;
}

function resolveCssValue(value: unknown, scopeElement?: Element | null) {
  if (typeof value !== "string") {
    return "";
  }

  let resolvedValue = value.trim();

  if (typeof window === "undefined") {
    return resolvedValue;
  }

  const computedStyle = window.getComputedStyle(scopeElement ?? document.documentElement);

  for (let depth = 0; depth < 8 && resolvedValue.startsWith("var("); depth += 1) {
    const tokenReference = resolvedValue.slice(4, -1).trim();
    const tokenName = tokenReference.split(",", 1)[0]?.trim() ?? "";

    if (!tokenName.startsWith("--")) {
      return resolvedValue;
    }

    const nextValue = computedStyle.getPropertyValue(tokenName).trim();

    if (!nextValue || nextValue === resolvedValue) {
      return resolvedValue;
    }

    resolvedValue = nextValue;
  }

  return resolvedValue;
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

export function resolveCanvasButtonTone(
  recipe: ButtonRecipe,
  state: Pick<ButtonState, "disabled" | "selected" | "open"> & {
    hover?: boolean;
    active?: boolean;
  } = {},
  scopeElement?: Element | null
): CanvasButtonTone {
  const style = recipe.style as CSSVariableProperties;
  const borderValue =
    state.disabled
      ? style["--ui-button-border-disabled"]
      : state.selected && state.active
        ? style["--ui-button-border-selected-active"]
        : state.selected && state.hover
          ? style["--ui-button-border-selected-hover"]
          : state.selected
            ? style["--ui-button-border-selected"]
            : state.open && state.active
              ? style["--ui-button-border-open-active"]
              : state.open && state.hover
                ? style["--ui-button-border-open-hover"]
                : state.open
                  ? style["--ui-button-border-open"]
                  : state.active
                    ? style["--ui-button-border-active"]
                    : state.hover
                      ? style["--ui-button-border-hover"]
                      : style["--ui-button-border-default"];
  const fillValue =
    state.disabled
      ? style["--ui-button-surface-disabled"]
      : state.selected && state.active
        ? style["--ui-button-surface-selected-active"]
        : state.selected && state.hover
          ? style["--ui-button-surface-selected-hover"]
          : state.selected
            ? style["--ui-button-surface-selected"]
            : state.open && state.active
              ? style["--ui-button-surface-open-active"]
              : state.open && state.hover
                ? style["--ui-button-surface-open-hover"]
                : state.open
                  ? style["--ui-button-surface-open"]
                  : state.active
                    ? style["--ui-button-surface-active"]
                    : state.hover
                      ? style["--ui-button-surface-hover"]
                      : style["--ui-button-surface-default"];
  const textValue =
    state.disabled
      ? style["--ui-button-text-disabled"]
      : state.selected && state.active
        ? style["--ui-button-text-selected-active"] ?? style["--ui-button-text-selected"]
        : state.selected && state.hover
          ? style["--ui-button-text-selected-hover"] ?? style["--ui-button-text-selected"]
          : state.selected
            ? style["--ui-button-text-selected"] ?? style["--ui-button-text-default"]
            : state.open && state.active
              ? style["--ui-button-text-open-active"] ?? style["--ui-button-text-open"]
              : state.open && state.hover
                ? style["--ui-button-text-open-hover"] ?? style["--ui-button-text-open"]
                : state.open
                  ? style["--ui-button-text-open"] ?? style["--ui-button-text-default"]
                  : state.active
                    ? style["--ui-button-text-active"] ?? style["--ui-button-text-default"]
                    : state.hover
                      ? style["--ui-button-text-hover"] ?? style["--ui-button-text-default"]
                      : style["--ui-button-text-default"] ?? style.color;

  return {
    fill: resolveCssValue(fillValue, scopeElement),
    stroke: resolveCssValue(borderValue, scopeElement),
    textColor: resolveCssValue(textValue, scopeElement),
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
