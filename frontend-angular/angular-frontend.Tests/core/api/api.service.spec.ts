import { HttpClient, provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting, HttpTestingController, TestRequest } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { MsalService } from "@azure/msal-angular";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { throwError } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiService } from "../../../src/app/core/api/api.service";

describe("ApiService", () => {
  let service: ApiService;
  let http: HttpTestingController;
  const account = { homeAccountId: "home", localAccountId: "local", tenantId: "tenant", environment: "login.microsoftonline.com", username: "ada@example.com" };
  const msal = {
    instance: { acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: "token-123" }) },
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    msal.instance.acquireTokenSilent.mockReset().mockResolvedValue({ accessToken: "token-123" });
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MsalService, useValue: msal }],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http?.verify();
    TestBed.resetTestingModule();
  });

  async function expectRequest(urlSuffix: string): Promise<TestRequest> {
    let request: TestRequest | undefined;
    await vi.waitFor(() => {
      const matches = http.match((req) => req.url.includes(urlSuffix));
      if (matches.length) request = matches[0];
      expect(request).toBeDefined();
    });
    return request!;
  }

  it("requests all, owned, and shared album pages with trimmed search and auth", async () => {
    for (const [filter, path] of [["all", "/api/albums"], ["mine", "/api/albums/mine"], ["shared", "/api/albums/shared"]] as const) {
      const pending = service.getAlbums(account, filter, 2, 9, " summer ");
      const request = await expectRequest(path);
      const query = new URL(request.request.urlWithParams).searchParams;
      expect(query.get("page")).toBe("2");
      expect(query.get("pageSize")).toBe("9");
      expect(query.get("search")).toBe("summer");
      expect(request.request.headers.get("Authorization")).toBe("Bearer token-123");
      request.flush({ items: [], totalItems: 0, page: 2, pageSize: 9, pageCount: 0 });
      await expect(pending).resolves.toMatchObject({ items: [], page: 2 });
    }
    const pending = service.getAlbums(account, "all", 1, 9, "   ");
    const request = await expectRequest("/api/albums");
    expect(new URL(request.request.urlWithParams).searchParams.has("search")).toBe(false);
    request.flush({ items: [], totalItems: 0, page: 1, pageSize: 9, pageCount: 0 });
    await pending;
  });

  it("posts album creation as authenticated JSON and retrieves profiles", async () => {
    const created = service.createAlbum(account, { albumName: "Trip" });
    const post = await expectRequest("/api/albums");
    expect(post.request.method).toBe("POST");
    expect(post.request.headers.get("Content-Type")).toBe("application/json");
    expect(post.request.body).toBe('{"albumName":"Trip"}');
    post.flush({ id: 1, albumName: "Trip" });
    await expect(created).resolves.toMatchObject({ id: 1 });

    const profile = service.getCurrentUser(account);
    const get = await expectRequest("/api/auth/me");
    expect(get.request.method).toBe("GET");
    get.flush({ userId: 1, name: "Ada", email: "ada@example.com", role: "Admin" });
    await expect(profile).resolves.toMatchObject({ userId: 1, role: "Admin" });
  });

  it("requests image pages and chooses the correct cover access endpoint", async () => {
    const page = service.getAlbumImages(account, 12);
    const imageRequest = await expectRequest("/api/albums/12/files");
    const query = new URL(imageRequest.request.urlWithParams).searchParams;
    expect(query.get("page")).toBe("1");
    expect(query.get("pageSize")).toBe("100");
    expect(query.get("category")).toBe("Images");
    imageRequest.flush({ items: [], totalItems: 0, page: 1, pageSize: 100, pageCount: 0 });
    await page;

    const createUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:cover");
    for (const [canManage, action] of [[true, "download"], [false, "preview"]] as const) {
      const cover = service.getAlbumCover(account, 12, { id: 55, originalFileName: "cover.png", contentType: "image/png", fileSize: 1, uploadedAt: "2024-01-01", canManage });
      const image = await expectRequest(`/api/albums/12/files/55/${action}`);
      expect(image.request.responseType).toBe("blob");
      image.flush(new Blob(["image"]));
      await expect(cover).resolves.toBe("blob:cover");
    }
    expect(createUrl).toHaveBeenCalledTimes(2);
    createUrl.mockRestore();
  });

  it("converts HTTP and authentication failures into actionable errors", async () => {
    const cases = [
      [0, null, "API is unreachable"],
      [401, {}, "sign-in or consent is required"],
      [403, { message: "role denied" }, "role denied"],
      [403, { Message: "upper role denied" }, "upper role denied"],
      [403, {}, "does not have a WinCapture User or Admin role"],
      [500, { error: "server error" }, "server error"],
      [500, { Error: "upper server error" }, "upper server error"],
      [418, null, "HTTP 418"],
    ] as const;
    for (const [status, body, expected] of cases) {
      const pending = service.getCurrentUser(account);
      (await expectRequest("/api/auth/me")).flush(body, { status, statusText: "error" });
      await expect(pending).rejects.toThrow(expected);
    }

    msal.instance.acquireTokenSilent.mockRejectedValueOnce(new InteractionRequiredAuthError("interaction_required", "correlation-id"));
    await expect(service.getCurrentUser(account)).rejects.toThrow("sign-in or consent is required");
    msal.instance.acquireTokenSilent.mockRejectedValueOnce("unexpected token failure");
    await expect(service.getCurrentUser(account)).rejects.toBe("unexpected token failure");
  });

  it("normalizes non-HTTP request failures", async () => {
    const failed = service.getCurrentUser(account);
    (await expectRequest("/api/auth/me")).flush("offline", { status: 0, statusText: "network error" });
    await expect(failed).rejects.toThrow("API is unreachable");
  });

  it("handles request-level auth errors, plain errors, unknown values, and empty POST bodies", async () => {
    const client = TestBed.inject(HttpClient);
    const get = vi.spyOn(client, "get");
    get.mockReturnValue(throwError(() => new InteractionRequiredAuthError("interaction_required", "correlation-id")) as never);
    await expect(service.getCurrentUser(account)).rejects.toThrow("sign-in or consent is required");

    get.mockReturnValue(throwError(() => new Error("transport failed")) as never);
    await expect(service.getCurrentUser(account)).rejects.toThrow("transport failed");

    get.mockReturnValue(throwError(() => "unknown transport failure") as never);
    await expect(service.getCurrentUser(account)).rejects.toThrow("The WinCapture API request failed.");
    get.mockRestore();

    const send = (service as unknown as {
      send<T>(path: string, activeAccount: typeof account, options: { method: string }): Promise<T>;
    }).send.bind(service);
    const pending = send("/api/albums", account, { method: "POST" });
    const request = await expectRequest("/api/albums");
    expect(request.request.body).toBe("");
    request.flush({ id: 2 });
    await expect(pending).resolves.toEqual({ id: 2 });
  });
});
