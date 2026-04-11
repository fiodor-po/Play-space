import type { BoardObject } from "../types/board";
import type { RoomBaselineDescriptor } from "./roomMetadata";

const PUBLIC_DEMO_V1_BASELINE_OBJECTS: BoardObject[] = [
  {
    id: "baseline-public-demo-v1-card",
    kind: "note-card",
    creatorId: "system",
    x: 1680,
    y: 1160,
    width: 640,
    height: 380,
    fill: "#f8fafc",
    label:
      "otheЯRoom\n\n- a shared board play space for sessions\n- add images with + or by drag and drop\n- draw directly on images\n- move things around together in real time\n- join a basic video call\n- roll shared 3D dice",
    authorColor: "#94a3b8",
    textColor: "#0f172a",
  },
];

export function getRoomBaselinePayload(
  baseline: RoomBaselineDescriptor
): BoardObject[] {
  if (baseline.baselineId === "public-demo-v1") {
    return PUBLIC_DEMO_V1_BASELINE_OBJECTS.map((object) => ({ ...object }));
  }

  return [];
}
