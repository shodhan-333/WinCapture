import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AlbumsPageComponent } from "../../../../frontend-angular/src/app/features/albums/albums-page.component";
import { AuthService } from "../../../../frontend-angular/src/app/core/auth/auth.service";
import { ApiService } from "../../../../frontend-angular/src/app/core/api/api.service";

const account = { homeAccountId: "home", localAccountId: "local", tenantId: "tenant", username: "ada@example.com" };
const album = { id: 4, albumName: "Summer trip", ownerId: 1, ownerName: "Ada", createdAt: "2024-02-03T12:00:00Z", updatedAt: null };
const page = { items: [album], totalItems: 1, page: 1, pageSize: 9, pageCount: 1 };

describe("AlbumsPageComponent", () => {
  let auth: {
    account: ReturnType<typeof signal>;
    user: ReturnType<typeof signal>;
    loading: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
    initialize: ReturnType<typeof vi.fn>;
  };
  let api: { getAlbums: ReturnType<typeof vi.fn>; createAlbum: ReturnType<typeof vi.fn>; getAlbumImages: ReturnType<typeof vi.fn>; getAlbumCover: ReturnType<typeof vi.fn> };
  let fixture: ReturnType<typeof TestBed.createComponent<AlbumsPageComponent>>;
  let component: AlbumsPageComponent;
  let assign: ReturnType<typeof vi.fn>;

  function setup(withAccount = true) {
    TestBed.resetTestingModule();
    auth = {
      account: signal(withAccount ? account : null),
      user: signal(withAccount ? { userId: 1, name: "Ada", email: "ada@example.com", role: "Admin" } : null),
      loading: signal(false),
      error: signal<string | null>(null),
      initialize: vi.fn().mockResolvedValue(undefined),
    };
    api = {
      getAlbums: vi.fn().mockResolvedValue(page),
      createAlbum: vi.fn().mockResolvedValue(album),
      getAlbumImages: vi.fn().mockResolvedValue({ items: [], totalItems: 0, page: 1, pageSize: 100, pageCount: 0 }),
      getAlbumCover: vi.fn().mockResolvedValue("blob:cover"),
    };
    TestBed.configureTestingModule({
      imports: [AlbumsPageComponent],
      providers: [{ provide: AuthService, useValue: auth }, { provide: ApiService, useValue: api }],
    });
    fixture = TestBed.createComponent(AlbumsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    assign = vi.fn();
    vi.stubGlobal("window", { ...window, location: { assign }, setTimeout, clearTimeout });
    return fixture.whenStable();
  }

  beforeEach(() => vi.useRealTimers());
  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it("initializes the shared session, displays albums, and loads optional covers", async () => {
    await setup();
    api.getAlbumImages.mockResolvedValue({ items: [{ id: 55, canManage: true, contentType: "image/png" }] });
    await component.loadAlbums();
    await Promise.resolve();
    expect(auth.initialize).toHaveBeenCalledOnce();
    expect(api.getAlbums).toHaveBeenCalledWith(account, "all", 1, 9, "");
    expect(component.albums()).toEqual([album]);
    expect(component.hasLoaded()).toBe(true);
    await vi.waitFor(() => expect(component.covers()).toEqual({ 4: "blob:cover" }));
    expect(fixture.nativeElement.textContent).toContain("Summer trip");
    expect(fixture.nativeElement.textContent).toContain("Not updated");
  });

  it("renders the empty state and handles a missing session", async () => {
    await setup(false);
    expect(component.loading()).toBe(false);
    expect(api.getAlbums).not.toHaveBeenCalled();
    await component.loadAlbums();
    expect(api.getAlbums).not.toHaveBeenCalled();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Sign in to WinCapture first");
    component.focusCreateField();
  });

  it("loads filters and pages, guards invalid requests, and debounces search", async () => {
    await setup();
    component.setFilter("all");
    expect(api.getAlbums).toHaveBeenCalledTimes(1);
    component.setFilter("mine");
    await Promise.resolve();
    expect(component.currentPage()).toBe(1);
    expect(api.getAlbums).toHaveBeenLastCalledWith(account, "mine", 1, 9, "");
    component.setPage(1);
    component.setPage(0);
    expect(api.getAlbums).toHaveBeenCalledTimes(2);
    component.pageCount.set(3);
    component.setPage(2);
    await Promise.resolve();
    expect(api.getAlbums).toHaveBeenCalledTimes(3);
    expect(api.getAlbums).toHaveBeenLastCalledWith(account, "mine", 2, 9, "");

    vi.useFakeTimers();
    vi.stubGlobal("window", { ...window, location: { assign }, setTimeout, clearTimeout });
    component.setSearch("  beach  ");
    component.setSearch("  beach day  ");
    expect(api.getAlbums).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(300);
    expect(api.getAlbums).toHaveBeenCalledTimes(4);
    expect(api.getAlbums).toHaveBeenLastCalledWith(account, "mine", 1, 9, "beach day");
  });

  it("keeps a newer page result when an older request finishes later", async () => {
    await setup();
    let resolveOld!: (value: typeof page) => void;
    api.getAlbums.mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve; }));
    api.getAlbums.mockResolvedValueOnce({ ...page, items: [{ ...album, id: 5, albumName: "New result" }] });
    const oldRequest = component.loadAlbums();
    const newRequest = component.loadAlbums();
    await newRequest;
    resolveOld({ ...page, items: [{ ...album, id: 6, albumName: "Old result" }] });
    await oldRequest;
    expect(component.albums()[0]?.albumName).toBe("New result");
  });

  it("skips cover requests when the session expires before the albums response", async () => {
    await setup();
    api.getAlbumImages.mockClear();
    let resolveAlbums!: (value: typeof page) => void;
    api.getAlbums.mockReturnValueOnce(new Promise((resolve) => { resolveAlbums = resolve; }));
    const pending = component.loadAlbums();
    auth.account.set(null);
    resolveAlbums(page);
    await pending;
    expect(api.getAlbumImages).not.toHaveBeenCalled();
  });

  it("revokes a cover URL when its request finishes after a newer album request", async () => {
    await setup();
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const image = { id: 55, canManage: true, contentType: "image/png" };
    api.getAlbumImages.mockResolvedValue({ items: [image] });
    let resolveStaleCover!: (value: string) => void;
    api.getAlbumCover
      .mockReturnValueOnce(new Promise((resolve) => { resolveStaleCover = resolve; }))
      .mockResolvedValueOnce("blob:new-cover");

    const staleRequest = component.loadAlbums();
    await vi.waitFor(() => expect(api.getAlbumCover).toHaveBeenCalledTimes(1));
    await component.loadAlbums();
    await vi.waitFor(() => expect(component.covers()).toEqual({ 4: "blob:new-cover" }));
    resolveStaleCover("blob:stale-cover");
    await vi.waitFor(() => expect(revoke).toHaveBeenCalledWith("blob:stale-cover"));
    await staleRequest;
  });

  it("shows load and create errors and validates album names", async () => {
    await setup();
    api.getAlbums.mockRejectedValueOnce(Object.assign(new Error("ignored"), { error: { message: "load denied" } }));
    await component.loadAlbums();
    expect(component.error()).toBe("load denied");
    auth.account.set(null);
    component.albumName.set("Album");
    await component.createAlbum();
    expect(component.error()).toBe("Album name is required.");
    auth.account.set(account);
    component.albumName.set(" ");
    await component.createAlbum();
    expect(component.error()).toBe("Album name is required.");
    component.albumName.set("x".repeat(201));
    await component.createAlbum();
    expect(component.error()).toBe("Album name cannot exceed 200 characters.");

    component.albumName.set(" Valid name ");
    api.createAlbum.mockRejectedValueOnce("unknown error");
    await component.createAlbum();
    expect(component.error()).toBe("Unable to create album.");
  });

  it("creates and opens an album, and selects filter styles", async () => {
    await setup();
    component.albumName.set("  New album  ");
    await component.createAlbum();
    expect(api.createAlbum).toHaveBeenCalledWith(account, { albumName: "New album" });
    expect(component.albumName()).toBe("");
    expect(assign).toHaveBeenCalledWith(expect.stringContaining("/albums/4"));
    expect(component.filterButtonClass("all")).toContain("bg-white/70");
    expect(component.filterButtonClass("mine")).toContain("bg-transparent");
  });

  it("supports retry links, empty previews, and failed cover requests", async () => {
    await setup();
    component.loading.set(false);
    component.hasLoaded.set(true);
    component.error.set("network down");
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"] button')?.textContent).toContain("Retry");
    component.error.set("Microsoft sign-in or consent is required");
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Return to React sign-in");

    api.getAlbumImages.mockResolvedValueOnce({ items: [] }).mockRejectedValueOnce(new Error("cover unavailable"));
    await component.loadAlbums();
    await vi.waitFor(() => expect(component.covers()).toEqual({}));
    expect(api.getAlbumCover).not.toHaveBeenCalled();
  });

  it("revokes existing and stale object URLs and cancels pending search on destroy", async () => {
    await setup();
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    api.getAlbumImages.mockResolvedValue({ items: [{ id: 55, canManage: true, contentType: "image/png" }] });
    await component.loadAlbums();
    await vi.waitFor(() => expect(component.covers()).toEqual({ 4: "blob:cover" }));
    await component.loadAlbums();
    await vi.waitFor(() => expect(revoke).toHaveBeenCalledWith("blob:cover"));
    expect(revoke).toHaveBeenCalledWith("blob:cover");
    component.setSearch("pending");
    fixture.destroy();
    expect(revoke).toHaveBeenCalledWith("blob:cover");
  });
});
