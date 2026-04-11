import { Circle, Group } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { BoardObject } from "../../../types/board";
import { RemoteInteractionIndicator } from "../../components/RemoteInteractionIndicator";

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
  occupiedIndicatorColor?: string | null;
  onSelect: (event: KonvaEventObject<MouseEvent>) => void;
  onDragStart: (event: KonvaEventObject<DragEvent>) => void;
  onDragMove: (event: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (event: KonvaEventObject<DragEvent>) => void;
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
  occupiedIndicatorColor,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onHoverStart,
  onHoverMove,
  onHoverEnd,
}: TokenRendererProps) {
  const radius = Math.min(object.width, object.height) / 2;
  const bodyRadius = Math.max(radius - 3, 8);
  const renderPosition = position ?? { x: object.x, y: object.y };

  return (
    <Group
      x={renderPosition.x}
      y={renderPosition.y}
      scaleX={1 / stageScale}
      scaleY={1 / stageScale}
      draggable
      onMouseDown={onSelect}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onMouseEnter={onHoverStart}
      onMouseMove={onHoverMove}
      onMouseLeave={onHoverEnd}
    >
      {occupiedIndicatorColor ? (
        <RemoteInteractionIndicator
          x={-object.width / 2}
          y={-object.height / 2}
          width={object.width}
          height={object.height}
          participantColor={occupiedIndicatorColor}
          shape="circle"
        />
      ) : null}

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
    </Group>
  );
}
