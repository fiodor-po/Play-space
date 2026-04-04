import type { BoardObject } from "../types/board";

export const initialObjects: BoardObject[] = [
  {
    id: "image-1",
    kind: "image",
    x: 1200,
    y: 900,
    width: 320,
    height: 200,
    fill: "#64748b",
    label: "Image",
    textColor: "#0f172a",
  },
  {
    id: "object-a",
    kind: "card",
    x: 300,
    y: 320,
    width: 240,
    height: 160,
    fill: "#334155",
    label: "Object A",
    textColor: "#f8fafc",
  },
  {
    id: "token-1",
    kind: "token",
    x: 700,
    y: 520,
    width: 180,
    height: 180,
    fill: "#475569",
    label: "Token",
    textColor: "#f8fafc",
  },
];