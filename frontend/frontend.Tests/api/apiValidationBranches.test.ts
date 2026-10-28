import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api/request", () => ({ callApi: vi.fn() }));

import { callApi } from "@/shared/api/request";
import { addAlbumMember, deleteAlbumFile, deleteFile, updateAlbumMember } from "../../src/api/apiClient";

const instance = {} as IPublicClientApplication;
const account = { homeAccountId: "user" } as AccountInfo;

describe("API validation and legacy delete responses", () => {
  it("rejects malformed album member permissions before making a request", async () => {
    await expect(addAlbumMember(instance, account, 2, {
      email: "bad", canView: false, canDownload: true,
    })).rejects.toMatchObject({ status: 400, message: "Provide a valid email address and album permissions." });
    await expect(updateAlbumMember(instance, account, 2, 3, {
      canView: false, canDownload: true,
    })).rejects.toMatchObject({ status: 400, message: "Album permissions are invalid." });
    expect(callApi).not.toHaveBeenCalled();
  });

  it("accepts legacy 204 delete responses without cleanup metadata", async () => {
    vi.mocked(callApi).mockResolvedValue(new Response(null, { status: 204 }));
    await expect(deleteAlbumFile(instance, account, 2, 3)).resolves.toEqual({ storageCleanupComplete: true });
    await expect(deleteFile(instance, account, 3)).resolves.toEqual({ storageCleanupComplete: true });
    expect(callApi).toHaveBeenCalledTimes(2);
  });
});
