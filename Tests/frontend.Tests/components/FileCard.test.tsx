import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import FileCard from "../../../frontend/src/components/FileCard";
import type { FileResponse } from "../../../frontend/src/types/file";

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

    const image = screen.getByRole("button", { name: "Open full-screen preview of photo.png" });
    expect(image).toHaveAttribute("loading", "lazy");
    fireEvent.keyDown(image, { key: "Enter" });
    expect(onPreview).toHaveBeenCalledOnce();
  });
});
