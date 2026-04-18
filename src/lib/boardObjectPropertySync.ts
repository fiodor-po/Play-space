import * as Y from "yjs";
import { normalizeNoteCardObject } from "../board/objects/noteCard/sizing";
import { normalizeTokenObject } from "../board/objects/token/createTokenObject";
import type { BoardObject, TokenAttachment } from "../types/board";

const PROPERTY_KEY_PREFIX = "prop:";
const SHARED_ENTRY_BASE_KEY = "base";
const SHARED_ENTRY_KIND_KEY = "kind";
const SHARED_ENTRY_LAST_CHANGED_AT_KEY = "lastChangedAt";
const SHARED_ENTRY_LAST_CHANGED_PROPERTIES_KEY = "lastChangedProperties";
const SHARED_ENTRY_LAST_WRITE_MODE_KEY = "lastWriteMode";
const SHARED_ENTRY_SCHEMA_VERSION_KEY = "schemaVersion";
const PROPERTY_SYNC_SCHEMA_VERSION = 1;

export const BOARD_OBJECT_PROPERTY_SYNC_SCHEMA = {
  token: ["x", "y", "tokenAttachment"],
  "note-card": ["x", "y", "width", "height"],
  image: ["x", "y", "width", "height"],
} as const;

type PropertySyncKind = keyof typeof BOARD_OBJECT_PROPERTY_SYNC_SCHEMA;

type SupportedPropertyName =
  | "x"
  | "y"
  | "width"
  | "height"
  | "tokenAttachment";

type PropertySyncWriteMode =
  | "legacy-whole-object"
  | "entry-create"
  | "legacy-upgrade"
  | "property-only"
  | "property-and-base"
  | "base-only"
  | "noop";

export type BoardObjectPropertySyncDebugEntry = {
  objectId: string;
  kind: BoardObject["kind"];
  usesPropertySync: boolean;
  migratedProperties: SupportedPropertyName[];
  storedPropertyValues: Partial<Record<SupportedPropertyName, string>>;
  lastChangedProperties: SupportedPropertyName[];
  lastChangedAt: number | null;
  lastWriteMode: PropertySyncWriteMode | null;
  reconstructedObject: BoardObject | null;
};

function isPropertySyncKind(kind: BoardObject["kind"]): kind is PropertySyncKind {
  return kind in BOARD_OBJECT_PROPERTY_SYNC_SCHEMA;
}

function getPropertyKey(property: SupportedPropertyName) {
  return `${PROPERTY_KEY_PREFIX}${property}`;
}

function getMigratedProperties(kind: PropertySyncKind) {
  return BOARD_OBJECT_PROPERTY_SYNC_SCHEMA[kind];
}

function encodePropertyValue(value: unknown) {
  if (value === undefined) {
    return null;
  }

  return JSON.stringify(value);
}

function parseBoardObject(json: string, fallbackId: string) {
  const parsed = JSON.parse(json) as BoardObject;

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof parsed.kind !== "string" ||
    typeof parsed.id !== "string"
  ) {
    return null;
  }

  return {
    ...parsed,
    id: fallbackId,
  } as BoardObject;
}

function readStoredString(entry: Y.Map<unknown>, key: string) {
  const value = entry.get(key);

  return typeof value === "string" ? value : null;
}

function readStoredNumber(entry: Y.Map<unknown>, key: string) {
  const value = entry.get(key);

  return typeof value === "number" ? value : null;
}

function readStoredStringArray(entry: Y.Map<unknown>, key: string) {
  const value = readStoredString(entry, key);

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function readStoredWriteMode(entry: Y.Map<unknown>) {
  const value = readStoredString(entry, SHARED_ENTRY_LAST_WRITE_MODE_KEY);

  if (
    value === "legacy-whole-object" ||
    value === "entry-create" ||
    value === "legacy-upgrade" ||
    value === "property-only" ||
    value === "property-and-base" ||
    value === "base-only" ||
    value === "noop"
  ) {
    return value;
  }

  return null;
}

function isTokenAttachment(value: unknown): value is TokenAttachment {
  if (!value || typeof value !== "object") {
    return false;
  }

  const attachment = value as Partial<TokenAttachment>;

  if (attachment.mode === "free") {
    return true;
  }

  if (
    attachment.mode !== "attached" ||
    typeof attachment.parentObjectId !== "string" ||
    typeof attachment.parentObjectKind !== "string" ||
    attachment.coordinateSpace !== "parent-normalized" ||
    !attachment.anchor ||
    typeof attachment.anchor !== "object" ||
    typeof attachment.anchor.x !== "number" ||
    typeof attachment.anchor.y !== "number"
  ) {
    return false;
  }

  return true;
}

function applyMigratedProperty(
  object: BoardObject,
  property: SupportedPropertyName,
  encodedValue: string | null
) {
  if (!encodedValue) {
    return object;
  }

  try {
    const parsed = JSON.parse(encodedValue) as unknown;

    if (
      (property === "x" ||
        property === "y" ||
        property === "width" ||
        property === "height") &&
      typeof parsed === "number"
    ) {
      return {
        ...object,
        [property]: parsed,
      };
    }

    if (property === "tokenAttachment" && isTokenAttachment(parsed)) {
      return {
        ...object,
        tokenAttachment: parsed,
      };
    }

    return object;
  } catch {
    return object;
  }
}

function normalizeSharedBoardObject(object: BoardObject) {
  if (object.kind === "token") {
    return normalizeTokenObject(object);
  }

  if (object.kind === "note-card") {
    return normalizeNoteCardObject(object);
  }

  return object;
}

function createPropertyBackedEntry(
  object: BoardObject,
  writeMode: PropertySyncWriteMode
) {
  const entry = new Y.Map<unknown>();

  entry.set(SHARED_ENTRY_SCHEMA_VERSION_KEY, PROPERTY_SYNC_SCHEMA_VERSION);
  entry.set(SHARED_ENTRY_KIND_KEY, object.kind);
  entry.set(SHARED_ENTRY_BASE_KEY, JSON.stringify(object));
  entry.set(SHARED_ENTRY_LAST_WRITE_MODE_KEY, writeMode);

  if (!isPropertySyncKind(object.kind)) {
    return entry;
  }

  const migratedProperties = getMigratedProperties(object.kind);

  migratedProperties.forEach((property) => {
    const encodedValue = encodePropertyValue(object[property]);

    if (encodedValue !== null) {
      entry.set(getPropertyKey(property), encodedValue);
    }
  });

  entry.set(
    SHARED_ENTRY_LAST_CHANGED_PROPERTIES_KEY,
    JSON.stringify([...migratedProperties])
  );
  entry.set(SHARED_ENTRY_LAST_CHANGED_AT_KEY, Date.now());

  return entry;
}

function getBaseBoardObject(entry: Y.Map<unknown>, objectId: string) {
  const baseValue = readStoredString(entry, SHARED_ENTRY_BASE_KEY);

  if (!baseValue) {
    return null;
  }

  try {
    return parseBoardObject(baseValue, objectId);
  } catch {
    return null;
  }
}

function getComparableNonMigratedSnapshot(object: BoardObject) {
  if (!isPropertySyncKind(object.kind)) {
    return JSON.stringify(object);
  }

  const nextSnapshot: Record<string, unknown> = {};

  Object.entries(object).forEach(([key, value]) => {
    if (
      getMigratedProperties(object.kind).some((property) => property === key)
    ) {
      return;
    }

    nextSnapshot[key] = value;
  });

  return JSON.stringify(nextSnapshot);
}

function updateBaseSnapshot(
  entry: Y.Map<unknown>,
  objectId: string,
  object: BoardObject
) {
  const currentBaseObject = getBaseBoardObject(entry, objectId);

  if (!isPropertySyncKind(object.kind)) {
    const nextSerialized = JSON.stringify(object);

    if (readStoredString(entry, SHARED_ENTRY_BASE_KEY) === nextSerialized) {
      return false;
    }

    entry.set(SHARED_ENTRY_BASE_KEY, nextSerialized);
    return true;
  }

  if (!currentBaseObject || currentBaseObject.kind !== object.kind) {
    entry.set(SHARED_ENTRY_BASE_KEY, JSON.stringify(object));
    return true;
  }

  const currentComparable = getComparableNonMigratedSnapshot(currentBaseObject);
  const nextComparable = getComparableNonMigratedSnapshot(object);

  if (currentComparable === nextComparable) {
    return false;
  }

  const nextBaseObject = { ...currentBaseObject };

  Object.entries(object).forEach(([key, value]) => {
    if (
      getMigratedProperties(object.kind).some((property) => property === key)
    ) {
      return;
    }

    nextBaseObject[key as keyof BoardObject] = value as never;
  });

  entry.set(SHARED_ENTRY_BASE_KEY, JSON.stringify(nextBaseObject));
  return true;
}

function updateMigratedProperties(entry: Y.Map<unknown>, object: BoardObject) {
  if (!isPropertySyncKind(object.kind)) {
    return [] as SupportedPropertyName[];
  }

  const changedProperties: SupportedPropertyName[] = [];

  getMigratedProperties(object.kind).forEach((property) => {
    const key = getPropertyKey(property);
    const nextValue = encodePropertyValue(object[property]);
    const previousValue = readStoredString(entry, key);

    if (nextValue === previousValue) {
      return;
    }

    changedProperties.push(property);

    if (nextValue === null) {
      entry.delete(key);
      return;
    }

    entry.set(key, nextValue);
  });

  return changedProperties;
}

function setWriteMetadata(
  entry: Y.Map<unknown>,
  changedProperties: SupportedPropertyName[],
  writeMode: PropertySyncWriteMode
) {
  const previousChangedProperties = readStoredStringArray(
    entry,
    SHARED_ENTRY_LAST_CHANGED_PROPERTIES_KEY
  );
  const previousChangedAt = readStoredNumber(entry, SHARED_ENTRY_LAST_CHANGED_AT_KEY);

  entry.set(SHARED_ENTRY_LAST_WRITE_MODE_KEY, writeMode);
  entry.set(
    SHARED_ENTRY_LAST_CHANGED_PROPERTIES_KEY,
    JSON.stringify(
      changedProperties.length > 0 ? changedProperties : previousChangedProperties
    )
  );
  entry.set(
    SHARED_ENTRY_LAST_CHANGED_AT_KEY,
    changedProperties.length > 0 ? Date.now() : previousChangedAt
  );
}

function ensurePropertySyncEntry(
  sharedMap: Y.Map<unknown>,
  object: BoardObject
) {
  const currentValue = sharedMap.get(object.id);

  if (currentValue instanceof Y.Map) {
    return {
      entry: currentValue,
      writeMode: null as PropertySyncWriteMode | null,
    };
  }

  if (typeof currentValue === "string") {
    const upgradedEntry = createPropertyBackedEntry(object, "legacy-upgrade");

    sharedMap.set(object.id, upgradedEntry);

    return {
      entry: upgradedEntry,
      writeMode: "legacy-upgrade" as PropertySyncWriteMode,
    };
  }

  const createdEntry = createPropertyBackedEntry(object, "entry-create");

  sharedMap.set(object.id, createdEntry);

  return {
    entry: createdEntry,
    writeMode: "entry-create" as PropertySyncWriteMode,
  };
}

export function readBoardObjectFromSharedEntry(
  objectId: string,
  value: unknown
): BoardObject | null {
  if (typeof value === "string") {
    try {
      const parsed = parseBoardObject(value, objectId);

      return parsed ? normalizeSharedBoardObject(parsed) : null;
    } catch {
      return null;
    }
  }

  if (!(value instanceof Y.Map)) {
    return null;
  }

  const baseObject = getBaseBoardObject(value, objectId);

  if (!baseObject) {
    return null;
  }

  if (!isPropertySyncKind(baseObject.kind)) {
    return normalizeSharedBoardObject(baseObject);
  }

  const reconstructed = getMigratedProperties(baseObject.kind).reduce(
    (nextObject, property) => {
      return applyMigratedProperty(
        nextObject,
        property,
        readStoredString(value, getPropertyKey(property))
      );
    },
    baseObject
  );

  return normalizeSharedBoardObject(reconstructed);
}

export function writeBoardObjectToSharedMap(
  sharedMap: Y.Map<unknown>,
  object: BoardObject
) {
  if (!isPropertySyncKind(object.kind)) {
    sharedMap.set(object.id, JSON.stringify(object));
    return {
      writeMode: "legacy-whole-object" as PropertySyncWriteMode,
      changedProperties: [] as SupportedPropertyName[],
    };
  }

  const { entry, writeMode: ensuredWriteMode } = ensurePropertySyncEntry(
    sharedMap,
    object
  );

  if (ensuredWriteMode) {
    return {
      writeMode: ensuredWriteMode,
      changedProperties: [...getMigratedProperties(object.kind)],
    };
  }

  entry.set(SHARED_ENTRY_SCHEMA_VERSION_KEY, PROPERTY_SYNC_SCHEMA_VERSION);
  entry.set(SHARED_ENTRY_KIND_KEY, object.kind);

  const changedProperties = updateMigratedProperties(entry, object);
  const didUpdateBase = updateBaseSnapshot(entry, object.id, object);
  const writeMode: PropertySyncWriteMode =
    changedProperties.length > 0 && didUpdateBase
      ? "property-and-base"
      : changedProperties.length > 0
        ? "property-only"
        : didUpdateBase
          ? "base-only"
          : "noop";

  setWriteMetadata(entry, changedProperties, writeMode);

  return {
    writeMode,
    changedProperties,
  };
}

export function upgradeLegacySharedObjects(sharedMap: Y.Map<unknown>) {
  let didUpgrade = false;

  sharedMap.forEach((value, objectId) => {
    if (typeof value !== "string") {
      return;
    }

    try {
      const parsed = parseBoardObject(value, objectId);

      if (!parsed || !isPropertySyncKind(parsed.kind)) {
        return;
      }

      const upgradedEntry = createPropertyBackedEntry(parsed, "legacy-upgrade");

      sharedMap.set(objectId, upgradedEntry);
      didUpgrade = true;
    } catch {
      return;
    }
  });

  return didUpgrade;
}

export function getBoardObjectPropertySyncDebugEntries(
  sharedMap: Y.Map<unknown>
) {
  const entries: BoardObjectPropertySyncDebugEntry[] = [];

  sharedMap.forEach((value, objectId) => {
    const reconstructedObject = readBoardObjectFromSharedEntry(objectId, value);

    if (!reconstructedObject) {
      return;
    }

    if (!(value instanceof Y.Map) || !isPropertySyncKind(reconstructedObject.kind)) {
      entries.push({
        objectId,
        kind: reconstructedObject.kind,
        usesPropertySync: false,
        migratedProperties: [],
        storedPropertyValues: {},
        lastChangedProperties: [],
        lastChangedAt: null,
        lastWriteMode: typeof value === "string" ? "legacy-whole-object" : null,
        reconstructedObject,
      });
      return;
    }

    const migratedProperties = getMigratedProperties(reconstructedObject.kind);
    const storedPropertyValues = migratedProperties.reduce<
      Partial<Record<SupportedPropertyName, string>>
    >((nextValues, property) => {
      const encodedValue = readStoredString(value, getPropertyKey(property));

      if (encodedValue) {
        nextValues[property] = encodedValue;
      }

      return nextValues;
    }, {});

    entries.push({
      objectId,
      kind: reconstructedObject.kind,
      usesPropertySync:
        readStoredNumber(value, SHARED_ENTRY_SCHEMA_VERSION_KEY) ===
        PROPERTY_SYNC_SCHEMA_VERSION,
      migratedProperties: [...migratedProperties],
      storedPropertyValues,
      lastChangedProperties: readStoredStringArray(
        value,
        SHARED_ENTRY_LAST_CHANGED_PROPERTIES_KEY
      ).filter(
        (property): property is SupportedPropertyName =>
          migratedProperties.some((candidate) => candidate === property)
      ),
      lastChangedAt: readStoredNumber(value, SHARED_ENTRY_LAST_CHANGED_AT_KEY),
      lastWriteMode: readStoredWriteMode(value),
      reconstructedObject,
    });
  });

  return entries;
}
