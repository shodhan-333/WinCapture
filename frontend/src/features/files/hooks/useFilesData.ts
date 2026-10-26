import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { useQueryClient } from "@tanstack/react-query";
import { useFileListQuery, fileKeys } from "@/features/files/hooks/fileQueries";
import type { FileCategoryFilter } from "@/features/files/constants/fileSupport";
import type { FileResponse, FileView } from "@/features/files/types/file";
import { getAccountKey } from "@/shared/utils/accountKey";

const PAGE_SIZE = 12;
const EMPTY_FILES: FileResponse[] = [];

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

// Keep the active file page in TanStack Query; leave selection and dialogs to the component.
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
  const queryClient = useQueryClient();
  const accountKey = getAccountKey(account);
  const [actionError, setActionError] = useState<string | null>(null);
  const routeLookupId = view === "all" && currentPage === 1 ? routeFileId : null;
  const query = useFileListQuery({
    instance,
    account,
    accountKey,
    view,
    page: currentPage,
    pageSize: PAGE_SIZE,
    search: searchQuery,
    category: categoryFilter,
    adminAll: isAdminAllContent && view === "all",
    routeFileId: routeLookupId,
  });

  useEffect(() => {
    const page = query.data;
    if (!page) return;
    retain(page.items.filter((file) => view === "favorites" || file.canManage).map((file) => file.id));
    if (page.page !== currentPage) setCurrentPage(page.page);
    if (routeFileId && page.items.some((file) => file.id === routeFileId)) {
      setFocusedFileId(routeFileId);
    }
  }, [currentPage, query.data, retain, routeFileId, setCurrentPage, setFocusedFileId, view]);

  const loadFiles = useCallback(async (...args: [view?: FileView, page?: number, category?: FileCategoryFilter]): Promise<void> => {
    void args;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["album-cover-preview"] }),
    ]);
  }, [queryClient]);

  return {
    files: query.data?.items ?? EMPTY_FILES,
    totalItems: query.data?.totalItems ?? 0,
    pageCount: query.data?.pageCount ?? 1,
    loading: query.isFetching,
    hasLoaded: query.isFetched,
    error: actionError ?? (query.error instanceof Error ? query.error.message : null),
    setError: setActionError,
    loadFiles,
  };
}
