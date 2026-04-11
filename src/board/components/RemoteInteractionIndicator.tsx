import { Rect } from "react-konva";
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
};

export function RemoteInteractionIndicator({
  x,
  y,
  width,
  height,
  participantColor,
  variant = "interaction",
}: RemoteInteractionIndicatorProps) {
  const frameOpacity = variant === "preview" ? 0.85 : 1;

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
