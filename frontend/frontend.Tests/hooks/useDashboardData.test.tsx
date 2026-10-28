import { waitFor } from "@testing-library/react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { describe, expect, it, vi } from "vitest";

import { useDashboardData } from "../../src/features/dashboard/hooks/useDashboardData";
import type { AlbumResponse } from "../../src/features/albums/types/album";
import type { AdminFileResponse } from "../../src/features/files/types/file";
import { renderHookWithQueryClient } from "../utils/queryTestUtils";

vi.mock("../../src/features/albums/api/albumsApi", () => ({
  getAdminAlbums: vi.fn(),
  getMyAlbums: vi.fn(),
}));
vi.mock("../../src/features/files/api/filesApi", () => ({
  getAdminFiles: vi.fn(),
  getFiles: vi.fn(),
}));

import { getAdminAlbums, getMyAlbums } from "../../src/features/albums/api/albumsApi";
import { getAdminFiles, getFiles } from "../../src/features/files/api/filesApi";

const account = { homeAccountId: "admin" } as AccountInfo;
const instance = {} as IPublicClientApplication;
const album: AlbumResponse = {
  id: 4, albumName: "All album", ownerId: 2, ownerName: "Owner",
  createdAt: "2025-01-01T00:00:00Z", updatedAt: null,
};
const adminFile = (id: number, albumId: number | null): AdminFileResponse => ({
  id, originalFileName: `file-${id}.pdf`, contentType: "application/pdf", fileSize: 10,
  uploadedAt: "2025-01-01T00:00:00Z", uploadedBy: 2, uploaderName: "Owner", albumId,
  albumName: albumId === null ? null : "All album",
});
const page = <T,>(items: T[], currentPage = 1, pageCount = 1) => ({
  items, page: currentPage, pageSize: 20, pageCount, totalItems: items.length,
});
const options = (overrides: Partial<Parameters<typeof useDashboardData>[0]> = {}) => ({
  instance, account, accountKey: "admin", canViewAllContent: true, contentScope: "all" as const,
  allAlbumsPage: 2, allFilesPage: 3, allAlbumsSearch: " coast ", allFilesSearch: " river ",
  setAllAlbumsPage: vi.fn(), setAllFilesPage: vi.fn(), ...overrides,
});

describe("useDashboardData", () => {
  it("loads admin lists and category totals, maps secure download paths, and corrects page state", async () => {
    vi.mocked(getAdminAlbums).mockResolvedValue(page([album], 1, 4) as never);
    vi.mocked(getAdminFiles).mockImplementation(async (_instance, _account, requestedPage, _size, search, category) =>
      category
        ? page([], requestedPage, 1) as never
        : page([adminFile(1, null), adminFile(2, 7)], 1, 3) as never,
    );
    const setAllAlbumsPage = vi.fn();
    const setAllFilesPage = vi.fn();
    const { result } = renderHookWithQueryClient(() => useDashboardData(options({ setAllAlbumsPage, setAllFilesPage })));

    await waitFor(() => expect(result.current.hasLoaded).toBe(true));
    await waitFor(() => expect(setAllAlbumsPage).toHaveBeenCalledWith(1));
    expect(setAllFilesPage).toHaveBeenCalledWith(1);
    expect(getAdminAlbums).toHaveBeenCalledWith(instance, account, 2, 10, "coast", expect.any(AbortSignal));
    expect(getAdminFiles).toHaveBeenCalledWith(instance, account, 3, 10, "river", undefined, expect.any(AbortSignal));
    expect(result.current.files).toEqual([
      expect.objectContaining({ id: 1, url: "", downloadUrl: "/api/files/1/download", canManage: true, canDownload: true, isFavorite: false }),
      expect.objectContaining({ id: 2, downloadUrl: "/api/albums/7/files/2/download" }),
    ]);
    expect(Object.values(result.current.fileCategoryCounts)).toEqual([0, 0, 0, 0, 0]);
  });

  it("loads personal dashboard lists and category totals for a non-admin account", async () => {
    vi.mocked(getMyAlbums).mockResolvedValue(page([album]) as never);
    vi.mocked(getFiles).mockResolvedValue(page([]) as never);
    const { result } = renderHookWithQueryClient(() => useDashboardData(options({ canViewAllContent: false, contentScope: "all" })));
    await waitFor(() => expect(result.current.hasLoaded).toBe(true));
    expect(getMyAlbums).toHaveBeenCalledWith(instance, account, 1, 4, undefined, expect.any(AbortSignal));
    expect(getFiles).toHaveBeenCalledWith(instance, account, 1, 4, undefined, undefined, expect.any(AbortSignal));
    expect(getAdminAlbums).not.toHaveBeenCalled();
    expect(getAdminFiles).not.toHaveBeenCalled();
  });

  it("hides non-Error query failures while retaining default data values", async () => {
    vi.mocked(getAdminAlbums).mockRejectedValue("offline");
    vi.mocked(getAdminFiles).mockRejectedValue("offline");
    const { result } = renderHookWithQueryClient(() => useDashboardData(options()));
    await waitFor(() => expect(result.current.hasLoaded).toBe(true));
    expect(result.current.error).toBeNull();
    expect(result.current.albums).toEqual([]);
    expect(result.current.allAlbumsCount).toBe(0);
    expect(result.current.allAlbumsPageCount).toBe(1);
  });
});
