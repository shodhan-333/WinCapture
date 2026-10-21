import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { addFavorite, getAdminFiles, getFavorites, getFile, getFiles, removeFavorite } from "@/features/files/api/filesApi";
import type { FileResponse } from "@/features/files/types/file";
import type { PagedResponse } from "@/shared/types/api";

export const fileKeys = {
  all: ["files"] as const,
  lists: () => [...fileKeys.all, "list"] as const,
  list: (accountId: string | null, view: string, page: number, pageSize: number, search: string, category?: string, adminAll = false, routeFileId?: number | null) =>
    [...fileKeys.lists(), accountId, view, page, pageSize, search, category ?? "", adminAll, routeFileId ?? null] as const,
  details: () => [...fileKeys.all, "detail"] as const,
  detail: (accountId: string | null, id: number) => [...fileKeys.details(), accountId, id] as const,
};

interface FileQueryContext { instance: IPublicClientApplication; account: AccountInfo | null; accountKey: string | null }

// Include account and every list filter in the cache key to keep views isolated.
export function useFileListQuery(context: FileQueryContext & { view: "all" | "favorites"; page: number; pageSize: number; search?: string; category?: string; adminAll?: boolean; routeFileId?: number | null }) {
  const { instance, account, accountKey, view, page, pageSize, search, category, adminAll, routeFileId } = context;
  return useQuery({
    queryKey: fileKeys.list(accountKey, view, page, pageSize, search ?? "", category, adminAll, routeFileId),
    enabled: !!account,
    queryFn: async ({ signal }): Promise<PagedResponse<FileResponse>> => {
      if (!account) throw new Error("An authenticated account is required.");
      const fetchPage = async (requestedPage: number): Promise<PagedResponse<FileResponse>> => {
        if (view === "favorites") return getFavorites(instance, account, requestedPage, pageSize, search, category, signal);
        if (adminAll) {
          const result = await getAdminFiles(instance, account, requestedPage, pageSize, search, category, signal);
          return {
            ...result,
            items: result.items.map((file): FileResponse => ({
              ...file,
              url: "",
              downloadUrl: file.albumId === null
                ? `/api/files/${file.id}/download`
                : `/api/albums/${file.albumId}/files/${file.id}/download`,
              isFavorite: false,
              canManage: true,
              canDownload: true,
            })),
          };
        }
        return getFiles(instance, account, requestedPage, pageSize, search, category, signal);
      };

      let result = await fetchPage(page);
      if (view === "all" && routeFileId && page === 1) {
        while (!result.items.some((file) => file.id === routeFileId) && result.page < result.pageCount) {
          result = await fetchPage(result.page + 1);
        }
      }
      return result;
    },
  });
}

export function useFileDetailQuery(context: FileQueryContext & { fileId: number; enabled?: boolean }) {
  const { instance, account, accountKey, fileId, enabled = true } = context;
  return useQuery({
    queryKey: fileKeys.detail(accountKey, fileId),
    enabled: !!account && fileId > 0 && enabled,
    queryFn: ({ signal }) => account ? getFile(instance, account, fileId, signal) : Promise.reject(new Error("An authenticated account is required.")),
  });
}

// Persist a favorite change and roll back the optimistic list update on failure.
export function useToggleFavoriteMutation(context: FileQueryContext) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["files", "favorite"],
    mutationFn: ({ fileId, favorite }: { fileId: number; favorite: boolean }) => {
      if (!context.account) return Promise.reject(new Error("An authenticated account is required."));
      return favorite ? addFavorite(context.instance, context.account, fileId) : removeFavorite(context.instance, context.account, fileId);
    },
    onMutate: async ({ fileId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: fileKeys.lists() });
      await queryClient.cancelQueries({ queryKey: ["albums", "files"] });
      const previousFiles = queryClient.getQueriesData({ queryKey: fileKeys.lists() });
      const previousAlbumFiles = queryClient.getQueriesData({ queryKey: ["albums", "files"] });
      const updateFavorite = (data: unknown) => {
        if (!data || typeof data !== "object" || !("items" in data) || !Array.isArray(data.items)) return data;
        return { ...data, items: data.items.map((item: unknown) => item && typeof item === "object" && "id" in item && item.id === fileId ? { ...item, isFavorite: favorite } : item) };
      };
      queryClient.setQueriesData({ queryKey: fileKeys.lists() }, updateFavorite);
      queryClient.setQueriesData({ queryKey: ["albums", "files"] }, updateFavorite);
      return { previousFiles, previousAlbumFiles };
    },
    onError: (_error, _variables, context) => {
      context?.previousFiles.forEach(([key, data]) => queryClient.setQueryData(key, data));
      context?.previousAlbumFiles.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: ["albums", "files"] }),
    ]),
  });
}
