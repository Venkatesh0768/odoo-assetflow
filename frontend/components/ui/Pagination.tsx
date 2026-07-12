"use client";

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pages, total, limit, onPageChange }: PaginationProps) {
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build visible page numbers with ellipsis
  const getPageNums = (): (number | "...")[] => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const nums: (number | "...")[] = [1];
    if (page > 3) nums.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) nums.push(i);
    if (page < pages - 2) nums.push("...");
    nums.push(pages);
    return nums;
  };

  return (
    <div className="flex flex-col items-center gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:justify-between">
      <p className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}–{to}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <PageBtn
          label="←"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        />
        {getPageNums().map((n, i) =>
          n === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400 select-none">…</span>
          ) : (
            <PageBtn
              key={n}
              label={String(n)}
              active={n === page}
              onClick={() => onPageChange(n as number)}
              aria-label={`Page ${n}`}
            />
          )
        )}
        <PageBtn
          label="→"
          disabled={page === pages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        />
      </div>
    </div>
  );
}

function PageBtn({
  label,
  active,
  disabled,
  onClick,
  "aria-label": ariaLabel,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  "aria-label"?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={[
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
