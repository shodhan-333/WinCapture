import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { MsalService } from "@azure/msal-angular";
import { InteractionRequiredAuthError, type AccountInfo } from "@azure/msal-browser";
import { firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";
import { apiScopes } from "../auth/msal.config";
import type {
  AlbumFilter,
  AlbumResponse,
  CurrentUser,
  CreateAlbumRequest,
  FileCategory,
  FileResponse,
  PagedResponse,
} from "../models";

@Injectable({ providedIn: "root" })
// Centralizes authenticated album and profile requests, response handling, and user-facing API errors.
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly msal = inject(MsalService);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, "");

  // Apply the selected ownership filter before requesting a page of albums.
  getAlbums(
    account: AccountInfo,
    filter: AlbumFilter,
    page: number,
    pageSize: number,
    search: string,
  ): Promise<PagedResponse<AlbumResponse>> {
    const suffix = filter === "mine" ? "/mine" : filter === "shared" ? "/shared" : "";
    return this.getPaged<AlbumResponse>(`/api/albums${suffix}`, account, page, pageSize, search);
  }

  // Create an album for the authenticated account.
  createAlbum(account: AccountInfo, request: CreateAlbumRequest): Promise<AlbumResponse> {
    return this.send<AlbumResponse>("/api/albums", account, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Request the album's first image page for cover selection.
  getAlbumImages(account: AccountInfo, albumId: number): Promise<PagedResponse<FileResponse>> {
    return this.getPaged<FileResponse>(
      `/api/albums/${albumId}/files`,
      account,
      1,
      100,
      "",
      "Images",
    );
  }

  // Download an authorized cover blob and expose it as a temporary object URL.
  async getAlbumCover(account: AccountInfo, albumId: number, file: FileResponse): Promise<string> {
    // Managers use the download endpoint; shared viewers must use the preview endpoint.
    const canManage = file.canManage;
    const action = canManage ? "download" : "preview";
    const headers = await this.authorizationHeaders(account);
    const blob = await firstValueFrom(
      this.http.get(`${this.baseUrl}/api/albums/${albumId}/files/${file.id}/${action}`, {
        headers,
        responseType: "blob",
      }),
    );
    return URL.createObjectURL(new Blob([blob], { type: file.contentType }));
  }

  // Load the backend profile associated with the active Microsoft account.
  getCurrentUser(account: AccountInfo): Promise<CurrentUser> {
    return this.send<CurrentUser>("/api/auth/me", account);
  }

  // Build shared paging and filter parameters before sending a GET request.
  private getPaged<T>(
    path: string,
    account: AccountInfo,
    page: number,
    pageSize: number,
    search: string,
    category?: FileCategory,
  ): Promise<PagedResponse<T>> {
    // Keep pagination, search, and category parameters consistent across album requests.
    let params = new HttpParams().set("page", page).set("pageSize", pageSize);
    if (search.trim()) params = params.set("search", search.trim());
    if (category && category !== "All") params = params.set("category", category);
    return this.send<PagedResponse<T>>(`${path}?${params.toString()}`, account);
  }

  // Attach a bearer token, issue the request, and normalize HTTP errors.
  private async send<T>(
    path: string,
    account: AccountInfo,
    options: {
      method?: string;
      body?: string;
    } = {},
  ): Promise<T> {
    const headers = await this.authorizationHeaders(account);
    const url = `${this.baseUrl}${path}`;
    try {
      if (options.method === "POST") {
        const jsonHeaders = headers.set("Content-Type", "application/json");
        return await firstValueFrom(
          this.http.post<T>(url, options.body ?? "", { headers: jsonHeaders }),
        );
      }
      return await firstValueFrom(this.http.get<T>(url, { headers }));
    } catch (error: unknown) {
      // Convert transport and authorization failures into actionable messages for the page.
      if (error instanceof InteractionRequiredAuthError) {
        throw new Error(
          "Microsoft sign-in or consent is required. Choose Sign in again and retry.",
        );
      }
      if (error instanceof HttpErrorResponse) {
        const body = this.getErrorBody(error.error);
        if (error.status === 0) {
          throw new Error(
            "The WinCapture API is unreachable. Check that https://localhost:7106 is running and its certificate is trusted. Browser API calls use the React origin https://localhost:5173.",
          );
        }
        if (error.status === 401) {
          throw new Error(
            "Microsoft sign-in or consent is required. Choose Sign in again and retry.",
          );
        }
        if (error.status === 403) {
          throw new Error(
            body?.message ??
              body?.Message ??
              "Your Microsoft account does not have a WinCapture User or Admin role. Ask an administrator to assign access.",
          );
        }
        throw new Error(
          body?.message ??
            body?.Message ??
            body?.error ??
            body?.Error ??
            `WinCapture API returned HTTP ${error.status}.`,
        );
      }
      if (error instanceof Error) throw error;
      throw new Error("The WinCapture API request failed. Check the backend and try again.");
    }
  }

  // Narrow an unknown HTTP error body to the message fields supported by the API.
  private getErrorBody(value: unknown): {
    message?: string;
    Message?: string;
    error?: string;
    Error?: string;
  } | null {
    if (typeof value !== "object" || value === null) return null;
    return value;
  }

  // Reuse the shared MSAL session to acquire an API access token silently.
  private async authorizationHeaders(account: AccountInfo): Promise<HttpHeaders> {
    try {
      // Silent acquisition reuses the shared session and avoids starting a second sign-in flow.
      const result = await this.msal.instance.acquireTokenSilent({ account, scopes: apiScopes });
      return new HttpHeaders({ Authorization: `Bearer ${result.accessToken}` });
    } catch (error: unknown) {
      if (error instanceof InteractionRequiredAuthError) {
        throw new Error(
          "Microsoft sign-in or consent is required. Choose Sign in again and retry.",
        );
      }
      throw error;
    }
  }
}
