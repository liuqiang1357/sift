import type { ReactNode } from "react";

export function ChoiceChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="chip"
      aria-pressed={selected}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
