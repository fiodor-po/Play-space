export type DesignSystemDebugMeta = {
  family: string;
  variant?: string;
  size?: string;
  subtype?: string;
};

export function buildDesignSystemDebugLabel(meta: DesignSystemDebugMeta) {
  return [meta.family, meta.variant, meta.size, meta.subtype]
    .filter((part): part is string => !!part)
    .join(" / ");
}

export function getDesignSystemDebugAttrs(meta?: DesignSystemDebugMeta) {
  if (!meta) {
    return {};
  }

  return {
    "data-ui-ds-family": meta.family,
    "data-ui-ds-variant": meta.variant,
    "data-ui-ds-size": meta.size,
    "data-ui-ds-subtype": meta.subtype,
    "data-ui-ds-label": buildDesignSystemDebugLabel(meta),
  } as const;
}

export function isDesignSystemHoverDebugEnabled() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return false;
  }

  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get("uiDebugControls") === "1";
}
