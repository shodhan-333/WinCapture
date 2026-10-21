import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { createAlbum, deleteAlbum, getAlbum, getAlbumFile, getAlbumFiles, getAlbumMembers, updateAlbum } from "@/features/albums/api/albumsApi";
import type { CreateAlbumRequest, UpdateAlbumRequest } from "@/features/albums/types/album";

export const albumKeys = {
  all: ["albums"] as const,
  lists: () => [...albumKeys.all, "list"] as const,
  list: (accountId: string | null, filter: string, page: number, pageSize: number, search: string, adminAll: boolean) =>
    [...albumKeys.lists(), accountId, filter, page, pageSize, search, adminAll] as const,
  details: () => [...albumKeys.all, "detail"] as const,
  detail: (accountId: string | null, id: number) => [...albumKeys.details(), accountId, id] as const,
  files: (accountId: string | null, id: number, page: number, pageSize: number, category: string) =>
    [...albumKeys.all, "files", accountId, id, page, pageSize, category] as const,
  members: (accountId: string | null, id: number) => [...albumKeys.all, "members", accountId, id] as const,
  fileDetail: (accountId: string | null, albumId: number, fileId: number) =>
    [...albumKeys.all, "file-detail", accountId, albumId, fileId] as const,
};

interface AlbumQueryContext {
  instance: IPublicClientApplication;
  account: AccountInfo | null;
  accountKey: string | null;
}

// Load one album only after an account and a valid album identifier are available.
export function useAlbumDetailQuery(context: AlbumQueryContext & { albumId: number }) {
  const { instance, account, accountKey, albumId } = context;
  return useQuery({
    queryKey: albumKeys.detail(accountKey, albumId),
    enabled: !!account && albumId > 0,
    queryFn: ({ signal }) => account ? getAlbum(instance, account, albumId, signal) : Promise.reject(new Error("An authenticated account is required.")),
  });
}

export function useAlbumFilesQuery(context: AlbumQueryContext & { albumId: number; page: number; pageSize: number; category: string }) {
  const { instance, account, accountKey, albumId, page, pageSize, category } = context;
  return useQuery({
    queryKey: albumKeys.files(accountKey, albumId, page, pageSize, category),
    enabled: !!account && albumId > 0,
    queryFn: ({ signal }) => account ? getAlbumFiles(instance, account, albumId, page, pageSize, category, signal) : Promise.reject(new Error("An authenticated account is required.")),
  });
}

export function useAlbumMembersQuery(context: AlbumQueryContext & { albumId: number; enabled: boolean }) {
  const { instance, account, accountKey, albumId, enabled } = context;
  return useQuery({
    queryKey: albumKeys.members(accountKey, albumId),
    enabled: !!account && albumId > 0 && enabled,
    queryFn: ({ signal }) => account ? getAlbumMembers(instance, account, albumId, signal) : Promise.reject(new Error("An authenticated account is required.")),
  });
}

export function useAlbumFileDetailQuery(context: AlbumQueryContext & { albumId: number; fileId: number; enabled?: boolean }) {
  const { instance, account, accountKey, albumId, fileId, enabled = true } = context;
  return useQuery({
    queryKey: albumKeys.fileDetail(accountKey, albumId, fileId),
    enabled: !!account && albumId > 0 && fileId > 0 && enabled,
    queryFn: ({ signal }) => account ? getAlbumFile(instance, account, albumId, fileId, signal) : Promise.reject(new Error("An authenticated account is required.")),
  });
}

// Seed the detail cache with the create response, then refresh album lists.
export function useCreateAlbumMutation(context: AlbumQueryContext) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateAlbumRequest) => context.account ? createAlbum(context.instance, context.account, request) : Promise.reject(new Error("An authenticated account is required.")),
    onSuccess: (album) => {
      client.setQueryData(albumKeys.detail(context.accountKey, album.id), album);
      return Promise.all([
        client.invalidateQueries({ queryKey: albumKeys.lists() }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

// Update the detail cache from the response and refresh all album lists.
export function useUpdateAlbumMutation(context: AlbumQueryContext & { albumId: number }) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateAlbumRequest) => context.account ? updateAlbum(context.instance, context.account, context.albumId, request) : Promise.reject(new Error("An authenticated account is required.")),
    onSuccess: (album) => { client.setQueryData(albumKeys.detail(context.accountKey, album.id), album); return client.invalidateQueries({ queryKey: albumKeys.lists() }); },
  });
}

// Remove deleted album details from cache and refresh all list variants.
export function useDeleteAlbumMutation(context: AlbumQueryContext) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (albumId: number) => context.account ? deleteAlbum(context.instance, context.account, albumId) : Promise.reject(new Error("An authenticated account is required.")),
    onSuccess: (_result, albumId) => {
      client.removeQueries({ queryKey: albumKeys.detail(context.accountKey, albumId) });
      client.removeQueries({ queryKey: ["albums", "files", context.accountKey, albumId] });
      client.removeQueries({ queryKey: albumKeys.members(context.accountKey, albumId) });
      return Promise.all([
        client.invalidateQueries({ queryKey: albumKeys.lists() }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}
