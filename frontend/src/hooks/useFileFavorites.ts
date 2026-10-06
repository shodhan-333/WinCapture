import { useCallback, useState } from "react";
import type {
  AccountInfo,
  IPublicClientApplication,
} from "@azure/msal-browser";

import {
  addFavorite,
  removeFavorite,
} from "../api/apiClient";
import type { FileResponse } from "../types/file";

interface UseFileFavoritesOptions {
  instance: IPublicClientApplication;
  account: AccountInfo | null;
  onSuccess: (
    file: FileResponse,
    nextFavorite: boolean,
  ) => void;
  onError: (message: string) => void;
}

export default function useFileFavorites({
  instance,
  account,
  onSuccess,
  onError,
}: UseFileFavoritesOptions) {
  const [pendingIds, setPendingIds] =
    useState<Set<number>>(new Set());

  const setPending = useCallback(
    (fileId: number, pending: boolean) => {
      setPendingIds((previous) => {
        const next = new Set(previous);

        if (pending) {
          next.add(fileId);
        } else {
          next.delete(fileId);
        }

        return next;
      });
    },
    [],
  );

  const toggleFavorite = useCallback(
    async (file: FileResponse) => {
      if (!account || pendingIds.has(file.id)) {
        return;
      }

      const nextFavorite = !file.isFavorite;

      setPending(file.id, true);

      try {
        if (nextFavorite) {
          await addFavorite(
            instance,
            account,
            file.id,
          );
        } else {
          await removeFavorite(
            instance,
            account,
            file.id,
          );
        }

        onSuccess(file, nextFavorite);
      } catch (caughtError) {
        onError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to update favorite.",
        );
      } finally {
        setPending(file.id, false);
      }
    },
    [
      account,
      instance,
      onError,
      onSuccess,
      pendingIds,
      setPending,
    ],
  );

  return {
    pendingIds,
    toggleFavorite,
  };
}
