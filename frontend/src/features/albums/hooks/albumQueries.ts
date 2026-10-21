import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { createAlbum, deleteAlbum, getAlbum, getAdminAlbums, getAlbums, getMyAlbums, getSharedAlbums, updateAlbum } from "@/features/albums/api/albumsApi";
import type { CreateAlbumRequest, UpdateAlbumRequest } from "@/features/albums/types/album";

export const albumKeys = {
  all: ["albums"] as const,
  lists: () => [...albumKeys.all, "list"] as const,
  list: (accountId: string | null, filter: string, page: number, pageSize: number, search: string, adminAll: boolean) =>
    [...albumKeys.lists(), accountId, filter, page, pageSize, search, adminAll] as const,
  details: () => [...albumKeys.all, "detail"] as const,
  detail: (id: number) => [...albumKeys.details(), id] as const,
};

interface AlbumQueryContext {
  instance: IPublicClientApplication;
  account: AccountInfo | null;
  accountKey: string | null;
}

// Keep each list variant's paging, filters, identity, and admin scope in its cache key.
export function useAlbumListQuery(context: AlbumQueryContext & { page: number; pageSize: number; filter: "all" | "mine" | "shared"; search?: string; adminAll?: boolean }) {
  const { instance, account, accountKey, page, pageSize, filter, search, adminAll = false } = context;
  return useQuery({
    queryKey: albumKeys.list(accountKey, filter, page, pageSize, search ?? "", adminAll),
    enabled: !!account,
    queryFn: async ({ signal }) => {
      if (!account) throw new Error("An authenticated account is required.");
      if (adminAll) return getAdminAlbums(instance, account, page, pageSize, search, signal);
      if (filter === "mine") return getMyAlbums(instance, account, page, pageSize, search, signal);
      if (filter === "shared") return getSharedAlbums(instance, account, page, pageSize, search, signal);
      return getAlbums(instance, account, page, pageSize, search, signal);
    },
  });
}

// Load one album only after an account and a valid album identifier are available.
export function useAlbumDetailQuery(context: AlbumQueryContext & { albumId: number }) {
  const { instance, account, albumId } = context;
  return useQuery({
    queryKey: albumKeys.detail(albumId),
    enabled: !!account && albumId > 0,
    queryFn: () => account ? getAlbum(instance, account, albumId) : Promise.reject(new Error("An authenticated account is required.")),
  });
}

// Seed the detail cache with the create response, then refresh album lists.
export function useCreateAlbumMutation(context: AlbumQueryContext) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateAlbumRequest) => context.account ? createAlbum(context.instance, context.account, request) : Promise.reject(new Error("An authenticated account is required.")),
    onSuccess: (album) => { client.setQueryData(albumKeys.detail(album.id), album); return client.invalidateQueries({ queryKey: albumKeys.lists() }); },
  });
}

// Update the detail cache from the response and refresh all album lists.
export function useUpdateAlbumMutation(context: AlbumQueryContext & { albumId: number }) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateAlbumRequest) => context.account ? updateAlbum(context.instance, context.account, context.albumId, request) : Promise.reject(new Error("An authenticated account is required.")),
    onSuccess: (album) => { client.setQueryData(albumKeys.detail(album.id), album); return client.invalidateQueries({ queryKey: albumKeys.lists() }); },
  });
}

// Remove deleted album details from cache and refresh all list variants.
export function useDeleteAlbumMutation(context: AlbumQueryContext) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (albumId: number) => context.account ? deleteAlbum(context.instance, context.account, albumId) : Promise.reject(new Error("An authenticated account is required.")),
    onSuccess: (_result, albumId) => { client.removeQueries({ queryKey: albumKeys.detail(albumId) }); return client.invalidateQueries({ queryKey: albumKeys.lists() }); },
  });
}
