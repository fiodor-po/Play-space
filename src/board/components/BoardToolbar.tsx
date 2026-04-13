import { buttonRecipes } from "../../ui/system/families/button";
import { getDesignSystemDebugAttrs } from "../../ui/system/debug";

type BoardToolbarProps = {
  onAddImage: () => void;
  onAddNote: () => void;
  onResetBoard: () => void;
};

export function BoardToolbar({
  onAddImage,
  onAddNote,
  onResetBoard,
}: BoardToolbarProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 10,
      }}
    >
      <button
        type="button"
        onClick={onAddImage}
        className={buttonRecipes.primary.default.className}
        style={buttonRecipes.primary.default.style}
        {...getDesignSystemDebugAttrs(buttonRecipes.primary.default.debug)}
      >
        Add image
      </button>

      <button
        type="button"
        onClick={onAddNote}
        className={buttonRecipes.secondary.default.className}
        style={buttonRecipes.secondary.default.style}
        {...getDesignSystemDebugAttrs(buttonRecipes.secondary.default.debug)}
      >
        Add note
      </button>

      <button
        type="button"
        onClick={onResetBoard}
        className={buttonRecipes.danger.default.className}
        style={buttonRecipes.danger.default.style}
        {...getDesignSystemDebugAttrs(buttonRecipes.danger.default.debug)}
      >
        Reset board
      </button>
    </div>
  );
}
