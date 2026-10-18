import { useCallback, useEffect, useRef, useState } from "react";
import { FilePlus2, FolderOpen, ListChecks, Search, Star, Upload } from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { useLocation } from "react-router-dom";

import { uploadFile } from "../api/filesApi";
import { getFilePreviewUrlByPath } from "@/shared/api/previews";
import { ErrorBanner } from "@/shared/components/ui/ErrorBanner";
import { Pagination } from "@/shared/components/ui/Pagination";
import { SearchField } from "@/shared/components/ui/SearchField";
import { pageHeaderClass, pageHeaderSkeletonClass } from "@/shared/components/ui/uiClasses";
import { FileCardGrid } from "@/features/files/components/files/FileCardGrid";
import { FileDetailsDialog } from "@/features/files/components/files/FileDetailsDialog";
import { FilePreviewModal } from "@/features/files/components/files/FilePreviewModal";
import { BulkDeleteDialog } from "@/features/files/components/files/BulkDeleteDialog";
import { BulkSelectionToolbar } from "@/features/files/components/files/BulkSelectionToolbar";
import { MultiFileUploadDialog } from "@/features/files/components/files/MultiFileUploadDialog";
import { useFileFavorites } from "@/features/files/hooks/useFileFavorites";
import { useFilePreviews } from "@/features/files/hooks/useFilePreviews";
import { useBulkSelection } from "@/shared/hooks/useBulkSelection";
import { useAuth } from "@/features/auth";
import type { FileResponse, FileView } from "@/features/files/types/file";
import { getAccountKey } from "@/shared/utils/accountKey";
import { getAdminContentScope } from "@/shared/utils/adminContentScope";
import { useFileBulkActions, type BulkAction } from "@/features/files/hooks/useFileBulkActions";
import {
  FILE_CATEGORY_FILTERS,
  type FileCategoryFilter,
  SUPPORTED_FILE_ACCEPT,
} from "@/features/files/constants/fileSupport";
import { useFileActions } from "@/features/files/hooks/useFileActions";
import { useFilesData } from "@/features/files/hooks/useFilesData";

const fileToolbarClass =
  "flex flex-wrap items-center justify-end gap-2 max-[960px]:w-full max-[960px]:justify-start max-[760px]:grid max-[760px]:grid-cols-1";
const viewSwitcherClass = "glass-toolbar inline-flex rounded-[12px] p-[3px] max-[760px]:w-full";
const viewButtonClass =
  "inline-flex min-h-[34px] cursor-pointer items-center justify-center gap-[6px] rounded-lg border px-[11px] text-[10px] font-semibold transition-[color,background,box-shadow,border-color] duration-[160ms]";
const searchFieldClass =
  "glass-toolbar flex min-h-10 w-[min(280px,100%)] items-center gap-2 rounded-[12px] px-[11px] text-[#71879a] focus-within:border-[rgba(30,120,214,0.65)] focus-within:shadow-[0_0_0_3px_rgba(30,120,214,0.14)] max-[760px]:w-full";

export function FilesPage() {
  const { instance } = useMsal();
  const { account, user } = useAuth();
  const location = useLocation();
  const routeParams = new URLSearchParams(location.search);
  const isAdminAllContent =
    user?.role === "Admin" &&
    (routeParams.get("scope") === "all" || getAdminContentScope() === "all");
  const routeFileId = Number(routeParams.get("fileId")) || null;
  const accountKey = getAccountKey(account);

  // Hidden replacement input opens the native file picker from a file card.
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  // Keep the replacement target while the native file picker is open.
  const replaceTargetIdRef = useRef<number | null>(null);
  const [view, setView] = useState<FileView>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(() => routeParams.get("search") ?? "");
  const [focusedFileId, setFocusedFileId] = useState<number | null>(routeFileId);
  const [categoryFilter, setCategoryFilter] = useState<FileCategoryFilter>("All");
  const [fileDetails, setFileDetails] = useState<FileResponse | null>(null);
  const [previewFile, setPreviewFile] = useState<FileResponse | null>(null);
  const [previewSource, setPreviewSource] = useState<string | undefined>();
  const {
    selectionMode,
    selectedIds,
    startSelection,
    cancelSelection,
    toggle,
    selectAll,
    remove,
    retain,
  } = useBulkSelection<number>();
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);

  const { files, setFiles, totalItems, pageCount, loading, hasLoaded, error, setError, loadFiles } =
    useFilesData({
      instance,
      account,
      view,
      currentPage,
      searchQuery,
      categoryFilter,
      isAdminAllContent,
      routeFileId,
      retain,
      setFocusedFileId,
      setCurrentPage,
    });

  const loadPreview = useCallback(
    async (file: FileResponse) => {
      if (!account) {
        throw new Error("An authenticated account is required.");
      }

      // Shared album viewers use the preview route instead of the download route.
      const previewPath =
        file.downloadUrl.startsWith("/api/albums/") && !file.canManage
          ? file.downloadUrl.replace(/\/download$/, "/preview")
          : file.downloadUrl;

      return getFilePreviewUrlByPath(instance, account, previewPath, file.contentType);
    },
    // Keep preview references stable across MSAL object refreshes for the same identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountKey, instance],
  );

  const { previewUrls } = useFilePreviews(files, loadPreview);

  useEffect(() => {
    cancelSelection();
  }, [accountKey, cancelSelection]);

  const selectableFiles = view === "favorites" ? files : files.filter((file) => file.canManage);
  const selectedFiles = selectableFiles.filter((file) => selectedIds.has(file.id));
  const allSelectedFilesManageable =
    selectedFiles.length > 0 && selectedFiles.every((file) => file.canManage);

  const { handleReplace, handleDownload, handleDelete, handleShowFileDetails, openReplace } =
    useFileActions({
      instance,
      account,
      view,
      loadFiles,
      removeSelected: remove,
      replaceInputRef,
      replaceTargetIdRef,
      setError,
      setSuccessMessage,
      setFileDetails,
    });

  const { bulkPending, runBulkAction } = useFileBulkActions({
    instance,
    account,
    selectedFiles,
    bulkAction,
    view,
    currentPage,
    loadFiles,
    removeSelected: remove,
    cancelSelection,
    setError,
    setSuccessMessage,
    clearBulkAction: () => setBulkAction(null),
  });

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
        remove([file.id]);
        // Refresh the list and pagination totals after removing the favorite.
        void loadFiles(view, currentPage);
      }
    },
    [view, currentPage, remove, loadFiles, setFiles],
  );

  const handleFavoriteError = useCallback((message: string) => setError(message), [setError]);

  const { pendingIds: favoritePendingIds, toggleFavorite } = useFileFavorites({
    instance,
    account,
    onSuccess: handleFavoriteSuccess,
    onError: handleFavoriteError,
  });

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
            <div key={item} className="surface overflow-hidden rounded-[17px]">
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
            {view === "favorites" ? "Favorites" : isAdminAllContent ? "All Files" : "Files"}
          </h1>

          <p className="page-description">
            {isAdminAllContent
              ? "Browse and manage files across all users."
              : "Browse, search, and manage your files from one place."}
          </p>
        </div>

        <div className={fileToolbarClass}>
          {!isAdminAllContent && (
            <div className={viewSwitcherClass} role="group" aria-label="File view">
              <button
                type="button"
                aria-pressed={view === "all"}
                onClick={() => {
                  cancelSelection();
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
                  cancelSelection();
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
          )}

          <SearchField
            value={searchQuery}
            onChange={(value) => {
              cancelSelection();
              setSearchQuery(value);
              setCurrentPage(1);
            }}
            placeholder="Search files..."
            ariaLabel="Search files by name, type, or ID"
            className={searchFieldClass}
            inputClassName="w-full min-w-0 border-0 bg-transparent text-[10px] text-[#24445d] outline-none placeholder:text-[#98aab7]"
            iconSize={17}
            iconStrokeWidth={1.8}
            clearLabel="Clear file search"
            onClear={() => {
              cancelSelection();
              setSearchQuery("");
              setCurrentPage(1);
            }}
          />

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

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label={
            view === "favorites" ? "Filter favorite files by category" : "Filter files by category"
          }
        >
          {FILE_CATEGORY_FILTERS.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={categoryFilter === category}
              onClick={() => {
                cancelSelection();
                setCategoryFilter(category);
                setCurrentPage(1);
              }}
              className={`secondary-action min-h-[32px] px-3 py-1 text-[9px] ${categoryFilter === category ? "!border-white/80 !bg-white/70 !text-[#145a99] shadow-[0_3px_12px_rgba(20,54,84,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)]" : ""}`}
            >
              {category}
            </button>
          ))}
        </div>

        {!selectionMode && selectableFiles.length > 0 && (
          <button
            type="button"
            onClick={startSelection}
            className="secondary-action inline-flex min-h-[32px] flex-none items-center gap-1.5 rounded-[9px] border border-white/75 bg-white/45 px-3 py-1 text-[9px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-md transition-colors hover:bg-white/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus-ring)]"
          >
            <ListChecks aria-hidden="true" size={14} strokeWidth={1.8} />
            Select files
          </button>
        )}
      </div>
      {selectionMode && (
        <BulkSelectionToolbar
          selectedCount={selectedIds.size}
          visibleCount={selectableFiles.length}
          disabled={bulkPending}
          onSelectAll={() => selectAll(selectableFiles.map((file) => file.id))}
          onCancel={cancelSelection}
          actions={
            view === "favorites" ? (
              <>
                <button
                  type="button"
                  disabled={!selectedIds.size || bulkPending}
                  onClick={() => setBulkAction("unfavorite")}
                  className="primary-action disabled:opacity-50"
                >
                  Remove from Favorites
                </button>
                {selectedIds.size > 0 && allSelectedFilesManageable && (
                  <button
                    type="button"
                    disabled={bulkPending}
                    onClick={() => setBulkAction("delete")}
                    className="danger-gradient-action inline-flex min-h-[36px] items-center rounded-[10px] px-3 text-[10px] font-semibold text-white disabled:opacity-50"
                  >
                    Delete permanently
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                disabled={!selectedIds.size || bulkPending}
                onClick={() => setBulkAction("delete")}
                className="danger-gradient-action inline-flex min-h-[36px] items-center rounded-[10px] px-3 text-[10px] font-semibold text-white disabled:opacity-50"
              >
                Delete selected
              </button>
            )
          }
        />
      )}

      {error && <ErrorBanner message={error} />}

      {successMessage && (
        <p
          role="status"
          className="glass-alert-success rounded-[11px] px-3 py-2 text-[10px] font-medium text-[#34734b]"
        >
          {successMessage}
        </p>
      )}

      <section className="min-w-0" aria-label={view === "favorites" ? "Favorite files" : "Files"}>
        {files.length === 0 ? (
          <section className="surface flex min-h-[300px] flex-col items-center justify-center rounded-[18px] px-[22px] py-[38px] text-center">
            <span className="grid h-[62px] w-[62px] place-items-center rounded-[19px] border border-white/80 bg-white/50 text-[var(--accent)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_6px_18px_rgba(26,54,80,0.06)] backdrop-blur-md">
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
            selectionMode={selectionMode}
            selectionDisabled={bulkPending}
            focusedFileId={focusedFileId}
            selectedIds={selectedIds}
            selectionEligible={(file) => view === "favorites" || file.canManage}
            onSelectionToggle={(file) => toggle(file.id)}
          />
        )}

        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            pageCount={pageCount}
            onPageChange={(page) => {
              cancelSelection();
              setCurrentPage(page);
            }}
          />
        )}
      </section>

      {fileDetails && <FileDetailsDialog file={fileDetails} onClose={() => setFileDetails(null)} />}

      {bulkAction && (
        <BulkDeleteDialog
          count={selectedFiles.length}
          title={
            bulkAction === "unfavorite"
              ? `Remove ${selectedFiles.length} ${selectedFiles.length === 1 ? "file" : "files"} from Favorites?`
              : `Permanently delete ${selectedFiles.length} ${selectedFiles.length === 1 ? "file" : "files"}?`
          }
          description={
            bulkAction === "unfavorite"
              ? "This removes only your Favorites entries. The underlying files will remain available."
              : "This permanently deletes the selected files and their stored content. This action cannot be undone."
          }
          confirmLabel={
            bulkAction === "unfavorite" ? "Remove from Favorites" : "Delete permanently"
          }
          pendingLabel={bulkAction === "unfavorite" ? "Removing…" : "Deleting…"}
          destructive={bulkAction === "delete"}
          pending={bulkPending}
          onCancel={() => setBulkAction(null)}
          onConfirm={() => void runBulkAction()}
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
          description="Add multiple supported files to your personal library"
          onUpload={(file) => {
            if (!account) throw new Error("Your session is unavailable. Sign in again.");
            return uploadFile(instance, account, file);
          }}
          onUploadingChange={setUploading}
          onComplete={async (successCount, failureCount) => {
            setError(null);
            setSuccessMessage(
              `Uploads finished: ${successCount} successful, ${failureCount} failed.`,
            );
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
