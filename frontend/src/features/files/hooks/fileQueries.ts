import { useMutation, useQuery } from "@tanstack/react-query";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { addFavorite, getAdminFiles, getFavorites, getFiles, removeFavorite } from "@/features/files/api/filesApi";
import { queryClient } from "@/shared/api/queryClient";

export const fileKeys = {
  all: ["files"] as const,
  lists: () => [...fileKeys.all, "list"] as const,
  list: (accountId: string | null, view: string, page: number, pageSize: number, search: string, category?: string, adminAll = false) =>
    [...fileKeys.lists(), accountId, view, page, pageSize, search, category ?? "", adminAll] as const,
  details: () => [...fileKeys.all, "detail"] as const,
  detail: (id: number) => [...fileKeys.details(), id] as const,
};

interface FileQueryContext { instance: IPublicClientApplication; account: AccountInfo | null; accountKey: string | null }

export function useFileListQuery(context: FileQueryContext & { view: "all" | "favorites"; page: number; pageSize: number; search?: string; category?: string; adminAll?: boolean }) {
  const { instance, account, accountKey, view, page, pageSize, search, category, adminAll } = context;
  return useQuery({
    queryKey: fileKeys.list(accountKey, view, page, pageSize, search ?? "", category, adminAll),
    enabled: !!account,
    queryFn: async ({ signal }) => {
      if (!account) throw new Error("An authenticated account is required.");
      if (view === "favorites") return getFavorites(instance, account, page, pageSize, search, category, signal);
      if (adminAll) return getAdminFiles(instance, account, page, pageSize, search, category, signal);
      return getFiles(instance, account, page, pageSize, search, category, signal);
    },
  });
}

export function useToggleFavoriteMutation(context: FileQueryContext) {
  return useMutation({
    mutationFn: ({ fileId, favorite }: { fileId: number; favorite: boolean }) => {
      if (!context.account) return Promise.reject(new Error("An authenticated account is required."));
      return favorite ? addFavorite(context.instance, context.account, fileId) : removeFavorite(context.instance, context.account, fileId);
    },
    onMutate: async ({ fileId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: fileKeys.lists() });
      const previous = queryClient.getQueriesData({ queryKey: fileKeys.lists() });
      queryClient.setQueriesData({ queryKey: fileKeys.lists() }, (data: unknown) => {
        if (!data || typeof data !== "object" || !("items" in data) || !Array.isArray(data.items)) return data;
        return { ...data, items: data.items.map((item: unknown) => item && typeof item === "object" && "id" in item && item.id === fileId ? { ...item, isFavorite: favorite } : item) };
      });
      return { previous };
    },
    onError: (_error, _variables, context) => context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: fileKeys.lists() }),
  }, queryClient);
}
