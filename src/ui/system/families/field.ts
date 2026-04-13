import type { CSSProperties } from "react";
import type { DesignSystemDebugMeta } from "../debug";
import { border, radius, surface, text } from "../foundations";
import { controlScale } from "../controlScale";

type FieldRecipePart = {
  className: string;
  style: CSSProperties;
  debug?: DesignSystemDebugMeta;
};

type FieldRecipe = {
  shell: FieldRecipePart;
  input: FieldRecipePart;
  select?: FieldRecipePart;
};

type FieldShellState = {
  disabled?: boolean;
};

function createFieldShell(
  size: (typeof controlScale)["default"] | (typeof controlScale)["small"],
  debug: DesignSystemDebugMeta
): FieldRecipePart {
  return {
    className: "ui-field-shell",
    style: {
      minHeight: size.height,
      display: "flex",
      alignItems: "center",
      padding: `${size.paddingY}px ${size.paddingX}px`,
      borderRadius: radius.control,
      border: `1px solid ${border.default}`,
      background: surface.inset,
      color: text.primary,
    },
    debug,
  };
}

function createFieldInput(
  size: (typeof controlScale)["default"] | (typeof controlScale)["small"]
): FieldRecipePart {
  return {
    className: "ui-field-input",
    style: {
      ...size.bodyText,
      width: "100%",
      minWidth: 0,
      color: "inherit",
      padding: 0,
    },
  };
}

export const fieldRecipes: {
  default: FieldRecipe;
  small: FieldRecipe & { select: FieldRecipePart };
} = {
  default: {
    shell: createFieldShell(controlScale.default, {
      family: "field",
      size: "default",
    }),
    input: createFieldInput(controlScale.default),
  },
  small: {
    shell: createFieldShell(controlScale.small, {
      family: "field",
      size: "small",
    }),
    input: createFieldInput(controlScale.small),
    select: {
      className: "ui-field-select",
      style: {
        ...createFieldInput(controlScale.small).style,
        paddingRight: 18,
      },
    },
  },
};

export function getFieldShellProps(
  shell: FieldRecipePart,
  state: FieldShellState = {}
) {
  return {
    className: shell.className,
    style: shell.style,
    "data-ui-disabled": state.disabled ? "true" : undefined,
  } as const;
}
