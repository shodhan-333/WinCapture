import { Component, DestroyRef, OnInit, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../core/auth/auth.service";
import { ApiService } from "../../core/api/api.service";
import type { AlbumFilter, AlbumResponse, PagedResponse } from "../../core/models";
import { apiErrorMessage } from "../../shared/api/api-error-message";
import { formatDate } from "../../shared/utils/format-date";
import { environment } from "../../../environments/environment";

const PAGE_SIZE = 9;

@Component({
  selector: "app-albums-page",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./albums-page.component.html",
})
export class AlbumsPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly albums = signal<AlbumResponse[]>([]);
  readonly currentPage = signal(1);
  readonly pageCount = signal(1);
  readonly totalItems = signal(0);
  readonly filter = signal<AlbumFilter>("all");
  readonly searchInput = signal("");
  readonly loading = signal(true);
  readonly hasLoaded = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly albumName = signal("");
  readonly covers = signal<Record<number, string>>({});
  readonly pages = computed(() =>
    Array.from({ length: this.pageCount() }, (_, index) => index + 1),
  );
  readonly formatDate = formatDate;
  readonly reactAlbumsUrl = environment.reactAlbumsUrl;
  readonly reactDashboardUrl = new URL("/dashboard", environment.reactAlbumsUrl).toString();
  private debounceId: number | undefined;
  private requestVersion = 0;
  private readonly objectUrls = new Set<string>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.debounceId !== undefined) window.clearTimeout(this.debounceId);
      this.requestVersion += 1;
      this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
      this.objectUrls.clear();
    });
  }

  ngOnInit(): void {
    void this.initializePage();
  }

  private async initializePage(): Promise<void> {
    await this.auth.initialize();
    const account = this.auth.account();
    if (account && this.auth.user()) await this.loadAlbums();
    else this.loading.set(false);
  }

  async loadAlbums(): Promise<void> {
    const account = this.auth.account();
    if (!account) return;
    const version = ++this.requestVersion;
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.api.getAlbums(
        account,
        this.filter(),
        this.currentPage(),
        PAGE_SIZE,
        this.searchInput().trim(),
      );
      if (version !== this.requestVersion) return;
      this.applyPage(result);
      void this.loadCovers(result.items, version);
    } catch (error: unknown) {
      if (version === this.requestVersion)
        this.error.set(apiErrorMessage(error, "Unable to load albums."));
    } finally {
      if (version === this.requestVersion) {
        this.loading.set(false);
        this.hasLoaded.set(true);
      }
    }
  }

  setFilter(filter: AlbumFilter): void {
    if (this.filter() === filter) return;
    this.filter.set(filter);
    this.currentPage.set(1);
    void this.loadAlbums();
  }

  setSearch(value: string): void {
    this.searchInput.set(value);
    if (this.debounceId !== undefined) window.clearTimeout(this.debounceId);
    this.debounceId = window.setTimeout(() => {
      this.currentPage.set(1);
      void this.loadAlbums();
    }, 300);
  }

  setPage(page: number): void {
    if (page < 1 || page > this.pageCount() || page === this.currentPage()) return;
    this.currentPage.set(page);
    void this.loadAlbums();
  }

  focusCreateField(): void {
    document.getElementById("new-album-name")?.focus();
  }

  filterButtonClass(filter: AlbumFilter): string {
    const base =
      "min-h-[33px] rounded-[8px] border px-3 text-[10px] font-semibold transition-[color,background,box-shadow,border-color]";
    return this.filter() === filter
      ? `${base} border-white/80 bg-white/70 text-[#145a99] shadow-[0_3px_12px_rgba(20,54,84,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)]`
      : `${base} border-transparent bg-transparent text-[#557086] hover:bg-white/30 hover:text-[#194b75]`;
  }

  async createAlbum(): Promise<void> {
    const account = this.auth.account();
    const albumName = this.albumName().trim();
    if (!account || !albumName) {
      this.error.set("Album name is required.");
      return;
    }
    if (albumName.length > 200) {
      this.error.set("Album name cannot exceed 200 characters.");
      return;
    }
    this.creating.set(true);
    this.error.set(null);
    try {
      const created = await this.api.createAlbum(account, { albumName });
      this.albumName.set("");
      this.openReactAlbum(created);
    } catch (error: unknown) {
      this.error.set(apiErrorMessage(error, "Unable to create album."));
    } finally {
      this.creating.set(false);
    }
  }

  openReactAlbum(album: AlbumResponse): void {
    const destination = new URL(
      `/albums/${encodeURIComponent(String(album.id))}`,
      this.reactAlbumsUrl,
    );
    window.location.assign(destination.toString());
  }

  private applyPage(page: PagedResponse<AlbumResponse>): void {
    this.albums.set(page.items);
    this.currentPage.set(page.page);
    this.pageCount.set(Math.max(page.pageCount, 1));
    this.totalItems.set(page.totalItems);
  }

  private async loadCovers(albums: AlbumResponse[], version: number): Promise<void> {
    const account = this.auth.account();
    if (!account) return;
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls.clear();
    this.covers.set({});
    const urls: Record<number, string> = {};
    await Promise.all(
      albums.map(async (album) => {
        try {
          const page = await this.api.getAlbumImages(account, album.id);
          const file = page.items[0];
          if (!file) return;
          const url = await this.api.getAlbumCover(account, album.id, file);
          if (version !== this.requestVersion) {
            URL.revokeObjectURL(url);
            return;
          }
          this.objectUrls.add(url);
          urls[album.id] = url;
        } catch {
          // A missing image, restricted preview, or network failure leaves the fallback cover visible.
        }
      }),
    );
    if (version === this.requestVersion) this.covers.set(urls);
  }
}
