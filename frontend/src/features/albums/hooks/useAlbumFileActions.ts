import { useState, type ChangeEvent } from "react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import type { FileResponse } from "@/features/files/types/file";
import { useFileFavorites } from "@/features/files";
import {
  deleteAlbumFile,
  downloadAlbumFile,
  getAlbumFile,
  removeAlbumFileAssociation,
  replaceAlbumFile,
} from "@/features/albums/api/albumsApi";
import { validateUploadFile } from "@/features/files/constants/fileSupport";

export type AlbumBulkAction = "remove" | "delete" | null;

interface ReplaceTargetRef {
  current: number | null;
}

interface UseAlbumFileActionsOptions {
  instance: IPublicClientApplication;
  account: AccountInfo | null;
  albumId: number;
  selectedFiles: FileResponse[];
  bulkAction: AlbumBulkAction;
  replaceTargetIdRef: ReplaceTargetRef;
  reloadAlbum: () => Promise<void>;
  removeSelected: (ids: readonly number[]) => void;
  cancelSelection: () => void;
  setFiles: (update: (files: FileResponse[]) => FileResponse[]) => void;
  setFileDetails: (file: FileResponse | null) => void;
  setError: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  clearBulkAction: () => void;
}

// Keep album file operations and their selection, status, and message updates together.
export function useAlbumFileActions({
  instance,
  account,
  albumId,
  selectedFiles,
  bulkAction,
  replaceTargetIdRef,
  reloadAlbum,
  removeSelected,
  cancelSelection,
  setFiles,
  setFileDetails,
  setError,
  setSuccessMessage,
  clearBulkAction,
}: UseAlbumFileActionsOptions) {
  const [bulkPending, setBulkPending] = useState(false);

  const { pendingIds: favoritePendingIds, toggleFavorite } = useFileFavorites({
    instance,
    account,
    onSuccess: (file, nextFavorite) => {
      setFiles((previous) =>
        previous.map((currentFile) =>
          currentFile.id === file.id ? { ...currentFile, isFavorite: nextFavorite } : currentFile,
        ),
      );
    },
    onError: setError,
  });

  // Download a file and surface API failures in the album page.
  const handleDownload = async (file: FileResponse): Promise<void> => {
    if (!account || !Number.isFinite(albumId)) return;

    try {
      setError(null);
      setSuccessMessage(null);
      await downloadAlbumFile(instance, account, albumId, file.id, file.originalFileName);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Download failed.");
    }
  };

  // Delete one album file, report cleanup status, and refresh the album list.
  const handleDelete = async (fileId: number): Promise<void> => {
    if (!account || !Number.isFinite(albumId)) return;

    try {
      setError(null);
      const result = await deleteAlbumFile(instance, account, albumId, fileId);
      removeSelected([fileId]);

      if (result?.storageCleanupComplete === false) {
        setSuccessMessage(
          "The file record was deleted, but its stored content needs cleanup reconciliation.",
        );
      }

      await reloadAlbum();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? `${caughtError.message} The file remains listed, so you can retry after resolving the issue.`
          : "Delete failed. The file remains listed, so you can retry after resolving the issue.",
      );
    }
  };

  // Run each selected file operation independently so partial success can be reported.
  const runBulkAction = async (): Promise<void> => {
    if (
      !account ||
      !Number.isFinite(albumId) ||
      !bulkAction ||
      bulkPending ||
      !selectedFiles.length
    ) {
      return;
    }

    setBulkPending(true);
    setError(null);
    const results = await Promise.all(
      selectedFiles.map(async (file) => {
        try {
          if (bulkAction === "remove") {
            await removeAlbumFileAssociation(instance, account, albumId, file.id);
            return { id: file.id, ok: true as const, cleanupComplete: true };
          }

          const deletion = await deleteAlbumFile(instance, account, albumId, file.id);
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

    const succeeded = results.filter((result) => result.ok).map((result) => result.id);
    const failedCount = results.length - succeeded.length;
    const cleanupWarnings = results.filter((result) => result.ok && !result.cleanupComplete).length;
    // Resolve IDs to names so any partial failure can be reviewed by the user.
    const getFileName = (fileId: number) =>
      selectedFiles.find((file) => file.id === fileId)?.originalFileName;
    const failedNames = results
      .filter((result) => !result.ok)
      .map((result) => getFileName(result.id))
      .filter(Boolean);
    const cleanupNames = results
      .filter((result) => result.ok && !result.cleanupComplete)
      .map((result) => getFileName(result.id))
      .filter(Boolean);

    // Retain failed items in the selection so the user can review or retry them.
    removeSelected(succeeded);
    const failureSummary = failedCount
      ? `${succeeded.length} completed; ${failedCount} failed (${failedNames.join(", ")}). Failed files that remain available are selected for review or retry.`
      : null;

    setSuccessMessage(
      succeeded.length
        ? `${succeeded.length} ${bulkAction === "remove" ? `file${succeeded.length === 1 ? "" : "s"} removed from this album. The files remain in their ownersâ€™ libraries.` : `file${succeeded.length === 1 ? "" : "s"} permanently deleted.`}${cleanupWarnings ? ` Storage cleanup needs reconciliation for: ${cleanupNames.join(", ")}. The file records are already removed.` : ""}`
        : null,
    );
    clearBulkAction();
    if (!failedCount) cancelSelection();
    await reloadAlbum();
    if (failureSummary) setError(failureSummary);
    setBulkPending(false);
  };

  // Validate replacement uploads before sending them, then always reset the file input.
  const handleReplace = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const selectedFile = event.target.files?.[0];
    const fileId = replaceTargetIdRef.current;

    if (!selectedFile || !account || !Number.isFinite(albumId) || fileId === null) return;

    const validationError = validateUploadFile(selectedFile);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    try {
      setError(null);
      await replaceAlbumFile(instance, account, albumId, fileId, selectedFile);
      setSuccessMessage(`${selectedFile.name} replaced successfully.`);
      await reloadAlbum();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Replace failed.");
    } finally {
      replaceTargetIdRef.current = null;
      event.target.value = "";
    }
  };

  // Fetch the latest file metadata before opening its details dialog.
  const handleShowFileDetails = async (file: FileResponse): Promise<void> => {
    if (!account) return;

    try {
      setError(null);
      setFileDetails(await getAlbumFile(instance, account, albumId, file.id));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load file details.");
    }
  };

  return {
    bulkPending,
    favoritePendingIds,
    toggleFavorite,
    handleDownload,
    handleDelete,
    runBulkAction,
    handleReplace,
    handleShowFileDetails,
  };
}
