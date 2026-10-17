import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { forkJoin, of, firstValueFrom } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AlbumApiService, type AlbumFilter } from '../../api/album-api.service';
import { AuthService } from '../../auth/auth.service';
import type { AlbumResponse, PagedResponse } from '../../models/album.models';

const PAGE_SIZE = 9;

@Component({
  selector: 'app-albums',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './albums.component.html',
  styleUrl: './albums.component.css',
})
export class AlbumsComponent implements OnInit, OnDestroy {
  private readonly api = inject(AlbumApiService);
  private readonly auth = inject(AuthService);
  private searchTimer?: ReturnType<typeof setTimeout>;
  private requestVersion = 0;
  private coverVersion = 0;
  private readonly objectUrls = new Set<string>();

  readonly albums = signal<AlbumResponse[]>([]);
  readonly coverUrls = signal<Record<number, string>>({});
  readonly currentPage = signal(1);
  readonly pageCount = signal(1);
  readonly totalItems = signal(0);
  readonly albumFilter = signal<AlbumFilter>('all');
  readonly searchInput = signal('');
  readonly searchQuery = signal('');
  readonly loading = signal(true);
  readonly hasLoaded = signal(false);
  readonly error = signal<string | null>(null);
  readonly creating = signal(false);
  readonly albumName = signal('');

  ngOnInit(): void {
    this.loadAlbums();
  }

  ngOnDestroy(): void {
    this.requestVersion += 1;
    this.coverVersion += 1;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.revokeCoverUrls();
  }

  setFilter(filter: AlbumFilter): void {
    this.albumFilter.set(filter);
    this.currentPage.set(1);
    this.loadAlbums();
  }

  setPage(page: number): void {
    if (page < 1 || page > this.pageCount()) return;
    this.currentPage.set(page);
    this.loadAlbums();
  }

  updateSearch(value: string): void {
    this.searchInput.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.searchQuery.set(value.trim());
      this.currentPage.set(1);
      this.loadAlbums();
    }, 300);
  }

  updateAlbumName(value: string): void {
    this.albumName.set(value);
  }

  onAlbumNameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.creating()) void this.createAlbum();
  }

  createAlbum(): void {
    const albumName = this.albumName().trim();
    if (!albumName) {
      this.error.set('Album name is required.');
      return;
    }

    this.creating.set(true);
    this.error.set(null);
    this.api.createAlbum({ albumName }).subscribe({
      next: (album) => {
        this.albumName.set('');
        this.creating.set(false);
        this.openAlbum(album.id);
      },
      error: (error: unknown) => {
        this.error.set(error instanceof Error ? error.message : 'Unable to create album.');
        this.creating.set(false);
      },
    });
  }

  openAlbum(albumId: number): void {
    // Album detail stays in the existing React application, which has its own MSAL cache.
    window.location.assign(`${environment.reactAlbumsUrl.replace(/\/$/, '')}/${albumId}`);
  }

  focusAlbumName(): void {
    document.getElementById('new-album-name')?.focus();
  }

  private loadAlbums(): void {
    const version = ++this.requestVersion;
    this.loading.set(true);
    this.error.set(null);

    const filter = this.albumFilter();
    const pageNumber = this.currentPage();
    const search = this.searchQuery();
    const pageRequest = filter === 'shared'
      ? this.api.getAlbums(filter, pageNumber, PAGE_SIZE, search).pipe(
        catchError((error: unknown) => {
          if (getStatus(error) !== 404 || !this.auth.user()) throw error;
          return this.loadSharedFallback(pageNumber, search);
        }),
      )
      : this.api.getAlbums(filter, pageNumber, PAGE_SIZE, search);

    pageRequest.subscribe({
      next: (page) => {
        if (version !== this.requestVersion) return;
        this.albums.set(page.items);
        this.currentPage.set(page.page);
        this.pageCount.set(Math.max(1, page.pageCount));
        this.totalItems.set(page.totalItems);
        this.hasLoaded.set(true);
        this.loading.set(false);
        this.loadCoverPreviews(page.items);
      },
      error: (error: unknown) => {
        if (version !== this.requestVersion) return;
        this.error.set(error instanceof Error ? error.message : 'Unable to load albums.');
        this.hasLoaded.set(true);
        this.loading.set(false);
      },
    });
  }

  private loadSharedFallback(pageNumber: number, search: string) {
    return this.api.getAccessibleAlbums(1, 100, search).pipe(
      switchMap((firstPage) => {
        const rest = Array.from({ length: Math.max(0, firstPage.pageCount - 1) }, (_, index) =>
          this.api.getAccessibleAlbums(index + 2, 100, search),
        );
        const allPages = rest.length ? forkJoin(rest) : of([]);
        return allPages.pipe(map((pages) => {
          const albums = [...firstPage.items, ...pages.flatMap((page) => page.items)]
            .filter((album) => album.ownerId !== this.auth.user()?.userId);
          const pageCount = Math.max(1, Math.ceil(albums.length / PAGE_SIZE));
          const page = Math.min(pageNumber, pageCount);
          const start = (page - 1) * PAGE_SIZE;
          const response: PagedResponse<AlbumResponse> = {
            items: albums.slice(start, start + PAGE_SIZE),
            totalItems: albums.length,
            page,
            pageSize: PAGE_SIZE,
            pageCount,
          };
          return response;
        }));
      }),
    );
  }

  private loadCoverPreviews(albums: AlbumResponse[]): void {
    const version = ++this.coverVersion;
    this.revokeCoverUrls();
    this.coverUrls.set({});

    if (!albums.length) return;
    const previews = albums.map(async (album): Promise<[number, string] | null> => {
      try {
        const page = await firstValueFrom(this.api.getAlbumImages(album.id));
        const firstImage = page.items[0];
        if (!firstImage) return null;
        const blob = await firstValueFrom(this.api.getAlbumPreview(album.id, firstImage.id));
        return [album.id, URL.createObjectURL(blob)];
      } catch {
        // No cover is normal for empty albums and for albums with no previewable images.
        return null;
      }
    });

    void Promise.all(previews).then((entries) => {
      const urls = entries.filter((entry): entry is [number, string] => entry !== null);
      if (version !== this.coverVersion) {
        urls.forEach(([, url]) => URL.revokeObjectURL(url));
        return;
      }
      urls.forEach(([, url]) => this.objectUrls.add(url));
      this.coverUrls.set(Object.fromEntries(urls));
    });
  }

  private revokeCoverUrls(): void {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls.clear();
  }
}

function getStatus(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'status' in error
    ? Number((error as { status: unknown }).status)
    : undefined;
}
