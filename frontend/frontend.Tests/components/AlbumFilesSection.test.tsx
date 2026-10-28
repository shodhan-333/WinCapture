import { fireEvent, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { AlbumFilesSection } from "../../src/features/albums/components/AlbumFilesSection";
import type { FileResponse } from "../../src/features/files/types/file";
import { renderWithQueryClient as render } from "../utils/queryTestUtils";

const file = (id: number, canManage: boolean): FileResponse => ({
  id,
  originalFileName: `file-${id}.pdf`,
  contentType: "application/pdf",
  fileSize: 128,
  uploadedAt: "2025-01-01T00:00:00Z",
  url: `/files/${id}`,
  downloadUrl: `/files/${id}/download`,
  isFavorite: false,
  canManage,
});

function renderSection(overrides: Partial<ComponentProps<typeof AlbumFilesSection>> = {}) {
  const callbacks = {
    onCategoryChange: vi.fn(),
    onStartSelection: vi.fn(),
    onCancelSelection: vi.fn(),
    onSelectAll: vi.fn(),
    onBulkAction: vi.fn(),
    onFavoriteToggle: vi.fn(),
    onReplace: vi.fn(),
    onDetails: vi.fn(),
    onPreview: vi.fn(),
    onDownload: vi.fn(),
    onDelete: vi.fn(),
    onSelectionToggle: vi.fn(),
    onUploadFirstFile: vi.fn(),
    onPageChange: vi.fn(),
  };
  render(
    <AlbumFilesSection
      files={[]}
      previewUrls={{}}
      favoritePendingIds={new Set()}
      loadPreview={vi.fn().mockResolvedValue("blob:preview")}
      canManageAlbum
      categoryFilter="All"
      currentPage={1}
      pageCount={1}
      totalFiles={0}
      selectionMode={false}
      selectedIds={new Set()}
      bulkPending={false}
      {...callbacks}
      {...overrides}
    />,
  );
  return callbacks;
}

describe("AlbumFilesSection", () => {
  it("renders the empty album state and lets owners add the first file or change category", () => {
    const callbacks = renderSection();
    expect(screen.getByText("No files in this album")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add your first file" }));
    fireEvent.click(screen.getByRole("button", { name: "Images" }));
    expect(callbacks.onUploadFirstFile).toHaveBeenCalledOnce();
    expect(callbacks.onCategoryChange).toHaveBeenCalledWith("Images");
  });

  it("supports manageable-file selection, bulk actions, and paging", () => {
    const manageable = file(1, true);
    const shared = file(2, false);
    const callbacks = renderSection({
      files: [manageable, shared],
      totalFiles: 2,
      pageCount: 2,
      selectionMode: true,
      selectedIds: new Set([1]),
    });

    fireEvent.click(screen.getByRole("button", { name: "Select all shown" }));
    expect(callbacks.onSelectAll).toHaveBeenCalledWith([1]);
    fireEvent.click(screen.getByRole("button", { name: "Remove from album" }));
    expect(callbacks.onBulkAction).toHaveBeenCalledWith("remove");
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    expect(callbacks.onBulkAction).toHaveBeenCalledWith("delete");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(callbacks.onPageChange).toHaveBeenCalledWith(2);
  });

  it("shows category-specific empty content to read-only viewers without selection controls", () => {
    const callbacks = renderSection({
      canManageAlbum: false,
      categoryFilter: "Images",
      totalFiles: 4,
    });
    expect(screen.getByText("No images found")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add your first file" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Select files" })).not.toBeInTheDocument();
    expect(callbacks.onUploadFirstFile).not.toHaveBeenCalled();
  });
});
