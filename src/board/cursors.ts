export type BoardDrawingCursorTool = "marker" | "eraser";

type SvgCursorOptions = {
  svg: string;
  hotspot: {
    x: number;
    y: number;
  };
  fallback: string;
};

export function createSvgCursor({
  svg,
  hotspot,
  fallback,
}: SvgCursorOptions) {
  const encodedSvg = encodeURIComponent(svg)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");

  return `url("data:image/svg+xml,${encodedSvg}") ${hotspot.x} ${hotspot.y}, ${fallback}`;
}

export function createMarkerDrawingCursor(participantColor: string) {
  return createSvgCursor({
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.35" fill="${participantColor}" stroke="#0f172a" stroke-width="0.9"/><circle cx="4" cy="4" r="2.75" fill="none" stroke="#f8fafc" stroke-width="0.65"/></svg>`,
    hotspot: {
      x: 4,
      y: 4,
    },
    fallback: "crosshair",
  });
}

export function createEraserDrawingCursor() {
  return createSvgCursor({
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.3" fill="none" stroke="#0f172a" stroke-width="2"/><circle cx="8" cy="8" r="5.2" fill="none" stroke="#f8fafc" stroke-width="1.2"/></svg>`,
    hotspot: {
      x: 8,
      y: 8,
    },
    fallback: "cell",
  });
}
