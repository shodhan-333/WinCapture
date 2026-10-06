import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  FilePlus2,
  FolderOpen,
  Search,
  Star,
  Upload,
  X,
} from "lucide-react";
import { useMsal } from "@azure/msal-react";

import {
  deleteFile,
  downloadFileByPath,
  getFavorites,
  getFilePreviewUrlByPath,
  getFiles,
  replaceFile,
  uploadFile,
} from "../api/apiClient";
import ErrorBanner from "../components/ui/ErrorBanner";
import FileCardGrid from "../components/files/FileCardGrid";
import useFileFavorites from "../hooks/useFileFavorites";
import useFilePreviews from "../hooks/useFilePreviews";
import { useAuth } from "../context/AuthContext";
import type { FileResponse } from "../types/file";

type FileView =
  | "all"
  | "favorites";

export default function FilesPage() {
  const { instance } = useMsal();
  const { account } = useAuth();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const replaceInputRef =
    useRef<HTMLInputElement | null>(null);

  const replaceTargetIdRef =
    useRef<number | null>(null);

  const [files, setFiles] =
    useState<FileResponse[]>([]);
  const [view, setView] =
    useState<FileView>("all");
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [uploading, setUploading] =
    useState(false);
  const [searchQuery, setSearchQuery] =
    useState("");

  const loadPreview = useCallback(
    async (file: FileResponse) => {
      if (!account) {
        throw new Error("An authenticated account is required.");
      }

      const previewPath =
        file.downloadUrl.startsWith("/api/albums/") &&
        !file.canManage
          ? file.downloadUrl.replace(
              /\/download$/,
              "/preview",
            )
          : file.downloadUrl;

      return getFilePreviewUrlByPath(
        instance,
        account,
        previewPath,
        file.contentType,
      );
    },
    [account, instance],
  );

  const {
    previewUrls,
    loading: previewsLoading,
  } = useFilePreviews(
    files,
    loadPreview,
  );

  const normalizedQuery =
    searchQuery.trim().toLocaleLowerCase();

  const filteredFiles = normalizedQuery
    ? files.filter(
        (file) =>
          file.originalFileName
            .toLocaleLowerCase()
            .includes(normalizedQuery) ||
          file.contentType
            .toLocaleLowerCase()
            .includes(normalizedQuery) ||
          String(file.id).includes(normalizedQuery),
      )
    : files;

  const loadFiles = async (
    nextView: FileView = view,
  ) => {
    if (!account) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const nextFiles =
        nextView === "favorites"
          ? await getFavorites(instance, account)
          : await getFiles(instance, account);

      setFiles(nextFiles);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load files.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFiles(view);
  }, [account, instance, view]);

  const handleUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile || !account) {
      return;
    }

    try {
      setUploading(true);
      setError(null);

      await uploadFile(
        instance,
        account,
        selectedFile,
      );

      event.target.value = "";

      if (view === "favorites") {
        setView("all");
      } else {
        await loadFiles("all");
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Upload failed.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];
    const fileId = replaceTargetIdRef.current;

    if (!selectedFile || !account || fileId === null) {
      return;
    }

    try {
      setError(null);

      await replaceFile(
        instance,
        account,
        fileId,
        selectedFile,
      );

      await loadFiles(view);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Replace failed.",
      );
    } finally {
      replaceTargetIdRef.current = null;
      event.target.value = "";
    }
  };

  const handleDownload = async (file: FileResponse) => {
    if (!account) {
      return;
    }

    try {
      setError(null);

      await downloadFileByPath(
        instance,
        account,
        file.downloadUrl,
        file.originalFileName,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Download failed.",
      );
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!account) {
      return;
    }

    try {
      setError(null);

      await deleteFile(
        instance,
        account,
        fileId,
      );

      await loadFiles(view);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Delete failed.",
      );
    }
  };

  const handleFavoriteSuccess = useCallback(
    (file: FileResponse, nextFavorite: boolean) => {
      setFiles((previous) => {
        if (view === "favorites" && !nextFavorite) {
          return previous.filter(
            (item) => item.id !== file.id,
          );
        }

        return previous.map((item) =>
          item.id === file.id
            ? {
                ...item,
                isFavorite: nextFavorite,
              }
            : item,
        );
      });
    },
    [view],
  );

  const handleFavoriteError = useCallback(
    (message: string) => {
      setError(message);
    },
    [],
  );

  const {
    pendingIds: favoritePendingIds,
    toggleFavorite,
  } = useFileFavorites({
    instance,
    account,
    onSuccess: handleFavoriteSuccess,
    onError: handleFavoriteError,
  });

  const openReplace = (file: FileResponse) => {
    replaceTargetIdRef.current = file.id;

    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
      replaceInputRef.current.click();
    }
  };

  if (loading || previewsLoading) {
    return (
      <div className="app-page">
        <section className="files-page-header skeleton-panel">
          <div className="skeleton-content">
            <span className="skeleton-line skeleton-line-sm" />
            <span className="skeleton-line skeleton-line-lg" />
            <span className="skeleton-line skeleton-line-md" />
          </div>

          <div className="files-toolbar-skeleton">
            <span className="skeleton-field skeleton-field-lg" />
            <span className="skeleton-field" />
            <span className="skeleton-button skeleton-button-wide" />
          </div>
        </section>

        <section className="file-card-grid">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="surface file-card-loading"
            >
              <div className="file-loading-preview" />

              <div className="file-loading-body">
                <span className="skeleton-line skeleton-line-md" />
                <span className="skeleton-line skeleton-line-sm" />
                <span className="skeleton-line skeleton-line-xs" />
              </div>
            </div>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="app-page">
      <section className="files-page-header surface">
        <div className="files-page-heading">
          <div className="page-kicker">
            <span className="page-kicker-dot" />
            Your library
          </div>

          <h1 className="page-heading">
            {view === "favorites" ? "Favorites" : "Files"}
          </h1>

          <p className="page-description">
            Browse, search, and manage your files from one
            place.
          </p>
        </div>

        <div className="files-toolbar">
          <div
            className="file-view-switcher"
            role="group"
            aria-label="File view"
          >
            <button
              type="button"
              aria-pressed={view === "all"}
              onClick={() => setView("all")}
              className={view === "all" ? "is-active" : ""}
            >
              <FolderOpen
                aria-hidden="true"
                size={15}
                strokeWidth={1.8}
              />

              All files
            </button>

            <button
              type="button"
              aria-pressed={view === "favorites"}
              onClick={() => setView("favorites")}
              className={
                view === "favorites" ? "is-active" : ""
              }
            >
              <Star
                aria-hidden="true"
                size={15}
                strokeWidth={1.8}
                className={
                  view === "favorites"
                    ? "fill-current"
                    : ""
                }
              />

              Favorites
            </button>
          </div>

          <label className="search-field files-search">
            <Search
              aria-hidden="true"
              size={17}
              strokeWidth={1.8}
            />

            <span className="sr-only">Search files</span>

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search files..."
              aria-label="Search files by name, type, or ID"
            />

            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                aria-label="Clear file search"
                onClick={() => setSearchQuery("")}
              >
                <X
                  aria-hidden="true"
                  size={15}
                  strokeWidth={1.8}
                />
              </button>
            )}
          </label>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="primary-action files-upload-button disabled:opacity-60 disabled:cursor-wait"
          >
            <Upload
              aria-hidden="true"
              size={16}
              strokeWidth={1.8}
            />

            <span>
              {uploading ? "Uploading..." : "Upload file"}
            </span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
        />

        <input
          ref={replaceInputRef}
          type="file"
          className="hidden"
          onChange={handleReplace}
        />
      </section>

      {error && <ErrorBanner message={error} />}

      <section
        className="files-section"
        aria-label={
          view === "favorites" ? "Favorite files" : "Files"
        }
      >
        {filteredFiles.length === 0 ? (
          <section className="surface files-empty-state">
            <span className="files-empty-icon">
              {view === "favorites" ? (
                <Star
                  aria-hidden="true"
                  size={29}
                  strokeWidth={1.45}
                />
              ) : searchQuery ? (
                <Search
                  aria-hidden="true"
                  size={29}
                  strokeWidth={1.45}
                />
              ) : (
                <FilePlus2
                  aria-hidden="true"
                  size={29}
                  strokeWidth={1.45}
                />
              )}
            </span>

            <h3>
              {view === "favorites"
                ? searchQuery
                  ? "No favorite files found"
                  : "No favorite files yet"
                : files.length === 0
                  ? "No files uploaded yet"
                  : "No files match your search"}
            </h3>

            <p>
              {view === "favorites"
                ? searchQuery
                  ? "Try a different filename, type, or ID."
                  : "Favorite a file to keep it close at hand."
                : files.length === 0
                  ? "Upload an image or PDF to start building your library."
                  : "Try changing your search terms."}
            </p>

            {view === "favorites" && !searchQuery && (
              <button
                type="button"
                onClick={() => setView("all")}
                className="secondary-action"
              >
                <FolderOpen
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.8}
                />
                Browse all files
              </button>
            )}

            {files.length === 0 &&
              !searchQuery &&
              view === "all" && (
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="primary-action"
                >
                  <Upload
                    aria-hidden="true"
                    size={16}
                    strokeWidth={1.8}
                  />
                  Upload your first file
                </button>
              )}
          </section>
        ) : (
          <FileCardGrid
            files={filteredFiles}
            previewUrls={previewUrls}
            favoritePendingIds={favoritePendingIds}
            canManage={(file) => file.canManage}
            onFavoriteToggle={(file) =>
              void toggleFavorite(file)
            }
            onReplace={openReplace}
            onDownload={(file) =>
              void handleDownload(file)
            }
            onDelete={(file) =>
              void handleDelete(file.id)
            }
          />
        )}
      </section>
    </div>
  );
}
