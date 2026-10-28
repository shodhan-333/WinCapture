import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  fileKeys,
  useFileDetailQuery,
  useFileListQuery,
  useToggleFavoriteMutation,
} from "../../src/features/files/hooks/fileQueries";
import type { FileResponse } from "../../src/features/files/types/file";
import { renderHookWithQueryClient } from "../utils/queryTestUtils";

vi.mock("../../src/features/files/api/filesApi", () => ({
  addFavorite: vi.fn(),
  getAdminFiles: vi.fn(),
  getFavorites: vi.fn(),
  getFile: vi.fn(),
  getFiles: vi.fn(),
  removeFavorite: vi.fn(),
}));

import {
  addFavorite,
  getAdminFiles,
  getFavorites,
  getFile,
  getFiles,
  removeFavorite,
} from "../../src/features/files/api/filesApi";

const account = { homeAccountId: "account-1" } as AccountInfo;
const instance = {} as IPublicClientApplication;
const makeFile = (id: number, albumId: number | null = null): FileResponse => ({
  id,
  originalFileName: `file-${id}.pdf`,
  contentType: "application/pdf",
  fileSize: 20,
  uploadedAt: "2025-01-01T00:00:00Z",
  url: "/url",
  downloadUrl: "/download",
  albumId,
  isFavorite: false,
  canManage: false,
  canDownload: false,
});
const page = (items: FileResponse[], currentPage = 1, pageCount = 1) => ({
  items,
  page: currentPage,
  pageSize: 10,
  pageCount,
  totalItems: items.length,
});

function createClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 60_000 }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return { client, wrapper };
}

describe("file query hooks", () => {
  it("builds stable list and detail keys with optional filters normalized", () => {
    expect(fileKeys.list(null, "all", 1, 10, "", undefined)).toEqual([
      "files", "list", null, "all", 1, 10, "", "", false, null,
    ]);
    expect(fileKeys.list("user", "all", 2, 10, "pdf", "PDF", true, 8)).toEqual([
      "files", "list", "user", "all", 2, 10, "pdf", "PDF", true, 8,
    ]);
    expect(fileKeys.detail("user", 8)).toEqual(["files", "detail", "user", 8]);
  });

  it("loads favorites and propagates the abort signal and filters", async () => {
    vi.mocked(getFavorites).mockResolvedValue(page([makeFile(1)]) as never);
    const { result } = renderHookWithQueryClient(
      () => useFileListQuery({ instance, account, accountKey: "user", view: "favorites", page: 2, pageSize: 10, search: " map ", category: "Images" }),
    );
    let fetched: Awaited<ReturnType<typeof result.current.refetch>> | undefined;
    await act(async () => { fetched = await result.current.refetch(); });
    expect(fetched?.data?.items[0]?.id).toBe(1);
    expect(getFavorites).toHaveBeenCalledWith(instance, account, 2, 10, " map ", "Images", expect.any(AbortSignal));
  });

  it("loads ordinary lists and follows pages until a requested routed file is found", async () => {
    vi.mocked(getFiles)
      .mockResolvedValueOnce(page([makeFile(1)], 1, 3) as never)
      .mockResolvedValueOnce(page([makeFile(8)], 2, 3) as never);
    const { result } = renderHookWithQueryClient(
      () => useFileListQuery({ instance, account, accountKey: "user", view: "all", page: 1, pageSize: 10, routeFileId: 8 }),
    );
    let fetched: Awaited<ReturnType<typeof result.current.refetch>> | undefined;
    await act(async () => { fetched = await result.current.refetch(); });
    expect(fetched?.data?.items[0]?.id).toBe(8);
    expect(getFiles).toHaveBeenNthCalledWith(1, instance, account, 1, 10, undefined, undefined, expect.any(AbortSignal));
    expect(getFiles).toHaveBeenNthCalledWith(2, instance, account, 2, 10, undefined, undefined, expect.any(AbortSignal));
  });

  it("stops routed pagination when the file is absent on the last page or lookup is inapplicable", async () => {
    vi.mocked(getFiles).mockReset()
      .mockResolvedValueOnce(page([makeFile(1)], 1, 2) as never)
      .mockResolvedValueOnce(page([makeFile(2)], 2, 2) as never);
    const { result, rerender } = renderHookWithQueryClient(
      ({ view, pageNumber }) => useFileListQuery({ instance, account, accountKey: "user", view, page: pageNumber, pageSize: 10, routeFileId: 99 }),
      { initialProps: { view: "all" as const, pageNumber: 1 } },
    );
    let fetched: Awaited<ReturnType<typeof result.current.refetch>> | undefined;
    await act(async () => { fetched = await result.current.refetch(); });
    expect(fetched?.data?.page).toBe(2);
    expect(getFiles).toHaveBeenCalledTimes(2);

    vi.mocked(getFiles).mockReset().mockResolvedValue(page([makeFile(4)], 2, 4) as never);
    vi.mocked(getFavorites).mockResolvedValue(page([makeFile(4)], 2, 4) as never);
    rerender({ view: "favorites", pageNumber: 2 });
    await act(async () => { fetched = await result.current.refetch(); });
    expect(fetched?.data?.items[0]?.id).toBe(4);
    expect(getFiles).not.toHaveBeenCalled();
    expect(getFavorites).toHaveBeenCalledTimes(1);
  });

  it("maps administrator files to authorized download routes and avoids routing on later pages", async () => {
    vi.mocked(getAdminFiles).mockResolvedValue(page([makeFile(1, null), makeFile(2, 7)]) as never);
    const { result } = renderHookWithQueryClient(
      () => useFileListQuery({ instance, account, accountKey: "admin", view: "all", page: 2, pageSize: 10, adminAll: true, routeFileId: 8 }),
    );
    let fetched: Awaited<ReturnType<typeof result.current.refetch>> | undefined;
    await act(async () => { fetched = await result.current.refetch(); });
    expect(fetched?.data?.items).toHaveLength(2);
    expect(getAdminFiles).toHaveBeenCalledTimes(1);
    expect(fetched?.data?.items).toEqual([
      expect.objectContaining({ id: 1, url: "", downloadUrl: "/api/files/1/download", isFavorite: false, canManage: true, canDownload: true }),
      expect.objectContaining({ id: 2, downloadUrl: "/api/albums/7/files/2/download", canManage: true }),
    ]);
  });

  it("does not execute a disabled detail query and rejects forced unauthenticated fetches", async () => {
    const { result } = renderHookWithQueryClient(
      () => useFileDetailQuery({ instance, account: null, accountKey: null, fileId: 0 }),
    );
    expect(result.current.isPending).toBe(true);
    expect(getFile).not.toHaveBeenCalled();

    let fetched: Awaited<ReturnType<typeof result.current.refetch>> | undefined;
    await act(async () => { fetched = await result.current.refetch(); });
    expect(fetched?.error).toEqual(new Error("An authenticated account is required."));
  });

  it("loads a valid detail query and honors the explicit disabled flag", async () => {
    const file = makeFile(3);
    vi.mocked(getFile).mockResolvedValue(file);
    const { result, rerender } = renderHookWithQueryClient(
      ({ enabled }) => useFileDetailQuery({ instance, account, accountKey: "user", fileId: 3, enabled }),
      { initialProps: { enabled: false } },
    );
    expect(getFile).not.toHaveBeenCalled();
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.data).toEqual(file));
    expect(getFile).toHaveBeenCalledWith(instance, account, 3, expect.any(AbortSignal));
  });

  it("optimistically updates file and album lists, then restores both caches on failure", async () => {
    const { client, wrapper } = createClient();
    const fileKey = fileKeys.list("user", "all", 1, 10, "", undefined);
    const albumKey = ["albums", "files", "user", 7];
    const source = { items: [makeFile(5), { id: 6, other: true }, null], page: 1 };
    client.setQueryData(fileKey, source);
    client.setQueryData(albumKey, source);
    let rejectRequest!: (error: Error) => void;
    vi.mocked(addFavorite).mockImplementation(() => new Promise<void>((_resolve, reject) => { rejectRequest = reject; }));
    const { result } = renderHook(
      () => useToggleFavoriteMutation({ instance, account, accountKey: "user" }),
      { wrapper },
    );
    let mutation!: Promise<void>;
    act(() => { mutation = result.current.mutateAsync({ fileId: 5, favorite: true }); });
    await waitFor(() => expect(client.getQueryData(fileKey)).toEqual({ ...source, items: [expect.objectContaining({ id: 5, isFavorite: true }), source.items[1], null] }));
    await act(async () => { rejectRequest(new Error("offline")); await expect(mutation).rejects.toThrow("offline"); });
    expect(client.getQueryData(fileKey)).toEqual(source);
    expect(client.getQueryData(albumKey)).toEqual(source);
  });

  it("adds or removes favorites and safely handles missing or malformed cache values", async () => {
    const { client, wrapper } = createClient();
    const key = fileKeys.list("user", "all", 1, 10, "", undefined);
    client.setQueryData(key, { items: "not-an-array" });
    client.setQueryData(["albums", "files", "user"], { items: [makeFile(12)] });
    vi.mocked(removeFavorite).mockResolvedValue(undefined);
    const { result } = renderHook(
      () => useToggleFavoriteMutation({ instance, account, accountKey: "user" }),
      { wrapper },
    );
    await act(async () => { await result.current.mutateAsync({ fileId: 12, favorite: false }); });
    expect(removeFavorite).toHaveBeenCalledWith(instance, account, 12);
    expect(client.getQueryData(key)).toEqual({ items: "not-an-array" });
    expect(client.getQueryData(["albums", "files", "user"])).toEqual({ items: [expect.objectContaining({ id: 12, isFavorite: false })] });

    const noAccountEnvironment = createClient();
    const noAccount = renderHook(
      () => useToggleFavoriteMutation({ instance, account: null, accountKey: null }),
      { wrapper: noAccountEnvironment.wrapper },
    );
    await act(async () => { await expect(noAccount.result.current.mutateAsync({ fileId: 12, favorite: true })).rejects.toThrow("An authenticated account is required."); });
  });
});
