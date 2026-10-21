import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import type { AlbumMemberResponse } from "@/features/albums/types/album";
import {
  addAlbumMember,
  getAlbumMembers,
  removeAlbumMember,
  updateAlbumMember,
} from "@/features/albums/api/albumsApi";

interface UseAlbumSharingActionsOptions {
  instance: IPublicClientApplication;
  account: AccountInfo | null;
  albumId: number;
  setMembers: Dispatch<SetStateAction<AlbumMemberResponse[]>>;
  setMemberAccessError: (message: string | null) => void;
}

// Manage member access and keep the local sharing state aligned with API results.
export function useAlbumSharingActions({
  instance,
  account,
  albumId,
  setMembers,
  setMemberAccessError,
}: UseAlbumSharingActionsOptions) {
  const [memberEmail, setMemberEmail] = useState("");
  const [canView, setCanView] = useState(true);
  const [canDownload, setCanDownload] = useState(true);

  // Grant the entered email the selected permissions and refresh the member list.
  const handleAddMember = async (): Promise<void> => {
    if (!account || !Number.isFinite(albumId) || !memberEmail.trim()) {
      setMemberAccessError("An email address is required to share the album.");
      return;
    }

    try {
      setMemberAccessError(null);
      await addAlbumMember(instance, account, albumId, {
        email: memberEmail.trim(),
        canView,
        canDownload,
      });

      setMemberEmail("");
      setCanView(true);
      setCanDownload(true);
      // Reload the server list so newly granted access uses its canonical member record.
      setMembers(await getAlbumMembers(instance, account, albumId));
    } catch (caughtError) {
      setMemberAccessError(
        caughtError instanceof Error ? caughtError.message : "Unable to share album.",
      );
    }
  };

  // Persist a member's view/download permissions and update the local member state.
  const handleUpdateMember = async (
    userId: number,
    nextView: boolean,
    nextDownload: boolean,
  ): Promise<void> => {
    if (!account || !Number.isFinite(albumId)) return;

    try {
      setMemberAccessError(null);
      await updateAlbumMember(instance, account, albumId, userId, {
        canView: nextView,
        canDownload: nextDownload,
      });

      // Download permission also requires view permission.
      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.userId === userId
            ? {
                ...member,
                canView: nextView || nextDownload,
                canDownload: nextDownload,
              }
            : member,
        ),
      );
    } catch (caughtError) {
      setMemberAccessError(
        caughtError instanceof Error ? caughtError.message : "Unable to update member access.",
      );
    }
  };

  // Revoke member access and remove the member from the displayed list.
  const handleRemoveMember = async (userId: number): Promise<void> => {
    if (!account || !Number.isFinite(albumId)) return;

    try {
      setMemberAccessError(null);
      await removeAlbumMember(instance, account, albumId, userId);
      setMembers((currentMembers) => currentMembers.filter((member) => member.userId !== userId));
    } catch (caughtError) {
      setMemberAccessError(
        caughtError instanceof Error ? caughtError.message : "Unable to revoke access.",
      );
    }
  };

  return {
    memberEmail,
    setMemberEmail,
    canView,
    setCanView,
    canDownload,
    setCanDownload,
    handleAddMember,
    handleUpdateMember,
    handleRemoveMember,
  };
}
