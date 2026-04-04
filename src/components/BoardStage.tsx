import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Layer, Rect, Stage, Text } from "react-konva";
import type Konva from "konva";
import { initialObjects } from "../data/initialBoard";
import {
  clearBoardStorage,
  loadBoardObjects,
  loadViewportState,
  saveBoardObjects,
  saveViewportState,
} from "../lib/storage";
import type { BoardObject, BoardObjectKind } from "../types/board";

const BOARD_WIDTH = 4000;
const BOARD_HEIGHT = 3000;
const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;
const SCALE_BY = 1.05;
const TEXT_CARD_HEADER_HEIGHT = 36;
const NOTE_HANDLE_SIZE = 18;
const TEXT_CARD_BODY_INSET_X = 16;
const TEXT_CARD_BODY_INSET_Y = 16;
const TEXT_CARD_BODY_FONT_SIZE = 22;
const TEXT_CARD_BODY_LINE_HEIGHT = 1.2;
const TEXT_CARD_BODY_FONT_FAMILY = "Arial, sans-serif";

const objectLayerOrder: Record<BoardObjectKind, number> = {
  image: 0,
  "text-card": 1,
  token: 2,
};

function getDefaultViewport(width: number, height: number) {
  return {
    x: width / 2 - BOARD_WIDTH / 2,
    y: height / 2 - BOARD_HEIGHT / 2,
    scale: 1,
  };
}

export default function BoardStage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [stagePosition, setStagePosition] = useState(() => {
    const savedViewport = loadViewportState();
    const defaultViewport = getDefaultViewport(
      window.innerWidth,
      window.innerHeight
    );

    const hasSavedViewport =
      savedViewport.x !== 120 ||
      savedViewport.y !== 80 ||
      savedViewport.scale !== 1;

    if (!hasSavedViewport) {
      return { x: defaultViewport.x, y: defaultViewport.y };
    }

    return { x: savedViewport.x, y: savedViewport.y };
  });

  const [stageScale, setStageScale] = useState(() => {
    const savedViewport = loadViewportState();
    const defaultViewport = getDefaultViewport(
      window.innerWidth,
      window.innerHeight
    );

    const hasSavedViewport =
      savedViewport.x !== 120 ||
      savedViewport.y !== 80 ||
      savedViewport.scale !== 1;

    if (!hasSavedViewport) {
      return defaultViewport.scale;
    }

    return savedViewport.scale;
  });

  const [objects, setObjects] = useState<BoardObject[]>(() =>
    loadBoardObjects(initialObjects)
  );

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [editingTextCardId, setEditingTextCardId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [editingOriginal, setEditingOriginal] = useState("");

  const textCardRefs = useRef<Record<string, Konva.Group | null>>({});
  const ignoreNextBlurRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    saveBoardObjects(objects);
  }, [objects]);

  useEffect(() => {
    saveViewportState({
      x: stagePosition.x,
      y: stagePosition.y,
      scale: stageScale,
    });
  }, [stagePosition, stageScale]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditableTarget =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      const isDeleteKey = event.key === "Backspace" || event.key === "Delete";

      if (
        !isDeleteKey ||
        !selectedObjectId ||
        editingTextCardId ||
        isEditableTarget
      ) {
        return;
      }

      event.preventDefault();

      setObjects((currentObjects) =>
        currentObjects.filter((object) => object.id !== selectedObjectId)
      );
      setSelectedObjectId(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingTextCardId, selectedObjectId]);

  const sortedObjects = useMemo(() => {
    return [...objects].sort(
      (a, b) => objectLayerOrder[a.kind] - objectLayerOrder[b.kind]
    );
  }, [objects]);

  const updateObjectPosition = (id: string, x: number, y: number) => {
    setObjects((currentObjects) =>
      currentObjects.map((object) =>
        object.id === id ? { ...object, x, y } : object
      )
    );
  };

  const updateObjectLabel = (id: string, label: string) => {
    setObjects((currentObjects) =>
      currentObjects.map((object) =>
        object.id === id ? { ...object, label } : object
      )
    );
  };

  const getViewportCenterInBoardCoords = () => {
    const centerScreenX = stageSize.width / 2;
    const centerScreenY = stageSize.height / 2;

    return {
      x: (centerScreenX - stagePosition.x) / stageScale,
      y: (centerScreenY - stagePosition.y) / stageScale,
    };
  };

  const createToken = () => {
    const center = getViewportCenterInBoardCoords();

    const newToken: BoardObject = {
      id: `token-${crypto.randomUUID()}`,
      kind: "token",
      x: center.x - 70,
      y: center.y - 70,
      width: 140,
      height: 140,
      fill: "#7c3aed",
      label: "New Token",
      textColor: "#f8fafc",
    };

    setObjects((currentObjects) => [...currentObjects, newToken]);
    setSelectedObjectId(newToken.id);
  };

  const createNote = () => {
    const center = getViewportCenterInBoardCoords();

    const newNote: BoardObject = {
      id: `note-${crypto.randomUUID()}`,
      kind: "text-card",
      x: center.x - 130,
      y: center.y - 90,
      width: 260,
      height: 180,
      fill: "#f8fafc",
      label: "New note",
      textColor: "#0f172a",
    };

    setObjects((currentObjects) => [...currentObjects, newNote]);
    setSelectedObjectId(newNote.id);
  };

  const resetBoard = () => {
    const defaultViewport = getDefaultViewport(
      window.innerWidth,
      window.innerHeight
    );

    setObjects(initialObjects);
    setStagePosition({ x: defaultViewport.x, y: defaultViewport.y });
    setStageScale(defaultViewport.scale);
    setSelectedObjectId(null);
    clearBoardStorage();
  };

  const startDraggingTextCard = (id: string) => {
    const node = textCardRefs.current[id];

    if (!node) return;

    node.startDrag();
  };

  const startEditingTextCard = (object: BoardObject) => {
    setSelectedObjectId(object.id);
    setEditingTextCardId(object.id);
    setEditingDraft(object.label);
    setEditingOriginal(object.label);
    ignoreNextBlurRef.current = false;
  };

  const stopEditingTextCard = () => {
    setEditingTextCardId(null);
    setEditingDraft("");
    setEditingOriginal("");
    ignoreNextBlurRef.current = false;
  };

  const saveEditingTextCard = () => {
    if (!editingTextCardId) {
      return;
    }

    updateObjectLabel(editingTextCardId, editingDraft);
    stopEditingTextCard();
  };

  const cancelEditingTextCard = () => {
    if (!editingTextCardId) {
      return;
    }

    setEditingDraft(editingOriginal);
    stopEditingTextCard();
  };

  useEffect(() => {
    if (!editingTextCardId) {
      return;
    }

    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, [editingTextCardId]);

  const editingTextCard = editingTextCardId
    ? objects.find((object) => object.id === editingTextCardId && object.kind === "text-card") ?? null
    : null;

  const editingTextareaStyle = useMemo(() => {
    if (!editingTextCard) {
      return null;
    }

    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!containerRect) {
      return null;
    }

    const left =
      stagePosition.x +
      (editingTextCard.x + TEXT_CARD_BODY_INSET_X) * stageScale -
      containerRect.left;
    const top =
      stagePosition.y +
      (editingTextCard.y + TEXT_CARD_HEADER_HEIGHT + TEXT_CARD_BODY_INSET_Y) *
        stageScale -
      containerRect.top;
    const width = Math.max(
      (editingTextCard.width - TEXT_CARD_BODY_INSET_X * 2) * stageScale,
      40
    );
    const height = Math.max(
      (
        editingTextCard.height -
        TEXT_CARD_HEADER_HEIGHT -
        TEXT_CARD_BODY_INSET_Y * 2
      ) * stageScale,
      32
    );

    return {
      left,
      top,
      width,
      height,
      fontSize: TEXT_CARD_BODY_FONT_SIZE * stageScale,
      lineHeight: TEXT_CARD_BODY_LINE_HEIGHT,
      fontFamily: TEXT_CARD_BODY_FONT_FAMILY,
      color: editingTextCard.textColor ?? "#0f172a",
    };
  }, [editingTextCard, stagePosition.x, stagePosition.y, stageScale]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        margin: 0,
        overflow: "hidden",
        background: "#081226",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 10,
          display: "flex",
          gap: 12,
        }}
      >
        <button
          onClick={createToken}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #4c1d95",
            background: "#6d28d9",
            color: "#f5f3ff",
            cursor: "pointer",
          }}
        >
          Add token
        </button>

        <button
          onClick={createNote}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            background: "#f8fafc",
            color: "#0f172a",
            cursor: "pointer",
          }}
        >
          Add note
        </button>

        <button
          onClick={resetBoard}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #334155",
            background: "#0f172a",
            color: "#e2e8f0",
            cursor: "pointer",
          }}
        >
          Reset board
        </button>
      </div>

      <Stage
        width={stageSize.width}
        height={stageSize.height}
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable
        onMouseDown={(event) => {
          const clickedOnEmptyStage = event.target === event.target.getStage();

          if (clickedOnEmptyStage) {
            setSelectedObjectId(null);
          }
        }}
        onDragEnd={(event) => {
          setStagePosition({
            x: event.target.x(),
            y: event.target.y(),
          });
        }}
        onWheel={(event) => {
          event.evt.preventDefault();

          const oldScale = stageScale;
          const pointer = event.target.getStage()?.getPointerPosition();

          if (!pointer) return;

          const mousePointTo = {
            x: (pointer.x - stagePosition.x) / oldScale,
            y: (pointer.y - stagePosition.y) / oldScale,
          };

          const direction = event.evt.deltaY > 0 ? -1 : 1;
          let newScale =
            direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;

          newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

          const newPosition = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
          };

          setStageScale(newScale);
          setStagePosition(newPosition);
        }}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={BOARD_WIDTH}
            height={BOARD_HEIGHT}
            fill="#1e293b"
            cornerRadius={24}
          />

          <Text
            x={120}
            y={100}
            text="Play Space Alpha"
            fontSize={32}
            fill="#f8fafc"
          />

          <Text
            x={120}
            y={150}
            text="Text card with drag handle"
            fontSize={18}
            fill="#94a3b8"
          />

          <Text
            x={120}
            y={210}
            text="У note drag работает только через маленький handle в header."
            fontSize={16}
            fill="#94a3b8"
          />

          {sortedObjects.map((object) => {
            const isSelected = object.id === selectedObjectId;
            const isTextCard = object.kind === "text-card";

            if (isTextCard) {
              const isEditing = object.id === editingTextCardId;

              return (
                <Group
                  key={object.id}
                  ref={(node) => {
                    textCardRefs.current[object.id] = node;
                  }}
                  x={object.x}
                  y={object.y}
                  draggable={!isEditing}
                  onMouseDown={(event) => {
                    event.cancelBubble = true;
                    setSelectedObjectId(object.id);
                  }}
                  onDragStart={(event) => {
                    event.cancelBubble = true;
                    setSelectedObjectId(object.id);
                  }}
                  onDragMove={(event) => {
                    event.cancelBubble = true;
                  }}
                  onDragEnd={(event) => {
                    event.cancelBubble = true;
                    updateObjectPosition(object.id, event.target.x(), event.target.y());
                  }}
                >
                  {isSelected && (
                    <Rect
                      x={-4}
                      y={-4}
                      width={object.width + 8}
                      height={object.height + 8}
                      stroke="#60a5fa"
                      strokeWidth={3}
                      listening={false}
                    />
                  )}

                  <Rect
                    width={object.width}
                    height={object.height}
                    fill={object.fill}
                    shadowBlur={8}
                  />

                  <Rect
                    width={object.width}
                    height={TEXT_CARD_HEADER_HEIGHT}
                    fill="#e2e8f0"
                  />

                  <Rect
                    x={10}
                    y={9}
                    width={NOTE_HANDLE_SIZE}
                    height={NOTE_HANDLE_SIZE}
                    fill="#94a3b8"
                    cornerRadius={6}
                    onMouseDown={(event) => {
                      event.cancelBubble = true;
                      setSelectedObjectId(object.id);
                      startDraggingTextCard(object.id);
                    }}
                  />

                  <Text
                    x={40}
                    y={10}
                    text="Note"
                    fontSize={14}
                    fontStyle="bold"
                    fill="#334155"
                    listening={false}
                  />

                  <Rect
                    y={TEXT_CARD_HEADER_HEIGHT}
                    width={object.width}
                    height={object.height - TEXT_CARD_HEADER_HEIGHT}
                    fill={object.fill}
                    onMouseDown={(event) => {
                      event.cancelBubble = true;
                      setSelectedObjectId(object.id);
                    }}
                    onDblClick={(event) => {
                      event.cancelBubble = true;
                      startEditingTextCard(object);
                    }}
                  />

                  {!isEditing && (
                    <Text
                      x={TEXT_CARD_BODY_INSET_X}
                      y={TEXT_CARD_HEADER_HEIGHT + TEXT_CARD_BODY_INSET_Y}
                      width={object.width - TEXT_CARD_BODY_INSET_X * 2}
                      text={object.label}
                      fontSize={TEXT_CARD_BODY_FONT_SIZE}
                      lineHeight={TEXT_CARD_BODY_LINE_HEIGHT}
                      fontFamily={TEXT_CARD_BODY_FONT_FAMILY}
                      fill={object.textColor ?? "#0f172a"}
                      listening={false}
                    />
                  )}
                </Group>
              );
            }

            return (
              <Group
                key={object.id}
                x={object.x}
                y={object.y}
                draggable
                onMouseDown={(event) => {
                  event.cancelBubble = true;
                  setSelectedObjectId(object.id);
                }}
                onDragStart={(event) => {
                  event.cancelBubble = true;
                  setSelectedObjectId(object.id);
                }}
                onDragMove={(event) => {
                  event.cancelBubble = true;
                }}
                onDragEnd={(event) => {
                  event.cancelBubble = true;
                  updateObjectPosition(object.id, event.target.x(), event.target.y());
                }}
              >
                {isSelected && (
                  <Rect
                    x={-4}
                    y={-4}
                    width={object.width + 8}
                    height={object.height + 8}
                    stroke="#60a5fa"
                    strokeWidth={3}
                    listening={false}
                  />
                )}

                <Rect
                  width={object.width}
                  height={object.height}
                  fill={object.fill}
                  shadowBlur={8}
                />

                <Text
                  x={0}
                  y={object.height / 2 - 12}
                  width={object.width}
                  align="center"
                  text={object.label}
                  fontSize={24}
                  fill={object.textColor ?? "#f8fafc"}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>

      {editingTextCard && editingTextareaStyle && (
        <textarea
          ref={textareaRef}
          value={editingDraft}
          onChange={(event) => {
            setEditingDraft(event.target.value);
          }}
          onBlur={() => {
            if (ignoreNextBlurRef.current) {
              ignoreNextBlurRef.current = false;
              return;
            }

            saveEditingTextCard();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              ignoreNextBlurRef.current = true;
              cancelEditingTextCard();
              return;
            }

            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              saveEditingTextCard();
            }
          }}
          style={{
            position: "absolute",
            left: editingTextareaStyle.left,
            top: editingTextareaStyle.top,
            width: editingTextareaStyle.width,
            height: editingTextareaStyle.height,
            padding: 0,
            margin: 0,
            border: "none",
            outline: "none",
            appearance: "none",
            WebkitAppearance: "none",
            borderRadius: 0,
            boxShadow: "none",
            resize: "none",
            overflow: "hidden",
            fontFamily: editingTextareaStyle.fontFamily,
            fontSize: editingTextareaStyle.fontSize,
            fontWeight: "normal",
            lineHeight: editingTextareaStyle.lineHeight,
            color: editingTextareaStyle.color,
            background: "transparent",
            caretColor: editingTextareaStyle.color,
            boxSizing: "border-box",
            whiteSpace: "pre-wrap",
          }}
        />
      )}
    </div>
  );
}
