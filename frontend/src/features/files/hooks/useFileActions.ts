import type { ChangeEvent, RefObject } from "react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import {
  deleteFile,
  downloadFileByPath,
  getFile,
  replaceFile,
} from "@/features/files/api/filesApi";
import { validateUploadFile } from "@/features/files/constants/fileSupport";
import type { FileResponse, FileView } from "@/features/files/types/file";

interface UseFileActionsOptions {
  instance: IPublicClientApplication;
  account: AccountInfo | null;
  view: FileView;
  loadFiles: (view: FileView) => Promise<void>;
  removeSelected: (ids: number[]) => void;
  replaceInputRef: RefObject<HTMLInputElement | null>;
  replaceTargetIdRef: RefObject<number | null>;
  setError: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  setFileDetails: (file: FileResponse | null) => void;
}

// Coordinate single-file upload replacement, download, deletion, and detail actions.
export function useFileActions({
  instance,
  account,
  view,
  loadFiles,
  removeSelected,
  replaceInputRef,
  replaceTargetIdRef,
  setError,
  setSuccessMessage,
  setFileDetails,
}: UseFileActionsOptions) {
  // Validate and replace a file, then reset the native file input.
  const handleReplace = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const selectedFile = event.target.files?.[0];
    const fileId = replaceTargetIdRef.current;

    if (!selectedFile || !account || fileId === null) return;

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
      setError(caughtError instanceof Error ? caughtError.message : "Replace failed.");
    } finally {
      replaceTargetIdRef.current = null;
      event.target.value = "";
    }
  };

  // Download the selected file and report request failures to the caller.
  const handleDownload = async (file: FileResponse): Promise<void> => {
    if (!account) return;

    try {
      setError(null);
      await downloadFileByPath(instance, account, file.downloadUrl, file.originalFileName);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Download failed.");
    }
  };

  // Delete a file and refresh the current view after the server confirms it.
  const handleDelete = async (fileId: number): Promise<void> => {
    if (!account) return;

    try {
      setError(null);
      const result = await deleteFile(instance, account, fileId);
      removeSelected([fileId]);
      if (result?.storageCleanupComplete === false) {
        setSuccessMessage(
          "The file record was deleted, but its stored content needs cleanup reconciliation.",
        );
      }
      await loadFiles(view);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? `${caughtError.message} The file remains listed, so you can retry after resolving the issue.`
          : "Delete failed. You can safely retry.",
      );
    }
  };

  // Fetch current file metadata before displaying the details dialog.
  const handleShowFileDetails = async (file: FileResponse): Promise<void> => {
    if (!account) return;

    try {
      setError(null);
      setFileDetails(await getFile(instance, account, file.id));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load file details.");
    }
  };

  // Remember the target file before opening the hidden native file picker.
  const openReplace = (file: FileResponse): void => {
    replaceTargetIdRef.current = file.id;
    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
      replaceInputRef.current.click();
    }
  };

  return { handleReplace, handleDownload, handleDelete, handleShowFileDetails, openReplace };
}
