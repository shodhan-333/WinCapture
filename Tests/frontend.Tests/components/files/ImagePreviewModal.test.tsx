import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ImagePreviewModal from "../../../../frontend/src/components/files/ImagePreviewModal";
import type { FileResponse } from "../../../../frontend/src/types/file";

const file: FileResponse = {
  id: 2,
  originalFileName: "private-photo.png",
  contentType: "image/png",
  fileSize: 200,
  uploadedAt: "2025-01-01T00:00:00.000Z",
  url: "",
  downloadUrl: "/api/files/2/download",
  isFavorite: false,
  canManage: false,
};

describe("ImagePreviewModal", () => {
  it("exposes an accessible image dialog and closes on Escape", () => {
    const onClose = vi.fn();
    render(<ImagePreviewModal file={file} src="blob:photo" onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: "Preview private-photo.png" }))
      .toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("img", { name: "private-photo.png" }))
      .toHaveAttribute("src", "blob:photo");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes from the backdrop and keeps clicks inside the dialog open", () => {
    const onClose = vi.fn();
    render(<ImagePreviewModal file={file} onClose={onClose} />);
    const dialog = screen.getByRole("dialog", { name: "Preview private-photo.png" });

    fireEvent.mouseDown(screen.getByText("Preview unavailable"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.mouseDown(dialog);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
