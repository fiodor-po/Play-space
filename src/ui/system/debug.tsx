import { useEffect, useState } from "react";
import { getBoardObjectElevationShadowRecipe } from "./boardMaterials";
import { isDesignSystemHoverDebugEnabled } from "./debugMeta";

const FLOATING_OBJECT_SHADOW =
  getBoardObjectElevationShadowRecipe("floating").cssBoxShadow;

type HoverState = {
  label: string;
  x: number;
  y: number;
} | null;

function getClosestDebugTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  return target.closest<HTMLElement>("[data-ui-ds-family]");
}

export function DesignSystemHoverInspector() {
  const [hoverState, setHoverState] = useState<HoverState>(null);

  useEffect(() => {
    if (!isDesignSystemHoverDebugEnabled()) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const target = getClosestDebugTarget(event.target);

      if (!target) {
        setHoverState(null);
        return;
      }

      const label = target.dataset.uiDsLabel?.trim();

      if (!label) {
        setHoverState(null);
        return;
      }

      setHoverState({
        label,
        x: event.clientX,
        y: event.clientY,
      });
    };

    const handlePointerLeave = () => {
      setHoverState(null);
    };

    window.addEventListener("pointermove", handlePointerMove, true);
    window.addEventListener("blur", handlePointerLeave);
    document.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove, true);
      window.removeEventListener("blur", handlePointerLeave);
      document.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  if (!isDesignSystemHoverDebugEnabled() || !hoverState) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        left: Math.min(hoverState.x + 12, window.innerWidth - 220),
        top: Math.min(hoverState.y + 12, window.innerHeight - 48),
        zIndex: 9999,
        pointerEvents: "none",
        padding: "6px 8px",
        borderRadius: 8,
        background: "rgba(2, 6, 23, 0.92)",
        border: "1px solid rgba(96, 165, 250, 0.35)",
        color: "#dbeafe",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.01em",
        boxShadow: FLOATING_OBJECT_SHADOW,
        whiteSpace: "nowrap",
      }}
    >
      {hoverState.label}
    </div>
  );
}
