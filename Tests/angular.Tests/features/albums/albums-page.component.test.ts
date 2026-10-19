import "@angular/compiler";
import { createEnvironmentInjector, runInInjectionContext, signal } from "@angular/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "../../../../frontend-angular/src/app/core/auth/auth.service";
import { ApiService } from "../../../../frontend-angular/src/app/core/api/api.service";
import { AlbumsPageComponent } from "../../../../frontend-angular/src/app/features/albums/albums-page.component";

const account = { homeAccountId: "home", tenantId: "tenant", localAccountId: "local" } as never;

describe("Angular albums page behavior", () => {
  const album = { id: 3, albumName: "Weekend", createdAt: "2024-01-02", fileCount: 1 };
  const page = { items: [album], page: 1, pageCount: 2, totalItems: 10 };

  function makePage(
    options: { account?: unknown; user?: unknown; getAlbums?: unknown; createAlbum?: unknown } = {},
  ) {
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
    const injector = createEnvironmentInjector(
      [
        { provide: AuthService, useValue: auth },
        { provide: ApiService, useValue: api },
      ],
      createEnvironmentInjector([]),
    );
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

  it("keeps the latest album response when an earlier request finishes later", async () => {
    let resolveFirst: ((value: typeof page) => void) | undefined;
    const firstRequest = new Promise<typeof page>((resolve) => {
      resolveFirst = resolve;
    });
    const latestPage = {
      ...page,
      items: [{ ...album, albumName: "Latest response" }],
    };
    const { component, api, injector } = makePage();
    api.getAlbums.mockReturnValueOnce(firstRequest).mockResolvedValueOnce(latestPage);

    const firstLoad = component.loadAlbums();
    const latestLoad = component.loadAlbums();
    await latestLoad;
    resolveFirst?.(page);
    await firstLoad;

    expect(component.albums()).toEqual(latestPage.items);
    injector.destroy();
  });

  it("leaves fallback covers visible when cover metadata or image requests fail", async () => {
    const { component, api, injector } = makePage();
    api.getAlbumImages.mockRejectedValue(new Error("cover unavailable"));

    await component.loadAlbums();
    await vi.waitFor(() => expect(api.getAlbumImages).toHaveBeenCalledWith(account, album.id));

    expect(component.error()).toBeNull();
    expect(component.covers()).toEqual({});
    injector.destroy();
  });

  it("reports album creation failures and clears the submitting state", async () => {
    const { component, api, injector } = makePage();
    api.createAlbum.mockRejectedValue(new Error("creation failed"));
    component.albumName.set("Summer trip");

    await component.createAlbum();

    expect(component.error()).toBe("creation failed");
    expect(component.creating()).toBe(false);
    expect(component.albumName()).toBe("Summer trip");
    injector.destroy();
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
