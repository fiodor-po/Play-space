import { Group, Rect, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import {
  NOTE_HANDLE_SIZE,
  TEXT_CARD_BODY_FONT_FAMILY,
  TEXT_CARD_BODY_FONT_SIZE,
  TEXT_CARD_BODY_INSET_X,
  TEXT_CARD_BODY_INSET_Y,
  TEXT_CARD_BODY_LINE_HEIGHT,
  TEXT_CARD_HEADER_HEIGHT,
} from "../../constants";
import { RemoteInteractionIndicator } from "../../components/RemoteInteractionIndicator";
import type { BoardObject } from "../../../types/board";

type TextCardRendererProps = {
  object: BoardObject;
  displayX?: number;
  displayY?: number;
  displayWidth?: number;
  displayHeight?: number;
  isSelected: boolean;
  isEditing: boolean;
  selectionColor: string;
  accentColor: string;
  remoteEditingIndicator?: {
    participantName: string;
    participantColor: string;
  } | null;
  remoteResizeIndicator?: {
    participantName: string;
    participantColor: string;
  } | null;
  onGroupRef: (node: Konva.Group | null) => void;
  onSelect: (event: KonvaEventObject<MouseEvent>) => void;
  onDragStart: (event: KonvaEventObject<DragEvent>) => void;
  onDragMove: (event: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (event: KonvaEventObject<DragEvent>) => void;
  onTransformStart: (event: KonvaEventObject<Event>) => void;
  onTransform: (event: KonvaEventObject<Event>) => void;
  onTransformEnd: (event: KonvaEventObject<Event>) => void;
  onHandleMouseDown: (event: KonvaEventObject<MouseEvent>) => void;
  onBodyMouseDown: () => void;
  onBodyDoubleClick: (event: KonvaEventObject<MouseEvent>) => void;
  onHoverStart?: (event: KonvaEventObject<MouseEvent>) => void;
  onHoverMove?: (event: KonvaEventObject<MouseEvent>) => void;
  onHoverEnd?: () => void;
};

export function TextCardRenderer({
  object,
  displayX,
  displayY,
  displayWidth,
  displayHeight,
  isSelected,
  isEditing,
  selectionColor,
  accentColor,
  remoteEditingIndicator,
  remoteResizeIndicator,
  onGroupRef,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformStart,
  onTransform,
  onTransformEnd,
  onHandleMouseDown,
  onBodyMouseDown,
  onBodyDoubleClick,
  onHoverStart,
  onHoverMove,
  onHoverEnd,
}: TextCardRendererProps) {
  const cardX = displayX ?? object.x;
  const cardY = displayY ?? object.y;
  const cardWidth = displayWidth ?? object.width;
  const cardHeight = displayHeight ?? object.height;

  return (
    <Group
      ref={onGroupRef}
      x={cardX}
      y={cardY}
      width={cardWidth}
      height={cardHeight}
      draggable={!isEditing}
      onMouseDown={onSelect}
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
      {isSelected && (
        <Rect
          x={-4}
          y={-4}
          width={cardWidth + 8}
          height={cardHeight + 8}
          stroke={selectionColor}
          strokeWidth={3}
          listening={false}
        />
      )}

      {remoteResizeIndicator && (
        <RemoteInteractionIndicator
          x={0}
          y={0}
          width={cardWidth}
          height={cardHeight}
          participantColor={remoteResizeIndicator.participantColor}
        />
      )}

      {!remoteResizeIndicator && remoteEditingIndicator && (
        <RemoteInteractionIndicator
          x={0}
          y={0}
          width={cardWidth}
          height={cardHeight}
          participantColor={remoteEditingIndicator.participantColor}
        />
      )}

      <Rect
        width={cardWidth}
        height={cardHeight}
        fill={object.fill}
        shadowBlur={8}
      />

      <Rect
        width={cardWidth}
        height={TEXT_CARD_HEADER_HEIGHT}
        fill="#e2e8f0"
      />

      <Rect
        x={10}
        y={9}
        width={NOTE_HANDLE_SIZE}
        height={NOTE_HANDLE_SIZE}
        fill={accentColor}
        cornerRadius={6}
        onMouseDown={onHandleMouseDown}
      />

      <Text
        x={40}
        y={10}
        text="Note"
        fontSize={14}
        fontStyle="bold"
        fill="#334155"
        listening={false}
      />

      <Rect
        y={TEXT_CARD_HEADER_HEIGHT}
        width={cardWidth}
        height={cardHeight - TEXT_CARD_HEADER_HEIGHT}
        fill={object.fill}
        onMouseDown={onBodyMouseDown}
        onDblClick={onBodyDoubleClick}
      />

      {!isEditing && (
        <Text
          x={TEXT_CARD_BODY_INSET_X}
          y={TEXT_CARD_HEADER_HEIGHT + TEXT_CARD_BODY_INSET_Y}
          width={cardWidth - TEXT_CARD_BODY_INSET_X * 2}
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
