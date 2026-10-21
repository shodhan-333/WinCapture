import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import type { AlbumMemberResponse } from "@/features/albums/types/album";
import { addAlbumMember, removeAlbumMember, updateAlbumMember } from "@/features/albums/api/albumsApi";
import { albumKeys } from "@/features/albums/hooks/albumQueries";

interface UseAlbumSharingActionsOptions {
  instance: IPublicClientApplication;
  account: AccountInfo | null;
  accountKey: string | null;
  albumId: number;
  members: AlbumMemberResponse[];
}

// Keep editable sharing controls local and member records in TanStack Query.
export function useAlbumSharingActions({
  instance,
  account,
  accountKey,
  albumId,
  members,
}: UseAlbumSharingActionsOptions) {
  const [memberEmail, setMemberEmail] = useState("");
  const [canView, setCanView] = useState(true);
  const [canDownload, setCanDownload] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const membersKey = albumKeys.members(accountKey, albumId);
  const addMutation = useMutation({
    mutationFn: (request: { email: string; canView: boolean; canDownload: boolean }) => {
      if (!account) throw new Error("An authenticated account is required.");
      return addAlbumMember(instance, account, albumId, request);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: membersKey }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ userId, canView: nextView, canDownload: nextDownload }: { userId: number; canView: boolean; canDownload: boolean }) => {
      if (!account) throw new Error("An authenticated account is required.");
      return updateAlbumMember(instance, account, albumId, userId, { canView: nextView, canDownload: nextDownload });
    },
    onMutate: async ({ userId, canView: nextView, canDownload: nextDownload }) => {
      await queryClient.cancelQueries({ queryKey: membersKey });
      const previous = queryClient.getQueryData<AlbumMemberResponse[]>(membersKey) ?? members;
      queryClient.setQueryData<AlbumMemberResponse[]>(membersKey, previous.map((member) =>
        member.userId === userId
          ? { ...member, canView: nextView || nextDownload, canDownload: nextDownload }
          : member,
      ));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context) queryClient.setQueryData(membersKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: membersKey }),
  });
  const removeMutation = useMutation({
    mutationFn: (userId: number) => {
      if (!account) throw new Error("An authenticated account is required.");
      return removeAlbumMember(instance, account, albumId, userId);
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: membersKey });
      const previous = queryClient.getQueryData<AlbumMemberResponse[]>(membersKey) ?? members;
      queryClient.setQueryData<AlbumMemberResponse[]>(membersKey, previous.filter((member) => member.userId !== userId));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context) queryClient.setQueryData(membersKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: membersKey }),
  });

  const handleAddMember = async (): Promise<void> => {
    if (!account || !Number.isSafeInteger(albumId) || albumId <= 0 || !memberEmail.trim()) {
      setValidationError("An email address is required to share the album.");
      return;
    }
    addMutation.reset();
    updateMutation.reset();
    removeMutation.reset();
    setValidationError(null);
    try {
      await addMutation.mutateAsync({ email: memberEmail.trim(), canView, canDownload });
      setMemberEmail("");
      setCanView(true);
      setCanDownload(true);
    } catch { /* The mutation owns and exposes its request error. */ }
  };

  const handleUpdateMember = async (userId: number, nextView: boolean, nextDownload: boolean): Promise<void> => {
    if (!account || !Number.isSafeInteger(albumId) || albumId <= 0) return;
    addMutation.reset();
    updateMutation.reset();
    removeMutation.reset();
    setValidationError(null);
    try {
      await updateMutation.mutateAsync({ userId, canView: nextView, canDownload: nextDownload });
    } catch { /* The mutation owns and exposes its request error. */ }
  };

  const handleRemoveMember = async (userId: number): Promise<void> => {
    if (!account || !Number.isSafeInteger(albumId) || albumId <= 0) return;
    addMutation.reset();
    updateMutation.reset();
    removeMutation.reset();
    setValidationError(null);
    try {
      await removeMutation.mutateAsync(userId);
    } catch { /* The mutation owns and exposes its request error. */ }
  };

  const error = validationError
    ?? (addMutation.error instanceof Error ? addMutation.error.message : null)
    ?? (updateMutation.error instanceof Error ? updateMutation.error.message : null)
    ?? (removeMutation.error instanceof Error ? removeMutation.error.message : null);

  return { memberEmail, setMemberEmail, canView, setCanView, canDownload, setCanDownload, error, handleAddMember, handleUpdateMember, handleRemoveMember };
}
