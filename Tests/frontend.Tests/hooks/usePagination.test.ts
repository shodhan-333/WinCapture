import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import usePagination from "../../../frontend/src/hooks/usePagination";

describe("usePagination", () => {
  it("returns only the selected page and clamps out-of-range pages", () => {
    const { result, rerender } = renderHook(
      ({ page }) => usePagination([1, 2, 3, 4, 5], page, 2),
      { initialProps: { page: 2 } },
    );

    expect(result.current).toEqual({
      items: [3, 4],
      pageCount: 3,
      currentPage: 2,
      totalItems: 5,
    });

    rerender({ page: 10 });
    expect(result.current.items).toEqual([5]);
    expect(result.current.currentPage).toBe(3);
  });

  it("keeps an empty collection on page one", () => {
    const { result } = renderHook(() => usePagination([], 0, 10));
    expect(result.current).toEqual({
      items: [],
      pageCount: 1,
      currentPage: 1,
      totalItems: 0,
    });
  });
});
