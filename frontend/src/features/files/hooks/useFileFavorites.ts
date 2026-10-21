import { useMemo } from "react";
import { useMutationState } from "@tanstack/react-query";
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

// Derive pending file IDs from Query mutations; the mutation updates and invalidates cached lists.
export function useFileFavorites({ instance, account, accountKey = account?.homeAccountId ?? null, onSuccess, onError }: UseFileFavoritesOptions) {
  const favoriteMutation = useToggleFavoriteMutation({ instance, account, accountKey });
  const pendingIds = useMutationState({
    filters: { mutationKey: ["files", "favorite"], status: "pending" },
    select: (mutation) => (mutation.state.variables as { fileId?: number } | undefined)?.fileId,
  });
  const pendingSet = useMemo(() => new Set(pendingIds.filter((id): id is number => typeof id === "number")), [pendingIds]);

  const toggleFavorite = async (file: FileResponse): Promise<void> => {
    if (!account || pendingSet.has(file.id)) return;
    const nextFavorite = !file.isFavorite;
    try {
      await favoriteMutation.mutateAsync({ fileId: file.id, favorite: nextFavorite });
      onSuccess(file, nextFavorite);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unable to update favorite.");
    }
  };

  return { pendingIds: pendingSet, toggleFavorite };
}
