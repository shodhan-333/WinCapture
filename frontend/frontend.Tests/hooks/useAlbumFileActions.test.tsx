import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useAlbumFileActions } from "../../src/features/albums/hooks/useAlbumFileActions";
import type { FileResponse } from "../../src/features/files/types/file";

vi.mock("../../src/features/albums/api/albumsApi", () => ({
  deleteAlbumFile: vi.fn(),
  downloadAlbumFile: vi.fn(),
  removeAlbumFileAssociation: vi.fn(),
  replaceAlbumFile: vi.fn(),
}));
vi.mock("../../src/features/files/api/filesApi", () => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));

import {
  deleteAlbumFile,
  downloadAlbumFile,
  removeAlbumFileAssociation,
  replaceAlbumFile,
} from "../../src/features/albums/api/albumsApi";

const account = { homeAccountId: "account" } as AccountInfo;
const instance = {} as IPublicClientApplication;
const makeFile = (id: number): FileResponse => ({
  id,
  originalFileName: `file-${id}.pdf`,
  contentType: "application/pdf",
  fileSize: 10,
  uploadedAt: "2025-01-01T00:00:00Z",
  url: "",
  downloadUrl: "",
  isFavorite: false,
  canManage: true,
  canDownload: true,
});

function setup(options: { account?: AccountInfo | null; albumId?: number; action?: "remove" | "delete" | null; files?: FileResponse[] } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 60_000 }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
  const reloadAlbum = vi.fn().mockResolvedValue(undefined);
  const removeSelected = vi.fn();
  const cancelSelection = vi.fn();
  const setFileDetails = vi.fn();
  const setError = vi.fn();
  const setSuccessMessage = vi.fn();
  const clearBulkAction = vi.fn();
  const replaceTargetIdRef = { current: 3 as number | null };
  const hook = renderHook(() => useAlbumFileActions({
    instance,
    account: options.account === undefined ? account : options.account,
    albumId: options.albumId ?? 5,
    selectedFiles: options.files ?? [makeFile(1), makeFile(2)],
    bulkAction: options.action ?? null,
    replaceTargetIdRef,
    reloadAlbum,
    removeSelected,
    cancelSelection,
    setFileDetails,
    setError,
    setSuccessMessage,
    clearBulkAction,
  }), { wrapper });
  return { ...hook, client, reloadAlbum, removeSelected, cancelSelection, setFileDetails, setError, setSuccessMessage, clearBulkAction, replaceTargetIdRef };
}

const replaceEvent = (files: File[] | null) => ({ target: { files, value: "picked" } }) as unknown as React.ChangeEvent<HTMLInputElement>;

describe("useAlbumFileActions", () => {
  it("guards single-file operations without an account or valid album ID", async () => {
    const noAccount = setup({ account: null, action: "delete" });
    await act(async () => {
      await noAccount.result.current.handleDownload(makeFile(1));
      await noAccount.result.current.handleDelete(1);
      await noAccount.result.current.runBulkAction();
      await noAccount.result.current.handleReplace(replaceEvent([new File(["x"], "a.pdf")]));
    });
    expect(downloadAlbumFile).not.toHaveBeenCalled();
    expect(deleteAlbumFile).not.toHaveBeenCalled();
    expect(noAccount.reloadAlbum).not.toHaveBeenCalled();

    const invalidId = setup({ albumId: Number.NaN, action: "delete" });
    await act(async () => {
      await invalidId.result.current.handleDownload(makeFile(1));
      await invalidId.result.current.handleDelete(1);
      await invalidId.result.current.runBulkAction();
      await invalidId.result.current.handleReplace(replaceEvent([new File(["x"], "a.pdf")]));
    });
    expect(deleteAlbumFile).not.toHaveBeenCalled();
    expect(invalidId.reloadAlbum).not.toHaveBeenCalled();
  });

  it("downloads, deletes, refreshes details, and reports single-operation failures", async () => {
    vi.mocked(downloadAlbumFile).mockRejectedValueOnce(new Error("download denied"));
    const hook = setup();
    await act(async () => hook.result.current.handleDownload(makeFile(7)));
    expect(downloadAlbumFile).toHaveBeenCalledWith(instance, account, 5, 7, "file-7.pdf");
    expect(hook.setError).toHaveBeenCalledWith("download denied");

    vi.mocked(downloadAlbumFile).mockRejectedValueOnce("offline");
    await act(async () => hook.result.current.handleDownload(makeFile(7)));
    expect(hook.setError).toHaveBeenCalledWith("Download failed.");

    vi.mocked(deleteAlbumFile).mockResolvedValueOnce({ storageCleanupComplete: false });
    await act(async () => hook.result.current.handleDelete(7));
    expect(hook.removeSelected).toHaveBeenCalledWith([7]);
    expect(hook.setSuccessMessage).toHaveBeenCalledWith(expect.stringMatching(/cleanup reconciliation/));
    expect(hook.reloadAlbum).toHaveBeenCalledOnce();

    vi.mocked(deleteAlbumFile).mockRejectedValueOnce("offline");
    await act(async () => hook.result.current.handleDelete(7));
    expect(hook.setError).toHaveBeenCalledWith(expect.stringMatching(/Delete failed/));

    await act(async () => hook.result.current.handleShowFileDetails(makeFile(7)));
    expect(hook.setFileDetails).toHaveBeenCalledWith(makeFile(7));
  });

  it("processes bulk album removals and preserves failed selections", async () => {
    vi.mocked(removeAlbumFileAssociation)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("remove denied"));
    const hook = setup({ action: "remove" });
    expect(hook.result.current.bulkPending).toBe(false);
    await act(async () => hook.result.current.runBulkAction());
    expect(removeAlbumFileAssociation).toHaveBeenCalledTimes(2);
    expect(hook.removeSelected).toHaveBeenCalledWith([1]);
    expect(hook.setSuccessMessage).toHaveBeenCalledWith(expect.stringMatching(/1 file removed from this album/));
    expect(hook.clearBulkAction).toHaveBeenCalledOnce();
    expect(hook.cancelSelection).not.toHaveBeenCalled();
    expect(hook.setError).toHaveBeenLastCalledWith(expect.stringMatching(/1 completed; 1 failed/));
    expect(hook.reloadAlbum).toHaveBeenCalledOnce();
  });

  it("reports cleanup warnings for completed bulk deletions and cancels selection", async () => {
    vi.mocked(deleteAlbumFile)
      .mockResolvedValueOnce({ storageCleanupComplete: false })
      .mockResolvedValueOnce({ storageCleanupComplete: true });
    const hook = setup({ action: "delete", files: [makeFile(10), makeFile(11)] });
    await act(async () => hook.result.current.runBulkAction());
    expect(hook.removeSelected).toHaveBeenCalledWith([10, 11]);
    expect(hook.setSuccessMessage).toHaveBeenCalledWith(expect.stringMatching(/cleanup needs reconciliation for: file-10.pdf/));
    expect(hook.cancelSelection).toHaveBeenCalledOnce();
    expect(hook.setError).not.toHaveBeenCalledWith(expect.stringMatching(/failed/));
  });

  it("validates and replaces album files, always clearing the file input target", async () => {
    const hook = setup();
    const invalidEvent = replaceEvent([new File(["x"], "unsafe.exe", { type: "application/octet-stream" })]);
    await act(async () => hook.result.current.handleReplace(invalidEvent));
    expect(hook.setError).toHaveBeenCalledWith(expect.stringMatching(/Unsupported/));
    expect((invalidEvent.target as HTMLInputElement).value).toBe("");
    expect(replaceAlbumFile).not.toHaveBeenCalled();

    vi.mocked(replaceAlbumFile).mockResolvedValue(makeFile(3));
    const replacement = new File(["x"], "replacement.pdf", { type: "application/pdf" });
    const validEvent = replaceEvent([replacement]);
    await act(async () => hook.result.current.handleReplace(validEvent));
    expect(replaceAlbumFile).toHaveBeenCalledWith(instance, account, 5, 3, replacement);
    expect(hook.setSuccessMessage).toHaveBeenCalledWith("replacement.pdf replaced successfully.");
    expect(hook.reloadAlbum).toHaveBeenCalledOnce();
    expect(hook.replaceTargetIdRef.current).toBeNull();
    expect((validEvent.target as HTMLInputElement).value).toBe("");
  });
});
