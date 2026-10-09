import {
  InteractionRequiredAuthError,
  type AccountInfo,
  type IPublicClientApplication,
} from "@azure/msal-browser";
import { afterEach, describe, expect, it, vi } from "vitest";

import { callApi, getFilePreviewUrlByPath, replaceAlbumFile } from "../../../frontend/src/api/apiClient";
import { ApiError } from "../../../frontend/src/types/api";

const account = { homeAccountId: "account-1" } as AccountInfo;

function makeClient(accessToken = "api-access-token") {
  return {
    acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken }),
  } as unknown as IPublicClientApplication;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API client security and error handling", () => {
  it("adds the acquired bearer token and preserves request headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await callApi(makeClient(), account, "/api/files", {
      headers: { "X-Request-Id": "request-1" },
    });

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(request.headers);
    expect(headers.get("Authorization")).toBe("Bearer api-access-token");
    expect(headers.get("X-Request-Id")).toBe("request-1");
  });

  it("does not add JSON content type to multipart uploads", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 9 }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["image"], "image.png", { type: "image/png" });

    await replaceAlbumFile(makeClient(), account, 3, 9, file);

    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(request.headers);
    expect(url).toContain("/api/albums/3/files/9");
    expect(request.method).toBe("PUT");
    expect(request.body).toBeInstanceOf(FormData);
    expect(headers.has("Content-Type")).toBe(false);
  });

  it("translates authorization failures into an API error with status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Permission denied" }), { status: 403 }),
    ));

    await expect(callApi(makeClient(), account, "/api/files/1"))
      .rejects.toMatchObject({
        name: "ApiError",
        status: 403,
        message: "Access denied: Permission denied",
      });
  });

  it("does not call the API when interactive authentication is required", async () => {
    const client = {
      acquireTokenSilent: vi.fn().mockRejectedValue(
        new InteractionRequiredAuthError("interaction_required", "Sign-in required"),
      ),
    } as unknown as IPublicClientApplication;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(callApi(client, account, "/api/files"))
      .rejects.toMatchObject({ name: "ApiError", status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("translates unreachable API requests", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(callApi(makeClient(), account, "/api/files"))
      .rejects.toBeInstanceOf(ApiError);
    await expect(callApi(makeClient(), account, "/api/files"))
      .rejects.toMatchObject({ status: 0 });
  });

  it("returns object URLs for authenticated preview responses", async () => {
    const blob = new Blob(["preview"], { type: "application/octet-stream" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(blob, { status: 200 })));
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");

    await expect(getFilePreviewUrlByPath(makeClient(), account, "/api/files/1/preview", "image/png"))
      .resolves.toBe("blob:preview");
    expect(createObjectURL).toHaveBeenCalledWith(expect.objectContaining({ type: "image/png" }));
  });
});
