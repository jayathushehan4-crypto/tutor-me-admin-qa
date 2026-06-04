import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

export type SortDirection = "asc" | "desc";

export function SortableHeader({
  label,
  direction,
  onToggle,
}: {
  label: string;
  direction: SortDirection | null;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={`Sort ${label}`}
      aria-label={`Sort ${label}`}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white ${
        direction ? "text-brand-500 dark:text-brand-400" : ""
      }`}
    >
      <span className="truncate">{label}</span>
      {direction === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5 shrink-0" />
      ) : direction === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
      )}
    </button>
  );
}
