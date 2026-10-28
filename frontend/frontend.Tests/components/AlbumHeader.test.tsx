import { createRef, type ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AlbumHeader } from "../../src/features/albums/components/AlbumHeader";
import type { AlbumResponse } from "../../src/features/albums/types/album";
import type { FileResponse } from "../../src/features/files/types/file";

const album: AlbumResponse = {
  id: 3, albumName: "Trip", ownerId: 1, ownerName: "Maya",
  createdAt: "2025-01-01T00:00:00Z", updatedAt: null,
};
const cover: FileResponse = {
  id: 4, originalFileName: "cover.png", contentType: "image/png", fileSize: 1,
  uploadedAt: "2025-01-01T00:00:00Z", url: "", downloadUrl: "", isFavorite: false,
  canManage: true,
};

function props(overrides: Partial<ComponentProps<typeof AlbumHeader>> = {}) {
  return {
    album, totalFiles: 0, canManageAlbum: true, editingName: false,
    albumNameDraft: album.albumName, uploading: false, deletingAlbum: false,
    albumNameInputRef: createRef<HTMLInputElement>(), replaceInputRef: createRef<HTMLInputElement>(),
    onNameDraftChange: vi.fn(), onSaveName: vi.fn(), onCancelEditing: vi.fn(),
    onEditName: vi.fn(), onUpload: vi.fn(), onDelete: vi.fn(), onReplaceChange: vi.fn(),
    ...overrides,
  };
}

describe("AlbumHeader", () => {
  it("shows cover and update metadata and wires the editable header controls", () => {
    const handlers = props({ albumCoverPreview: cover, coverUrl: "blob:cover", album: { ...album, updatedAt: "2025-02-01T00:00:00Z" }, editingName: true });
    render(<AlbumHeader {...handlers} />);
    expect(document.querySelector('img[src="blob:cover"]')).toBeInTheDocument();
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Album name"), { target: { value: "New trip" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(handlers.onNameDraftChange).toHaveBeenCalledWith("New trip");
    expect(handlers.onSaveName).toHaveBeenCalledOnce();
    expect(handlers.onCancelEditing).toHaveBeenCalledOnce();
  });

  it("hides management actions from viewers and disables owner actions while busy", () => {
    const viewer = props({ canManageAlbum: false, editingName: false });
    const { rerender } = render(<AlbumHeader {...viewer} />);
    expect(screen.getByText("Trip")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit album name" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add files" })).not.toBeInTheDocument();

    const busy = props({ uploading: true, deletingAlbum: true });
    rerender(<AlbumHeader {...busy} />);
    expect(screen.getByRole("button", { name: "Adding..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete album" })).toBeDisabled();
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [] } });
    expect(busy.onReplaceChange).toHaveBeenCalledOnce();
  });
});
