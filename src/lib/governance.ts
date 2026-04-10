import type { BoardObject, BoardObjectKind } from "../types/board";

export type AccessLevel = "none" | "non_destructive" | "full";
export type GovernanceActionKey =
  | "room.add-token"
  | "room.add-image"
  | "room.add-note"
  | "room.reset-board"
  | "board-object.move"
  | "board-object.edit"
  | "board-object.delete"
  | "board-object.clear-all-drawing"
  | "board-object.resize"
  | "board-object.draw";

export type GovernedEntityKind = "room" | "board-object";

export type GovernedEntityType = "room" | BoardObjectKind;

export type GovernedEntityRef = {
  kind: GovernedEntityKind;
  entityType: GovernedEntityType;
  entityId: string;
  creatorId?: string | null;
};

export type GovernedAction = {
  actionKey: GovernanceActionKey;
  requiredAccessLevel: AccessLevel;
};

export type EffectiveAccess = {
  participantId: string;
  accessLevel: AccessLevel;
};

export type GovernedActionAccessResolution = {
  entity: GovernedEntityRef;
  action: GovernedAction;
  effectiveAccess: EffectiveAccess | null;
  isAllowed: boolean;
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

export function classifyGovernedAction(params: {
  entity: GovernedEntityRef;
  actionKey: GovernanceActionKey;
}): GovernedAction {
  const requiredAccessLevel =
    params.actionKey === "room.reset-board" ||
    params.actionKey === "board-object.delete" ||
    params.actionKey === "board-object.clear-all-drawing"
      ? "full"
      : "none";

  return {
    actionKey: params.actionKey,
    requiredAccessLevel,
  };
}

export function resolveGovernedEntityAccess(params: {
  entity: GovernedEntityRef;
  participantId?: string | null;
  explicitAccessLevel?: AccessLevel | null;
  creatorAccessLevel?: AccessLevel | null;
  defaultAccessLevel?: AccessLevel;
}): EffectiveAccess | null {
  if (!params.participantId) {
    return null;
  }

  return {
    participantId: params.participantId,
    accessLevel: getEffectiveAccessLevel(params),
  };
}

export function hasRequiredAccessLevel(
  effectiveAccessLevel: AccessLevel,
  requiredAccessLevel: AccessLevel
): boolean {
  const accessRank: Record<AccessLevel, number> = {
    none: 0,
    non_destructive: 1,
    full: 2,
  };

  return accessRank[effectiveAccessLevel] >= accessRank[requiredAccessLevel];
}

export function resolveGovernedActionAccess(params: {
  entity: GovernedEntityRef;
  actionKey: GovernanceActionKey;
  participantId?: string | null;
  explicitAccessLevel?: AccessLevel | null;
  creatorAccessLevel?: AccessLevel | null;
  defaultAccessLevel?: AccessLevel;
}): GovernedActionAccessResolution {
  const action = classifyGovernedAction({
    entity: params.entity,
    actionKey: params.actionKey,
  });
  const effectiveAccess = resolveGovernedEntityAccess({
    entity: params.entity,
    participantId: params.participantId,
    explicitAccessLevel: params.explicitAccessLevel,
    creatorAccessLevel: params.creatorAccessLevel,
    defaultAccessLevel: params.defaultAccessLevel,
  });

  return {
    entity: params.entity,
    action,
    effectiveAccess,
    isAllowed: effectiveAccess
      ? hasRequiredAccessLevel(
          effectiveAccess.accessLevel,
          action.requiredAccessLevel
        )
      : false,
  };
}
