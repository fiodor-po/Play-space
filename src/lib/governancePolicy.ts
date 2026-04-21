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

export function resolveTokenGlyphChangePolicyAccess(params: {
  object: BoardObject;
  participantId?: string | null;
  roomCreatorId?: string | null;
}): GovernedActionAccessResolution {
  const isRoomCreatorOverride =
    !!params.roomCreatorId && params.roomCreatorId === params.participantId;

  return resolveGovernedActionAccess({
    entity: createBoardObjectGovernedEntityRef(params.object),
    actionKey: "board-object.change-token-glyph",
    participantId: params.participantId,
    explicitAccessLevel: isRoomCreatorOverride ? "full" : undefined,
    creatorAccessLevel: "full",
    defaultAccessLevel: "none",
  });
}

export function resolveImageClearAllDrawingPolicyAccess(params: {
  object: BoardObject;
  participantId?: string | null;
  roomCreatorId?: string | null;
}): GovernedActionAccessResolution {
  const isRoomCreatorOverride =
    !!params.roomCreatorId && params.roomCreatorId === params.participantId;

  return resolveGovernedActionAccess({
    entity: createBoardObjectGovernedEntityRef(params.object),
    actionKey: "board-object.clear-all-drawing",
    participantId: params.participantId,
    explicitAccessLevel: isRoomCreatorOverride ? "full" : undefined,
    creatorAccessLevel: "full",
    defaultAccessLevel: "none",
  });
}

export function resolveImageClearOwnDrawingPolicyAccess(params: {
  object: BoardObject;
  participantId?: string | null;
}): GovernedActionAccessResolution {
  const baseResolution = resolveGovernedActionAccess({
    entity: createBoardObjectGovernedEntityRef(params.object),
    actionKey: "board-object.clear-own-drawing",
    participantId: params.participantId,
    defaultAccessLevel: "none",
  });

  const hasOwnStrokes =
    !!params.participantId &&
    params.object.kind === "image" &&
    (params.object.imageStrokes ?? []).some(
      (stroke) => stroke.creatorId === params.participantId
    );

  return {
    ...baseResolution,
    isAllowed: baseResolution.isAllowed && hasOwnStrokes,
  };
}
