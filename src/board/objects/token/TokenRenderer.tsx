import { Circle, Group, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { BoardObject, TokenVisualVariant } from "../../../types/board";
import { getBoardObjectElevationShadowRecipe } from "../../../ui/system/boardMaterials";
import { normalizeTokenVisualVariant } from "./createTokenObject";
import {
  normalizeTokenIconId,
  TOKEN_DEFAULT_ICON_ID,
  TokenKonvaIcon,
} from "./tokenIconSet";

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
  const visualVariant = normalizeTokenVisualVariant(object.tokenVisualVariant);
  const radius = Math.min(object.width, object.height) / 2;
  const isMiniToken = visualVariant === "mini";
  const isIconToken = visualVariant === "icon";
  const bodyRadius = isMiniToken ? radius : Math.max(radius - 3, 8);
  const renderPosition = position ?? { x: object.x, y: object.y };
  const tokenIconId = isIconToken
    ? normalizeTokenIconId(object.tokenIconId) ?? TOKEN_DEFAULT_ICON_ID
    : normalizeTokenIconId(object.tokenIconId);
  const tokenGlyph = isMiniToken || tokenIconId ? "" : object.label?.trim() ?? "";
  const glyphFontSize = resolveTokenGlyphFontSize(
    tokenGlyph,
    radius,
    visualVariant
  );
  const glyphVisualOffsetY = resolveTokenGlyphVisualOffsetY(tokenGlyph);
  const tokenShadow = getBoardObjectElevationShadowRecipe(
    object.tokenAttachment?.mode === "attached" ? "surface" : "raised"
  ).konva;

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
        radius={bodyRadius}
        fill={fillColor}
        stroke="rgba(248, 250, 252, 0.92)"
        strokeWidth={isMiniToken ? 2.5 : 2}
        shadowBlur={tokenShadow.shadowBlur}
        shadowColor={tokenShadow.shadowColor}
        shadowOffsetX={tokenShadow.shadowOffsetX}
        shadowOffsetY={tokenShadow.shadowOffsetY}
        shadowOpacity={tokenShadow.shadowOpacity}
      />

      {tokenIconId ? (
        <TokenKonvaIcon
          iconId={tokenIconId}
          size={radius * 1.18}
          stroke="#f8fafc"
          strokeWidth={2.15}
        />
      ) : null}

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

function resolveTokenGlyphFontSize(
  glyph: string,
  radius: number,
  visualVariant: TokenVisualVariant
) {
  if (visualVariant === "icon") {
    return Math.max(radius * 1.12, 26);
  }

  if (glyph === "▲" || glyph === "▼") {
    return Math.max(radius * 0.98, 12);
  }

  return Math.max(radius * 1.2, 14);
}
