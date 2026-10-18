import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const preview = vi.hoisted(() => ({ read: vi.fn() }));
const pdf = vi.hoisted(() => ({
  getDocument: vi.fn(),
  workerOptions: {} as Record<string, unknown>,
}));
vi.mock("../../../../frontend/src/features/files/utils/filePreview", () => ({
  readFilePreview: preview.read,
}));
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: pdf.workerOptions,
  getDocument: pdf.getDocument,
}));
vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({
  default: "worker-url",
}));

import { PreviewThumbnail } from "../../../../frontend/src/features/files/components/files/PreviewThumbnail";
import type { FileResponse } from "../../../../frontend/src/features/files/types/file";

const makeFile = (name: string, contentType = "application/octet-stream"): FileResponse => ({
  id: 1,
  originalFileName: name,
  contentType,
  fileSize: 10,
  uploadedAt: "2025-01-01T00:00:00Z",
  url: "/file",
  downloadUrl: "/file/download",
  isFavorite: false,
  canManage: false,
  canDownload: true,
});

describe("PreviewThumbnail", () => {
  beforeEach(() => {
    preview.read.mockReset();
    pdf.getDocument.mockReset();
    pdf.workerOptions.workerSrc = undefined;
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows generic and audio fallbacks when no preview source is available", () => {
    const { rerender } = render(<PreviewThumbnail file={makeFile("notes.txt", "text/plain")} />);
    expect(screen.getByText("PLAIN preview")).toBeInTheDocument();

    rerender(<PreviewThumbnail file={makeFile("track.mp3", "audio/mpeg")} src="blob:audio" />);
    expect(screen.getByText("Audio preview")).toBeInTheDocument();
    expect(preview.read).not.toHaveBeenCalled();
  });

  it("renders rich text and tabular previews after loading", async () => {
    preview.read.mockResolvedValueOnce({
      kind: "text",
      text: "Readable document content",
    });
    const { rerender } = render(<PreviewThumbnail file={makeFile("notes.docx")} src="blob:docx" />);
    expect(screen.getByText(/Loading preview/)).toBeInTheDocument();
    expect(await screen.findByText("Readable document content")).toBeInTheDocument();

    preview.read.mockResolvedValueOnce({
      kind: "table",
      rows: [
        ["Name", "Count"],
        ["Pune", "3"],
      ],
    });
    rerender(<PreviewThumbnail file={makeFile("data.csv")} src="blob:csv" />);
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Pune")).toBeInTheDocument();
  });

  it("limits table rows and cells and applies header styling to the first row", async () => {
    const rows = Array.from({ length: 10 }, (_, row) =>
      Array.from({ length: 7 }, (_, cell) => `${row}-${cell}`),
    );
    preview.read.mockResolvedValue({ kind: "table", rows });
    render(<PreviewThumbnail file={makeFile("large.csv")} src="blob:table" />);
    await screen.findByRole("table");
    expect(screen.getAllByRole("row")).toHaveLength(8);
    expect(screen.getAllByRole("cell")[0]).toHaveTextContent("0-0");
    expect(screen.getAllByRole("cell")).toHaveLength(40);
  });

  it("renders slides and the empty-slide fallback", async () => {
    preview.read.mockResolvedValueOnce({
      kind: "slide",
      width: 100,
      height: 50,
      shapes: [{ text: "Title", x: 10, y: 5, width: 80, height: 20 }],
    });
    const { rerender } = render(
      <PreviewThumbnail file={makeFile("deck.pptx")} src="blob:slides" />,
    );
    expect(await screen.findByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Title")).toHaveStyle({ left: "10%", top: "10%" });

    preview.read.mockResolvedValueOnce({
      kind: "slide",
      width: 100,
      height: 50,
      shapes: [],
    });
    rerender(<PreviewThumbnail file={makeFile("empty.pptx")} src="blob:empty-slides" />);
    expect(await screen.findByText("Slide text unavailable")).toBeInTheDocument();
  });

  it("renders archive counts and handles empty archives", async () => {
    preview.read.mockResolvedValueOnce({
      kind: "archive",
      entries: [{ name: "readme.txt", size: 5, directory: false }],
    });
    const { rerender } = render(<PreviewThumbnail file={makeFile("files.zip")} src="blob:zip" />);
    expect(await screen.findByText("1 entries")).toBeInTheDocument();

    preview.read.mockResolvedValueOnce({ kind: "archive", entries: [] });
    rerender(<PreviewThumbnail file={makeFile("empty.zip")} src="blob:empty" />);
    expect(await screen.findByText("0 entries")).toBeInTheDocument();
  });

  it("shows a fallback when preview parsing fails and ignores results after unmount", async () => {
    preview.read.mockRejectedValueOnce(new Error("unsupported"));
    const { rerender, unmount } = render(
      <PreviewThumbnail file={makeFile("bad.docx")} src="blob:bad" />,
    );
    expect(await screen.findByText("Preview unavailable")).toBeInTheDocument();

    let complete: ((value: { kind: "text"; text: string }) => void) | undefined;
    preview.read.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    rerender(<PreviewThumbnail file={makeFile("slow.docx")} src="blob:slow" />);
    await waitFor(() => expect(complete).toBeDefined());
    unmount();
    complete?.({ kind: "text", text: "late result" });
    await Promise.resolve();
    expect(screen.queryByText("late result")).not.toBeInTheDocument();
  });

  it("renders videos with and without sources and switches to a fallback on media errors", () => {
    const { rerender } = render(<PreviewThumbnail file={makeFile("clip.mp4", "video/mp4")} />);
    expect(screen.getByText("Video")).toBeInTheDocument();
    rerender(<PreviewThumbnail file={makeFile("clip.mp4", "video/mp4")} src="blob:video" />);
    const video = screen.getByLabelText("Video frame preview of clip.mp4");
    expect(video).toHaveAttribute("preload", "auto");
    fireEvent.error(video);
    expect(screen.getByText("Video thumbnail unavailable")).toBeInTheDocument();
  });

  it("handles PDF fetch failures and renders the first page when loading succeeds", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    const failedView = render(<PreviewThumbnail file={makeFile("bad.pdf")} src="blob:bad-pdf" />);
    expect(await screen.findByText("PDF preview unavailable")).toBeInTheDocument();
    failedView.unmount();

    const renderTask = { promise: Promise.resolve(), cancel: vi.fn() };
    const page = {
      getViewport: vi.fn(() => ({ width: 90, height: 120 })),
      render: vi.fn(() => renderTask),
    };
    const document = { getPage: vi.fn().mockResolvedValue(page) };
    const destroy = vi.fn();
    pdf.getDocument.mockReturnValue({
      promise: Promise.resolve(document),
      destroy,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(new Blob(["pdf"]), { status: 200 })),
    );
    const successView = render(
      <PreviewThumbnail file={makeFile("good.pdf")} src="blob:good-pdf" />,
    );

    const canvas = await screen.findByLabelText("First page of PDF");
    await waitFor(() => expect(page.render).toHaveBeenCalledOnce());
    expect(canvas).toHaveProperty("width", 90);
    expect(canvas).toHaveProperty("height", 120);
    expect(pdf.workerOptions.workerSrc).toBe("worker-url");
    expect(page.getViewport).toHaveBeenCalledWith({ scale: 0.45 });
    expect(page.render.mock.calls[0][0]).toMatchObject({ canvas });
    successView.unmount();
    expect(renderTask.cancel).toHaveBeenCalledOnce();
    expect(destroy).toHaveBeenCalledOnce();
  });

  it("does not render a PDF after the thumbnail unmounts during fetch", async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );
    const getDocument = pdf.getDocument;
    const { unmount } = render(
      <PreviewThumbnail file={makeFile("slow.pdf")} src="blob:slow-pdf" />,
    );
    await waitFor(() => expect(resolveFetch).toBeDefined());
    unmount();
    resolveFetch?.(new Response(new Blob(["pdf"]), { status: 200 }));
    await Promise.resolve();
    expect(getDocument).not.toHaveBeenCalled();
  });
});
