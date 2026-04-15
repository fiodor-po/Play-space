import { buttonRecipes } from "../../ui/system/families/button";
import { getDesignSystemDebugAttrs } from "../../ui/system/debugMeta";

type ButtonRecipe = (typeof buttonRecipes)["primary"]["default"];

type BoardToolbarProps = {
  onAddImage: () => void;
  onAddNote: () => void;
  onResetBoard: () => void;
  addImageRecipe?: ButtonRecipe;
};

export function BoardToolbar({
  onAddImage,
  onAddNote,
  onResetBoard,
  addImageRecipe = buttonRecipes.primary.default,
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
        data-testid="debug-add-image-button"
        className={addImageRecipe.className}
        style={addImageRecipe.style}
        {...getDesignSystemDebugAttrs(addImageRecipe.debug)}
      >
        Add image
      </button>

      <button
        type="button"
        onClick={onAddNote}
        data-testid="debug-add-note-button"
        className={buttonRecipes.secondary.default.className}
        style={buttonRecipes.secondary.default.style}
        {...getDesignSystemDebugAttrs(buttonRecipes.secondary.default.debug)}
      >
        Add note
      </button>

      <button
        type="button"
        onClick={onResetBoard}
        data-testid="debug-reset-board-button"
        className={buttonRecipes.danger.default.className}
        style={buttonRecipes.danger.default.style}
        {...getDesignSystemDebugAttrs(buttonRecipes.danger.default.debug)}
      >
        Reset board
      </button>
    </div>
  );
}
