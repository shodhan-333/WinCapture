import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FileResponse } from "../../../frontend/src/types/file";
import useFilePreviews from "../../../frontend/src/hooks/useFilePreviews";

const makeFile = (id: number, contentType = "image/png"): FileResponse => ({
  id,
  originalFileName: `file-${id}.${contentType === "application/pdf" ? "pdf" : "png"}`,
  contentType,
  fileSize: 100,
  uploadedAt: "2025-01-01T00:00:00.000Z",
  url: "",
  downloadUrl: `/api/files/${id}/download`,
  isFavorite: false,
  canManage: true,
});

describe("useFilePreviews", () => {
  it("requests previews only for supplied visible previewable files", async () => {
    const loadPreview = vi.fn(async (file: FileResponse) => `blob:${file.id}`);
    const files = [makeFile(1), makeFile(2), makeFile(3, "application/pdf")];
    const { result } = renderHook(() => useFilePreviews(files, loadPreview));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(loadPreview.mock.calls.map(([file]) => file.id)).toEqual([1, 2, 3]);
    expect(result.current.previewUrls).toEqual({ 1: "blob:1", 2: "blob:2", 3: "blob:3" });
  });

  it("shares in-flight requests for repeated file ids", async () => {
    let resolvePreview!: (url: string) => void;
    const request = new Promise<string>((resolve) => { resolvePreview = resolve; });
    const loadPreview = vi.fn(() => request);
    const file = makeFile(4);
    const { result, rerender } = renderHook(
      ({ pageFiles }) => useFilePreviews(pageFiles, loadPreview),
      { initialProps: { pageFiles: [file] } },
    );

    rerender({ pageFiles: [file] });
    expect(loadPreview).toHaveBeenCalledTimes(1);

    await act(async () => resolvePreview("blob:4"));
    await waitFor(() => expect(result.current.previewUrls[4]).toBe("blob:4"));
  });

  it("ignores results after the requesting page is unmounted", async () => {
    let resolvePreview!: (url: string) => void;
    const loadPreview = vi.fn(() => new Promise<string>((resolve) => { resolvePreview = resolve; }));
    const files = [makeFile(5)];
    const { result, unmount } = renderHook(() => useFilePreviews(files, loadPreview));

    unmount();
    await act(async () => resolvePreview("blob:5"));
    expect(result.current.previewUrls).toEqual({});
  });

  it("does not let an older request replace or revoke a replacement preview", async () => {
    let resolveOld!: (url: string) => void;
    let resolveNew!: (url: string) => void;
    const loadPreview = vi.fn((file: FileResponse) => new Promise<string>((resolve) => {
      if (file.fileSize === 100) resolveOld = resolve;
      else resolveNew = resolve;
    }));
    const oldFile = makeFile(9);
    const newFile = { ...oldFile, fileSize: 200, uploadedAt: "2025-01-02T00:00:00.000Z" };
    const { result, rerender } = renderHook(
      ({ pageFiles }) => useFilePreviews(pageFiles, loadPreview),
      { initialProps: { pageFiles: [oldFile] } },
    );

    rerender({ pageFiles: [newFile] });
    await act(async () => resolveNew("blob:new"));
    await waitFor(() => expect(result.current.previewUrls[9]).toBe("blob:new"));
    await act(async () => resolveOld("blob:old"));

    expect(result.current.previewUrls[9]).toBe("blob:new");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:old");
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:new");
  });
});
