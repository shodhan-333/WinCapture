import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { DashboardAlbumsPanel } from "../../../frontend/src/features/dashboard/components/DashboardAlbumsPanel";
import { DashboardFilesPanel } from "../../../frontend/src/features/dashboard/components/DashboardFilesPanel";
import type { AlbumResponse } from "../../../frontend/src/features/albums/types/album";
import type { DashboardFile } from "../../../frontend/src/features/dashboard/types/dashboard";

const album: AlbumResponse = {
  id: 8,
  albumName: "Coastal trip",
  ownerId: 7,
  ownerName: "Maya Chen",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: null,
};
const file: DashboardFile = {
  id: 21,
  originalFileName: "coast.png",
  contentType: "image/png",
  fileSize: 200,
  uploadedAt: "2025-01-01T00:00:00Z",
  url: "/files/21",
  downloadUrl: "/files/21/download",
  isFavorite: false,
  canManage: true,
  uploadedBy: 7,
  uploaderName: "Maya Chen",
  albumId: null,
  albumName: null,
};

function withRouter(children: ReactNode) {
  function Location() {
    const location = useLocation();
    return <output data-testid="path">{location.pathname + location.search}</output>;
  }
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes><Route path="*" element={children} /></Routes>
      <Location />
    </MemoryRouter>,
  );
}

const albumProps = (overrides: Partial<ComponentProps<typeof DashboardAlbumsPanel>> = {}) => ({
  albums: [album], coverUrls: {}, contentScope: "mine" as const, canViewAllContent: false,
  albumCount: 1, search: "", page: 1, pageCount: 1,
  onSearchChange: vi.fn(), onPageChange: vi.fn(), onDelete: vi.fn(), ...overrides,
});
const fileProps = (overrides: Partial<ComponentProps<typeof DashboardFilesPanel>> = {}) => ({
  files: [file], previewUrls: {}, contentScope: "mine" as const, canViewAllContent: false,
  fileCount: 1, search: "", page: 1, pageCount: 1,
  onSearchChange: vi.fn(), onPageChange: vi.fn(), onPreview: vi.fn(), onDelete: vi.fn(), ...overrides,
});

describe("dashboard panels", () => {
  it("renders album empty states and admin management controls", () => {
    withRouter(<DashboardAlbumsPanel {...albumProps({ albums: [], contentScope: "all", canViewAllContent: true })} />);
    expect(screen.getByText("No albums found")).toBeInTheDocument();
    expect(screen.getByText("No users have created an album yet.")).toBeInTheDocument();
    cleanup();

    const onDelete = vi.fn();
    withRouter(<DashboardAlbumsPanel {...albumProps({ contentScope: "all", canViewAllContent: true, albumCount: 1, onDelete })} />);
    expect(screen.getByText("Owner: Maya Chen (#7)")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Search all albums" }), { target: { value: "coast" } });
    fireEvent.click(screen.getByRole("button", { name: "Manage album Coastal trip" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/albums/8");
    fireEvent.click(screen.getByRole("button", { name: "Delete album Coastal trip" }));
    expect(onDelete).toHaveBeenCalledWith(album);
    cleanup();
  });

  it("renders personal file previews and admin file metadata, actions, and search", () => {
    const onPreview = vi.fn();
    withRouter(<DashboardFilesPanel {...fileProps({ onPreview })} />);
    fireEvent.click(screen.getByRole("button", { name: "Preview coast.png" }));
    expect(onPreview).toHaveBeenCalledWith(file);
    fireEvent.click(screen.getByRole("button", { name: /^coast\.png/ }));
    expect(screen.getByTestId("path")).toHaveTextContent("/files?fileId=21&search=coast.png");
    cleanup();

    const onDelete = vi.fn();
    withRouter(<DashboardFilesPanel {...fileProps({
      contentScope: "all", canViewAllContent: true, previewUrls: { 21: "blob:cover" },
      files: [{ ...file, albumId: 9, albumName: "Trip" }], onDelete,
    })} />);
    expect(screen.getByText(/Uploaded by: Maya Chen \(#7\).*Album: Trip \(#9\)/)).toBeInTheDocument();
    expect(document.querySelector('img[src="blob:cover"]')).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Search all files" }), { target: { value: "trip" } });
    fireEvent.click(screen.getByRole("button", { name: "Manage file coast.png" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/files?scope=all&fileId=21&search=coast.png");
    fireEvent.click(screen.getByRole("button", { name: "Delete file coast.png" }));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 21, albumId: 9 }));
    cleanup();
  });

  it("shows the distinct personal file empty state", () => {
    withRouter(<DashboardFilesPanel {...fileProps({ files: [] })} />);
    expect(screen.getByText("No files uploaded yet")).toBeInTheDocument();
    expect(screen.getByText("Upload a file to see it appear in your library.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open files" })).toHaveAttribute("href", "/files");
  });
});
