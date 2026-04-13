import { HTML_UI_FONT_FAMILY } from "../../board/constants";
import type { CSSProperties } from "react";

export const uiTextStyle = {
  body: {
    fontFamily: HTML_UI_FONT_FAMILY,
    fontSize: 16,
    fontWeight: 400,
    letterSpacing: "0",
  } satisfies CSSProperties,
  label: {
    fontFamily: HTML_UI_FONT_FAMILY,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0",
  } satisfies CSSProperties,
  labelSmall: {
    fontFamily: HTML_UI_FONT_FAMILY,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0",
  } satisfies CSSProperties,
  caption: {
    fontFamily: HTML_UI_FONT_FAMILY,
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: "0",
  } satisfies CSSProperties,
} as const;

export const uiTextStyleSmall = {
  body: {
    fontFamily: HTML_UI_FONT_FAMILY,
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: "0",
  } satisfies CSSProperties,
  label: {
    fontFamily: HTML_UI_FONT_FAMILY,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0",
  } satisfies CSSProperties,
  caption: {
    fontFamily: HTML_UI_FONT_FAMILY,
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: "0",
  } satisfies CSSProperties,
} as const;
