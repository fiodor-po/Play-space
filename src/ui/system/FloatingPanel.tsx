import { IconCheck, IconX } from "@tabler/icons-react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { HTML_UI_FONT_FAMILY } from "../../board/constants";
import { boardSurfaceRecipes } from "./boardSurfaces";
import { getDesignSystemDebugAttrs } from "./debugMeta";
import { interactionButtonRecipes, getButtonProps } from "./families/button";
import { border, text } from "./foundations";
import { uiTextStyle } from "./typography";

type FloatingPanelMode = "modal" | "floating";

type FloatingPanelProps = {
  children: ReactNode;
  title: ReactNode;
  mode?: FloatingPanelMode;
  confirmLabel?: string;
  cancelLabel?: string;
  initialPosition?: { x: number; y: number };
  positioning?: "fixed" | "absolute";
  width?: number;
  onCancel: () => void;
  onConfirm?: () => void;
};

const DEFAULT_FLOATING_PANEL_WIDTH = 360;
const DEFAULT_FLOATING_PANEL_POSITION = { x: 80, y: 120 };
const FLOATING_PANEL_Z_INDEX = 70;

export function FloatingPanel({
  children,
  title,
  mode = "floating",
  confirmLabel = "Confirm",
  cancelLabel = "Close",
  initialPosition = DEFAULT_FLOATING_PANEL_POSITION,
  positioning = "fixed",
  width = DEFAULT_FLOATING_PANEL_WIDTH,
  onCancel,
  onConfirm,
}: FloatingPanelProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    originX: number;
    originY: number;
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  const hasConfirmAction = typeof onConfirm === "function";
  const closeButtonProps = getButtonProps(interactionButtonRecipes.secondary.circle);
  const confirmButtonProps = getButtonProps(interactionButtonRecipes.primary.circle);
  const panelLeft =
    mode === "modal" ? `calc(50% + ${dragOffset.x}px)` : initialPosition.x + dragOffset.x;
  const panelTop =
    mode === "modal" ? `calc(50% + ${dragOffset.y}px)` : initialPosition.y + dragOffset.y;

  useEffect(() => {
    if (mode !== "modal") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [mode, onCancel]);

  const panel = (
    <div
      role={mode === "modal" ? "dialog" : undefined}
      aria-modal={mode === "modal" ? "true" : undefined}
      aria-label={typeof title === "string" ? title : "Floating panel"}
      style={{
        ...boardSurfaceRecipes.floatingShell.shell.style,
        position: positioning,
        left: panelLeft,
        top: panelTop,
        zIndex: FLOATING_PANEL_Z_INDEX + 1,
        width,
        maxWidth: "calc(100vw - 32px)",
        padding: 0,
        overflow: "hidden",
        transform: mode === "modal" ? "translate(-50%, -50%)" : undefined,
        fontFamily: HTML_UI_FONT_FAMILY,
      }}
      {...getDesignSystemDebugAttrs(boardSurfaceRecipes.floatingShell.shell.debug)}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          alignItems: "center",
          gap: 10,
          padding: "10px 10px 10px 14px",
          borderBottom: `1px solid ${border.default}`,
          cursor: "grab",
          userSelect: "none",
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragStateRef.current = {
            originX: dragOffset.x,
            originY: dragOffset.y,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
          };
        }}
        onPointerMove={(event) => {
          const dragState = dragStateRef.current;

          if (!dragState || dragState.pointerId !== event.pointerId) {
            return;
          }

          setDragOffset({
            x: dragState.originX + event.clientX - dragState.startX,
            y: dragState.originY + event.clientY - dragState.startY,
          });
        }}
        onPointerUp={(event) => {
          if (dragStateRef.current?.pointerId === event.pointerId) {
            dragStateRef.current = null;
          }
        }}
        onPointerCancel={(event) => {
          if (dragStateRef.current?.pointerId === event.pointerId) {
            dragStateRef.current = null;
          }
        }}
      >
        <div
          style={{
            ...uiTextStyle.label,
            minWidth: 0,
            overflow: "hidden",
            color: text.primary,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        <div
          style={{ display: "flex", gap: 8 }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
        >
          {hasConfirmAction ? (
            <button
              type="button"
              aria-label={confirmLabel}
              title={confirmLabel}
              onClick={onConfirm}
              {...confirmButtonProps}
              style={{
                ...confirmButtonProps.style,
                width: 30,
                minWidth: 30,
                minHeight: 30,
              }}
              {...getDesignSystemDebugAttrs(interactionButtonRecipes.primary.circle.debug)}
            >
              <IconCheck aria-hidden="true" size={17} stroke={2} />
            </button>
          ) : null}
          <button
            type="button"
            aria-label={cancelLabel}
            title={cancelLabel}
            onClick={onCancel}
            {...closeButtonProps}
            style={{
              ...closeButtonProps.style,
              width: 30,
              minWidth: 30,
              minHeight: 30,
            }}
            {...getDesignSystemDebugAttrs(interactionButtonRecipes.secondary.circle.debug)}
          >
            <IconX aria-hidden="true" size={17} stroke={2} />
          </button>
        </div>
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );

  if (mode !== "modal") {
    return panel;
  }

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: positioning,
          inset: 0,
          zIndex: FLOATING_PANEL_Z_INDEX,
          background: "rgba(2, 6, 23, 0.56)",
          backdropFilter: "blur(2px)",
        }}
      />
      {panel}
    </>
  );
}
