import { HTML_UI_FONT_FAMILY } from "../../board/constants";
import type { CSSProperties } from "react";

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  "2xl": 28,
  "3xl": 52,
} as const;

export const uiTextStyle = {
  body: {
    fontFamily: HTML_UI_FONT_FAMILY,
    fontSize: fontSize.lg,
    fontWeight: 400,
    letterSpacing: "0",
  } satisfies CSSProperties,
  label: {
    fontFamily: HTML_UI_FONT_FAMILY,
    fontSize: fontSize.md,
    fontWeight: 700,
    letterSpacing: "0",
  } satisfies CSSProperties,
  labelSmall: {
    fontFamily: HTML_UI_FONT_FAMILY,
    fontSize: fontSize.sm,
    fontWeight: 600,
    letterSpacing: "0",
  } satisfies CSSProperties,
  caption: {
    fontFamily: HTML_UI_FONT_FAMILY,
    fontSize: fontSize.sm,
    fontWeight: 400,
    letterSpacing: "0",
  } satisfies CSSProperties,
} as const;

export const uiTextStyleSmall = {
  body: {
    fontFamily: HTML_UI_FONT_FAMILY,
    fontSize: fontSize.sm,
    fontWeight: 400,
    letterSpacing: "0",
  } satisfies CSSProperties,
  label: {
    fontFamily: HTML_UI_FONT_FAMILY,
    fontSize: fontSize.sm,
    fontWeight: 600,
    letterSpacing: "0",
  } satisfies CSSProperties,
  caption: {
    fontFamily: HTML_UI_FONT_FAMILY,
    fontSize: fontSize.sm,
    fontWeight: 400,
    letterSpacing: "0",
  } satisfies CSSProperties,
} as const;
