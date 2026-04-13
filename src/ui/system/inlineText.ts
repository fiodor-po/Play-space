import type { CSSProperties } from "react";
import { text } from "./foundations";
import { uiTextStyleSmall } from "./typography";

type InlineTextRecipe = {
  style: CSSProperties;
};

function createInlineTextRecipe(color: string): InlineTextRecipe {
  return {
    style: {
      ...uiTextStyleSmall.caption,
      color,
    },
  };
}

export const inlineTextRecipes = {
  muted: createInlineTextRecipe(text.muted),
  error: createInlineTextRecipe(text.danger),
} as const;
