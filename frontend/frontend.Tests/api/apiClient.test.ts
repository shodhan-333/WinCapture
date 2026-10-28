import {
  InteractionRequiredAuthError,
  type AccountInfo,
  type IPublicClientApplication,
} from "@azure/msal-browser";
import { afterEach, describe, expect, it, vi } from "vitest";

import { callApi } from "../../src/shared/api";
import { getFilePreviewUrlByPath, replaceAlbumFile } from "../../src/api/apiClient";
import { ApiError } from "../../src/shared/types/api";

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
      new Response(
        JSON.stringify({
          id: 9,
          originalFileName: "image.png",
          contentType: "image/png",
          fileSize: 5,
          uploadedAt: "2026-01-01T00:00:00Z",
          url: "/api/files/9/preview",
          downloadUrl: "/api/files/9/download",
          isFavorite: false,
          canManage: true,
          canDownload: true,
        }),
        { status: 200 },
      ),
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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Permission denied" }), {
          status: 403,
        }),
      ),
    );

    await expect(callApi(makeClient(), account, "/api/files/1")).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      code: "HTTP_403",
      message: "You do not have permission to complete this action.",
    });
  });

  it("starts the configured redirect flow when interactive authentication is required", async () => {
    const client = {
      acquireTokenSilent: vi
        .fn()
        .mockRejectedValue(
          new InteractionRequiredAuthError("interaction_required", "Sign-in required"),
        ),
      acquireTokenRedirect: vi.fn().mockResolvedValue(undefined),
    } as unknown as IPublicClientApplication;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(callApi(client, account, "/api/files")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
    });
    expect(client.acquireTokenRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        account,
        scopes: expect.any(Array),
        redirectStartPage: window.location.href,
      }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shares one interactive redirect across parallel API requests", async () => {
    const client = {
      acquireTokenSilent: vi
        .fn()
        .mockRejectedValue(
          new InteractionRequiredAuthError("interaction_required", "Consent required"),
        ),
      acquireTokenRedirect: vi.fn().mockResolvedValue(undefined),
    } as unknown as IPublicClientApplication;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all([
      expect(callApi(client, account, "/api/files")).rejects.toMatchObject({
        status: 401,
      }),
      expect(callApi(client, account, "/api/albums")).rejects.toMatchObject({
        status: 401,
      }),
    ]);

    expect(client.acquireTokenRedirect).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("translates unreachable API requests", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(callApi(makeClient(), account, "/api/files")).rejects.toBeInstanceOf(ApiError);
    await expect(callApi(makeClient(), account, "/api/files")).rejects.toMatchObject({ status: 0 });
  });

  it("reports missing silent tokens and generic token acquisition failures", async () => {
    const missingToken = {
      acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: "" }),
    } as unknown as IPublicClientApplication;
    await expect(callApi(missingToken, account, "/api/files")).rejects.toMatchObject({
      status: 401,
      message: "Microsoft Entra did not return an access token for the WinCapture API.",
    });

    const tokenFailure = {
      acquireTokenSilent: vi.fn().mockRejectedValue("offline"),
    } as unknown as IPublicClientApplication;
    await expect(callApi(tokenFailure, account, "/api/files")).rejects.toMatchObject({
      status: 401,
      message: "Unable to acquire the Microsoft access token for the WinCapture API.",
    });
  });

  it("keeps aborted requests cancellable and sends JSON headers for JSON bodies", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await callApi(makeClient(), account, "/api/files", { method: "POST", body: JSON.stringify({ name: "file" }) });
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(request.headers).get("Content-Type")).toBe("application/json");

    const abortController = new AbortController();
    abortController.abort();
    const abortError = new DOMException("Request aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));
    await expect(callApi(makeClient(), account, "/api/files", { signal: abortController.signal })).rejects.toBe(abortError);
  });

  it("uses request IDs as correlation fallback and maps common server statuses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", {
      status: 404,
      headers: { "request-id": "fallback-id" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(callApi(makeClient(), account, "/api/files/404")).rejects.toMatchObject({
      status: 404, correlationId: "fallback-id", message: "The requested item could not be found.",
    });

    for (const [status, message] of [
      [409, "This change conflicts with the current data. Refresh and try again."],
      [413, "The selected file is too large to upload."],
      [503, "The service encountered a problem. Please try again later."],
      [418, "The request could not be completed. Please try again."],
    ] as const) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status })));
      await expect(callApi(makeClient(), account, "/api/files")).rejects.toMatchObject({ status, message });
    }
  });

  it("converts redirect failures into actionable sign-in errors", async () => {
    const errorClient = {
      acquireTokenSilent: vi.fn().mockRejectedValue(new InteractionRequiredAuthError("interaction_required")),
      acquireTokenRedirect: vi.fn().mockRejectedValue(new Error("popup blocked")),
    } as unknown as IPublicClientApplication;
    await expect(callApi(errorClient, account, "/api/files")).rejects.toMatchObject({
      message: "Microsoft sign-in could not be completed: popup blocked",
    });

    const nonErrorClient = {
      acquireTokenSilent: vi.fn().mockRejectedValue(new InteractionRequiredAuthError("interaction_required")),
      acquireTokenRedirect: vi.fn().mockRejectedValue("redirect failed"),
    } as unknown as IPublicClientApplication;
    await expect(callApi(nonErrorClient, account, "/api/files")).rejects.toMatchObject({
      message: "Microsoft sign-in could not be completed. Please try signing in again.",
    });
  });

  it("maps backend failures without exposing raw response details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Internal database constraint" }), {
          status: 400,
          headers: { "x-correlation-id": "req-123" },
        }),
      ),
    );
    await expect(callApi(makeClient(), account, "/api/files")).rejects.toMatchObject({
      status: 400,
      code: "HTTP_400",
      correlationId: "req-123",
      message: "Some of the submitted information is invalid. Review it and try again.",
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not-json", { status: 418 })));
    await expect(callApi(makeClient(), account, "/api/files")).rejects.toMatchObject({
      status: 418,
      code: "HTTP_418",
    });
  });

  it("returns object URLs for authenticated preview responses", async () => {
    const blob = new Blob(["preview"], { type: "application/octet-stream" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(blob, { status: 200 })));
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");

    await expect(
      getFilePreviewUrlByPath(makeClient(), account, "/api/files/1/preview", "image/png"),
    ).resolves.toBe("blob:preview");
    expect(createObjectURL).toHaveBeenCalledWith(expect.objectContaining({ type: "image/png" }));
  });
});
