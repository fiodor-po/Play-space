import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { getDesignSystemDebugAttrs } from "./debugMeta";
import { contextMenuRecipes } from "./families/contextMenu";

type ContextMenuAnchorPoint = {
  x: number;
  y: number;
};

export type ContextMenuItem =
  | {
      type: "item";
      id: string;
      label: ReactNode;
      onSelect: () => void;
      align?: "start" | "center";
      ariaLabel?: string;
      disabled?: boolean;
      focusScope?: "in-focus" | "out-of-focus";
      icon?: ReactNode;
      labelStyle?: CSSProperties;
      selected?: boolean;
      shortcut?: ReactNode;
      testId?: string;
      variant?: "default" | "destructive";
    }
  | {
      type: "separator";
      id: string;
    }
  | {
      type: "section-label";
      id: string;
      label: ReactNode;
    };

type ContextMenuProps = {
  anchorPoint: ContextMenuAnchorPoint | null;
  ariaLabel: string;
  items: ContextMenuItem[];
  gridColumnCount?: number;
  layout?: "list" | "grid";
  maxWidth?: number;
  minWidth?: number;
  onClose: () => void;
  zIndex?: number;
};

const VIEWPORT_MARGIN = 8;
const DEFAULT_CONTEXT_MENU_MIN_WIDTH = 180;
const DEFAULT_CONTEXT_MENU_MAX_WIDTH = 260;
const DEFAULT_CONTEXT_MENU_Z_INDEX = 41;
const CONTEXT_MENU_GRID_ITEM_SIZE = 38;
const CONTEXT_MENU_GRID_GAP = 5;

function clampContextMenuPosition(
  anchorPoint: ContextMenuAnchorPoint,
  width: number,
  height: number
) {
  if (typeof window === "undefined") {
    return {
      left: anchorPoint.x,
      top: anchorPoint.y,
    };
  }

  const maxLeft = Math.max(
    VIEWPORT_MARGIN,
    window.innerWidth - width - VIEWPORT_MARGIN
  );
  const maxTop = Math.max(
    VIEWPORT_MARGIN,
    window.innerHeight - height - VIEWPORT_MARGIN
  );

  return {
    left: Math.min(Math.max(anchorPoint.x, VIEWPORT_MARGIN), maxLeft),
    top: Math.min(Math.max(anchorPoint.y, VIEWPORT_MARGIN), maxTop),
  };
}

export function ContextMenu({
  anchorPoint,
  ariaLabel,
  gridColumnCount = 5,
  items,
  layout = "list",
  maxWidth = DEFAULT_CONTEXT_MENU_MAX_WIDTH,
  minWidth = DEFAULT_CONTEXT_MENU_MIN_WIDTH,
  onClose,
  zIndex = DEFAULT_CONTEXT_MENU_Z_INDEX,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState(() =>
    anchorPoint
      ? clampContextMenuPosition(anchorPoint, minWidth, 0)
      : { left: 0, top: 0 }
  );

  useLayoutEffect(() => {
    if (!anchorPoint) {
      return;
    }

    const menuRect = menuRef.current?.getBoundingClientRect();
    const nextPosition = clampContextMenuPosition(
      anchorPoint,
      menuRect?.width ?? minWidth,
      menuRect?.height ?? 0
    );

    setPosition((currentPosition) =>
      currentPosition.left === nextPosition.left &&
      currentPosition.top === nextPosition.top
        ? currentPosition
        : nextPosition
    );
  }, [anchorPoint, items, minWidth]);

  useEffect(() => {
    if (!anchorPoint) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (target instanceof Node && menuRef.current?.contains(target)) {
        return;
      }

      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const handleViewportChange = () => {
      onClose();
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("resize", handleViewportChange, true);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("resize", handleViewportChange, true);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [anchorPoint, onClose]);

  if (!anchorPoint) {
    return null;
  }

  const isGridLayout = layout === "grid";

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={ariaLabel}
      className={contextMenuRecipes.shell.className}
      style={{
        ...contextMenuRecipes.shell.style,
        gap: isGridLayout ? CONTEXT_MENU_GRID_GAP : contextMenuRecipes.shell.style.gap,
        gridTemplateColumns: isGridLayout
          ? `repeat(${gridColumnCount}, ${CONTEXT_MENU_GRID_ITEM_SIZE}px)`
          : undefined,
        left: position.left,
        top: position.top,
        minWidth,
        maxWidth,
        zIndex,
      }}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      {...getDesignSystemDebugAttrs(contextMenuRecipes.shell.debug)}
    >
      {items.map((item) => {
        if (item.type === "separator") {
          return (
            <div
              key={item.id}
              role="separator"
              className={contextMenuRecipes.separator.className}
              style={{
                ...contextMenuRecipes.separator.style,
                gridColumn: isGridLayout ? "1 / -1" : undefined,
              }}
              {...getDesignSystemDebugAttrs(contextMenuRecipes.separator.debug)}
            />
          );
        }

        if (item.type === "section-label") {
          return (
            <div
              key={item.id}
              className={contextMenuRecipes.sectionLabel.className}
              style={{
                ...contextMenuRecipes.sectionLabel.style,
                gridColumn: isGridLayout ? "1 / -1" : undefined,
              }}
              {...getDesignSystemDebugAttrs(contextMenuRecipes.sectionLabel.debug)}
            >
              {item.label}
            </div>
          );
        }

        const isCentered = item.align === "center";
        const itemRecipe = isGridLayout
          ? contextMenuRecipes.gridItem
          : contextMenuRecipes.item;

        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            aria-label={item.ariaLabel}
            disabled={item.disabled}
            data-testid={item.testId}
            data-ui-focus-scope={
              item.focusScope === "out-of-focus" ? "out-of-focus" : undefined
            }
            data-ui-selected={item.selected ? "true" : undefined}
            data-ui-variant={item.variant ?? "default"}
            className={itemRecipe.className}
            style={{
              ...itemRecipe.style,
              gridTemplateColumns:
                !isGridLayout && (item.icon || item.shortcut || item.selected)
                  ? "auto minmax(0, 1fr) auto"
                  : itemRecipe.style.gridTemplateColumns,
              justifyItems: isGridLayout
                ? itemRecipe.style.justifyItems
                : isCentered
                  ? "center"
                  : "stretch",
              textAlign: isGridLayout
                ? itemRecipe.style.textAlign
                : isCentered
                  ? "center"
                  : "left",
            }}
            onClick={(event) => {
              event.stopPropagation();

              if (item.disabled) {
                return;
              }

              item.onSelect();
              onClose();
            }}
            {...getDesignSystemDebugAttrs(itemRecipe.debug)}
          >
            {item.icon && !isGridLayout ? (
              <span aria-hidden="true">{item.icon}</span>
            ) : null}
            <span
              style={{
                ...(isGridLayout
                  ? {
                      display: "grid",
                      height: "100%",
                      placeItems: "center",
                      width: "100%",
                    }
                  : {
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }),
                ...item.labelStyle,
              }}
            >
              {isGridLayout ? item.icon ?? item.label : item.label}
            </span>
            {!isGridLayout && (item.shortcut || item.selected) ? (
              <span aria-hidden="true">{item.shortcut ?? "✓"}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
