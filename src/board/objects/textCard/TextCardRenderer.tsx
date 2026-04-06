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
import type { BoardObject } from "../../../types/board";

type TextCardRendererProps = {
  object: BoardObject;
  isSelected: boolean;
  isEditing: boolean;
  selectionColor: string;
  remoteEditingIndicator?: {
    participantName: string;
    participantColor: string;
  } | null;
  onGroupRef: (node: Konva.Group | null) => void;
  onSelect: (event: KonvaEventObject<MouseEvent>) => void;
  onDragStart: (event: KonvaEventObject<DragEvent>) => void;
  onDragMove: (event: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (event: KonvaEventObject<DragEvent>) => void;
  onHandleMouseDown: (event: KonvaEventObject<MouseEvent>) => void;
  onBodyMouseDown: () => void;
  onBodyDoubleClick: (event: KonvaEventObject<MouseEvent>) => void;
};

export function TextCardRenderer({
  object,
  isSelected,
  isEditing,
  selectionColor,
  remoteEditingIndicator,
  onGroupRef,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onHandleMouseDown,
  onBodyMouseDown,
  onBodyDoubleClick,
}: TextCardRendererProps) {
  const remoteEditingLabel = remoteEditingIndicator
    ? `${remoteEditingIndicator.participantName} editing`
    : null;
  const remoteEditingLabelWidth = remoteEditingLabel
    ? Math.max(88, remoteEditingLabel.length * 6.5 + 18)
    : 0;

  return (
    <Group
      ref={onGroupRef}
      x={object.x}
      y={object.y}
      draggable={!isEditing}
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
          stroke={selectionColor}
          strokeWidth={3}
          listening={false}
        />
      )}

      {remoteEditingIndicator && (
        <>
          <Rect
            x={-6}
            y={-6}
            width={object.width + 12}
            height={object.height + 12}
            stroke={remoteEditingIndicator.participantColor}
            strokeWidth={2}
            dash={[10, 6]}
            listening={false}
          />
          <Rect
            x={Math.max(0, object.width - remoteEditingLabelWidth)}
            y={-30}
            width={remoteEditingLabelWidth}
            height={22}
            fill="#0f172a"
            stroke={remoteEditingIndicator.participantColor}
            strokeWidth={1.5}
            cornerRadius={999}
            listening={false}
          />
          <Text
            x={Math.max(0, object.width - remoteEditingLabelWidth)}
            y={-24}
            width={remoteEditingLabelWidth}
            align="center"
            text={remoteEditingLabel ?? ""}
            fontSize={11}
            fontStyle="bold"
            fill="#f8fafc"
            listening={false}
          />
        </>
      )}

      <Rect
        width={object.width}
        height={object.height}
        fill={object.fill}
        shadowBlur={8}
      />

      <Rect
        width={object.width}
        height={TEXT_CARD_HEADER_HEIGHT}
        fill="#e2e8f0"
      />

      <Rect
        x={10}
        y={9}
        width={NOTE_HANDLE_SIZE}
        height={NOTE_HANDLE_SIZE}
        fill={object.authorColor ?? "#94a3b8"}
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
        width={object.width}
        height={object.height - TEXT_CARD_HEADER_HEIGHT}
        fill={object.fill}
        onMouseDown={onBodyMouseDown}
        onDblClick={onBodyDoubleClick}
      />

      {!isEditing && (
        <Text
          x={TEXT_CARD_BODY_INSET_X}
          y={TEXT_CARD_HEADER_HEIGHT + TEXT_CARD_BODY_INSET_Y}
          width={object.width - TEXT_CARD_BODY_INSET_X * 2}
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
