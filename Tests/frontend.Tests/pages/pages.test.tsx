import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Dashboard from "../../../frontend/src/pages/Dashboard";
import AlbumsPage from "../../../frontend/src/pages/AlbumsPage";
import FilesPage from "../../../frontend/src/pages/FilesPage";
import AdminPage from "../../../frontend/src/pages/AdminPage";
import AlbumDetailPage from "../../../frontend/src/pages/AlbumDetailPage";
import type { AlbumResponse } from "../../../frontend/src/types/album";
import type { FileResponse, AdminFileResponse } from "../../../frontend/src/types/file";

const state = vi.hoisted(() => ({
  api: {
    getMyAlbums: vi.fn(), getFiles: vi.fn(), getFilePreviewUrl: vi.fn(),
    getAlbums: vi.fn(), createAlbum: vi.fn(), getFavorites: vi.fn(),
    getMyAdminAlbums: vi.fn(), getMyAdminFiles: vi.fn(), getAdminAlbums: vi.fn(), getAdminFiles: vi.fn(),
    deleteAlbum: vi.fn(), deleteFile: vi.fn(), getAlbum: vi.fn(), getAlbumFiles: vi.fn(), getAlbumMembers: vi.fn(),
    getFile: vi.fn(), uploadFile: vi.fn(), replaceFile: vi.fn(), downloadFileByPath: vi.fn(),
    updateAlbum: vi.fn(), addAlbumMember: vi.fn(), updateAlbumMember: vi.fn(), removeAlbumMember: vi.fn(),
    downloadAlbumFile: vi.fn(), deleteAlbumFile: vi.fn(), uploadAlbumFile: vi.fn(), replaceAlbumFile: vi.fn(),
    getAlbumFile: vi.fn(), getFilePreviewUrlByPath: vi.fn(),
  },
  user: { userId: 7, name: "Maya Chen", email: "maya@example.test", role: "User", authenticationType: "Microsoft Entra ID" },
  account: { homeAccountId: "home-1" },
  instance: {},
}));

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ instance: state.instance as IPublicClientApplication }),
}));
vi.mock("../../../frontend/src/context/AuthContext", () => ({
  useAuth: () => ({ account: state.account as AccountInfo, user: state.user }),
}));
vi.mock("../../../frontend/src/api/apiClient", () => state.api);
vi.mock("../../../frontend/src/hooks/useFilePreviews", () => ({
  default: () => ({ previewUrls: {}, loading: false }),
}));
vi.mock("../../../frontend/src/hooks/useAlbumCoverPreviews", () => ({ default: () => ({}) }));

const album: AlbumResponse = {
  id: 7,
  albumName: "Coastal trip",
  ownerId: 7,
  ownerName: "Maya Chen",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: null,
};
const file: FileResponse = {
  id: 21,
  originalFileName: "coast.pdf",
  contentType: "application/pdf",
  fileSize: 1024,
  uploadedAt: "2025-01-01T00:00:00Z",
  url: "/api/files/21",
  downloadUrl: "/api/files/21/download",
  isFavorite: false,
  canManage: true,
};
const adminFile: AdminFileResponse = {
  id: 31,
  originalFileName: "admin.pdf",
  contentType: "application/pdf",
  fileSize: 1024,
  uploadedAt: "2025-01-01T00:00:00Z",
  uploadedBy: 7,
  uploaderName: "Maya Chen",
  albumId: null,
  albumName: null,
};
const instance = {} as IPublicClientApplication;
const account = state.account as AccountInfo;

function renderPage(ui: ReactNode, initialPath = "/") {
  function CurrentPath() {
    const { pathname } = useLocation();
    return <output data-testid="current-path">{pathname}</output>;
  }
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/albums/:albumId" element={ui} />
        <Route path="*" element={ui} />
      </Routes>
      <CurrentPath />
    </MemoryRouter>,
  );
}

describe("page workflows", () => {
  beforeEach(() => {
    state.user = { userId: 7, name: "Maya Chen", email: "maya@example.test", role: "User", authenticationType: "Microsoft Entra ID" };
    state.account = account;
    for (const mock of Object.values(state.api)) mock.mockReset().mockResolvedValue([]);
    state.api.getAlbum.mockResolvedValue(album);
    state.api.createAlbum.mockResolvedValue(album);
    state.api.getMyAlbums.mockResolvedValue([]);
    state.api.getFiles.mockResolvedValue([]);
    state.api.getAlbums.mockResolvedValue([]);
    state.api.getAlbumFiles.mockResolvedValue([]);
    state.api.getAlbumMembers.mockResolvedValue([]);
  });

  it("loads administrator-scoped dashboard data and navigates to albums", async () => {
    renderPage(<Dashboard />);

    expect(await screen.findByText("Welcome back,")).toBeInTheDocument();
    expect(state.api.getMyAlbums).toHaveBeenCalledWith(expect.anything(), account);
    expect(state.api.getFiles).toHaveBeenCalledWith(expect.anything(), account);
    fireEvent.click(screen.getByRole("button", { name: /Browse albums/ }));
    expect(screen.getByTestId("current-path")).toHaveTextContent("/albums");
  });

  it("validates and creates albums using a trimmed name", async () => {
    renderPage(<AlbumsPage />);
    expect(await screen.findByRole("heading", { name: "No albums available" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New album" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Album name is required.");

    fireEvent.change(screen.getByLabelText("New album name"), { target: { value: "  Coastal trip  " } });
    fireEvent.click(screen.getByRole("button", { name: "New album" }));
    await waitFor(() => expect(state.api.createAlbum).toHaveBeenCalledWith(expect.anything(), account, { albumName: "Coastal trip" }));
    await waitFor(() => expect(screen.getByTestId("current-path")).toHaveTextContent("/albums/7"));
  });

  it("loads files, searches the current list, and requests favorites on view change", async () => {
    state.api.getFiles.mockResolvedValue([file]);
    state.api.getFavorites.mockResolvedValue([{ ...file, isFavorite: true }]);
    renderPage(<FilesPage />);

    expect(await screen.findByRole("heading", { name: "Files" })).toBeInTheDocument();
    expect(screen.getByText("coast.pdf")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search files by name, type, or ID" }), {
      target: { value: "missing" },
    });
    expect(screen.getByText("No files match your search")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Favorites" }));
    expect(await screen.findByRole("heading", { name: "Favorites" })).toBeInTheDocument();
    expect(state.api.getFavorites).toHaveBeenCalledWith(expect.anything(), account);
  });

  it("keeps admin personal scope by default and loads broader data only after selection", async () => {
    state.user = { ...state.user, role: "Admin" };
    state.api.getMyAdminFiles.mockResolvedValue([adminFile]);
    renderPage(<AdminPage />);

    expect(await screen.findByText("System overview")).toBeInTheDocument();
    expect(state.api.getMyAdminAlbums).toHaveBeenCalled();
    expect(state.api.getMyAdminFiles).toHaveBeenCalled();
    expect(state.api.getAdminAlbums).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "My Content" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All Content" }));
    await waitFor(() => expect(state.api.getAdminAlbums).toHaveBeenCalled());
    expect(state.api.getAdminFiles).toHaveBeenCalled();
  });

  it("loads owner album files and member settings", async () => {
    state.api.getAlbumFiles.mockResolvedValue([file]);
    renderPage(<AlbumDetailPage />, "/albums/7");

    expect(await screen.findByRole("heading", { name: "Coastal trip" })).toBeInTheDocument();
    expect(state.api.getAlbum).toHaveBeenCalledWith(expect.anything(), account, 7);
    expect(state.api.getAlbumFiles).toHaveBeenCalledWith(expect.anything(), account, 7);
    expect(state.api.getAlbumMembers).toHaveBeenCalledWith(expect.anything(), account, 7);
  });

  it("does not request sharing management data for a shared viewer", async () => {
    state.user = { ...state.user, userId: 44 };
    renderPage(<AlbumDetailPage />, "/albums/7");

    expect(await screen.findByText("Shared album")).toBeInTheDocument();
    expect(state.api.getAlbumMembers).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Edit album name" })).not.toBeInTheDocument();
  });
});
