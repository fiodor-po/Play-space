import { Rect, Text } from "react-konva";
import {
  REMOTE_INTERACTION_FRAME_OUTSET,
  REMOTE_INTERACTION_FRAME_STROKE_WIDTH,
} from "../constants";

type RemoteInteractionIndicatorProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  participantColor: string;
  label?: string;
  variant?: "interaction" | "preview";
};

const REMOTE_INTERACTION_LABEL_MIN_WIDTH = 88;
const REMOTE_INTERACTION_LABEL_HORIZONTAL_PADDING = 18;
const REMOTE_INTERACTION_LABEL_CHAR_WIDTH = 6.5;
const REMOTE_INTERACTION_LABEL_HEIGHT = 22;
const REMOTE_INTERACTION_LABEL_OFFSET_Y = 30;
const REMOTE_INTERACTION_LABEL_TEXT_OFFSET_Y = 24;
const REMOTE_INTERACTION_LABEL_STROKE_WIDTH = 1.5;
const REMOTE_INTERACTION_LABEL_CORNER_RADIUS = 999;

export function RemoteInteractionIndicator({
  x,
  y,
  width,
  height,
  participantColor,
  label,
  variant = "interaction",
}: RemoteInteractionIndicatorProps) {
  const labelWidth = label
    ? Math.max(
        REMOTE_INTERACTION_LABEL_MIN_WIDTH,
        label.length * REMOTE_INTERACTION_LABEL_CHAR_WIDTH +
          REMOTE_INTERACTION_LABEL_HORIZONTAL_PADDING
      )
    : 0;
  const labelX = x + Math.max(0, width - labelWidth);
  const frameOpacity = variant === "preview" ? 0.85 : 1;

  return (
    <>
      <Rect
        x={x - REMOTE_INTERACTION_FRAME_OUTSET}
        y={y - REMOTE_INTERACTION_FRAME_OUTSET}
        width={width + REMOTE_INTERACTION_FRAME_OUTSET * 2}
        height={height + REMOTE_INTERACTION_FRAME_OUTSET * 2}
        stroke={participantColor}
        strokeWidth={REMOTE_INTERACTION_FRAME_STROKE_WIDTH}
        dash={[10, 6]}
        opacity={frameOpacity}
        listening={false}
      />
      {label && (
        <>
          <Rect
            x={labelX}
            y={y - REMOTE_INTERACTION_LABEL_OFFSET_Y}
            width={labelWidth}
            height={REMOTE_INTERACTION_LABEL_HEIGHT}
            fill="#0f172a"
            stroke={participantColor}
            strokeWidth={REMOTE_INTERACTION_LABEL_STROKE_WIDTH}
            cornerRadius={REMOTE_INTERACTION_LABEL_CORNER_RADIUS}
            listening={false}
          />
          <Text
            x={labelX}
            y={y - REMOTE_INTERACTION_LABEL_TEXT_OFFSET_Y}
            width={labelWidth}
            align="center"
            text={label}
            fontSize={11}
            fontStyle="bold"
            fill="#f8fafc"
            listening={false}
          />
        </>
      )}
    </>
  );
}
