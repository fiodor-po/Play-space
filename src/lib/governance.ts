import type { BoardObject, BoardObjectKind } from "../types/board";

export type AccessLevel = "none" | "non_destructive" | "full";

export type GovernedEntityKind = "room" | "board-object";

export type GovernedEntityType = "room" | BoardObjectKind;

export type GovernedEntityRef = {
  kind: GovernedEntityKind;
  entityType: GovernedEntityType;
  entityId: string;
  creatorId?: string | null;
};

export type GovernedAction = {
  actionKey: string;
  requiredAccessLevel: AccessLevel;
};

export type EffectiveAccess = {
  participantId: string;
  accessLevel: AccessLevel;
};

export function createRoomGovernedEntityRef(params: {
  roomId: string;
  creatorId?: string | null;
}): GovernedEntityRef {
  return {
    kind: "room",
    entityType: "room",
    entityId: params.roomId,
    creatorId: params.creatorId ?? null,
  };
}

export function createBoardObjectGovernedEntityRef(
  object: BoardObject
): GovernedEntityRef {
  return {
    kind: "board-object",
    entityType: object.kind,
    entityId: object.id,
    creatorId: object.creatorId ?? null,
  };
}

export function getEffectiveAccessLevel(params: {
  entity: GovernedEntityRef;
  participantId?: string | null;
  explicitAccessLevel?: AccessLevel | null;
  creatorAccessLevel?: AccessLevel | null;
  defaultAccessLevel?: AccessLevel;
}): AccessLevel {
  if (!params.participantId) {
    return "none";
  }

  if (params.explicitAccessLevel) {
    return params.explicitAccessLevel;
  }

  if (
    params.creatorAccessLevel &&
    params.entity.creatorId &&
    params.entity.creatorId === params.participantId
  ) {
    return params.creatorAccessLevel;
  }

  return params.defaultAccessLevel ?? "none";
}
