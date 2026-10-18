import type { Dispatch, SetStateAction } from "react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { deleteAlbum } from "@/features/albums/api/albumsApi";
import type { AlbumResponse } from "@/features/albums/types/album";
import { deleteFile } from "@/features/files/api/filesApi";
import type { DashboardFile } from "@/features/dashboard/types/dashboard";

interface UseDashboardAdminActionsOptions {
  instance: IPublicClientApplication;
  account: AccountInfo | null;
  canManageContent: boolean;
  setAlbums: Dispatch<SetStateAction<AlbumResponse[]>>;
  setFiles: Dispatch<SetStateAction<DashboardFile[]>>;
  resetAdminPages: () => void;
  refreshContent: () => void;
  setError: (message: string | null) => void;
}

export function useDashboardAdminActions({
  instance,
  account,
  canManageContent,
  setAlbums,
  setFiles,
  resetAdminPages,
  refreshContent,
  setError,
}: UseDashboardAdminActionsOptions) {
  const handleDeleteAlbum = async (album: AlbumResponse): Promise<void> => {
    if (
      !account ||
      !canManageContent ||
      !window.confirm(`Delete "${album.albumName}" and all its files? This cannot be undone.`)
    ) {
      return;
    }

    try {
      setError(null);
      await deleteAlbum(instance, account, album.id);
      setAlbums((current) => current.filter((item) => item.id !== album.id));
      resetAdminPages();
      refreshContent();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? `${caughtError.message} The album remains listed, so you can retry.`
          : "Unable to delete album. You can retry after resolving the issue.",
      );
    }
  };

  const handleDeleteFile = async (file: DashboardFile): Promise<void> => {
    if (
      !account ||
      !canManageContent ||
      !window.confirm(`Delete "${file.originalFileName}"? This cannot be undone.`)
    ) {
      return;
    }

    try {
      setError(null);
      await deleteFile(instance, account, file.id);
      setFiles((current) => current.filter((item) => item.id !== file.id));
      resetAdminPages();
      refreshContent();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? `${caughtError.message} The file remains listed, so you can retry.`
          : "Unable to delete file. You can retry after resolving the issue.",
      );
    }
  };

  return { handleDeleteAlbum, handleDeleteFile };
}
