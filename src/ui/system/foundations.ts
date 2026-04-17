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

export type ParticipantColorSlotNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function getParticipantColorTokenSet(slot: ParticipantColorSlotNumber) {
  return {
    slot: `participant-color-${slot}` as const,
    surface: {
      default: `var(--ui-participant-color-${slot}-surface-default)`,
      hover: `var(--ui-participant-color-${slot}-surface-hover)`,
      active: `var(--ui-participant-color-${slot}-surface-active)`,
    },
    border: {
      default: `var(--ui-participant-color-${slot}-border-default)`,
    },
    text: {
      default: `var(--ui-participant-color-${slot}-text-default)`,
    },
  };
}

export const participantColor = [
  getParticipantColorTokenSet(1),
  getParticipantColorTokenSet(2),
  getParticipantColorTokenSet(3),
  getParticipantColorTokenSet(4),
  getParticipantColorTokenSet(5),
  getParticipantColorTokenSet(6),
  getParticipantColorTokenSet(7),
  getParticipantColorTokenSet(8),
] as const;

export const DRAFT_LOCAL_USER_SOURCE_SLOT = 3 as const;

export const localUserButton = {
  sourceSlot: `participant-color-${DRAFT_LOCAL_USER_SOURCE_SLOT}` as const,
  surface: {
    default: "var(--ui-button-local-user-surface-default)",
    hover: "var(--ui-button-local-user-surface-hover)",
    active: "var(--ui-button-local-user-surface-active)",
    selected: "var(--ui-button-local-user-surface-selected)",
    selectedHover: "var(--ui-button-local-user-surface-selected-hover)",
    selectedActive: "var(--ui-button-local-user-surface-selected-active)",
    open: "var(--ui-button-local-user-surface-open)",
    openHover: "var(--ui-button-local-user-surface-open-hover)",
    openActive: "var(--ui-button-local-user-surface-open-active)",
    loading: "var(--ui-button-local-user-surface-loading)",
    disabled: "var(--ui-button-local-user-surface-disabled)",
  },
  border: {
    default: "var(--ui-button-local-user-border-default)",
    hover: "var(--ui-button-local-user-border-hover)",
    active: "var(--ui-button-local-user-border-active)",
    selected: "var(--ui-button-local-user-border-selected)",
    selectedHover: "var(--ui-button-local-user-border-selected-hover)",
    selectedActive: "var(--ui-button-local-user-border-selected-active)",
    open: "var(--ui-button-local-user-border-open)",
    openHover: "var(--ui-button-local-user-border-open-hover)",
    openActive: "var(--ui-button-local-user-border-open-active)",
    loading: "var(--ui-button-local-user-border-loading)",
    disabled: "var(--ui-button-local-user-border-disabled)",
  },
  text: {
    default: "var(--ui-button-local-user-text-default)",
    hover: "var(--ui-button-local-user-text-hover)",
    active: "var(--ui-button-local-user-text-active)",
    selected: "var(--ui-button-local-user-text-selected)",
    selectedHover: "var(--ui-button-local-user-text-selected-hover)",
    selectedActive: "var(--ui-button-local-user-text-selected-active)",
    open: "var(--ui-button-local-user-text-open)",
    openHover: "var(--ui-button-local-user-text-open-hover)",
    openActive: "var(--ui-button-local-user-text-open-active)",
    loading: "var(--ui-button-local-user-text-loading)",
    disabled: "var(--ui-button-local-user-text-disabled)",
  },
} as const;
