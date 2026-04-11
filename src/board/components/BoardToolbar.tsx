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
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #0f766e",
          background: "#0f766e",
          color: "#ecfeff",
          cursor: "pointer",
        }}
      >
        Add image
      </button>

      <button
        type="button"
        onClick={onAddNote}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #cbd5e1",
          background: "#f8fafc",
          color: "#0f172a",
          cursor: "pointer",
        }}
      >
        Add note
      </button>

      <button
        type="button"
        onClick={onResetBoard}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #334155",
          background: "#0f172a",
          color: "#e2e8f0",
          cursor: "pointer",
        }}
      >
        Reset board
      </button>
    </div>
  );
}
