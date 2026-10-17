import {
  InteractionRequiredAuthError,
  type AccountInfo,
  type IPublicClientApplication,
} from "@azure/msal-browser";

import { apiBaseUrl, apiScope } from "../authConfig";
import { ApiError, type PagedResponse } from "../types/api";
import type { CurrentUser } from "../types/auth";
import type {
  AlbumResponse,
  CreateAlbumRequest,
  UpdateAlbumRequest,
  AlbumMemberResponse,
  AddAlbumMemberRequest,
  UpdateAlbumMemberRequest,
} from "../types/album";
import type { AdminFileResponse, FileResponse } from "../types/file";

// Several dashboard requests can discover the same expired/missing consent at once.
// Share one redirect per MSAL instance so those requests cannot start competing flows.
const interactiveTokenRequests = new WeakMap<
  IPublicClientApplication,
  Promise<void>
>();

function beginInteractiveTokenAcquisition(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<void> {
  const existingRequest = interactiveTokenRequests.get(instance);
  if (existingRequest) return existingRequest;

  const request = instance.acquireTokenRedirect({
    account,
    scopes: [apiScope],
    redirectStartPage: window.location.href,
  });
  interactiveTokenRequests.set(instance, request);
  void request.catch(() => {
    if (interactiveTokenRequests.get(instance) === request) {
      interactiveTokenRequests.delete(instance);
    }
  });
  return request;
}

// Acquire an access token intended specifically for the WinCapture API.
async function acquireAccessToken(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<string> {
  try {
    // Reuse the cached token when possible; MSAL refreshes it silently if needed.
    const result = await instance.acquireTokenSilent({
      account,
      scopes: [apiScope],
    });

    if (!result.accessToken) {
      throw new ApiError(
        "Microsoft Entra did not return an access token for the WinCapture API.",
        401,
      );
    }

    return result.accessToken;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof InteractionRequiredAuthError) {
      try {
        await beginInteractiveTokenAcquisition(instance, account);
      } catch (interactionError) {
        throw new ApiError(
          interactionError instanceof Error
            ? `Microsoft sign-in could not be completed: ${interactionError.message}`
            : "Microsoft sign-in could not be completed. Please try signing in again.",
          401,
        );
      }

      // Redirect should leave the page. If MSAL resolves without navigation, do not
      // repeat automatically; let the established auth retry UI start a fresh attempt.
      interactiveTokenRequests.delete(instance);
      throw new ApiError(
        "Microsoft sign-in or consent is required. Complete the sign-in prompt and retry.",
        401,
      );
    }

    throw new ApiError(
      "Unable to acquire the Microsoft access token for the WinCapture API.",
      401,
    );
  }
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      message?: string;
      Message?: string;
      error?: string;
      Error?: string;
      status?: number;
      Status?: number;
    };

    // Accept camelCase and PascalCase error fields from the backend.
    return (
      data.message ||
      data.Message ||
      data.error ||
      data.Error ||
      `Backend returned HTTP ${response.status}.`
    );
  } catch {
    return `Backend returned HTTP ${response.status}.`;
  }
}

// Centralize authentication headers, HTTP requests, and error handling.
export async function callApi(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const accessToken = await acquireAccessToken(instance, account);

  const headers = new Headers(options.headers);

  // Send the Microsoft Entra access token directly to the backend.
  headers.set("Authorization", `Bearer ${accessToken}`);

  // FormData must keep the browser-generated multipart boundary.
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "The WinCapture API could not be reached. Ensure the backend is running and reachable.",
      0,
    );
  }

  if (!response.ok) {
    const serverMessage = await extractErrorMessage(response);
    let message = serverMessage;

    // Add context to common HTTP errors while retaining backend details.
    if (response.status === 400) {
      message = `Validation failed: ${serverMessage}`;
    } else if (response.status === 401) {
      message = `Authentication expired or invalid: ${serverMessage}`;
    } else if (response.status === 403) {
      message = `Access denied: ${serverMessage}`;
    } else if (response.status === 404) {
      message = `Resource not found: ${serverMessage}`;
    } else if (response.status === 409) {
      message = `Conflict: ${serverMessage}`;
    } else if (response.status === 413) {
      message = `File too large: ${serverMessage}`;
    } else if (response.status >= 500) {
      message = "An unexpected server error occurred. Please try again later.";
    }

    throw new ApiError(message, response.status);
  }

  return response;
}

// Build paginated URLs with optional search and category filters.
function buildPagePath(
  path: string,
  page: number,
  pageSize: number,
  search?: string,
  category?: string,
): string {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  const normalizedSearch = search?.trim();

  if (normalizedSearch) {
    query.set("search", normalizedSearch);
  }

  // "All" means no category restriction, so omit it from the query string.
  if (category && category !== "All") {
    query.set("category", category);
  }

  return `${path}?${query.toString()}`;
}

// Authentication API
export async function getCurrentUser(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<CurrentUser> {
  const response = await callApi(instance, account, "/api/auth/me");

  return (await response.json()) as CurrentUser;
}

// Albums API
export async function getAlbums(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page: number,
  pageSize: number,
  search?: string,
): Promise<PagedResponse<AlbumResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/albums", page, pageSize, search),
  );

  return (await response.json()) as PagedResponse<AlbumResponse>;
}

export async function getMyAlbums(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page = 1,
  pageSize = 10,
  search?: string,
): Promise<PagedResponse<AlbumResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/albums/mine", page, pageSize, search),
  );

  return (await response.json()) as PagedResponse<AlbumResponse>;
}

export async function getSharedAlbums(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page = 1,
  pageSize = 10,
  search?: string,
): Promise<PagedResponse<AlbumResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/albums/shared", page, pageSize, search),
  );

  return (await response.json()) as PagedResponse<AlbumResponse>;
}

export async function getAlbum(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
): Promise<AlbumResponse> {
  const response = await callApi(instance, account, `/api/albums/${albumId}`);

  return (await response.json()) as AlbumResponse;
}

export async function createAlbum(
  instance: IPublicClientApplication,
  account: AccountInfo,
  request: CreateAlbumRequest,
): Promise<AlbumResponse> {
  const response = await callApi(instance, account, "/api/albums", {
    method: "POST",
    body: JSON.stringify(request),
  });

  return (await response.json()) as AlbumResponse;
}

export async function updateAlbum(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  request: UpdateAlbumRequest,
): Promise<AlbumResponse> {
  const response = await callApi(instance, account, `/api/albums/${albumId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });

  return (await response.json()) as AlbumResponse;
}

export async function deleteAlbum(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
): Promise<void> {
  await callApi(instance, account, `/api/albums/${albumId}`, {
    method: "DELETE",
  });
}

export async function getAlbumMembers(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
): Promise<AlbumMemberResponse[]> {
  const response = await callApi(
    instance,
    account,
    `/api/albums/${albumId}/members`,
  );

  return (await response.json()) as AlbumMemberResponse[];
}

export async function addAlbumMember(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  request: AddAlbumMemberRequest,
): Promise<void> {
  await callApi(instance, account, `/api/albums/${albumId}/members`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function updateAlbumMember(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  userId: number,
  request: UpdateAlbumMemberRequest,
): Promise<void> {
  await callApi(instance, account, `/api/albums/${albumId}/members/${userId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export async function removeAlbumMember(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  userId: number,
): Promise<void> {
  await callApi(instance, account, `/api/albums/${albumId}/members/${userId}`, {
    method: "DELETE",
  });
}
// Album Files API
export async function getAlbumFiles(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  page: number,
  pageSize: number,
  category?: string,
): Promise<PagedResponse<FileResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath(
      `/api/albums/${albumId}/files`,
      page,
      pageSize,
      undefined,
      category,
    ),
    { cache: "no-store" },
  );

  return (await response.json()) as PagedResponse<FileResponse>;
}

export async function getAlbumFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  fileId: number,
): Promise<FileResponse> {
  const response = await callApi(
    instance,
    account,
    `/api/albums/${albumId}/files/${fileId}`,
  );

  return (await response.json()) as FileResponse;
}

export async function uploadAlbumFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  file: File,
): Promise<FileResponse> {
  return uploadMultipartFile<FileResponse>(
    instance,
    account,
    `/api/albums/${albumId}/files`,
    "POST",
    file,
  );
}

export async function replaceAlbumFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  fileId: number,
  file: File,
): Promise<FileResponse> {
  return uploadMultipartFile<FileResponse>(
    instance,
    account,
    `/api/albums/${albumId}/files/${fileId}`,
    "PUT",
    file,
  );
}

export async function downloadAlbumFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  fileId: number,
  fallbackFileName: string,
): Promise<void> {
  await downloadResponse(
    instance,
    account,
    `/api/albums/${albumId}/files/${fileId}/download`,
    fallbackFileName,
  );
}

export async function getFilePreviewUrl(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
  albumId?: number,
  canManage = false,
): Promise<string> {
  // Managers can use the download endpoint; shared-album viewers use preview.
  const path = albumId
    ? canManage
      ? `/api/albums/${albumId}/files/${fileId}/download`
      : `/api/albums/${albumId}/files/${fileId}/preview`
    : `/api/files/${fileId}/download`;

  return getFilePreviewUrlByPath(instance, account, path);
}

export async function getFilePreviewUrlByPath(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
  contentType?: string,
): Promise<string> {
  const response = await callApi(instance, account, path);

  const responseBlob = await response.blob();

  // Preserve the known MIME type so the browser can render the preview correctly.
  const previewBlob = contentType
    ? new Blob([responseBlob], { type: contentType })
    : responseBlob;

  return URL.createObjectURL(previewBlob);
}

export async function deleteAlbumFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  fileId: number,
): Promise<{ storageCleanupComplete: boolean }> {
  const response = await callApi(
    instance,
    account,
    `/api/albums/${albumId}/files/${fileId}`,
    {
      method: "DELETE",
    },
  );
  if (response.status === 204) return { storageCleanupComplete: true };
  return (await response.json()) as { storageCleanupComplete: boolean };
}

export async function removeAlbumFileAssociation(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  fileId: number,
): Promise<void> {
  await callApi(
    instance,
    account,
    `/api/albums/${albumId}/files/${fileId}/association`,
    {
      method: "DELETE",
    },
  );
}

// Personal Files
export async function getFiles(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page: number,
  pageSize: number,
  search?: string,
  category?: string,
): Promise<PagedResponse<FileResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/files", page, pageSize, search, category),
  );

  return (await response.json()) as PagedResponse<FileResponse>;
}

export async function getFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
): Promise<FileResponse> {
  const response = await callApi(instance, account, `/api/files/${fileId}`);

  return (await response.json()) as FileResponse;
}

export async function getFavorites(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page: number,
  pageSize: number,
  search?: string,
  category?: string,
): Promise<PagedResponse<FileResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/files/favorites", page, pageSize, search, category),
  );

  return (await response.json()) as PagedResponse<FileResponse>;
}

export async function addFavorite(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
): Promise<void> {
  await callApi(instance, account, `/api/files/${fileId}/favorite`, {
    method: "PUT",
  });
}

export async function removeFavorite(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
): Promise<void> {
  await callApi(instance, account, `/api/files/${fileId}/favorite`, {
    method: "DELETE",
  });
}

export async function uploadFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  file: File,
): Promise<FileResponse> {
  return uploadMultipartFile<FileResponse>(
    instance,
    account,
    "/api/files",
    "POST",
    file,
  );
}

export async function replaceFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
  file: File,
): Promise<FileResponse> {
  return uploadMultipartFile<FileResponse>(
    instance,
    account,
    `/api/files/${fileId}`,
    "PUT",
    file,
  );
}

export async function downloadFileByPath(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
  fallbackFileName: string,
): Promise<void> {
  await downloadResponse(instance, account, path, fallbackFileName);
}

export async function deleteFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
): Promise<{ storageCleanupComplete: boolean }> {
  const response = await callApi(instance, account, `/api/files/${fileId}`, {
    method: "DELETE",
  });
  if (response.status === 204) return { storageCleanupComplete: true };
  return (await response.json()) as { storageCleanupComplete: boolean };
}

// Admin API
export async function getAdminFiles(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page: number,
  pageSize: number,
  search?: string,
  category?: string,
): Promise<PagedResponse<AdminFileResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/admin/files", page, pageSize, search, category),
  );

  return (await response.json()) as PagedResponse<AdminFileResponse>;
}

export async function getMyAdminFiles(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page = 1,
  pageSize = 10,
  search?: string,
): Promise<PagedResponse<AdminFileResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/admin/files/mine", page, pageSize, search),
  );

  return (await response.json()) as PagedResponse<AdminFileResponse>;
}

export async function getAdminAlbums(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page: number,
  pageSize: number,
  search?: string,
): Promise<PagedResponse<AlbumResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/admin/albums", page, pageSize, search),
  );

  return (await response.json()) as PagedResponse<AlbumResponse>;
}

export async function getMyAdminAlbums(
  instance: IPublicClientApplication,
  account: AccountInfo,
  page = 1,
  pageSize = 10,
  search?: string,
): Promise<PagedResponse<AlbumResponse>> {
  const response = await callApi(
    instance,
    account,
    buildPagePath("/api/admin/albums/mine", page, pageSize, search),
  );

  return (await response.json()) as PagedResponse<AlbumResponse>;
}

// Shared helper for uploading and replacing files in personal and album endpoints.
async function uploadMultipartFile<T>(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
  method: "POST" | "PUT",
  file: File,
): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  // Do not set Content-Type manually; fetch adds the required multipart boundary.
  const response = await callApi(instance, account, path, {
    method,
    body: formData,
  });

  return (await response.json()) as T;
}

async function downloadResponse(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
  fallbackFileName: string,
): Promise<void> {
  const response = await callApi(instance, account, path);

  const blob = await response.blob();
  const fileName = extractFileNameFromHeaders(response, fallbackFileName);

  triggerBrowserDownload(blob, fileName);
}

// Binary Download Utilities
function extractFileNameFromHeaders(
  response: Response,
  fallback: string,
): string {
  const disposition = response.headers.get("content-disposition");

  if (!disposition) {
    return fallback;
  }

  const match = disposition.match(
    /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i,
  );

  return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Release the temporary URL created for this download.
  window.URL.revokeObjectURL(url);
}
