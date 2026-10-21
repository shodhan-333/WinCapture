// Build a consistent API URL from paging, search, and optional category filters.
export function buildPagePath(
  path: string,
  page: number,
  pageSize: number,
  search?: string,
  category?: string,
): string {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  const normalizedSearch = search?.trim();

  if (normalizedSearch) {
    query.set("search", normalizedSearch);
  }

  // "All" means no category restriction, so omit it from the query string.
  if (category && category !== "All") {
    query.set("category", category);
  }

  return `${path}?${query.toString()}`;
}
