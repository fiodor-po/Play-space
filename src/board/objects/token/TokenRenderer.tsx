import { Group, Rect, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { BoardObject } from "../../../types/board";

type TokenRendererProps = {
  object: BoardObject;
  isSelected: boolean;
  onSelect: (event: KonvaEventObject<MouseEvent>) => void;
  onDragStart: (event: KonvaEventObject<DragEvent>) => void;
  onDragMove: (event: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (event: KonvaEventObject<DragEvent>) => void;
};

export function TokenRenderer({
  object,
  isSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
}: TokenRendererProps) {
  return (
    <Group
      x={object.x}
      y={object.y}
      draggable
      onMouseDown={onSelect}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    >
      {isSelected && (
        <Rect
          x={-4}
          y={-4}
          width={object.width + 8}
          height={object.height + 8}
          stroke="#60a5fa"
          strokeWidth={3}
          listening={false}
        />
      )}

      <Rect
        width={object.width}
        height={object.height}
        fill={object.fill}
        shadowBlur={8}
      />

      <Text
        x={0}
        y={object.height / 2 - 12}
        width={object.width}
        align="center"
        text={object.label}
        fontSize={24}
        fill={object.textColor ?? "#f8fafc"}
      />
    </Group>
  );
}
