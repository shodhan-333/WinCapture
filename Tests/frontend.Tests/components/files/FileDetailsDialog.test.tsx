import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FileDetailsDialog } from "../../../../frontend/src/features/files/components/files/FileDetailsDialog";
import type { FileResponse } from "../../../../frontend/src/features/files/types/file";

const file: FileResponse = {
  id: 42,
  originalFileName: "photo.png",
  contentType: "image/png",
  fileSize: 1536,
  uploadedAt: "2025-01-02T00:00:00Z",
  url: "",
  downloadUrl: "",
  isFavorite: false,
  canManage: true,
};

describe("FileDetailsDialog", () => {
  it("shows metadata and closes from the button, Escape, and backdrop", () => {
    const onClose = vi.fn();
    render(<FileDetailsDialog file={file} onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: "photo.png" })).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("2 KB")).toBeInTheDocument();
    expect(screen.getByText("image/png", { exact: false })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Close file details backdrop" }));
    fireEvent.click(screen.getByRole("button", { name: "Close file details" }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
