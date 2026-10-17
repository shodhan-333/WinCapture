import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  AlbumResponse,
  CreateAlbumRequest,
  FileResponse,
  PagedResponse,
} from '../models/album.models';

export type AlbumFilter = 'all' | 'shared' | 'mine';

@Injectable({ providedIn: 'root' })
export class AlbumApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl.replace(/\/$/, '');

  getAlbums(filter: AlbumFilter, page: number, pageSize: number, search: string) {
    const route = filter === 'mine' ? '/api/albums/mine'
      : filter === 'shared' ? '/api/albums/shared'
        : '/api/albums';
    return this.http.get<PagedResponse<AlbumResponse>>(`${this.apiUrl}${route}`, {
      params: this.pageParams(page, pageSize, search),
    }).pipe(catchError((error: unknown) => throwError(() => toApiError(error))));
  }

  getAccessibleAlbums(page: number, pageSize: number, search: string) {
    return this.http.get<PagedResponse<AlbumResponse>>(`${this.apiUrl}/api/albums`, {
      params: this.pageParams(page, pageSize, search),
    }).pipe(catchError((error: unknown) => throwError(() => toApiError(error))));
  }

  createAlbum(request: CreateAlbumRequest) {
    return this.http.post<AlbumResponse>(`${this.apiUrl}/api/albums`, request)
      .pipe(catchError((error: unknown) => throwError(() => toApiError(error))));
  }

  getAlbumImages(albumId: number) {
    const params = this.pageParams(1, 100, '').set('category', 'Images');
    return this.http.get<PagedResponse<FileResponse>>(
      `${this.apiUrl}/api/albums/${albumId}/files`, { params },
    ).pipe(catchError((error: unknown) => throwError(() => toApiError(error))));
  }

  getAlbumPreview(albumId: number, fileId: number) {
    return this.http.get(
      `${this.apiUrl}/api/albums/${albumId}/files/${fileId}/preview`,
      { responseType: 'blob' },
    ).pipe(catchError((error: unknown) => throwError(() => toApiError(error))));
  }

  private pageParams(page: number, pageSize: number, search: string): HttpParams {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search.trim()) params = params.set('search', search.trim());
    return params;
  }
}

export function toApiError(error: unknown): Error {
  if (!(error instanceof HttpErrorResponse)) {
    return error instanceof Error ? error : new Error('The WinCapture API could not be reached.');
  }

  const payload = error.error as { message?: string; Message?: string; error?: string; Error?: string } | null;
  const detail = payload?.message ?? payload?.Message ?? payload?.error ?? payload?.Error;
  const defaultMessage = error.status === 0
    ? 'The WinCapture API could not be reached. Check that the backend is running and that CORS allows http://localhost:4200.'
    : `Backend returned HTTP ${error.status}.`;
  const message = detail ?? defaultMessage;

  if (error.status === 400) return new Error(`Validation failed: ${message}`);
  if (error.status === 401) return new Error(`Authentication expired or invalid: ${message}`);
  if (error.status === 403) return new Error(`Access denied: ${message}`);
  if (error.status === 404) return Object.assign(new Error(`Resource not found: ${message}`), { status: 404 });
  if (error.status >= 500) return new Error('An unexpected server error occurred. Please try again later.');
  return new Error(message);
}
