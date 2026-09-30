import {
  InteractionRequiredAuthError,
  type AccountInfo,
  type IPublicClientApplication,
} from "@azure/msal-browser";

import { apiBaseUrl, apiScope } from "../authConfig";
import { ApiError } from "../types/api";
import type { CurrentUser } from "../types/auth";
import type {
  AlbumResponse,
  CreateAlbumRequest,
  UpdateAlbumRequest,
  AlbumMemberResponse,
  AddAlbumMemberRequest,
  UpdateAlbumMemberRequest,
} from "../types/album";
import type { FileResponse } from "../types/file";

export { ApiError };
export type { CurrentUser };

async function acquireAccessToken(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<string> {
  try {
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
      throw new ApiError(
        "Microsoft sign-in is required again before a WinCapture API access token can be acquired.",
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
      error?: string;
      status?: number;
    };

    return data.message || data.error || `Backend returned HTTP ${response.status}.`;
  } catch {
    return `Backend returned HTTP ${response.status}.`;
  }
}

export async function callApi(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const accessToken = await acquireAccessToken(instance, account);

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

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

// ==========================================
// Authentication API
// ==========================================

export async function getCurrentUser(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<CurrentUser> {
  const response = await callApi(instance, account, "/api/auth/me");
  return (await response.json()) as CurrentUser;
}

// ==========================================
// Albums API
// ==========================================

export async function getAlbums(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<AlbumResponse[]> {
  const response = await callApi(instance, account, "/api/albums");
  return (await response.json()) as AlbumResponse[];
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
  const response = await callApi(instance, account, `/api/albums/${albumId}/members`);
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

// ==========================================
// Album Files API
// ==========================================

export async function getAlbumFiles(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
): Promise<FileResponse[]> {
  const response = await callApi(instance, account, `/api/albums/${albumId}/files`);
  return (await response.json()) as FileResponse[];
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
  const formData = new FormData();
  formData.append("file", file);

  const response = await callApi(
    instance,
    account,
    `/api/albums/${albumId}/files`,
    {
      method: "POST",
      body: formData,
    },
  );
  return (await response.json()) as FileResponse;
}

export async function downloadAlbumFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  fileId: number,
  fallbackFileName: string,
): Promise<void> {
  const response = await callApi(
    instance,
    account,
    `/api/albums/${albumId}/files/${fileId}/download`,
  );
  const blob = await response.blob();
  const fileName = extractFileNameFromHeaders(response, fallbackFileName);
  triggerBrowserDownload(blob, fileName);
}

export async function getFilePreviewUrl(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
  albumId?: number,
): Promise<string> {
  const path = albumId
    ? `/api/albums/${albumId}/files/${fileId}/download`
    : `/api/files/${fileId}/download`;
  const response = await callApi(instance, account, path);
  return URL.createObjectURL(await response.blob());
}

export async function deleteAlbumFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  albumId: number,
  fileId: number,
): Promise<void> {
  await callApi(
    instance,
    account,
    `/api/albums/${albumId}/files/${fileId}`,
    {
      method: "DELETE",
    },
  );
}

// ==========================================
// Personal Files API
// ==========================================

export async function getFiles(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<FileResponse[]> {
  const response = await callApi(instance, account, "/api/files");
  return (await response.json()) as FileResponse[];
}

export async function getFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
): Promise<FileResponse> {
  const response = await callApi(instance, account, `/api/files/${fileId}`);
  return (await response.json()) as FileResponse;
}

export async function uploadFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  file: File,
): Promise<FileResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await callApi(instance, account, "/api/files", {
    method: "POST",
    body: formData,
  });
  return (await response.json()) as FileResponse;
}

export async function replaceFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
  file: File,
): Promise<FileResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await callApi(instance, account, `/api/files/${fileId}`, {
    method: "PUT",
    body: formData,
  });
  return (await response.json()) as FileResponse;
}

export async function downloadFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
  fallbackFileName: string,
): Promise<void> {
  const response = await callApi(
    instance,
    account,
    `/api/files/${fileId}/download`,
  );
  const blob = await response.blob();
  const fileName = extractFileNameFromHeaders(response, fallbackFileName);
  triggerBrowserDownload(blob, fileName);
}

export async function deleteFile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  fileId: number,
): Promise<void> {
  await callApi(instance, account, `/api/files/${fileId}`, {
    method: "DELETE",
  });
}

// ==========================================
// Admin API
// ==========================================

export async function getAdminFiles(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<FileResponse[]> {
  const response = await callApi(instance, account, "/api/admin/files");
  return (await response.json()) as FileResponse[];
}

export async function getAdminAlbums(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<AlbumResponse[]> {
  const response = await callApi(instance, account, "/api/admin/albums");
  return (await response.json()) as AlbumResponse[];
}

// ==========================================
// Binary Download Utilities
// ==========================================

export async function getApiBlob(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
): Promise<Blob> {
  const response = await callApi(instance, account, path);
  return response.blob();
}

function extractFileNameFromHeaders(
  response: Response,
  fallback: string,
): string {
  const disposition = response.headers.get("content-disposition");
  if (!disposition) return fallback;

  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}

export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
