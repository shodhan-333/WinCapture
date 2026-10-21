import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { deleteAlbum } from "@/features/albums/api/albumsApi";
import type { AlbumResponse } from "@/features/albums/types/album";
import { deleteFile } from "@/features/files/api/filesApi";
import type { DashboardFile } from "@/features/dashboard/types/dashboard";

interface UseDashboardAdminActionsOptions {
  instance: IPublicClientApplication;
  account: AccountInfo | null;
  canManageContent: boolean;
  resetAdminPages: () => void;
}

// Run destructive admin operations as mutations and let Query refresh dashboard data.
export function useDashboardAdminActions({
  instance,
  account,
  canManageContent,
  resetAdminPages,
}: UseDashboardAdminActionsOptions) {
  const queryClient = useQueryClient();
  const albumDeletion = useMutation({
    mutationFn: (albumId: number) => {
      if (!account) throw new Error("An authenticated account is required.");
      return deleteAlbum(instance, account, albumId);
    },
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["albums", "list"] }),
      queryClient.invalidateQueries({ queryKey: ["files", "list"] }),
    ]),
  });
  const fileDeletion = useMutation({
    mutationFn: (fileId: number) => {
      if (!account) throw new Error("An authenticated account is required.");
      return deleteFile(instance, account, fileId);
    },
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["files", "list"] }),
      queryClient.invalidateQueries({ queryKey: ["albums", "files"] }),
    ]),
  });

  const handleDeleteAlbum = async (album: AlbumResponse): Promise<void> => {
    if (!account || !canManageContent || !window.confirm(`Delete "${album.albumName}" and all its files? This cannot be undone.`)) return;
    albumDeletion.reset();
    fileDeletion.reset();
    try {
      await albumDeletion.mutateAsync(album.id);
      resetAdminPages();
    } catch { /* The mutation owns and exposes its request error. */ }
  };

  const handleDeleteFile = async (file: DashboardFile): Promise<void> => {
    if (!account || !canManageContent || !window.confirm(`Delete "${file.originalFileName}"? This cannot be undone.`)) return;
    albumDeletion.reset();
    fileDeletion.reset();
    try {
      await fileDeletion.mutateAsync(file.id);
      resetAdminPages();
    } catch { /* The mutation owns and exposes its request error. */ }
  };

  const error = albumDeletion.error instanceof Error
    ? albumDeletion.error.message
    : fileDeletion.error instanceof Error
      ? fileDeletion.error.message
      : null;
  return { handleDeleteAlbum, handleDeleteFile, error };
}
