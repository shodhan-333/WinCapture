interface PaginationResult<T> {
  items: T[];
  pageCount: number;
  currentPage: number;
  totalItems: number;
}

export default function usePagination<T>(
  items: T[],
  requestedPage: number,
  pageSize = 10,
): PaginationResult<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, requestedPage), pageCount);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    pageCount,
    currentPage,
    totalItems: items.length,
  };
}
