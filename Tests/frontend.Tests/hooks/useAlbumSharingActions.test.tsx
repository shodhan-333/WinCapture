import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useAlbumSharingActions } from "../../../frontend/src/features/albums/hooks/useAlbumSharingActions";
import { albumKeys } from "../../../frontend/src/features/albums/hooks/albumQueries";
import type { AlbumMemberResponse } from "../../../frontend/src/features/albums/types/album";

vi.mock("../../../frontend/src/features/albums/api/albumsApi", () => ({
  addAlbumMember: vi.fn(),
  removeAlbumMember: vi.fn(),
  updateAlbumMember: vi.fn(),
}));
import { addAlbumMember, removeAlbumMember, updateAlbumMember } from "../../../frontend/src/features/albums/api/albumsApi";

const account = { homeAccountId: "user" } as AccountInfo;
const instance = {} as IPublicClientApplication;
const member: AlbumMemberResponse = {
  userId: 8,
  name: "Alex Member",
  email: "alex@example.test",
  canView: true,
  canDownload: true,
  grantedAt: "2025-01-01T00:00:00Z",
};

function setup(options: { account?: AccountInfo | null; albumId?: number } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 60_000 }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
  const hook = renderHook(() => useAlbumSharingActions({
    instance,
    account: options.account === undefined ? account : options.account,
    accountKey: options.account === null ? null : "user",
    albumId: options.albumId ?? 3,
    members: [member],
  }), { wrapper });
  return { ...hook, client };
}

describe("useAlbumSharingActions", () => {
  it("validates missing accounts, invalid album IDs, and blank email addresses", async () => {
    const guest = setup({ account: null });
    await act(async () => {
      await guest.result.current.handleAddMember();
      await guest.result.current.handleUpdateMember(8, true, true);
      await guest.result.current.handleRemoveMember(8);
    });
    expect(guest.result.current.error).toBe("An email address is required to share the album.");
    expect(addAlbumMember).not.toHaveBeenCalled();

    const invalid = setup({ albumId: Number.NaN });
    await act(async () => {
      await invalid.result.current.handleAddMember();
      await invalid.result.current.handleUpdateMember(8, true, false);
      await invalid.result.current.handleRemoveMember(8);
    });
    expect(invalid.result.current.error).toBe("An email address is required to share the album.");
    expect(updateAlbumMember).not.toHaveBeenCalled();
    expect(removeAlbumMember).not.toHaveBeenCalled();

    const blank = setup();
    await act(async () => {
      blank.result.current.setMemberEmail("   ");
      await blank.result.current.handleAddMember();
    });
    expect(blank.result.current.error).toBe("An email address is required to share the album.");
  });

  it("trims successful invites, resets form permissions, and optimistically updates members", async () => {
    vi.mocked(addAlbumMember).mockResolvedValue(undefined);
    vi.mocked(updateAlbumMember).mockResolvedValue(undefined);
    const hook = setup();
    hook.client.setQueryData(albumKeys.members("user", 3), [member]);

    await act(async () => {
      hook.result.current.setMemberEmail("  new@example.test  ");
      hook.result.current.setCanView(false);
      hook.result.current.setCanDownload(false);
    });
    await act(async () => hook.result.current.handleAddMember());
    expect(addAlbumMember).toHaveBeenCalledWith(instance, account, 3, {
      email: "new@example.test", canView: false, canDownload: false,
    });
    expect(hook.result.current.memberEmail).toBe("");
    expect(hook.result.current.canView).toBe(true);
    expect(hook.result.current.canDownload).toBe(true);

    await act(async () => hook.result.current.handleUpdateMember(8, false, true));
    await waitFor(() => expect(hook.client.getQueryData(albumKeys.members("user", 3))).toEqual([
      { ...member, canView: true, canDownload: true },
    ]));
    expect(updateAlbumMember).toHaveBeenCalledWith(instance, account, 3, 8, { canView: false, canDownload: true });
  });

  it("rolls back failed updates and revokes members, including fallback error messages", async () => {
    vi.mocked(updateAlbumMember).mockRejectedValue("offline");
    vi.mocked(removeAlbumMember).mockRejectedValueOnce(new Error("revoke denied"));
    const hook = setup();
    hook.client.setQueryData(albumKeys.members("user", 3), [member]);

    await act(async () => hook.result.current.handleUpdateMember(8, false, false));
    await waitFor(() => expect(hook.client.getQueryData(albumKeys.members("user", 3))).toEqual([member]));
    expect(hook.result.current.error).toBe("Unable to update album permissions.");

    await act(async () => hook.result.current.handleRemoveMember(8));
    await waitFor(() => expect(hook.client.getQueryData(albumKeys.members("user", 3))).toEqual([member]));
    expect(hook.result.current.error).toBe("revoke denied");
    expect(removeAlbumMember).toHaveBeenCalledWith(instance, account, 3, 8);
  });

  it("uses the supplied member list when no query cache exists and handles disabled permissions", async () => {
    vi.mocked(updateAlbumMember).mockResolvedValue(undefined);
    vi.mocked(removeAlbumMember).mockResolvedValue(undefined);
    const hook = setup();

    await act(async () => hook.result.current.handleUpdateMember(8, false, false));
    await waitFor(() => expect(hook.client.getQueryData(albumKeys.members("user", 3))).toEqual([
      { ...member, canView: false, canDownload: false },
    ]));
    await act(async () => hook.result.current.handleRemoveMember(8));
    await waitFor(() => expect(hook.client.getQueryData(albumKeys.members("user", 3))).toEqual([]));
  });
});
