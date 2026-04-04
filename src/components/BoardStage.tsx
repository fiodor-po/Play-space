import { useEffect, useMemo, useState } from "react";
import { Group, Layer, Rect, Stage, Text } from "react-konva";
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

const objectLayerOrder: Record<BoardObjectKind, number> = {
  image: 0,
  card: 1,
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
      const isDeleteKey = event.key === "Backspace" || event.key === "Delete";

      if (!isDeleteKey || !selectedObjectId) {
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
  }, [selectedObjectId]);

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

  return (
    <div
      style={{
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
            text="Centered board and viewport-based spawn"
            fontSize={18}
            fill="#94a3b8"
          />

          <Text
            x={120}
            y={210}
            text="Reset should center the board. New tokens should appear in the visible center."
            fontSize={16}
            fill="#94a3b8"
          />

          {sortedObjects.map((object) => {
            const isSelected = object.id === selectedObjectId;

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
                    cornerRadius={20}
                    listening={false}
                  />
                )}

                <Rect
                  width={object.width}
                  height={object.height}
                  fill={object.fill}
                  cornerRadius={16}
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
    </div>
  );
}