import { uiTextStyle, uiTextStyleSmall } from "./typography";

export const controlScale = {
  default: {
    height: 40,
    paddingY: 8,
    paddingX: 12,
    contentGap: 8,
    bodyText: uiTextStyle.body,
    labelText: uiTextStyle.label,
  },
  small: {
    height: 32,
    paddingY: 6,
    paddingX: 8,
    contentGap: 6,
    bodyText: uiTextStyleSmall.body,
    labelText: uiTextStyleSmall.label,
  },
} as const;
