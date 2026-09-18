import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function ReferenceRow({
  title,
  metadata,
  description,
  attribution,
  number,
  disabled = false,
  onClick,
}: {
  title: string;
  metadata: ReactNode;
  description?: string;
  attribution?: ReactNode;
  number?: number;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button className="reference-row" disabled={disabled} onClick={onClick}>
      <span className="reference-meta">{metadata}</span>
      {number !== undefined && (
        <span className="reference-number">[{number}]</span>
      )}
      <b className="reference-title">{title}</b>
      <ChevronRight size={16} aria-hidden="true" />
      {description && (
        <span className="reference-description">{description}</span>
      )}
      {attribution && (
        <span className="reference-attribution">{attribution}</span>
      )}
    </button>
  );
}
