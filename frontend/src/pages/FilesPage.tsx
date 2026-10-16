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
  getFile,
  getFilePreviewUrlByPath,
  getFiles,
  replaceFile,
  uploadFile,
} from "../api/apiClient";
import ErrorBanner from "../components/ui/ErrorBanner";
import Pagination from "../components/ui/Pagination";
import {
  pageHeaderClass,
  pageHeaderSkeletonClass,
} from "../components/ui/uiClasses";
import FileCardGrid from "../components/files/FileCardGrid";
import FileDetailsDialog from "../components/files/FileDetailsDialog";
import FilePreviewModal from "../components/files/FilePreviewModal";
import MultiFileUploadDialog from "../components/files/MultiFileUploadDialog";
import useFileFavorites from "../hooks/useFileFavorites";
import useFilePreviews from "../hooks/useFilePreviews";
import { useAuth } from "../context/AuthContext";
import type { FileResponse } from "../types/file";
import { getAccountKey } from "../utils/accountKey";
import {
  FILE_CATEGORY_FILTERS,
  type FileCategoryFilter,
  SUPPORTED_FILE_ACCEPT,
  validateUploadFile,
} from "../constants/fileSupport";

const fileToolbarClass =
  "flex flex-wrap items-center justify-end gap-2 max-[960px]:w-full max-[960px]:justify-start max-[760px]:grid max-[760px]:grid-cols-1";
const viewSwitcherClass =
  "glass-toolbar inline-flex rounded-[12px] p-[3px] max-[760px]:w-full";
const viewButtonClass =
  "inline-flex min-h-[34px] cursor-pointer items-center justify-center gap-[6px] rounded-lg border px-[11px] text-[10px] font-semibold transition-[color,background,box-shadow,border-color] duration-[160ms]";
const searchFieldClass =
  "glass-toolbar flex min-h-10 w-[min(280px,100%)] items-center gap-2 rounded-[12px] px-[11px] text-[#71879a] focus-within:border-[rgba(30,120,214,0.65)] focus-within:shadow-[0_0_0_3px_rgba(30,120,214,0.14)] max-[760px]:w-full";

type FileView = "all" | "favorites";

const PAGE_SIZE = 12;

export default function FilesPage() {
  const { instance } = useMsal();
  const { account } = useAuth();
  const accountKey = getAccountKey(account);

  // Hidden replacement input opens the native file picker from a file card.
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  // Keep the replacement target while the native file picker is open.
  const replaceTargetIdRef = useRef<number | null>(null);

  const [files, setFiles] = useState<FileResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [view, setView] = useState<FileView>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<FileCategoryFilter>("All");
  const [fileDetails, setFileDetails] = useState<FileResponse | null>(null);
  const [previewFile, setPreviewFile] = useState<FileResponse | null>(null);
  const [previewSource, setPreviewSource] = useState<string | undefined>();

  const loadPreview = useCallback(
    async (file: FileResponse) => {
      if (!account) {
        throw new Error("An authenticated account is required.");
      }

      // Shared album viewers use the preview route instead of the download route.
      const previewPath =
        file.downloadUrl.startsWith("/api/albums/") &&
        !file.canManage
          ? file.downloadUrl.replace(/\/download$/, "/preview")
          : file.downloadUrl;

      return getFilePreviewUrlByPath(
        instance,
        account,
        previewPath,
        file.contentType,
      );
    },
    [accountKey, instance],
  );

  const { previewUrls } = useFilePreviews(files, loadPreview);

  const loadFiles = async (
    nextView: FileView = view,
    requestedPage: number = currentPage,
    requestedCategory: FileCategoryFilter = categoryFilter,
  ) => {
    if (!account) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Apply the selected view, search query, and category filter together.
      const nextPage =
        nextView === "favorites"
          ? await getFavorites(
              instance,
              account,
              requestedPage,
              PAGE_SIZE,
              searchQuery,
              requestedCategory,
            )
          : await getFiles(
              instance,
              account,
              requestedPage,
              PAGE_SIZE,
              searchQuery,
              requestedCategory,
            );

      setFiles(nextPage.items);
      setTotalItems(nextPage.totalItems);
      setPageCount(nextPage.pageCount);
      setCurrentPage(nextPage.page);
    } catch (caughtError) {
      // Clear old results so they are not displayed under a different view
      // when the new request fails, such as showing All files under Favorites.
      setFiles([]);
      setTotalItems(0);
      setPageCount(1);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load files.",
      );
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    void loadFiles(view, currentPage);
  }, [accountKey, instance, view, currentPage, searchQuery, categoryFilter]);

  const handleReplace = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    const fileId = replaceTargetIdRef.current;

    if (!selectedFile || !account || fileId === null) {
      return;
    }

    const validationError = validateUploadFile(selectedFile);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);

      await replaceFile(instance, account, fileId, selectedFile);
      setSuccessMessage(`${selectedFile.name} replaced successfully.`);
      await loadFiles(view);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Replace failed.",
      );
    } finally {
      // Clear the target so a later replacement cannot reuse an old file ID.
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
      await deleteFile(instance, account, fileId);
      await loadFiles(view);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? `${caughtError.message} The file remains listed, so you can retry after resolving the issue.`
          : "Delete failed. You can safely retry.",
      );
    }
  };

  const handleFavoriteSuccess = useCallback(
    (file: FileResponse, nextFavorite: boolean) => {
      setFiles((previous) => {
        // Unfavoriting a file removes it immediately from the Favorites view.
        if (view === "favorites" && !nextFavorite) {
          return previous.filter((item) => item.id !== file.id);
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

      if (view === "favorites" && !nextFavorite) {
        // Refresh the list and pagination totals after removing the favorite.
        void loadFiles(view, currentPage);
      }
    },
    [view, currentPage],
  );

  const handleFavoriteError = useCallback((message: string) => {
    setError(message);
  }, []);

  const {
    pendingIds: favoritePendingIds,
    toggleFavorite,
  } = useFileFavorites({
    instance,
    account,
    onSuccess: handleFavoriteSuccess,
    onError: handleFavoriteError,
  });

  const handleShowFileDetails = async (file: FileResponse) => {
    if (!account) return;

    try {
      setError(null);
      setFileDetails(await getFile(instance, account, file.id));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load file details.",
      );
    }
  };

  const openReplace = (file: FileResponse) => {
    replaceTargetIdRef.current = file.id;

    if (replaceInputRef.current) {
      // Reset first so choosing the same file triggers onChange.
      replaceInputRef.current.value = "";
      replaceInputRef.current.click();
    }
  };

  // Show skeletons only during the initial load.
  if (loading && !hasLoaded) {
    return (
      <div className="app-page">
        <section className={pageHeaderSkeletonClass}>
          <div className="skeleton-content">
            <span className="skeleton-line skeleton-line-sm" />
            <span className="skeleton-line skeleton-line-lg" />
            <span className="skeleton-line skeleton-line-md" />
          </div>

          <div className="flex items-center gap-2">
            <span className="skeleton-field skeleton-field-lg" />
            <span className="skeleton-field" />
            <span className="skeleton-button skeleton-button-wide" />
          </div>
        </section>

        <section className="grid grid-cols-4 gap-3 max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="surface overflow-hidden rounded-[17px]"
            >
              <div className="relative mx-[8px] mt-[8px] h-[136px] w-[calc(100%-16px)] overflow-hidden rounded-[11px] bg-[linear-gradient(145deg,#e3edf5,#d7e5ef)] after:absolute after:top-0 after:bottom-0 after:w-[35%] after:translate-x-[-130%] after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.56),transparent)] after:animate-[skeleton-shimmer_1.55s_infinite_ease-in-out] after:content-['']" />

              <div className="grid gap-1 p-4">
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
      <section className={pageHeaderClass}>
        <div className="min-w-0">
          <h1 className="page-heading flex items-center gap-3">
            <span className="page-kicker-dot" aria-hidden="true" />
            {view === "favorites" ? "Favorites" : "Files"}
          </h1>

          <p className="page-description">
            Browse, search, and manage your files from one place.
          </p>
        </div>

        <div className={fileToolbarClass}>
          <div
            className={viewSwitcherClass}
            role="group"
            aria-label="File view"
          >
            <button
              type="button"
              aria-pressed={view === "all"}
              onClick={() => {
                setView("all");
                setCurrentPage(1);
              }}
              className={`${viewButtonClass} ${view === "all" ? "border-white/80 bg-white/70 text-[#145a99] shadow-[0_3px_12px_rgba(20,54,84,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)]" : "border-transparent bg-transparent text-[#557086] hover:bg-white/30 hover:text-[#194b75]"}`}
            >
              <FolderOpen aria-hidden="true" size={15} strokeWidth={1.8} />
              All files
            </button>

            <button
              type="button"
              aria-pressed={view === "favorites"}
              onClick={() => {
                setView("favorites");
                setCurrentPage(1);
              }}
              className={`${viewButtonClass} ${view === "favorites" ? "border-white/80 bg-white/70 text-[#ad6f12] shadow-[0_3px_12px_rgba(20,54,84,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)]" : "border-transparent bg-transparent text-[#557086] hover:bg-white/30 hover:text-[#194b75]"}`}
            >
              <Star
                aria-hidden="true"
                size={15}
                strokeWidth={1.8}
                className={view === "favorites" ? "fill-current text-[#e79a1b]" : ""}
              />
              Favorites
            </button>
          </div>

          <label className={searchFieldClass}>
            <Search aria-hidden="true" size={17} strokeWidth={1.8} />
            <span className="sr-only">Search files</span>

            <input
              type="search"
              className="w-full min-w-0 border-0 bg-transparent text-[10px] text-[#24445d] outline-none placeholder:text-[#98aab7]"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search files..."
              aria-label="Search files by name, type, or ID"
            />

            {searchQuery && (
              <button
                type="button"
                className="grid h-[25px] w-[25px] flex-none cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent text-[#8296a6] hover:bg-[#edf4f9] hover:text-[#527087]"
                aria-label="Clear file search"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
              >
                <X aria-hidden="true" size={15} strokeWidth={1.8} />
              </button>
            )}
          </label>

          <button
            type="button"
            onClick={() => setShowUploadDialog(true)}
            disabled={uploading}
            className="primary-action flex-none disabled:opacity-60 disabled:cursor-wait max-[760px]:min-h-[42px] max-[760px]:w-full"
          >
            <Upload aria-hidden="true" size={16} strokeWidth={1.8} />
            <span>{uploading ? "Uploading..." : "Upload files"}</span>
          </button>
        </div>

        <input
          ref={replaceInputRef}
          type="file"
          accept={SUPPORTED_FILE_ACCEPT}
          className="hidden"
          onChange={handleReplace}
        />
      </section>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={
          view === "favorites"
            ? "Filter favorite files by category"
            : "Filter files by category"
        }
      >
        {FILE_CATEGORY_FILTERS.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={categoryFilter === category}
            onClick={() => {
              setCategoryFilter(category);
              setCurrentPage(1);
            }}
            className={`secondary-action min-h-[32px] px-3 py-1 text-[9px] ${categoryFilter === category ? "!border-white/80 !bg-white/70 !text-[#145a99] shadow-[0_3px_12px_rgba(20,54,84,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)]" : ""}`}
          >
            {category}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}

      {successMessage && (
        <p role="status" className="glass-alert-success rounded-[11px] px-3 py-2 text-[10px] font-medium text-[#34734b]">
          {successMessage}
        </p>
      )}

      <section
        className="min-w-0"
        aria-label={view === "favorites" ? "Favorite files" : "Files"}
      >
        {files.length === 0 ? (
          <section className="surface flex min-h-[300px] flex-col items-center justify-center rounded-[18px] px-[22px] py-[38px] text-center">
            <span className="grid h-[62px] w-[62px] place-items-center rounded-[19px] border border-white/80 bg-white/50 text-[#1b74d3] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_6px_18px_rgba(26,54,80,0.06)] backdrop-blur-md">
              {view === "favorites" ? (
                <Star aria-hidden="true" size={29} strokeWidth={1.45} />
              ) : searchQuery ? (
                <Search aria-hidden="true" size={29} strokeWidth={1.45} />
              ) : (
                <FilePlus2 aria-hidden="true" size={29} strokeWidth={1.45} />
              )}
            </span>

            <h3 className="mt-4 mb-0 text-[15px] font-[650] text-[#29445d]">
              {view === "favorites"
                ? searchQuery
                  ? "No favorite files found"
                  : "No favorite files yet"
                : totalItems === 0 && !searchQuery.trim() && categoryFilter === "All"
                  ? "No files uploaded yet"
                  : categoryFilter !== "All" && searchQuery.trim()
                    ? "No files match these filters"
                    : categoryFilter !== "All"
                      ? `No ${categoryFilter.toLocaleLowerCase()} found`
                      : "No files match your search"}
            </h3>

            <p className="mt-[7px] mb-[18px] max-w-[390px] text-[10px] leading-[1.6] text-[#8497a7]">
              {view === "favorites"
                ? searchQuery
                  ? "Try a different filename, type, or ID."
                  : "Favorite a file to keep it close at hand."
                : totalItems === 0 && !searchQuery.trim() && categoryFilter === "All"
                  ? "Upload a supported image, document, video, audio file, or ZIP archive to start building your library."
                  : "Try changing your search terms."}
            </p>

            {view === "favorites" && !searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setView("all");
                  setCurrentPage(1);
                }}
                className="secondary-action"
              >
                <FolderOpen aria-hidden="true" size={16} strokeWidth={1.8} />
                Browse all files
              </button>
            )}

            {totalItems === 0 &&
              !searchQuery.trim() &&
              categoryFilter === "All" &&
              view === "all" && (
                <button
                  type="button"
                  onClick={() => setShowUploadDialog(true)}
                  className="primary-action"
                >
                  <Upload aria-hidden="true" size={16} strokeWidth={1.8} />
                  Upload your first file
                </button>
              )}
          </section>
        ) : (
          <FileCardGrid
            files={files}
            previewUrls={previewUrls}
            favoritePendingIds={favoritePendingIds}
            loadPreview={loadPreview}
            canManage={(file) => file.canManage}
            onFavoriteToggle={(file) => void toggleFavorite(file)}
            onReplace={openReplace}
            onDetails={(file) => void handleShowFileDetails(file)}
            onPreview={(file, source) => {
              setPreviewFile(file);
              setPreviewSource(source);
            }}
            onDownload={(file) => void handleDownload(file)}
            onDelete={(file) => void handleDelete(file.id)}
          />
        )}

        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            pageCount={pageCount}
            onPageChange={setCurrentPage}
          />
        )}
      </section>

      {fileDetails && (
        <FileDetailsDialog
          file={fileDetails}
          onClose={() => setFileDetails(null)}
        />
      )}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          src={previewSource ?? previewUrls[previewFile.id]}
          onClose={() => {
            setPreviewFile(null);
            setPreviewSource(undefined);
          }}
        />
      )}
      {showUploadDialog && (
        <MultiFileUploadDialog
          title="Upload files"
          description="Add multiple supported files to your personal library. Each file can be up to 10 MB."
          onUpload={(file) => {
            if (!account) throw new Error("Your session is unavailable. Sign in again.");
            return uploadFile(instance, account, file);
          }}
          onUploadingChange={setUploading}
          onComplete={async (successCount, failureCount) => {
            setError(null);
            setSuccessMessage(`Uploads finished: ${successCount} successful, ${failureCount} failed.`);
            if (successCount > 0) {
              setView("all");
              setCategoryFilter("All");
              setCurrentPage(1);
              await loadFiles("all", 1, "All");
            }
          }}
          onClose={() => setShowUploadDialog(false)}
        />
      )}
    </div>
  );
}
