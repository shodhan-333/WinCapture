import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Edit3,
  Images,
  Link2,
  Save,
  Share2,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  addAlbumMember,
  deleteAlbum,
  deleteAlbumFile,
  removeAlbumFileAssociation,
  downloadAlbumFile,
  getAlbum,
  getAlbumFile,
  getAlbumFiles,
  getAlbumMembers,
  getFilePreviewUrl,
  removeAlbumMember,
  replaceAlbumFile,
  updateAlbum,
  updateAlbumMember,
  uploadAlbumFile,
} from "../api/apiClient";
import ErrorBanner from "../components/ui/ErrorBanner";
import Pagination from "../components/ui/Pagination";
import FileCardGrid from "../components/files/FileCardGrid";
import FileDetailsDialog from "../components/files/FileDetailsDialog";
import FilePreviewModal from "../components/files/FilePreviewModal";
import BulkDeleteDialog from "../components/files/BulkDeleteDialog";
import BulkSelectionToolbar from "../components/files/BulkSelectionToolbar";
import MultiFileUploadDialog from "../components/files/MultiFileUploadDialog";
import useFileFavorites from "../hooks/useFileFavorites";
import useFilePreviews from "../hooks/useFilePreviews";
import useBulkSelection from "../hooks/useBulkSelection";
import { useAuth } from "../context/AuthContext";

import type { AlbumMemberResponse, AlbumResponse } from "../types/album";
import type { FileResponse } from "../types/file";
import {
  FILE_CATEGORY_FILTERS,
  SUPPORTED_FILE_ACCEPT,
  validateUploadFile,
  type FileCategoryFilter,
} from "../constants/fileSupport";
import { formatDate } from "../utils/formatters";
import { getAccountKey } from "../utils/accountKey";

const PAGE_SIZE = 12;
type AlbumBulkAction = "remove" | "delete" | null;

const sharePanelClass = "min-w-0 p-5 max-[760px]:p-[17px] max-[520px]:p-[14px]";

const permissionToggleClass =
  "inline-flex h-6 min-w-[46px] cursor-pointer items-center justify-center gap-[4px] rounded-full border border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.45)] px-[7px] text-[9px] font-bold text-[#648096] shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-md transition-[color,background,border-color] duration-[180ms] disabled:opacity-[0.56]";

const memberPermissionClass =
  "inline-flex min-h-[36px] cursor-pointer items-center justify-center gap-1 rounded-[8px] border px-[11px] !text-[11px] !font-semibold transition-[color,background,border-color,box-shadow] duration-[160ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3787d4] disabled:cursor-not-allowed disabled:opacity-[0.68]";

export default function AlbumDetailPage() {
  const { instance } = useMsal();
  const navigate = useNavigate();

  const { account, user } = useAuth();
  const accountKey = getAccountKey(account);
  const { albumId } = useParams();

  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const loadRequestVersion = useRef(0);
  // Stores the file selected for replacement while the hidden file picker is open.
  const replaceTargetIdRef = useRef<number | null>(null);

  const [album, setAlbum] = useState<AlbumResponse | null>(null);
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [categoryFilter, setCategoryFilter] =
    useState<FileCategoryFilter>("All");
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
  const [bulkPending, setBulkPending] = useState(false);

  const [memberEmail, setMemberEmail] = useState("");
  const [canView, setCanView] = useState(true);
  const [canDownload, setCanDownload] = useState(true);

  const [albumNameDraft, setAlbumNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);

  const numericAlbumId = Number(albumId ?? "0");

  const canManageAlbum = Boolean(
    album && user && (user.role === "Admin" || album.ownerId === user.userId),
  );

  const loadPreview = useCallback(
    async (file: FileResponse) => {
      if (!account) {
        throw new Error("An authenticated account is required.");
      }

      return getFilePreviewUrl(
        instance,
        account,
        file.id,
        numericAlbumId,
        canManageAlbum,
      );
    },
    [accountKey, canManageAlbum, instance, numericAlbumId],
  );

  // Keeps an image available for the album cover when it exists in the loaded files.
  const albumCoverFile = files.find((file) =>
    file.contentType.startsWith("image/"),
  );

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
    albumCoverFile && previewUrls[albumCoverFile.id]
      ? albumCoverFile
      : undefined;

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

      const nextCanManageAlbum =
        user?.role === "Admin" || albumResult.ownerId === user?.userId;

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
      retain(
        fileResult.items
          .filter((file) => file.canManage)
          .map((file) => file.id),
      );
      setTotalFiles(fileResult.totalItems);
      setPageCount(fileResult.pageCount);
      setCurrentPage(fileResult.page);

      if (nextCanManageAlbum) {
        try {
          const albumMembers = await getAlbumMembers(
            instance,
            account,
            numericAlbumId,
          );
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
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load album details.",
      );
    } finally {
      if (requestVersion === loadRequestVersion.current) {
        setLoading(false);
        setHasLoaded(true);
      }
    }
  }, [
    accountKey,
    instance,
    numericAlbumId,
    currentPage,
    categoryFilter,
    user?.role,
    user?.userId,
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

  const handleFavoriteSuccess = useCallback(
    (file: FileResponse, nextFavorite: boolean) => {
      setFiles((previous) =>
        previous.map((currentFile) =>
          currentFile.id === file.id
            ? {
                ...currentFile,
                isFavorite: nextFavorite,
              }
            : currentFile,
        ),
      );
    },
    [],
  );

  const handleFavoriteError = useCallback((message: string) => {
    setError(message);
  }, []);

  const { pendingIds: favoritePendingIds, toggleFavorite } = useFileFavorites({
    instance,
    account,
    onSuccess: handleFavoriteSuccess,
    onError: handleFavoriteError,
  });

  const handleDownload = async (file: FileResponse) => {
    if (!account || !Number.isFinite(numericAlbumId)) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);

      await downloadAlbumFile(
        instance,
        account,
        numericAlbumId,
        file.id,
        file.originalFileName,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Download failed.",
      );
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!account || !Number.isFinite(numericAlbumId)) {
      return;
    }

    try {
      setError(null);

      const result = await deleteAlbumFile(
        instance,
        account,
        numericAlbumId,
        fileId,
      );

      remove([fileId]);
      if (result?.storageCleanupComplete === false)
        setSuccessMessage(
          "The file record was deleted, but its stored content needs cleanup reconciliation.",
        );

      await loadAlbumData();
    } catch (caughtError) {
      // Leaves the file visible when deletion fails so the user can retry.
      setError(
        caughtError instanceof Error
          ? `${caughtError.message} The file remains listed, so you can retry after resolving the issue.`
          : "Delete failed. The file remains listed, so you can retry after resolving the issue.",
      );
    }
  };

  const runBulkAction = async () => {
    if (
      !account ||
      !Number.isFinite(numericAlbumId) ||
      !bulkAction ||
      bulkPending ||
      !selectedFiles.length
    )
      return;
    setBulkPending(true);
    setError(null);
    const results = await Promise.all(
      selectedFiles.map(async (file) => {
        try {
          if (bulkAction === "remove") {
            await removeAlbumFileAssociation(
              instance,
              account,
              numericAlbumId,
              file.id,
            );
            return { id: file.id, ok: true as const, cleanupComplete: true };
          }
          const deletion = await deleteAlbumFile(
            instance,
            account,
            numericAlbumId,
            file.id,
          );
          return {
            id: file.id,
            ok: true as const,
            cleanupComplete: deletion?.storageCleanupComplete !== false,
          };
        } catch {
          return { id: file.id, ok: false as const };
        }
      }),
    );
    const succeeded = results
      .filter((result) => result.ok)
      .map((result) => result.id);
    const failedCount = results.length - succeeded.length;
    const cleanupWarnings = results.filter(
      (result) => result.ok && !result.cleanupComplete,
    ).length;
    const failedNames = results
      .filter((result) => !result.ok)
      .map(
        (result) =>
          selectedFiles.find((file) => file.id === result.id)?.originalFileName,
      )
      .filter(Boolean);
    remove(succeeded);
    const failureSummary = failedCount
      ? `${succeeded.length} completed; ${failedCount} failed (${failedNames.join(", ")}). Failed files that remain available are selected for review or retry.`
      : null;
    const cleanupNames = results
      .filter((result) => result.ok && !result.cleanupComplete)
      .map(
        (result) =>
          selectedFiles.find((file) => file.id === result.id)?.originalFileName,
      )
      .filter(Boolean);
    setSuccessMessage(
      succeeded.length
        ? `${succeeded.length} ${bulkAction === "remove" ? `file${succeeded.length === 1 ? "" : "s"} removed from this album. The files remain in their owners’ libraries.` : `file${succeeded.length === 1 ? "" : "s"} permanently deleted.`}${cleanupWarnings ? ` Storage cleanup needs reconciliation for: ${cleanupNames.join(", ")}. The file records are already removed.` : ""}`
        : null,
    );
    setBulkAction(null);
    if (!failedCount) cancelSelection();
    await loadAlbumData();
    if (failureSummary) setError(failureSummary);
    setBulkPending(false);
  };

  const selectedFiles = files.filter((file) => selectedIds.has(file.id));

  const handleReplace = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    // The hidden file picker does not identify the file being replaced.
    const fileId = replaceTargetIdRef.current;

    if (
      !selectedFile ||
      !account ||
      !Number.isFinite(numericAlbumId) ||
      fileId === null
    ) {
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

      await replaceAlbumFile(
        instance,
        account,
        numericAlbumId,
        fileId,
        selectedFile,
      );

      setSuccessMessage(`${selectedFile.name} replaced successfully.`);

      await loadAlbumData();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Replace failed.",
      );
    } finally {
      replaceTargetIdRef.current = null;
      event.target.value = "";
    }
  };

  const handleUpdateAlbum = async () => {
    if (
      !account ||
      !Number.isFinite(numericAlbumId) ||
      !albumNameDraft.trim()
    ) {
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
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update album.",
      );
    }
  };

  const handleDeleteAlbum = async () => {
    if (!account || !album || deletingAlbum) {
      return;
    }

    if (
      !window.confirm(`Delete "${album.albumName}"? This cannot be undone.`)
    ) {
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

  const handleShowFileDetails = async (file: FileResponse) => {
    if (!account) {
      return;
    }

    try {
      setError(null);

      setFileDetails(
        await getAlbumFile(instance, account, numericAlbumId, file.id),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load file details.",
      );
    }
  };

  const handleAddMember = async () => {
    if (!account || !Number.isFinite(numericAlbumId) || !memberEmail.trim()) {
      setMemberAccessError("An email address is required to share the album.");
      return;
    }

    try {
      setMemberAccessError(null);

      await addAlbumMember(instance, account, numericAlbumId, {
        email: memberEmail.trim(),
        canView,
        canDownload,
      });

      setMemberEmail("");
      setCanView(true);
      setCanDownload(true);

      setMembers(await getAlbumMembers(instance, account, numericAlbumId));
    } catch (caughtError) {
      setMemberAccessError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to share album.",
      );
    }
  };

  const handleUpdateMember = async (
    userId: number,
    nextView: boolean,
    nextDownload: boolean,
  ) => {
    if (!account || !Number.isFinite(numericAlbumId)) {
      return;
    }

    try {
      setMemberAccessError(null);

      await updateAlbumMember(instance, account, numericAlbumId, userId, {
        canView: nextView,
        canDownload: nextDownload,
      });

      // Download permission also requires view permission.
      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.userId === userId
            ? {
                ...member,
                canView: nextView || nextDownload,
                canDownload: nextDownload,
              }
            : member,
        ),
      );
    } catch (caughtError) {
      setMemberAccessError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update member access.",
      );
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!account || !Number.isFinite(numericAlbumId)) {
      return;
    }

    try {
      setMemberAccessError(null);

      await removeAlbumMember(instance, account, numericAlbumId, userId);

      setMembers((currentMembers) =>
        currentMembers.filter((member) => member.userId !== userId),
      );
    } catch (caughtError) {
      setMemberAccessError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to revoke access.",
      );
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

      <section className="surface relative flex items-center gap-3 overflow-hidden rounded-[16px] p-4 max-[760px]:flex-wrap max-[760px]:p-3">
        <div className="relative grid h-[64px] w-[78px] flex-none place-items-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.55),transparent_35%),linear-gradient(145deg,rgba(215,238,255,0.7)_0%,rgba(180,218,250,0.5)_49%,rgba(215,235,250,0.65)_100%)] max-[520px]:h-[54px] max-[520px]:w-[66px]">
          {albumCoverPreview ? (
            <img
              src={previewUrls[albumCoverPreview.id]}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <>
              <span className="absolute right-[-45px] top-[-68px] h-[115px] w-[115px] rounded-full bg-[rgba(75,158,237,0.24)]" />
              <span className="absolute bottom-[-52px] left-[-36px] h-[90px] w-[90px] rounded-full bg-[rgba(255,255,255,0.36)]" />

              <span className="relative z-[1] grid h-12 w-12 place-items-center rounded-[14px] border border-white/80 bg-white/55 text-[#1b74d3] shadow-[0_8px_20px_rgba(26,54,80,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md max-[520px]:h-[39px] max-[520px]:w-[39px] max-[520px]:rounded-xl">
                <Images aria-hidden="true" size={31} strokeWidth={1.45} />
              </span>
            </>
          )}
        </div>

        <div className="min-w-0 flex-1 basis-0 max-[760px]:basis-[calc(100%-112px)] max-[520px]:basis-[calc(100%-92px)]">
          <div className="page-kicker">
            <span className="page-kicker-dot" />
            Album collection
          </div>

          {editingName && canManageAlbum ? (
            <div className="mt-[6px] flex max-w-[650px] items-center gap-[7px] max-[760px]:flex-wrap">
              <label htmlFor="album-name" className="sr-only">
                Album name
              </label>

              <input
                id="album-name"
                value={albumNameDraft}
                onChange={(event) => setAlbumNameDraft(event.target.value)}
                className="field min-w-0 flex-1 max-[760px]:w-full max-[760px]:basis-full"
                maxLength={200}
                autoFocus
              />

              <button
                type="button"
                onClick={() => void handleUpdateAlbum()}
                className="primary-action compact-action"
              >
                <Save aria-hidden="true" size={15} strokeWidth={1.8} />
                Save
              </button>

              <button
                type="button"
                onClick={() => {
                  setAlbumNameDraft(album.albumName);
                  setEditingName(false);
                }}
                className="secondary-action compact-action"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 max-[520px]:items-start">
              <h1 className="mt-[5px] mb-0 overflow-hidden text-ellipsis whitespace-nowrap text-[24px] leading-[1.18] font-bold tracking-[-0.035em] text-[#123653] max-[760px]:text-[21px] max-[520px]:text-[18px]">
                {album.albumName}
              </h1>

              {canManageAlbum && (
                <button
                  type="button"
                  className="grid h-[31px] w-[31px] flex-none place-items-center rounded-[9px] border border-white/70 bg-[rgba(255,255,255,0.5)] text-[#4f6e86] backdrop-blur-sm transition-[color,background,border-color] duration-[180ms] hover:border-white/90 hover:bg-white/75 hover:text-[#1a70cb] max-[520px]:mt-[3px]"
                  onClick={() => setEditingName(true)}
                  aria-label="Edit album name"
                  title="Edit album name"
                >
                  <Edit3 aria-hidden="true" size={16} strokeWidth={1.8} />
                </button>
              )}
            </div>
          )}

          <p className="mt-[7px] mb-0 text-[11px] text-[#71889c]">
            {totalFiles} {totalFiles === 1 ? "file" : "files"}
          </p>

          <div className="mt-[13px] flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-[5px] rounded-full border border-white/60 bg-[rgba(255,255,255,0.5)] px-2 py-[5px] text-[8px] font-semibold text-[#4e6c84] shadow-sm backdrop-blur-sm max-[520px]:gap-[5px] max-[520px]:text-[7px]">
              <UserPlus aria-hidden="true" size={14} strokeWidth={1.8} />
              {album.ownerName}
            </span>

            <span className="inline-flex items-center gap-[5px] rounded-full border border-white/60 bg-[rgba(255,255,255,0.5)] px-2 py-[5px] text-[8px] font-semibold text-[#4e6c84] shadow-sm backdrop-blur-sm max-[520px]:gap-[5px] max-[520px]:text-[7px]">
              <CalendarDays aria-hidden="true" size={14} strokeWidth={1.8} />
              {formatDate(album.createdAt)}
            </span>

            {album.updatedAt && (
              <span className="inline-flex items-center gap-[5px] rounded-full border border-white/60 bg-[rgba(255,255,255,0.5)] px-2 py-[5px] text-[8px] font-semibold text-[#4e6c84] shadow-sm backdrop-blur-sm max-[520px]:gap-[5px] max-[520px]:text-[7px]">
                Updated {formatDate(album.updatedAt)}
              </span>
            )}
          </div>
        </div>

        {canManageAlbum && (
          <div className="flex flex-none items-center gap-2 self-center max-[760px]:ml-auto max-[520px]:ml-0 max-[520px]:w-full">
            <button
              type="button"
              onClick={() => setShowUploadDialog(true)}
              disabled={uploading || deletingAlbum}
              className="primary-action flex-none justify-center disabled:opacity-60 disabled:cursor-wait max-[520px]:min-w-0 max-[520px]:flex-1"
            >
              <Upload aria-hidden="true" size={16} strokeWidth={1.8} />
              <span>{uploading ? "Adding..." : "Add files"}</span>
            </button>

            <button
              type="button"
              onClick={() => void handleDeleteAlbum()}
              disabled={deletingAlbum || uploading}
              aria-label="Delete album"
              title="Delete album"
              className="danger-gradient-action inline-flex h-9 flex-none cursor-pointer items-center justify-center gap-[7px] rounded-[10px] px-3 text-[10px] font-semibold transition-[transform,box-shadow] duration-[180ms] disabled:cursor-wait disabled:opacity-60 max-[520px]:min-w-0 max-[520px]:flex-1"
            >
              <Trash2 aria-hidden="true" size={15} strokeWidth={1.8} />
              <span>{deletingAlbum ? "Deleting..." : "Delete album"}</span>
            </button>
          </div>
        )}

        <input
          ref={replaceInputRef}
          type="file"
          accept={SUPPORTED_FILE_ACCEPT}
          className="hidden"
          onChange={handleReplace}
        />
      </section>

      {error && <ErrorBanner message={error} />}

      {successMessage && (
        <p
          role="status"
          className="glass-alert-success rounded-[11px] px-3 py-2 text-[10px] font-medium text-[#34734b]"
        >
          {successMessage}
        </p>
      )}

      <section className="min-w-0">
        <div className="mb-[15px] flex items-end justify-between gap-[18px]">
          <div>
            <p className="dashboard-panel-kicker">Collection content</p>

            <h2 className="mt-1 mb-0 text-[16px] leading-[1.25] font-[650] tracking-[-0.025em] text-[#163855]">
              Files
            </h2>
          </div>
        </div>

        <div
          className="mb-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter album files by category"
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
              className={`secondary-action min-h-[32px] px-3 py-1 text-[9px] ${
                categoryFilter === category
                  ? "!border-white/80 !bg-white/70 !text-[#145a99] shadow-[0_3px_12px_rgba(20,54,84,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)]"
                  : ""
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {canManageAlbum && !selectionMode && files.length > 0 && (
          <button
            type="button"
            onClick={startSelection}
            className="secondary-action mb-4"
          >
            Select files
          </button>
        )}
        {canManageAlbum && selectionMode && (
          <BulkSelectionToolbar
            selectedCount={selectedIds.size}
            visibleCount={files.length}
            disabled={bulkPending}
            onSelectAll={() =>
              selectAll(
                files.filter((file) => file.canManage).map((file) => file.id),
              )
            }
            onCancel={cancelSelection}
            actions={
              <>
                <button
                  type="button"
                  disabled={!selectedIds.size || bulkPending}
                  onClick={() => setBulkAction("remove")}
                  className="primary-action disabled:opacity-50"
                >
                  Remove from album
                </button>
                <button
                  type="button"
                  disabled={!selectedIds.size || bulkPending}
                  onClick={() => setBulkAction("delete")}
                  className="danger-gradient-action inline-flex min-h-[36px] items-center rounded-[10px] px-3 text-[10px] font-semibold text-white disabled:opacity-50"
                >
                  Delete permanently
                </button>
              </>
            }
          />
        )}

        <FileCardGrid
          files={files}
          previewUrls={previewUrls}
          favoritePendingIds={favoritePendingIds}
          loadPreview={loadPreview}
          canManage={canManageAlbum}
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
          selectionMode={selectionMode && canManageAlbum}
          selectionDisabled={bulkPending}
          selectedIds={selectedIds}
          selectionEligible={(file) => file.canManage}
          onSelectionToggle={(file) => toggle(file.id)}
          empty={
            <section className="surface flex min-h-[300px] flex-col items-center justify-center rounded-[18px] px-[22px] py-[38px] text-center">
              <span className="grid h-[62px] w-[62px] place-items-center rounded-[19px] bg-[#e7f3ff] text-[#287dd7] shadow-[inset_0_1px_rgba(255,255,255,0.72),0_7px_18px_rgba(45,111,176,0.06)]">
                <Upload aria-hidden="true" size={25} strokeWidth={1.5} />
              </span>

              <h3 className="mt-4 mb-0 text-[15px] font-[650] text-[#29445d]">
                {totalFiles === 0
                  ? "No files in this album"
                  : `No ${categoryFilter.toLocaleLowerCase()} found`}
              </h3>

              <p className="mt-[7px] mb-[18px] max-w-[390px] text-[10px] leading-[1.6] text-[#8497a7]">
                {totalFiles === 0
                  ? "Add images, documents, videos, audio files, or ZIP archives to start building this collection."
                  : `There are no ${categoryFilter.toLocaleLowerCase()} in this album. Try another category or select All.`}
              </p>

              {canManageAlbum && totalFiles === 0 && (
                <button
                  type="button"
                  onClick={() => setShowUploadDialog(true)}
                  className="primary-action"
                >
                  <Upload aria-hidden="true" size={16} strokeWidth={1.8} />
                  Add your first file
                </button>
              )}
            </section>
          }
        />

        {totalFiles > 0 && (
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

      {canManageAlbum && (
        <details className="surface group overflow-hidden rounded-[18px]">
          <summary className="flex min-h-[76px] cursor-pointer select-none items-center gap-[11px] px-4 py-3 transition-colors duration-[180ms] hover:bg-[rgba(235,244,251,0.5)] group-open:border-b group-open:border-[#e4edf4] max-[520px]:px-3 [&::-webkit-details-marker]:hidden">
            <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[11px] bg-[#e8f3ff] text-[#2d7dd7]">
              <Share2 aria-hidden="true" size={18} strokeWidth={1.8} />
            </span>

            <span className="grid min-w-0 flex-1 gap-[3px]">
              <strong className="text-[14px] font-[650] text-[#35526a]">
                Share access
              </strong>

              <small className="text-[12px] text-[#8799a7]">
                Manage who can view and download this album
              </small>
            </span>

            <span className="inline-flex h-[27px] min-w-[34px] items-center justify-center gap-1 rounded-full border border-white/60 bg-[rgba(255,255,255,0.45)] px-2 text-[8px] font-semibold text-[#506c82] shadow-sm backdrop-blur-sm">
              <Users aria-hidden="true" size={14} strokeWidth={1.8} />
              {members.length}
            </span>

            <ChevronDown
              aria-hidden="true"
              className="text-[#8da0af] transition-transform duration-[180ms] group-open:rotate-180"
              size={18}
              strokeWidth={1.8}
            />
          </summary>

          <div className="grid grid-cols-[minmax(280px,0.85fr)_minmax(0,1.45fr)] gap-0 max-[960px]:grid-cols-1 max-[760px]:block max-[520px]:overflow-hidden">
            <div
              className={`${sharePanelClass} border-r border-[rgba(255,255,255,0.45)] max-[960px]:border-r-0 max-[960px]:border-b max-[960px]:border-[rgba(255,255,255,0.45)]`}
            >
              <div className="mb-[15px] flex items-center justify-between gap-[14px]">
                <div>
                  <p className="dashboard-panel-kicker">Album permissions</p>

                  <h3 className="mt-1 mb-0 text-[16px] leading-[1.25] font-[650] tracking-[-0.025em] text-[#163855]">
                    Invite a WinWire user
                  </h3>
                </div>

                <span className="grid h-[33px] w-[33px] flex-none place-items-center rounded-[10px] border border-white/70 bg-[rgba(255,255,255,0.55)] text-[#1b74d3] shadow-sm backdrop-blur-sm">
                  <UserPlus aria-hidden="true" size={17} strokeWidth={1.8} />
                </span>
              </div>

              <label htmlFor="share-email" className="field-label">
                Email address
              </label>

              <input
                id="share-email"
                type="email"
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                placeholder="name@winwire.com"
                className="field w-full"
              />

              <div className="mt-[11px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.30)] backdrop-blur-md">
                <div className="flex min-h-[60px] items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.35)] px-3 py-[10px] last:border-0">
                  <div className="grid min-w-0 gap-[3px]">
                    <strong className="text-[12px] font-[650] text-[#4b647a]">
                      Can view
                    </strong>

                    <span className="text-[11px] leading-[1.4] text-[#71879a]">
                      Allow this person to open the album.
                    </span>
                  </div>

                  <button
                    type="button"
                    aria-pressed={canView}
                    onClick={() => {
                      setCanView((previous) => !previous);

                      if (canView) {
                        setCanDownload(false);
                      }
                    }}
                    className={`${permissionToggleClass} ${
                      canView
                        ? "border-[#cfece2] bg-[#edf9f5] text-[#23866f]"
                        : ""
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-[6px] w-[6px] flex-none rounded-full ${
                        canView ? "bg-[#1db18a]" : "bg-[#a7b5c0]"
                      }`}
                    />
                    {canView ? "On" : "Off"}
                  </button>
                </div>

                <div className="flex min-h-[60px] items-center justify-between gap-3 border-b border-[#e8eef3] px-3 py-[10px] last:border-0">
                  <div className="grid min-w-0 gap-[3px]">
                    <strong className="text-[12px] font-[650] text-[#4b647a]">
                      Can download
                    </strong>

                    <span className="text-[11px] leading-[1.4] text-[#71879a]">
                      Allow files to be downloaded.
                    </span>
                  </div>

                  <button
                    type="button"
                    aria-pressed={canDownload}
                    disabled={!canView}
                    onClick={() => setCanDownload((previous) => !previous)}
                    className={`${permissionToggleClass} ${
                      canDownload
                        ? "border-[#cfece2] bg-[#edf9f5] text-[#23866f]"
                        : ""
                    } ${!canView ? "cursor-not-allowed opacity-[0.56]" : ""}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-[6px] w-[6px] flex-none rounded-full ${
                        canDownload ? "bg-[#1db18a]" : "bg-[#a7b5c0]"
                      }`}
                    />
                    {canDownload ? "On" : "Off"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleAddMember()}
                className="primary-action mt-4 w-full"
              >
                <Link2 aria-hidden="true" size={16} strokeWidth={1.8} />
                Share album
              </button>
            </div>

            <div className={`${sharePanelClass} min-h-[300px]`}>
              {memberAccessError && (
                <div className="mb-3">
                  <ErrorBanner message={memberAccessError} />
                </div>
              )}

              <div className="mb-[15px] flex items-center justify-between gap-[14px]">
                <div>
                  <p className="dashboard-panel-kicker">Current members</p>

                  <h3 className="mt-1 mb-0 text-[18px] leading-[1.25] font-[650] tracking-[-0.025em] text-[#163855]">
                    People with access
                  </h3>
                </div>

                <span className="inline-flex h-[27px] min-w-[29px] items-center justify-center rounded-full border border-white/60 bg-[rgba(255,255,255,0.45)] text-[8px] font-semibold text-[#506c82] shadow-sm backdrop-blur-sm">
                  {members.length}
                </span>
              </div>

              {members.length === 0 ? (
                <div className="flex min-h-[205px] flex-col items-center justify-center text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-[14px] border border-white/70 bg-[rgba(255,255,255,0.50)] text-[#506c82] shadow-sm backdrop-blur-sm">
                    <Users aria-hidden="true" size={23} strokeWidth={1.5} />
                  </span>

                  <p className="mt-3 mb-0.5 text-[10px] font-semibold text-[#587087]">
                    No one else has access yet.
                  </p>

                  <small className="text-[8px] text-[#95a4af]">
                    Invite a WinWire user using the form.
                  </small>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.30)] backdrop-blur-md max-[760px]:rounded-[10px]">
                  {members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex min-w-0 items-center gap-[9px] border-b border-[rgba(255,255,255,0.35)] px-[11px] py-[10px] transition-colors duration-[170ms] hover:bg-[rgba(255,255,255,0.45)] last:border-b-0 max-[760px]:flex-wrap"
                    >
                      <div className="grid h-[31px] w-[31px] flex-none place-items-center rounded-full border border-white/60 bg-[rgba(255,255,255,0.55)] text-[9px] font-bold text-[#1b6ecf] shadow-sm">
                        {member.name?.charAt(0).toUpperCase() ??
                          member.email.charAt(0).toUpperCase()}
                      </div>

                      <div className="grid min-w-0 flex-1 gap-0.5">
                        <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-[650] text-[#3b556b]">
                          {member.name || member.email}
                        </strong>

                        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-[#71879a]">
                          {member.email}
                        </span>

                        <small className="text-[10px] text-[#71879a]">
                          Granted {formatDate(member.grantedAt)}
                        </small>

                        <span
                          className={`mt-1 inline-flex w-fit items-center rounded-full px-2 py-1 text-[9px] font-semibold ${
                            member.canDownload
                              ? "bg-[#e8f2ff] text-[#245f9e]"
                              : member.canView
                                ? "bg-[#e8f7ef] text-[#216747]"
                                : "bg-[#f0f3f6] text-[#5f7080]"
                          }`}
                        >
                          {member.canDownload
                            ? "View and download"
                            : member.canView
                              ? "View only"
                              : "No access"}
                        </span>
                      </div>

                      <div className="flex flex-wrap justify-end gap-1 max-[760px]:w-full max-[760px]:justify-start max-[760px]:pl-10 max-[520px]:pl-10">
                        <button
                          type="button"
                          aria-label={`${member.canView ? "View allowed" : "View off"} for ${member.email}`}
                          aria-pressed={member.canView}
                          onClick={() =>
                            void handleUpdateMember(
                              member.userId,
                              !member.canView,
                              member.canView && member.canDownload
                                ? false
                                : member.canDownload,
                            )
                          }
                          className={`${memberPermissionClass} ${
                            member.canView
                              ? "primary-action"
                              : "border-[#d4dde5] bg-[#f2f5f8] text-[#647789] hover:bg-[#eaf0f4]"
                          }`}
                        >
                          {member.canView && (
                            <Check
                              aria-hidden="true"
                              size={12}
                              strokeWidth={2}
                            />
                          )}
                          {member.canView ? "View allowed" : "View off"}
                        </button>

                        <button
                          type="button"
                          aria-label={`${member.canDownload ? "Download allowed" : "Download off"} for ${member.email}`}
                          aria-pressed={member.canDownload}
                          disabled={!member.canView}
                          onClick={() =>
                            void handleUpdateMember(
                              member.userId,
                              member.canView,
                              !member.canDownload,
                            )
                          }
                          className={`${memberPermissionClass} ${
                            member.canDownload
                              ? "primary-action"
                              : "border-[#d4dde5] bg-[#f2f5f8] text-[#647789] hover:bg-[#eaf0f4]"
                          } ${
                            !member.canView
                              ? "cursor-not-allowed opacity-[0.47]"
                              : ""
                          }`}
                        >
                          {member.canDownload && (
                            <Download
                              aria-hidden="true"
                              size={12}
                              strokeWidth={1.9}
                            />
                          )}
                          {member.canDownload
                            ? "Download allowed"
                            : "Download off"}
                        </button>

                        <button
                          type="button"
                          aria-label={`Revoke access for ${member.email}`}
                          title="Revoke access"
                          onClick={() => void handleRemoveMember(member.userId)}
                          className="danger-gradient-action inline-flex min-h-[36px] cursor-pointer items-center justify-center gap-1 rounded-[8px] px-[11px] !text-[11px] !font-semibold transition-[transform,box-shadow] duration-[160ms] max-[520px]:w-7 max-[520px]:px-0"
                        >
                          <Trash2
                            aria-hidden="true"
                            size={15}
                            strokeWidth={1.8}
                          />
                          <span className="max-[520px]:hidden">Revoke</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </details>
      )}

      {!canManageAlbum && (
        <section className="surface flex items-center gap-[11px] rounded-[14px] px-[16px] py-[14px]">
          <span className="grid h-[36px] w-[36px] flex-none place-items-center rounded-[11px] border border-white/70 bg-[rgba(255,255,255,0.55)] text-[#1b74d3] shadow-sm backdrop-blur-sm">
            <Users aria-hidden="true" size={18} strokeWidth={1.8} />
          </span>

          <div className="min-w-0">
            <strong className="block text-[11px] font-semibold text-[#183955]">
              Shared album
            </strong>

            <p className="mt-[3px] text-[10px] text-[#658299]">
              You have access to this collection based on the permissions
              assigned to your account.
            </p>
          </div>
        </section>
      )}

      {fileDetails && (
        <FileDetailsDialog
          file={fileDetails}
          onClose={() => setFileDetails(null)}
        />
      )}

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
              ? "This removes only the album association. The file and its stored content remain in the uploader’s library."
              : "This permanently deletes the selected file records and stored content, including favorites. This action cannot be undone."
          }
          confirmLabel={
            bulkAction === "remove" ? "Remove from album" : "Delete permanently"
          }
          pendingLabel={bulkAction === "remove" ? "Removing…" : "Deleting…"}
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
            if (
              !account ||
              !canManageAlbum ||
              !Number.isFinite(numericAlbumId)
            ) {
              throw new Error(
                "You do not have permission to upload to this album.",
              );
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
