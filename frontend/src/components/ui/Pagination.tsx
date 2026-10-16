interface PaginationProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  pageCount,
  onPageChange,
}: PaginationProps) {
  return (
    <nav
      aria-label="Pagination"
      className="glass-toolbar flex items-center justify-between gap-3 rounded-[11px] px-[15px] py-3 text-[9px] text-[#70879a] max-[520px]:px-3"
    >
      <span>Page {currentPage} of {pageCount}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-[8px] border border-white/70 bg-[rgba(255,255,255,0.52)] px-[11px] py-[6px] font-semibold text-[#3b5d77] shadow-[0_2px_6px_rgba(20,54,84,0.04),inset_0_1px_rgba(255,255,255,0.85)] backdrop-blur-md transition-all hover:bg-white/80 hover:text-[#194f7d] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
          className="rounded-[8px] border border-white/70 bg-[rgba(255,255,255,0.52)] px-[11px] py-[6px] font-semibold text-[#3b5d77] shadow-[0_2px_6px_rgba(20,54,84,0.04),inset_0_1px_rgba(255,255,255,0.85)] backdrop-blur-md transition-all hover:bg-white/80 hover:text-[#194f7d] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
