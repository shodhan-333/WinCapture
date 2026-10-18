import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Images, Users } from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  deleteAlbum,
  getAlbum,
  getAlbumFiles,
  getAlbumMembers,
  getFilePreviewUrl,
  updateAlbum,
  uploadAlbumFile,
} from "../api/albumsApi";
import { ErrorBanner } from "@/shared/components/ui/ErrorBanner";
import { AlbumSharingPanel } from "@/features/albums/components/AlbumSharingPanel";
import { AlbumHeader } from "@/features/albums/components/AlbumHeader";
import { AlbumFilesSection } from "@/features/albums/components/AlbumFilesSection";
import {
  BulkDeleteDialog,
  FileDetailsDialog,
  FilePreviewModal,
  MultiFileUploadDialog,
  useFilePreviews,
} from "@/features/files";
import type { AlbumMemberResponse } from "@/features/albums";
import { useBulkSelection } from "@/shared/hooks/useBulkSelection";
import { useAuth } from "@/features/auth";

import type { AlbumResponse } from "@/features/albums";
import type { FileCategoryFilter, FileResponse } from "@/features/files";
import { getAccountKey } from "@/shared/utils/accountKey";
import {
  useAlbumFileActions,
  type AlbumBulkAction,
} from "@/features/albums/hooks/useAlbumFileActions";
import { useAlbumSharingActions } from "@/features/albums/hooks/useAlbumSharingActions";

const PAGE_SIZE = 12;

export function AlbumDetailPage() {
  const { instance } = useMsal();
  const navigate = useNavigate();

  const { account, user } = useAuth();
  const accountKey = getAccountKey(account);
  const { albumId } = useParams();

  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const albumNameInputRef = useRef<HTMLInputElement | null>(null);
  const loadRequestVersion = useRef(0);
  // Stores the file selected for replacement while the hidden file picker is open.
  const replaceTargetIdRef = useRef<number | null>(null);

  const [album, setAlbum] = useState<AlbumResponse | null>(null);
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<FileCategoryFilter>("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [fileDetails, setFileDetails] = useState<FileResponse | null>(null);
  const [previewFile, setPreviewFile] = useState<FileResponse | null>(null);
  const [previewSource, setPreviewSource] = useState<string | undefined>();

  const [members, setMembers] = useState<AlbumMemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberAccessError, setMemberAccessError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [deletingAlbum, setDeletingAlbum] = useState(false);
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
  const [bulkAction, setBulkAction] = useState<AlbumBulkAction>(null);

  const [albumNameDraft, setAlbumNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  useEffect(() => {
    if (editingName) albumNameInputRef.current?.focus();
  }, [editingName]);

  const numericAlbumId = Number(albumId ?? "0");
  const {
    memberEmail,
    setMemberEmail,
    canView,
    setCanView,
    canDownload,
    setCanDownload,
    handleAddMember,
    handleUpdateMember,
    handleRemoveMember,
  } = useAlbumSharingActions({
    instance,
    account,
    albumId: numericAlbumId,
    setMembers,
    setMemberAccessError,
  });

  const canManageAlbum = Boolean(
    album && user && (user.role === "Admin" || album.ownerId === user.userId),
  );

  const loadPreview = useCallback(
    async (file: FileResponse) => {
      if (!account) {
        throw new Error("An authenticated account is required.");
      }

      return getFilePreviewUrl(instance, account, file.id, numericAlbumId, canManageAlbum);
    },
    // Keep previews stable across MSAL object refreshes for the same identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountKey, canManageAlbum, instance, numericAlbumId],
  );

  // Keeps an image available for the album cover when it exists in the loaded files.
  const albumCoverFile = files.find((file) => file.contentType.startsWith("image/"));

  // Includes the cover in preview loading even if it is not in the current file list.
  const previewFiles = useMemo(
    () => [
      ...files,
      ...(albumCoverFile && !files.some((file) => file.id === albumCoverFile.id)
        ? [albumCoverFile]
        : []),
    ],
    [files, albumCoverFile],
  );

  const { previewUrls } = useFilePreviews(previewFiles, loadPreview);

  const albumCoverPreview =
    albumCoverFile && previewUrls[albumCoverFile.id] ? albumCoverFile : undefined;

  // Loads album details, the selected file page, and sharing settings for managers.
  const loadAlbumData = useCallback(async () => {
    const requestVersion = ++loadRequestVersion.current;
    if (!account || !Number.isFinite(numericAlbumId)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const albumResult = await getAlbum(instance, account, numericAlbumId);
      if (requestVersion !== loadRequestVersion.current) return;

      setAlbum(albumResult);
      setAlbumNameDraft(albumResult.albumName);

      const nextCanManageAlbum = user?.role === "Admin" || albumResult.ownerId === user?.userId;

      const fileResult = await getAlbumFiles(
        instance,
        account,
        numericAlbumId,
        currentPage,
        PAGE_SIZE,
        categoryFilter,
      );
      if (requestVersion !== loadRequestVersion.current) return;

      setFiles(fileResult.items);
      retain(fileResult.items.filter((file) => file.canManage).map((file) => file.id));
      setTotalFiles(fileResult.totalItems);
      setPageCount(fileResult.pageCount);
      setCurrentPage(fileResult.page);

      if (nextCanManageAlbum) {
        try {
          const albumMembers = await getAlbumMembers(instance, account, numericAlbumId);
          if (requestVersion !== loadRequestVersion.current) return;
          setMembers(albumMembers);
        } catch {
          if (requestVersion !== loadRequestVersion.current) return;
          setMembers([]);
          setError("Album opened, but sharing settings could not be loaded.");
        }
      } else {
        setMembers([]);
      }
    } catch (caughtError) {
      if (requestVersion !== loadRequestVersion.current) return;
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load album details.",
      );
    } finally {
      if (requestVersion === loadRequestVersion.current) {
        setLoading(false);
        setHasLoaded(true);
      }
    }
    // accountKey changes only when the signed-in identity changes; token refreshes reuse data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accountKey,
    instance,
    numericAlbumId,
    currentPage,
    categoryFilter,
    user?.role,
    user?.userId,
    retain,
  ]);

  useEffect(() => {
    cancelSelection();
  }, [accountKey, numericAlbumId, cancelSelection]);

  useEffect(() => {
    if (!canManageAlbum) cancelSelection();
  }, [canManageAlbum, cancelSelection]);

  useEffect(() => {
    if (!Number.isSafeInteger(numericAlbumId) || numericAlbumId <= 0) {
      setAlbum(null);
      setFiles([]);
      setTotalFiles(0);
      setMembers([]);
      setError("The album ID is invalid.");
      setLoading(false);
      return;
    }

    void loadAlbumData();
    return () => {
      loadRequestVersion.current += 1;
    };
  }, [loadAlbumData, numericAlbumId]);

  const selectedFiles = files.filter((file) => selectedIds.has(file.id));
  const {
    bulkPending,
    favoritePendingIds,
    toggleFavorite,
    handleDownload,
    handleDelete,
    runBulkAction,
    handleReplace,
    handleShowFileDetails,
  } = useAlbumFileActions({
    instance,
    account,
    albumId: numericAlbumId,
    selectedFiles,
    bulkAction,
    replaceTargetIdRef,
    reloadAlbum: loadAlbumData,
    removeSelected: remove,
    cancelSelection,
    setFiles,
    setFileDetails,
    setError,
    setSuccessMessage,
    clearBulkAction: () => setBulkAction(null),
  });
  const handleUpdateAlbum = async () => {
    if (!account || !Number.isFinite(numericAlbumId) || !albumNameDraft.trim()) {
      setError("Album name is required.");
      return;
    }

    try {
      setError(null);

      const updated = await updateAlbum(instance, account, numericAlbumId, {
        albumName: albumNameDraft.trim(),
      });

      setAlbum(updated);
      setAlbumNameDraft(updated.albumName);
      setEditingName(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update album.");
    }
  };

  const handleDeleteAlbum = async () => {
    if (!account || !album || deletingAlbum) {
      return;
    }

    if (!window.confirm(`Delete "${album.albumName}"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingAlbum(true);
      setError(null);

      await deleteAlbum(instance, account, album.id);
      navigate("/albums", { replace: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? `${caughtError.message} The album remains listed, so you can retry after resolving the issue.`
          : "Unable to delete album. You can retry after resolving the issue.",
      );
    } finally {
      setDeletingAlbum(false);
    }
  };

  if (loading && !hasLoaded) {
    return (
      <div className="app-page">
        <section className="skeleton-panel relative flex items-center gap-[17px] overflow-hidden rounded-[20px] p-[22px] max-[760px]:flex-wrap max-[760px]:p-[18px]">
          <div className="h-[78px] w-[95px] flex-none rounded-2xl bg-[#dce9f2]" />

          <div className="skeleton-content">
            <span className="skeleton-line skeleton-line-sm" />
            <span className="skeleton-line skeleton-line-lg" />
            <span className="skeleton-line skeleton-line-md" />
          </div>
        </section>

        <section className="grid grid-cols-3 gap-[17px]">
          {[1, 2, 3].map((item) => (
            <div key={item} className="surface h-[315px] rounded-[17px]" />
          ))}
        </section>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="app-page">
        <section role="alert" className="surface album-not-found">
          <span className="album-not-found-icon">
            <Images aria-hidden="true" size={28} strokeWidth={1.5} />
          </span>

          <h1>Album not found</h1>

          <p>{error ?? "The requested album could not be loaded."}</p>

          <Link to="/albums" className="primary-action">
            <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.8} />
            Back to albums
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="app-page gap-5">
      <div className="flex min-h-[22px]">
        <Link
          to="/albums"
          className="inline-flex items-center gap-[7px] text-[11px] font-semibold text-[#648199] transition-[color,transform] duration-[180ms] hover:-translate-x-px hover:text-[#176fca]"
        >
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.8} />
          Albums
        </Link>
      </div>

      <AlbumHeader
        album={album}
        totalFiles={totalFiles}
        albumCoverPreview={albumCoverPreview}
        coverUrl={albumCoverPreview ? previewUrls[albumCoverPreview.id] : undefined}
        canManageAlbum={canManageAlbum}
        editingName={editingName}
        albumNameDraft={albumNameDraft}
        uploading={uploading}
        deletingAlbum={deletingAlbum}
        albumNameInputRef={albumNameInputRef}
        replaceInputRef={replaceInputRef}
        onNameDraftChange={setAlbumNameDraft}
        onSaveName={() => void handleUpdateAlbum()}
        onCancelEditing={() => {
          setAlbumNameDraft(album.albumName);
          setEditingName(false);
        }}
        onEditName={() => setEditingName(true)}
        onUpload={() => setShowUploadDialog(true)}
        onDelete={() => void handleDeleteAlbum()}
        onReplaceChange={handleReplace}
      />
      {error && <ErrorBanner message={error} />}

      {successMessage && (
        <p
          role="status"
          className="glass-alert-success rounded-[11px] px-3 py-2 text-[10px] font-medium text-[#34734b]"
        >
          {successMessage}
        </p>
      )}

      <AlbumFilesSection
        files={files}
        previewUrls={previewUrls}
        favoritePendingIds={favoritePendingIds}
        loadPreview={loadPreview}
        canManageAlbum={canManageAlbum}
        categoryFilter={categoryFilter}
        currentPage={currentPage}
        pageCount={pageCount}
        totalFiles={totalFiles}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        bulkPending={bulkPending}
        onCategoryChange={(category) => {
          cancelSelection();
          setCategoryFilter(category);
          setCurrentPage(1);
        }}
        onStartSelection={startSelection}
        onCancelSelection={cancelSelection}
        onSelectAll={selectAll}
        onBulkAction={setBulkAction}
        onFavoriteToggle={(file) => void toggleFavorite(file)}
        onReplace={(file) => {
          replaceTargetIdRef.current = file.id;
          if (replaceInputRef.current) {
            replaceInputRef.current.value = "";
            replaceInputRef.current.click();
          }
        }}
        onDetails={(file) => void handleShowFileDetails(file)}
        onPreview={(file, source) => {
          setPreviewFile(file);
          setPreviewSource(source);
        }}
        onDownload={(file) => void handleDownload(file)}
        onDelete={(file) => void handleDelete(file.id)}
        onSelectionToggle={(file) => toggle(file.id)}
        onUploadFirstFile={() => setShowUploadDialog(true)}
        onPageChange={(page) => {
          cancelSelection();
          setCurrentPage(page);
        }}
      />
      {canManageAlbum && (
        <AlbumSharingPanel
          members={members}
          memberEmail={memberEmail}
          canView={canView}
          canDownload={canDownload}
          memberAccessError={memberAccessError}
          onMemberEmailChange={setMemberEmail}
          onCanViewChange={setCanView}
          onCanDownloadChange={setCanDownload}
          onAddMember={handleAddMember}
          onUpdateMember={handleUpdateMember}
          onRemoveMember={handleRemoveMember}
        />
      )}

      {!canManageAlbum && (
        <section className="surface flex items-center gap-[11px] rounded-[14px] px-[16px] py-[14px]">
          <span className="grid h-[36px] w-[36px] flex-none place-items-center rounded-[11px] border border-white/70 bg-[rgba(255,255,255,0.55)] text-[var(--accent)] shadow-sm backdrop-blur-sm">
            <Users aria-hidden="true" size={18} strokeWidth={1.8} />
          </span>

          <div className="min-w-0">
            <strong className="block text-[11px] font-semibold text-[#183955]">Shared album</strong>

            <p className="mt-[3px] text-[10px] text-[#658299]">
              You have access to this collection based on the permissions assigned to your account.
            </p>
          </div>
        </section>
      )}

      {fileDetails && <FileDetailsDialog file={fileDetails} onClose={() => setFileDetails(null)} />}

      {bulkAction && (
        <BulkDeleteDialog
          count={selectedFiles.length}
          title={
            bulkAction === "remove"
              ? `Remove ${selectedFiles.length} ${selectedFiles.length === 1 ? "file" : "files"} from this album?`
              : `Permanently delete ${selectedFiles.length} ${selectedFiles.length === 1 ? "file" : "files"}?`
          }
          description={
            bulkAction === "remove"
              ? "This removes only the album association. The file and its stored content remain in the uploader's library."
              : "This permanently deletes the selected file records and stored content, including favorites. This action cannot be undone."
          }
          confirmLabel={bulkAction === "remove" ? "Remove from album" : "Delete permanently"}
          pendingLabel={bulkAction === "remove" ? "Removing..." : "Deleting..."}
          destructive={bulkAction === "delete"}
          pending={bulkPending}
          onCancel={() => setBulkAction(null)}
          onConfirm={() => void runBulkAction()}
        />
      )}

      {/* Prefer the selected preview source; fall back to the cached preview URL. */}
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
      {showUploadDialog && canManageAlbum && (
        <MultiFileUploadDialog
          title="Add files to album"
          description={`Upload supported files to ${album?.albumName ?? "this album"}. Each file can be up to 10 MB.`}
          onUpload={(file) => {
            if (!account || !canManageAlbum || !Number.isFinite(numericAlbumId)) {
              throw new Error("You do not have permission to upload to this album.");
            }
            return uploadAlbumFile(instance, account, numericAlbumId, file);
          }}
          onUploadingChange={(isActive) => {
            setUploading(isActive);
            if (isActive) {
              setError(null);
              setSuccessMessage(null);
            }
          }}
          onComplete={async (successCount, failureCount) => {
            if (successCount > 0) await loadAlbumData();
            setSuccessMessage(
              `Uploads finished: ${successCount} successful, ${failureCount} failed.`,
            );
          }}
          onClose={() => setShowUploadDialog(false)}
        />
      )}
    </div>
  );
}
