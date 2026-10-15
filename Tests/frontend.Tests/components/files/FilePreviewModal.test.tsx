import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import JSZip from "jszip";
import FilePreviewModal from "../../../../frontend/src/components/files/FilePreviewModal";
import type { FileResponse } from "../../../../frontend/src/types/file";

const makeFile = (name: string, contentType: string): FileResponse => ({
  id: 2, originalFileName: name, contentType, fileSize: 200,
  uploadedAt: "2025-01-01T00:00:00.000Z", url: "", downloadUrl: "/api/files/2/download",
  isFavorite: false, canManage: false,
});

describe("FilePreviewModal", () => {
  it("shows a readable browser PDF preview", () => {
    render(<FilePreviewModal file={makeFile("report.pdf", "application/pdf")} src="blob:pdf" onClose={vi.fn()} />);
    expect(screen.getByTitle("PDF preview: report.pdf")).toHaveAttribute("src", "blob:pdf");
  });

  it("provides controlled video playback and a codec failure message", () => {
    render(<FilePreviewModal file={makeFile("clip.webm", "video/webm")} src="blob:video" onClose={vi.fn()} />);
    const video = screen.getByLabelText("Video preview: clip.webm");
    expect(video).toHaveAttribute("controls");
    fireEvent.error(video);
    expect(screen.getByText(/codec may not be supported/i)).toBeInTheDocument();
  });

  it.each(["song.mp3", "song.wav", "song.m4a"])("provides audio controls for %s", (name) => {
    render(<FilePreviewModal file={makeFile(name, "audio/mpeg")} src="blob:audio" onClose={vi.fn()} />);
    expect(screen.getByLabelText(`Audio preview: ${name}`)).toHaveAttribute("controls");
  });

  it("lists ZIP names and sizes without extracting archive content", async () => {
    const zip = new JSZip();
    zip.file("docs/readme.txt", "hello");
    const buffer = await zip.generateAsync({ type: "arraybuffer" });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => buffer })));
    render(<FilePreviewModal file={makeFile("bundle.zip", "application/zip")} src="blob:zip" onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("docs/readme.txt")).toBeInTheDocument());
    expect(screen.getByText("5 B")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
