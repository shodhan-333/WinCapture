import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import FileCardGrid from "../../../frontend/src/components/files/FileCardGrid";
import type { FileResponse } from "../../../frontend/src/types/file";

const file = (id: number): FileResponse => ({
  id,
  originalFileName: `file-${id}.pdf`,
  contentType: "application/pdf",
  fileSize: 500,
  uploadedAt: "2025-01-01T00:00:00Z",
  url: `/api/files/${id}`,
  downloadUrl: `/api/files/${id}/download`,
  isFavorite: false,
  canManage: false,
});

describe("FileCardGrid", () => {
  it("renders the empty state without file cards", () => {
    render(<FileCardGrid
      files={[]}
      previewUrls={{}}
      favoritePendingIds={new Set()}
      onFavoriteToggle={vi.fn()}
      onReplace={vi.fn()}
      onDetails={vi.fn()}
      onPreview={vi.fn()}
      onDownload={vi.fn()}
      onDelete={vi.fn()}
      empty={<p>No matching files</p>}
    />);

    expect(screen.getByText("No matching files")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("routes card actions with the associated file and per-file management scope", () => {
    const onDownload = vi.fn();
    const onDelete = vi.fn();
    const files = [file(1), file(2)];
    render(<FileCardGrid
      files={files}
      previewUrls={{}}
      favoritePendingIds={new Set([1])}
      canManage={(item) => item.id === 2}
      onFavoriteToggle={vi.fn()}
      onReplace={vi.fn()}
      onDetails={vi.fn()}
      onPreview={vi.fn()}
      onDownload={onDownload}
      onDelete={onDelete}
    />);

    expect(screen.getByRole("button", { name: "Add file-1.pdf to favorites" })).toBeDisabled();
    fireEvent.click(screen.getAllByRole("button", { name: /Actions for/ })[0]);
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getAllByRole("button", { name: /Actions for/ })[1]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(files[1]);
  });
});
