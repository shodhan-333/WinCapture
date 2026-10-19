import { useCallback, useState } from "react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";

import { useToggleFavoriteMutation } from "@/features/files/hooks/fileQueries";
import type { FileResponse } from "@/features/files/types/file";

interface UseFileFavoritesOptions {
  instance: IPublicClientApplication;
  account: AccountInfo | null;
  accountKey?: string | null;
  onSuccess: (file: FileResponse, nextFavorite: boolean) => void;
  onError: (message: string) => void;
}

export function useFileFavorites({
  instance,
  account,
  accountKey = account?.homeAccountId ?? null,
  onSuccess,
  onError,
}: UseFileFavoritesOptions) {
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const favoriteMutation = useToggleFavoriteMutation({ instance, account, accountKey });

  const setPending = useCallback((fileId: number, pending: boolean) => {
    setPendingIds((previous) => {
      const next = new Set(previous);

      if (pending) {
        next.add(fileId);
      } else {
        next.delete(fileId);
      }

      return next;
    });
  }, []);

  const toggleFavorite = useCallback(
    async (file: FileResponse) => {
      if (!account || pendingIds.has(file.id)) {
        return;
      }

      const nextFavorite = !file.isFavorite;

      setPending(file.id, true);

      try {
        await favoriteMutation.mutateAsync({ fileId: file.id, favorite: nextFavorite });

        onSuccess(file, nextFavorite);
      } catch (caughtError) {
        onError(caughtError instanceof Error ? caughtError.message : "Unable to update favorite.");
      } finally {
        setPending(file.id, false);
      }
    },
    [account, favoriteMutation, onError, onSuccess, pendingIds, setPending],
  );

  return {
    pendingIds,
    toggleFavorite,
  };
}
