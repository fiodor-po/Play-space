import { HTML_UI_FONT_FAMILY } from "../constants";

export type CursorOverlayItem = {
  participantId: string;
  left: number;
  top: number;
  name: string;
  color: string;
};

type CursorOverlayProps = {
  cursors: CursorOverlayItem[];
};

export function CursorOverlay({ cursors }: CursorOverlayProps) {
  return (
    <>
      {cursors.map((cursor) => (
        <div
          key={cursor.participantId}
          style={{
            position: "fixed",
            left: cursor.left,
            top: cursor.top,
            display: "flex",
            alignItems: "center",
            gap: 8,
            transform: "translate(-6px, -6px)",
            pointerEvents: "none",
            zIndex: 12,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: cursor.color,
              border: "2px solid rgba(255, 255, 255, 0.92)",
              boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.35)",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              maxWidth: 140,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              padding: "3px 8px",
              borderRadius: 999,
              background: "rgba(15, 23, 42, 0.92)",
              color: "#f8fafc",
              boxShadow: "0 8px 24px rgba(2, 6, 23, 0.28)",
              fontFamily: HTML_UI_FONT_FAMILY,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.2,
              border: `1px solid ${cursor.color}`,
            }}
            title={cursor.name}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </>
  );
}
