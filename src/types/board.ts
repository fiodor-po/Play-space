export type BoardObjectKind = "image" | "text-card" | "token";

export type ImageStroke = {
  color: string;
  creatorId?: string;
  points: number[];
  width?: number;
};

export type BoardObject = {
  id: string;
  kind: BoardObjectKind;
  creatorId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  label: string;
  authorColor?: string;
  imageStrokes?: ImageStroke[];
  src?: string;
  textColor?: string;
};

export type ViewportState = {
  x: number;
  y: number;
  scale: number;
};
