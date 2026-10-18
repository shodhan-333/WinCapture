import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import {
  getAdminAlbums,
  getAlbums,
  getMyAlbums,
  getSharedAlbums,
} from "@/features/albums/api/albumsApi";
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

export function useAlbumsData({
  instance,
  account,
  accountKey,
  userId,
  isAdminAllContent,
  currentPage,
  albumFilter,
  searchQuery,
  setCurrentPage,
}: UseAlbumsDataOptions) {
  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [pageCount, setPageCount] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadRequestVersion = useRef(0);

  const loadAlbums = useCallback(
    async (
      requestedPage: number = currentPage,
      requestedFilter: AlbumFilter = albumFilter,
      requestedSearch: string = searchQuery,
    ): Promise<void> => {
      const requestVersion = ++loadRequestVersion.current;
      if (!account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let page: PagedResponse<AlbumResponse>;
        if (isAdminAllContent) {
          page = await getAdminAlbums(instance, account, requestedPage, PAGE_SIZE, requestedSearch);
        } else if (requestedFilter === "shared") {
          try {
            page = await getSharedAlbums(
              instance,
              account,
              requestedPage,
              PAGE_SIZE,
              requestedSearch,
            );
          } catch (caughtError) {
            if (!(caughtError instanceof ApiError) || caughtError.status !== 404 || !userId) {
              throw caughtError;
            }

            const firstPage = await getAlbums(instance, account, 1, 100, requestedSearch);
            if (requestVersion !== loadRequestVersion.current) return;
            const accessibleAlbums = [...firstPage.items];
            for (let pageNumber = 2; pageNumber <= firstPage.pageCount; pageNumber += 1) {
              const nextPage = await getAlbums(instance, account, pageNumber, 100, requestedSearch);
              if (requestVersion !== loadRequestVersion.current) return;
              accessibleAlbums.push(...nextPage.items);
            }

            const sharedAlbums = accessibleAlbums.filter((item) => item.ownerId !== userId);
            const startIndex = (requestedPage - 1) * PAGE_SIZE;
            page = {
              items: sharedAlbums.slice(startIndex, startIndex + PAGE_SIZE),
              totalItems: sharedAlbums.length,
              page: requestedPage,
              pageSize: PAGE_SIZE,
              pageCount: Math.ceil(sharedAlbums.length / PAGE_SIZE),
            };
          }
        } else {
          const loadPage = requestedFilter === "mine" ? getMyAlbums : getAlbums;
          page = await loadPage(instance, account, requestedPage, PAGE_SIZE, requestedSearch);
        }

        if (requestVersion !== loadRequestVersion.current) return;
        setAlbums(page.items);
        setCurrentPage(page.page);
        setPageCount(page.pageCount);
        setTotalItems(page.totalItems);
      } catch (caughtError) {
        if (requestVersion !== loadRequestVersion.current) return;
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load albums.");
      } finally {
        if (requestVersion === loadRequestVersion.current) {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    },
    // The account key tracks identity changes; token refreshes reuse the current data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      accountKey,
      albumFilter,
      currentPage,
      instance,
      isAdminAllContent,
      searchQuery,
      setCurrentPage,
      userId,
    ],
  );

  useEffect(() => {
    void loadAlbums();
    return () => {
      loadRequestVersion.current += 1;
    };
  }, [loadAlbums, currentPage, albumFilter, searchQuery]);

  return { albums, pageCount, totalItems, loading, hasLoaded, error, setError };
}
