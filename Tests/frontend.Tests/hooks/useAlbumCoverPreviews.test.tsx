import { act, renderHook, waitFor } from "@testing-library/react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { describe, expect, it, vi } from "vitest";

import {
  getAlbumFiles,
  getFilePreviewUrl,
} from "../../../frontend/src/features/albums/api/albumsApi";
import type { AlbumResponse } from "../../../frontend/src/features/albums/types/album";
import type { FileResponse } from "../../../frontend/src/features/files/types/file";
import { useAlbumCoverPreviews } from "../../../frontend/src/features/albums/hooks/useAlbumCoverPreviews";

vi.mock("../../../frontend/src/features/albums/api/albumsApi", () => ({
  getAlbumFiles: vi.fn(),
  getFilePreviewUrl: vi.fn(),
}));

const instance = {} as IPublicClientApplication;
const account = { homeAccountId: "account" } as AccountInfo;
const album: AlbumResponse = {
  id: 5,
  albumName: "Holiday",
  ownerId: 8,
  ownerName: "Owner",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: null,
};
const albums = [album];
const image: FileResponse = {
  id: 40,
  originalFileName: "cover.png",
  contentType: "image/png",
  fileSize: 100,
  uploadedAt: "2025-01-01T00:00:00Z",
  url: "",
  downloadUrl: "",
  isFavorite: false,
  canManage: false,
};

describe("useAlbumCoverPreviews", () => {
  it("loads the first image and uses the album owner's management permission", async () => {
    vi.mocked(getAlbumFiles).mockResolvedValueOnce({
      items: [image],
      totalItems: 1,
      page: 1,
      pageSize: 100,
      pageCount: 1,
    });
    vi.mocked(getFilePreviewUrl).mockResolvedValueOnce("blob:cover");
    const { result } = renderHook(() => useAlbumCoverPreviews(albums, instance, account, 99));

    await waitFor(() => expect(result.current[album.id]).toBe("blob:cover"));
    expect(getAlbumFiles).toHaveBeenCalledWith(instance, account, album.id, 1, 100, "Images");
    expect(getFilePreviewUrl).toHaveBeenCalledWith(instance, account, image.id, album.id, false);
  });

  it("uses administrative management rights and skips loading without an account", async () => {
    vi.mocked(getAlbumFiles).mockResolvedValueOnce({
      items: [image],
      totalItems: 1,
      page: 1,
      pageSize: 100,
      pageCount: 1,
    });
    vi.mocked(getFilePreviewUrl).mockResolvedValueOnce("blob:admin-cover");
    const { result, rerender } = renderHook(
      ({ currentAccount, isAdmin }) =>
        useAlbumCoverPreviews(albums, instance, currentAccount, 99, isAdmin),
      {
        initialProps: {
          currentAccount: null as AccountInfo | null,
          isAdmin: true,
        },
      },
    );

    expect(result.current).toEqual({});
    expect(getAlbumFiles).not.toHaveBeenCalled();
    rerender({ currentAccount: account, isAdmin: true });
    await waitFor(() => expect(result.current[album.id]).toBe("blob:admin-cover"));
    expect(getFilePreviewUrl).toHaveBeenCalledWith(instance, account, image.id, album.id, true);
  });

  it("does not reload album files when the account object changes but its identity does not", async () => {
    vi.mocked(getAlbumFiles).mockResolvedValueOnce({
      items: [],
      totalItems: 0,
      page: 1,
      pageSize: 100,
      pageCount: 1,
    });
    const { rerender } = renderHook(
      ({ currentAccount }) => useAlbumCoverPreviews(albums, instance, currentAccount),
      { initialProps: { currentAccount: account } },
    );

    await waitFor(() => expect(getAlbumFiles).toHaveBeenCalledTimes(1));
    rerender({ currentAccount: { ...account } });
    expect(getAlbumFiles).toHaveBeenCalledTimes(1);
  });

  it("releases URLs created for a hook that unmounts before its request finishes", async () => {
    let resolveUrl!: (url: string) => void;
    vi.mocked(getAlbumFiles).mockResolvedValueOnce({
      items: [image],
      totalItems: 1,
      page: 1,
      pageSize: 100,
      pageCount: 1,
    });
    vi.mocked(getFilePreviewUrl).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveUrl = resolve;
      }),
    );
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const { unmount } = renderHook(() => useAlbumCoverPreviews(albums, instance, account));

    await waitFor(() => expect(getFilePreviewUrl).toHaveBeenCalled());
    unmount();
    await act(async () => resolveUrl("blob:stale"));
    expect(revoke).toHaveBeenCalledWith("blob:stale");
  });
});
