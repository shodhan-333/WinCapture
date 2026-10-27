import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FileCardGrid } from "../../../frontend/src/features/files/components/files/FileCardGrid";
import type { FileResponse } from "../../../frontend/src/features/files/types/file";
import { renderWithQueryClient as render } from "../utils/queryTestUtils";

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
  canDownload: false,
});

describe("FileCardGrid", () => {
  it("renders the empty state without file cards", () => {
    render(
      <FileCardGrid
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
      />,
    );

    expect(screen.getByText("No matching files")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("routes card actions with the associated file and per-file management scope", () => {
    const onDownload = vi.fn();
    const onDelete = vi.fn();
    const files = [file(1), file(2)];
    render(
      <FileCardGrid
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
      />,
    );

    expect(screen.getByRole("button", { name: "Add file-1.pdf to favorites" })).toBeDisabled();
    const actionButtons = screen.getAllByRole("button", { name: /Actions for/ });
    fireEvent.click(actionButtons[0]!);
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(actionButtons[1]!);
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(files[1]!);
  });

  it("applies selectable and ineligible file rules and the focused file id", () => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
    const files = [file(3), file(4)];
    const onSelectionToggle = vi.fn();
    render(
      <FileCardGrid
        files={files}
        previewUrls={{}}
        favoritePendingIds={new Set()}
        onFavoriteToggle={vi.fn()}
        onReplace={vi.fn()}
        onDetails={vi.fn()}
        onPreview={vi.fn()}
        onDownload={vi.fn()}
        onDelete={vi.fn()}
        selectionMode
        selectedIds={new Set([3])}
        onSelectionToggle={onSelectionToggle}
        selectionEligible={(item) => item.id === 3}
        selectionDisabled={false}
        focusedFileId={4}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "Select file-3.pdf" })).toBeChecked();
    expect(screen.queryByRole("checkbox", { name: "Select file-4.pdf" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select file-3.pdf" }));
    expect(onSelectionToggle).toHaveBeenCalledWith(files[0]);
    expect(screen.getAllByRole("article")[1]).toHaveClass("!border-[#3787d4]");
    delete (HTMLElement.prototype as HTMLElement & { scrollIntoView?: () => void }).scrollIntoView;
  });
});
