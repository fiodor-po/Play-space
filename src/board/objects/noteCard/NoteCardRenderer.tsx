import { Group, Rect, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import {
  TEXT_CARD_BODY_FONT_FAMILY,
  TEXT_CARD_BODY_FONT_SIZE,
  TEXT_CARD_BODY_INSET_X,
  TEXT_CARD_BODY_INSET_Y,
  TEXT_CARD_BODY_LINE_HEIGHT,
} from "../../constants";
import type { BoardObject } from "../../../types/board";

const NOTE_CARD_AUTHOR_STRIPE_HEIGHT = 8;
const NOTE_CARD_AUTHOR_STRIPE_FALLBACK = "#94a3b8";
const NOTE_CARD_CORNER_RADIUS = 10;

type NoteCardRendererProps = {
  object: BoardObject;
  displayX?: number;
  displayY?: number;
  displayWidth?: number;
  displayHeight?: number;
  isEditing: boolean;
  draggable?: boolean;
  onGroupRef: (node: Konva.Group | null) => void;
  onSelect: (event: KonvaEventObject<MouseEvent>) => void;
  onDragStart: (event: KonvaEventObject<DragEvent>) => void;
  onDragMove: (event: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (event: KonvaEventObject<DragEvent>) => void;
  onTransformStart: (event: KonvaEventObject<Event>) => void;
  onTransform: (event: KonvaEventObject<Event>) => void;
  onTransformEnd: (event: KonvaEventObject<Event>) => void;
  onDoubleClick: (event: KonvaEventObject<MouseEvent>) => void;
  onHoverStart?: (event: KonvaEventObject<MouseEvent>) => void;
  onHoverMove?: (event: KonvaEventObject<MouseEvent>) => void;
  onHoverEnd?: () => void;
};

export function NoteCardRenderer({
  object,
  displayX,
  displayY,
  displayWidth,
  displayHeight,
  isEditing,
  draggable = true,
  onGroupRef,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformStart,
  onTransform,
  onTransformEnd,
  onDoubleClick,
  onHoverStart,
  onHoverMove,
  onHoverEnd,
}: NoteCardRendererProps) {
  const cardX = displayX ?? object.x;
  const cardY = displayY ?? object.y;
  const cardWidth = displayWidth ?? object.width;
  const cardHeight = displayHeight ?? object.height;
  const authorStripeColor =
    object.authorColor?.trim() || NOTE_CARD_AUTHOR_STRIPE_FALLBACK;

  return (
    <Group
      ref={onGroupRef}
      x={cardX}
      y={cardY}
      width={cardWidth}
      height={cardHeight}
      clipFunc={(context) => {
        context.beginPath();
        context.moveTo(NOTE_CARD_CORNER_RADIUS, 0);
        context.lineTo(cardWidth - NOTE_CARD_CORNER_RADIUS, 0);
        context.quadraticCurveTo(cardWidth, 0, cardWidth, NOTE_CARD_CORNER_RADIUS);
        context.lineTo(cardWidth, cardHeight - NOTE_CARD_CORNER_RADIUS);
        context.quadraticCurveTo(
          cardWidth,
          cardHeight,
          cardWidth - NOTE_CARD_CORNER_RADIUS,
          cardHeight
        );
        context.lineTo(NOTE_CARD_CORNER_RADIUS, cardHeight);
        context.quadraticCurveTo(
          0,
          cardHeight,
          0,
          cardHeight - NOTE_CARD_CORNER_RADIUS
        );
        context.lineTo(0, NOTE_CARD_CORNER_RADIUS);
        context.quadraticCurveTo(0, 0, NOTE_CARD_CORNER_RADIUS, 0);
        context.closePath();
      }}
      draggable={draggable && !isEditing}
      onMouseDown={onSelect}
      onDblClick={onDoubleClick}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onTransformStart={onTransformStart}
      onTransform={onTransform}
      onTransformEnd={onTransformEnd}
      onMouseEnter={onHoverStart}
      onMouseMove={onHoverMove}
      onMouseLeave={onHoverEnd}
    >
      <Rect
        width={cardWidth}
        height={cardHeight}
        fill={object.fill || "#ffffff"}
        stroke="#cbd5e1"
        strokeWidth={1}
        cornerRadius={NOTE_CARD_CORNER_RADIUS}
        shadowColor="#0f172a"
        shadowBlur={10}
        shadowOpacity={0.08}
        shadowOffsetY={4}
      />

      <Rect
        width={cardWidth}
        height={NOTE_CARD_AUTHOR_STRIPE_HEIGHT}
        fill={authorStripeColor}
        listening={false}
      />

      {!isEditing && (
        <Text
          x={TEXT_CARD_BODY_INSET_X}
          y={TEXT_CARD_BODY_INSET_Y}
          width={cardWidth - TEXT_CARD_BODY_INSET_X * 2}
          height={cardHeight - TEXT_CARD_BODY_INSET_Y * 2}
          text={object.label}
          fontSize={TEXT_CARD_BODY_FONT_SIZE}
          lineHeight={TEXT_CARD_BODY_LINE_HEIGHT}
          fontFamily={TEXT_CARD_BODY_FONT_FAMILY}
          fill={object.textColor ?? "#0f172a"}
          listening={false}
        />
      )}
    </Group>
  );
}
