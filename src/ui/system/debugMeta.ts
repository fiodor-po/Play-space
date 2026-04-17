export type DesignSystemDebugMeta = {
  family: string;
  variant?: string;
  size?: string;
  subtype?: string;
  label?: string;
};

export function buildDesignSystemDebugLabel(meta: DesignSystemDebugMeta) {
  if (meta.label) {
    return meta.label;
  }

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
  if (typeof window === "undefined") {
    return false;
  }

  if (window.location.pathname === "/dev/design-system") {
    return true;
  }

  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get("uiDebugControls") === "1";
}
