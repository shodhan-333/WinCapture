import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { useQueries } from "@tanstack/react-query";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { getAdminAlbums, getMyAlbums } from "@/features/albums/api/albumsApi";
import type { AlbumResponse } from "@/features/albums/types/album";
import { getAdminFiles, getFiles } from "@/features/files/api/filesApi";
import { DASHBOARD_FILE_CATEGORIES, ALL_CONTENT_PAGE_SIZE } from "@/features/dashboard/constants/dashboard";
import type { DashboardFile } from "@/features/dashboard/types/dashboard";
import type { PagedResponse } from "@/shared/types/api";

const dashboardKeys = {
  all: ["dashboard"] as const,
  albums: (accountKey: string | null, scope: string, page: number, search: string) =>
    [...dashboardKeys.all, "albums", accountKey, scope, page, search] as const,
  files: (accountKey: string | null, scope: string, page: number, search: string) =>
    [...dashboardKeys.all, "files", accountKey, scope, page, search] as const,
  category: (accountKey: string | null, scope: string, category: string) =>
    [...dashboardKeys.all, "category", accountKey, scope, category] as const,
};

interface UseDashboardDataOptions {
  instance: IPublicClientApplication;
  account: AccountInfo | null;
  accountKey: string | null;
  canViewAllContent: boolean;
  contentScope: "mine" | "all";
  allAlbumsPage: number;
  allFilesPage: number;
  allAlbumsSearch: string;
  allFilesSearch: string;
  setAllAlbumsPage: Dispatch<SetStateAction<number>>;
  setAllFilesPage: Dispatch<SetStateAction<number>>;
}

// Query dashboard lists and category totals; loading, errors, and caching come from Query.
export function useDashboardData({
  instance,
  account,
  accountKey,
  canViewAllContent,
  contentScope,
  allAlbumsPage,
  allFilesPage,
  allAlbumsSearch,
  allFilesSearch,
  setAllAlbumsPage,
  setAllFilesPage,
}: UseDashboardDataOptions) {
  const allScope = canViewAllContent && contentScope === "all";
  const scopeKey = allScope ? "all" : "mine";
  const queries = useQueries({
    queries: [
      {
        queryKey: dashboardKeys.albums(accountKey, scopeKey, allScope ? allAlbumsPage : 1, allScope ? allAlbumsSearch : ""),
        enabled: !!account,
        queryFn: async ({ signal }: QueryFunctionContext) => {
          if (!account) throw new Error("An authenticated account is required.");
          return allScope
            ? getAdminAlbums(instance, account, allAlbumsPage, ALL_CONTENT_PAGE_SIZE, allAlbumsSearch.trim() || undefined, signal)
            : getMyAlbums(instance, account, 1, 4, undefined, signal);
        },
      },
      {
        queryKey: dashboardKeys.files(accountKey, scopeKey, allScope ? allFilesPage : 1, allScope ? allFilesSearch : ""),
        enabled: !!account,
        queryFn: async ({ signal }: QueryFunctionContext): Promise<PagedResponse<DashboardFile>> => {
          if (!account) throw new Error("An authenticated account is required.");
          if (!allScope) return getFiles(instance, account, 1, 4, undefined, undefined, signal);
          const result = await getAdminFiles(instance, account, allFilesPage, ALL_CONTENT_PAGE_SIZE, allFilesSearch.trim() || undefined, undefined, signal);
          return {
            ...result,
            items: result.items.map((file): DashboardFile => ({
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
        },
      },
      ...DASHBOARD_FILE_CATEGORIES.map(({ label }) => ({
        queryKey: dashboardKeys.category(accountKey, scopeKey, label),
        enabled: !!account,
        queryFn: async ({ signal }: QueryFunctionContext) => {
          if (!account) throw new Error("An authenticated account is required.");
          const result = allScope
            ? await getAdminFiles(instance, account, 1, 1, undefined, label, signal)
            : await getFiles(instance, account, 1, 1, undefined, label, signal);
          return result.totalItems;
        },
      })),
    ],
  });

  const albumsQuery = queries[0]!;
  const filesQuery = queries[1]!;
  const categoryQueries = queries.slice(2);
  const albumPage = albumsQuery.data as PagedResponse<AlbumResponse> | undefined;
  const filePage = filesQuery.data as PagedResponse<DashboardFile> | undefined;
  useEffect(() => {
    if (!allScope) return;
    if (albumPage && albumPage.page !== allAlbumsPage) setAllAlbumsPage(albumPage.page);
    if (filePage && filePage.page !== allFilesPage) setAllFilesPage(filePage.page);
  }, [allAlbumsPage, allScope, allFilesPage, albumPage, filePage, setAllAlbumsPage, setAllFilesPage]);

  const fileCategoryCounts = Object.fromEntries(
    DASHBOARD_FILE_CATEGORIES.map(({ label }, index) => [label, categoryQueries[index]?.data ?? 0]),
  );
  const error = queries.find((query) => query.error)?.error;
  const loading = queries.some((query) => query.isFetching);
  const hasLoaded = queries.some((query) => query.isFetched);

  return {
    albums: albumPage?.items ?? [],
    files: filePage?.items ?? [],
    fileCategoryCounts,
    loading,
    hasLoaded,
    error: error instanceof Error ? error.message : null,
    allAlbumsCount: albumPage?.totalItems ?? 0,
    allFilesCount: filePage?.totalItems ?? 0,
    allAlbumsPageCount: albumPage?.pageCount ?? 1,
    allFilesPageCount: filePage?.pageCount ?? 1,
  };
}
