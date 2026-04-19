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
  stageScale?: number;
  variant?: "interaction" | "preview";
  shape?: "rect" | "circle";
};

export function RemoteInteractionIndicator({
  x,
  y,
  width,
  height,
  participantColor,
  stageScale = 1,
  variant = "interaction",
  shape = "rect",
}: RemoteInteractionIndicatorProps) {
  const frameOpacity = variant === "preview" ? 0.85 : 1;
  const viewportOutset = REMOTE_INTERACTION_FRAME_OUTSET / stageScale;
  const viewportStrokeWidth = REMOTE_INTERACTION_FRAME_STROKE_WIDTH / stageScale;
  const viewportDash = [10 / stageScale, 6 / stageScale];

  if (shape === "circle") {
    const radius = Math.max(width, height) / 2 + viewportOutset;

    return (
      <Circle
        x={x + width / 2}
        y={y + height / 2}
        radius={radius}
        stroke={participantColor}
        strokeWidth={viewportStrokeWidth}
        dash={viewportDash}
        opacity={frameOpacity}
        listening={false}
      />
    );
  }

  return (
    <Rect
      x={x - viewportOutset}
      y={y - viewportOutset}
      width={width + viewportOutset * 2}
      height={height + viewportOutset * 2}
      stroke={participantColor}
      strokeWidth={viewportStrokeWidth}
      dash={viewportDash}
      opacity={frameOpacity}
      listening={false}
    />
  );
}
