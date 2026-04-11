import { Circle, Rect } from "react-konva";
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
  variant?: "interaction" | "preview";
  shape?: "rect" | "circle";
};

export function RemoteInteractionIndicator({
  x,
  y,
  width,
  height,
  participantColor,
  variant = "interaction",
  shape = "rect",
}: RemoteInteractionIndicatorProps) {
  const frameOpacity = variant === "preview" ? 0.85 : 1;

  if (shape === "circle") {
    const radius = Math.max(width, height) / 2 + REMOTE_INTERACTION_FRAME_OUTSET;

    return (
      <Circle
        x={x + width / 2}
        y={y + height / 2}
        radius={radius}
        stroke={participantColor}
        strokeWidth={REMOTE_INTERACTION_FRAME_STROKE_WIDTH}
        dash={[10, 6]}
        opacity={frameOpacity}
        listening={false}
      />
    );
  }

  return (
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
  );
}
