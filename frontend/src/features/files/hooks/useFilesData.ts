import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { getAdminFiles, getFavorites, getFiles } from "@/features/files/api/filesApi";
import type { FileCategoryFilter } from "@/features/files/constants/fileSupport";
import type { AdminFileResponse, FileResponse, FileView } from "@/features/files/types/file";
import type { PagedResponse } from "@/shared/types/api";

const PAGE_SIZE = 12;

interface UseFilesDataOptions {
  instance: IPublicClientApplication;
  account: AccountInfo | null;
  view: FileView;
  currentPage: number;
  searchQuery: string;
  categoryFilter: FileCategoryFilter;
  isAdminAllContent: boolean;
  routeFileId: number | null;
  retain: (ids: number[]) => void;
  setFocusedFileId: Dispatch<SetStateAction<number | null>>;
  setCurrentPage: Dispatch<SetStateAction<number>>;
}

export function useFilesData({
  instance,
  account,
  view,
  currentPage,
  searchQuery,
  categoryFilter,
  isAdminAllContent,
  routeFileId,
  retain,
  setFocusedFileId,
  setCurrentPage,
}: UseFilesDataOptions) {
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadRequestVersion = useRef(0);
  const focusedFileResolved = useRef(false);

  const fetchAdminPage = useCallback(
    async (page: number): Promise<PagedResponse<FileResponse>> => {
      if (!account) throw new Error("An authenticated account is required.");
      const result = await getAdminFiles(
        instance,
        account,
        page,
        PAGE_SIZE,
        searchQuery,
        categoryFilter,
      );
      return {
        ...result,
        items: result.items.map((file: AdminFileResponse): FileResponse => ({
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
      };
    },
    [account, categoryFilter, instance, searchQuery],
  );

  const loadFiles = useCallback(
    async (
      nextView: FileView = view,
      requestedPage: number = currentPage,
      requestedCategory: FileCategoryFilter = categoryFilter,
    ): Promise<void> => {
      const requestVersion = ++loadRequestVersion.current;
      if (!account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const nextPage =
          nextView === "favorites"
            ? await getFavorites(
                instance,
                account,
                requestedPage,
                PAGE_SIZE,
                searchQuery,
                requestedCategory,
              )
            : isAdminAllContent
              ? await fetchAdminPage(requestedPage)
              : await getFiles(
                  instance,
                  account,
                  requestedPage,
                  PAGE_SIZE,
                  searchQuery,
                  requestedCategory,
                );

        if (
          nextView === "all" &&
          routeFileId &&
          !focusedFileResolved.current &&
          requestedPage === 1
        ) {
          let targetPage = nextPage;
          const fetchTargetPage = (page: number) =>
            isAdminAllContent
              ? fetchAdminPage(page)
              : getFiles(instance, account, page, PAGE_SIZE, searchQuery, requestedCategory);
          while (
            !targetPage.items.some((file) => file.id === routeFileId) &&
            targetPage.page < targetPage.pageCount
          ) {
            targetPage = await fetchTargetPage(targetPage.page + 1);
          }
          if (targetPage.items.some((file) => file.id === routeFileId)) {
            nextPage.items = targetPage.items;
            nextPage.page = targetPage.page;
            setFocusedFileId(routeFileId);
          }
          focusedFileResolved.current = true;
        }

        if (requestVersion !== loadRequestVersion.current) return;
        setFiles(nextPage.items);
        retain(
          nextPage.items
            .filter((file) => nextView === "favorites" || file.canManage)
            .map((file) => file.id),
        );
        setTotalItems(nextPage.totalItems);
        setPageCount(nextPage.pageCount);
        setCurrentPage(nextPage.page);
      } catch (caughtError) {
        if (requestVersion !== loadRequestVersion.current) return;
        setFiles([]);
        retain([]);
        setTotalItems(0);
        setPageCount(1);
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load files.");
      } finally {
        if (requestVersion === loadRequestVersion.current) {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    },
    [
      account,
      categoryFilter,
      currentPage,
      fetchAdminPage,
      instance,
      isAdminAllContent,
      retain,
      routeFileId,
      searchQuery,
      setCurrentPage,
      setFocusedFileId,
      view,
    ],
  );

  useEffect(() => {
    void loadFiles(view, currentPage);
    return () => {
      loadRequestVersion.current += 1;
    };
  }, [loadFiles, view, currentPage]);

  return { files, setFiles, totalItems, pageCount, loading, hasLoaded, error, setError, loadFiles };
}
