type BoardToolbarProps = {
  onAddToken: () => void;
  onAddImage: () => void;
  onAddNote: () => void;
  onResetBoard: () => void;
};

export function BoardToolbar({
  onAddToken,
  onAddImage,
  onAddNote,
  onResetBoard,
}: BoardToolbarProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 10,
      }}
    >
      <button
        type="button"
        onClick={onAddToken}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #4c1d95",
          background: "#6d28d9",
          color: "#f5f3ff",
          cursor: "pointer",
        }}
      >
        Add token
      </button>

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
