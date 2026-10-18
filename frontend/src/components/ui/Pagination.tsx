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
          className="cursor-pointer rounded-[8px] border border-[rgba(64,112,153,0.42)] bg-[rgba(203,226,246,0.96)] px-[11px] py-[6px] font-semibold text-[#111827] shadow-[0_2px_6px_rgba(20,54,84,0.08),inset_0_1px_rgba(255,255,255,0.9)] backdrop-blur-md transition-all hover:border-[rgba(46,94,137,0.58)] hover:bg-[rgba(183,215,242,1)] hover:text-black disabled:cursor-not-allowed disabled:border-[rgba(112,137,158,0.34)] disabled:bg-[rgba(220,230,238,0.96)] disabled:text-[#303a43] disabled:opacity-100"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
          className="cursor-pointer rounded-[8px] border border-[rgba(64,112,153,0.42)] bg-[rgba(203,226,246,0.96)] px-[11px] py-[6px] font-semibold text-[#111827] shadow-[0_2px_6px_rgba(20,54,84,0.08),inset_0_1px_rgba(255,255,255,0.9)] backdrop-blur-md transition-all hover:border-[rgba(46,94,137,0.58)] hover:bg-[rgba(183,215,242,1)] hover:text-black disabled:cursor-not-allowed disabled:border-[rgba(112,137,158,0.34)] disabled:bg-[rgba(220,230,238,0.96)] disabled:text-[#303a43] disabled:opacity-100"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
