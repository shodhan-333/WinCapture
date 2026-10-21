import { useMutation, useMutationState } from "@tanstack/react-query";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { deleteFile, removeFavorite } from "@/features/files/api/filesApi";
import type { FileResponse, FileView } from "@/features/files/types/file";

export type BulkAction = "delete" | "unfavorite" | null;

interface UseFileBulkActionsOptions {
  instance: IPublicClientApplication;
  account: AccountInfo | null;
  selectedFiles: FileResponse[];
  bulkAction: BulkAction;
  view: FileView;
  currentPage: number;
  loadFiles: (view: FileView, page?: number) => Promise<void>;
  removeSelected: (ids: number[]) => void;
  cancelSelection: () => void;
  setError: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  clearBulkAction: () => void;
}

// Run selected file changes independently and report partial success and cleanup warnings.
export function useFileBulkActions({
  instance,
  account,
  selectedFiles,
  bulkAction,
  view,
  currentPage,
  loadFiles,
  removeSelected,
  cancelSelection,
  setError,
  setSuccessMessage,
  clearBulkAction,
}: UseFileBulkActionsOptions) {
  const bulkMutation = useMutation({
    mutationKey: ["files", "bulk-action"],
    mutationFn: async ({ fileId, action }: { fileId: number; action: BulkAction }) => {
      if (!account) throw new Error("An authenticated account is required.");
      if (action === "unfavorite") {
        await removeFavorite(instance, account, fileId);
        return { storageCleanupComplete: true };
      }
      return deleteFile(instance, account, fileId);
    },
  });
  const pendingMutations = useMutationState({
    filters: { mutationKey: ["files", "bulk-action"], status: "pending" },
  });
  const bulkPending = pendingMutations.length > 0;

  const runBulkAction = async (): Promise<void> => {
    if (!account || bulkPending || !selectedFiles.length || !bulkAction) return;

    setError(null);
    const results = await Promise.all(
      selectedFiles.map(async (file) => {
        try {
          const deletion = await bulkMutation.mutateAsync({ fileId: file.id, action: bulkAction });
          return {
            id: file.id,
            ok: true as const,
            cleanupComplete: deletion.storageCleanupComplete !== false,
          };
        } catch (failure) {
          return {
            id: file.id,
            ok: false as const,
            message: failure instanceof Error ? failure.message : "Request failed.",
          };
        }
      }),
    );
    const succeeded = results.filter((result) => result.ok).map((result) => result.id);
    const failed = results.filter((result) => !result.ok);
    const cleanupWarnings = results.filter((result) => result.ok && !result.cleanupComplete).length;
    const failedNames = failed
      .map((result) => selectedFiles.find((file) => file.id === result.id)?.originalFileName)
      .filter(Boolean);
    // Failed files stay selected so the user can identify and retry them.
    removeSelected(succeeded);
    const failureSummary = failed.length
      ? `${succeeded.length} completed; ${failed.length} failed (${failedNames.join(", ")}). Failed files that remain available are selected for review or retry.`
      : null;
    const cleanupNames = results
      .filter((result) => result.ok && !result.cleanupComplete)
      .map((result) => selectedFiles.find((file) => file.id === result.id)?.originalFileName)
      .filter(Boolean);
    setSuccessMessage(
      succeeded.length
        ? `${succeeded.length} ${bulkAction === "unfavorite" ? `file${succeeded.length === 1 ? "" : "s"} removed from Favorites` : `file${succeeded.length === 1 ? "" : "s"} permanently deleted`}.${cleanupWarnings ? ` Storage cleanup needs reconciliation for: ${cleanupNames.join(", ")}. The file records are already removed.` : ""}`
        : null,
    );
    clearBulkAction();
    if (!failed.length) cancelSelection();
    await loadFiles(view, currentPage);
    if (failureSummary) setError(failureSummary);
  };

  return { bulkPending, runBulkAction };
}
