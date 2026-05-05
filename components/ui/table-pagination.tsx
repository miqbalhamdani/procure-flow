"use client";

type TablePaginationProps = {
  from: number;
  to: number;
  total: number;
  pageIndex: number;
  pageCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageClick: (page: number) => void;
};

export function TablePagination({
  from,
  to,
  total,
  pageIndex,
  pageCount,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
  onPageClick,
}: TablePaginationProps) {
  const getPageNumbers = (): number[] => {
    const maxVisible = 10;
    if (pageCount <= maxVisible) return Array.from({ length: pageCount }, (_, i) => i);
    let start = Math.max(0, pageIndex - Math.floor(maxVisible / 2));
    const end = Math.min(start + maxVisible, pageCount);
    start = Math.max(0, end - maxVisible);
    return Array.from({ length: end - start }, (_, i) => start + i);
  };

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-outline-variant/5 bg-surface-container-low/30 px-8 py-4">
      <p className="text-xs font-medium text-on-surface-variant">
        Showing {from}–{to} of {total} {total === 1 ? "item" : "items"}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPreviousPage}
          disabled={!canPreviousPage}
          className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container disabled:pointer-events-none disabled:opacity-30"
          aria-label="Previous page"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">
            chevron_left
          </span>
        </button>
        {getPageNumbers().map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageClick(page)}
            className={`size-8 rounded-lg text-xs font-bold transition-colors ${
              pageIndex === page
                ? "bg-primary text-white shadow-sm shadow-primary/20"
                : "text-on-surface hover:bg-surface-container"
            }`}
          >
            {page + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={onNextPage}
          disabled={!canNextPage}
          className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container disabled:pointer-events-none disabled:opacity-30"
          aria-label="Next page"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">
            chevron_right
          </span>
        </button>
      </div>
    </div>
  );
}
