import { describe, expect, it } from "vitest";

import { buildPagePath } from "../../src/shared/api/pagination";

describe("buildPagePath", () => {
  it("always includes paging and trims optional search and category filters", () => {
    expect(buildPagePath("/api/files", 2, 12, "  coast & sea  ", "Images")).toBe(
      "/api/files?page=2&pageSize=12&search=coast+%26+sea&category=Images",
    );
  });

  it("omits blank searches and the All category", () => {
    expect(buildPagePath("/api/files", 1, 12, "   ", "All")).toBe(
      "/api/files?page=1&pageSize=12",
    );
    expect(buildPagePath("/api/files", 1, 12, undefined, undefined)).toBe(
      "/api/files?page=1&pageSize=12",
    );
  });
});
