export type BoardObjectKind = "image" | "text-card" | "token";

export type BoardObject = {
  id: string;
  kind: BoardObjectKind;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  label: string;
  textColor?: string;
};

export type ViewportState = {
  x: number;
  y: number;
  scale: number;
};