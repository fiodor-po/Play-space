import type { CSSProperties } from "react";
import { PARTICIPANT_AVATAR_FACE_IDS } from "../../lib/participantAvatarFaces";
import { ParticipantAvatarFaceIcon } from "../../media/ParticipantAvatarFaceIcon";
import { border, surface, text } from "./foundations";

const faceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
};

const faceItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "36px minmax(0, 1fr)",
  alignItems: "center",
  gap: 10,
  minWidth: 0,
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${border.default}`,
  background: surface.panelSubtle,
};

const faceIconSlotStyle: CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: 36,
  height: 36,
};

const faceIdStyle: CSSProperties = {
  minWidth: 0,
  color: text.primary,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 12,
  lineHeight: 1.2,
  overflowWrap: "anywhere",
};

export function ParticipantAvatarFaceIconList() {
  return (
    <div style={faceGridStyle}>
      {PARTICIPANT_AVATAR_FACE_IDS.map((faceId) => (
        <div key={faceId} style={faceItemStyle}>
          <div style={faceIconSlotStyle}>
            <ParticipantAvatarFaceIcon faceId={faceId} size={64} />
          </div>
          <div style={faceIdStyle}>{faceId}</div>
        </div>
      ))}
    </div>
  );
}
