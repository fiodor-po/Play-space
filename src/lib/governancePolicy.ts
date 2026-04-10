import type { BoardObject } from "../types/board";
import {
  createBoardObjectGovernedEntityRef,
  resolveGovernedActionAccess,
  type GovernedActionAccessResolution,
} from "./governance";

export function resolveBoardObjectDeletePolicyAccess(params: {
  object: BoardObject;
  participantId?: string | null;
  roomCreatorId?: string | null;
}): GovernedActionAccessResolution {
  const isRoomCreatorOverride =
    !!params.roomCreatorId && params.roomCreatorId === params.participantId;

  return resolveGovernedActionAccess({
    entity: createBoardObjectGovernedEntityRef(params.object),
    actionKey: "board-object.delete",
    participantId: params.participantId,
    explicitAccessLevel: isRoomCreatorOverride ? "full" : undefined,
    creatorAccessLevel: "full",
    defaultAccessLevel: "none",
  });
}
