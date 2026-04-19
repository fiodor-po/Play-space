import { BOARD_HEIGHT, BOARD_WIDTH, DEFAULT_STAGE_SCALE } from "./constants";

export function getInitialRoomViewport(width: number, height: number) {
  return {
    x: width / 2 - BOARD_WIDTH / 2,
    y: height / 2 - BOARD_HEIGHT / 2,
    scale: DEFAULT_STAGE_SCALE,
  };
}

export const getDefaultViewport = getInitialRoomViewport;

export function getCenteredBoardViewportAtScale(params: {
  stageWidth: number;
  stageHeight: number;
  scale: number;
}) {
  return {
    x: params.stageWidth / 2 - (BOARD_WIDTH * params.scale) / 2,
    y: params.stageHeight / 2 - (BOARD_HEIGHT * params.scale) / 2,
    scale: params.scale,
  };
}

export function getBoardPointFromScreen(params: {
  clientX: number;
  clientY: number;
  containerLeft: number;
  containerTop: number;
  stageX: number;
  stageY: number;
  stageScale: number;
}) {
  return {
    x: (params.clientX - params.containerLeft - params.stageX) / params.stageScale,
    y: (params.clientY - params.containerTop - params.stageY) / params.stageScale,
  };
}

export function getViewportCenterInBoardCoords(params: {
  stageWidth: number;
  stageHeight: number;
  stageX: number;
  stageY: number;
  stageScale: number;
}) {
  return {
    x: (params.stageWidth / 2 - params.stageX) / params.stageScale,
    y: (params.stageHeight / 2 - params.stageY) / params.stageScale,
  };
}

export function getZoomedViewport(params: {
  pointerX: number;
  pointerY: number;
  stageX: number;
  stageY: number;
  oldScale: number;
  newScale: number;
}) {
  const mousePointTo = {
    x: (params.pointerX - params.stageX) / params.oldScale,
    y: (params.pointerY - params.stageY) / params.oldScale,
  };

  return {
    x: params.pointerX - mousePointTo.x * params.newScale,
    y: params.pointerY - mousePointTo.y * params.newScale,
  };
}

export function getWheelPanDelta(params: {
  deltaMode: number;
  deltaX: number;
  deltaY: number;
}) {
  const unitScale =
    params.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 16
      : params.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? 120
        : 1;

  const pixelDelta = {
    x: params.deltaX * unitScale,
    y: params.deltaY * unitScale,
  };

  const looksLikeHorizontalMouseWheelTilt =
    params.deltaMode !== WheelEvent.DOM_DELTA_PIXEL ||
    (Math.abs(pixelDelta.y) < 0.5 && Math.abs(pixelDelta.x) >= 40);

  if (!looksLikeHorizontalMouseWheelTilt) {
    return pixelDelta;
  }

  return {
    x: Math.sign(pixelDelta.x) * Math.min(Math.abs(pixelDelta.x), 48),
    y: pixelDelta.y,
  };
}
