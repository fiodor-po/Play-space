export const surface = {
  panel: "var(--ui-color-surface-panel)",
  panelSubtle: "var(--ui-color-surface-panel-subtle)",
  inset: "var(--ui-color-surface-inset)",
  insetHover: "var(--ui-color-surface-inset-hover)",
  insetActive: "var(--ui-color-surface-inset-active)",
  insetDisabled: "var(--ui-color-surface-inset-disabled)",
  accent: "var(--ui-color-surface-accent)",
  accentHover: "var(--ui-color-surface-accent-hover)",
  accentActive: "var(--ui-color-surface-accent-active)",
  accentNeutral: "var(--ui-color-surface-accent-neutral)",
  accentNeutralHover: "var(--ui-color-surface-accent-neutral-hover)",
  accentNeutralActive: "var(--ui-color-surface-accent-neutral-active)",
  danger: "var(--ui-color-surface-danger)",
  dangerHover: "var(--ui-color-surface-danger-hover)",
  dangerActive: "var(--ui-color-surface-danger-active)",
  dangerDisabled: "var(--ui-color-surface-danger-disabled)",
  warning: "var(--ui-color-surface-warning)",
  warningCompact: "var(--ui-color-surface-warning-compact)",
} as const;

export const text = {
  primary: "var(--ui-color-text-primary)",
  secondary: "var(--ui-color-text-secondary)",
  muted: "var(--ui-color-text-muted)",
  disabled: "var(--ui-color-text-disabled)",
  inverse: "var(--ui-color-text-inverse)",
  onAccentNeutral: "var(--ui-color-text-on-accent-neutral)",
  danger: "var(--ui-color-text-danger)",
  warning: "var(--ui-color-text-warning)",
} as const;

export const border = {
  default: "var(--ui-color-border-default)",
  hover: "var(--ui-color-border-hover)",
  focus: "var(--ui-color-border-focus)",
  disabled: "var(--ui-color-border-disabled)",
  accent: "var(--ui-color-border-accent)",
  accentNeutral: "var(--ui-color-border-accent-neutral)",
  danger: "var(--ui-color-border-danger)",
  warning: "var(--ui-color-border-warning)",
} as const;

export const radius = {
  control: "var(--ui-radius-control)",
  surface: "var(--ui-radius-surface)",
  inset: "var(--ui-radius-inset)",
  pill: "var(--ui-radius-pill)",
} as const;

export const radiusPrimitive = {
  r4: "var(--ui-radius-4)",
  r8: "var(--ui-radius-8)",
  r12: "var(--ui-radius-12)",
  r16: "var(--ui-radius-16)",
  r999: "var(--ui-radius-999)",
} as const;

export const focusRing = {
  default: "var(--ui-color-focus-ring)",
} as const;
