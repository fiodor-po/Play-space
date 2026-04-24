import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { HTML_UI_FONT_FAMILY } from "../../board/constants";
import { boardSurfaceRecipes } from "./boardSurfaces";
import { getDesignSystemDebugAttrs } from "./debugMeta";

export type HoverHintPlacement = "top" | "right" | "bottom" | "left";

type HoverHintProps = {
  body: string;
  children: ReactNode;
  title?: string;
  placement?: HoverHintPlacement;
  offset?: number;
  maxWidth?: number;
  minWidth?: number | string;
  wrapperStyle?: CSSProperties;
  tooltipStyle?: CSSProperties;
};

export function HoverHint({
  body,
  children,
  title,
  placement = "right",
  offset = 12,
  maxWidth = 240,
  minWidth,
  wrapperStyle,
  tooltipStyle,
}: HoverHintProps) {
  const [isVisible, setIsVisible] = useState(false);
  const placementStyle = resolvePlacementStyle(placement, offset);

  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        ...wrapperStyle,
      }}
      onMouseEnter={() => {
        setIsVisible(true);
      }}
      onMouseLeave={() => {
        setIsVisible(false);
      }}
      onFocusCapture={() => {
        setIsVisible(true);
      }}
      onBlurCapture={() => {
        setIsVisible(false);
      }}
    >
      {children}
      {isVisible ? (
        <div
          style={{
            ...boardSurfaceRecipes.objectSemanticsTooltip.shell.style,
            position: "absolute",
            zIndex: 2,
            ...placementStyle,
            minWidth,
            maxWidth,
            width: "max-content",
            fontFamily: HTML_UI_FONT_FAMILY,
            ...tooltipStyle,
          }}
          {...getDesignSystemDebugAttrs(boardSurfaceRecipes.objectSemanticsTooltip.shell.debug)}
        >
          {title ? (
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.2,
                fontWeight: 700,
                color: "inherit",
              }}
            >
              {title}
            </div>
          ) : null}
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.35,
              color: "inherit",
              textAlign: title ? undefined : "center",
              whiteSpace: "normal",
              wordBreak: "normal",
              overflowWrap: "break-word",
            }}
          >
            {body}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function resolvePlacementStyle(
  placement: HoverHintPlacement,
  offset: number
): CSSProperties {
  switch (placement) {
    case "top":
      return {
        left: "50%",
        bottom: `calc(100% + ${offset}px)`,
        transform: "translateX(-50%)",
      };
    case "bottom":
      return {
        left: "50%",
        top: `calc(100% + ${offset}px)`,
        transform: "translateX(-50%)",
      };
    case "left":
      return {
        right: `calc(100% + ${offset}px)`,
        top: "50%",
        transform: "translateY(-50%)",
      };
    case "right":
    default:
      return {
        left: `calc(100% + ${offset}px)`,
        top: "50%",
        transform: "translateY(-50%)",
      };
  }
}
