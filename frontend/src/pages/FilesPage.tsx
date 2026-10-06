import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Search,
  Star,
  X,
} from "lucide-react";
import { useMsal } from "@azure/msal-react";

import {
  addFavorite,
  deleteFile,
  downloadFileByPath,
  getFavorites,
  getFilePreviewUrlByPath,
  getFiles,
  removeFavorite,
  replaceFile,
  uploadFile,
} from "../api/apiClient";
import FileCard from "../components/FileCard";
import { useAuth } from "../context/AuthContext";
import type { FileResponse } from "../types/file";

type FileView =
  | "all"
  | "favorites";

export default function FilesPage() {
  const { instance } =
    useMsal();

  const { account } =
    useAuth();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const replaceInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const replaceTargetIdRef =
    useRef<number | null>(
      null,
    );

  const [files, setFiles] =
    useState<FileResponse[]>(
      [],
    );

  const [view, setView] =
    useState<FileView>(
      "all",
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [uploading, setUploading] =
    useState(false);

  const [previewUrls, setPreviewUrls] =
    useState<Record<number, string>>(
      {},
    );

  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    favoritePendingIds,
    setFavoritePendingIds,
  ] = useState<Set<number>>(
    new Set(),
  );

  const normalizedQuery =
    searchQuery
      .trim()
      .toLocaleLowerCase();

  const filteredFiles =
    normalizedQuery
      ? files.filter(
          (file) =>
            file.originalFileName
              .toLocaleLowerCase()
              .includes(
                normalizedQuery,
              ) ||
            file.contentType
              .toLocaleLowerCase()
              .includes(
                normalizedQuery,
              ) ||
            String(file.id).includes(
              normalizedQuery,
            ),
        )
      : files;

  const loadPreviewUrls = async (
    nextFiles: FileResponse[],
  ) => {
    if (!account) {
      return;
    }

    const imageFiles =
      nextFiles.filter(
        (file) =>
          file.contentType.startsWith(
            "image/",
          ),
      );

    if (imageFiles.length === 0) {
      setPreviewUrls({});
      return;
    }

    const urls =
      await Promise.all(
        imageFiles.map(
          async (file) => {
            try {
              const previewPath =
                file.downloadUrl.startsWith(
                  "/api/albums/",
                ) && !file.canManage
                  ? file.downloadUrl.replace(
                      /\/download$/,
                      "/preview",
                    )
                  : file.downloadUrl;

              return [
                file.id,
                await getFilePreviewUrlByPath(
                  instance,
                  account,
                  previewPath,
                  file.contentType,
                ),
              ] as const;
            } catch {
              return null;
            }
          },
        ),
      );

    setPreviewUrls(
      Object.fromEntries(
        urls.filter(
          (
            entry,
          ): entry is readonly [
            number,
            string,
          ] =>
            entry !== null,
        ),
      ),
    );
  };

  useEffect(
    () => () => {
      Object.values(
        previewUrls,
      ).forEach(
        (url) =>
          URL.revokeObjectURL(
            url,
          ),
      );
    },
    [previewUrls],
  );

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
          ? await getFavorites(
              instance,
              account,
            )
          : await getFiles(
              instance,
              account,
            );

      setFiles(nextFiles);

      await loadPreviewUrls(
        nextFiles,
      );
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
  }, [
    account,
    instance,
    view,
  ]);

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (
      !selectedFile ||
      !account
    ) {
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
        await loadFiles(
          "all",
        );
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
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile =
      event.target.files?.[0];

    const fileId =
      replaceTargetIdRef.current;

    if (
      !selectedFile ||
      !account ||
      fileId === null
    ) {
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

      await loadFiles(
        view,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Replace failed.",
      );
    } finally {
      replaceTargetIdRef.current =
        null;

      event.target.value = "";
    }
  };

  const handleDownload = async (
    file: FileResponse,
  ) => {
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

  const handleDelete = async (
    fileId: number,
  ) => {
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

      await loadFiles(
        view,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Delete failed.",
      );
    }
  };

  const setFavoritePending = (
    fileId: number,
    pending: boolean,
  ) => {
    setFavoritePendingIds(
      (previous) => {
        const next =
          new Set(
            previous,
          );

        if (pending) {
          next.add(fileId);
        } else {
          next.delete(fileId);
        }

        return next;
      },
    );
  };

  const handleFavoriteToggle =
    async (
      file: FileResponse,
    ) => {
      if (!account) {
        return;
      }

      const nextFavorite =
        !file.isFavorite;

      setFavoritePending(
        file.id,
        true,
      );

      try {
        setError(null);

        if (nextFavorite) {
          await addFavorite(
            instance,
            account,
            file.id,
          );
        } else {
          await removeFavorite(
            instance,
            account,
            file.id,
          );
        }

        setFiles(
          (previous) => {
            if (
              view === "favorites" &&
              !nextFavorite
            ) {
              return previous.filter(
                (item) =>
                  item.id !== file.id,
              );
            }

            return previous.map(
              (item) =>
                item.id === file.id
                  ? {
                      ...item,
                      isFavorite:
                        nextFavorite,
                    }
                  : item,
            );
          },
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to update favorite.",
        );
      } finally {
        setFavoritePending(
          file.id,
          false,
        );
      }
    };

  if (loading) {
    return (
      <div className="h-40 animate-pulse rounded-[26px] border border-slate-200 bg-white" />
    );
  }

  return (
    <div className="app-page">
      <section className="page-toolbar surface">
        <div>
          <p className="page-kicker">
            Your library
          </p>

          <h2 className="page-heading">
            {view === "favorites"
              ? "Favorites"
              : "Files"}
          </h2>
        </div>

        <div className="files-toolbar-actions">
          <div
            className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1"
            role="group"
            aria-label="File view"
          >
            <button
              type="button"
              aria-pressed={
                view === "all"
              }
              onClick={() =>
                setView("all")
              }
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                view === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All files
            </button>

            <button
              type="button"
              aria-pressed={
                view === "favorites"
              }
              onClick={() =>
                setView(
                  "favorites",
                )
              }
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                view === "favorites"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Star
                aria-hidden="true"
                size={15}
                className={
                  view === "favorites"
                    ? "fill-current text-amber-500"
                    : ""
                }
              />
              Favorites
            </button>
          </div>

          <label className="search-field">
            <Search
              aria-hidden="true"
              size={18}
            />

            <span className="sr-only">
              Search files
            </span>

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value,
                )
              }
              placeholder="Search files"
              aria-label="Search files by name, type, or ID"
            />

            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                aria-label="Clear file search"
                onClick={() =>
                  setSearchQuery("")
                }
              >
                <X
                  aria-hidden="true"
                  size={16}
                />
              </button>
            )}
          </label>

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={uploading}
            className="primary-action"
          >
            {uploading
              ? "Uploading..."
              : "Upload file"}
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

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {filteredFiles.length === 0 ? (
          <div className="surface p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-4">
            {view === "favorites"
              ? searchQuery
                ? "No favorite files match your search."
                : "You have no favorite files yet."
              : files.length === 0
                ? "No files uploaded yet."
                : "No files match your search."}
          </div>
        ) : (
          filteredFiles.map(
            (file) => (
              <FileCard
                key={file.id}
                file={file}
                previewUrl={
                  previewUrls[file.id]
                }
                canManage={
                  file.canManage
                }
                favoritePending={favoritePendingIds.has(
                  file.id,
                )}
                onFavoriteToggle={() =>
                  void handleFavoriteToggle(
                    file,
                  )
                }
                onReplace={() => {
                  replaceTargetIdRef.current =
                    file.id;

                  if (
                    replaceInputRef.current
                  ) {
                    replaceInputRef.current.value =
                      "";

                    replaceInputRef.current.click();
                  }
                }}
                onDownload={() =>
                  void handleDownload(
                    file,
                  )
                }
                onDelete={() =>
                  void handleDelete(
                    file.id,
                  )
                }
              />
            ),
          )
        )}
      </div>
    </div>
  );
}
