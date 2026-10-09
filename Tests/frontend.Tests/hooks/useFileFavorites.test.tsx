import { act, renderHook } from "@testing-library/react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addFavorite, removeFavorite } from "../../../frontend/src/api/apiClient";
import type { FileResponse } from "../../../frontend/src/types/file";
import useFileFavorites from "../../../frontend/src/hooks/useFileFavorites";

vi.mock("../../../frontend/src/api/apiClient", () => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));

const file: FileResponse = {
  id: 21,
  originalFileName: "shared.png",
  contentType: "image/png",
  fileSize: 123,
  uploadedAt: "2025-01-01T00:00:00Z",
  url: "/api/albums/5/files/21",
  downloadUrl: "/api/albums/5/files/21/download",
  isFavorite: false,
  canManage: false,
};
const instance = {} as IPublicClientApplication;
const account = { homeAccountId: "account" } as AccountInfo;

describe("useFileFavorites", () => {
  beforeEach(() => vi.mocked(addFavorite).mockResolvedValue(undefined));

  it("adds a favorite and reports success while tracking its pending id", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useFileFavorites({ instance, account, onSuccess, onError }));

    await act(async () => result.current.toggleFavorite(file));

    expect(addFavorite).toHaveBeenCalledWith(instance, account, file.id);
    expect(onSuccess).toHaveBeenCalledWith(file, true);
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.pendingIds.size).toBe(0);
  });

  it("removes a current favorite", async () => {
    const favorite = { ...file, isFavorite: true };
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useFileFavorites({
      instance,
      account,
      onSuccess,
      onError: vi.fn(),
    }));

    await act(async () => result.current.toggleFavorite(favorite));

    expect(removeFavorite).toHaveBeenCalledWith(instance, account, file.id);
    expect(onSuccess).toHaveBeenCalledWith(favorite, false);
  });

  it("does not call the API without an authenticated account", async () => {
    const { result } = renderHook(() => useFileFavorites({
      instance,
      account: null,
      onSuccess: vi.fn(),
      onError: vi.fn(),
    }));

    await act(async () => result.current.toggleFavorite(file));
    expect(addFavorite).not.toHaveBeenCalled();
    expect(removeFavorite).not.toHaveBeenCalled();
  });

  it("reports API failures without claiming success and clears pending state", async () => {
    vi.mocked(addFavorite).mockRejectedValueOnce(new Error("Access denied"));
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useFileFavorites({ instance, account, onSuccess, onError }));

    await act(async () => result.current.toggleFavorite(file));

    expect(onError).toHaveBeenCalledWith("Access denied");
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.pendingIds.size).toBe(0);
  });
});
