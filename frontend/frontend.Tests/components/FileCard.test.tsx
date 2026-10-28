import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FileCard } from "../../src/features/files/components/FileCard";
import type { FileResponse } from "../../src/features/files/types/file";
import { renderWithQueryClient as render } from "../utils/queryTestUtils";

const file: FileResponse = {
  id: 2,
  originalFileName: "photo.png",
  contentType: "image/png",
  fileSize: 200,
  uploadedAt: "2025-01-01T00:00:00.000Z",
  url: "",
  downloadUrl: "/api/files/2/download",
  isFavorite: false,
  canManage: false,
  canDownload: true,
};

describe("FileCard", () => {
  it("keeps favorite action available to read-only shared members", () => {
    const onFavoriteToggle = vi.fn();
    render(
      <FileCard
        file={file}
        onFavoriteToggle={onFavoriteToggle}
        onReplace={vi.fn()}
        onDetails={vi.fn()}
        onPreview={vi.fn()}
        onDownload={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add photo.png to favorites" }));
    expect(onFavoriteToggle).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Actions for photo.png" }));
    expect(screen.getByRole("menuitem", { name: "Details" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Download" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Replace" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("opens image preview from keyboard and preserves lazy loading", () => {
    const onPreview = vi.fn();
    render(
      <FileCard
        file={file}
        previewUrl="blob:photo"
        onFavoriteToggle={vi.fn()}
        onReplace={vi.fn()}
        onDetails={vi.fn()}
        onPreview={onPreview}
        onDownload={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const image = screen.getByRole("button", {
      name: "Open full-screen preview of photo.png",
    });
    expect(image.querySelector("img")).toHaveAttribute("loading", "lazy");
    fireEvent.keyDown(image, { key: "Enter" });
    expect(onPreview).toHaveBeenCalledOnce();
  });

  it("does not overlay a blank circle on non-image previews and keeps them clickable", async () => {
    const onPreview = vi.fn();
    const previewFiles = [
      { originalFileName: "report.pdf", contentType: "application/pdf" },
      { originalFileName: "invoice.PDF", contentType: "application/pdf" },
      { originalFileName: "meeting.mp4", contentType: "video/mp4" },
      { originalFileName: "song.mp3", contentType: "audio/mpeg" },
      { originalFileName: "backup.zip", contentType: "application/zip" },
    ];
    const { container } = render(
      <>
        {previewFiles.map(({ originalFileName, contentType }, index) => (
          <FileCard
            key={originalFileName}
            file={{
              ...file,
              id: index + 10,
              originalFileName,
              contentType,
            }}
            onFavoriteToggle={vi.fn()}
            onReplace={vi.fn()}
            onDetails={vi.fn()}
            onPreview={onPreview}
            onDownload={vi.fn()}
            onDelete={vi.fn()}
          />
        ))}
      </>,
    );

    const previewButtons = screen.getAllByRole("button", {
      name: /^Open preview of /,
    });
    expect(previewButtons).toHaveLength(previewFiles.length);
    previewButtons.forEach((button) => expect(button).toBeEmptyDOMElement());

    previewButtons.forEach((button) => fireEvent.click(button));
    await waitFor(() => expect(onPreview).toHaveBeenCalledTimes(previewFiles.length));
    expect(container.querySelectorAll('[aria-label="Loading preview"]')).toHaveLength(0);
  });

  it("loads non-image previews when they intersect and reuses the cached object URL", async () => {
    let intersection: IntersectionObserverCallback | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();
    class ObserverMock {
      constructor(callback: IntersectionObserverCallback) {
        intersection = callback;
      }
      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);
      root = null;
      rootMargin = "120px";
      thresholds = [0];
    }
    vi.stubGlobal("IntersectionObserver", ObserverMock);
    const loadPreview = vi.fn().mockResolvedValue("blob:cached-pdf");
    const onPreview = vi.fn();
    const { unmount } = render(
      <FileCard
        file={{
          ...file,
          originalFileName: "report.pdf",
          contentType: "application/pdf",
        }}
        loadPreview={loadPreview}
        onFavoriteToggle={vi.fn()}
        onReplace={vi.fn()}
        onDetails={vi.fn()}
        onPreview={onPreview}
        onDownload={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(observe).toHaveBeenCalledOnce();
    await act(async () => {
      intersection?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    await waitFor(() => expect(loadPreview).toHaveBeenCalledOnce());
    const previewButton = screen.getByRole("button", {
      name: "Open preview of report.pdf",
    });
    await waitFor(() => expect(previewButton).toBeEnabled());
    fireEvent.click(previewButton);
    await waitFor(() =>
      expect(onPreview).toHaveBeenCalledWith(
        expect.objectContaining({ originalFileName: "report.pdf" }),
        "blob:cached-pdf",
      ),
    );
    expect(loadPreview).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalled();

    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    unmount();
    expect(revoke).not.toHaveBeenCalledWith("blob:cached-pdf");
    vi.unstubAllGlobals();
  });

  it("shows a generic preview for unsupported files and falls back when preview loading fails", async () => {
    const onPreview = vi.fn();
    const unsupported = { ...file, id: 90, originalFileName: "readme.md", contentType: "text/markdown" };
    const loadPreview = vi.fn().mockRejectedValue(new Error("preview failed"));
    render(
      <>
        <FileCard
          file={unsupported}
          onFavoriteToggle={vi.fn()}
          onReplace={vi.fn()}
          onDetails={vi.fn()}
          onPreview={onPreview}
          onDownload={vi.fn()}
          onDelete={vi.fn()}
        />
        <FileCard
          file={{ ...file, id: 91, originalFileName: "document.pdf", contentType: "application/pdf" }}
          loadPreview={loadPreview}
          onFavoriteToggle={vi.fn()}
          onReplace={vi.fn()}
          onDetails={vi.fn()}
          onPreview={onPreview}
          onDownload={vi.fn()}
          onDelete={vi.fn()}
        />
      </>,
    );

    expect(screen.queryByRole("button", { name: "Open preview of readme.md" })).not.toBeInTheDocument();
    expect(screen.getAllByText("MARKDOWN")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Open preview of document.pdf" }));
    await waitFor(() => expect(onPreview).toHaveBeenCalledWith(expect.objectContaining({ id: 91 })));
  });

  it("handles image keyboard Space and selection toggles while honoring focus and disabled state", () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
    const onPreview = vi.fn();
    const onSelectionToggle = vi.fn();
    render(
      <FileCard
        file={file}
        previewUrl="blob:photo"
        selected
        onSelectionToggle={onSelectionToggle}
        selectionDisabled
        focused
        onFavoriteToggle={vi.fn()}
        onReplace={vi.fn()}
        onDetails={vi.fn()}
        onPreview={onPreview}
        onDownload={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Select photo.png" });
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();
    fireEvent.change(checkbox);
    expect(onSelectionToggle).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("button", { name: "Open full-screen preview of photo.png" }), { key: " " });
    expect(onPreview).toHaveBeenCalledWith(file, "blob:photo");
    expect(screen.getByRole("article").className).toContain("!border-[#3787d4]");
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
    delete (HTMLElement.prototype as HTMLElement & { scrollIntoView?: () => void }).scrollIntoView;
  });

  it("falls back to the base preview when preview loading is unavailable and renders unknown types", async () => {
    const onPreview = vi.fn();
    const { rerender } = render(
      <FileCard
        file={{ ...file, originalFileName: "report.pdf", contentType: "application/pdf" }}
        onFavoriteToggle={vi.fn()} onReplace={vi.fn()} onDetails={vi.fn()}
        onPreview={onPreview} onDownload={vi.fn()} onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open preview of report.pdf" }));
    await waitFor(() => expect(onPreview).toHaveBeenCalledWith(expect.objectContaining({ originalFileName: "report.pdf" })));

    rerender(
      <FileCard
        file={{ ...file, originalFileName: "page.html", contentType: "text/html" }}
        onFavoriteToggle={vi.fn()} onReplace={vi.fn()} onDetails={vi.fn()}
        onPreview={onPreview} onDownload={vi.fn()} onDelete={vi.fn()}
      />,
    );
    expect(screen.getAllByText("HTML")).toHaveLength(2);
  });
});
