import { act, fireEvent, render as testingLibraryRender, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Dashboard } from "../../../frontend/src/features/dashboard/pages/Dashboard";
import { AlbumsPage } from "../../../frontend/src/features/albums/pages/AlbumsPage";
import { FilesPage } from "../../../frontend/src/features/files/pages/FilesPage";
import { AlbumDetailPage } from "../../../frontend/src/features/albums/pages/AlbumDetailPage";
import { Layout } from "../../../frontend/src/app/components/Layout";
import type { AlbumResponse } from "../../../frontend/src/features/albums/types/album";
import { ApiError } from "../../../frontend/src/shared/types/api";
import type {
  FileResponse,
  AdminFileResponse,
} from "../../../frontend/src/features/files/types/file";

const state = vi.hoisted(() => ({
  api: {
    getMyAlbums: vi.fn(),
    getFiles: vi.fn(),
    getFilePreviewUrl: vi.fn(),
    getAlbums: vi.fn(),
    getSharedAlbums: vi.fn(),
    createAlbum: vi.fn(),
    getFavorites: vi.fn(),
    getMyAdminAlbums: vi.fn(),
    getMyAdminFiles: vi.fn(),
    getAdminAlbums: vi.fn(),
    getAdminFiles: vi.fn(),
    deleteAlbum: vi.fn(),
    deleteFile: vi.fn(),
    getAlbum: vi.fn(),
    getAlbumFiles: vi.fn(),
    getAlbumMembers: vi.fn(),
    getFile: vi.fn(),
    uploadFile: vi.fn(),
    replaceFile: vi.fn(),
    downloadFileByPath: vi.fn(),
    updateAlbum: vi.fn(),
    addAlbumMember: vi.fn(),
    updateAlbumMember: vi.fn(),
    removeAlbumMember: vi.fn(),
    downloadAlbumFile: vi.fn(),
    deleteAlbumFile: vi.fn(),
    uploadAlbumFile: vi.fn(),
    replaceAlbumFile: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    removeAlbumFileAssociation: vi.fn(),
    getAlbumFile: vi.fn(),
    getFilePreviewUrlByPath: vi.fn(),
  },
  user: {
    userId: 7,
    name: "Maya Chen",
    email: "maya@example.test",
    role: "User",
    authenticationType: "Microsoft Entra ID",
  },
  logout: vi.fn(),
  account: { homeAccountId: "home-1" },
  instance: {},
  previewLoading: false,
  trackPreviewEffects: false,
  previewEffectCalls: 0,
}));

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ instance: state.instance as IPublicClientApplication }),
}));
vi.mock("../../../frontend/src/features/auth/AuthContext", () => ({
  useAuth: () => ({
    account: state.account as AccountInfo,
    user: state.user,
    logout: state.logout,
  }),
}));
vi.mock("../../../frontend/src/features/albums/api/albumsApi", () => state.api);
vi.mock("../../../frontend/src/features/files/api/filesApi", () => state.api);
vi.mock("../../../frontend/src/shared/api/previews", () => ({
  getFilePreviewUrlByPath: state.api.getFilePreviewUrlByPath,
}));
vi.mock("../../../frontend/src/features/files/hooks/useFilePreviews", () => ({
  useFilePreviews: function MockUseFilePreviews(files: unknown[]) {
    const [, setRevision] = useState(0);
    useEffect(() => {
      if (state.trackPreviewEffects) {
        state.previewEffectCalls += 1;
        setRevision((revision) => revision + 1);
      }
    }, [files]);
    return { previewUrls: {}, loading: state.previewLoading };
  },
}));
vi.mock("../../../frontend/src/features/albums/hooks/useAlbumCoverPreviews", () => ({
  useAlbumCoverPreviews: () => ({}),
}));

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
const account = state.account as AccountInfo;
function render(ui: ReactNode, options?: Parameters<typeof testingLibraryRender>[1]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return testingLibraryRender(ui, { ...options, wrapper: QueryWrapper });
}
const paged = <T,>(items: T[] = []) => ({
  items,
  totalItems: items.length,
  page: 1,
  pageSize: 10,
  pageCount: 1,
});

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
    state.previewLoading = false;
    state.trackPreviewEffects = false;
    state.previewEffectCalls = 0;
    state.user = {
      userId: 7,
      name: "Maya Chen",
      email: "maya@example.test",
      role: "User",
      authenticationType: "Microsoft Entra ID",
    };
    state.account = account;
    state.logout.mockReset().mockResolvedValue(undefined);
    for (const mock of Object.values(state.api)) mock.mockReset().mockResolvedValue([]);
    state.api.getAlbum.mockResolvedValue(album);
    state.api.createAlbum.mockResolvedValue(album);
    state.api.getMyAlbums.mockResolvedValue(paged());
    state.api.getFiles.mockResolvedValue(paged());
    state.api.getAlbums.mockResolvedValue(paged());
    state.api.getSharedAlbums.mockResolvedValue(paged());
    state.api.getAlbumFiles.mockResolvedValue(paged());
    state.api.getAlbumMembers.mockResolvedValue([]);
  });

  it("loads administrator-scoped dashboard data and navigates to albums", async () => {
    renderPage(<Dashboard />);

    expect(await screen.findByText("Welcome back,")).toBeInTheDocument();
    expect(state.api.getMyAlbums).toHaveBeenCalledWith(expect.anything(), account, 1, 4);
    expect(state.api.getFiles).toHaveBeenCalledWith(expect.anything(), account, 1, 4);
    fireEvent.click(screen.getByRole("link", { name: "Browse albums" }));
    expect(screen.getByTestId("current-path")).toHaveTextContent("/albums");
  });

  it("validates and creates albums using a trimmed name", async () => {
    renderPage(<AlbumsPage />);
    expect(await screen.findByRole("heading", { name: "No albums available" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New album" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Album name is required.");

    fireEvent.change(screen.getByLabelText("New album name"), {
      target: { value: "  Coastal trip  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "New album" }));
    await waitFor(() =>
      expect(state.api.createAlbum).toHaveBeenCalledWith(expect.anything(), account, {
        albumName: "Coastal trip",
      }),
    );
    await waitFor(() => expect(screen.getByTestId("current-path")).toHaveTextContent("/albums/7"));
  });

  it("filters albums by ownership and searches the selected result set", async () => {
    state.api.getSharedAlbums.mockResolvedValue(
      paged([
        {
          ...album,
          id: 8,
          albumName: "Shared coast",
          ownerId: 9,
          ownerName: "Alex Owner",
        },
      ]),
    );
    renderPage(<AlbumsPage />);

    await screen.findByRole("heading", { name: "Albums" });
    await screen.findByRole("heading", { name: "No albums available" });
    fireEvent.click(screen.getByRole("button", { name: "Shared with me" }));
    await waitFor(() =>
      expect(state.api.getSharedAlbums).toHaveBeenCalledWith(expect.anything(), account, 1, 9, "", expect.any(AbortSignal)),
    );
    expect(await screen.findByText("Shared coast")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Search albums" }), {
      target: { value: "coast" },
    });
    await waitFor(() =>
      expect(state.api.getSharedAlbums).toHaveBeenCalledWith(
        expect.anything(),
        account,
        1,
        9,
        "coast",
        expect.any(AbortSignal),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "My albums" }));
    await waitFor(() =>
      expect(state.api.getMyAlbums).toHaveBeenCalledWith(expect.anything(), account, 1, 9, "coast", expect.any(AbortSignal)),
    );
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    await waitFor(() =>
      expect(state.api.getAlbums).toHaveBeenCalledWith(expect.anything(), account, 1, 9, "coast", expect.any(AbortSignal)),
    );
  });

  it("falls back to accessible albums when the deployed API lacks the shared-albums route", async () => {
    const sharedAlbum = {
      ...album,
      id: 8,
      albumName: "Shared coast",
      ownerId: 9,
      ownerName: "Alex Owner",
    };
    state.api.getSharedAlbums.mockRejectedValue(new ApiError("Not found", 404));
    state.api.getAlbums.mockResolvedValue(paged([album, sharedAlbum]));

    renderPage(<AlbumsPage />);
    await screen.findByText("Coastal trip");
    fireEvent.click(screen.getByRole("button", { name: "Shared with me" }));

    expect(await screen.findByText("Shared coast")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Coastal trip")).not.toBeInTheDocument());
    expect(state.api.getAlbums).toHaveBeenLastCalledWith(expect.anything(), account, 1, 100, "", expect.any(AbortSignal));
  });

  it("loads files, searches the current list, and requests favorites on view change", async () => {
    state.api.getFiles.mockImplementation((_instance, _account, _page, _size, search) =>
      Promise.resolve(search === "missing" ? paged() : paged([file])),
    );
    state.api.getFavorites.mockImplementation((_instance, _account, _page, _size, search) =>
      Promise.resolve(search === "missing" ? paged() : paged([{ ...file, isFavorite: true }])),
    );
    renderPage(<FilesPage />);

    expect(await screen.findByRole("heading", { name: "Files" })).toBeInTheDocument();
    expect(screen.getByText("coast.pdf")).toBeInTheDocument();
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "Search files by name, type, or ID",
      }),
      {
        target: { value: "missing" },
      },
    );
    expect(await screen.findByText("No files match your search")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Favorites" }));
    expect(await screen.findByRole("heading", { name: "Favorites" })).toBeInTheDocument();
    expect(state.api.getFavorites).toHaveBeenCalledWith(
      expect.anything(),
      account,
      1,
      12,
      "missing",
      "All",
    );
    fireEvent.click(screen.getByRole("button", { name: "Videos" }));
    await waitFor(() =>
      expect(state.api.getFavorites).toHaveBeenCalledWith(
        expect.anything(),
        account,
        1,
        12,
        "missing",
        "Videos",
      ),
    );
  });

  it("does not let an older file search replace newer results", async () => {
    let resolveOlder: ((result: ReturnType<typeof paged<FileResponse>>) => void) | undefined;
    state.api.getFiles.mockImplementation((_instance, _account, _page, _size, search) => {
      if (search === "older") {
        return new Promise((resolve) => {
          resolveOlder = resolve;
        });
      }
      return Promise.resolve(
        paged([search === "newer" ? { ...file, originalFileName: "newer.pdf" } : file]),
      );
    });

    renderPage(<FilesPage />);
    expect(await screen.findByText("coast.pdf")).toBeInTheDocument();
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "Search files by name, type, or ID",
      }),
      {
        target: { value: "older" },
      },
    );
    await waitFor(() => expect(resolveOlder).toBeDefined());
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "Search files by name, type, or ID",
      }),
      {
        target: { value: "newer" },
      },
    );
    expect(await screen.findByText("newer.pdf")).toBeInTheDocument();

    await act(async () => {
      resolveOlder?.(paged([{ ...file, originalFileName: "older.pdf" }]));
    });

    expect(screen.getByText("newer.pdf")).toBeInTheDocument();
    expect(screen.queryByText("older.pdf")).not.toBeInTheDocument();
  });

  it("uploads multiple personal files and refreshes the files page", async () => {
    state.api.getFiles.mockResolvedValue(paged());
    renderPage(<FilesPage />);
    await screen.findByRole("heading", { name: "Files" });

    fireEvent.click(screen.getByRole("button", { name: "Upload files" }));
    const first = new File(["first"], "first.pdf", { type: "application/pdf" });
    const second = new File(["second"], "second.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Choose files to upload"), {
      target: { files: [first, second] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload 2 files" }));

    await screen.findAllByText("Uploads finished: 2 successful, 0 failed.");
    expect(state.api.uploadFile).toHaveBeenNthCalledWith(1, expect.anything(), account, first);
    expect(state.api.uploadFile).toHaveBeenNthCalledWith(2, expect.anything(), account, second);
    await waitFor(() => expect(state.api.getFiles).toHaveBeenCalledTimes(2));
  });

  it("keeps the file page visible while previews are loading", async () => {
    state.previewLoading = true;
    state.api.getFiles.mockResolvedValue(paged([file]));
    renderPage(<FilesPage />);

    expect(await screen.findByRole("heading", { name: "Files" })).toBeInTheDocument();
    expect(screen.getByText("coast.pdf")).toBeInTheDocument();
  });

  it("does not restart preview work on unrelated Files page renders", async () => {
    state.trackPreviewEffects = true;
    state.api.getFiles.mockResolvedValue(paged([file]));
    renderPage(<FilesPage />);

    expect(await screen.findByText("coast.pdf")).toBeInTheDocument();
    await waitFor(() => expect(state.previewEffectCalls).toBe(2));
  });

  it("navigates from Files to Dashboard through the workspace navigation", async () => {
    state.api.getFiles.mockResolvedValue(paged());
    state.api.getMyAlbums.mockResolvedValue(paged());
    render(
      <MemoryRouter initialEntries={["/files"]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/files" element={<FilesPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Files" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Dashboard" }));
    expect(await screen.findByText("Welcome back,")).toBeInTheDocument();
  });

  it("does not reload album data when MSAL refreshes the account object for the same identity", async () => {
    state.api.getAlbum.mockResolvedValue(album);
    state.api.getAlbumFiles.mockResolvedValue(paged());
    const rendered = renderPage(<AlbumDetailPage />, "/albums/7");

    expect(await screen.findByRole("heading", { name: "Coastal trip" })).toBeInTheDocument();
    expect(state.api.getAlbum).toHaveBeenCalledTimes(1);

    state.account = { ...account };
    rendered.rerender(
      <MemoryRouter initialEntries={["/albums/7"]}>
        <Routes>
          <Route path="/albums/:albumId" element={<AlbumDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(state.api.getAlbum).toHaveBeenCalledTimes(1);
  });

  it("keeps admin dashboard in personal scope until all content is selected", async () => {
    state.user = { ...state.user, role: "Admin" };
    state.api.getMyAdminFiles.mockResolvedValue(paged([adminFile]));
    renderPage(<Dashboard />);

    expect(await screen.findByText("Welcome back,")).toBeInTheDocument();
    expect(state.api.getMyAlbums).toHaveBeenCalled();
    expect(state.api.getFiles).toHaveBeenCalled();
    expect(state.api.getAdminAlbums).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "My Content" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All Content" }));
    await waitFor(() => expect(state.api.getAdminAlbums).toHaveBeenCalled());
    expect(state.api.getAdminFiles).toHaveBeenCalled();
  });

  it("searches and deletes admin-scoped albums and files with confirmation", async () => {
    state.user = { ...state.user, role: "Admin" };
    state.api.getAdminAlbums.mockResolvedValue({
      ...paged([album]),
      totalItems: 11,
      pageCount: 2,
    });
    state.api.getAdminFiles.mockResolvedValue({
      ...paged([adminFile]),
      totalItems: 11,
      pageCount: 2,
    });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    state.api.deleteAlbum.mockResolvedValue(undefined);
    state.api.deleteFile.mockResolvedValue(undefined);
    renderPage(<Dashboard />);

    await screen.findByText("Welcome back,");
    fireEvent.click(screen.getByRole("button", { name: "All Content" }));
    await screen.findByRole("button", { name: "Manage album Coastal trip" });
    await screen.findByRole("button", { name: "Manage file admin.pdf" });

    fireEvent.change(screen.getByRole("textbox", { name: "Search all albums" }), {
      target: { value: " coast " },
    });
    await waitFor(() =>
      expect(state.api.getAdminAlbums).toHaveBeenLastCalledWith(
        expect.anything(),
        account,
        1,
        10,
        "coast",
      ),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Search all files" }), {
      target: { value: " report " },
    });
    await waitFor(() =>
      expect(state.api.getAdminFiles).toHaveBeenLastCalledWith(
        expect.anything(),
        account,
        1,
        10,
        "report",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete album Coastal trip" }));
    await waitFor(() =>
      expect(state.api.deleteAlbum).toHaveBeenCalledWith(expect.anything(), account, album.id),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete file admin.pdf" }));
    await waitFor(() =>
      expect(state.api.deleteFile).toHaveBeenCalledWith(expect.anything(), account, adminFile.id),
    );
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it("does not delete admin content when confirmation is declined and reports load failures", async () => {
    state.user = { ...state.user, role: "Admin" };
    state.api.getAdminAlbums.mockResolvedValue(paged([album]));
    state.api.getAdminFiles.mockResolvedValue(paged([adminFile]));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const rendered = renderPage(<Dashboard />);
    await screen.findByText("Welcome back,");
    fireEvent.click(screen.getByRole("button", { name: "All Content" }));
    await screen.findByRole("button", { name: "Delete album Coastal trip" });
    fireEvent.click(screen.getByRole("button", { name: "Delete album Coastal trip" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete file admin.pdf" }));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(state.api.deleteAlbum).not.toHaveBeenCalled();
    expect(state.api.deleteFile).not.toHaveBeenCalled();

    rendered.unmount();
    state.user = { ...state.user, role: "User" };
    state.api.getMyAlbums.mockRejectedValue(new Error("dashboard unavailable"));
    renderPage(<Dashboard />);
    expect(await screen.findByRole("alert")).toHaveTextContent("dashboard unavailable");
  });

  it("loads owner album files and member settings", async () => {
    state.api.getAlbumFiles.mockResolvedValue(paged([file]));
    renderPage(<AlbumDetailPage />, "/albums/7");

    expect(await screen.findByRole("heading", { name: "Coastal trip" })).toBeInTheDocument();
    expect(state.api.getAlbum).toHaveBeenCalledWith(expect.anything(), account, 7);
    expect(state.api.getAlbumFiles).toHaveBeenCalledWith(
      expect.anything(),
      account,
      7,
      1,
      12,
      "All",
    );
    expect(state.api.getAlbumMembers).toHaveBeenCalledWith(expect.anything(), account, 7);
  });

  it("associates each selected upload with the active album and refreshes its file list", async () => {
    renderPage(<AlbumDetailPage />, "/albums/7");
    await screen.findByRole("heading", { name: "Coastal trip" });

    fireEvent.click(screen.getByRole("button", { name: "Add files" }));
    const upload = new File(["album file"], "album.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(screen.getByLabelText("Choose files to upload"), {
      target: { files: [upload] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload 1 file" }));

    await screen.findAllByText("Uploads finished: 1 successful, 0 failed.");
    expect(state.api.uploadAlbumFile).toHaveBeenCalledWith(expect.anything(), account, 7, upload);
    await waitFor(() => expect(state.api.getAlbumFiles).toHaveBeenCalledTimes(2));
  });

  it("does not request sharing management data for a shared viewer", async () => {
    state.user = { ...state.user, userId: 44 };
    renderPage(<AlbumDetailPage />, "/albums/7");

    expect(await screen.findByText("Shared album")).toBeInTheDocument();
    expect(state.api.getAlbumMembers).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Edit album name" })).not.toBeInTheDocument();
  });

  it("hides selection controls until requested and permanently deletes selected files", async () => {
    state.api.getFiles.mockResolvedValue(paged([file]));
    state.api.deleteFile.mockResolvedValue(undefined);
    renderPage(<FilesPage />);
    expect(await screen.findByText("coast.pdf")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select coast.pdf" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Select files" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select coast.pdf" }));
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete selected" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Permanently delete 1 file?");
    expect(screen.getByRole("alertdialog")).toHaveTextContent("stored content");
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    await waitFor(() =>
      expect(state.api.deleteFile).toHaveBeenCalledWith(expect.anything(), account, file.id),
    );
    await waitFor(() =>
      expect(screen.queryByRole("checkbox", { name: "Select coast.pdf" })).not.toBeInTheDocument(),
    );
  });

  it("removes selected favorites without deleting their files", async () => {
    state.api.getFavorites.mockResolvedValue(paged([{ ...file, isFavorite: true }]));
    state.api.removeFavorite.mockResolvedValue(undefined);
    renderPage(<FilesPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Favorites" }));
    await screen.findByText("coast.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Select files" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select coast.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove from Favorites" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("underlying files will remain");
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Remove from Favorites",
      }),
    );
    await waitFor(() =>
      expect(state.api.removeFavorite).toHaveBeenCalledWith(expect.anything(), account, file.id),
    );
    expect(state.api.deleteFile).not.toHaveBeenCalled();
  });

  it("adds a file to Favorites and removes it from the Favorites list after toggling off", async () => {
    state.api.getFiles.mockResolvedValue(paged([file]));
    state.api.addFavorite.mockResolvedValue(undefined);
    state.api.getFavorites.mockResolvedValue(paged([{ ...file, isFavorite: true }]));
    state.api.removeFavorite.mockResolvedValue(undefined);
    renderPage(<FilesPage />);

    await screen.findByText("coast.pdf");
    fireEvent.click(screen.getByTitle("Add to favorites"));
    await waitFor(() =>
      expect(state.api.addFavorite).toHaveBeenCalledWith(expect.anything(), account, file.id),
    );
    fireEvent.click(screen.getByRole("button", { name: "Favorites" }));
    await screen.findByText("coast.pdf");
    fireEvent.click(screen.getByTitle("Remove from favorites"));

    await waitFor(() =>
      expect(state.api.removeFavorite).toHaveBeenCalledWith(expect.anything(), account, file.id),
    );
    await waitFor(() => expect(state.api.getFavorites).toHaveBeenCalledTimes(2));
  });

  it("removes album associations through the non-destructive album action", async () => {
    state.api.getAlbumFiles.mockResolvedValue(paged([file]));
    state.api.removeAlbumFileAssociation.mockResolvedValue(undefined);
    renderPage(<AlbumDetailPage />, "/albums/7");
    await screen.findByText("coast.pdf");
    expect(screen.queryByRole("checkbox", { name: "Select coast.pdf" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Select files" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select coast.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove from album" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("file and its stored content remain");
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Remove from album",
      }),
    );
    await waitFor(() =>
      expect(state.api.removeAlbumFileAssociation).toHaveBeenCalledWith(
        expect.anything(),
        account,
        7,
        file.id,
      ),
    );
    expect(state.api.deleteAlbumFile).not.toHaveBeenCalled();
  });

  it("keeps failed files selected after a partial delete", async () => {
    const secondFile = { ...file, id: 22, originalFileName: "second.pdf" };
    state.api.getFiles.mockResolvedValue(paged([file, secondFile]));
    state.api.deleteFile.mockImplementation((_instance, _account, id) =>
      id === file.id ? Promise.reject(new Error("Unavailable")) : Promise.resolve(undefined),
    );
    renderPage(<FilesPage />);
    await screen.findByText("coast.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Select files" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select coast.pdf" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select second.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete selected" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Delete permanently",
      }),
    );
    await waitFor(() =>
      expect(
        screen.getByText(/1 completed; 1 failed.*selected for review or retry\./),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("checkbox", { name: "Select coast.pdf" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Select second.pdf" })).not.toBeChecked();
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("reports partial deletion and storage cleanup warnings for mixed bulk results", async () => {
    const secondFile = { ...file, id: 22, originalFileName: "second.pdf" };
    state.api.getFiles.mockResolvedValue(paged([file, secondFile]));
    state.api.deleteFile.mockImplementation((_instance, _account, id) =>
      id === file.id
        ? Promise.reject("storage service unavailable")
        : Promise.resolve({ storageCleanupComplete: false }),
    );
    renderPage(<FilesPage />);
    await screen.findByText("coast.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Select files" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select coast.pdf" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select second.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete selected" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Delete permanently",
      }),
    );

    expect(await screen.findByText(/1 completed; 1 failed \(coast\.pdf\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/Storage cleanup needs reconciliation for: second\.pdf/),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select coast.pdf" })).toBeChecked();
  });

  it("clears selection and hides checkboxes when selection mode is canceled", async () => {
    state.api.getFiles.mockResolvedValue(paged([file]));
    renderPage(<FilesPage />);
    await screen.findByText("coast.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Select files" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select coast.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel selection" }));
    expect(screen.queryByRole("checkbox", { name: "Select coast.pdf" })).not.toBeInTheDocument();
    expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select files" })).toBeInTheDocument();
  });

  it("reports invalid album IDs without requesting album data", async () => {
    renderPage(<AlbumDetailPage />, "/albums/0");

    expect(await screen.findByRole("alert")).toHaveTextContent("The album ID is invalid.");
    expect(state.api.getAlbum).not.toHaveBeenCalled();
    expect(state.api.getAlbumFiles).not.toHaveBeenCalled();
  });

  it("edits an album name and handles rejected deletion without navigating", async () => {
    state.api.updateAlbum.mockResolvedValue({
      ...album,
      albumName: "Renamed coast",
    });
    state.api.deleteAlbum.mockRejectedValue(new Error("Permission denied"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage(<AlbumDetailPage />, "/albums/7");

    await screen.findByRole("heading", { name: "Coastal trip" });
    fireEvent.click(screen.getByRole("button", { name: "Edit album name" }));
    fireEvent.change(screen.getByLabelText("Album name"), {
      target: { value: "  Renamed coast  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("heading", { name: "Renamed coast" })).toBeInTheDocument();
    expect(state.api.updateAlbum).toHaveBeenCalledWith(expect.anything(), account, 7, {
      albumName: "Renamed coast",
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete album" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Permission denied");
    expect(screen.getByTestId("current-path")).toHaveTextContent("/albums/7");
  });

  it("shares an album and updates or revokes member permissions", async () => {
    const member = {
      userId: 44,
      name: "Alex Member",
      email: "alex@example.test",
      canView: true,
      canDownload: true,
      grantedAt: "2025-02-01T00:00:00Z",
    };
    state.api.getAlbumMembers.mockResolvedValue([member]);
    state.api.addAlbumMember.mockResolvedValue(undefined);
    state.api.updateAlbumMember.mockResolvedValue(undefined);
    state.api.removeAlbumMember.mockResolvedValue(undefined);
    renderPage(<AlbumDetailPage />, "/albums/7");
    await screen.findByRole("heading", { name: "Coastal trip" });
    fireEvent.click(screen.getByText("Share access"));

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: " new@example.test " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Share album" }));
    await waitFor(() =>
      expect(state.api.addAlbumMember).toHaveBeenCalledWith(expect.anything(), account, 7, {
        email: "new@example.test",
        canView: true,
        canDownload: true,
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "View allowed for alex@example.test",
      }),
    );
    await waitFor(() =>
      expect(state.api.updateAlbumMember).toHaveBeenCalledWith(expect.anything(), account, 7, 44, {
        canView: false,
        canDownload: false,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Revoke access for alex@example.test",
      }),
    );
    await waitFor(() =>
      expect(state.api.removeAlbumMember).toHaveBeenCalledWith(expect.anything(), account, 7, 44),
    );
    expect(screen.queryByText("Alex Member")).not.toBeInTheDocument();
  });

  it("keeps download disabled when a member has no view access and grants view independently", async () => {
    state.api.getAlbumMembers.mockResolvedValue([
      {
        userId: 55,
        name: "Sam Viewer",
        email: "sam@example.test",
        canView: false,
        canDownload: false,
        grantedAt: "2025-02-01T00:00:00Z",
      },
    ]);
    state.api.updateAlbumMember.mockResolvedValue(undefined);
    renderPage(<AlbumDetailPage />, "/albums/7");
    await screen.findByRole("heading", { name: "Coastal trip" });
    fireEvent.click(screen.getByText("Share access"));

    expect(
      screen.getByRole("button", { name: "Download off for sam@example.test" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "View off for sam@example.test" }));
    await waitFor(() =>
      expect(state.api.updateAlbumMember).toHaveBeenCalledWith(expect.anything(), account, 7, 55, {
        canView: true,
        canDownload: false,
      }),
    );
  });

  it("replaces a personal file and reports delete failures while keeping the file listed", async () => {
    state.api.getFiles.mockResolvedValue(paged([file]));
    state.api.replaceFile.mockResolvedValue(undefined);
    state.api.deleteFile.mockRejectedValue(new Error("Storage unavailable"));
    renderPage(<FilesPage />);
    await screen.findByText("coast.pdf");

    fireEvent.click(screen.getByRole("button", { name: "Actions for coast.pdf" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Replace" }));
    const replacement = new File(["replacement"], "new.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: { files: [replacement] },
    });
    await waitFor(() =>
      expect(state.api.replaceFile).toHaveBeenCalledWith(
        expect.anything(),
        account,
        file.id,
        replacement,
      ),
    );
    expect(await screen.findByText("new.pdf replaced successfully.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Actions for coast.pdf" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Storage unavailable");
    expect(screen.getByText("coast.pdf")).toBeInTheDocument();
  });

  it("loads admin all-content files and applies the category filter", async () => {
    state.user = { ...state.user, role: "Admin" };
    state.api.getAdminFiles.mockResolvedValue(paged([adminFile]));
    renderPage(<FilesPage />, "/files?scope=all");

    expect(await screen.findByText("admin.pdf")).toBeInTheDocument();
    expect(state.api.getAdminFiles).toHaveBeenCalledWith(
      expect.anything(),
      account,
      1,
      12,
      "",
      "All",
    );
    fireEvent.click(screen.getByRole("button", { name: "Videos" }));
    await waitFor(() =>
      expect(state.api.getAdminFiles).toHaveBeenLastCalledWith(
        expect.anything(),
        account,
        1,
        12,
        "",
        "Videos",
      ),
    );
  });

  it("opens a file preview, loads details, and reports download failures", async () => {
    state.api.getFiles.mockResolvedValue(paged([file]));
    state.api.getFilePreviewUrlByPath.mockResolvedValue("blob:full-preview");
    state.api.getFile.mockResolvedValue(file);
    state.api.downloadFileByPath.mockRejectedValue(new Error("Download denied"));
    renderPage(<FilesPage />);
    await screen.findByText("coast.pdf");

    fireEvent.click(screen.getByRole("button", { name: "Open preview of coast.pdf" }));
    expect(await screen.findByRole("dialog", { name: "Preview coast.pdf" })).toBeInTheDocument();
    expect(state.api.getFilePreviewUrlByPath).toHaveBeenCalledWith(
      expect.anything(),
      account,
      file.downloadUrl,
      file.contentType,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close file preview" }));

    fireEvent.click(screen.getByRole("button", { name: "Actions for coast.pdf" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Details" }));
    expect(await screen.findByRole("dialog", { name: "coast.pdf" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Actions for coast.pdf" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Download" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Download denied");
  });

  it("reports album member loading failures while leaving album files available", async () => {
    state.api.getAlbumFiles.mockResolvedValue(paged([file]));
    state.api.getAlbumMembers.mockRejectedValue(new Error("Sharing service unavailable"));
    renderPage(<AlbumDetailPage />, "/albums/7");

    expect(await screen.findByText("coast.pdf")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Album opened, but sharing settings could not be loaded.",
    );
    expect(screen.getByRole("heading", { name: "Coastal trip" })).toBeInTheDocument();
  });

  it("validates share input, handles rejected invites, and respects album delete cancellation", async () => {
    state.api.addAlbumMember.mockRejectedValue(new Error("User not found"));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderPage(<AlbumDetailPage />, "/albums/7");
    await screen.findByRole("heading", { name: "Coastal trip" });
    fireEvent.click(screen.getByText("Share access"));

    fireEvent.click(screen.getByRole("button", { name: "Share album" }));
    expect(
      await screen.findByText("An email address is required to share the album."),
    ).toBeInTheDocument();
    expect(state.api.addAlbumMember).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "missing@example.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Share album" }));
    expect(await screen.findByText("User not found")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete album" }));
    expect(confirm).toHaveBeenCalledWith('Delete "Coastal trip"? This cannot be undone.');
    expect(state.api.deleteAlbum).not.toHaveBeenCalled();
    expect(screen.getByTestId("current-path")).toHaveTextContent("/albums/7");
  });

  it("reports storage cleanup warnings after deleting album files", async () => {
    state.api.getAlbumFiles.mockResolvedValue(paged([file]));
    state.api.deleteAlbumFile.mockResolvedValue({
      storageCleanupComplete: false,
    });
    renderPage(<AlbumDetailPage />, "/albums/7");
    await screen.findByText("coast.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Select files" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select coast.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Delete permanently",
      }),
    );

    expect(
      await screen.findByText(/Storage cleanup needs reconciliation for: coast\.pdf/),
    ).toBeInTheDocument();
    expect(state.api.deleteAlbumFile).toHaveBeenCalledWith(expect.anything(), account, 7, file.id);
  });

  it("reports partial album bulk deletion and cleanup failures without losing failed selections", async () => {
    const secondFile = { ...file, id: 22, originalFileName: "second.pdf" };
    state.api.getAlbumFiles.mockResolvedValue(paged([file, secondFile]));
    state.api.deleteAlbumFile.mockImplementation((_instance, _account, _albumId, id) =>
      id === file.id
        ? Promise.reject("storage unavailable")
        : Promise.resolve({ storageCleanupComplete: false }),
    );
    renderPage(<AlbumDetailPage />, "/albums/7");
    await screen.findByText("coast.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Select files" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select coast.pdf" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select second.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Delete permanently",
      }),
    );

    expect(await screen.findByText(/1 completed; 1 failed \(coast\.pdf\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/Storage cleanup needs reconciliation for: second\.pdf/),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select coast.pdf" })).toBeChecked();
  });

  it("reports a replacement validation error without calling the API", async () => {
    state.api.getAlbumFiles.mockResolvedValue(paged([file]));
    renderPage(<AlbumDetailPage />, "/albums/7");
    await screen.findByText("coast.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Actions for coast.pdf" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Replace" }));
    const unsupported = new File(["bad"], "unsafe.exe", {
      type: "application/octet-stream",
    });
    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: { files: [unsupported] },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Unsupported file format.");
    expect(state.api.replaceAlbumFile).not.toHaveBeenCalled();
  });

  it("keeps album members listed when permission updates or revocation fail", async () => {
    state.api.getAlbumMembers.mockResolvedValue([
      {
        userId: 44,
        name: "Alex Member",
        email: "alex@example.test",
        canView: true,
        canDownload: true,
        grantedAt: "2025-02-01T00:00:00Z",
      },
    ]);
    state.api.updateAlbumMember.mockRejectedValue(new Error("Permission update failed"));
    state.api.removeAlbumMember.mockRejectedValue("revoke failed");
    renderPage(<AlbumDetailPage />, "/albums/7");
    await screen.findByRole("heading", { name: "Coastal trip" });
    fireEvent.click(screen.getByText("Share access"));

    fireEvent.click(
      screen.getByRole("button", {
        name: "Download allowed for alex@example.test",
      }),
    );
    expect(await screen.findByText("Permission update failed")).toBeInTheDocument();
    expect(screen.getByText("Alex Member")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Revoke access for alex@example.test",
      }),
    );
    expect(await screen.findByText("Unable to revoke access.")).toBeInTheDocument();
    expect(screen.getByText("Alex Member")).toBeInTheDocument();
  });

  it("uses a fallback message when album loading rejects without an Error object", async () => {
    state.api.getAlbum.mockRejectedValue("offline");
    renderPage(<AlbumDetailPage />, "/albums/7");

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load album details.");
    expect(state.api.getAlbumFiles).not.toHaveBeenCalled();
  });

  it("supports mobile navigation and closes the profile menu on Escape or outside click", async () => {
    const view = render(
      <MemoryRouter initialEntries={["/files"]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/files" element={<FilesPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: "Files" });

    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole("navigation", { name: "Mobile navigation" })).getByRole("link", {
        name: "Dashboard",
      }),
    );
    expect(await screen.findByText("Welcome back,")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();

    const profile = screen.getByRole("button", {
      name: "Profile menu for Maya Chen",
    });
    fireEvent.click(profile);
    expect(screen.getByRole("menu", { name: "Profile options" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: "Profile options" })).not.toBeInTheDocument();
    expect(profile).toHaveFocus();

    fireEvent.click(profile);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu", { name: "Profile options" })).not.toBeInTheDocument();
    fireEvent.click(profile);
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(state.logout).toHaveBeenCalledOnce();
    view.unmount();
  });
});
