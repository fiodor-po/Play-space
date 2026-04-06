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
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 10,
        display: "flex",
        gap: 12,
      }}
    >
      <button
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
