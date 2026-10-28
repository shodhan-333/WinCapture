import { act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FileResponse } from "../../src/features/files/types/file";
import { useFilePreviews } from "../../src/features/files/hooks/useFilePreviews";
import { renderHookWithQueryClient as renderHook } from "../utils/queryTestUtils";

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
  canDownload: true,
});

describe("useFilePreviews", () => {
  it("skips non-image and unsupported image formats", async () => {
    const loadPreview = vi.fn(async () => "blob:unused");
    const unsupported = [
      makeFile(10, "application/pdf"),
      { ...makeFile(11), originalFileName: "vector.svg" },
    ];
    const { result } = renderHook(() => useFilePreviews(unsupported, loadPreview));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.previewUrls).toEqual({});
    expect(loadPreview).not.toHaveBeenCalled();
  });

  it("keeps image URL loading in the shared cache while other formats load on demand", async () => {
    const loadPreview = vi.fn(async (file: FileResponse) => `blob:${file.id}`);
    const files = [makeFile(1), makeFile(2), makeFile(3, "application/pdf")];
    const { result } = renderHook(() => useFilePreviews(files, loadPreview));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(loadPreview.mock.calls.map(([file]) => file.id)).toEqual([1, 2]);
    expect(result.current.previewUrls).toEqual({ 1: "blob:1", 2: "blob:2" });
  });

  it("shares in-flight requests for repeated file ids", async () => {
    let resolvePreview!: (url: string) => void;
    const request = new Promise<string>((resolve) => {
      resolvePreview = resolve;
    });
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

  it("reuses a cached preview until file metadata changes", async () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const loadPreview = vi.fn().mockResolvedValueOnce("blob:old").mockResolvedValueOnce("blob:new");
    const file = makeFile(12);
    const { result, rerender, unmount } = renderHook(
      ({ pageFiles }) => useFilePreviews(pageFiles, loadPreview),
      { initialProps: { pageFiles: [file] } },
    );

    await waitFor(() => expect(result.current.previewUrls[12]).toBe("blob:old"));
    rerender({ pageFiles: [{ ...file }] });
    expect(result.current.previewUrls[12]).toBe("blob:old");
    expect(loadPreview).toHaveBeenCalledOnce();

    rerender({
      pageFiles: [{ ...file, uploadedAt: "2025-01-02T00:00:00.000Z" }],
    });
    await waitFor(() => expect(result.current.previewUrls[12]).toBe("blob:new"));
    unmount();
    expect(revoke).not.toHaveBeenCalled();
  });

  it("ignores results after the requesting page is unmounted", async () => {
    let resolvePreview!: (url: string) => void;
    const loadPreview = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolvePreview = resolve;
        }),
    );
    const files = [makeFile(5)];
    const { result, unmount } = renderHook(() => useFilePreviews(files, loadPreview));

    unmount();
    await act(async () => resolvePreview("blob:5"));
    expect(result.current.previewUrls).toEqual({});
  });

  it("does not let an older request replace or revoke a replacement preview", async () => {
    let resolveOld!: (url: string) => void;
    let resolveNew!: (url: string) => void;
    const loadPreview = vi.fn(
      (file: FileResponse) =>
        new Promise<string>((resolve) => {
          if (file.fileSize === 100) resolveOld = resolve;
          else resolveNew = resolve;
        }),
    );
    const oldFile = makeFile(9);
    const newFile = {
      ...oldFile,
      fileSize: 200,
      uploadedAt: "2025-01-02T00:00:00.000Z",
    };
    const { result, rerender } = renderHook(
      ({ pageFiles }) => useFilePreviews(pageFiles, loadPreview),
      { initialProps: { pageFiles: [oldFile] } },
    );

    rerender({ pageFiles: [newFile] });
    await act(async () => resolveNew("blob:new"));
    await waitFor(() => expect(result.current.previewUrls[9]).toBe("blob:new"));
    await act(async () => resolveOld("blob:old"));

    expect(result.current.previewUrls[9]).toBe("blob:new");
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:old");
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:new");
  });
});
