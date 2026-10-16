import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as api from "../../../frontend/src/api/apiClient";

const instance = {
  acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: "test-token" }),
} as unknown as IPublicClientApplication;
const account = { homeAccountId: "account-1" } as AccountInfo;
const responseBody = { id: 8, albumName: "Trips" };

afterEach(() => vi.unstubAllGlobals());

function setupJsonResponse() {
  const fetchMock = vi.fn().mockImplementation(async () =>
    new Response(JSON.stringify(responseBody), { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("API route coverage", () => {
  it.each([
    ["current-user", () => api.getCurrentUser(instance, account), "/api/auth/me", "GET"],
    ["albums", () => api.getAlbums(instance, account), "/api/albums", "GET"],
    ["my albums", () => api.getMyAlbums(instance, account), "/api/albums/mine", "GET"],
    ["shared albums", () => api.getSharedAlbums(instance, account), "/api/albums/shared", "GET"],
    ["one album", () => api.getAlbum(instance, account, 8), "/api/albums/8", "GET"],
    ["create album", () => api.createAlbum(instance, account, { albumName: "Trips" }), "/api/albums", "POST"],
    ["update album", () => api.updateAlbum(instance, account, 8, { albumName: "Trips" }), "/api/albums/8", "PUT"],
    ["delete album", () => api.deleteAlbum(instance, account, 8), "/api/albums/8", "DELETE"],
    ["members", () => api.getAlbumMembers(instance, account, 8), "/api/albums/8/members", "GET"],
    ["add member", () => api.addAlbumMember(instance, account, 8, { email: "user@example.com", canView: true, canDownload: false }), "/api/albums/8/members", "POST"],
    ["update member", () => api.updateAlbumMember(instance, account, 8, 9, { canView: true, canDownload: true }), "/api/albums/8/members/9", "PUT"],
    ["remove member", () => api.removeAlbumMember(instance, account, 8, 9), "/api/albums/8/members/9", "DELETE"],
    ["album files", () => api.getAlbumFiles(instance, account, 8), "/api/albums/8/files", "GET"],
    ["album file", () => api.getAlbumFile(instance, account, 8, 9), "/api/albums/8/files/9", "GET"],
    ["delete album file", () => api.deleteAlbumFile(instance, account, 8, 9), "/api/albums/8/files/9", "DELETE"],
    ["remove album file association", () => api.removeAlbumFileAssociation(instance, account, 8, 9), "/api/albums/8/files/9/association", "DELETE"],
    ["personal files", () => api.getFiles(instance, account), "/api/files", "GET"],
    ["one personal file", () => api.getFile(instance, account, 9), "/api/files/9", "GET"],
    ["favorites", () => api.getFavorites(instance, account), "/api/files/favorites", "GET"],
    ["add favorite", () => api.addFavorite(instance, account, 9), "/api/files/9/favorite", "PUT"],
    ["remove favorite", () => api.removeFavorite(instance, account, 9), "/api/files/9/favorite", "DELETE"],
    ["delete file", () => api.deleteFile(instance, account, 9), "/api/files/9", "DELETE"],
    ["admin files", () => api.getAdminFiles(instance, account), "/api/admin/files", "GET"],
    ["my admin files", () => api.getMyAdminFiles(instance, account), "/api/admin/files/mine", "GET"],
    ["admin albums", () => api.getAdminAlbums(instance, account), "/api/admin/albums", "GET"],
    ["my admin albums", () => api.getMyAdminAlbums(instance, account), "/api/admin/albums/mine", "GET"],
  ])("sends %s to the expected endpoint", async (_name, invoke, path, method) => {
    const fetchMock = setupJsonResponse();

    await invoke();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toEqual(expect.stringContaining(path));
    expect(fetchMock.mock.calls[0][1]?.method ?? "GET").toBe(method);
  });

  it("posts and replaces multipart files without JSON headers", async () => {
    const fetchMock = setupJsonResponse();
    const file = new File(["pixels"], "photo.png", { type: "image/png" });

    await api.uploadAlbumFile(instance, account, 8, file);
    await api.replaceAlbumFile(instance, account, 8, 9, file);
    await api.uploadFile(instance, account, file);
    await api.replaceFile(instance, account, 9, file);

    expect(fetchMock).toHaveBeenCalledTimes(4);
    for (const [, request] of fetchMock.mock.calls) {
      expect(request.method).toMatch(/POST|PUT/);
      expect(request.body).toBeInstanceOf(FormData);
      expect(new Headers(request.headers).has("Content-Type")).toBe(false);
    }
  });

  it("selects album preview versus download routes from management permission", async () => {
    const fetchMock = vi.fn().mockImplementation(() => new Response(new Blob(["preview"]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await api.getFilePreviewUrl(instance, account, 9, 8, false);
    await api.getFilePreviewUrl(instance, account, 9, 8, true);
    await api.getFilePreviewUrl(instance, account, 9);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      expect.stringContaining("/api/albums/8/files/9/preview"),
      expect.stringContaining("/api/albums/8/files/9/download"),
      expect.stringContaining("/api/files/9/download"),
    ]);
  });

  it("downloads files and resolves RFC content-disposition filenames", async () => {
    const filenames: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      filenames.push(this.download);
    });
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => new Response(new Blob(["file"]), {
        status: 200,
        headers: { "content-disposition": "attachment; filename*=UTF-8''holiday%20photo.png" },
      }))
      .mockImplementationOnce(() => new Response(new Blob(["file"]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await api.downloadAlbumFile(instance, account, 8, 9, "fallback.png");
    await api.downloadFileByPath(instance, account, "/api/files/9/download", "fallback.png");

    expect(click).toHaveBeenCalledTimes(2);
    expect(filenames).toEqual(["holiday photo.png", "fallback.png"]);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it.each([
    [400, "Validation failed: Invalid input"],
    [401, "Authentication expired or invalid: Invalid input"],
    [403, "Access denied: Invalid input"],
    [404, "Resource not found: Invalid input"],
    [409, "Conflict: Invalid input"],
    [413, "File too large: Invalid input"],
    [500, "An unexpected server error occurred. Please try again later."],
  ])("translates backend HTTP %s responses", async (status, expectedMessage) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid input" }), { status }),
    ));

    await expect(api.callApi(instance, account, "/api/files"))
      .rejects.toMatchObject({ status, message: expectedMessage });
  });
});
