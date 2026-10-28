import { waitFor } from "@testing-library/react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { describe, expect, it, vi } from "vitest";

import { useAlbumsData } from "../../src/features/albums/hooks/useAlbumsData";
import type { AlbumResponse } from "../../src/features/albums/types/album";
import { ApiError } from "../../src/shared/types/api";
import { renderHookWithQueryClient } from "../utils/queryTestUtils";

vi.mock("../../src/features/albums/api/albumsApi", () => ({
  getAdminAlbums: vi.fn(),
  getAlbums: vi.fn(),
  getMyAlbums: vi.fn(),
  getSharedAlbums: vi.fn(),
}));

import { getAdminAlbums, getAlbums, getMyAlbums, getSharedAlbums } from "../../src/features/albums/api/albumsApi";

const account = { homeAccountId: "user" } as AccountInfo;
const instance = {} as IPublicClientApplication;
const album = (id: number, ownerId = 9): AlbumResponse => ({
  id,
  albumName: `Album ${id}`,
  ownerId,
  ownerName: `Owner ${ownerId}`,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: null,
});
const page = (items: AlbumResponse[], currentPage = 1, pageCount = 1) => ({
  items, page: currentPage, pageCount, pageSize: 9, totalItems: items.length,
});

function options(overrides: Partial<Parameters<typeof useAlbumsData>[0]> = {}) {
  return {
    instance, account, accountKey: "user", userId: 9, isAdminAllContent: false,
    currentPage: 1, albumFilter: "all" as const, searchQuery: "coast",
    setCurrentPage: vi.fn(), ...overrides,
  };
}

describe("useAlbumsData", () => {
  it("loads all, mine, and administrator album collections with their paging arguments", async () => {
    vi.mocked(getAlbums).mockResolvedValue(page([album(1)]) as never);
    const all = renderHookWithQueryClient(() => useAlbumsData(options()));
    await waitFor(() => expect(all.result.current.albums).toHaveLength(1));
    expect(getAlbums).toHaveBeenCalledWith(instance, account, 1, 9, "coast", expect.any(AbortSignal));

    vi.mocked(getMyAlbums).mockResolvedValue(page([album(2)]) as never);
    const mine = renderHookWithQueryClient(() => useAlbumsData(options({ albumFilter: "mine", currentPage: 3 })));
    await waitFor(() => expect(mine.result.current.albums[0]?.id).toBe(2));
    expect(getMyAlbums).toHaveBeenCalledWith(instance, account, 3, 9, "coast", expect.any(AbortSignal));

    const setCurrentPage = vi.fn();
    vi.mocked(getAdminAlbums).mockResolvedValue(page([album(3)], 2, 4) as never);
    const admin = renderHookWithQueryClient(() => useAlbumsData(options({ isAdminAllContent: true, currentPage: 1, setCurrentPage })));
    await waitFor(() => expect(admin.result.current.albums[0]?.id).toBe(3));
    await waitFor(() => expect(setCurrentPage).toHaveBeenCalledWith(2));
    expect(getAdminAlbums).toHaveBeenCalledWith(instance, account, 1, 9, "coast", expect.any(AbortSignal));
  });

  it("falls back to accessible albums for older servers and returns the selected shared page", async () => {
    vi.mocked(getSharedAlbums).mockRejectedValueOnce(new ApiError("missing route", 404));
    vi.mocked(getAlbums)
      .mockResolvedValueOnce(page([album(1, 9), ...Array.from({ length: 9 }, (_, index) => album(index + 2, 20 + index))], 1, 2) as never)
      .mockResolvedValueOnce(page([album(11, 30)], 2, 2) as never);
    const { result } = renderHookWithQueryClient(() => useAlbumsData(options({ albumFilter: "shared", currentPage: 2 })));
    await waitFor(() => expect(result.current.hasLoaded).toBe(true));
    expect(result.current.albums.map((item) => item.id)).toEqual([11]);
    expect(result.current.totalItems).toBe(10);
    expect(result.current.pageCount).toBe(2);
    expect(getAlbums).toHaveBeenNthCalledWith(1, instance, account, 1, 100, "coast", expect.any(AbortSignal));
    expect(getAlbums).toHaveBeenNthCalledWith(2, instance, account, 2, 100, "coast", expect.any(AbortSignal));
  });

  it("surfaces shared-route failures when the route is unsupported or legacy fallback lacks a user ID", async () => {
    vi.mocked(getSharedAlbums).mockRejectedValueOnce(new ApiError("forbidden", 403));
    const forbidden = renderHookWithQueryClient(() => useAlbumsData(options({ albumFilter: "shared" })));
    await waitFor(() => expect(forbidden.result.current.hasLoaded).toBe(true));
    expect(forbidden.result.current.error).toBe("forbidden");
    expect(getAlbums).not.toHaveBeenCalled();

    vi.mocked(getSharedAlbums).mockRejectedValueOnce(new ApiError("missing route", 404));
    const noUserId = renderHookWithQueryClient(() => useAlbumsData(options({ albumFilter: "shared", userId: undefined })));
    await waitFor(() => expect(noUserId.result.current.hasLoaded).toBe(true));
    expect(noUserId.result.current.error).toBe("missing route");
    expect(getAlbums).not.toHaveBeenCalled();

    const abortError = new DOMException("aborted", "AbortError");
    vi.mocked(getSharedAlbums).mockRejectedValueOnce(abortError);
    const aborted = renderHookWithQueryClient(() => useAlbumsData(options({ albumFilter: "shared" })));
    await waitFor(() => expect(aborted.result.current.hasLoaded).toBe(true));
    expect(aborted.result.current.error).toBeNull();
    expect(getAlbums).not.toHaveBeenCalled();
  });

  it("keeps a same-account placeholder page and hides non-Error failures", async () => {
    vi.mocked(getAlbums).mockResolvedValue(page([album(4)]) as never);
    const { result, rerender } = renderHookWithQueryClient(
      ({ pageNumber }) => useAlbumsData(options({ currentPage: pageNumber })),
      { initialProps: { pageNumber: 1 } },
    );
    await waitFor(() => expect(result.current.albums[0]?.id).toBe(4));
    vi.mocked(getAlbums).mockRejectedValueOnce("offline");
    rerender({ pageNumber: 2 });
    await waitFor(() => expect(result.current.hasLoaded).toBe(true));
    expect(result.current.error).toBeNull();
  });
});
