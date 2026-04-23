import type { CSSProperties } from "react";
import { HTML_UI_FONT_FAMILY } from "../board/constants";
import { radiusPrimitive } from "../ui/system/foundations";
import { fontSize } from "../ui/system/typography";

export const DICE_ROLL_LOG_ENTRY_MIN_HEIGHT = fontSize["2xl"] + 8 * 2 + 2;
export const DICE_ROLL_LOG_HISTORY_ROW_GAP = 6;
const DICE_ROLL_LOG_SHADOW_BLEED = 34;

export type DiceRollLogPanelEntry = {
  id: string;
  actorName: string;
  actorColor: string;
  rollLabel: string;
  displayResults: number[];
};

const diceRollLogShellStyle: CSSProperties = {
  width: "100%",
  maxWidth: 340,
  display: "grid",
  gap: 10,
};

const diceRollLogEntryStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "var(--ui-space-small)",
  width: "100%",
  boxSizing: "border-box",
  minHeight: DICE_ROLL_LOG_ENTRY_MIN_HEIGHT,
  padding: "var(--ui-space-small) var(--ui-space-medium)",
  appearance: "none",
  WebkitAppearance: "none",
  borderRadius: radiusPrimitive.r12,
  border: "1px solid rgba(255, 255, 255, 0.22)",
  color: "#ffffff",
  fontFamily: HTML_UI_FONT_FAMILY,
  textAlign: "left",
  boxShadow: "0 12px 26px rgba(2, 6, 23, 0.18)",
};

const diceRollLogTextStackStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--ui-space-medium)",
  minWidth: 0,
};

const diceRollLogMetaRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--ui-space-medium)",
  minWidth: 0,
  color: "#ffffff",
  fontSize: fontSize.md,
  fontWeight: 700,
  lineHeight: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const diceRollLogActorNameStyle: CSSProperties = {
  color: "#ffffff",
  fontSize: fontSize.xl,
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: "-0.04em",
};

const diceRollLogKindStyle: CSSProperties = {
  color: "rgba(255, 255, 255, 0.62)",
  fontSize: fontSize.xl,
  fontWeight: 600,
};

const diceRollLogResultStyle: CSSProperties = {
  minWidth: 42,
  display: "grid",
  placeItems: "center",
  color: "#ffffff",
  fontSize: fontSize["2xl"],
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: "-0.04em",
};

const diceRollLogResultPairStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "end",
  gap: "var(--ui-space-small)",
  minWidth: 82,
};

const diceRollLogResultSeparatorStyle: CSSProperties = {
  width: 1,
  height: fontSize["2xl"],
  background: "rgba(255, 255, 255, 0.78)",
};

const diceRollLogHistoryStyle: CSSProperties = {
  display: "grid",
  gap: "var(--ui-space-compact)",
  width: `calc(100% + ${DICE_ROLL_LOG_SHADOW_BLEED * 2}px)`,
  boxSizing: "border-box",
  margin: -DICE_ROLL_LOG_SHADOW_BLEED,
  padding: DICE_ROLL_LOG_SHADOW_BLEED,
  overflowY: "auto",
  scrollbarGutter: "stable",
};

export function DiceRollLogPanel({
  entries,
  isExpanded,
  maxExpandedHeight,
  onToggleExpanded,
}: {
  entries: DiceRollLogPanelEntry[];
  isExpanded: boolean;
  maxExpandedHeight: CSSProperties["maxHeight"];
  onToggleExpanded: () => void;
}) {
  if (entries.length === 0) {
    return null;
  }

  const visibleEntries = isExpanded ? entries : entries.slice(0, 1);

  return (
    <div
      aria-label={isExpanded ? "Dice roll log expanded" : "Dice roll log collapsed"}
      style={diceRollLogShellStyle}
    >
      <div
        style={{
          ...diceRollLogHistoryStyle,
          ...(isExpanded
            ? { maxHeight: getScrollBoxMaxHeight(maxExpandedHeight) }
            : {}),
        }}
      >
        {visibleEntries.map((entry) => (
          <DiceRollLogEntryPreview
            key={entry.id}
            entry={entry}
            onSelect={onToggleExpanded}
          />
        ))}
      </div>
    </div>
  );
}

function getScrollBoxMaxHeight(maxExpandedHeight: CSSProperties["maxHeight"]) {
  const bleedHeight = DICE_ROLL_LOG_SHADOW_BLEED * 2;

  if (typeof maxExpandedHeight === "number") {
    return maxExpandedHeight + bleedHeight;
  }

  if (typeof maxExpandedHeight === "string") {
    return `calc(${maxExpandedHeight} + ${bleedHeight}px)`;
  }

  return maxExpandedHeight;
}

function DiceRollLogEntryPreview({
  entry,
  onSelect,
}: {
  entry: DiceRollLogPanelEntry;
  onSelect: () => void;
}) {
  const displayResultsLabel = entry.displayResults.join(" and ");

  return (
    <button
      type="button"
      aria-label={`Dice roll ${entry.actorName} ${entry.rollLabel} result ${displayResultsLabel}`}
      style={{
        ...diceRollLogEntryStyle,
        background: entry.actorColor,
        cursor: "pointer",
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <div style={diceRollLogTextStackStyle}>
        <div style={diceRollLogMetaRowStyle}>
          <span style={diceRollLogActorNameStyle}>{entry.actorName}</span>
          <span style={diceRollLogKindStyle}>{entry.rollLabel}</span>
        </div>
      </div>
      {entry.displayResults.length > 1 ? (
        <div style={diceRollLogResultPairStyle}>
          <span style={diceRollLogResultStyle}>{entry.displayResults[0]}</span>
          <span aria-hidden="true" style={diceRollLogResultSeparatorStyle} />
          <span style={diceRollLogResultStyle}>{entry.displayResults[1]}</span>
        </div>
      ) : (
        <div style={diceRollLogResultStyle}>{entry.displayResults[0]}</div>
      )}
    </button>
  );
}
