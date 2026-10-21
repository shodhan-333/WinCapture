import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Images, Users } from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getFilePreviewUrl,
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
import { useBulkSelection } from "@/shared/hooks/useBulkSelection";
import { useAuth } from "@/features/auth";

import type { FileCategoryFilter, FileResponse } from "@/features/files";
import { getAccountKey } from "@/shared/utils/accountKey";
import {
  useAlbumFileActions,
  type AlbumBulkAction,
} from "@/features/albums/hooks/useAlbumFileActions";
import { useAlbumSharingActions } from "@/features/albums/hooks/useAlbumSharingActions";
import {
  albumKeys,
  useAlbumFileDetailQuery,
  useAlbumDetailQuery,
  useAlbumFilesQuery,
  useAlbumMembersQuery,
  useDeleteAlbumMutation,
  useUpdateAlbumMutation,
} from "@/features/albums/hooks/albumQueries";

const PAGE_SIZE = 12;

// Coordinate album metadata, member permissions, file actions, and preview dialogs.
export function AlbumDetailPage() {
  const { instance } = useMsal();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { account, user } = useAuth();
  const accountKey = getAccountKey(account);
  const { albumId } = useParams();

  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const albumNameInputRef = useRef<HTMLInputElement | null>(null);
  // Stores the file selected for replacement while the hidden file picker is open.
  const replaceTargetIdRef = useRef<number | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<FileCategoryFilter>("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [fileDetails, setFileDetails] = useState<FileResponse | null>(null);
  const [previewFile, setPreviewFile] = useState<FileResponse | null>(null);
  const [previewSource, setPreviewSource] = useState<string | undefined>();

  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
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
  const validAlbumId = Number.isSafeInteger(numericAlbumId) && numericAlbumId > 0;
  const albumQuery = useAlbumDetailQuery({ instance, account, accountKey, albumId: numericAlbumId });
  const filesQuery = useAlbumFilesQuery({
    instance,
    account,
    accountKey,
    albumId: numericAlbumId,
    page: currentPage,
    pageSize: PAGE_SIZE,
    category: categoryFilter,
  });
  const album = albumQuery.data ?? null;
  const files = filesQuery.data?.items ?? [];
  const totalFiles = filesQuery.data?.totalItems ?? 0;
  const pageCount = filesQuery.data?.pageCount ?? 1;
  const membersQuery = useAlbumMembersQuery({
    instance,
    account,
    accountKey,
    albumId: numericAlbumId,
    enabled: !!album && (user?.role === "Admin" || album.ownerId === user?.userId),
  });
  const members = membersQuery.data ?? [];
  const fileDetailsQuery = useAlbumFileDetailQuery({
    instance,
    account,
    accountKey,
    albumId: numericAlbumId,
    fileId: fileDetails?.id ?? 0,
    enabled: !!fileDetails,
  });
  const loading = validAlbumId && (albumQuery.isPending || filesQuery.isPending);
  const hasLoaded = (albumQuery.isFetched || albumQuery.isError) && (filesQuery.isFetched || filesQuery.isError);
  const queryError = !validAlbumId
    ? "The album ID is invalid."
    : albumQuery.error instanceof Error
      ? albumQuery.error.message
      : filesQuery.error instanceof Error
        ? filesQuery.error.message
        : null;
  const updateAlbumMutation = useUpdateAlbumMutation({ instance, account, accountKey, albumId: numericAlbumId });
  const deleteAlbumMutation = useDeleteAlbumMutation({ instance, account, accountKey });
  const uploadAlbumMutation = useMutation({
    mutationFn: (file: File) => {
      if (!account) throw new Error("An authenticated account is required.");
      return uploadAlbumFile(instance, account, numericAlbumId, file);
    },
  });
  const deletingAlbum = deleteAlbumMutation.isPending;
  const error = actionError
    ?? (updateAlbumMutation.error instanceof Error ? updateAlbumMutation.error.message : null)
    ?? (deleteAlbumMutation.error instanceof Error ? deleteAlbumMutation.error.message : null)
    ?? queryError
    ?? (fileDetailsQuery.error instanceof Error ? fileDetailsQuery.error.message : null);
  useEffect(() => {
    if (album && !editingName) setAlbumNameDraft(album.albumName);
  }, [album, editingName]);
  useEffect(() => {
    const page = filesQuery.data;
    if (!page || filesQuery.isPlaceholderData) return;
    retain(page.items.filter((file) => file.canManage).map((file) => file.id));
    if (page.page !== currentPage) setCurrentPage(page.page);
  }, [currentPage, filesQuery.data, filesQuery.isPlaceholderData, retain]);
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
    error: sharingActionError,
  } = useAlbumSharingActions({
    instance,
    account,
    accountKey,
    albumId: numericAlbumId,
    members,
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

  const { previewUrls } = useFilePreviews(previewFiles, loadPreview, accountKey);

  const albumCoverPreview =
    albumCoverFile && previewUrls[albumCoverFile.id] ? albumCoverFile : undefined;

  // Refresh the keyed album queries after upload, delete, or replacement operations.
  const loadAlbumData = useCallback(async () => {
    if (!validAlbumId) return;
    setActionError(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: albumKeys.detail(accountKey, numericAlbumId) }),
      queryClient.invalidateQueries({ queryKey: albumKeys.files(accountKey, numericAlbumId, currentPage, PAGE_SIZE, categoryFilter) }),
      queryClient.invalidateQueries({ queryKey: albumKeys.members(accountKey, numericAlbumId) }),
      queryClient.invalidateQueries({ queryKey: ["album-cover-preview", accountKey, numericAlbumId] }),
    ]);
  }, [accountKey, categoryFilter, currentPage, numericAlbumId, queryClient, validAlbumId]);

  useEffect(() => {
    cancelSelection();
  }, [accountKey, numericAlbumId, cancelSelection]);

  useEffect(() => {
    if (!canManageAlbum) cancelSelection();
  }, [canManageAlbum, cancelSelection]);

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
    setFileDetails,
    setError: setActionError,
    setSuccessMessage,
    clearBulkAction: () => setBulkAction(null),
  });
  // Save the edited album name and update the displayed album from the response.
  const handleUpdateAlbum = async () => {
    if (!account || !Number.isFinite(numericAlbumId) || !albumNameDraft.trim()) {
      setActionError("Album name is required.");
      return;
    }

    try {
      setActionError(null);
      updateAlbumMutation.reset();
      const updated = await updateAlbumMutation.mutateAsync({
        albumName: albumNameDraft.trim(),
      });

      setAlbumNameDraft(updated.albumName);
      setEditingName(false);
    } catch { /* The mutation retains its request error for the banner. */ }
  };

  // Confirm album deletion, then return to the albums list on success.
  const handleDeleteAlbum = async () => {
    if (!account || !album || deletingAlbum) {
      return;
    }

    if (!window.confirm(`Delete "${album.albumName}"? This cannot be undone.`)) {
      return;
    }

    try {
      setActionError(null);
      deleteAlbumMutation.reset();
      await deleteAlbumMutation.mutateAsync(album.id);
      navigate("/albums", { replace: true });
    } catch { /* The mutation retains its request error for the banner. */ }
  };

  if (loading && !hasLoaded) {
    return (
      <div className="[width:min(1440px,_100%)] [margin:0_auto] [padding:28px_42px_64px] [display:flex] [flex-direction:column] [gap:18px] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[color:#193850] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[background-color:rgba(255,_255,_255,_0.45)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[backdrop-filter:blur(12px)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[-webkit-backdrop-filter:blur(12px)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_select]:[color:#193850] [&_select]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_select]:[background-color:rgba(255,_255,_255,_0.45)] [&_select]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_select]:[backdrop-filter:blur(12px)] [&_select]:[-webkit-backdrop-filter:blur(12px)] [&_select]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_textarea]:[color:#193850] [&_textarea]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_textarea]:[background-color:rgba(255,_255,_255,_0.45)] [&_textarea]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_textarea]:[backdrop-filter:blur(12px)] [&_textarea]:[-webkit-backdrop-filter:blur(12px)] [&_textarea]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_select:focus]:[border-color:rgba(30,_120,_214,_0.65)] [&_select:focus]:[background-color:rgba(255,_255,_255,_0.72)] [&_select:focus]:[outline:2px_solid_rgba(30,_120,_214,_0.16)] [&_select:focus]:[outline-offset:1px] [&_textarea:focus]:[border-color:rgba(30,_120,_214,_0.65)] [&_textarea:focus]:[background-color:rgba(255,_255,_255,_0.72)] [&_textarea:focus]:[outline:2px_solid_rgba(30,_120,_214,_0.16)] [&_textarea:focus]:[outline-offset:1px] max-[1200px]:[padding-right:28px] max-[1200px]:[padding-left:28px] max-[760px]:[padding:24px_17px_94px] max-[760px]:[gap:17px]">
        <section className="[position:relative] [overflow:hidden] [border:1px_solid_rgba(255,_255,_255,_0.58)] [border-radius:18px] [background:rgba(255,_255,_255,_0.35)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(16px)_saturate(180%)] [-webkit-backdrop-filter:blur(16px)_saturate(180%)] [&::after]:[content:''] [&::after]:[position:absolute] [&::after]:[top:0] [&::after]:[bottom:0] [&::after]:[width:35%] [&::after]:[transform:translateX(-130%)] [&::after]:[background:linear-gradient(90deg,_transparent,_rgba(255,_255,_255,_0.5),_transparent)] animate-skeleton-shimmer relative flex items-center gap-[17px] overflow-hidden rounded-[20px] p-[22px] max-[760px]:flex-wrap max-[760px]:p-[18px]">
          <div className="h-[78px] w-[95px] flex-none rounded-2xl bg-[#dce9f2]" />

          <div className="[&::after]:[content:''] [&::after]:[position:absolute] [&::after]:[top:0] [&::after]:[bottom:0] [&::after]:[width:35%] [&::after]:[transform:translateX(-130%)] [&::after]:[background:linear-gradient(90deg,_transparent,_rgba(255,_255,_255,_0.5),_transparent)] animate-skeleton-shimmer [position:relative] [overflow:hidden] [width:min(600px,_100%)]">
            <span className="[display:block] [position:relative] [overflow:hidden] [height:9px] [border-radius:999px] [background:rgba(200,_222,_238,_0.65)] [&+&]:[margin-top:8px] [width:26%]" />
            <span className="[display:block] [position:relative] [overflow:hidden] [height:9px] [border-radius:999px] [background:rgba(200,_222,_238,_0.65)] [&+&]:[margin-top:8px] [width:68%] [height:19px]" />
            <span className="[display:block] [position:relative] [overflow:hidden] [height:9px] [border-radius:999px] [background:rgba(200,_222,_238,_0.65)] [&+&]:[margin-top:8px] [width:52%]" />
          </div>
        </section>

        <section className="grid grid-cols-3 gap-[17px]">
          {[1, 2, 3].map((item) => (
            <div key={item} className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] h-[315px] rounded-[17px]" />
          ))}
        </section>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="[width:min(1440px,_100%)] [margin:0_auto] [padding:28px_42px_64px] [display:flex] [flex-direction:column] [gap:18px] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[color:#193850] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[background-color:rgba(255,_255,_255,_0.45)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[backdrop-filter:blur(12px)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[-webkit-backdrop-filter:blur(12px)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_select]:[color:#193850] [&_select]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_select]:[background-color:rgba(255,_255,_255,_0.45)] [&_select]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_select]:[backdrop-filter:blur(12px)] [&_select]:[-webkit-backdrop-filter:blur(12px)] [&_select]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_textarea]:[color:#193850] [&_textarea]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_textarea]:[background-color:rgba(255,_255,_255,_0.45)] [&_textarea]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_textarea]:[backdrop-filter:blur(12px)] [&_textarea]:[-webkit-backdrop-filter:blur(12px)] [&_textarea]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_select:focus]:[border-color:rgba(30,_120,_214,_0.65)] [&_select:focus]:[background-color:rgba(255,_255,_255,_0.72)] [&_select:focus]:[outline:2px_solid_rgba(30,_120,_214,_0.16)] [&_select:focus]:[outline-offset:1px] [&_textarea:focus]:[border-color:rgba(30,_120,_214,_0.65)] [&_textarea:focus]:[background-color:rgba(255,_255,_255,_0.72)] [&_textarea:focus]:[outline:2px_solid_rgba(30,_120,_214,_0.16)] [&_textarea:focus]:[outline-offset:1px] max-[1200px]:[padding-right:28px] max-[1200px]:[padding-left:28px] max-[760px]:[padding:24px_17px_94px] max-[760px]:[gap:17px]">
        <section role="alert" className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] album-not-found">
          <span className="album-not-found-icon">
            <Images aria-hidden="true" size={28} strokeWidth={1.5} />
          </span>

          <h1>Album not found</h1>

          <p>{error ?? "The requested album could not be loaded."}</p>

          <Link to="/albums" className="[transition:transform_180ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_180ms_cubic-bezier(0.16,_1,_0.3,_1),_background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease] [min-height:42px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [padding:0_17px] [border-radius:12px] [font-size:12px] [font-weight:600] [cursor:pointer] [color:#ffffff] [border:1px_solid_rgba(255,_255,_255,_0.36)] [background:linear-gradient(135deg,_rgba(46,_134,_222,_0.9)_0%,_rgba(20,_99,_188,_0.96)_100%)] [box-shadow:0_8px_20px_rgba(28,_106,_194,_0.2),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.45)] [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:[background:linear-gradient(135deg,_rgba(56,_144,_232,_0.95)_0%,_rgba(24,_108,_198,_0.98)_100%)] [&:hover:not(:disabled)]:[box-shadow:0_11px_24px_rgba(28,_106,_194,_0.26),_inset_0_1px_1.5px_rgba(255,_255,_255,_0.55)]">
            <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.8} />
            Back to albums
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="[width:min(1440px,_100%)] [margin:0_auto] [padding:28px_42px_64px] [display:flex] [flex-direction:column] [gap:18px] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[color:#193850] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[background-color:rgba(255,_255,_255,_0.45)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[backdrop-filter:blur(12px)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[-webkit-backdrop-filter:blur(12px)] [&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search])]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_select]:[color:#193850] [&_select]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_select]:[background-color:rgba(255,_255,_255,_0.45)] [&_select]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_select]:[backdrop-filter:blur(12px)] [&_select]:[-webkit-backdrop-filter:blur(12px)] [&_select]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_textarea]:[color:#193850] [&_textarea]:[border:1px_solid_rgba(255,_255,_255,_0.58)] [&_textarea]:[background-color:rgba(255,_255,_255,_0.45)] [&_textarea]:[box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.85),_0_2px_8px_rgba(24,_52,_78,_0.025)] [&_textarea]:[backdrop-filter:blur(12px)] [&_textarea]:[-webkit-backdrop-filter:blur(12px)] [&_textarea]:[transition:border-color_180ms_ease,_box-shadow_180ms_ease,_background-color_180ms_ease] [&_select:focus]:[border-color:rgba(30,_120,_214,_0.65)] [&_select:focus]:[background-color:rgba(255,_255,_255,_0.72)] [&_select:focus]:[outline:2px_solid_rgba(30,_120,_214,_0.16)] [&_select:focus]:[outline-offset:1px] [&_textarea:focus]:[border-color:rgba(30,_120,_214,_0.65)] [&_textarea:focus]:[background-color:rgba(255,_255,_255,_0.72)] [&_textarea:focus]:[outline:2px_solid_rgba(30,_120,_214,_0.16)] [&_textarea:focus]:[outline-offset:1px] max-[1200px]:[padding-right:28px] max-[1200px]:[padding-left:28px] max-[760px]:[padding:24px_17px_94px] max-[760px]:[gap:17px] gap-5">
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
          className="[border:1px_solid_rgba(40,_165,_95,_0.3)] [background:rgba(240,_253,_246,_0.55)] [box-shadow:inset_0_1px_1px_rgba(255,_255,_255,_0.88),_0_6px_18px_rgba(30,_95,_50,_0.03)] [backdrop-filter:blur(14px)_saturate(160%)] [-webkit-backdrop-filter:blur(14px)_saturate(160%)] rounded-[11px] px-3 py-2 text-[10px] font-medium text-[#34734b]"
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
          memberAccessError={sharingActionError ?? (membersQuery.error instanceof Error ? membersQuery.error.message : null)}
          onMemberEmailChange={setMemberEmail}
          onCanViewChange={setCanView}
          onCanDownloadChange={setCanDownload}
          onAddMember={handleAddMember}
          onUpdateMember={handleUpdateMember}
          onRemoveMember={handleRemoveMember}
        />
      )}

      {!canManageAlbum && (
        <section className="[border:1px_solid_rgba(255,_255,_255,_0.58)] [background:linear-gradient(145deg,_rgba(255,_255,_255,_0.52)_0%,_rgba(255,_255,_255,_0.42)_100%)] [box-shadow:0_8px_30px_rgba(24,_52,_78,_0.06),_inset_0_1px_1px_0_rgba(255,_255,_255,_0.88),_inset_0_-1px_1px_0_rgba(255,_255,_255,_0.2)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] [transition:background-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_240ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_240ms_cubic-bezier(0.16,_1,_0.3,_1),_color_160ms_cubic-bezier(0.16,_1,_0.3,_1),_transform_160ms_cubic-bezier(0.16,_1,_0.3,_1)] flex items-center gap-[11px] rounded-[14px] px-[16px] py-[14px]">
          <span className="grid h-[36px] w-[36px] flex-none place-items-center rounded-[11px] border border-white/70 bg-[rgba(255,255,255,0.55)] text-[#1b74d3] shadow-sm backdrop-blur-sm">
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

      {fileDetails && <FileDetailsDialog file={fileDetailsQuery.data ?? fileDetails} onClose={() => setFileDetails(null)} />}

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
            return uploadAlbumMutation.mutateAsync(file);
          }}
          onUploadingChange={(isActive) => {
            setUploading(isActive);
            if (isActive) {
              setActionError(null);
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
