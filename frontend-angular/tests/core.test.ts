import "@angular/compiler";
import { createEnvironmentInjector, runInInjectionContext, signal } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { MsalService } from "@azure/msal-angular";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { of, throwError } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "../src/app/core/auth/auth.service";
import { AppShellComponent } from "../src/app/app-shell.component";
import { AppComponent } from "../src/app/app.component";
import { routes } from "../src/app/app.routes";
import { AlbumsPageComponent } from "../src/app/features/albums/albums-page.component";
import { ApiService } from "../src/app/core/api/api.service";
import { apiErrorMessage, formatDate } from "../src/app/core/utils";

const account = { homeAccountId: "home", tenantId: "tenant", localAccountId: "local" } as never;

describe("Angular application routing", () => {
  it("keeps Albums at /angular/albums and redirects empty or unknown child paths there", () => {
    expect(AppComponent).toBeDefined();
    const shellRoute = routes[0];
    expect(shellRoute.path).toBe("");
    expect(shellRoute.component).toBe(AppShellComponent);
    expect(shellRoute.children).toContainEqual({ path: "albums", component: AlbumsPageComponent });
    expect(shellRoute.children).toContainEqual({ path: "", pathMatch: "full", redirectTo: "albums" });
    expect(shellRoute.children).toContainEqual({ path: "**", redirectTo: "albums" });
  });
});

function makeApi(http: Record<string, ReturnType<typeof vi.fn>>, msal: Record<string, unknown>) {
  const injector = createEnvironmentInjector([
    { provide: HttpClient, useValue: http },
    { provide: MsalService, useValue: msal },
  ], createEnvironmentInjector([]));
  const api = runInInjectionContext(injector, () => new ApiService());
  return { api, injector };
}

describe("Angular core utilities", () => {
  it("formats dates and resolves API error bodies in priority order", () => {
    expect(formatDate("2024-01-02T12:00:00Z")).toContain("Jan");
    expect(apiErrorMessage({ error: { message: "primary", Message: "upper" } }, "fallback")).toBe("primary");
    expect(apiErrorMessage({ error: { Message: "upper" } }, "fallback")).toBe("upper");
    expect(apiErrorMessage({ error: { error: "nested" } }, "fallback")).toBe("nested");
    expect(apiErrorMessage(new Error("ordinary"), "fallback")).toBe("ordinary");
    const interaction = Object.assign(new Error("ignored"), { errorCode: "interaction_in_progress" });
    expect(apiErrorMessage(interaction, "fallback")).toContain("already in progress");
    expect(apiErrorMessage(null, "fallback")).toBe("fallback");
  });
});

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
    expect(http.post).toHaveBeenCalledWith(expect.stringContaining("/api/albums"), JSON.stringify({ albumName: "New" }), expect.objectContaining({ headers: expect.anything() }));
    injector.destroy();
  });

  it("uses download for managers and preview for shared viewers", async () => {
    const http = { get: vi.fn().mockReturnValue(of(new Blob(["image"]))) };
    const msal = { instance: { acquireTokenSilent: vi.fn().mockResolvedValue(token) } };
    const createUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:cover");
    const { api, injector } = makeApi(http, msal);
    await api.getAlbumCover(account, 8, { id: 2, canManage: true, contentType: "image/png" } as never);
    expect(http.get.mock.calls[0][0]).toContain("/8/files/2/download");
    await api.getAlbumCover(account, 8, { id: 3, canManage: false, contentType: "image/jpeg" } as never);
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
      [new HttpErrorResponse({ status: 500, error: { Error: "server said no" } }), "server said no"],
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
    const msal = { instance: { acquireTokenSilent: vi.fn().mockRejectedValue(new InteractionRequiredAuthError("interaction_required")) } };
    const { api, injector } = makeApi(http, msal);
    await expect(api.getCurrentUser(account)).rejects.toThrow("consent is required");
    expect(http.get).not.toHaveBeenCalled();
    injector.destroy();
  });
});

afterEach(() => vi.restoreAllMocks());

describe("Angular authentication service", () => {
  function makeAuth(overrides: {
    redirect?: unknown;
    active?: unknown;
    accounts?: unknown[];
    profile?: unknown;
    logout?: unknown;
  } = {}) {
    const selected = { homeAccountId: "home", tenantId: "tenant", localAccountId: "local" };
    const msal = {
      handleRedirectObservable: vi.fn(() => of(overrides.redirect ?? null)),
      logoutPopup: vi.fn(() => overrides.logout ?? of(null)),
      instance: {
        getActiveAccount: vi.fn(() => overrides.active ?? null),
        getAllAccounts: vi.fn(() => overrides.accounts ?? [selected]),
        setActiveAccount: vi.fn(),
        getConfiguration: vi.fn(() => ({ auth: { redirectUri: "https://localhost/redirect" } })),
      },
    };
    const api = { getCurrentUser: vi.fn(() => overrides.profile ?? Promise.resolve({ id: 1, name: "Ada" })) };
    const injector = createEnvironmentInjector([
      { provide: MsalService, useValue: msal },
      { provide: ApiService, useValue: api },
    ], createEnvironmentInjector([]));
    return { service: runInInjectionContext(injector, () => new AuthService()), msal, api, injector, selected };
  }

  it("uses the redirect account, loads the profile, and initializes only once", async () => {
    const redirected = { account: { homeAccountId: "redirect" } };
    const { service, msal, api, injector } = makeAuth({ redirect: redirected });
    await service.initialize();
    await service.initialize();
    expect(service.account()).toEqual(redirected.account);
    expect(service.user()).toEqual({ id: 1, name: "Ada" });
    expect(service.loading()).toBe(false);
    expect(msal.instance.setActiveAccount).toHaveBeenCalledWith(redirected.account);
    expect(api.getCurrentUser).toHaveBeenCalledTimes(1);
    injector.destroy();
  });

  it("falls back to the active account and handles missing sessions and profile errors", async () => {
    const active = { homeAccountId: "active" };
    const activeCase = makeAuth({ active });
    await activeCase.service.initialize();
    expect(activeCase.service.account()).toEqual(active);
    activeCase.injector.destroy();

    const missing = makeAuth({ accounts: [] });
    await missing.service.initialize();
    expect(missing.service.error()).toContain("No signed-in React session");
    expect(missing.service.loading()).toBe(false);
    missing.injector.destroy();

    const failedProfile = makeAuth({ profile: Promise.reject(new Error("profile unavailable")) });
    await failedProfile.service.initialize();
    expect(failedProfile.service.error()).toBe("profile unavailable");
    expect(failedProfile.service.account()).not.toBeNull();
    failedProfile.injector.destroy();
  });

  it("reports redirect failures and clears local identity when popup sign-out fails", async () => {
    const failedRedirect = makeAuth();
    failedRedirect.msal.handleRedirectObservable.mockReturnValue(throwError(() => new Error("redirect failed")) as never);
    await failedRedirect.service.initialize();
    expect(failedRedirect.service.error()).toBe("redirect failed");
    failedRedirect.injector.destroy();

    const failedLogout = makeAuth({ logout: throwError(() => new Error("popup blocked")) });
    failedLogout.service.account.set(failedLogout.selected as never);
    failedLogout.service.user.set({ id: 1, name: "Ada" } as never);
    await failedLogout.service.signOut();
    expect(failedLogout.service.account()).toBeNull();
    expect(failedLogout.service.user()).toBeNull();
    expect(failedLogout.service.error()).toBe("popup blocked");
    failedLogout.injector.destroy();
  });
});

describe("Angular application shell behavior", () => {
  it("builds React links, derives initials, and toggles navigation and profile state", () => {
    const injector = createEnvironmentInjector([{ provide: AuthService, useValue: {} }], createEnvironmentInjector([]));
    const shell = runInInjectionContext(injector, () => new AppShellComponent());
    expect(shell.reactPage("/dashboard")).toBe("https://localhost:5173/dashboard");
    expect(shell.initials(undefined)).toBe("U");
    expect(shell.initials("   ")).toBe("U");
    expect(shell.initials("Ada Lovelace Byron")).toBe("AL");
    shell.toggleMobileNavigation();
    expect(shell.mobileOpen()).toBe(true);
    shell.closeMobileNavigation();
    expect(shell.mobileOpen()).toBe(false);
    shell.toggleProfileMenu();
    expect(shell.profileOpen()).toBe(true);
    shell.closeProfileOnEscape();
    expect(shell.profileOpen()).toBe(false);
    shell.closeProfileOnEscape();
    shell.toggleProfileMenu();
    shell.closeProfileOnOutsideClick({ target: document.body } as PointerEvent);
    expect(shell.profileOpen()).toBe(false);
    injector.destroy();
  });
});

describe("Angular albums page behavior", () => {
  const album = { id: 3, albumName: "Weekend", createdAt: "2024-01-02", fileCount: 1 };
  const page = { items: [album], page: 1, pageCount: 2, totalItems: 10 };

  function makePage(options: { account?: unknown; user?: unknown; getAlbums?: unknown; createAlbum?: unknown } = {}) {
    const auth = {
      account: signal(options.account === undefined ? account : options.account),
      user: signal(options.user === undefined ? { id: 7 } : options.user),
      initialize: vi.fn().mockResolvedValue(undefined),
    };
    const api = {
      getAlbums: vi.fn().mockResolvedValue(options.getAlbums ?? page),
      createAlbum: vi.fn().mockResolvedValue(options.createAlbum ?? album),
      getAlbumImages: vi.fn().mockResolvedValue({ items: [] }),
      getAlbumCover: vi.fn(),
    };
    const injector = createEnvironmentInjector([
      { provide: AuthService, useValue: auth },
      { provide: ApiService, useValue: api },
    ], createEnvironmentInjector([]));
    const component = runInInjectionContext(injector, () => new AlbumsPageComponent());
    return { component, auth, api, injector };
  }

  it("initializes album requests, normalizes page counts, and changes filters and pages", async () => {
    const { component, api, injector } = makePage({ getAlbums: { ...page, pageCount: 0 } });
    component.ngOnInit();
    await vi.waitFor(() => expect(api.getAlbums).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(component.hasLoaded()).toBe(true));
    expect(component.pageCount()).toBe(1);
    expect(component.albums()).toEqual(page.items);
    component.pageCount.set(2);
    api.getAlbums.mockResolvedValue(page);
    component.setPage(0);
    api.getAlbums.mockResolvedValueOnce({ ...page, page: 2 });
    component.setPage(2);
    await vi.waitFor(() => expect(api.getAlbums).toHaveBeenCalledTimes(2));
    expect(component.currentPage()).toBe(2);
    component.setPage(2);
    component.setPage(3);
    expect(api.getAlbums).toHaveBeenCalledTimes(2);
    component.setFilter("shared");
    await vi.waitFor(() => expect(api.getAlbums).toHaveBeenCalledTimes(3));
    expect(component.filter()).toBe("shared");
    expect(component.currentPage()).toBe(1);
    expect(component.pages()).toEqual([1, 2]);
    injector.destroy();
  });

  it("debounces search, trims submitted terms, and cancels invalid page work", async () => {
    vi.useFakeTimers();
    const { component, api, injector } = makePage();
    component.setSearch("  lakes  ");
    component.setSearch("  coast  ");
    await vi.advanceTimersByTimeAsync(299);
    expect(api.getAlbums).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await vi.waitFor(() => expect(api.getAlbums).toHaveBeenCalledTimes(1));
    expect(api.getAlbums).toHaveBeenCalledWith(account, "all", 1, 9, "coast");
    component.setSearch("");
    injector.destroy();
    vi.useRealTimers();
  });

  it("shows load failures, skips requests without an account, and handles initialization without a profile", async () => {
    const broken = makePage({ getAlbums: Promise.reject(new Error("album failure")) });
    await broken.component.loadAlbums();
    expect(broken.component.error()).toBe("album failure");
    expect(broken.component.hasLoaded()).toBe(true);
    broken.injector.destroy();

    const noAccount = makePage({ account: null });
    await noAccount.component.loadAlbums();
    expect(noAccount.api.getAlbums).not.toHaveBeenCalled();
    noAccount.auth.user.set(null);
    noAccount.component.ngOnInit();
    await vi.waitFor(() => expect(noAccount.component.loading()).toBe(false));
    expect(noAccount.component.hasLoaded()).toBe(false);
    noAccount.injector.destroy();
  });

  it("validates album names and creates albums for signed-in users", async () => {
    const { component, api, injector } = makePage();
    await component.createAlbum();
    expect(component.error()).toBe("Album name is required.");
    component.albumName.set("x".repeat(201));
    await component.createAlbum();
    expect(component.error()).toContain("200 characters");
    component.albumName.set(" New album ");
    const open = vi.spyOn(component, "openReactAlbum").mockImplementation(() => undefined);
    await component.createAlbum();
    expect(api.createAlbum).toHaveBeenCalledWith(account, { albumName: "New album" });
    expect(component.albumName()).toBe("");
    expect(open).toHaveBeenCalledWith(album);
    expect(component.creating()).toBe(false);
    injector.destroy();
  });

  it("cleans up cover object URLs when the page is destroyed", async () => {
    const { component, api, injector } = makePage();
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    api.getAlbumImages.mockResolvedValue({ items: [{ id: 2 }] });
    api.getAlbumCover.mockResolvedValue("blob:cover");
    await component.loadAlbums();
    await vi.waitFor(() => expect(component.covers()).toEqual({ 3: "blob:cover" }));
    injector.destroy();
    expect(revoke).toHaveBeenCalledWith("blob:cover");
  });
});
