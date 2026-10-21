import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { useQuery } from "@tanstack/react-query";
import { getAdminAlbums, getAlbums, getMyAlbums, getSharedAlbums } from "@/features/albums/api/albumsApi";
import { albumKeys } from "@/features/albums/hooks/albumQueries";
import type { AlbumResponse } from "@/features/albums/types/album";
import { ApiError, type PagedResponse } from "@/shared/types/api";

const PAGE_SIZE = 9;
export type AlbumFilter = "all" | "shared" | "mine";

interface UseAlbumsDataOptions {
  instance: IPublicClientApplication;
  account: AccountInfo | null;
  accountKey: string | null;
  userId: number | undefined;
  isAdminAllContent: boolean;
  currentPage: number;
  albumFilter: AlbumFilter;
  searchQuery: string;
  setCurrentPage: Dispatch<SetStateAction<number>>;
}

// Load the selected album list and adapt the legacy shared-album route when needed.
export function useAlbumsData({ instance, account, accountKey, userId, isAdminAllContent, currentPage, albumFilter, searchQuery, setCurrentPage }: UseAlbumsDataOptions) {
  const query = useQuery<PagedResponse<AlbumResponse>>({
    queryKey: albumKeys.list(accountKey, albumFilter, currentPage, PAGE_SIZE, searchQuery, isAdminAllContent),
    enabled: !!account,
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === accountKey ? previousData : undefined,
    queryFn: async ({ signal }) => {
      if (!account) throw new Error("An authenticated account is required.");
      if (isAdminAllContent) return getAdminAlbums(instance, account, currentPage, PAGE_SIZE, searchQuery, signal);
      if (albumFilter === "mine") return getMyAlbums(instance, account, currentPage, PAGE_SIZE, searchQuery, signal);
      if (albumFilter === "all") return getAlbums(instance, account, currentPage, PAGE_SIZE, searchQuery, signal);
      try {
        return await getSharedAlbums(instance, account, currentPage, PAGE_SIZE, searchQuery, signal);
      } catch (error) {
        // Older backends may not expose the shared route; derive shared albums from accessible results.
        if (signal.aborted || !(error instanceof ApiError) || error.status !== 404 || !userId) throw error;
        const firstPage = await getAlbums(instance, account, 1, 100, searchQuery, signal);
        const accessible = [...firstPage.items];
        for (let next = 2; next <= firstPage.pageCount; next += 1) accessible.push(...(await getAlbums(instance, account, next, 100, searchQuery, signal)).items);
        const shared = accessible.filter((album) => album.ownerId !== userId);
        const pageCount = Math.ceil(shared.length / PAGE_SIZE);
        return { items: shared.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), totalItems: shared.length, page: currentPage, pageSize: PAGE_SIZE, pageCount };
      }
    },
  });
  useEffect(() => {
    if (!query.isPlaceholderData && query.data && query.data.page !== currentPage) setCurrentPage(query.data.page);
  }, [currentPage, query.data, query.isPlaceholderData, setCurrentPage]);
  const data = query.data;
  return {
    albums: data?.items ?? [],
    pageCount: data?.pageCount ?? 1,
    totalItems: data?.totalItems ?? 0,
    loading: query.isPending || query.isFetching,
    hasLoaded: query.isSuccess || query.isError,
    error: query.error instanceof Error ? query.error.message : null,
  };
}
