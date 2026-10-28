import { afterEach, describe, expect, it, vi } from "vitest";

import { getAdminContentScope, setAdminContentScope } from "../../src/shared/utils/adminContentScope";

describe("admin content scope storage", () => {
  afterEach(() => vi.restoreAllMocks());

  it("falls back to personal scope when session storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("storage disabled"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage disabled"); });
    expect(getAdminContentScope()).toBe("mine");
    expect(() => setAdminContentScope("all")).not.toThrow();
  });
});
