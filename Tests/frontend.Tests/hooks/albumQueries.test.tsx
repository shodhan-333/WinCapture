import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  albumKeys,
  useAlbumDetailQuery,
  useAlbumFileDetailQuery,
  useAlbumFilesQuery,
  useAlbumMembersQuery,
  useCreateAlbumMutation,
  useDeleteAlbumMutation,
  useUpdateAlbumMutation,
} from "../../../frontend/src/features/albums/hooks/albumQueries";
import type { AlbumResponse } from "../../../frontend/src/features/albums/types/album";
import { renderHookWithQueryClient } from "../utils/queryTestUtils";

vi.mock("../../../frontend/src/features/albums/api/albumsApi", () => ({
  createAlbum: vi.fn(),
  deleteAlbum: vi.fn(),
  getAlbum: vi.fn(),
  getAlbumFile: vi.fn(),
  getAlbumFiles: vi.fn(),
  getAlbumMembers: vi.fn(),
  updateAlbum: vi.fn(),
}));

import { createAlbum, deleteAlbum, getAlbum, getAlbumFile, getAlbumFiles, getAlbumMembers, updateAlbum } from "../../../frontend/src/features/albums/api/albumsApi";

const account = { homeAccountId: "user" } as AccountInfo;
const instance = {} as IPublicClientApplication;
const context = { instance, account, accountKey: "user" };
const album = (id = 1): AlbumResponse => ({
  id, albumName: `Album ${id}`, ownerId: 8, ownerName: "Owner",
  createdAt: "2025-01-01T00:00:00Z", updatedAt: null,
});
const paged = { items: [], page: 1, pageSize: 10, pageCount: 0, totalItems: 0 };

function createClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 60_000 }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
  return { client, wrapper };
}

describe("album query hooks", () => {
  it("creates stable cache keys for list, detail, file, member, and file-detail data", () => {
    expect(albumKeys.list("user", "mine", 2, 9, "sea", false)).toEqual(["albums", "list", "user", "mine", 2, 9, "sea", false]);
    expect(albumKeys.detail("user", 3)).toEqual(["albums", "detail", "user", 3]);
    expect(albumKeys.files("user", 3, 1, 12, "All")).toEqual(["albums", "files", "user", 3, 1, 12, "All"]);
    expect(albumKeys.members("user", 3)).toEqual(["albums", "members", "user", 3]);
    expect(albumKeys.fileDetail("user", 3, 4)).toEqual(["albums", "file-detail", "user", 3, 4]);
  });

  it("loads album details, files, members, and file details only when enabled", async () => {
    vi.mocked(getAlbum).mockResolvedValue(album(2));
    vi.mocked(getAlbumFiles).mockResolvedValue(paged as never);
    vi.mocked(getAlbumMembers).mockResolvedValue([]);
    vi.mocked(getAlbumFile).mockResolvedValue({ id: 4 } as never);
    const detail = renderHookWithQueryClient(() => useAlbumDetailQuery({ ...context, albumId: 2 }));
    const files = renderHookWithQueryClient(() => useAlbumFilesQuery({ ...context, albumId: 2, page: 1, pageSize: 12, category: "All" }));
    const members = renderHookWithQueryClient(() => useAlbumMembersQuery({ ...context, albumId: 2, enabled: true }));
    const fileDetail = renderHookWithQueryClient(() => useAlbumFileDetailQuery({ ...context, albumId: 2, fileId: 4, enabled: true }));

    await waitFor(() => expect(detail.result.current.data).toEqual(album(2)));
    await waitFor(() => expect(files.result.current.data).toEqual(paged));
    await waitFor(() => expect(members.result.current.data).toEqual([]));
    await waitFor(() => expect(fileDetail.result.current.data).toEqual({ id: 4 }));
    expect(getAlbumMembers).toHaveBeenCalledWith(instance, account, 2, expect.any(AbortSignal));
    expect(getAlbumFile).toHaveBeenCalledWith(instance, account, 2, 4, expect.any(AbortSignal));
  });

  it("rejects forced unauthenticated detail queries and skips invalid identifiers", async () => {
    const noAccount = renderHookWithQueryClient(() => useAlbumDetailQuery({ ...context, account: null, accountKey: null, albumId: 0 }));
    expect(getAlbum).not.toHaveBeenCalled();
    const fetched = await noAccount.result.current.refetch();
    expect(fetched.error).toEqual(new Error("An authenticated account is required."));

    const noMembers = renderHookWithQueryClient(() => useAlbumMembersQuery({ ...context, albumId: 0, enabled: true }));
    expect(getAlbumMembers).not.toHaveBeenCalled();
    expect(noMembers.result.current.isPending).toBe(true);
  });

  it("covers unauthenticated and disabled query functions for each album query", async () => {
    const guest = { ...context, account: null, accountKey: null };
    const detail = renderHookWithQueryClient(() => useAlbumDetailQuery({ ...guest, albumId: 2 }));
    const files = renderHookWithQueryClient(() => useAlbumFilesQuery({ ...guest, albumId: 2, page: 1, pageSize: 12, category: "All" }));
    const members = renderHookWithQueryClient(() => useAlbumMembersQuery({ ...guest, albumId: 2, enabled: true }));
    const fileDetail = renderHookWithQueryClient(() => useAlbumFileDetailQuery({ ...guest, albumId: 2, fileId: 4 }));
    const disabledMembers = renderHookWithQueryClient(() => useAlbumMembersQuery({ ...context, albumId: 2, enabled: false }));
    const disabledFileDetail = renderHookWithQueryClient(() => useAlbumFileDetailQuery({ ...context, albumId: 2, fileId: 4, enabled: false }));

    for (const query of [detail, files, members, fileDetail]) {
      const result = await query.result.current.refetch();
      expect(result.error).toEqual(new Error("An authenticated account is required."));
    }
    expect(disabledMembers.result.current.isPending).toBe(true);
    expect(disabledFileDetail.result.current.isPending).toBe(true);
    expect(getAlbum).not.toHaveBeenCalled();
    expect(getAlbumFiles).not.toHaveBeenCalled();
    expect(getAlbumMembers).not.toHaveBeenCalled();
    expect(getAlbumFile).not.toHaveBeenCalled();
  });

  it("seeds caches after creation and updates album detail caches after edits", async () => {
    const { client, wrapper } = createClient();
    const created = album(8);
    vi.mocked(createAlbum).mockResolvedValue(created);
    vi.mocked(updateAlbum).mockResolvedValue({ ...created, albumName: "Renamed" });
    const createdMutation = renderHook(() => useCreateAlbumMutation(context), { wrapper });
    await act(async () => createdMutation.result.current.mutateAsync({ albumName: "Album 8" }));
    expect(client.getQueryData(albumKeys.detail("user", 8))).toEqual(created);

    const updateMutation = renderHook(() => useUpdateAlbumMutation({ ...context, albumId: 8 }), { wrapper });
    await act(async () => updateMutation.result.current.mutateAsync({ albumName: "Renamed" }));
    expect(client.getQueryData(albumKeys.detail("user", 8))).toEqual({ ...created, albumName: "Renamed" });
  });

  it("removes deleted album caches and refreshes list caches", async () => {
    const { client, wrapper } = createClient();
    client.setQueryData(albumKeys.detail("user", 8), album(8));
    client.setQueryData(["albums", "files", "user", 8, 1], paged);
    client.setQueryData(albumKeys.members("user", 8), []);
    vi.mocked(deleteAlbum).mockResolvedValue(undefined);
    const mutation = renderHook(() => useDeleteAlbumMutation(context), { wrapper });
    await act(async () => mutation.result.current.mutateAsync(8));
    await waitFor(() => expect(client.getQueryData(albumKeys.detail("user", 8))).toBeUndefined());
    expect(client.getQueryData(["albums", "files", "user", 8, 1])).toBeUndefined();
    expect(client.getQueryData(albumKeys.members("user", 8))).toBeUndefined();
    expect(deleteAlbum).toHaveBeenCalledWith(instance, account, 8);
  });

  it("rejects album mutations without an authenticated account", async () => {
    const guest = { ...context, account: null, accountKey: null };
    const { wrapper } = createClient();
    const createMutation = renderHook(() => useCreateAlbumMutation(guest), { wrapper });
    const updateMutation = renderHook(() => useUpdateAlbumMutation({ ...guest, albumId: 8 }), { wrapper });
    const deleteMutation = renderHook(() => useDeleteAlbumMutation(guest), { wrapper });

    await expect(act(async () => createMutation.result.current.mutateAsync({ albumName: "Guest" })))
      .rejects.toThrow("An authenticated account is required.");
    await expect(act(async () => updateMutation.result.current.mutateAsync({ albumName: "Guest" })))
      .rejects.toThrow("An authenticated account is required.");
    await expect(act(async () => deleteMutation.result.current.mutateAsync(8)))
      .rejects.toThrow("An authenticated account is required.");
    expect(createAlbum).not.toHaveBeenCalled();
    expect(updateAlbum).not.toHaveBeenCalled();
    expect(deleteAlbum).not.toHaveBeenCalled();
  });
});
