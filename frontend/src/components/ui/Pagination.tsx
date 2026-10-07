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
      className="flex items-center justify-between gap-3 border-t border-[#e6eef4] px-[15px] py-3 text-[9px] text-[#70879a] max-[520px]:px-3"
    >
      <span>Page {currentPage} of {pageCount}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-[8px] border border-[#dce8f0] bg-[rgba(255,255,255,0.62)] px-[10px] py-[6px] font-semibold text-[#4e6d85] transition-colors hover:bg-[#edf6fd] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
          className="rounded-[8px] border border-[#dce8f0] bg-[rgba(255,255,255,0.62)] px-[10px] py-[6px] font-semibold text-[#4e6d85] transition-colors hover:bg-[#edf6fd] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
