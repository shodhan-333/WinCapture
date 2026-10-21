import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { getAdminAlbums, getMyAlbums } from "@/features/albums/api/albumsApi";
import type { AlbumResponse } from "@/features/albums/types/album";
import { getAdminFiles, getFiles } from "@/features/files/api/filesApi";
import {
  DASHBOARD_FILE_CATEGORIES,
  ALL_CONTENT_PAGE_SIZE,
} from "@/features/dashboard/constants/dashboard";
import type { DashboardFile } from "@/features/dashboard/types/dashboard";

interface UseDashboardDataOptions {
  instance: IPublicClientApplication;
  account: AccountInfo | null;
  accountKey: string | null;
  canViewAllContent: boolean;
  contentScope: "mine" | "all";
  contentVersion: number;
  allAlbumsPage: number;
  allFilesPage: number;
  allAlbumsSearch: string;
  allFilesSearch: string;
  setAlbums: Dispatch<SetStateAction<AlbumResponse[]>>;
  setFiles: Dispatch<SetStateAction<DashboardFile[]>>;
  setAllAlbumsPage: Dispatch<SetStateAction<number>>;
  setAllFilesPage: Dispatch<SetStateAction<number>>;
  setAllAlbumsPageCount: Dispatch<SetStateAction<number>>;
  setAllFilesPageCount: Dispatch<SetStateAction<number>>;
  setAllAlbumsCount: Dispatch<SetStateAction<number>>;
  setAllFilesCount: Dispatch<SetStateAction<number>>;
}

// Load personal or admin dashboard data and cache category counts for the active identity and scope.
export function useDashboardData({
  instance,
  account,
  accountKey,
  canViewAllContent,
  contentScope,
  contentVersion,
  allAlbumsPage,
  allFilesPage,
  allAlbumsSearch,
  allFilesSearch,
  setAlbums,
  setFiles,
  setAllAlbumsPage,
  setAllFilesPage,
  setAllAlbumsPageCount,
  setAllFilesPageCount,
  setAllAlbumsCount,
  setAllFilesCount,
}: UseDashboardDataOptions) {
  const [fileCategoryCounts, setFileCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const albumsDataKey = useRef<string | null>(null);
  const filesDataKey = useRef<string | null>(null);
  const categoryCountsCache = useRef(
    new Map<string, { version: number; counts: Record<string, number> }>(),
  );

  useEffect(() => {
    let active = true;

    // Load only the dashboard sections whose account, filters, or paging changed.
    async function load(): Promise<void> {
      if (!account) {
        setLoading(false);
        return;
      }

      const allScope = canViewAllContent && contentScope === "all";
      // Request keys prevent unrelated renders from refetching unchanged pages.
      const requestedAlbumsKey = allScope
        ? `${accountKey}:all:${contentVersion}:${allAlbumsPage}:${allAlbumsSearch}`
        : `${accountKey}:mine:${contentVersion}`;
      const requestedFilesKey = allScope
        ? `${accountKey}:all:${contentVersion}:${allFilesPage}:${allFilesSearch}`
        : `${accountKey}:mine:${contentVersion}`;
      const effectiveContentScope = contentScope === "all" && canViewAllContent ? "all" : "mine";
      const requestedCountsKey = `${accountKey}:${effectiveContentScope}`;
      const cachedCounts = categoryCountsCache.current.get(requestedCountsKey);
      const countsAreCurrent = cachedCounts?.version === contentVersion;
      const shouldLoadAlbums = albumsDataKey.current !== requestedAlbumsKey;
      const shouldLoadFiles = filesDataKey.current !== requestedFilesKey;
      const shouldLoadCounts = !countsAreCurrent;

      if (!shouldLoadAlbums && !shouldLoadFiles && !shouldLoadCounts) {
        setFileCategoryCounts(cachedCounts.counts);
        setLoading(false);
        setHasLoaded(true);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setFileCategoryCounts(countsAreCurrent ? cachedCounts.counts : {});

        const albumsRequest = !shouldLoadAlbums
          ? Promise.resolve(null)
          : allScope
            ? getAdminAlbums(
                instance,
                account,
                allAlbumsPage,
                ALL_CONTENT_PAGE_SIZE,
                allAlbumsSearch.trim() || undefined,
              )
            : getMyAlbums(instance, account, 1, 4);
        const filesRequest = !shouldLoadFiles
          ? Promise.resolve(null)
          : allScope
            ? getAdminFiles(
                instance,
                account,
                allFilesPage,
                ALL_CONTENT_PAGE_SIZE,
                allFilesSearch.trim() || undefined,
              ).then((fileResult) => ({
                page: fileResult.page,
                pageCount: fileResult.pageCount,
                totalItems: fileResult.totalItems,
                items: fileResult.items.map((file): DashboardFile => ({
                  ...file,
                  url: "",
                  downloadUrl:
                    file.albumId === null
                      ? `/api/files/${file.id}/download`
                      : `/api/albums/${file.albumId}/files/${file.id}/download`,
                  isFavorite: false,
                  canManage: true,
                  canDownload: true,
                })),
              }))
            : getFiles(instance, account, 1, 4);
        // Fetch the visible lists and category totals together, then ignore results after unmount.
        const [albumResult, fileResult, categoryResults] = await Promise.all([
          albumsRequest,
          filesRequest,
          shouldLoadCounts
            ? Promise.all(
                DASHBOARD_FILE_CATEGORIES.map(({ label }) =>
                  effectiveContentScope === "all"
                    ? getAdminFiles(instance, account, 1, 1, undefined, label)
                    : getFiles(instance, account, 1, 1, undefined, label),
                ),
              )
            : Promise.resolve([]),
        ]);

        if (!active) return;

        if (albumResult) {
          setAlbums(albumResult.items);
          setAllAlbumsPage(albumResult.page ?? 1);
          setAllAlbumsPageCount(albumResult.pageCount ?? 1);
          setAllAlbumsCount(albumResult.totalItems);
          albumsDataKey.current = requestedAlbumsKey;
        }
        if (fileResult) {
          setFiles(fileResult.items);
          setAllFilesPage(fileResult.page ?? 1);
          setAllFilesPageCount(fileResult.pageCount ?? 1);
          setAllFilesCount(fileResult.totalItems);
          filesDataKey.current = requestedFilesKey;
        }
        if (shouldLoadCounts) {
          const counts = Object.fromEntries(
            DASHBOARD_FILE_CATEGORIES.map(({ label }, index) => [
              label,
              categoryResults[index]?.totalItems ?? 0,
            ]),
          );
          categoryCountsCache.current.set(requestedCountsKey, {
            version: contentVersion,
            counts,
          });
          setFileCategoryCounts(counts);
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error ? caughtError.message : "Unable to load dashboard data.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
    // accountKey changes only when the signed-in identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accountKey,
    allAlbumsPage,
    allAlbumsSearch,
    allFilesPage,
    allFilesSearch,
    canViewAllContent,
    contentScope,
    contentVersion,
    instance,
  ]);

  return { fileCategoryCounts, loading, hasLoaded, error, setError };
}
