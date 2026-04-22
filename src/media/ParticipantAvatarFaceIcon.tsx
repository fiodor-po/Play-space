import type { CSSProperties, SVGProps } from "react";
import {
  IconGhost,
  IconMoodAngry,
  IconMoodBoy,
  IconMoodConfuzed,
  IconMoodCrazyHappy,
  IconMoodHappy,
  IconMoodKid,
  IconMoodNerd,
  IconMoodPuzzled,
  IconMoodSad,
  IconMoodSick,
  IconMoodSmile,
  IconMoodSurprised,
  IconMoodTongue,
  IconMoodWink,
  IconMoodXd,
  type TablerIcon,
} from "@tabler/icons-react";
import type { ParticipantAvatarFaceId } from "../lib/participantAvatarFaces";

export const PARTICIPANT_AVATAR_FACE_ICON_SIZE_RATIO = 0.56;

const PARTICIPANT_AVATAR_FACE_COMPONENTS = {
  "mood-smile": IconMoodSmile,
  "mood-happy": IconMoodHappy,
  "mood-crazy-happy": IconMoodCrazyHappy,
  "mood-wink": IconMoodWink,
  "mood-tongue": IconMoodTongue,
  "mood-nerd": IconMoodNerd,
  "mood-boy": IconMoodBoy,
  "mood-xd": IconMoodXd,
  ghost: IconGhost,
  "mood-kid": IconMoodKid,
  "mood-surprised": IconMoodSurprised,
  "mood-confuzed": IconMoodConfuzed,
  "mood-puzzled": IconMoodPuzzled,
  "mood-sad": IconMoodSad,
  "mood-angry": IconMoodAngry,
  "mood-sick": IconMoodSick,
} satisfies Record<ParticipantAvatarFaceId, TablerIcon>;

type ParticipantAvatarFaceIconProps = {
  ariaHidden?: boolean;
  faceId: ParticipantAvatarFaceId;
  size: number;
  stroke?: number;
  style?: CSSProperties;
} & Omit<SVGProps<SVGSVGElement>, "color" | "size" | "stroke" | "style">;

export function getParticipantAvatarFaceIconPixelSize(size: number) {
  return Math.round(size * PARTICIPANT_AVATAR_FACE_ICON_SIZE_RATIO);
}

export function ParticipantAvatarFaceIcon({
  ariaHidden = true,
  faceId,
  size,
  stroke = 1.8,
  style,
  ...svgProps
}: ParticipantAvatarFaceIconProps) {
  const FaceIcon = PARTICIPANT_AVATAR_FACE_COMPONENTS[faceId];

  return (
    <FaceIcon
      {...svgProps}
      aria-hidden={ariaHidden}
      color="#ffffff"
      size={getParticipantAvatarFaceIconPixelSize(size)}
      stroke={stroke}
      style={{
        overflow: "visible",
        pointerEvents: "none",
        strokeWidth: stroke,
        ...style,
      }}
    />
  );
}
