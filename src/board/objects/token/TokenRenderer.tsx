import { Circle, Group, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { BoardObject } from "../../../types/board";

type TokenRendererProps = {
  object: BoardObject;
  position?: {
    x: number;
    y: number;
  };
  stageScale: number;
  isSelected: boolean;
  selectionColor: string;
  fillColor: string;
  draggable?: boolean;
  onSelect: (event: KonvaEventObject<MouseEvent>) => void;
  onDragStart: (event: KonvaEventObject<DragEvent>) => void;
  onDragMove: (event: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (event: KonvaEventObject<DragEvent>) => void;
  onContextMenu?: (event: KonvaEventObject<PointerEvent>) => void;
  onHoverStart?: (event: KonvaEventObject<MouseEvent>) => void;
  onHoverMove?: (event: KonvaEventObject<MouseEvent>) => void;
  onHoverEnd?: () => void;
};

export function TokenRenderer({
  object,
  position,
  stageScale,
  isSelected,
  selectionColor,
  fillColor,
  draggable = true,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onContextMenu,
  onHoverStart,
  onHoverMove,
  onHoverEnd,
}: TokenRendererProps) {
  const radius = Math.min(object.width, object.height) / 2;
  const bodyRadius = Math.max(radius - 3, 8);
  const renderPosition = position ?? { x: object.x, y: object.y };
  const tokenGlyph = object.label?.trim() ?? "";
  const glyphFontSize = resolveTokenGlyphFontSize(tokenGlyph, radius);
  const glyphVisualOffsetY = resolveTokenGlyphVisualOffsetY(tokenGlyph);

  return (
    <Group
      x={renderPosition.x}
      y={renderPosition.y}
      scaleX={1 / stageScale}
      scaleY={1 / stageScale}
      draggable={draggable}
      onMouseDown={onSelect}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onContextMenu={onContextMenu}
      onMouseEnter={onHoverStart}
      onMouseMove={onHoverMove}
      onMouseLeave={onHoverEnd}
    >
      {isSelected && (
        <Circle
          x={0}
          y={0}
          radius={radius + 5}
          stroke={selectionColor}
          strokeWidth={3}
          listening={false}
        />
      )}

      <Circle
        x={0}
        y={0}
        radius={radius}
        fill="rgba(248, 250, 252, 0.16)"
        listening={false}
      />

      <Circle
        x={0}
        y={0}
        radius={bodyRadius}
        fill={fillColor}
        stroke="rgba(248, 250, 252, 0.92)"
        strokeWidth={2}
        shadowBlur={8}
        shadowColor="rgba(15, 23, 42, 0.45)"
      />

      {tokenGlyph ? (
        <Text
          x={-radius}
          y={-radius - glyphVisualOffsetY}
          width={radius * 2}
          height={radius * 2}
          text={tokenGlyph}
          align="center"
          verticalAlign="middle"
          fontSize={glyphFontSize}
          fontStyle="700"
          fill="#f8fafc"
          listening={false}
        />
      ) : null}
    </Group>
  );
}

function resolveTokenGlyphVisualOffsetY(glyph: string) {
  if (glyph === "■") {
    return 2;
  }

  if (glyph === "▲") {
    return 1;
  }

  if (glyph === "▼") {
    return -1;
  }

  return 1;
}

function resolveTokenGlyphFontSize(glyph: string, radius: number) {
  if (glyph === "▲" || glyph === "▼") {
    return Math.max(radius * 0.98, 12);
  }

  return Math.max(radius * 1.2, 14);
}
