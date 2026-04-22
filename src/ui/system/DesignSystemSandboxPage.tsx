import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ReactNode } from "react";
import { HTML_UI_FONT_FAMILY } from "../../board/constants";
import { PARTICIPANT_COLOR_OPTIONS } from "../../lib/roomSession";
import { boardSurfaceRecipes } from "./boardSurfaces";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import { getDesignSystemDebugAttrs } from "./debugMeta";
import { BoardInteractionLayerSandbox } from "./BoardInteractionLayerSandbox";
import { ParticipantAvatarFaceIconList } from "./ParticipantAvatarFaceIconList";
import { contextMenuRecipes } from "./families/contextMenu";
import {
  buttonRecipes,
  createDraftLocalUserButtonRecipeForSlot,
  createTextButtonRecipe,
  createToggleButtonRecipe,
  getButtonProps,
  interactionButtonRecipes,
  resolveCanvasButtonMetrics,
  resolveCanvasButtonTone,
  type ButtonRecipe,
  type ButtonState,
} from "./families/button";
import { fieldRecipes, getFieldShellProps } from "./families/field";
import { getSwatchButtonProps, swatchPillRecipes } from "./families/swatchPill";
import {
  border,
  DRAFT_LOCAL_USER_SOURCE_SLOT,
  focusRing,
  localUserButton,
  participantColor,
  radius,
  radiusPrimitive,
  surface,
  text,
} from "./foundations";
import { inlineTextRecipes } from "./inlineText";
import { surfaceRecipes } from "./surfaces";

type SwatchRecipe =
  | (typeof swatchPillRecipes)["swatch"]["default"]
  | (typeof swatchPillRecipes)["swatch"]["small"]
  | (typeof swatchPillRecipes)["swatch"]["trigger"];

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string | number>;
type InspectNodeId = string;
type InspectRelation = "idle" | "selected" | "upstream" | "downstream" | "unrelated";
type InspectableProps = {
  inspectNodeId?: InspectNodeId;
  inspectRelation?: InspectRelation;
  onInspectSelect?: (nodeId: InspectNodeId) => void;
};

const SandboxInspectContext = createContext<{
  getInspectRelation: (nodeId?: InspectNodeId) => InspectRelation;
  onInspectSelect: (nodeId: InspectNodeId) => void;
}>({
  getInspectRelation: () => "idle",
  onInspectSelect: () => {},
});

const SandboxInspectAggregateContext = createContext<{
  reportChildRelation: (childId: string, relation: InspectRelation) => void;
} | null>(null);

type PreviewButtonState = ButtonState & {
  hover?: boolean;
  active?: boolean;
  focusVisible?: boolean;
};

type PreviewFieldState = {
  hover?: boolean;
  focusVisible?: boolean;
  invalid?: boolean;
  disabled?: boolean;
};

type PreviewSwatchState = {
  participantColorSlot?: number;
  hover?: boolean;
  focusVisible?: boolean;
  selected?: boolean;
  occupied?: boolean;
  pending?: boolean;
  disabled?: boolean;
};

const pageShellStyle: CSSProperties = {
  minHeight: "100vh",
  padding: 24,
  paddingBottom: 48,
  background:
    "radial-gradient(circle at top, #15314b 0%, #081226 48%, #020617 100%)",
};

const pageContentStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1320,
  margin: "0 auto",
  display: "grid",
  gap: 18,
  fontFamily: HTML_UI_FONT_FAMILY,
};

const headerGridStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

const previewGridStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  alignItems: "start",
};

const previewGridStyleFourColumns: CSSProperties = {
  ...previewGridStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
};

const controlStackStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  justifyItems: "start",
};

const sectionHeadingStyle: CSSProperties = {
  fontSize: 18,
  lineHeight: 1.1,
  fontWeight: 700,
  color: text.primary,
};

const sectionDescriptionStyle: CSSProperties = {
  ...inlineTextRecipes.muted.style,
  fontSize: 12,
};

const cardTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: text.primary,
};

const fieldLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: text.muted,
};

const tokenColumnStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

const tokenItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "54px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 10,
  padding: "6px 8px",
  borderRadius: 10,
  border: `1px solid ${border.default}`,
  background: surface.panelSubtle,
};

const tokenChipStyle: CSSProperties = {
  width: 54,
  height: 24,
  borderRadius: 8,
  minWidth: 0,
};

const tokenTextStackStyle: CSSProperties = {
  display: "grid",
  gap: 2,
  minWidth: 0,
};

const tokenNameStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.15,
  fontWeight: 700,
  color: text.primary,
};

const tokenHintStyle: CSSProperties = {
  ...inlineTextRecipes.muted.style,
  fontSize: 11,
  lineHeight: 1.15,
};

const tokenOverrideIndicatorStyle: CSSProperties = {
  display: "grid",
  placeItems: "center",
  minWidth: 34,
  minHeight: 24,
  padding: "0 8px",
  borderRadius: 999,
  border: "1px solid rgba(250, 204, 21, 0.66)",
  background: "rgba(250, 204, 21, 0.18)",
  color: "#fde68a",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.04em",
};

const participantSelectorRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
  gap: 12,
  width: "100%",
  minWidth: 0,
};

const participantSelectorButtonStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr)",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 12,
  border: `1px solid ${border.default}`,
  background: surface.panelSubtle,
  color: text.primary,
  font: "inherit",
  textAlign: "left",
  cursor: "pointer",
};

const participantSelectorSwatchStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  border: `1px solid ${border.default}`,
};

const participantSelectorTextStyle: CSSProperties = {
  display: "grid",
  gap: 3,
  minWidth: 0,
};

const participantSelectorNameStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.15,
  fontWeight: 700,
  color: text.primary,
};

const participantSelectorValueStyle: CSSProperties = {
  ...inlineTextRecipes.muted.style,
  fontSize: 11,
  lineHeight: 1.15,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const tokenOverridePanelStyle: CSSProperties = {
  position: "fixed",
  right: 24,
  bottom: 24,
  width: "min(360px, calc(100vw - 32px))",
  zIndex: 30,
  display: "grid",
  gap: 12,
  padding: 14,
  borderRadius: 16,
  border: `1px solid ${border.default}`,
  background: surface.panel,
  boxShadow: "0 18px 48px rgba(2, 6, 23, 0.42)",
};

const tokenOverridePanelHeaderStyle: CSSProperties = {
  display: "grid",
  gap: 4,
};

const tokenOverridePanelTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: text.primary,
};

const tokenOverridePanelTokenStyle: CSSProperties = {
  ...inlineTextRecipes.muted.style,
  fontSize: 11,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  wordBreak: "break-all",
};

const tokenOverridePanelInputStyle: CSSProperties = {
  width: "100%",
  minHeight: 36,
  padding: "8px 10px",
  borderRadius: 10,
  border: `1px solid ${border.default}`,
  background: surface.inset,
  color: text.primary,
  font: "inherit",
};

const tokenOverridePanelControlsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "52px minmax(0, 1fr)",
  gap: 8,
  alignItems: "center",
};

const tokenOverridePanelActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
  flexWrap: "wrap",
};

const tokenOverridePanelValueGridStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

const tokenOverridePanelValueRowStyle: CSSProperties = {
  display: "grid",
  gap: 4,
};

const tokenOverridePanelValueLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: text.muted,
};

const tokenOverridePanelValueTextStyle: CSSProperties = {
  ...inlineTextRecipes.muted.style,
  minHeight: 18,
  fontSize: 11,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  wordBreak: "break-all",
};

const inspectableContainerBaseStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  borderRadius: 12,
  border: "1px solid transparent",
  padding: 4,
  transition: "opacity 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
};

type TokenInventoryItem = {
  label: string;
  hint: string;
  tokenVar?: string;
  meta: {
    family: string;
    variant: string;
    subtype?: string;
    label: string;
  };
  swatchStyle: CSSProperties;
  swatchContent?: ReactNode;
  unframedSwatch?: boolean;
  swatchContainerStyle?: CSSProperties;
};

type ActiveTokenOverrideEditor = {
  tokenVar: string;
  label: string;
  hint: string;
};

function getTokenVariableName(label: string) {
  const match = label.match(/(--ui-[a-z0-9-]+)/i);
  return match?.[1];
}

function getTokenVariableNameFromReference(reference: string) {
  const match = reference.match(/var\((--ui-[a-z0-9-]+)\)/i);
  return match?.[1];
}

function getLocalUserAliasTokenNodeLabel(
  branch: "surface" | "border" | "text",
  state:
    | "default"
    | "hover"
    | "active"
    | "selected"
    | "selected-hover"
    | "selected-active"
    | "open"
    | "open-hover"
    | "open-active"
    | "loading"
    | "disabled"
) {
  return `token / local-user / ${branch} / ${state} / --ui-button-local-user-${branch}-${state}`;
}

function getParticipantPaletteSlotNodeLabel(slotNumber: number, color: string) {
  return `participantColor / palette / slot-${slotNumber} / ${color}`;
}

function getDraftSlotNumberFromInspectNodeId(nodeId: string) {
  const match = nodeId.match(/^participantColor \/ palette \/ slot-(\d+) \//);
  const nextSlot = match ? Number.parseInt(match[1] ?? "", 10) : Number.NaN;

  if (!Number.isFinite(nextSlot) || nextSlot < 1 || nextSlot > participantColor.length) {
    return null;
  }

  return nextSlot as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

function isColorLikeToken(tokenVar: string) {
  return !(
    tokenVar.includes("opacity") ||
    tokenVar.includes("radius") ||
    tokenVar.includes("space") ||
    tokenVar.includes("transition")
  );
}

function toColorInputValue(value: string) {
  const normalized = value.trim().toLowerCase();

  if (/^#[0-9a-f]{6}$/.test(normalized)) {
    return normalized;
  }

  if (/^#[0-9a-f]{3}$/.test(normalized)) {
    return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
  }

  const rgbMatch = normalized.match(
    /^rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})(?:\s*[,/]\s*[\d.]+)?\s*\)$/
  );

  if (!rgbMatch) {
    return null;
  }

  const toHex = (channel: string) =>
    Math.max(0, Math.min(255, Number(channel))).toString(16).padStart(2, "0");

  return `#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`;
}

function applyColorToDraftValue(currentValue: string, nextHexColor: string) {
  const normalizedHex = nextHexColor.trim().toLowerCase();
  const rgbMatch = normalizedHex.match(/^#([0-9a-f]{6})$/);

  if (!rgbMatch) {
    return normalizedHex;
  }

  const red = Number.parseInt(rgbMatch[1].slice(0, 2), 16);
  const green = Number.parseInt(rgbMatch[1].slice(2, 4), 16);
  const blue = Number.parseInt(rgbMatch[1].slice(4, 6), 16);
  const current = currentValue.trim().toLowerCase();
  const rgbaMatch = current.match(
    /^rgba\(\s*\d{1,3}\s*[,\s]\s*\d{1,3}\s*[,\s]\s*\d{1,3}\s*[,\s/]\s*([\d.]+)\s*\)$/
  );

  if (rgbaMatch) {
    return `rgba(${red}, ${green}, ${blue}, ${rgbaMatch[1]})`;
  }

  return normalizedHex;
}

const tokenOverrideAliases: Record<string, string[]> = {
  "--ui-color-surface-accent": [
    "--ui-button-primary-surface-default",
    "--ui-button-primary-surface-loading",
  ],
  "--ui-color-surface-accent-hover": [
    "--ui-button-primary-surface-hover",
    "--ui-button-primary-surface-open",
  ],
  "--ui-color-surface-accent-active": [
    "--ui-button-primary-surface-active",
    "--ui-button-primary-surface-selected",
    "--ui-button-primary-surface-open-hover",
  ],
  "--ui-color-border-accent": [
    "--ui-button-primary-border-default",
    "--ui-button-primary-border-hover",
    "--ui-button-primary-border-active",
    "--ui-button-primary-border-selected",
    "--ui-button-primary-border-selected-hover",
    "--ui-button-primary-border-selected-active",
    "--ui-button-primary-border-open",
    "--ui-button-primary-border-open-hover",
    "--ui-button-primary-border-open-active",
    "--ui-button-primary-border-loading",
  ],
  "--ui-color-text-inverse": [
    "--ui-button-primary-text-default",
    "--ui-button-primary-text-hover",
    "--ui-button-primary-text-active",
    "--ui-button-primary-text-selected",
    "--ui-button-primary-text-selected-hover",
    "--ui-button-primary-text-selected-active",
    "--ui-button-primary-text-open",
    "--ui-button-primary-text-open-hover",
    "--ui-button-primary-text-open-active",
    "--ui-button-primary-text-loading",
  ],
  "--ui-color-surface-accent-neutral": [
    "--ui-button-primary-neutral-surface-default",
    "--ui-button-primary-neutral-surface-loading",
  ],
  "--ui-color-surface-accent-neutral-hover": [
    "--ui-button-primary-neutral-surface-hover",
    "--ui-button-primary-neutral-surface-open",
  ],
  "--ui-color-surface-accent-neutral-active": [
    "--ui-button-primary-neutral-surface-active",
    "--ui-button-primary-neutral-surface-selected",
    "--ui-button-primary-neutral-surface-open-hover",
  ],
  "--ui-color-border-accent-neutral": [
    "--ui-button-primary-neutral-border-default",
    "--ui-button-primary-neutral-border-hover",
    "--ui-button-primary-neutral-border-active",
    "--ui-button-primary-neutral-border-selected",
    "--ui-button-primary-neutral-border-selected-hover",
    "--ui-button-primary-neutral-border-open",
    "--ui-button-primary-neutral-border-loading",
  ],
  "--ui-color-text-on-accent-neutral": [
    "--ui-button-primary-neutral-text-default",
    "--ui-button-primary-neutral-text-hover",
    "--ui-button-primary-neutral-text-active",
    "--ui-button-primary-neutral-text-selected",
    "--ui-button-primary-neutral-text-selected-hover",
    "--ui-button-primary-neutral-text-selected-active",
    "--ui-button-primary-neutral-text-open",
    "--ui-button-primary-neutral-text-open-hover",
    "--ui-button-primary-neutral-text-open-active",
    "--ui-button-primary-neutral-text-loading",
  ],
  "--ui-color-surface-inset": [
    "--ui-button-secondary-surface-default",
    "--ui-button-secondary-surface-loading",
    "--ui-field-surface-default",
    "--ui-field-surface-error",
  ],
  "--ui-color-surface-inset-hover": [
    "--ui-button-secondary-surface-hover",
    "--ui-button-secondary-surface-open",
    "--ui-field-surface-hover",
  ],
  "--ui-color-surface-inset-active": [
    "--ui-button-secondary-surface-active",
    "--ui-button-secondary-surface-selected",
    "--ui-button-secondary-surface-open-hover",
  ],
  "--ui-color-surface-inset-disabled": [
    "--ui-button-secondary-surface-disabled",
    "--ui-field-surface-disabled",
    "--ui-button-toggle-surface-disabled",
  ],
  "--ui-color-surface-disabled-filled": [
    "--ui-button-primary-surface-disabled",
    "--ui-button-primary-neutral-surface-disabled",
    "--ui-button-local-user-surface-disabled",
  ],
  "--ui-color-border-default": [
    "--ui-button-secondary-border-default",
    "--ui-button-secondary-border-loading",
    "--ui-field-border-default",
    "--ui-button-toggle-border-default",
    "--ui-button-toggle-border-loading",
  ],
  "--ui-color-border-hover": [
    "--ui-button-secondary-border-hover",
    "--ui-button-secondary-border-active",
    "--ui-button-secondary-border-selected",
    "--ui-button-secondary-border-selected-active",
    "--ui-button-secondary-border-open",
    "--ui-button-secondary-border-open-active",
    "--ui-field-border-hover",
    "--ui-button-toggle-border-hover",
    "--ui-button-toggle-border-active",
    "--ui-button-toggle-border-selected-active",
  ],
  "--ui-color-border-focus": [
    "--ui-button-secondary-border-selected-hover",
    "--ui-button-secondary-border-open-hover",
    "--ui-field-border-focus",
    "--ui-button-toggle-border-selected",
    "--ui-button-toggle-border-selected-hover",
  ],
  "--ui-color-border-disabled": [
    "--ui-button-primary-border-disabled",
    "--ui-button-primary-neutral-border-disabled",
    "--ui-button-secondary-border-disabled",
    "--ui-field-border-disabled",
    "--ui-button-toggle-border-disabled",
  ],
  "--ui-color-text-secondary": [
    "--ui-button-secondary-text-default",
    "--ui-button-secondary-text-loading",
    "--ui-button-text-secondary-color",
  ],
  "--ui-color-text-primary": [
    "--ui-button-secondary-text-hover",
    "--ui-button-secondary-text-active",
    "--ui-button-secondary-text-selected",
    "--ui-button-secondary-text-selected-hover",
    "--ui-button-secondary-text-selected-active",
    "--ui-button-secondary-text-open",
    "--ui-button-secondary-text-open-hover",
    "--ui-button-secondary-text-open-active",
    "--ui-field-text-default",
    "--ui-field-text-error",
    "--ui-button-toggle-text-default",
    "--ui-button-toggle-text-hover",
    "--ui-button-toggle-text-active",
    "--ui-button-toggle-text-selected",
    "--ui-button-toggle-text-selected-hover",
    "--ui-button-toggle-text-selected-active",
    "--ui-button-toggle-text-loading",
  ],
  "--ui-color-text-disabled": [
    "--ui-button-primary-text-disabled",
    "--ui-button-primary-neutral-text-disabled",
    "--ui-button-secondary-text-disabled",
    "--ui-field-text-disabled",
    "--ui-button-toggle-text-disabled",
  ],
  "--ui-color-border-danger": [
    "--ui-button-danger-border-default",
    "--ui-button-danger-border-hover",
    "--ui-button-danger-border-active",
    "--ui-button-danger-border-selected",
    "--ui-button-danger-border-selected-hover",
    "--ui-button-danger-border-selected-active",
    "--ui-button-danger-border-open",
    "--ui-button-danger-border-open-hover",
    "--ui-button-danger-border-open-active",
    "--ui-button-danger-border-loading",
    "--ui-field-border-error",
  ],
  "--ui-color-surface-danger": [
    "--ui-button-danger-surface-default",
    "--ui-button-danger-surface-loading",
  ],
  "--ui-color-surface-danger-hover": [
    "--ui-button-danger-surface-hover",
    "--ui-button-danger-surface-open",
  ],
  "--ui-color-surface-danger-active": [
    "--ui-button-danger-surface-active",
    "--ui-button-danger-surface-selected",
    "--ui-button-danger-surface-open-hover",
  ],
  "--ui-color-surface-danger-disabled": [
    "--ui-button-danger-surface-disabled",
  ],
  "--ui-color-text-danger": [
    "--ui-button-danger-text-default",
    "--ui-button-danger-text-hover",
    "--ui-button-danger-text-active",
    "--ui-button-danger-text-selected",
    "--ui-button-danger-text-selected-hover",
    "--ui-button-danger-text-selected-active",
    "--ui-button-danger-text-open",
    "--ui-button-danger-text-open-hover",
    "--ui-button-danger-text-open-active",
    "--ui-button-danger-text-loading",
    "--ui-button-text-danger-color",
  ],
  "--ui-radius-8": [
    "--ui-radius-control",
    "--ui-radius-inset",
  ],
  "--ui-radius-16": [
    "--ui-radius-surface",
  ],
  "--ui-radius-999": [
    "--ui-radius-pill",
  ],
};

const metricSampleStyle: CSSProperties = {
  background: "rgba(255,255,255,0.18)",
  border: `1px solid ${border.hover}`,
};

const radiusMetricShapeStyle: CSSProperties = {
  ...metricSampleStyle,
  width: 54,
  height: 40,
};

const metricTextStyle: CSSProperties = {
  fontSize: 10,
  lineHeight: 1,
  fontWeight: 700,
  color: text.secondary,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const foundationTokenInventory = {
  surface: [
    {
      label: "Panel",
      hint: "base panel surface",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "panel",
        label: "token / foundation / surface / --ui-color-surface-panel",
      },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}` },
    },
    {
      label: "Panel subtle",
      hint: "lighter panel layer",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "panelSubtle",
        label: "token / foundation / surface / --ui-color-surface-panel-subtle",
      },
      swatchStyle: { background: surface.panelSubtle, border: `1px solid ${border.default}` },
    },
    {
      label: "Inset",
      hint: "base inset surface",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "inset",
        label: "token / foundation / surface / --ui-color-surface-inset",
      },
      swatchStyle: { background: surface.inset, border: `1px solid ${border.default}` },
    },
    {
      label: "Inset hover",
      hint: "inset hover layer",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "insetHover",
        label: "token / foundation / surface / --ui-color-surface-inset-hover",
      },
      swatchStyle: { background: surface.insetHover, border: `1px solid ${border.hover}` },
    },
    {
      label: "Inset active",
      hint: "inset active layer",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "insetActive",
        label: "token / foundation / surface / --ui-color-surface-inset-active",
      },
      swatchStyle: { background: surface.insetActive, border: `1px solid ${border.hover}` },
    },
    {
      label: "Inset disabled",
      hint: "inset disabled layer",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "insetDisabled",
        label: "token / foundation / surface / --ui-color-surface-inset-disabled",
      },
      swatchStyle: { background: surface.insetDisabled, border: `1px solid ${border.disabled}` },
    },
    {
      label: "Accent",
      hint: "accent base",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "accent",
        label: "token / foundation / surface / --ui-color-surface-accent",
      },
      swatchStyle: { background: surface.accent, border: `1px solid ${border.accent}` },
    },
    {
      label: "Accent hover",
      hint: "accent hover layer",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "accentHover",
        label: "token / foundation / surface / --ui-color-surface-accent-hover",
      },
      swatchStyle: { background: surface.accentHover, border: `1px solid ${border.accent}` },
    },
    {
      label: "Accent active",
      hint: "accent active layer",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "accentActive",
        label: "token / foundation / surface / --ui-color-surface-accent-active",
      },
      swatchStyle: { background: surface.accentActive, border: `1px solid ${border.accent}` },
    },
    {
      label: "Accent neutral",
      hint: "light accent base",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "accentNeutral",
        label: "token / foundation / surface / --ui-color-surface-accent-neutral",
      },
      swatchStyle: { background: surface.accentNeutral, border: `1px solid ${border.accentNeutral}` },
    },
    {
      label: "Accent neutral hover",
      hint: "light accent hover",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "accentNeutralHover",
        label: "token / foundation / surface / --ui-color-surface-accent-neutral-hover",
      },
      swatchStyle: { background: surface.accentNeutralHover, border: `1px solid ${border.accentNeutral}` },
    },
    {
      label: "Accent neutral active",
      hint: "light accent active",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "accentNeutralActive",
        label: "token / foundation / surface / --ui-color-surface-accent-neutral-active",
      },
      swatchStyle: { background: surface.accentNeutralActive, border: `1px solid ${border.hover}` },
    },
    {
      label: "Danger",
      hint: "destructive base",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "danger",
        label: "token / foundation / surface / --ui-color-surface-danger",
      },
      swatchStyle: { background: surface.danger, border: `1px solid ${border.danger}` },
    },
    {
      label: "Danger hover",
      hint: "destructive hover",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "dangerHover",
        label: "token / foundation / surface / --ui-color-surface-danger-hover",
      },
      swatchStyle: { background: surface.dangerHover, border: `1px solid ${border.danger}` },
    },
    {
      label: "Danger active",
      hint: "destructive active",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "dangerActive",
        label: "token / foundation / surface / --ui-color-surface-danger-active",
      },
      swatchStyle: { background: surface.dangerActive, border: `1px solid ${border.danger}` },
    },
    {
      label: "Danger disabled",
      hint: "destructive disabled",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "dangerDisabled",
        label: "token / foundation / surface / --ui-color-surface-danger-disabled",
      },
      swatchStyle: { background: surface.dangerDisabled, border: `1px solid ${border.disabled}` },
    },
    {
      label: "Warning",
      hint: "warning base",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "warning",
        label: "token / foundation / surface / --ui-color-surface-warning",
      },
      swatchStyle: { background: surface.warning, border: `1px solid ${border.warning}` },
    },
    {
      label: "Warning compact",
      hint: "warning compact base",
      meta: {
        family: "token",
        variant: "foundationSurface",
        subtype: "warningCompact",
        label: "token / foundation / surface / --ui-color-surface-warning-compact",
      },
      swatchStyle: { background: surface.warningCompact, border: `1px solid ${border.warning}` },
    },
  ] satisfies TokenInventoryItem[],
  border: [
    {
      label: "Default",
      hint: "base border",
      meta: { family: "token", variant: "foundationBorder", subtype: "default", label: "token / foundation / border / --ui-color-border-default" },
      swatchStyle: { background: surface.panel, border: `2px solid ${border.default}` },
    },
    {
      label: "Hover",
      hint: "hover border",
      meta: { family: "token", variant: "foundationBorder", subtype: "hover", label: "token / foundation / border / --ui-color-border-hover" },
      swatchStyle: { background: surface.panel, border: `2px solid ${border.hover}` },
    },
    {
      label: "Focus",
      hint: "focus anchor",
      meta: { family: "token", variant: "foundationBorder", subtype: "focus", label: "token / foundation / border / --ui-color-border-focus" },
      swatchStyle: { background: surface.panel, border: `2px solid ${border.focus}` },
    },
    {
      label: "Disabled",
      hint: "disabled border",
      meta: { family: "token", variant: "foundationBorder", subtype: "disabled", label: "token / foundation / border / --ui-color-border-disabled" },
      swatchStyle: { background: surface.panel, border: `2px solid ${border.disabled}` },
    },
    {
      label: "Accent",
      hint: "accent border",
      meta: { family: "token", variant: "foundationBorder", subtype: "accent", label: "token / foundation / border / --ui-color-border-accent" },
      swatchStyle: { background: surface.panel, border: `2px solid ${border.accent}` },
    },
    {
      label: "Accent neutral",
      hint: "light accent border",
      meta: { family: "token", variant: "foundationBorder", subtype: "accentNeutral", label: "token / foundation / border / --ui-color-border-accent-neutral" },
      swatchStyle: { background: surface.panel, border: `2px solid ${border.accentNeutral}` },
    },
    {
      label: "Danger",
      hint: "destructive border",
      meta: { family: "token", variant: "foundationBorder", subtype: "danger", label: "token / foundation / border / --ui-color-border-danger" },
      swatchStyle: { background: surface.panel, border: `2px solid ${border.danger}` },
    },
    {
      label: "Warning",
      hint: "warning border",
      meta: { family: "token", variant: "foundationBorder", subtype: "warning", label: "token / foundation / border / --ui-color-border-warning" },
      swatchStyle: { background: surface.panel, border: `2px solid ${border.warning}` },
    },
  ] satisfies TokenInventoryItem[],
  text: [
    {
      label: "Primary",
      hint: "main content",
      meta: { family: "token", variant: "foundationText", subtype: "primary", label: "token / foundation / text / --ui-color-text-primary" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, color: text.primary, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 },
      swatchContent: "Aa",
    },
    {
      label: "Secondary",
      hint: "secondary content",
      meta: { family: "token", variant: "foundationText", subtype: "secondary", label: "token / foundation / text / --ui-color-text-secondary" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, color: text.secondary, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 },
      swatchContent: "Aa",
    },
    {
      label: "Muted",
      hint: "supporting text",
      meta: { family: "token", variant: "foundationText", subtype: "muted", label: "token / foundation / text / --ui-color-text-muted" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, color: text.muted, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 },
      swatchContent: "Aa",
    },
    {
      label: "Disabled",
      hint: "disabled text",
      meta: { family: "token", variant: "foundationText", subtype: "disabled", label: "token / foundation / text / --ui-color-text-disabled" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, color: text.disabled, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 },
      swatchContent: "Aa",
    },
    {
      label: "Inverse",
      hint: "text on accent",
      meta: { family: "token", variant: "foundationText", subtype: "inverse", label: "token / foundation / text / --ui-color-text-inverse" },
      swatchStyle: { background: surface.accent, border: `1px solid ${border.accent}`, color: text.inverse, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 },
      swatchContent: "Aa",
    },
    {
      label: "On neutral accent",
      hint: "text on light accent",
      meta: { family: "token", variant: "foundationText", subtype: "onAccentNeutral", label: "token / foundation / text / --ui-color-text-on-accent-neutral" },
      swatchStyle: { background: surface.accentNeutral, border: `1px solid ${border.accentNeutral}`, color: text.onAccentNeutral, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 },
      swatchContent: "Aa",
    },
    {
      label: "Danger",
      hint: "destructive text",
      meta: { family: "token", variant: "foundationText", subtype: "danger", label: "token / foundation / text / --ui-color-text-danger" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, color: text.danger, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 },
      swatchContent: "Aa",
    },
    {
      label: "Warning",
      hint: "warning text",
      meta: { family: "token", variant: "foundationText", subtype: "warning", label: "token / foundation / text / --ui-color-text-warning" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, color: text.warning, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 },
      swatchContent: "Aa",
    },
  ] satisfies TokenInventoryItem[],
  focus: [
    {
      label: "Focus ring",
      hint: "focus-visible overlay",
      meta: { family: "token", variant: "foundationFocus", subtype: "focusRing", label: "token / foundation / focus / --ui-color-focus-ring" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, boxShadow: `0 0 0 3px ${focusRing.default} inset` },
    },
  ] satisfies TokenInventoryItem[],
  metrics: [
    {
      label: "Radius 4",
      hint: "primitive radius",
      meta: { family: "token", variant: "foundationMetric", subtype: "radius", label: "token / foundation / radius / --ui-radius-4" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, display: "grid", placeItems: "center" },
      swatchContent: <div style={{ ...radiusMetricShapeStyle, borderRadius: radiusPrimitive.r4 }} />,
      unframedSwatch: true,
      swatchContainerStyle: { width: 54, height: 40 },
    },
    {
      label: "Radius 8",
      hint: "primitive radius",
      meta: { family: "token", variant: "foundationMetric", subtype: "radius", label: "token / foundation / radius / --ui-radius-8" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, display: "grid", placeItems: "center" },
      swatchContent: <div style={{ ...radiusMetricShapeStyle, borderRadius: radiusPrimitive.r8 }} />,
      unframedSwatch: true,
      swatchContainerStyle: { width: 54, height: 40 },
    },
    {
      label: "Radius 12",
      hint: "primitive radius",
      meta: { family: "token", variant: "foundationMetric", subtype: "radius", label: "token / foundation / radius / --ui-radius-12" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, display: "grid", placeItems: "center" },
      swatchContent: <div style={{ ...radiusMetricShapeStyle, borderRadius: radiusPrimitive.r12 }} />,
      unframedSwatch: true,
      swatchContainerStyle: { width: 54, height: 40 },
    },
    {
      label: "Radius 16",
      hint: "primitive radius",
      meta: { family: "token", variant: "foundationMetric", subtype: "radius", label: "token / foundation / radius / --ui-radius-16" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, display: "grid", placeItems: "center" },
      swatchContent: <div style={{ ...radiusMetricShapeStyle, borderRadius: radiusPrimitive.r16 }} />,
      unframedSwatch: true,
      swatchContainerStyle: { width: 54, height: 40 },
    },
    {
      label: "Radius pill",
      hint: "primitive radius",
      meta: { family: "token", variant: "foundationMetric", subtype: "radius", label: "token / foundation / radius / --ui-radius-999" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, display: "grid", placeItems: "center" },
      swatchContent: <div style={{ ...radiusMetricShapeStyle, borderRadius: radiusPrimitive.r999 }} />,
      unframedSwatch: true,
      swatchContainerStyle: { width: 54, height: 40 },
    },
    {
      label: "Radius control",
      hint: "semantic radius",
      meta: { family: "token", variant: "foundationMetric", subtype: "radius", label: "token / foundation / radius / --ui-radius-control" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, display: "grid", placeItems: "center" },
      swatchContent: <div style={{ ...radiusMetricShapeStyle, borderRadius: radius.control }} />,
      unframedSwatch: true,
      swatchContainerStyle: { width: 54, height: 40 },
    },
    {
      label: "Radius surface",
      hint: "semantic radius",
      meta: { family: "token", variant: "foundationMetric", subtype: "radius", label: "token / foundation / radius / --ui-radius-surface" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, display: "grid", placeItems: "center" },
      swatchContent: <div style={{ ...radiusMetricShapeStyle, borderRadius: radius.surface }} />,
      unframedSwatch: true,
      swatchContainerStyle: { width: 54, height: 40 },
    },
    {
      label: "Radius inset",
      hint: "semantic radius",
      meta: { family: "token", variant: "foundationMetric", subtype: "radius", label: "token / foundation / radius / --ui-radius-inset" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, display: "grid", placeItems: "center" },
      swatchContent: <div style={{ ...radiusMetricShapeStyle, borderRadius: radius.inset }} />,
      unframedSwatch: true,
      swatchContainerStyle: { width: 54, height: 40 },
    },
    {
      label: "Space compact",
      hint: "6px spacing",
      meta: { family: "token", variant: "foundationMetric", subtype: "space", label: "token / foundation / space / --ui-space-compact" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, display: "grid", placeItems: "center" },
      swatchContent: <div style={{ ...metricSampleStyle, width: "var(--ui-space-compact)", height: "var(--ui-space-compact)" }} />,
      unframedSwatch: true,
    },
    {
      label: "Space small",
      hint: "8px spacing",
      meta: { family: "token", variant: "foundationMetric", subtype: "space", label: "token / foundation / space / --ui-space-small" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, display: "grid", placeItems: "center" },
      swatchContent: <div style={{ ...metricSampleStyle, width: "var(--ui-space-small)", height: "var(--ui-space-small)" }} />,
      unframedSwatch: true,
    },
    {
      label: "Space medium",
      hint: "12px spacing",
      meta: { family: "token", variant: "foundationMetric", subtype: "space", label: "token / foundation / space / --ui-space-medium" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, display: "grid", placeItems: "center" },
      swatchContent: <div style={{ ...metricSampleStyle, width: "var(--ui-space-medium)", height: "var(--ui-space-medium)" }} />,
      unframedSwatch: true,
    },
    {
      label: "Field motion",
      hint: "140ms ease",
      meta: { family: "token", variant: "foundationMetric", subtype: "motion", label: "token / foundation / motion / --ui-transition-field" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, display: "grid", placeItems: "center" },
      swatchContent: <span style={metricTextStyle}>140</span>,
      unframedSwatch: true,
    },
    {
      label: "Button motion",
      hint: "140ms ease",
      meta: { family: "token", variant: "foundationMetric", subtype: "motion", label: "token / foundation / motion / --ui-transition-button" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, display: "grid", placeItems: "center" },
      swatchContent: <span style={metricTextStyle}>140</span>,
      unframedSwatch: true,
    },
    {
      label: "Row motion",
      hint: "140ms ease",
      meta: { family: "token", variant: "foundationMetric", subtype: "motion", label: "token / foundation / motion / --ui-transition-row" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, display: "grid", placeItems: "center" },
      swatchContent: <span style={metricTextStyle}>140</span>,
      unframedSwatch: true,
    },
    {
      label: "Swatch motion",
      hint: "140ms ease",
      meta: { family: "token", variant: "foundationMetric", subtype: "motion", label: "token / foundation / motion / --ui-transition-swatch-pill" },
      swatchStyle: { background: surface.panel, border: `1px solid ${border.default}`, display: "grid", placeItems: "center" },
      swatchContent: <span style={metricTextStyle}>140</span>,
      unframedSwatch: true,
    },
  ] satisfies TokenInventoryItem[],
} as const;

const participantColorInventory = PARTICIPANT_COLOR_OPTIONS.map((color, index) => ({
  label: `Color ${index + 1}`,
  hint: color,
  meta: {
    family: "participantColor",
    variant: "palette",
    subtype: `slot-${index + 1}`,
    label: getParticipantPaletteSlotNodeLabel(index + 1, color),
  },
  swatchStyle: {
    background: color,
    border: `1px solid ${border.default}`,
  },
})) satisfies TokenInventoryItem[];

function getParticipantColorDraftTokenNodeLabel(
  slotNumber: number,
  branch: "surface" | "border" | "text",
  state: "default" | "hover" | "active"
) {
  return `token / participant-color / participant-color-${slotNumber} / ${branch} / ${state} / --ui-participant-color-${slotNumber}-${branch}-${state}`;
}

const participantColorDraftTokenColumns = participantColor.map((tokenSet, index) => {
  const slotNumber = index + 1;
  const sourceColor = PARTICIPANT_COLOR_OPTIONS[index];

  return {
    title: tokenSet.slot,
    recipeLabel: `token / participant-color / ${tokenSet.slot}`,
    items: [
      {
        label: "Surface default",
        hint: `base accent from ${sourceColor}`,
        tokenVar: getTokenVariableNameFromReference(tokenSet.surface.default),
        meta: {
          family: "token",
          variant: "surface",
          subtype: "participantColorSurfaceDefault",
          label: getParticipantColorDraftTokenNodeLabel(slotNumber, "surface", "default"),
        },
        swatchStyle: {
          background: tokenSet.surface.default,
          border: `1px solid ${tokenSet.border.default}`,
        },
      },
      {
        label: "Surface hover",
        hint: "participant-color hover token",
        tokenVar: getTokenVariableNameFromReference(tokenSet.surface.hover),
        meta: {
          family: "token",
          variant: "surface",
          subtype: "participantColorSurfaceHover",
          label: getParticipantColorDraftTokenNodeLabel(slotNumber, "surface", "hover"),
        },
        swatchStyle: {
          background: tokenSet.surface.hover,
          border: `1px solid ${tokenSet.border.default}`,
        },
      },
      {
        label: "Surface active",
        hint: "participant-color active token",
        tokenVar: getTokenVariableNameFromReference(tokenSet.surface.active),
        meta: {
          family: "token",
          variant: "surface",
          subtype: "participantColorSurfaceActive",
          label: getParticipantColorDraftTokenNodeLabel(slotNumber, "surface", "active"),
        },
        swatchStyle: {
          background: tokenSet.surface.active,
          border: `1px solid ${tokenSet.border.default}`,
        },
      },
      {
        label: "Border default",
        hint: "base accent border",
        tokenVar: getTokenVariableNameFromReference(tokenSet.border.default),
        meta: {
          family: "token",
          variant: "border",
          subtype: "participantColorBorderDefault",
          label: getParticipantColorDraftTokenNodeLabel(slotNumber, "border", "default"),
        },
        swatchStyle: {
          background: surface.panel,
          border: `2px solid ${tokenSet.border.default}`,
        },
      },
      {
        label: "Text default",
        hint: "text on participant accent",
        tokenVar: getTokenVariableNameFromReference(tokenSet.text.default),
        meta: {
          family: "token",
          variant: "text",
          subtype: "participantColorTextDefault",
          label: getParticipantColorDraftTokenNodeLabel(slotNumber, "text", "default"),
        },
        swatchStyle: {
          background: tokenSet.surface.default,
          border: `1px solid ${tokenSet.border.default}`,
          color: tokenSet.text.default,
          display: "grid",
          placeItems: "center",
          fontSize: 12,
          fontWeight: 700,
        },
        swatchContent: "Aa",
      },
    ] satisfies TokenInventoryItem[],
  };
});

const draftLocalUserAliasInventory = [
  {
    label: "Surface default",
    hint: "active local-user base",
    tokenVar: getTokenVariableNameFromReference(localUserButton.surface.default),
    meta: {
      family: "token",
      variant: "surface",
      subtype: "localUserSurfaceDefault",
      label: getLocalUserAliasTokenNodeLabel("surface", "default"),
    },
    swatchStyle: {
      background: localUserButton.surface.default,
      border: `1px solid ${localUserButton.border.default}`,
    },
  },
  {
    label: "Surface hover",
    hint: "hover follows palette hover",
    tokenVar: getTokenVariableNameFromReference(localUserButton.surface.hover),
    meta: {
      family: "token",
      variant: "surface",
      subtype: "localUserSurfaceHover",
      label: getLocalUserAliasTokenNodeLabel("surface", "hover"),
    },
    swatchStyle: {
      background: localUserButton.surface.hover,
      border: `1px solid ${localUserButton.border.default}`,
    },
  },
  {
    label: "Surface active",
    hint: "pressed path",
    tokenVar: getTokenVariableNameFromReference(localUserButton.surface.active),
    meta: {
      family: "token",
      variant: "surface",
      subtype: "localUserSurfaceActive",
      label: getLocalUserAliasTokenNodeLabel("surface", "active"),
    },
    swatchStyle: {
      background: localUserButton.surface.active,
      border: `1px solid ${localUserButton.border.default}`,
    },
  },
  {
    label: "Surface selected",
    hint: "selected stays on active color",
    tokenVar: getTokenVariableNameFromReference(localUserButton.surface.selected),
    meta: {
      family: "token",
      variant: "surface",
      subtype: "localUserSurfaceSelected",
      label: getLocalUserAliasTokenNodeLabel("surface", "selected"),
    },
    swatchStyle: {
      background: localUserButton.surface.selected,
      border: `1px solid ${localUserButton.border.default}`,
    },
  },
  {
    label: "Surface open",
    hint: "open uses hover path",
    tokenVar: getTokenVariableNameFromReference(localUserButton.surface.open),
    meta: {
      family: "token",
      variant: "surface",
      subtype: "localUserSurfaceOpen",
      label: getLocalUserAliasTokenNodeLabel("surface", "open"),
    },
    swatchStyle: {
      background: localUserButton.surface.open,
      border: `1px solid ${localUserButton.border.default}`,
    },
  },
  {
    label: "Surface loading",
    hint: "loading reuses active path",
    tokenVar: getTokenVariableNameFromReference(localUserButton.surface.loading),
    meta: {
      family: "token",
      variant: "surface",
      subtype: "localUserSurfaceLoading",
      label: getLocalUserAliasTokenNodeLabel("surface", "loading"),
    },
    swatchStyle: {
      background: localUserButton.surface.loading,
      border: `1px solid ${localUserButton.border.default}`,
    },
  },
  {
    label: "Border default",
    hint: "shared participant border",
    tokenVar: getTokenVariableNameFromReference(localUserButton.border.default),
    meta: {
      family: "token",
      variant: "border",
      subtype: "localUserBorderDefault",
      label: getLocalUserAliasTokenNodeLabel("border", "default"),
    },
    swatchStyle: {
      background: surface.panel,
      border: `2px solid ${localUserButton.border.default}`,
    },
  },
  {
    label: "Border open",
    hint: "open keeps same border identity",
    tokenVar: getTokenVariableNameFromReference(localUserButton.border.open),
    meta: {
      family: "token",
      variant: "border",
      subtype: "localUserBorderOpen",
      label: getLocalUserAliasTokenNodeLabel("border", "open"),
    },
    swatchStyle: {
      background: surface.panel,
      border: `2px solid ${localUserButton.border.open}`,
    },
  },
  {
    label: "Border loading",
    hint: "loading keeps same border identity",
    tokenVar: getTokenVariableNameFromReference(localUserButton.border.loading),
    meta: {
      family: "token",
      variant: "border",
      subtype: "localUserBorderLoading",
      label: getLocalUserAliasTokenNodeLabel("border", "loading"),
    },
    swatchStyle: {
      background: surface.panel,
      border: `2px solid ${localUserButton.border.loading}`,
    },
  },
  {
    label: "Text default",
    hint: "text on local-user accent",
    tokenVar: getTokenVariableNameFromReference(localUserButton.text.default),
    meta: {
      family: "token",
      variant: "text",
      subtype: "localUserTextDefault",
      label: getLocalUserAliasTokenNodeLabel("text", "default"),
    },
    swatchStyle: {
      background: localUserButton.surface.default,
      border: `1px solid ${localUserButton.border.default}`,
      color: localUserButton.text.default,
      display: "grid",
      placeItems: "center",
      fontSize: 12,
      fontWeight: 700,
    },
    swatchContent: "Aa",
  },
  {
    label: "Text loading",
    hint: "loading stays on default text path",
    tokenVar: getTokenVariableNameFromReference(localUserButton.text.loading),
    meta: {
      family: "token",
      variant: "text",
      subtype: "localUserTextLoading",
      label: getLocalUserAliasTokenNodeLabel("text", "loading"),
    },
    swatchStyle: {
      background: localUserButton.surface.loading,
      border: `1px solid ${localUserButton.border.loading}`,
      color: localUserButton.text.loading,
      display: "grid",
      placeItems: "center",
      fontSize: 12,
      fontWeight: 700,
    },
    swatchContent: "Aa",
  },
] satisfies TokenInventoryItem[];

const tokenInventory = {
  surface: [
    {
      label: "Accent",
      hint: "primary fill",
      tokenVar: "--ui-button-primary-surface-default",
      meta: {
        family: "token",
        variant: "surface",
        subtype: "surface",
        label: "token / surface / primary fill / --ui-color-surface-accent",
      },
      swatchStyle: { background: surface.accent, border: `1px solid ${border.accent}` },
    },
    {
      label: "Inset",
      hint: "secondary base",
      tokenVar: "--ui-button-secondary-surface-default",
      meta: {
        family: "token",
        variant: "surface",
        subtype: "surface",
        label: "token / surface / secondary base / --ui-color-surface-inset",
      },
      swatchStyle: { background: surface.inset, border: `1px solid ${border.default}` },
    },
    {
      label: "Inset hover",
      hint: "secondary hover",
      tokenVar: "--ui-button-secondary-surface-hover",
      meta: {
        family: "token",
        variant: "surface",
        subtype: "surface",
        label: "token / surface / secondary hover / --ui-color-surface-inset-hover",
      },
      swatchStyle: { background: surface.insetHover, border: `1px solid ${border.hover}` },
    },
    {
      label: "Accent active",
      hint: "primary active",
      tokenVar: "--ui-button-primary-surface-active",
      meta: {
        family: "token",
        variant: "surface",
        subtype: "surface",
        label: "token / surface / primary active / --ui-color-surface-accent-active",
      },
      swatchStyle: { background: surface.accentActive, border: `1px solid ${border.accent}` },
    },
    {
      label: "Disabled surface",
      hint: "shared disabled",
      tokenVar: "--ui-button-secondary-surface-disabled",
      meta: {
        family: "token",
        variant: "surface",
        subtype: "surface",
        label: "token / surface / shared disabled / --ui-color-surface-inset-disabled",
      },
      swatchStyle: { background: surface.insetDisabled, border: `1px solid ${border.disabled}` },
    },
  ] satisfies TokenInventoryItem[],
  border: [
    {
      label: "Default border",
      hint: "secondary idle",
      tokenVar: "--ui-button-secondary-border-default",
      meta: {
        family: "token",
        variant: "border",
        subtype: "default",
        label: "token / border / default / --ui-color-border-default",
      },
      swatchStyle: { background: surface.panel, border: `2px solid ${border.default}` },
    },
    {
      label: "Hover border",
      hint: "secondary hover",
      tokenVar: "--ui-button-secondary-border-hover",
      meta: {
        family: "token",
        variant: "border",
        subtype: "hover",
        label: "token / border / hover / --ui-color-border-hover",
      },
      swatchStyle: { background: surface.panel, border: `2px solid ${border.hover}` },
    },
    {
      label: "Focus border",
      hint: "ring anchor",
      tokenVar: "--ui-field-border-focus",
      meta: {
        family: "token",
        variant: "border",
        subtype: "focus",
        label: "token / border / focus / --ui-color-border-focus",
      },
      swatchStyle: { background: surface.panel, border: `2px solid ${border.focus}` },
    },
    {
      label: "Accent border",
      hint: "primary idle",
      tokenVar: "--ui-button-primary-border-default",
      meta: {
        family: "token",
        variant: "border",
        subtype: "accent",
        label: "token / border / primary idle / --ui-color-border-accent",
      },
      swatchStyle: { background: surface.panel, border: `2px solid ${border.accent}` },
    },
    {
      label: "Danger border",
      hint: "error state",
      tokenVar: "--ui-field-border-error",
      meta: {
        family: "token",
        variant: "border",
        subtype: "danger",
        label: "token / border / error state / --ui-color-border-danger",
      },
      swatchStyle: { background: surface.panel, border: `2px solid ${border.danger}` },
    },
  ] satisfies TokenInventoryItem[],
  text: [
    {
      label: "Primary text",
      hint: "panel content",
      tokenVar: "--ui-field-text-default",
      meta: {
        family: "token",
        variant: "text",
        subtype: "primary",
        label: "token / text / panel content / --ui-color-text-primary",
      },
      swatchStyle: {
        background: surface.panel,
        border: `1px solid ${border.default}`,
        color: text.primary,
        display: "grid",
        placeItems: "center",
        fontSize: 13,
        fontWeight: 700,
      },
      swatchContent: "Aa",
    },
    {
      label: "Secondary text",
      hint: "secondary button text",
      tokenVar: "--ui-button-secondary-text-default",
      meta: {
        family: "token",
        variant: "text",
        subtype: "secondary",
        label: "token / text / secondary button text / --ui-color-text-secondary",
      },
      swatchStyle: {
        background: surface.panel,
        border: `1px solid ${border.default}`,
        color: text.secondary,
        display: "grid",
        placeItems: "center",
        fontSize: 13,
        fontWeight: 700,
      },
      swatchContent: "Aa",
    },
    {
      label: "Muted text",
      hint: "supporting copy",
      meta: {
        family: "token",
        variant: "text",
        subtype: "muted",
        label: "token / text / supporting copy / --ui-color-text-muted",
      },
      swatchStyle: {
        background: surface.panel,
        border: `1px solid ${border.default}`,
        color: text.muted,
        display: "grid",
        placeItems: "center",
        fontSize: 13,
        fontWeight: 700,
      },
      swatchContent: "Aa",
    },
    {
      label: "Disabled text",
      hint: "shared disabled",
      tokenVar: "--ui-button-secondary-text-disabled",
      meta: {
        family: "token",
        variant: "text",
        subtype: "disabled",
        label: "token / text / shared disabled / --ui-color-text-disabled",
      },
      swatchStyle: {
        background: surface.panel,
        border: `1px solid ${border.default}`,
        color: text.disabled,
        display: "grid",
        placeItems: "center",
        fontSize: 13,
        fontWeight: 700,
      },
      swatchContent: "Aa",
    },
    {
      label: "Danger text",
      hint: "destructive action",
      tokenVar: "--ui-button-danger-text-default",
      meta: {
        family: "token",
        variant: "text",
        subtype: "danger",
        label: "token / text / destructive action / --ui-color-text-danger",
      },
      swatchStyle: {
        background: surface.panel,
        border: `1px solid ${border.default}`,
        color: text.danger,
        display: "grid",
        placeItems: "center",
        fontSize: 13,
        fontWeight: 700,
      },
      swatchContent: "Aa",
    },
  ] satisfies TokenInventoryItem[],
  treatments: [
    {
      label: "Focus ring",
      hint: "focus-visible layer",
      tokenVar: "--ui-color-focus-ring",
      meta: {
        family: "token",
        variant: "treatment",
        subtype: "focus",
        label: "token / treatment / focus-visible layer / --ui-color-focus-ring",
      },
      swatchStyle: {
        background: surface.panel,
        border: `1px solid ${border.default}`,
        boxShadow: `0 0 0 3px ${focusRing.default} inset`,
      },
    },
    {
      label: "Open surface",
      hint: "trigger held state",
      tokenVar: "--ui-button-secondary-surface-open",
      meta: {
        family: "token",
        variant: "treatment",
        subtype: "open",
        label: "token / treatment / trigger held state / --ui-button-secondary-surface-open",
      },
      swatchStyle: {
        background: "var(--ui-button-secondary-surface-open)",
        border: `1px solid var(--ui-button-secondary-border-open)`,
      },
    },
    {
      label: "Loading treatment",
      hint: "shared busy opacity",
      tokenVar: "--ui-control-opacity-loading",
      meta: {
        family: "token",
        variant: "treatment",
        subtype: "loading",
        label: "token / treatment / shared busy opacity / --ui-control-opacity-loading",
      },
      swatchStyle: {
        background: "var(--ui-button-primary-surface-loading)",
        border: `1px solid var(--ui-button-primary-border-loading)`,
        opacity: "var(--ui-control-opacity-loading)",
      },
    },
    {
      label: "Disabled treatment",
      hint: "shared disabled opacity",
      tokenVar: "--ui-control-opacity-disabled",
      meta: {
        family: "token",
        variant: "treatment",
        subtype: "disabled",
        label: "token / treatment / shared disabled opacity / --ui-control-opacity-disabled",
      },
      swatchStyle: {
        background: surface.insetDisabled,
        border: `1px solid ${border.disabled}`,
        opacity: "var(--ui-control-opacity-disabled)",
      },
    },
    {
      label: "Error field",
      hint: "field error border",
      tokenVar: "--ui-field-border-error",
      meta: {
        family: "token",
        variant: "treatment",
        subtype: "error",
        label: "token / treatment / field error border / --ui-field-border-error",
      },
      swatchStyle: { background: "var(--ui-field-surface-error)", border: `2px solid var(--ui-field-border-error)` },
    },
  ] satisfies TokenInventoryItem[],
} as const;

const inspectNodeIds = {
  tokens: {
    radiusPrimitive4: "token / foundation / radius / --ui-radius-4",
    radiusPrimitive8: "token / foundation / radius / --ui-radius-8",
    radiusPrimitive12: "token / foundation / radius / --ui-radius-12",
    radiusPrimitive16: "token / foundation / radius / --ui-radius-16",
    radiusPrimitive999: "token / foundation / radius / --ui-radius-999",
    radiusControl: "token / foundation / radius / --ui-radius-control",
    radiusSurface: "token / foundation / radius / --ui-radius-surface",
    radiusInset: "token / foundation / radius / --ui-radius-inset",
    radiusPill: "token / foundation / radius / --ui-radius-pill",
  },
  controls: {
    primaryDefault: "control / button / primary / default",
    primarySmall: "control / button / primary / small",
    primaryCompact: "control / button / primary / compact",
    secondaryDefault: "control / button / secondary / default",
    secondarySmall: "control / button / secondary / small",
    secondaryCompact: "control / button / secondary / compact",
    dangerDefault: "control / button / danger / default",
    dangerSmall: "control / button / danger / small",
    dangerCompact: "control / button / danger / compact",
    ordinaryFocus: "control / button / secondary / focus-visible",
    ordinaryDisabled: "control / button / secondary / disabled",
    ordinaryLoading: "control / button / secondary / loading",
    menuDefault: "control / menuTrigger / secondary / default",
    menuOpen: "control / menuTrigger / secondary / open",
    menuOpenHover: "control / menuTrigger / secondary / open-hover",
    fieldDefault: "control / field / default",
    fieldError: "control / field / error",
    fieldErrorFocus: "control / field / error-focus",
    fieldDisabled: "control / field / disabled",
    circlePrimary: "control / interactionButton / circle / primary",
    circleSecondary: "control / interactionButton / circle / secondary",
    circleDanger: "control / interactionButton / circle / danger",
    circleStateDefault: "control / interactionButton / circle / default",
    circleStateHover: "control / interactionButton / circle / hover",
    circleStateFocus: "control / interactionButton / circle / focus-visible",
    circleStateActive: "control / interactionButton / circle / active",
    circleStateDisabled: "control / interactionButton / circle / disabled",
    swatchDefault: "control / swatch / default",
    swatchSmall: "control / swatch / small",
    swatchTrigger: "control / swatch / trigger",
    swatchStateDefault: "control / swatch / state-default",
    swatchStateHover: "control / swatch / state-hover",
    swatchStateFocus: "control / swatch / state-focus-visible",
    swatchStateSelected: "control / swatch / state-selected",
    swatchStateOccupied: "control / swatch / state-occupied",
    swatchStatePending: "control / swatch / state-pending",
    swatchStateDisabled: "control / swatch / state-disabled",
    draftLocalUserButtonFill: "control / local-user / button / fill",
    draftLocalUserButtonBorder: "control / local-user / button / border",
    draftLocalUserInteractionFill: "control / local-user / interactionButton / pill / fill",
    draftLocalUserInteractionBorder:
      "control / local-user / interactionButton / pill / border",
  },
} as const;

const inspectGraphEdges: Array<[InspectNodeId, InspectNodeId]> = [
  [
    "token / foundation / surface / --ui-color-surface-accent",
    "token / surface / primary fill / --ui-color-surface-accent",
  ],
  [
    "token / foundation / surface / --ui-color-surface-inset",
    "token / surface / secondary base / --ui-color-surface-inset",
  ],
  [
    "token / foundation / surface / --ui-color-surface-inset-hover",
    "token / surface / secondary hover / --ui-color-surface-inset-hover",
  ],
  [
    "token / foundation / surface / --ui-color-surface-accent-active",
    "token / surface / primary active / --ui-color-surface-accent-active",
  ],
  [
    "token / foundation / surface / --ui-color-surface-inset-disabled",
    "token / surface / shared disabled / --ui-color-surface-inset-disabled",
  ],
  [
    "token / foundation / border / --ui-color-border-default",
    "token / border / default / --ui-color-border-default",
  ],
  [
    "token / foundation / border / --ui-color-border-hover",
    "token / border / hover / --ui-color-border-hover",
  ],
  [
    "token / foundation / border / --ui-color-border-accent",
    "token / border / primary idle / --ui-color-border-accent",
  ],
  [
    "token / foundation / border / --ui-color-border-danger",
    "token / border / error state / --ui-color-border-danger",
  ],
  [
    "token / foundation / text / --ui-color-text-primary",
    "token / text / panel content / --ui-color-text-primary",
  ],
  [
    "token / foundation / text / --ui-color-text-secondary",
    "token / text / secondary button text / --ui-color-text-secondary",
  ],
  [
    "token / foundation / text / --ui-color-text-disabled",
    "token / text / shared disabled / --ui-color-text-disabled",
  ],
  [
    "token / foundation / text / --ui-color-text-danger",
    "token / text / destructive action / --ui-color-text-danger",
  ],
  [
    "token / foundation / focus / --ui-color-focus-ring",
    "token / treatment / focus-visible layer / --ui-color-focus-ring",
  ],
  [
    inspectNodeIds.tokens.radiusPrimitive8,
    inspectNodeIds.tokens.radiusControl,
  ],
  [
    inspectNodeIds.tokens.radiusPrimitive8,
    inspectNodeIds.tokens.radiusInset,
  ],
  [
    inspectNodeIds.tokens.radiusPrimitive16,
    inspectNodeIds.tokens.radiusSurface,
  ],
  [
    inspectNodeIds.tokens.radiusPrimitive999,
    inspectNodeIds.tokens.radiusPill,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.primaryDefault,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.primarySmall,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.primaryCompact,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.secondaryDefault,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.secondarySmall,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.secondaryCompact,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.dangerDefault,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.dangerSmall,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.dangerCompact,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.ordinaryFocus,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.ordinaryDisabled,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.ordinaryLoading,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.menuDefault,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.menuOpen,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.menuOpenHover,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.fieldDefault,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.fieldError,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.fieldErrorFocus,
  ],
  [
    inspectNodeIds.tokens.radiusControl,
    inspectNodeIds.controls.fieldDisabled,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.circlePrimary,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.circleSecondary,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.circleDanger,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.circleStateDefault,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.circleStateHover,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.circleStateFocus,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.circleStateActive,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.circleStateDisabled,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.swatchDefault,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.swatchSmall,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.swatchTrigger,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.swatchStateDefault,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.swatchStateHover,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.swatchStateFocus,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.swatchStateSelected,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.swatchStateOccupied,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.swatchStatePending,
  ],
  [
    inspectNodeIds.tokens.radiusPill,
    inspectNodeIds.controls.swatchStateDisabled,
  ],
  [
    "token / surface / primary fill / --ui-color-surface-accent",
    inspectNodeIds.controls.primaryDefault,
  ],
  [
    "token / surface / primary fill / --ui-color-surface-accent",
    inspectNodeIds.controls.primarySmall,
  ],
  [
    "token / surface / primary fill / --ui-color-surface-accent",
    inspectNodeIds.controls.primaryCompact,
  ],
  [
    "token / border / primary idle / --ui-color-border-accent",
    inspectNodeIds.controls.primaryDefault,
  ],
  [
    "token / border / primary idle / --ui-color-border-accent",
    inspectNodeIds.controls.primarySmall,
  ],
  [
    "token / border / primary idle / --ui-color-border-accent",
    inspectNodeIds.controls.primaryCompact,
  ],
  [
    "token / surface / secondary base / --ui-color-surface-inset",
    inspectNodeIds.controls.secondaryDefault,
  ],
  [
    "token / surface / secondary base / --ui-color-surface-inset",
    inspectNodeIds.controls.secondarySmall,
  ],
  [
    "token / surface / secondary base / --ui-color-surface-inset",
    inspectNodeIds.controls.secondaryCompact,
  ],
  [
    "token / border / default / --ui-color-border-default",
    inspectNodeIds.controls.secondaryDefault,
  ],
  [
    "token / border / default / --ui-color-border-default",
    inspectNodeIds.controls.secondarySmall,
  ],
  [
    "token / border / default / --ui-color-border-default",
    inspectNodeIds.controls.secondaryCompact,
  ],
  [
    "token / text / secondary button text / --ui-color-text-secondary",
    inspectNodeIds.controls.secondaryDefault,
  ],
  [
    "token / text / secondary button text / --ui-color-text-secondary",
    inspectNodeIds.controls.secondarySmall,
  ],
  [
    "token / text / secondary button text / --ui-color-text-secondary",
    inspectNodeIds.controls.secondaryCompact,
  ],
  [
    "token / border / error state / --ui-color-border-danger",
    inspectNodeIds.controls.dangerDefault,
  ],
  [
    "token / border / error state / --ui-color-border-danger",
    inspectNodeIds.controls.dangerSmall,
  ],
  [
    "token / border / error state / --ui-color-border-danger",
    inspectNodeIds.controls.dangerCompact,
  ],
  [
    "token / text / destructive action / --ui-color-text-danger",
    inspectNodeIds.controls.dangerDefault,
  ],
  [
    "token / text / destructive action / --ui-color-text-danger",
    inspectNodeIds.controls.dangerSmall,
  ],
  [
    "token / text / destructive action / --ui-color-text-danger",
    inspectNodeIds.controls.dangerCompact,
  ],
  [
    "token / treatment / focus-visible layer / --ui-color-focus-ring",
    inspectNodeIds.controls.ordinaryFocus,
  ],
  [
    "token / treatment / focus-visible layer / --ui-color-focus-ring",
    inspectNodeIds.controls.fieldErrorFocus,
  ],
  [
    "token / treatment / shared disabled opacity / --ui-control-opacity-disabled",
    inspectNodeIds.controls.ordinaryDisabled,
  ],
  [
    "token / treatment / shared disabled opacity / --ui-control-opacity-disabled",
    inspectNodeIds.controls.fieldDisabled,
  ],
  [
    "token / treatment / shared busy opacity / --ui-control-opacity-loading",
    inspectNodeIds.controls.ordinaryLoading,
  ],
  [
    "token / treatment / trigger held state / --ui-button-secondary-surface-open",
    inspectNodeIds.controls.menuOpen,
  ],
  [
    "token / treatment / trigger held state / --ui-button-secondary-surface-open",
    inspectNodeIds.controls.menuOpenHover,
  ],
  [
    "token / surface / secondary base / --ui-color-surface-inset",
    inspectNodeIds.controls.menuDefault,
  ],
  [
    "token / border / default / --ui-color-border-default",
    inspectNodeIds.controls.menuDefault,
  ],
  [
    "token / surface / secondary base / --ui-color-surface-inset",
    inspectNodeIds.controls.fieldDefault,
  ],
  [
    "token / border / default / --ui-color-border-default",
    inspectNodeIds.controls.fieldDefault,
  ],
  [
    "token / treatment / field error border / --ui-field-border-error",
    inspectNodeIds.controls.fieldError,
  ],
  [
    "token / treatment / field error border / --ui-field-border-error",
    inspectNodeIds.controls.fieldErrorFocus,
  ],
  ...PARTICIPANT_COLOR_OPTIONS.flatMap((color, index) => {
    const slotNumber = index + 1;
    const paletteNode = getParticipantPaletteSlotNodeLabel(slotNumber, color);

    return [
      [
        paletteNode,
        getParticipantColorDraftTokenNodeLabel(slotNumber, "surface", "default"),
      ] as [InspectNodeId, InspectNodeId],
      [
        paletteNode,
        getParticipantColorDraftTokenNodeLabel(slotNumber, "surface", "hover"),
      ] as [InspectNodeId, InspectNodeId],
      [
        paletteNode,
        getParticipantColorDraftTokenNodeLabel(slotNumber, "surface", "active"),
      ] as [InspectNodeId, InspectNodeId],
      [
        paletteNode,
        getParticipantColorDraftTokenNodeLabel(slotNumber, "border", "default"),
      ] as [InspectNodeId, InspectNodeId],
      [
        paletteNode,
        getParticipantColorDraftTokenNodeLabel(slotNumber, "text", "default"),
      ] as [InspectNodeId, InspectNodeId],
    ];
  }),
];

function getPreviewButtonProps(recipe: ButtonRecipe, state: PreviewButtonState = {}) {
  const buttonProps = getButtonProps(recipe, state);
  const baseStyle = recipe.style as CSSVariableProperties;
  const previewStyle: CSSVariableProperties = {
    ...baseStyle,
    outline: "none",
  };

  if (state.loading) {
    previewStyle["--ui-button-surface-current"] = "var(--ui-button-surface-loading)";
    previewStyle["--ui-button-border-current"] = "var(--ui-button-border-loading)";
    previewStyle["--ui-button-text-current"] = "var(--ui-button-text-loading)";
    previewStyle.opacity = "var(--ui-control-opacity-loading)";
  } else if (state.disabled) {
    previewStyle["--ui-button-surface-current"] = "var(--ui-button-surface-disabled)";
    previewStyle["--ui-button-border-current"] = "var(--ui-button-border-disabled)";
    previewStyle["--ui-button-text-current"] = "var(--ui-button-text-disabled)";
    previewStyle.opacity = "var(--ui-control-opacity-disabled)";
  } else if (state.selected && state.active) {
    previewStyle["--ui-button-surface-current"] =
      "var(--ui-button-surface-selected-active)";
    previewStyle["--ui-button-border-current"] = "var(--ui-button-border-selected-active)";
    previewStyle["--ui-button-text-current"] = "var(--ui-button-text-selected-active)";
  } else if (state.selected && state.hover) {
    previewStyle["--ui-button-surface-current"] =
      "var(--ui-button-surface-selected-hover)";
    previewStyle["--ui-button-border-current"] = "var(--ui-button-border-selected-hover)";
    previewStyle["--ui-button-text-current"] = "var(--ui-button-text-selected-hover)";
  } else if (state.selected) {
    previewStyle["--ui-button-surface-current"] = "var(--ui-button-surface-selected)";
    previewStyle["--ui-button-border-current"] = "var(--ui-button-border-selected)";
    previewStyle["--ui-button-text-current"] = "var(--ui-button-text-selected)";
  } else if (state.open && state.active) {
    previewStyle["--ui-button-surface-current"] = "var(--ui-button-surface-open-active)";
    previewStyle["--ui-button-border-current"] = "var(--ui-button-border-open-active)";
    previewStyle["--ui-button-text-current"] = "var(--ui-button-text-open-active)";
  } else if (state.open && state.hover) {
    previewStyle["--ui-button-surface-current"] = "var(--ui-button-surface-open-hover)";
    previewStyle["--ui-button-border-current"] = "var(--ui-button-border-open-hover)";
    previewStyle["--ui-button-text-current"] = "var(--ui-button-text-open-hover)";
  } else if (state.open) {
    previewStyle["--ui-button-surface-current"] = "var(--ui-button-surface-open)";
    previewStyle["--ui-button-border-current"] = "var(--ui-button-border-open)";
    previewStyle["--ui-button-text-current"] = "var(--ui-button-text-open)";
  } else if (state.active) {
    previewStyle["--ui-button-surface-current"] = "var(--ui-button-surface-active)";
    previewStyle["--ui-button-border-current"] = "var(--ui-button-border-active)";
    previewStyle["--ui-button-text-current"] = "var(--ui-button-text-active)";
  } else if (state.hover) {
    previewStyle["--ui-button-surface-current"] = "var(--ui-button-surface-hover)";
    previewStyle["--ui-button-border-current"] = "var(--ui-button-border-hover)";
    previewStyle["--ui-button-text-current"] = "var(--ui-button-text-hover)";
  }

  return {
    ...buttonProps,
    style: {
      ...previewStyle,
      boxShadow: state.focusVisible ? `0 0 0 3px ${focusRing.default}` : undefined,
    } satisfies CSSVariableProperties,
  } as const;
}

function getPreviewFieldShellStyle(
  recipe: (typeof fieldRecipes)["default"] | (typeof fieldRecipes)["small"],
  state: PreviewFieldState = {}
) {
  const shellProps = getFieldShellProps(recipe.shell, {
    disabled: state.disabled,
    invalid: state.invalid,
  });
  const shellStyle: CSSVariableProperties = {
    ...(shellProps.style as CSSVariableProperties),
    outline: "none",
  };

  if (state.disabled) {
    shellStyle["--ui-field-surface-current"] = "var(--ui-field-surface-disabled)";
    shellStyle["--ui-field-border-current"] = "var(--ui-field-border-disabled)";
    shellStyle["--ui-field-text-current"] = "var(--ui-field-text-disabled)";
    shellStyle.opacity = "var(--ui-control-opacity-disabled)";
    return {
      ...shellProps,
      style: shellStyle,
    } as const;
  }

  if (state.hover) {
    shellStyle["--ui-field-surface-current"] = "var(--ui-field-surface-hover)";
    shellStyle["--ui-field-border-current"] = "var(--ui-field-border-hover)";
    shellStyle["--ui-field-text-current"] = "var(--ui-field-text-default)";
  }

  if (state.invalid) {
    shellStyle["--ui-field-surface-current"] = "var(--ui-field-surface-error)";
    shellStyle["--ui-field-border-current"] = "var(--ui-field-border-error)";
    shellStyle["--ui-field-text-current"] = "var(--ui-field-text-error)";
  }

  if (state.focusVisible) {
    shellStyle["--ui-field-border-current"] = state.invalid
      ? "var(--ui-field-border-error)"
      : "var(--ui-field-border-focus)";
    shellStyle.boxShadow = `0 0 0 3px ${focusRing.default}`;
  }

  return {
    ...shellProps,
    style: shellStyle,
  } as const;
}

function getPreviewSwatchProps(
  recipe: SwatchRecipe,
  state: PreviewSwatchState
) {
  const swatchProps = getSwatchButtonProps(recipe, {
    participantColorSlot: state.participantColorSlot ?? 3,
    selected: state.selected,
    occupied: state.occupied,
    pending: state.pending,
    disabled: state.disabled,
  });

  const existingBoxShadow =
    typeof swatchProps.style.boxShadow === "string" ? swatchProps.style.boxShadow : "";
  const focusBoxShadow = state.focusVisible ? `0 0 0 3px ${focusRing.default}` : "";

  return {
    ...swatchProps,
    style: {
      ...swatchProps.style,
      filter: state.hover ? "brightness(1.04)" : undefined,
      boxShadow: [focusBoxShadow, existingBoxShadow].filter(Boolean).join(", ") || undefined,
    } satisfies CSSVariableProperties,
  } as const;
}

function DebugLabel({ children }: { children: ReactNode }) {
  return <div style={inlineTextRecipes.muted.style}>{children}</div>;
}

function buildPreviewInspectNodeId(meta: {
  family?: string;
  variant?: string;
  size?: string;
  subtype?: string;
}, label: string) {
  return [
    "preview",
    meta.family,
    meta.variant,
    meta.size,
    meta.subtype,
    label,
  ]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" / ");
}

function getInspectContainerStyle(
  baseStyle: CSSProperties,
  relation: InspectRelation = "idle"
): CSSProperties {
  const idleStyle: CSSProperties = {
    ...baseStyle,
    borderColor: "transparent",
    boxShadow: "none",
    background: "transparent",
    opacity: 1,
    filter: "none",
  };

  if (relation === "selected") {
    return {
      ...idleStyle,
      borderColor: "rgba(226, 232, 240, 0.9)",
      boxShadow: "0 0 0 2px rgba(226, 232, 240, 0.32)",
      background: "rgba(30, 41, 59, 0.22)",
    };
  }

  if (relation === "upstream") {
    return {
      ...idleStyle,
      borderColor: "rgba(56, 189, 248, 0.78)",
      boxShadow: "0 0 0 2px rgba(56, 189, 248, 0.2)",
    };
  }

  if (relation === "downstream") {
    return {
      ...idleStyle,
      borderColor: "rgba(251, 191, 36, 0.82)",
      boxShadow: "0 0 0 2px rgba(251, 191, 36, 0.18)",
    };
  }

  if (relation === "unrelated") {
    return {
      ...idleStyle,
      opacity: 0.32,
      filter: "saturate(0.72)",
    };
  }

  return idleStyle;
}

function getAggregateInspectRelation(
  relations: readonly InspectRelation[]
): InspectRelation {
  if (relations.length === 0) {
    return "idle";
  }

  let hasUpstream = false;
  let hasDownstream = false;
  let hasUnrelated = false;

  for (const relation of relations) {
    if (relation === "selected") {
      return "selected";
    }

    if (relation === "upstream") {
      hasUpstream = true;
      continue;
    }

    if (relation === "downstream") {
      hasDownstream = true;
      continue;
    }

    if (relation === "unrelated") {
      hasUnrelated = true;
    }
  }

  if (hasUpstream) {
    return "upstream";
  }

  if (hasDownstream) {
    return "downstream";
  }

  if (hasUnrelated) {
    return "unrelated";
  }

  return "idle";
}

function getInspectHeaderStyle(
  baseStyle: CSSProperties,
  relation: InspectRelation
): CSSProperties {
  if (relation === "unrelated") {
    return {
      ...baseStyle,
      opacity: 0.4,
      filter: "saturate(0.72)",
    };
  }

  if (relation === "selected") {
    return {
      ...baseStyle,
      color: text.primary,
    };
  }

  if (relation === "upstream") {
    return {
      ...baseStyle,
      color: "#7dd3fc",
    };
  }

  if (relation === "downstream") {
    return {
      ...baseStyle,
      color: "#fcd34d",
    };
  }

  return baseStyle;
}

function InspectableContainer({
  nodeId,
  relation = "idle",
  onSelect,
  baseStyle,
  children,
}: {
  nodeId?: InspectNodeId;
  relation?: InspectRelation;
  onSelect?: (nodeId: InspectNodeId) => void;
  baseStyle: CSSProperties;
  children: ReactNode;
}) {
  const aggregate = useContext(SandboxInspectAggregateContext);
  const aggregateChildId = useId();

  useEffect(() => {
    aggregate?.reportChildRelation(aggregateChildId, relation);

    return () => {
      aggregate?.reportChildRelation(aggregateChildId, "idle");
    };
  }, [aggregate, aggregateChildId, relation]);

  return (
    <div
      data-sandbox-inspect-node-id={nodeId}
      style={getInspectContainerStyle(baseStyle, relation)}
      onClick={
        nodeId && onSelect
          ? (event) => {
              event.stopPropagation();
              onSelect(nodeId);
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

function TokenInventoryColumn({
  title,
  recipeLabel,
  items,
  tokenOverrides,
  onSelectTokenItem,
}: {
  title: string;
  recipeLabel: string;
  items: readonly TokenInventoryItem[];
  tokenOverrides: Record<string, string>;
  onSelectTokenItem: (nodeId: InspectNodeId, editor: ActiveTokenOverrideEditor | null) => void;
}) {
  const inspect = useContext(SandboxInspectContext);

  return (
    <PreviewCard
      title={title}
      recipeLabel={recipeLabel}
      contentStyle={{ display: "grid", gap: 8, width: "100%", minWidth: 0 }}
    >
      <div style={tokenColumnStyle}>
        {items.map((item) => (
          <InspectableContainer
            key={item.meta.label}
            nodeId={item.meta.label}
            relation={inspect.getInspectRelation(item.meta.label)}
            onSelect={(nodeId) => {
              const tokenVar = item.tokenVar ?? getTokenVariableName(item.meta.label);

              onSelectTokenItem(
                nodeId,
                tokenVar
                  ? {
                      tokenVar,
                      label: item.label,
                      hint: item.hint,
                    }
                  : null
              );
            }}
            baseStyle={inspectableContainerBaseStyle}
          >
            {(() => {
              const tokenVar = item.tokenVar ?? getTokenVariableName(item.meta.label);
              const hasDirectOverride = tokenVar ? tokenOverrides[tokenVar] !== undefined : false;
              const chipStyle: CSSProperties = {
                ...tokenChipStyle,
                ...item.swatchStyle,
              };

              if (tokenVar && item.meta.family === "token") {
                if (item.meta.variant === "surface") {
                  chipStyle.background = `var(${tokenVar})`;
                }

                if (item.meta.variant === "border") {
                  chipStyle.borderColor = `var(${tokenVar})`;
                }

                if (item.meta.variant === "text") {
                  chipStyle.color = `var(${tokenVar})`;
                }

                if (item.meta.variant === "treatment") {
                  if (item.meta.subtype === "focus") {
                    chipStyle.boxShadow = `0 0 0 3px var(${tokenVar}) inset`;
                  } else if (item.meta.subtype === "loading" || item.meta.subtype === "disabled") {
                    chipStyle.opacity = `var(${tokenVar})`;
                  } else if (item.meta.subtype === "error") {
                    chipStyle.borderColor = `var(${tokenVar})`;
                  } else {
                    chipStyle.background = `var(${tokenVar})`;
                  }
                }
              }

              return (
            <div
              style={tokenItemStyle}
              {...getDesignSystemDebugAttrs(item.meta)}
            >
              <div
                style={
                  item.unframedSwatch
                    ? {
                        width: item.swatchContainerStyle?.width ?? 54,
                        height: item.swatchContainerStyle?.height ?? 24,
                        display: "grid",
                        placeItems: "center",
                        ...(item.swatchContainerStyle ?? null),
                      }
                    : chipStyle
                }
              >
                {item.swatchContent}
              </div>
              <div style={tokenTextStackStyle}>
                <div style={tokenNameStyle}>{item.label}</div>
                <div style={tokenHintStyle}>{item.hint}</div>
              </div>
              {hasDirectOverride ? (
                <span style={tokenOverrideIndicatorStyle} title={`Override set for ${tokenVar}`}>
                  OVR
                </span>
              ) : null}
            </div>
              );
            })()}
          </InspectableContainer>
        ))}
      </div>
    </PreviewCard>
  );
}

function ParticipantColorSelectorRow({
  selectedSlot,
  onSelectSlot,
}: {
  selectedSlot: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  onSelectSlot: (slot: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => void;
}) {
  return (
    <div style={participantSelectorRowStyle}>
      {participantColorInventory.map((item, index) => {
        const slot = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
        const isActive = selectedSlot === slot;

        return (
          <div
            key={item.meta.label}
          >
            <button
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                onSelectSlot(slot);
              }}
              style={{
                ...participantSelectorButtonStyle,
                borderColor: isActive ? "rgba(226, 232, 240, 0.9)" : participantSelectorButtonStyle.borderColor,
                boxShadow: isActive ? "0 0 0 2px rgba(226, 232, 240, 0.18)" : "none",
                background: isActive ? surface.inset : participantSelectorButtonStyle.background,
              }}
              {...getDesignSystemDebugAttrs(item.meta)}
            >
              <div
                style={{
                  ...participantSelectorSwatchStyle,
                  background: item.hint,
                  borderColor: item.hint,
                }}
              />
              <div style={participantSelectorTextStyle}>
                <div style={participantSelectorNameStyle}>{item.label}</div>
                <div style={participantSelectorValueStyle}>{item.hint}</div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const aggregate = useContext(SandboxInspectAggregateContext);
  const aggregateId = useId();
  const [childRelations, setChildRelations] = useState<Record<string, InspectRelation>>({});

  const headerRelation = useMemo(
    () => getAggregateInspectRelation(Object.values(childRelations)),
    [childRelations]
  );

  useEffect(() => {
    aggregate?.reportChildRelation(aggregateId, headerRelation);

    return () => {
      aggregate?.reportChildRelation(aggregateId, "idle");
    };
  }, [aggregate, aggregateId, headerRelation]);

  const aggregateValue = useMemo(
    () => ({
      reportChildRelation: (childId: string, relation: InspectRelation) => {
        setChildRelations((current) => {
          if (current[childId] === relation) {
            return current;
          }

          return {
            ...current,
            [childId]: relation,
          };
        });
      },
    }),
    []
  );

  return (
    <SandboxInspectAggregateContext.Provider value={aggregateValue}>
      <section
        className={surfaceRecipes.panel.default.className}
        style={surfaceRecipes.panel.default.style}
        {...getDesignSystemDebugAttrs(surfaceRecipes.panel.default.debug)}
      >
        <div style={sectionGridStyle}>
          <div style={headerGridStyle}>
            <div style={getInspectHeaderStyle(sectionHeadingStyle, headerRelation)}>
              {title}
            </div>
            <div style={getInspectHeaderStyle(sectionDescriptionStyle, headerRelation)}>
              {description}
            </div>
          </div>
          {children}
        </div>
      </section>
    </SandboxInspectAggregateContext.Provider>
  );
}

function PreviewCard({
  title,
  recipeLabel,
  contentStyle,
  children,
}: {
  title: string;
  recipeLabel: string;
  contentStyle?: CSSProperties;
  children: ReactNode;
}) {
  const aggregate = useContext(SandboxInspectAggregateContext);
  const aggregateId = useId();
  const [childRelations, setChildRelations] = useState<Record<string, InspectRelation>>({});

  const headerRelation = useMemo(
    () => getAggregateInspectRelation(Object.values(childRelations)),
    [childRelations]
  );

  useEffect(() => {
    aggregate?.reportChildRelation(aggregateId, headerRelation);

    return () => {
      aggregate?.reportChildRelation(aggregateId, "idle");
    };
  }, [aggregate, aggregateId, headerRelation]);

  const aggregateValue = useMemo(
    () => ({
      reportChildRelation: (childId: string, relation: InspectRelation) => {
        setChildRelations((current) => {
          if (current[childId] === relation) {
            return current;
          }

          return {
            ...current,
            [childId]: relation,
          };
        });
      },
    }),
    []
  );

  return (
    <SandboxInspectAggregateContext.Provider value={aggregateValue}>
      <div
        className={surfaceRecipes.inset.default.className}
        style={{
          ...surfaceRecipes.inset.default.style,
          width: "100%",
          minWidth: 0,
        }}
        {...getDesignSystemDebugAttrs(surfaceRecipes.inset.default.debug)}
      >
        <div style={getInspectHeaderStyle(cardTitleStyle, headerRelation)}>{title}</div>
        <DebugLabel>
          <span style={getInspectHeaderStyle(inlineTextRecipes.muted.style, headerRelation)}>
            {recipeLabel}
          </span>
        </DebugLabel>
        <div style={contentStyle ?? controlStackStyle}>{children}</div>
      </div>
    </SandboxInspectAggregateContext.Provider>
  );
}

function ContextMenuSandboxPreview() {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const sampleItems: ContextMenuItem[] = [
    {
      type: "section-label",
      id: "board-section",
      label: "Board",
    },
    {
      type: "item",
      id: "center-board",
      label: "Center board",
      onSelect: () => {},
      shortcut: "C",
    },
    {
      type: "separator",
      id: "board-token-separator",
    },
    {
      type: "section-label",
      id: "token-section",
      label: "Token",
    },
    {
      type: "item",
      id: "selected-glyph",
      label: "Filled circle",
      onSelect: () => {},
      selected: true,
    },
    {
      type: "item",
      id: "disabled-glyph",
      label: "Locked action",
      onSelect: () => {},
      disabled: true,
    },
    {
      type: "separator",
      id: "danger-separator",
    },
    {
      type: "item",
      id: "delete-object",
      label: "Delete object",
      onSelect: () => {},
      variant: "destructive",
      shortcut: "⌫",
    },
  ];

  return (
    <PreviewCard
      title="Menu states"
      recipeLabel="context-menu / shell-item-section-separator"
    >
      <button
        ref={triggerRef}
        type="button"
        {...getButtonProps(buttonRecipes.secondary.compact, {
          open: anchorPoint !== null,
        })}
        onClick={(event) => {
          event.stopPropagation();
          const rect = triggerRef.current?.getBoundingClientRect();

          setAnchorPoint(
            rect
              ? {
                  x: rect.left,
                  y: rect.bottom + 6,
                }
              : {
                  x: event.clientX,
                  y: event.clientY,
                }
          );
        }}
      >
        Open sample menu
      </button>
      <div style={sectionDescriptionStyle}>
        Covers item, selected, disabled, destructive, separator, and section label
        states.
      </div>
      <ContextMenu
        anchorPoint={anchorPoint}
        ariaLabel="Context menu sandbox"
        items={sampleItems}
        onClose={() => {
          setAnchorPoint(null);
        }}
      />
    </PreviewCard>
  );
}

type ContextMenuPreviewState = "default" | "hover" | "active" | "focus-visible";

function getStaticContextMenuShellStyle(width = 220): CSSProperties {
  return {
    ...contextMenuRecipes.shell.style,
    position: "relative",
    left: "auto",
    top: "auto",
    zIndex: "auto",
    minWidth: width,
    maxWidth: width,
    boxSizing: "border-box",
  };
}

function StaticContextMenuItemPreview({
  label,
  align,
  disabled = false,
  focusScope = "in-focus",
  icon,
  labelStyle,
  previewState = "default",
  selected = false,
  shortcut,
  variant = "default",
}: {
  label: ReactNode;
  align?: "start" | "center";
  disabled?: boolean;
  focusScope?: "in-focus" | "out-of-focus";
  icon?: ReactNode;
  labelStyle?: CSSProperties;
  previewState?: ContextMenuPreviewState;
  selected?: boolean;
  shortcut?: ReactNode;
  variant?: "default" | "destructive";
}) {
  const isCentered = align === "center";

  return (
    <button
      type="button"
      disabled={disabled}
      data-ui-focus-scope={focusScope === "out-of-focus" ? "out-of-focus" : undefined}
      data-ui-preview-state={previewState === "default" ? undefined : previewState}
      data-ui-selected={selected ? "true" : undefined}
      data-ui-variant={variant}
      className={contextMenuRecipes.item.className}
      style={{
        ...contextMenuRecipes.item.style,
        gridTemplateColumns:
          icon || shortcut || selected
            ? "auto minmax(0, 1fr) auto"
            : "minmax(0, 1fr)",
        justifyItems: isCentered ? "center" : "stretch",
        textAlign: isCentered ? "center" : "left",
      }}
      {...getDesignSystemDebugAttrs(contextMenuRecipes.item.debug)}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span
        style={{
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          ...labelStyle,
        }}
      >
        {label}
      </span>
      {shortcut || selected ? <span aria-hidden="true">{shortcut ?? "✓"}</span> : null}
    </button>
  );
}

function StaticContextMenuGridItemPreview({
  label,
  disabled = false,
  focusScope = "in-focus",
  previewState = "default",
  selected = false,
  variant = "default",
}: {
  label: ReactNode;
  disabled?: boolean;
  focusScope?: "in-focus" | "out-of-focus";
  previewState?: ContextMenuPreviewState;
  selected?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      data-ui-focus-scope={focusScope === "out-of-focus" ? "out-of-focus" : undefined}
      data-ui-preview-state={previewState === "default" ? undefined : previewState}
      data-ui-selected={selected ? "true" : undefined}
      data-ui-variant={variant}
      className={contextMenuRecipes.gridItem.className}
      style={contextMenuRecipes.gridItem.style}
      {...getDesignSystemDebugAttrs(contextMenuRecipes.gridItem.debug)}
    >
      {label}
    </button>
  );
}

function StaticContextMenuSectionLabel({
  children,
  isGrid = false,
}: {
  children: ReactNode;
  isGrid?: boolean;
}) {
  return (
    <div
      className={contextMenuRecipes.sectionLabel.className}
      style={{
        ...contextMenuRecipes.sectionLabel.style,
        gridColumn: isGrid ? "1 / -1" : undefined,
      }}
      {...getDesignSystemDebugAttrs(contextMenuRecipes.sectionLabel.debug)}
    >
      {children}
    </div>
  );
}

function StaticContextMenuSeparator({ isGrid = false }: { isGrid?: boolean }) {
  return (
    <div
      role="separator"
      className={contextMenuRecipes.separator.className}
      style={{
        ...contextMenuRecipes.separator.style,
        gridColumn: isGrid ? "1 / -1" : undefined,
      }}
      {...getDesignSystemDebugAttrs(contextMenuRecipes.separator.debug)}
    />
  );
}

function StaticContextMenuShell({ children }: { children: ReactNode }) {
  return (
    <div
      className={contextMenuRecipes.shell.className}
      style={getStaticContextMenuShellStyle()}
      {...getDesignSystemDebugAttrs(contextMenuRecipes.shell.debug)}
    >
      {children}
    </div>
  );
}

function StaticContextMenuGridShell({ children }: { children: ReactNode }) {
  return (
    <div
      className={contextMenuRecipes.shell.className}
      style={{
        ...getStaticContextMenuShellStyle(228),
        display: "grid",
        gap: 5,
        gridTemplateColumns: "repeat(5, 38px)",
      }}
      {...getDesignSystemDebugAttrs(contextMenuRecipes.shell.debug)}
    >
      {children}
    </div>
  );
}

function ContextMenuStateCoveragePreview() {
  return (
    <>
      <PreviewCard
        title="Action item states"
        recipeLabel="context-menu / item / default-state-coverage"
      >
        <StaticContextMenuShell>
          <StaticContextMenuItemPreview label="Default" />
          <StaticContextMenuItemPreview label="Hover" previewState="hover" />
          <StaticContextMenuItemPreview label="Active" previewState="active" />
          <StaticContextMenuItemPreview
            label="Focus visible"
            previewState="focus-visible"
          />
          <StaticContextMenuItemPreview label="Selected" selected />
          <StaticContextMenuItemPreview
            label="Selected hover"
            selected
            previewState="hover"
          />
          <StaticContextMenuItemPreview
            label="Active out of focus"
            focusScope="out-of-focus"
            previewState="active"
          />
          <StaticContextMenuItemPreview
            label="Selected out of focus"
            focusScope="out-of-focus"
            selected
          />
          <StaticContextMenuItemPreview label="Disabled" disabled />
        </StaticContextMenuShell>
      </PreviewCard>

      <PreviewCard
        title="Destructive item states"
        recipeLabel="context-menu / item / destructive-state-coverage"
      >
        <StaticContextMenuShell>
          <StaticContextMenuItemPreview
            label="Destructive default"
            variant="destructive"
          />
          <StaticContextMenuItemPreview
            label="Destructive hover"
            variant="destructive"
            previewState="hover"
          />
          <StaticContextMenuItemPreview
            label="Destructive active"
            variant="destructive"
            previewState="active"
          />
          <StaticContextMenuItemPreview
            label="Destructive focus"
            variant="destructive"
            previewState="focus-visible"
          />
          <StaticContextMenuItemPreview
            label="Destructive disabled"
            variant="destructive"
            disabled
          />
        </StaticContextMenuShell>
      </PreviewCard>

      <PreviewCard
        title="Item slots and alignment"
        recipeLabel="context-menu / item / icon-shortcut-glyph-long-label"
      >
        <StaticContextMenuShell>
          <StaticContextMenuItemPreview label="With icon" icon="＋" />
          <StaticContextMenuItemPreview label="With shortcut" shortcut="⌘K" />
          <StaticContextMenuItemPreview
            label="Icon and shortcut"
            icon="●"
            shortcut="G"
          />
          <StaticContextMenuItemPreview
            label="▲"
            align="center"
            labelStyle={{
              fontSize: 18,
              lineHeight: 1,
            }}
          />
          <StaticContextMenuItemPreview
            label="Very long item label that should truncate inside the menu shell"
            shortcut="⌫"
          />
        </StaticContextMenuShell>
      </PreviewCard>

      <PreviewCard
        title="Structural rows"
        recipeLabel="context-menu / section-label-separator"
      >
        <StaticContextMenuShell>
          <StaticContextMenuSectionLabel>Board</StaticContextMenuSectionLabel>
          <StaticContextMenuItemPreview label="Center board" />
          <StaticContextMenuSeparator />
          <StaticContextMenuSectionLabel>Token</StaticContextMenuSectionLabel>
          <StaticContextMenuItemPreview label="Filled circle" selected />
          <StaticContextMenuSeparator />
          <StaticContextMenuItemPreview
            label="Delete object"
            variant="destructive"
            shortcut="⌫"
          />
        </StaticContextMenuShell>
      </PreviewCard>
    </>
  );
}

function ContextMenuGridLayoutPreview() {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const iconItems: ContextMenuItem[] = [
    ...["☻", "☺", "☹", "★", "✦"].map((glyph, index) => ({
      type: "item" as const,
      id: `icon-grid-face-${index}`,
      label: glyph,
      ariaLabel: `Icon ${glyph}`,
      onSelect: () => {},
      selected: glyph === "★",
    })),
    {
      type: "separator",
      id: "icon-grid-separator",
    },
    ...["●", "■", "▲", "▼", "◆"].map((glyph, index) => ({
      type: "item" as const,
      id: `icon-grid-shape-${index}`,
      label: glyph,
      ariaLabel: `Icon ${glyph}`,
      onSelect: () => {},
    })),
  ];

  return (
    <>
      <PreviewCard
        title="Grid popup"
        recipeLabel="context-menu / grid-layout / interactive"
      >
        <button
          ref={triggerRef}
          type="button"
          {...getButtonProps(buttonRecipes.secondary.compact, {
            open: anchorPoint !== null,
          })}
          onClick={(event) => {
            event.stopPropagation();
            const rect = triggerRef.current?.getBoundingClientRect();

            setAnchorPoint(
              rect
                ? {
                    x: rect.left,
                    y: rect.bottom + 6,
                  }
                : {
                    x: event.clientX,
                    y: event.clientY,
                  }
            );
          }}
        >
          Open icon grid
        </button>
        <div style={sectionDescriptionStyle}>
          Square items for large icon or glyph sets.
        </div>
        <ContextMenu
          anchorPoint={anchorPoint}
          ariaLabel="Icon grid context menu sandbox"
          gridColumnCount={5}
          items={iconItems}
          layout="grid"
          maxWidth={228}
          minWidth={228}
          onClose={() => {
            setAnchorPoint(null);
          }}
        />
      </PreviewCard>

      <PreviewCard
        title="Grid item states"
        recipeLabel="context-menu / grid-item / state-coverage"
      >
        <StaticContextMenuGridShell>
          <StaticContextMenuGridItemPreview label="○" />
          <StaticContextMenuGridItemPreview label="●" previewState="hover" />
          <StaticContextMenuGridItemPreview label="■" previewState="active" />
          <StaticContextMenuGridItemPreview
            label="▲"
            previewState="focus-visible"
          />
          <StaticContextMenuGridItemPreview label="▼" selected />
          <StaticContextMenuSeparator isGrid />
          <StaticContextMenuGridItemPreview
            label="◆"
            focusScope="out-of-focus"
            selected
          />
          <StaticContextMenuGridItemPreview label="★" disabled />
          <StaticContextMenuGridItemPreview
            label="✕"
            variant="destructive"
          />
          <StaticContextMenuGridItemPreview
            label="✕"
            variant="destructive"
            previewState="hover"
          />
          <StaticContextMenuGridItemPreview
            label="✕"
            variant="destructive"
            disabled
          />
        </StaticContextMenuGridShell>
      </PreviewCard>
    </>
  );
}

function ButtonPreview({
  recipe,
  state,
  label,
  buttonChildren,
  inspectNodeId,
  inspectRelation,
  onInspectSelect,
}: {
  recipe: ButtonRecipe;
  state?: PreviewButtonState;
  label: string;
  buttonChildren?: ReactNode;
} & InspectableProps) {
  const inspect = useContext(SandboxInspectContext);
  const previewProps = getPreviewButtonProps(recipe, state);
  const resolvedInspectNodeId =
    inspectNodeId ?? buildPreviewInspectNodeId(recipe.debug, label);

  return (
    <InspectableContainer
      nodeId={resolvedInspectNodeId}
      relation={inspectRelation ?? inspect.getInspectRelation(resolvedInspectNodeId)}
      onSelect={onInspectSelect ?? inspect.onInspectSelect}
      baseStyle={inspectableContainerBaseStyle}
    >
      <div style={controlStackStyle}>
        <div style={fieldLabelStyle}>{label}</div>
        <button type="button" {...previewProps} {...getDesignSystemDebugAttrs(recipe.debug)}>
          {state?.loading ? "Loading…" : buttonChildren ?? "Example action"}
        </button>
      </div>
    </InspectableContainer>
  );
}

function LiveButtonPreview({
  recipe,
  label,
  children = "Example action",
  inspectNodeId,
  inspectRelation,
  onInspectSelect,
}: {
  recipe: ButtonRecipe;
  label: string;
  children?: ReactNode;
} & InspectableProps) {
  const inspect = useContext(SandboxInspectContext);
  const [clickCount, setClickCount] = useState(0);
  const resolvedInspectNodeId =
    inspectNodeId ?? buildPreviewInspectNodeId(recipe.debug, label);

  return (
    <InspectableContainer
      nodeId={resolvedInspectNodeId}
      relation={inspectRelation ?? inspect.getInspectRelation(resolvedInspectNodeId)}
      onSelect={onInspectSelect ?? inspect.onInspectSelect}
      baseStyle={inspectableContainerBaseStyle}
    >
      <div style={controlStackStyle}>
        <div style={fieldLabelStyle}>{label}</div>
        <button
          type="button"
          {...getButtonProps(recipe)}
          {...getDesignSystemDebugAttrs(recipe.debug)}
          onClick={() => {
            setClickCount((value) => value + 1);
          }}
        >
          {children}
        </button>
        <DebugLabel>Clicks: {clickCount}</DebugLabel>
      </div>
    </InspectableContainer>
  );
}

function LiveDraftLocalUserButtonPreview({
  baseRecipe,
  slot,
  mode,
  label,
  children,
  sourceSlotLabel,
  inspectNodeId,
  inspectRelation,
  onInspectSelect,
}: {
  baseRecipe: ButtonRecipe;
  slot: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  mode: "fill" | "border";
  label: string;
  children: ReactNode;
  sourceSlotLabel: string;
} & InspectableProps) {
  const inspect = useContext(SandboxInspectContext);
  const [clickCount, setClickCount] = useState(0);
  const recipe = createDraftLocalUserButtonRecipeForSlot(baseRecipe, slot, mode);
  const resolvedInspectNodeId =
    inspectNodeId ??
    buildPreviewInspectNodeId(
      { ...recipe.debug, subtype: `${recipe.debug.subtype ?? "localUser"}:${mode}` },
      label
    );

  return (
    <InspectableContainer
      nodeId={resolvedInspectNodeId}
      relation={inspectRelation ?? inspect.getInspectRelation(resolvedInspectNodeId)}
      onSelect={onInspectSelect ?? inspect.onInspectSelect}
      baseStyle={inspectableContainerBaseStyle}
    >
      <div style={controlStackStyle}>
        <div style={fieldLabelStyle}>{label}</div>
        <button
          type="button"
          {...getButtonProps(recipe)}
          {...getDesignSystemDebugAttrs(recipe.debug)}
          onClick={() => {
            setClickCount((value) => value + 1);
          }}
        >
          {children}
        </button>
        <DebugLabel>{sourceSlotLabel}</DebugLabel>
        <DebugLabel>Clicks: {clickCount}</DebugLabel>
      </div>
    </InspectableContainer>
  );
}

function TextButtonPreview({
  label,
  tone,
  state,
  inspectNodeId,
  inspectRelation,
  onInspectSelect,
}: {
  label: string;
  tone: "muted" | "secondary" | "danger";
  state?: PreviewButtonState;
} & InspectableProps) {
  const inspect = useContext(SandboxInspectContext);
  const recipe = createTextButtonRecipe(buttonRecipes.secondary.compact, tone);
  const previewProps = getPreviewButtonProps(recipe, state);
  const resolvedInspectNodeId =
    inspectNodeId ?? buildPreviewInspectNodeId(recipe.debug, `${tone}:${label}`);

  return (
    <InspectableContainer
      nodeId={resolvedInspectNodeId}
      relation={inspectRelation ?? inspect.getInspectRelation(resolvedInspectNodeId)}
      onSelect={onInspectSelect ?? inspect.onInspectSelect}
      baseStyle={inspectableContainerBaseStyle}
    >
      <div style={controlStackStyle}>
        <div style={fieldLabelStyle}>{label}</div>
        <button type="button" {...previewProps} {...getDesignSystemDebugAttrs(recipe.debug)}>
          Inline action
        </button>
      </div>
    </InspectableContainer>
  );
}

function LiveTextButtonPreview({
  label,
  tone,
  inspectNodeId,
  inspectRelation,
  onInspectSelect,
}: {
  label: string;
  tone: "muted" | "secondary" | "danger";
} & InspectableProps) {
  const inspect = useContext(SandboxInspectContext);
  const [clickCount, setClickCount] = useState(0);
  const recipe = createTextButtonRecipe(buttonRecipes.secondary.compact, tone);
  const resolvedInspectNodeId =
    inspectNodeId ?? buildPreviewInspectNodeId(recipe.debug, `${tone}:${label}`);

  return (
    <InspectableContainer
      nodeId={resolvedInspectNodeId}
      relation={inspectRelation ?? inspect.getInspectRelation(resolvedInspectNodeId)}
      onSelect={onInspectSelect ?? inspect.onInspectSelect}
      baseStyle={inspectableContainerBaseStyle}
    >
      <div style={controlStackStyle}>
        <div style={fieldLabelStyle}>{label}</div>
        <button
          type="button"
          {...getButtonProps(recipe)}
          {...getDesignSystemDebugAttrs(recipe.debug)}
          onClick={() => {
            setClickCount((value) => value + 1);
          }}
        >
          Inline action
        </button>
        <DebugLabel>Clicks: {clickCount}</DebugLabel>
      </div>
    </InspectableContainer>
  );
}

function FieldPreview({
  label,
  recipe,
  state,
  mode = "input",
  inspectNodeId,
  inspectRelation,
  onInspectSelect,
}: {
  label: string;
  recipe: (typeof fieldRecipes)["default"] | (typeof fieldRecipes)["small"];
  state?: PreviewFieldState;
  mode?: "input" | "select";
} & InspectableProps) {
  const inspect = useContext(SandboxInspectContext);
  const shellProps = getPreviewFieldShellStyle(recipe, state);
  const resolvedInspectNodeId =
    inspectNodeId ?? buildPreviewInspectNodeId(recipe.shell.debug ?? {}, label);

  return (
    <InspectableContainer
      nodeId={resolvedInspectNodeId}
      relation={inspectRelation ?? inspect.getInspectRelation(resolvedInspectNodeId)}
      onSelect={onInspectSelect ?? inspect.onInspectSelect}
      baseStyle={inspectableContainerBaseStyle}
    >
      <div style={controlStackStyle}>
        <div style={fieldLabelStyle}>{label}</div>
        <div
          {...shellProps}
          {...getDesignSystemDebugAttrs(recipe.shell.debug)}
        >
          {mode === "select" && recipe.select ? (
            <select
              className={recipe.select.className}
              style={recipe.select.style}
              disabled={state?.disabled}
              defaultValue="alpha"
            >
              <option value="alpha">Alpha room</option>
              <option value="beta">Beta room</option>
            </select>
          ) : (
            <input
              className={recipe.input.className}
              style={recipe.input.style}
              disabled={state?.disabled}
              defaultValue={state?.invalid ? "Blocked name" : "Player name"}
              aria-invalid={state?.invalid ? "true" : undefined}
            />
          )}
        </div>
      </div>
    </InspectableContainer>
  );
}

function LiveSwatchPreview({
  label,
  recipe,
  participantColorSlot,
  inspectNodeId,
  inspectRelation,
  onInspectSelect,
}: {
  label: string;
  recipe: SwatchRecipe;
  participantColorSlot: number;
} & InspectableProps) {
  const inspect = useContext(SandboxInspectContext);
  const [selected, setSelected] = useState(false);
  const swatchProps = getSwatchButtonProps(recipe, {
    participantColorSlot,
    selected,
  });
  const resolvedInspectNodeId =
    inspectNodeId ?? buildPreviewInspectNodeId(recipe.debug, label);

  return (
    <InspectableContainer
      nodeId={resolvedInspectNodeId}
      relation={inspectRelation ?? inspect.getInspectRelation(resolvedInspectNodeId)}
      onSelect={onInspectSelect ?? inspect.onInspectSelect}
      baseStyle={inspectableContainerBaseStyle}
    >
      <div style={controlStackStyle}>
        <div style={fieldLabelStyle}>{label}</div>
        <button
          type="button"
          aria-label={label}
          {...swatchProps}
          {...getDesignSystemDebugAttrs(recipe.debug)}
          onClick={() => {
            setSelected((value) => !value);
          }}
        />
        <DebugLabel>{selected ? "Selected" : "Unselected"}</DebugLabel>
      </div>
    </InspectableContainer>
  );
}

function SwatchPreview({
  label,
  recipe,
  state,
  inspectNodeId,
  inspectRelation,
  onInspectSelect,
}: {
  label: string;
  recipe: SwatchRecipe;
  state: PreviewSwatchState;
} & InspectableProps) {
  const inspect = useContext(SandboxInspectContext);
  const swatchProps = getPreviewSwatchProps(recipe, state);
  const freezeInteractiveState =
    !!state.hover ||
    !!state.focusVisible ||
    !!state.occupied ||
    !!state.pending ||
    !!state.disabled;
  const resolvedInspectNodeId =
    inspectNodeId ?? buildPreviewInspectNodeId(recipe.debug, label);

  return (
    <InspectableContainer
      nodeId={resolvedInspectNodeId}
      relation={inspectRelation ?? inspect.getInspectRelation(resolvedInspectNodeId)}
      onSelect={onInspectSelect ?? inspect.onInspectSelect}
      baseStyle={inspectableContainerBaseStyle}
    >
      <div style={controlStackStyle}>
        <div style={fieldLabelStyle}>{label}</div>
        <button
          type="button"
          aria-label={label}
          {...swatchProps}
          style={{
            ...swatchProps.style,
            pointerEvents: freezeInteractiveState ? "none" : swatchProps.style.pointerEvents,
          }}
          {...getDesignSystemDebugAttrs(recipe.debug)}
        />
      </div>
    </InspectableContainer>
  );
}

function LiveCanvasButtonPreview({
  label,
  recipe,
  resolveScope,
  inspectNodeId,
  inspectRelation,
  onInspectSelect,
}: {
  label: string;
  recipe: ButtonRecipe;
  resolveScope?: Element | null;
} & InspectableProps) {
  const inspect = useContext(SandboxInspectContext);
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const tone = resolveCanvasButtonTone(recipe, {
    hover,
    active,
  }, resolveScope);
  const metrics = resolveCanvasButtonMetrics(recipe);
  const width = Math.max(
    metrics.minWidth ?? 0,
    Math.ceil(label.length * metrics.fontSize * 0.62 + metrics.paddingX * 2)
  );
  const height = metrics.minHeight;
  const textCenterY = height / 2 + metrics.fontSize * 0.08;
  const radiusValue = Math.min(height / 2, metrics.borderRadius);
  const resolvedInspectNodeId =
    inspectNodeId ?? buildPreviewInspectNodeId(recipe.debug, label);

  return (
    <InspectableContainer
      nodeId={resolvedInspectNodeId}
      relation={inspectRelation ?? inspect.getInspectRelation(resolvedInspectNodeId)}
      onSelect={onInspectSelect ?? inspect.onInspectSelect}
      baseStyle={inspectableContainerBaseStyle}
    >
      <div style={controlStackStyle}>
        <div style={fieldLabelStyle}>{label}</div>
        <button
          type="button"
          onClick={() => {
            setClickCount((value) => value + 1);
          }}
          onMouseEnter={() => {
            setHover(true);
          }}
          onMouseLeave={() => {
            setHover(false);
            setActive(false);
          }}
          onMouseDown={() => {
            setActive(true);
          }}
          onMouseUp={() => {
            setActive(false);
          }}
          onBlur={() => {
            setActive(false);
            setHover(false);
          }}
          style={{
            padding: 0,
            border: 0,
            background: "transparent",
            cursor: "pointer",
          }}
          {...getDesignSystemDebugAttrs(recipe.debug)}
        >
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={label}
          >
            <rect
              x="0.5"
              y="0.5"
              width={width - 1}
              height={height - 1}
              rx={radiusValue}
              fill={tone.fill}
              stroke={tone.stroke}
            />
            <text
              x={width / 2}
              y={textCenterY}
              fill={tone.textColor}
              fontFamily={metrics.fontFamily}
              fontSize={metrics.fontSize}
              fontWeight={String(metrics.fontWeight)}
              dominantBaseline="middle"
              textAnchor="middle"
            >
              {label}
            </text>
          </svg>
        </button>
        <DebugLabel>Clicks: {clickCount}</DebugLabel>
      </div>
    </InspectableContainer>
  );
}

function CanvasButtonPreview({
  label,
  recipe,
  state,
  resolveScope,
  inspectNodeId,
  inspectRelation,
  onInspectSelect,
}: {
  label: string;
  recipe: ButtonRecipe;
  state?: PreviewButtonState;
  resolveScope?: Element | null;
} & InspectableProps) {
  const inspect = useContext(SandboxInspectContext);
  const tone = resolveCanvasButtonTone(recipe, {
    disabled: state?.disabled,
    selected: state?.selected,
    open: state?.open,
    hover: state?.hover,
    active: state?.active,
  }, resolveScope);
  const metrics = resolveCanvasButtonMetrics(recipe);
  const width = Math.max(
    metrics.minWidth ?? 0,
    Math.ceil(label.length * metrics.fontSize * 0.62 + metrics.paddingX * 2)
  );
  const height = metrics.minHeight;
  const outerInset = state?.focusVisible ? 4 : 0;
  const svgWidth = width + outerInset * 2;
  const svgHeight = height + outerInset * 2;
  const textCenterY = outerInset + height / 2 + metrics.fontSize * 0.08;
  const radiusValue = Math.min(height / 2, metrics.borderRadius);
  const resolvedInspectNodeId =
    inspectNodeId ?? buildPreviewInspectNodeId(recipe.debug, label);

  return (
    <InspectableContainer
      nodeId={resolvedInspectNodeId}
      relation={inspectRelation ?? inspect.getInspectRelation(resolvedInspectNodeId)}
      onSelect={onInspectSelect ?? inspect.onInspectSelect}
      baseStyle={inspectableContainerBaseStyle}
    >
      <div style={controlStackStyle}>
        <div style={fieldLabelStyle}>{label}</div>
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="img"
          aria-label={label}
          {...getDesignSystemDebugAttrs(recipe.debug)}
        >
          {state?.focusVisible ? (
            <rect
              x="1.5"
              y="1.5"
              width={svgWidth - 3}
              height={svgHeight - 3}
              rx={radiusValue + 3}
              fill="none"
              stroke={focusRing.default}
              strokeWidth="3"
            />
          ) : null}
          <rect
            x={outerInset + 0.5}
            y={outerInset + 0.5}
            width={width - 1}
            height={height - 1}
            rx={radiusValue}
            fill={tone.fill}
            stroke={tone.stroke}
          />
          <text
            x={svgWidth / 2}
            y={textCenterY}
            fill={tone.textColor}
            fontFamily={metrics.fontFamily}
            fontSize={metrics.fontSize}
            fontWeight={String(metrics.fontWeight)}
            dominantBaseline="middle"
            textAnchor="middle"
          >
            {label}
          </text>
        </svg>
      </div>
    </InspectableContainer>
  );
}

export function DesignSystemSandboxPage() {
  const [selectedInspectNodeId, setSelectedInspectNodeId] =
    useState<InspectNodeId | null>(null);
  const [selectedDraftLocalUserSlot, setSelectedDraftLocalUserSlot] = useState<
    1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  >(DRAFT_LOCAL_USER_SOURCE_SLOT);
  const [tokenOverrides, setTokenOverrides] = useState<Record<string, string>>({});
  const [activeTokenOverrideEditor, setActiveTokenOverrideEditor] =
    useState<ActiveTokenOverrideEditor | null>(null);
  const [tokenOverrideDraft, setTokenOverrideDraft] = useState("");
  const [activeTokenEffectiveValue, setActiveTokenEffectiveValue] = useState("");
  const pageShellRef = useRef<HTMLDivElement | null>(null);
  const pageContentRef = useRef<HTMLDivElement | null>(null);
  const [pageContentElement, setPageContentElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousRootHeight = root?.style.height ?? "";
    const previousRootMinHeight = root?.style.minHeight ?? "";
    const previousRootOverflow = root?.style.overflow ?? "";

    html.style.overflow = "auto";
    body.style.overflow = "auto";

    if (root) {
      root.style.height = "auto";
      root.style.minHeight = "100vh";
      root.style.overflow = "visible";
    }

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;

      if (root) {
        root.style.height = previousRootHeight;
        root.style.minHeight = previousRootMinHeight;
        root.style.overflow = previousRootOverflow;
      }
    };
  }, []);

  const inspectGraph = useMemo(() => {
    const sourceColor = PARTICIPANT_COLOR_OPTIONS[selectedDraftLocalUserSlot - 1] ?? "";
    const dynamicInspectEdges: Array<[InspectNodeId, InspectNodeId]> = [
      ...[
        "default",
        "hover",
        "active",
      ].map((state) => [
        getParticipantColorDraftTokenNodeLabel(
          selectedDraftLocalUserSlot,
          "surface",
          state as "default" | "hover" | "active"
        ),
        getLocalUserAliasTokenNodeLabel("surface", state as "default" | "hover" | "active"),
      ] as [InspectNodeId, InspectNodeId]),
      [
        getParticipantColorDraftTokenNodeLabel(selectedDraftLocalUserSlot, "border", "default"),
        getLocalUserAliasTokenNodeLabel("border", "default"),
      ],
      [
        getParticipantColorDraftTokenNodeLabel(selectedDraftLocalUserSlot, "text", "default"),
        getLocalUserAliasTokenNodeLabel("text", "default"),
      ],
      [
        getLocalUserAliasTokenNodeLabel("surface", "default"),
        inspectNodeIds.controls.draftLocalUserButtonFill,
      ],
      [
        getLocalUserAliasTokenNodeLabel("border", "default"),
        inspectNodeIds.controls.draftLocalUserButtonFill,
      ],
      [
        getLocalUserAliasTokenNodeLabel("text", "default"),
        inspectNodeIds.controls.draftLocalUserButtonFill,
      ],
      [
        getLocalUserAliasTokenNodeLabel("border", "default"),
        inspectNodeIds.controls.draftLocalUserButtonBorder,
      ],
      [
        getLocalUserAliasTokenNodeLabel("surface", "default"),
        inspectNodeIds.controls.draftLocalUserInteractionFill,
      ],
      [
        getLocalUserAliasTokenNodeLabel("border", "default"),
        inspectNodeIds.controls.draftLocalUserInteractionFill,
      ],
      [
        getLocalUserAliasTokenNodeLabel("text", "default"),
        inspectNodeIds.controls.draftLocalUserInteractionFill,
      ],
      [
        getLocalUserAliasTokenNodeLabel("border", "default"),
        inspectNodeIds.controls.draftLocalUserInteractionBorder,
      ],
      [
        getParticipantPaletteSlotNodeLabel(selectedDraftLocalUserSlot, sourceColor),
        getLocalUserAliasTokenNodeLabel("surface", "default"),
      ],
    ];

    const outgoing = new Map<InspectNodeId, InspectNodeId[]>();
    const incoming = new Map<InspectNodeId, InspectNodeId[]>();

    for (const [from, to] of [...inspectGraphEdges, ...dynamicInspectEdges]) {
      const nextOutgoing = outgoing.get(from);
      if (nextOutgoing) {
        nextOutgoing.push(to);
      } else {
        outgoing.set(from, [to]);
      }

      const nextIncoming = incoming.get(to);
      if (nextIncoming) {
        nextIncoming.push(from);
      } else {
        incoming.set(to, [from]);
      }
    }

    return { outgoing, incoming };
  }, [selectedDraftLocalUserSlot]);

  const { upstreamNodeIds, downstreamNodeIds } = useMemo(() => {
    if (!selectedInspectNodeId) {
      return {
        upstreamNodeIds: new Set<InspectNodeId>(),
        downstreamNodeIds: new Set<InspectNodeId>(),
      };
    }

    const collectReachable = (seed: InspectNodeId, graph: Map<InspectNodeId, InspectNodeId[]>) => {
      const visited = new Set<InspectNodeId>();
      const queue = [...(graph.get(seed) ?? [])];

      while (queue.length > 0) {
        const next = queue.shift();

        if (!next || visited.has(next)) {
          continue;
        }

        visited.add(next);

        for (const linked of graph.get(next) ?? []) {
          if (!visited.has(linked)) {
            queue.push(linked);
          }
        }
      }

      return visited;
    };

    return {
      upstreamNodeIds: collectReachable(selectedInspectNodeId, inspectGraph.incoming),
      downstreamNodeIds: collectReachable(selectedInspectNodeId, inspectGraph.outgoing),
    };
  }, [inspectGraph, selectedInspectNodeId]);

  const clearSandboxFocus = () => {
    const activeElement = document.activeElement;

    if (
      activeElement instanceof HTMLElement &&
      pageShellRef.current?.contains(activeElement)
    ) {
      activeElement.blur();
    }
  };

  const handleInspectSelect = (nodeId: InspectNodeId) => {
    clearSandboxFocus();
    setSelectedInspectNodeId(nodeId);
    setActiveTokenOverrideEditor(null);
  };

  const handleSelectTokenItem = (
    nodeId: InspectNodeId,
    editor: ActiveTokenOverrideEditor | null
  ) => {
    clearSandboxFocus();
    setSelectedInspectNodeId(nodeId);
    const nextSlot = getDraftSlotNumberFromInspectNodeId(nodeId);

    if (nextSlot) {
      setSelectedDraftLocalUserSlot(nextSlot);
    }

    if (!editor) {
      setActiveTokenOverrideEditor(null);
      return;
    }

    const directValue = tokenOverrides[editor.tokenVar];
    const nextDraft = directValue ?? resolveEffectiveTokenValue(editor.tokenVar);
    setActiveTokenOverrideEditor(editor);
    setTokenOverrideDraft(nextDraft);
    setActiveTokenEffectiveValue(resolveEffectiveTokenValue(editor.tokenVar));
  };

  const getInspectRelation = (nodeId?: InspectNodeId): InspectRelation => {
    if (!selectedInspectNodeId || !nodeId) {
      return "idle";
    }

    if (nodeId === selectedInspectNodeId) {
      return "selected";
    }

    if (upstreamNodeIds.has(nodeId)) {
      return "upstream";
    }

    if (downstreamNodeIds.has(nodeId)) {
      return "downstream";
    }

    return "unrelated";
  };

  const toggleRecipe = createToggleButtonRecipe(buttonRecipes.secondary.small);
  const menuTriggerRecipe = buttonRecipes.secondary.small;
  const selectedDraftLocalUserColumn =
    participantColorDraftTokenColumns[selectedDraftLocalUserSlot - 1];
  const selectedDraftLocalUserSourceLabel = `participant-color-${selectedDraftLocalUserSlot}`;
  const draftLocalUserButtonFillRecipe = createDraftLocalUserButtonRecipeForSlot(
    buttonRecipes.primary.default,
    selectedDraftLocalUserSlot,
    "fill"
  );
  const draftLocalUserInteractionFillRecipe =
    createDraftLocalUserButtonRecipeForSlot(
      interactionButtonRecipes.primary.pill,
      selectedDraftLocalUserSlot,
      "fill"
    );
  const draftLocalUserInteractionBorderRecipe =
    createDraftLocalUserButtonRecipeForSlot(
      interactionButtonRecipes.secondary.pill,
      selectedDraftLocalUserSlot,
      "border"
    );
  const tokenOverrideStyle = useMemo(() => {
    const nextStyle: CSSVariableProperties = {};

    for (const [tokenVar, value] of Object.entries(tokenOverrides)) {
      nextStyle[tokenVar as `--${string}`] = value;
    }

    for (const [tokenVar, value] of Object.entries(tokenOverrides)) {
      void value;

      for (const alias of tokenOverrideAliases[tokenVar] ?? []) {
        if (tokenOverrides[alias] !== undefined) {
          continue;
        }

        if (nextStyle[alias as `--${string}`] !== undefined) {
          continue;
        }

        nextStyle[alias as `--${string}`] = `var(${tokenVar})`;
      }
    }

    const selectedParticipantTokens = participantColor[selectedDraftLocalUserSlot - 1];
    const sandboxLocalUserAliasMap = {
      "--ui-button-local-user-surface-default": selectedParticipantTokens.surface.default,
      "--ui-button-local-user-surface-hover": selectedParticipantTokens.surface.hover,
      "--ui-button-local-user-surface-active": selectedParticipantTokens.surface.active,
      "--ui-button-local-user-surface-selected": selectedParticipantTokens.surface.active,
      "--ui-button-local-user-surface-selected-hover": selectedParticipantTokens.surface.active,
      "--ui-button-local-user-surface-selected-active": selectedParticipantTokens.surface.active,
      "--ui-button-local-user-surface-open": selectedParticipantTokens.surface.hover,
      "--ui-button-local-user-surface-open-hover": selectedParticipantTokens.surface.active,
      "--ui-button-local-user-surface-open-active": selectedParticipantTokens.surface.active,
      "--ui-button-local-user-surface-loading": selectedParticipantTokens.surface.active,
      "--ui-button-local-user-surface-disabled": "var(--ui-color-surface-disabled-filled)",
      "--ui-button-local-user-border-default": selectedParticipantTokens.border.default,
      "--ui-button-local-user-border-hover": selectedParticipantTokens.border.default,
      "--ui-button-local-user-border-active": selectedParticipantTokens.border.default,
      "--ui-button-local-user-border-selected": selectedParticipantTokens.border.default,
      "--ui-button-local-user-border-selected-hover": selectedParticipantTokens.border.default,
      "--ui-button-local-user-border-selected-active": selectedParticipantTokens.border.default,
      "--ui-button-local-user-border-open": selectedParticipantTokens.border.default,
      "--ui-button-local-user-border-open-hover": selectedParticipantTokens.border.default,
      "--ui-button-local-user-border-open-active": selectedParticipantTokens.border.default,
      "--ui-button-local-user-border-loading": selectedParticipantTokens.border.default,
      "--ui-button-local-user-border-disabled": "var(--ui-color-border-disabled)",
      "--ui-button-local-user-text-default": selectedParticipantTokens.text.default,
      "--ui-button-local-user-text-hover": selectedParticipantTokens.text.default,
      "--ui-button-local-user-text-active": selectedParticipantTokens.text.default,
      "--ui-button-local-user-text-selected": selectedParticipantTokens.text.default,
      "--ui-button-local-user-text-selected-hover": selectedParticipantTokens.text.default,
      "--ui-button-local-user-text-selected-active": selectedParticipantTokens.text.default,
      "--ui-button-local-user-text-open": selectedParticipantTokens.text.default,
      "--ui-button-local-user-text-open-hover": selectedParticipantTokens.text.default,
      "--ui-button-local-user-text-open-active": selectedParticipantTokens.text.default,
      "--ui-button-local-user-text-loading": selectedParticipantTokens.text.default,
      "--ui-button-local-user-text-disabled": "var(--ui-color-text-disabled)",
    } satisfies Record<`--${string}`, string>;

    for (const [tokenVar, value] of Object.entries(sandboxLocalUserAliasMap)) {
      if (tokenOverrides[tokenVar] !== undefined) {
        continue;
      }

      nextStyle[tokenVar as `--${string}`] = value;
    }

    return nextStyle;
  }, [selectedDraftLocalUserSlot, tokenOverrides]);

  const resolveEffectiveTokenValue = (tokenVar: string) => {
    const root = pageContentRef.current ?? pageShellRef.current;
    return root ? getComputedStyle(root).getPropertyValue(tokenVar).trim() : "";
  };

  const handleApplyTokenOverride = (tokenVar: string, nextValue: string) => {
    const normalizedValue = nextValue.trim();

    if (!normalizedValue) {
      setTokenOverrides((current) => {
        const rest = { ...current };
        delete rest[tokenVar];
        return rest;
      });
      setActiveTokenEffectiveValue(resolveEffectiveTokenValue(tokenVar));
      return;
    }

    setTokenOverrides((current) => ({
      ...current,
      [tokenVar]: normalizedValue,
    }));
    setActiveTokenEffectiveValue(normalizedValue);
  };

  const activeTokenDirectOverrideValue = activeTokenOverrideEditor
    ? tokenOverrides[activeTokenOverrideEditor.tokenVar] ?? ""
    : "";

  const handleResetTokenOverride = (tokenVar: string) => {
    setTokenOverrides((current) => {
      const rest = { ...current };
      delete rest[tokenVar];
      return rest;
    });

    if (activeTokenOverrideEditor?.tokenVar === tokenVar) {
      const nextEffectiveValue = resolveEffectiveTokenValue(tokenVar);
      setTokenOverrideDraft(nextEffectiveValue);
      setActiveTokenEffectiveValue(nextEffectiveValue);
    }
  };

  const handleResetAllTokenOverrides = () => {
    setTokenOverrides({});
    setActiveTokenOverrideEditor(null);
    setTokenOverrideDraft("");
    setActiveTokenEffectiveValue("");
  };

  const hasAnyTokenOverrides = Object.keys(tokenOverrides).length > 0;

  return (
    <SandboxInspectContext.Provider
      value={{
        getInspectRelation,
        onInspectSelect: handleInspectSelect,
      }}
    >
      <div
        ref={pageShellRef}
        style={pageShellStyle}
        onPointerDownCapture={(event) => {
          const target = event.target;

          if (!(target instanceof HTMLElement)) {
            return;
          }

          if (!target.closest("[data-sandbox-inspect-node-id]")) {
            clearSandboxFocus();
            setSelectedInspectNodeId(null);
            setActiveTokenOverrideEditor(null);
          }
        }}
        onClick={() => {
          clearSandboxFocus();
          setSelectedInspectNodeId(null);
          setActiveTokenOverrideEditor(null);
        }}
      >
        <div
          ref={(node) => {
            pageContentRef.current = node;
            setPageContentElement(node);
          }}
          style={{ ...pageContentStyle, ...tokenOverrideStyle }}
        >
        <header
          className={surfaceRecipes.panel.default.className}
          style={surfaceRecipes.panel.default.style}
          {...getDesignSystemDebugAttrs(surfaceRecipes.panel.default.debug)}
        >
          <div
            style={{
              ...headerGridStyle,
              gridTemplateColumns: hasAnyTokenOverrides ? "minmax(0, 1fr) auto" : undefined,
              alignItems: "start",
            }}
          >
            <div style={headerGridStyle}>
            <div style={{ ...inlineTextRecipes.muted.style, textTransform: "uppercase" }}>
              Dev-only route
            </div>
            <div style={{ fontSize: 30, lineHeight: 0.98, fontWeight: 800, color: text.primary }}>
              Design-system sandbox
            </div>
            <div style={sectionDescriptionStyle}>
              Stable manual check page for current shared control families, variants, and
              states. Hover inspect is enabled here by default.
            </div>
            </div>
            {hasAnyTokenOverrides ? (
              <button
                type="button"
                {...getButtonProps(buttonRecipes.danger.compact)}
                onClick={(event) => {
                  event.stopPropagation();
                  handleResetAllTokenOverrides();
                }}
              >
                Reset all overrides
              </button>
            ) : null}
          </div>
        </header>

        <SectionCard
          title="Foundation token swatches"
          description="Full current foundation vocabulary in the same compact legend pattern. Hover a swatch to inspect its token identity."
        >
          <div style={previewGridStyle}>
            <TokenInventoryColumn
              title="Surface"
              recipeLabel="token / foundation / surface"
              items={foundationTokenInventory.surface}
              tokenOverrides={tokenOverrides}
              onSelectTokenItem={handleSelectTokenItem}
            />
            <TokenInventoryColumn
              title="Border"
              recipeLabel="token / foundation / border"
              items={foundationTokenInventory.border}
              tokenOverrides={tokenOverrides}
              onSelectTokenItem={handleSelectTokenItem}
            />
            <TokenInventoryColumn
              title="Text"
              recipeLabel="token / foundation / text"
              items={foundationTokenInventory.text}
              tokenOverrides={tokenOverrides}
              onSelectTokenItem={handleSelectTokenItem}
            />
            <TokenInventoryColumn
              title="Focus / Radius / Space / Motion"
              recipeLabel="token / foundation / focus-metrics"
              items={[...foundationTokenInventory.focus, ...foundationTokenInventory.metrics]}
              tokenOverrides={tokenOverrides}
              onSelectTokenItem={handleSelectTokenItem}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Participant-color tokens"
          description="Runtime token layer for participant-colored controls in the current system."
        >
          <div style={previewGridStyleFourColumns}>
            {participantColorDraftTokenColumns.map((column) => (
              <TokenInventoryColumn
                key={column.title}
                title={column.title}
                recipeLabel={column.recipeLabel}
                items={column.items}
                tokenOverrides={tokenOverrides}
                onSelectTokenItem={handleSelectTokenItem}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Local-user alias"
          description={`Shared button-contract alias layer. Sandbox click state currently points this proof at ${selectedDraftLocalUserSourceLabel}.`}
        >
          <ParticipantColorSelectorRow
            selectedSlot={selectedDraftLocalUserSlot}
            onSelectSlot={(slot) => {
              clearSandboxFocus();
              setSelectedDraftLocalUserSlot(slot);
              setActiveTokenOverrideEditor(null);
            }}
          />

          <div style={previewGridStyle}>
            <TokenInventoryColumn
              title={`Source ${selectedDraftLocalUserSourceLabel}`}
              recipeLabel={`participantColor / palette / ${selectedDraftLocalUserSourceLabel}`}
              items={selectedDraftLocalUserColumn.items}
              tokenOverrides={tokenOverrides}
              onSelectTokenItem={handleSelectTokenItem}
            />
            <TokenInventoryColumn
              title="button-local-user-*"
              recipeLabel="token / local-user / shared button contract"
              items={draftLocalUserAliasInventory}
              tokenOverrides={tokenOverrides}
              onSelectTokenItem={handleSelectTokenItem}
            />
          </div>

          <div style={previewGridStyle}>
            <PreviewCard
              title="Button proof"
              recipeLabel="local-user / button / fill-border"
            >
              <LiveDraftLocalUserButtonPreview
                baseRecipe={buttonRecipes.primary.default}
                slot={selectedDraftLocalUserSlot}
                mode="fill"
                label="button / fill"
                sourceSlotLabel={selectedDraftLocalUserSourceLabel}
                inspectNodeId={inspectNodeIds.controls.draftLocalUserButtonFill}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.draftLocalUserButtonFill)}
                onInspectSelect={handleInspectSelect}
              >
                Join room
              </LiveDraftLocalUserButtonPreview>
              <LiveDraftLocalUserButtonPreview
                baseRecipe={buttonRecipes.secondary.default}
                slot={selectedDraftLocalUserSlot}
                mode="border"
                label="button / border"
                sourceSlotLabel={selectedDraftLocalUserSourceLabel}
                inspectNodeId={inspectNodeIds.controls.draftLocalUserButtonBorder}
                inspectRelation={getInspectRelation(
                  inspectNodeIds.controls.draftLocalUserButtonBorder
                )}
                onInspectSelect={handleInspectSelect}
              >
                Add image
              </LiveDraftLocalUserButtonPreview>
              <ButtonPreview
                recipe={draftLocalUserButtonFillRecipe}
                label="fill / loading"
                state={{ loading: true }}
              />
              <ButtonPreview
                recipe={draftLocalUserButtonFillRecipe}
                label="fill / disabled"
                state={{ disabled: true }}
              />
            </PreviewCard>
            <PreviewCard
              title="Interaction pill proof"
              recipeLabel="local-user / interactionButton / pill / fill-border"
            >
              <LiveCanvasButtonPreview
                recipe={draftLocalUserInteractionFillRecipe}
                label="Draw"
                resolveScope={pageContentElement}
                inspectNodeId={inspectNodeIds.controls.draftLocalUserInteractionFill}
                inspectRelation={getInspectRelation(
                  inspectNodeIds.controls.draftLocalUserInteractionFill
                )}
                onInspectSelect={handleInspectSelect}
              />
              <LiveCanvasButtonPreview
                recipe={draftLocalUserInteractionBorderRecipe}
                label="Move"
                resolveScope={pageContentElement}
                inspectNodeId={inspectNodeIds.controls.draftLocalUserInteractionBorder}
                inspectRelation={getInspectRelation(
                  inspectNodeIds.controls.draftLocalUserInteractionBorder
                )}
                onInspectSelect={handleInspectSelect}
              />
              <CanvasButtonPreview
                recipe={draftLocalUserInteractionFillRecipe}
                label="Draw"
                state={{ active: true }}
                resolveScope={pageContentElement}
              />
            </PreviewCard>
          </div>
        </SectionCard>

        <SectionCard
          title="Participant avatar faces"
          description="Current available face-id pool for participant avatar assignment."
        >
          <ParticipantAvatarFaceIconList />
        </SectionCard>

        <SectionCard
          title="Context menu"
          description="Canonical menu surface for board, token, and future object actions."
        >
          <div style={previewGridStyle}>
            <ContextMenuSandboxPreview />
            <ContextMenuStateCoveragePreview />
          </div>
        </SectionCard>

        <SectionCard
          title="Context menu icon grid"
          description="Square grid layout for large icon and glyph sets."
        >
          <div style={previewGridStyle}>
            <ContextMenuGridLayoutPreview />
          </div>
        </SectionCard>

        <SectionCard
          title="Semantic token swatches"
          description="Compact token inventory for the current standard-control layer. Hover a swatch to inspect its token identity."
        >
          <div style={previewGridStyle}>
            <TokenInventoryColumn
              title="Surface"
              recipeLabel="token / visible role / surface"
              items={tokenInventory.surface}
              tokenOverrides={tokenOverrides}
              onSelectTokenItem={handleSelectTokenItem}
            />
            <TokenInventoryColumn
              title="Border"
              recipeLabel="token / visible role / border"
              items={tokenInventory.border}
              tokenOverrides={tokenOverrides}
              onSelectTokenItem={handleSelectTokenItem}
            />
            <TokenInventoryColumn
              title="Text"
              recipeLabel="token / visible role / text"
              items={tokenInventory.text}
              tokenOverrides={tokenOverrides}
              onSelectTokenItem={handleSelectTokenItem}
            />
            <TokenInventoryColumn
              title="Focus / Treatments"
              recipeLabel="token / visible role / treatment"
              items={tokenInventory.treatments}
              tokenOverrides={tokenOverrides}
              onSelectTokenItem={handleSelectTokenItem}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Ordinary button"
          description="Shared button recipes by variant and size, plus static state comparisons derived from the same token-backed recipe."
        >
          <div style={previewGridStyle}>
            <PreviewCard
              title="Primary variants"
              recipeLabel="button / primary / default-small-compact"
            >
              <LiveButtonPreview
                recipe={buttonRecipes.primary.default}
                label="default"
                inspectNodeId={inspectNodeIds.controls.primaryDefault}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.primaryDefault)}
                onInspectSelect={handleInspectSelect}
              />
              <LiveButtonPreview
                recipe={buttonRecipes.primary.small}
                label="small"
                inspectNodeId={inspectNodeIds.controls.primarySmall}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.primarySmall)}
                onInspectSelect={handleInspectSelect}
              />
              <LiveButtonPreview
                recipe={buttonRecipes.primary.compact}
                label="compact"
                inspectNodeId={inspectNodeIds.controls.primaryCompact}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.primaryCompact)}
                onInspectSelect={handleInspectSelect}
              />
            </PreviewCard>
            <PreviewCard
              title="Primary neutral variants"
              recipeLabel="button / primaryNeutral / default-small-compact"
            >
              <LiveButtonPreview recipe={buttonRecipes.primaryNeutral.default} label="default" />
              <LiveButtonPreview recipe={buttonRecipes.primaryNeutral.small} label="small" />
              <LiveButtonPreview recipe={buttonRecipes.primaryNeutral.compact} label="compact" />
            </PreviewCard>
            <PreviewCard
              title="Secondary variants"
              recipeLabel="button / secondary / default-small-compact"
            >
              <LiveButtonPreview
                recipe={buttonRecipes.secondary.default}
                label="default"
                inspectNodeId={inspectNodeIds.controls.secondaryDefault}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.secondaryDefault)}
                onInspectSelect={handleInspectSelect}
              />
              <LiveButtonPreview
                recipe={buttonRecipes.secondary.small}
                label="small"
                inspectNodeId={inspectNodeIds.controls.secondarySmall}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.secondarySmall)}
                onInspectSelect={handleInspectSelect}
              />
              <LiveButtonPreview
                recipe={buttonRecipes.secondary.compact}
                label="compact"
                inspectNodeId={inspectNodeIds.controls.secondaryCompact}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.secondaryCompact)}
                onInspectSelect={handleInspectSelect}
              />
            </PreviewCard>
            <PreviewCard
              title="Danger variants"
              recipeLabel="button / danger / default-small-compact"
            >
              <LiveButtonPreview
                recipe={buttonRecipes.danger.default}
                label="default"
                inspectNodeId={inspectNodeIds.controls.dangerDefault}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.dangerDefault)}
                onInspectSelect={handleInspectSelect}
              />
              <LiveButtonPreview
                recipe={buttonRecipes.danger.small}
                label="small"
                inspectNodeId={inspectNodeIds.controls.dangerSmall}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.dangerSmall)}
                onInspectSelect={handleInspectSelect}
              />
              <LiveButtonPreview
                recipe={buttonRecipes.danger.compact}
                label="compact"
                inspectNodeId={inspectNodeIds.controls.dangerCompact}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.dangerCompact)}
                onInspectSelect={handleInspectSelect}
              />
            </PreviewCard>
          </div>

          <div style={previewGridStyle}>
            <PreviewCard
              title="State matrix"
              recipeLabel="button / secondary / default / states"
            >
              <ButtonPreview recipe={buttonRecipes.secondary.default} label="default" />
              <ButtonPreview
                recipe={buttonRecipes.secondary.default}
                label="hover"
                state={{ hover: true }}
              />
              <ButtonPreview
                recipe={buttonRecipes.secondary.default}
                label="focus-visible"
                state={{ focusVisible: true }}
                inspectNodeId={inspectNodeIds.controls.ordinaryFocus}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.ordinaryFocus)}
                onInspectSelect={handleInspectSelect}
              />
              <ButtonPreview
                recipe={buttonRecipes.secondary.default}
                label="active"
                state={{ active: true }}
              />
              <ButtonPreview
                recipe={buttonRecipes.secondary.default}
                label="disabled"
                state={{ disabled: true }}
                inspectNodeId={inspectNodeIds.controls.ordinaryDisabled}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.ordinaryDisabled)}
                onInspectSelect={handleInspectSelect}
              />
              <ButtonPreview
                recipe={buttonRecipes.primary.default}
                label="disabled filled"
                state={{ disabled: true }}
              />
              <ButtonPreview
                recipe={buttonRecipes.secondary.default}
                label="loading"
                state={{ loading: true }}
                inspectNodeId={inspectNodeIds.controls.ordinaryLoading}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.ordinaryLoading)}
                onInspectSelect={handleInspectSelect}
              />
            </PreviewCard>
            <PreviewCard
              title="Text subtype"
              recipeLabel="button / text / compact"
            >
              <LiveTextButtonPreview tone="muted" label="muted" />
              <LiveTextButtonPreview tone="secondary" label="secondary" />
              <LiveTextButtonPreview tone="danger" label="danger" />
              <TextButtonPreview tone="secondary" label="focus-visible" state={{ focusVisible: true }} />
            </PreviewCard>
          </div>
        </SectionCard>

        <SectionCard
          title="Icon and floating button"
          description="Ordinary shared circular controls using the interaction-button recipe path."
        >
          <div style={previewGridStyle}>
            <PreviewCard
              title="Circle variants"
              recipeLabel="interactionButton / circle / variant coverage"
            >
              <LiveButtonPreview
                recipe={interactionButtonRecipes.primary.circle}
                label="primary"
                inspectNodeId={inspectNodeIds.controls.circlePrimary}
              >
                +
              </LiveButtonPreview>
              <LiveButtonPreview
                recipe={interactionButtonRecipes.secondary.circle}
                label="secondary"
                inspectNodeId={inspectNodeIds.controls.circleSecondary}
              >
                i
              </LiveButtonPreview>
              <LiveButtonPreview
                recipe={interactionButtonRecipes.danger.circle}
                label="danger"
                inspectNodeId={inspectNodeIds.controls.circleDanger}
              >
                ×
              </LiveButtonPreview>
            </PreviewCard>
            <PreviewCard
              title="Circle states"
              recipeLabel="interactionButton / circle / secondary / states"
            >
              <ButtonPreview
                recipe={interactionButtonRecipes.secondary.circle}
                label="default"
                buttonChildren="A"
                inspectNodeId={inspectNodeIds.controls.circleStateDefault}
              />
              <ButtonPreview
                recipe={interactionButtonRecipes.secondary.circle}
                label="hover"
                state={{ hover: true }}
                buttonChildren="A"
                inspectNodeId={inspectNodeIds.controls.circleStateHover}
              />
              <ButtonPreview
                recipe={interactionButtonRecipes.secondary.circle}
                label="focus-visible"
                state={{ focusVisible: true }}
                buttonChildren="A"
                inspectNodeId={inspectNodeIds.controls.circleStateFocus}
              />
              <ButtonPreview
                recipe={interactionButtonRecipes.secondary.circle}
                label="active"
                state={{ active: true }}
                buttonChildren="A"
                inspectNodeId={inspectNodeIds.controls.circleStateActive}
              />
              <ButtonPreview
                recipe={interactionButtonRecipes.secondary.circle}
                label="disabled"
                state={{ disabled: true }}
                buttonChildren="A"
                inspectNodeId={inspectNodeIds.controls.circleStateDisabled}
              />
            </PreviewCard>
          </div>
        </SectionCard>

        <SectionCard
          title="Board interaction button"
          description="Canvas-drawn preview using the same interaction-button recipe plus shared tone and metrics resolvers."
        >
          <div style={previewGridStyle}>
            <PreviewCard
              title="Canvas variants"
              recipeLabel="interactionButton / pill / canvas preview"
            >
              <LiveCanvasButtonPreview
                recipe={interactionButtonRecipes.primary.pill}
                label="Focus"
              />
              <LiveCanvasButtonPreview
                recipe={interactionButtonRecipes.secondary.pill}
                label="Move"
              />
              <LiveCanvasButtonPreview
                recipe={interactionButtonRecipes.danger.pill}
                label="Delete"
              />
            </PreviewCard>
            <PreviewCard
              title="Canvas states"
              recipeLabel="interactionButton / pill / secondary / states"
            >
              <CanvasButtonPreview
                recipe={interactionButtonRecipes.secondary.pill}
                label="Move"
              />
              <CanvasButtonPreview
                recipe={interactionButtonRecipes.secondary.pill}
                label="Move"
                state={{ hover: true }}
              />
              <CanvasButtonPreview
                recipe={interactionButtonRecipes.secondary.pill}
                label="Move"
                state={{ focusVisible: true }}
              />
              <CanvasButtonPreview
                recipe={interactionButtonRecipes.secondary.pill}
                label="Move"
                state={{ active: true }}
              />
              <CanvasButtonPreview
                recipe={interactionButtonRecipes.secondary.pill}
                label="Move"
                state={{ disabled: true }}
              />
            </PreviewCard>
          </div>
        </SectionCard>

        <SectionCard
          title="Toggle and menu trigger"
          description="Current selected and open states on the ordinary shared-control path."
        >
          <div style={previewGridStyle}>
            <PreviewCard
              title="Toggle button"
              recipeLabel="button / toggle / small / states"
            >
              <ButtonPreview recipe={toggleRecipe} label="default" />
              <ButtonPreview recipe={toggleRecipe} label="hover" state={{ hover: true }} />
              <ButtonPreview
                recipe={toggleRecipe}
                label="focus-visible"
                state={{ focusVisible: true }}
              />
              <ButtonPreview recipe={toggleRecipe} label="active" state={{ active: true }} />
              <ButtonPreview
                recipe={toggleRecipe}
                label="selected"
                state={{ selected: true }}
              />
              <ButtonPreview
                recipe={toggleRecipe}
                label="disabled"
                state={{ disabled: true }}
              />
              <ButtonPreview
                recipe={toggleRecipe}
                label="loading"
                state={{ loading: true }}
              />
            </PreviewCard>
            <PreviewCard
              title="Menu / popover trigger"
              recipeLabel="button / secondary / small / open states"
            >
              <ButtonPreview
                recipe={menuTriggerRecipe}
                label="default"
                inspectNodeId={inspectNodeIds.controls.menuDefault}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.menuDefault)}
                onInspectSelect={handleInspectSelect}
              />
              <ButtonPreview
                recipe={menuTriggerRecipe}
                label="hover"
                state={{ hover: true }}
              />
              <ButtonPreview
                recipe={menuTriggerRecipe}
                label="focus-visible"
                state={{ focusVisible: true }}
              />
              <ButtonPreview
                recipe={menuTriggerRecipe}
                label="active"
                state={{ active: true }}
              />
              <ButtonPreview
                recipe={menuTriggerRecipe}
                label="open"
                state={{ open: true }}
                inspectNodeId={inspectNodeIds.controls.menuOpen}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.menuOpen)}
                onInspectSelect={handleInspectSelect}
              />
              <ButtonPreview
                recipe={menuTriggerRecipe}
                label="open + hover"
                state={{ open: true, hover: true }}
                inspectNodeId={inspectNodeIds.controls.menuOpenHover}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.menuOpenHover)}
                onInspectSelect={handleInspectSelect}
              />
              <ButtonPreview
                recipe={menuTriggerRecipe}
                label="disabled"
                state={{ disabled: true }}
              />
            </PreviewCard>
          </div>
        </SectionCard>

        <SectionCard
          title="Text field"
          description="Shared field shell and input/select path with current standard states."
        >
          <div style={previewGridStyle}>
            <PreviewCard
              title="Field sizes"
              recipeLabel="field / default-small / input-select"
            >
              <FieldPreview
                recipe={fieldRecipes.default}
                label="default input"
                inspectNodeId={inspectNodeIds.controls.fieldDefault}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.fieldDefault)}
                onInspectSelect={handleInspectSelect}
              />
              <FieldPreview recipe={fieldRecipes.small} label="small input" />
              <FieldPreview recipe={fieldRecipes.small} label="small select" mode="select" />
            </PreviewCard>
            <PreviewCard
              title="Field states"
              recipeLabel="field / default / states"
            >
              <FieldPreview
                recipe={fieldRecipes.default}
                label="default"
                inspectNodeId={inspectNodeIds.controls.fieldDefault}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.fieldDefault)}
                onInspectSelect={handleInspectSelect}
              />
              <FieldPreview
                recipe={fieldRecipes.default}
                label="hover"
                state={{ hover: true }}
              />
              <FieldPreview
                recipe={fieldRecipes.default}
                label="focus-visible"
                state={{ focusVisible: true }}
              />
              <FieldPreview
                recipe={fieldRecipes.default}
                label="error"
                state={{ invalid: true }}
                inspectNodeId={inspectNodeIds.controls.fieldError}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.fieldError)}
                onInspectSelect={handleInspectSelect}
              />
              <FieldPreview
                recipe={fieldRecipes.default}
                label="error + focus"
                state={{ invalid: true, focusVisible: true }}
                inspectNodeId={inspectNodeIds.controls.fieldErrorFocus}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.fieldErrorFocus)}
                onInspectSelect={handleInspectSelect}
              />
              <FieldPreview
                recipe={fieldRecipes.default}
                label="disabled"
                state={{ disabled: true }}
                inspectNodeId={inspectNodeIds.controls.fieldDisabled}
                inspectRelation={getInspectRelation(inspectNodeIds.controls.fieldDisabled)}
                onInspectSelect={handleInspectSelect}
              />
            </PreviewCard>
          </div>
        </SectionCard>

        <SectionCard
          title="Swatch and color choice"
          description="Current size coverage and standard color-choice states."
        >
          <div style={previewGridStyle}>
            <PreviewCard
              title="Swatch sizes"
              recipeLabel="swatch / default-small-trigger"
            >
              <LiveSwatchPreview
                recipe={swatchPillRecipes.swatch.default}
                label="default"
                participantColorSlot={3}
                inspectNodeId={inspectNodeIds.controls.swatchDefault}
              />
              <LiveSwatchPreview
                recipe={swatchPillRecipes.swatch.small}
                label="small"
                participantColorSlot={6}
                inspectNodeId={inspectNodeIds.controls.swatchSmall}
              />
              <LiveSwatchPreview
                recipe={swatchPillRecipes.swatch.trigger}
                label="trigger"
                participantColorSlot={4}
                inspectNodeId={inspectNodeIds.controls.swatchTrigger}
              />
            </PreviewCard>
            <PreviewCard
              title="Swatch states"
              recipeLabel="swatch / default / states"
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <SwatchPreview
                  recipe={swatchPillRecipes.swatch.default}
                  label="default"
                  state={{ participantColorSlot: 3 }}
                  inspectNodeId={inspectNodeIds.controls.swatchStateDefault}
                />
                <SwatchPreview
                  recipe={swatchPillRecipes.swatch.default}
                  label="hover"
                  state={{ participantColorSlot: 3, hover: true }}
                  inspectNodeId={inspectNodeIds.controls.swatchStateHover}
                />
                <SwatchPreview
                  recipe={swatchPillRecipes.swatch.default}
                  label="focus-visible"
                  state={{ participantColorSlot: 3, focusVisible: true }}
                  inspectNodeId={inspectNodeIds.controls.swatchStateFocus}
                />
                <SwatchPreview
                  recipe={swatchPillRecipes.swatch.default}
                  label="selected"
                  state={{ participantColorSlot: 3, selected: true }}
                  inspectNodeId={inspectNodeIds.controls.swatchStateSelected}
                />
                <SwatchPreview
                  recipe={swatchPillRecipes.swatch.default}
                  label="occupied"
                  state={{ participantColorSlot: 3, occupied: true }}
                  inspectNodeId={inspectNodeIds.controls.swatchStateOccupied}
                />
                <SwatchPreview
                  recipe={swatchPillRecipes.swatch.default}
                  label="pending"
                  state={{ participantColorSlot: 3, pending: true }}
                  inspectNodeId={inspectNodeIds.controls.swatchStatePending}
                />
                <SwatchPreview
                  recipe={swatchPillRecipes.swatch.default}
                  label="disabled"
                  state={{ participantColorSlot: 3, disabled: true }}
                  inspectNodeId={inspectNodeIds.controls.swatchStateDisabled}
                />
              </div>
            </PreviewCard>
          </div>
        </SectionCard>

        <section
          style={{
            ...boardSurfaceRecipes.floatingShell.shell.style,
            justifySelf: "start",
            maxWidth: 360,
          }}
          {...getDesignSystemDebugAttrs(boardSurfaceRecipes.floatingShell.shell.debug)}
        >
          <div style={cardTitleStyle}>Current scope boundary</div>
          <div style={sectionDescriptionStyle}>
            This sandbox covers current standard control families only. It does not open
            shell state rollout, interaction exceptions, media redesign, checkbox/radio,
            tabs, or textarea families.
          </div>
        </section>

        <BoardInteractionLayerSandbox />
        {activeTokenOverrideEditor ? (
          <div
            data-sandbox-inspect-node-id="token-override-panel"
            style={tokenOverridePanelStyle}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div style={tokenOverridePanelHeaderStyle}>
              <div style={tokenOverridePanelTitleStyle}>{activeTokenOverrideEditor.label}</div>
              <div style={tokenHintStyle}>{activeTokenOverrideEditor.hint}</div>
              <div style={tokenOverridePanelTokenStyle}>
                {activeTokenOverrideEditor.tokenVar}
              </div>
            </div>
            <div style={tokenOverridePanelValueGridStyle}>
              <div style={tokenOverridePanelValueRowStyle}>
                <div style={tokenOverridePanelValueLabelStyle}>Effective</div>
                <div style={tokenOverridePanelValueTextStyle}>
                  {activeTokenEffectiveValue || "none"}
                </div>
              </div>
              <div style={tokenOverridePanelValueRowStyle}>
                <div style={tokenOverridePanelValueLabelStyle}>Direct override</div>
                <div style={tokenOverridePanelValueTextStyle}>
                  {activeTokenDirectOverrideValue || "none"}
                </div>
              </div>
            </div>
            <div style={tokenOverridePanelControlsStyle}>
              {isColorLikeToken(activeTokenOverrideEditor.tokenVar) ? (
                <input
                  type="color"
                  value={toColorInputValue(tokenOverrideDraft) ?? "#3b82f6"}
                  onChange={(event) => {
                    setTokenOverrideDraft((current) =>
                      applyColorToDraftValue(current, event.target.value)
                    );
                  }}
                  style={{
                    width: 52,
                    height: 36,
                    padding: 0,
                    border: `1px solid ${border.default}`,
                    borderRadius: 10,
                    background: surface.inset,
                    cursor: "pointer",
                  }}
                />
              ) : (
                <div />
              )}
              <input
                type="text"
                value={tokenOverrideDraft}
                onChange={(event) => {
                  setTokenOverrideDraft(event.target.value);
                }}
                placeholder="CSS value"
                style={tokenOverridePanelInputStyle}
              />
            </div>
            <div style={tokenOverridePanelActionsStyle}>
              <button
                type="button"
                {...getButtonProps(buttonRecipes.secondary.compact)}
                onClick={() => {
                  setActiveTokenOverrideEditor(null);
                }}
              >
                Close
              </button>
              <button
                type="button"
                {...getButtonProps(buttonRecipes.secondary.compact)}
                onClick={() => {
                  handleResetTokenOverride(activeTokenOverrideEditor.tokenVar);
                }}
              >
                Reset
              </button>
              <button
                type="button"
                {...getButtonProps(buttonRecipes.primary.compact)}
                onClick={() => {
                  handleApplyTokenOverride(
                    activeTokenOverrideEditor.tokenVar,
                    tokenOverrideDraft
                  );
                }}
              >
                Apply
              </button>
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </SandboxInspectContext.Provider>
  );
}
