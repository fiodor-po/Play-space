export type BoardObjectKind = "image" | "note-card" | "token";

export type ImageStroke = {
  color: string;
  creatorId?: string;
  points: number[];
  width?: number;
};

export type TokenAttachment =
  | {
      mode: "free";
    }
  | {
      mode: "attached";
      parentObjectId: string;
      parentObjectKind: BoardObjectKind;
      coordinateSpace: "parent-normalized";
      anchor: {
        x: number;
        y: number;
      };
    };

export type BoardObject = {
  id: string;
  kind: BoardObjectKind;
  creatorId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  anchorPosition?: "top-left" | "center";
  fill: string;
  label: string;
  authorColor?: string;
  tokenAttachment?: TokenAttachment;
  imageStrokes?: ImageStroke[];
  src?: string;
  textColor?: string;
};

export type ViewportState = {
  x: number;
  y: number;
  scale: number;
};
