import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as api from "../../../frontend/src/api/apiClient";
import { callApi } from "../../../frontend/src/shared/api";

const instance = {
  acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: "test-token" }),
} as unknown as IPublicClientApplication;
const account = { homeAccountId: "account-1" } as AccountInfo;
const albumResponseBody = {
  id: 8,
  albumName: "Trips",
  ownerId: 7,
  ownerName: "Avery Morgan",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: null,
};
const fileResponseBody = {
  id: 9,
  originalFileName: "photo.png",
  contentType: "image/png",
  fileSize: 128,
  uploadedAt: "2026-01-01T00:00:00Z",
  url: "/api/files/9/preview",
  downloadUrl: "/api/files/9/download",
  isFavorite: false,
  canManage: true,
  canDownload: true,
};

afterEach(() => vi.unstubAllGlobals());

function setupJsonResponse() {
  const fetchMock = vi
    .fn()
    .mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = url.endsWith("/api/auth/me")
        ? {
            userId: 8,
            name: "Avery Morgan",
            email: "avery@example.com",
            role: "User",
            authenticationType: "MicrosoftEntraId",
          }
        : url.endsWith("/api/albums/8/members")
          ? [
              {
                userId: 9,
                name: "Jordan Lee",
                email: "jordan@example.com",
                canView: true,
                canDownload: false,
                grantedAt: "2026-01-01T00:00:00Z",
              },
            ]
          : init?.body instanceof FormData
            ? fileResponseBody
            : url.endsWith("/api/albums/8/files/9") && init?.method === "DELETE"
              ? { storageCleanupComplete: true }
              : url.includes("/api/albums/8/files")
                ? url.includes("/api/albums/8/files/9")
                  ? fileResponseBody
                  : {
                      items: [fileResponseBody],
                      totalItems: 1,
                      page: 1,
                      pageSize: 10,
                      pageCount: 1,
                    }
                : url.includes("/api/albums") || url.includes("/api/admin/albums")
                  ? url.includes("?")
                    ? {
                        items: [albumResponseBody],
                        totalItems: 1,
                        page: 1,
                        pageSize: 10,
                        pageCount: 1,
                      }
                    : albumResponseBody
                  : url.includes("/api/files") && url.endsWith("/favorite")
                    ? {}
                    : url.endsWith("/api/files/9") && init?.method === "DELETE"
                      ? { storageCleanupComplete: true }
                      : url.includes("/api/admin/files")
                        ? {
                            items: [
                              {
                                id: 9,
                                originalFileName: "photo.png",
                                contentType: "image/png",
                                fileSize: 128,
                                uploadedAt: "2026-01-01T00:00:00Z",
                                uploadedBy: 7,
                                uploaderName: "Avery Morgan",
                                albumId: null,
                                albumName: null,
                              },
                            ],
                            totalItems: 1,
                            page: 1,
                            pageSize: 10,
                            pageCount: 1,
                          }
                        : url.includes("/api/files")
                          ? url.endsWith("/api/files/9")
                            ? fileResponseBody
                            : {
                                items: [fileResponseBody],
                                totalItems: 1,
                                page: 1,
                                pageSize: 10,
                                pageCount: 1,
                              }
                          : {};
      return new Response(JSON.stringify(body), { status: 200 });
    });
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
    [
      "create album",
      () => api.createAlbum(instance, account, { albumName: "Trips" }),
      "/api/albums",
      "POST",
    ],
    [
      "update album",
      () => api.updateAlbum(instance, account, 8, { albumName: "Trips" }),
      "/api/albums/8",
      "PUT",
    ],
    ["delete album", () => api.deleteAlbum(instance, account, 8), "/api/albums/8", "DELETE"],
    ["members", () => api.getAlbumMembers(instance, account, 8), "/api/albums/8/members", "GET"],
    [
      "add member",
      () =>
        api.addAlbumMember(instance, account, 8, {
          email: "user@example.com",
          canView: true,
          canDownload: false,
        }),
      "/api/albums/8/members",
      "POST",
    ],
    [
      "update member",
      () =>
        api.updateAlbumMember(instance, account, 8, 9, {
          canView: true,
          canDownload: true,
        }),
      "/api/albums/8/members/9",
      "PUT",
    ],
    [
      "remove member",
      () => api.removeAlbumMember(instance, account, 8, 9),
      "/api/albums/8/members/9",
      "DELETE",
    ],
    ["album files", () => api.getAlbumFiles(instance, account, 8), "/api/albums/8/files", "GET"],
    ["album file", () => api.getAlbumFile(instance, account, 8, 9), "/api/albums/8/files/9", "GET"],
    [
      "delete album file",
      () => api.deleteAlbumFile(instance, account, 8, 9),
      "/api/albums/8/files/9",
      "DELETE",
    ],
    [
      "remove album file association",
      () => api.removeAlbumFileAssociation(instance, account, 8, 9),
      "/api/albums/8/files/9/association",
      "DELETE",
    ],
    ["personal files", () => api.getFiles(instance, account), "/api/files", "GET"],
    ["one personal file", () => api.getFile(instance, account, 9), "/api/files/9", "GET"],
    ["favorites", () => api.getFavorites(instance, account), "/api/files/favorites", "GET"],
    ["add favorite", () => api.addFavorite(instance, account, 9), "/api/files/9/favorite", "PUT"],
    [
      "remove favorite",
      () => api.removeFavorite(instance, account, 9),
      "/api/files/9/favorite",
      "DELETE",
    ],
    ["delete file", () => api.deleteFile(instance, account, 9), "/api/files/9", "DELETE"],
    ["admin files", () => api.getAdminFiles(instance, account), "/api/admin/files", "GET"],
    [
      "my admin files",
      () => api.getMyAdminFiles(instance, account),
      "/api/admin/files/mine",
      "GET",
    ],
    ["admin albums", () => api.getAdminAlbums(instance, account), "/api/admin/albums", "GET"],
    [
      "my admin albums",
      () => api.getMyAdminAlbums(instance, account),
      "/api/admin/albums/mine",
      "GET",
    ],
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
    const fetchMock = vi
      .fn()
      .mockImplementation(() => new Response(new Blob(["preview"]), { status: 200 }));
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
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      filenames.push(this.download);
    });
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Response(new Blob(["file"]), {
            status: 200,
            headers: {
              "content-disposition": "attachment; filename*=UTF-8''holiday%20photo.png",
            },
          }),
      )
      .mockImplementationOnce(() => new Response(new Blob(["file"]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await api.downloadAlbumFile(instance, account, 8, 9, "fallback.png");
    await api.downloadFileByPath(instance, account, "/api/files/9/download", "fallback.png");

    expect(click).toHaveBeenCalledTimes(2);
    expect(filenames).toEqual(["holiday photo.png", "fallback.png"]);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it.each([
    [400, "Some of the submitted information is invalid. Review it and try again."],
    [401, "Your Microsoft session has expired. Sign in again and retry."],
    [403, "You do not have permission to complete this action."],
    [404, "The requested item could not be found."],
    [409, "This change conflicts with the current data. Refresh and try again."],
    [413, "The selected file is too large to upload."],
    [500, "The service encountered a problem. Please try again later."],
  ])("translates backend HTTP %s responses", async (status, expectedMessage) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Invalid input" }), {
          status,
        }),
      ),
    );

    await expect(callApi(instance, account, "/api/files")).rejects.toMatchObject({
      status,
      message: expectedMessage,
    });
  });
});
