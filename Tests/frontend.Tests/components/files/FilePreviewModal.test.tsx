import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const readPreview = vi.hoisted(() => vi.fn());
vi.mock("../../../../frontend/src/features/files/utils/filePreview", () => ({
  readFilePreview: readPreview,
}));

import { FilePreviewModal } from "../../../../frontend/src/features/files/components/files/FilePreviewModal";
import type { FileResponse } from "../../../../frontend/src/features/files/types/file";

const makeFile = (name: string): FileResponse => ({
  id: 6,
  originalFileName: name,
  contentType: "application/octet-stream",
  fileSize: 128,
  uploadedAt: "2025-01-01T00:00:00Z",
  url: "/file",
  downloadUrl: "/file/download",
  isFavorite: false,
  canManage: true,
  canDownload: true,
});

describe("FilePreviewModal", () => {
  beforeEach(() => readPreview.mockReset());

  it("renders image, PDF, and unavailable-source previews and closes by button, backdrop, or Escape", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <FilePreviewModal file={makeFile("photo.png")} src="blob:image" onClose={onClose} />,
    );
    expect(screen.getByRole("img", { name: "photo.png" })).toHaveAttribute("src", "blob:image");
    fireEvent.click(screen.getByRole("button", { name: "Close file preview" }));
    expect(onClose).toHaveBeenCalledOnce();

    rerender(<FilePreviewModal file={makeFile("report.pdf")} src="blob:pdf" onClose={onClose} />);
    expect(screen.getByTitle("PDF preview: report.pdf")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(<FilePreviewModal file={makeFile("report.pdf")} onClose={onClose} />);
    expect(screen.getByRole("status")).toHaveTextContent("You can download the file instead.");
    fireEvent.click(screen.getByRole("button", { name: "Close file preview backdrop" }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("renders video and audio fallback states, duration, and media errors", () => {
    const { rerender } = render(
      <FilePreviewModal file={makeFile("clip.mp4")} src="blob:video" onClose={vi.fn()} />,
    );
    const video = screen.getByLabelText("Video preview: clip.mp4");
    fireEvent.error(video);
    expect(screen.getByRole("status")).toHaveTextContent("This video could not be played");

    rerender(<FilePreviewModal file={makeFile("song.mp3")} src="blob:audio" onClose={vi.fn()} />);
    const audio = screen.getByLabelText("Audio preview: song.mp3");
    Object.defineProperty(audio, "duration", {
      configurable: true,
      value: 125,
    });
    fireEvent.loadedMetadata(audio);
    expect(screen.getByText("Duration 2:05")).toBeInTheDocument();
    fireEvent.error(audio);
    expect(screen.getByRole("status")).toHaveTextContent("Audio could not be played");
  });

  it("uses the audio duration placeholder for non-finite metadata", () => {
    render(<FilePreviewModal file={makeFile("unknown-duration.mp3")} src="blob:audio" onClose={vi.fn()} />);
    const audio = screen.getByLabelText("Audio preview: unknown-duration.mp3");
    Object.defineProperty(audio, "duration", { configurable: true, value: Number.POSITIVE_INFINITY });
    fireEvent.loadedMetadata(audio);
    expect(screen.getByText("Duration loads when playback is ready")).toBeInTheDocument();
  });

  it("renders text, tables, slides, and archives and handles parser errors", async () => {
    readPreview.mockResolvedValueOnce({
      kind: "text",
      text: "Initial preview",
    });
    const { rerender } = render(
      <FilePreviewModal file={makeFile("notes.txt")} src="blob:text" onClose={vi.fn()} />,
    );
    expect(await screen.findByText("Initial preview")).toBeInTheDocument();
    readPreview.mockResolvedValueOnce({ kind: "text", text: "" });
    rerender(
      <FilePreviewModal file={makeFile("empty.txt")} src="blob:empty-text" onClose={vi.fn()} />,
    );
    expect(await screen.findByText("This file is empty.")).toBeInTheDocument();

    readPreview.mockResolvedValueOnce({
      kind: "table",
      rows: [["value"]],
    });
    rerender(<FilePreviewModal file={makeFile("sales.csv")} src="blob:table" onClose={vi.fn()} />);
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.getByText("value")).toBeInTheDocument();

    readPreview.mockResolvedValueOnce({
      kind: "slide",
      width: 100,
      height: 100,
      shapes: [],
    });
    rerender(<FilePreviewModal file={makeFile("deck.pptx")} src="blob:slide" onClose={vi.fn()} />);
    expect(
      await screen.findByText("This slide has no extractable text content."),
    ).toBeInTheDocument();

    readPreview.mockResolvedValueOnce({
      kind: "archive",
      entries: [
        { name: "folder/", directory: true },
        { name: "readme", size: 1024, directory: false },
        { name: "unknown.bin", directory: false },
      ],
    });
    rerender(
      <FilePreviewModal file={makeFile("files.zip")} src="blob:archive" onClose={vi.fn()} />,
    );
    expect(await screen.findByText("Archive contents")).toBeInTheDocument();
    expect(screen.getByText("Folder")).toBeInTheDocument();
    expect(screen.getByText("1.0 KB")).toBeInTheDocument();
    expect(screen.getByText("Size unavailable")).toBeInTheDocument();

    readPreview.mockResolvedValueOnce({
      kind: "archive",
      entries: Array.from({ length: 2000 }, (_, index) => ({ name: index === 0 ? "" : `file-${index}`, size: 0, directory: index === 0 })),
    });
    rerender(<FilePreviewModal file={makeFile("many.zip")} src="blob:many" onClose={vi.fn()} />);
    expect(await screen.findByText("(2000+ entries)")).toBeInTheDocument();
    expect(screen.getByText("FOLDER")).toBeInTheDocument();

    readPreview.mockRejectedValueOnce(new Error("corrupt archive"));
    rerender(<FilePreviewModal file={makeFile("bad.docx")} src="blob:bad" onClose={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("corrupt archive");
  }, 30000);
});
