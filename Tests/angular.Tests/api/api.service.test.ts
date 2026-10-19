import "@angular/compiler";
import { createEnvironmentInjector, runInInjectionContext } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { MsalService } from "@azure/msal-angular";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { of, throwError } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiService } from "../../../frontend-angular/src/app/core/api/api.service";

const account = { homeAccountId: "home", tenantId: "tenant", localAccountId: "local" } as never;

function makeApi(http: Record<string, ReturnType<typeof vi.fn>>, msal: Record<string, unknown>) {
  const injector = createEnvironmentInjector(
    [
      { provide: HttpClient, useValue: http },
      { provide: MsalService, useValue: msal },
    ],
    createEnvironmentInjector([]),
  );
  const api = runInInjectionContext(injector, () => new ApiService());
  return { api, injector };
}

afterEach(() => vi.restoreAllMocks());

describe("Angular API client", () => {
  const token = { accessToken: "access-token" };

  it("requests album filters, trims search, adds image category, and creates albums", async () => {
    const http = {
      get: vi.fn().mockReturnValue(of({ items: [] })),
      post: vi.fn().mockReturnValue(of({ id: 4 })),
    };
    const msal = { instance: { acquireTokenSilent: vi.fn().mockResolvedValue(token) } };
    const { api, injector } = makeApi(http, msal);
    await api.getAlbums(account, "mine", 2, 9, "  summer ");
    expect(http.get.mock.calls[0][0]).toContain("/api/albums/mine?page=2&pageSize=9&search=summer");
    await api.getAlbums(account, "shared", 1, 9, "");
    expect(http.get.mock.calls[1][0]).toContain("/api/albums/shared?page=1&pageSize=9");
    await api.getAlbumImages(account, 4);
    expect(http.get.mock.calls[2][0]).toContain("category=Images");
    await api.createAlbum(account, { albumName: "New" });
    expect(http.post).toHaveBeenCalledWith(
      expect.stringContaining("/api/albums"),
      JSON.stringify({ albumName: "New" }),
      expect.objectContaining({ headers: expect.anything() }),
    );
    injector.destroy();
  });

  it("uses download for managers and preview for shared viewers", async () => {
    const http = { get: vi.fn().mockReturnValue(of(new Blob(["image"]))) };
    const msal = { instance: { acquireTokenSilent: vi.fn().mockResolvedValue(token) } };
    const createUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:cover");
    const { api, injector } = makeApi(http, msal);
    await api.getAlbumCover(account, 8, {
      id: 2,
      canManage: true,
      contentType: "image/png",
    } as never);
    expect(http.get.mock.calls[0][0]).toContain("/8/files/2/download");
    await api.getAlbumCover(account, 8, {
      id: 3,
      canManage: false,
      contentType: "image/jpeg",
    } as never);
    expect(http.get.mock.calls[1][0]).toContain("/8/files/3/preview");
    expect(createUrl).toHaveBeenCalledTimes(2);
    injector.destroy();
  });

  it("translates authentication, authorization, unavailable, server, and unknown failures", async () => {
    const authError = new InteractionRequiredAuthError("interaction_required", "consent");
    const cases: Array<[unknown, string]> = [
      [authError, "consent is required"],
      [new HttpErrorResponse({ status: 0 }), "API is unreachable"],
      [new HttpErrorResponse({ status: 401 }), "consent is required"],
      [new HttpErrorResponse({ status: 403, error: { Message: "role missing" } }), "role missing"],
      [
        new HttpErrorResponse({ status: 500, error: { Error: "server said no" } }),
        "server said no",
      ],
      [new HttpErrorResponse({ status: 503 }), "HTTP 503"],
      [new Error("network"), "network"],
      ["unknown", "request failed"],
    ];
    for (const [failure, expected] of cases) {
      const http = { get: vi.fn().mockReturnValue(throwError(() => failure)) };
      const msal = { instance: { acquireTokenSilent: vi.fn().mockResolvedValue(token) } };
      const { api, injector } = makeApi(http, msal);
      await expect(api.getCurrentUser(account)).rejects.toThrow(expected);
      injector.destroy();
    }
  });

  it("translates silent token interaction failures", async () => {
    const http = { get: vi.fn() };
    const msal = {
      instance: {
        acquireTokenSilent: vi
          .fn()
          .mockRejectedValue(new InteractionRequiredAuthError("interaction_required")),
      },
    };
    const { api, injector } = makeApi(http, msal);
    await expect(api.getCurrentUser(account)).rejects.toThrow("consent is required");
    expect(http.get).not.toHaveBeenCalled();
    injector.destroy();
  });
});
