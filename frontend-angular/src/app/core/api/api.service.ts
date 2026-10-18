import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { InteractionRequiredAuthError, type AccountInfo } from '@azure/msal-browser';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiScopes } from '../auth/msal.config';
import type {
  AlbumFilter,
  AlbumResponse,
  CreateAlbumRequest,
  FileCategory,
  FileResponse,
  PagedResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly msal = inject(MsalService);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  getAlbums(
    account: AccountInfo,
    filter: AlbumFilter,
    page: number,
    pageSize: number,
    search: string,
  ): Promise<PagedResponse<AlbumResponse>> {
    const suffix = filter === 'mine' ? '/mine' : filter === 'shared' ? '/shared' : '';
    return this.getPaged<AlbumResponse>(`/api/albums${suffix}`, account, page, pageSize, search);
  }

  createAlbum(account: AccountInfo, request: CreateAlbumRequest): Promise<AlbumResponse> {
    return this.send<AlbumResponse>('/api/albums', account, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  getAlbumImages(account: AccountInfo, albumId: number): Promise<PagedResponse<FileResponse>> {
    return this.getPaged<FileResponse>(`/api/albums/${albumId}/files`, account, 1, 100, '', 'Images');
  }

  async getAlbumCover(account: AccountInfo, albumId: number, file: FileResponse): Promise<string> {
    const canManage = file.canManage;
    const action = canManage ? 'download' : 'preview';
    const headers = await this.authorizationHeaders(account);
    const blob = await firstValueFrom(this.http.get(
      `${this.baseUrl}/api/albums/${albumId}/files/${file.id}/${action}`,
      { headers, responseType: 'blob' },
    ));
    return URL.createObjectURL(new Blob([blob], { type: file.contentType }));
  }

  getCurrentUser<T>(account: AccountInfo): Promise<T> {
    return this.send<T>('/api/auth/me', account);
  }

  private getPaged<T>(
    path: string,
    account: AccountInfo,
    page: number,
    pageSize: number,
    search: string,
    category?: FileCategory,
  ): Promise<PagedResponse<T>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search.trim()) params = params.set('search', search.trim());
    if (category && category !== 'All') params = params.set('category', category);
    return this.send<PagedResponse<T>>(`${path}?${params.toString()}`, account);
  }

  private async send<T>(path: string, account: AccountInfo, options: {
    method?: string;
    body?: string;
  } = {}): Promise<T> {
    const headers = await this.authorizationHeaders(account);
    const url = `${this.baseUrl}${path}`;
    try {
      if (options.method === 'POST') {
        const jsonHeaders = headers.set('Content-Type', 'application/json');
        return await firstValueFrom(this.http.post<T>(url, options.body ?? '', { headers: jsonHeaders }));
      }
      return await firstValueFrom(this.http.get<T>(url, { headers }));
    } catch (error: unknown) {
      if (error instanceof InteractionRequiredAuthError) {
        throw new Error('Microsoft sign-in or consent is required. Choose Sign in again and retry.');
      }
      if (error instanceof HttpErrorResponse) {
        const body = error.error as { message?: string; Message?: string; error?: string; Error?: string } | null;
        if (error.status === 0) {
          throw new Error('The WinCapture API is unreachable. Check that https://localhost:7106 is running and its certificate is trusted. Browser API calls use the React origin https://localhost:5173.');
        }
        if (error.status === 401) {
          throw new Error('Microsoft sign-in or consent is required. Choose Sign in again and retry.');
        }
        if (error.status === 403) {
          throw new Error(body?.message ?? body?.Message ?? 'Your Microsoft account does not have a WinCapture User or Admin role. Ask an administrator to assign access.');
        }
        throw new Error(body?.message ?? body?.Message ?? body?.error ?? body?.Error ?? `WinCapture API returned HTTP ${error.status}.`);
      }
      if (error instanceof Error) throw error;
      throw new Error('The WinCapture API request failed. Check the backend and try again.');
    }
  }

  private async authorizationHeaders(account: AccountInfo): Promise<HttpHeaders> {
    try {
      const result = await this.msal.instance.acquireTokenSilent({ account, scopes: apiScopes });
      return new HttpHeaders({ Authorization: `Bearer ${result.accessToken}` });
    } catch (error: unknown) {
      if (error instanceof InteractionRequiredAuthError) {
        throw new Error('Microsoft sign-in or consent is required. Choose Sign in again and retry.');
      }
      throw error;
    }
  }
}
