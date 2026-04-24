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
import { getBoardObjectElevationShadowRecipe } from "../../../ui/system/boardMaterials";

const NOTE_CARD_AUTHOR_STRIPE_HEIGHT = 8;
const NOTE_CARD_AUTHOR_STRIPE_FALLBACK = "#94a3b8";
const NOTE_CARD_CORNER_RADIUS = 10;

type NoteCardClipContext = {
  beginPath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  quadraticCurveTo: (
    cpx: number,
    cpy: number,
    x: number,
    y: number
  ) => void;
  closePath: () => void;
};

function clipRoundedNoteCard(
  context: NoteCardClipContext,
  width: number,
  height: number
) {
  context.beginPath();
  context.moveTo(NOTE_CARD_CORNER_RADIUS, 0);
  context.lineTo(width - NOTE_CARD_CORNER_RADIUS, 0);
  context.quadraticCurveTo(width, 0, width, NOTE_CARD_CORNER_RADIUS);
  context.lineTo(width, height - NOTE_CARD_CORNER_RADIUS);
  context.quadraticCurveTo(
    width,
    height,
    width - NOTE_CARD_CORNER_RADIUS,
    height
  );
  context.lineTo(NOTE_CARD_CORNER_RADIUS, height);
  context.quadraticCurveTo(0, height, 0, height - NOTE_CARD_CORNER_RADIUS);
  context.lineTo(0, NOTE_CARD_CORNER_RADIUS);
  context.quadraticCurveTo(0, 0, NOTE_CARD_CORNER_RADIUS, 0);
  context.closePath();
}

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
  const noteShadow = getBoardObjectElevationShadowRecipe("surface").konva;

  return (
    <Group
      ref={onGroupRef}
      x={cardX}
      y={cardY}
      width={cardWidth}
      height={cardHeight}
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
        cornerRadius={NOTE_CARD_CORNER_RADIUS}
        shadowColor={noteShadow.shadowColor}
        shadowBlur={noteShadow.shadowBlur}
        shadowOpacity={noteShadow.shadowOpacity}
        shadowOffsetX={noteShadow.shadowOffsetX}
        shadowOffsetY={noteShadow.shadowOffsetY}
      />

      <Group
        clipFunc={(context) => {
          clipRoundedNoteCard(context, cardWidth, cardHeight);
        }}
        listening={false}
      >
        <Rect
          width={cardWidth}
          height={cardHeight}
          fill={object.fill || "#ffffff"}
          listening={false}
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

    </Group>
  );
}
